import { NextFunction, Response } from 'express';
import moment from 'moment';
import httpErrors from 'http-errors';
import JWT from 'jsonwebtoken';
import AppUser from '../../../models/accounts/app_user.model';
import AccessGroup from '../../../models/permissions/access_group/access_group.model';
import { AppAgentLoginType, appAgentLoginSchema } from '../../../helpers/joi/agent';
import { objectIdToString, logBackendError, stringToObjectId } from '../../../helpers/common/backend.functions';
import { RequestType } from '../../../helpers/shared/shared.type';
import { GlobalConfig } from '../../../helpers/common/environment';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
const notAuthorized = 'Request not Authorized';
// Import Packages
// const moment = require('moment');
// const httpErrors = require('http-errors');
// const jwtModule = require('../../../middlewares/jwt/jwt.middleware');
// const joiAgent = require('../../../helpers/joi_validation/agent/auth/auth.validation_schema');
// const {
//   appAgentModel,
//   resetPassTokenModel,
// } = require('../../../models/agent/agent.model');
// const {
//   appAgentTimeLogModel,
// } = require('../../../models/agent/agent.time_log.model');
// const appAccessGroupModel = require('../../../models/permissions/access_group/access_group.model');
// const {
//   encryptData,
//   decryptData,
//   stringToObjectId,
//   logBackendError,
//   compactObject,
//   configureMetaData,
//   getFieldsToInclude,
//   maskFields,
//   objectIdToString,
//   convertDateTimeFormat,
// } = require('../../../helpers/common/backend.functions');
// const SIB = require('../../../helpers/service/sendinblue/sendinblue.service');
// const {
//   getAppAgentConnectionDetails,
//   forceLogoutAgent,
// } = require('../../../helpers/service/socket.io/socket.io.service');
// const { appActivityModel } = require('../../../models/logs/logs.model');
// const {
//   appConstantsModel,
// } = require('../../../models/constants/constants.model');

//Controller Methods

const appAgentLogin = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const agentLoginDetails: AppAgentLoginType = await appAgentLoginSchema.validateAsync(req.body);

    // Check if agent exist in Collection
    const getAgent = await AppUser.findOne({
      email: agentLoginDetails.email
    });

    if (!getAgent) throw httpErrors.Forbidden(`Invalid Email or Password. Please try again.`);

    //Check if password matches to the agent details
    // const doesPassMatch = await getAgent.matchPassword(
    //   agentLoginDetails.password
    // );

    // if (!doesPassMatch)
    //   throw httpErrors.Forbidden(
    //     `Invalid Email or Password. Please try again.`
    //   );

    // Check if access group exist in Collection
    const doesAccessGroupExist = await AccessGroup.findOne({
      _id: getAgent.appAccessGroupId
    })
      .select({ accessGroupName: 1, accessGroupDescription: 1 })
      .lean();

    if (!doesAccessGroupExist)
      throw httpErrors.Forbidden(`Access Group Id : ${getAgent.appAccessGroupId} does not Exist.`);

    const jwtToken = await jwtModule
      .signAccessToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch(error => {
        throw httpErrors.InternalServerError(`JWT Access Token error : ${error.message}`);
      });

    const jwtRefreshToken = await jwtModule
      .signRefreshToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch(error => {
        throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
      });

    // Update Last Logged-in Time
    await getAgent.updateOne({
      lastLoggedIn: moment()
    });

    // await new appAgentTimeLogModel({
    //   appAgentId: getAgent._id,
    //   type: 'LOGGED_IN',
    // }).save({});

    const JWT_REFRESH_TOKEN_HEADER = GlobalConfig.JWT_REFRESH_TOKEN_HEADER;

    if (!JWT_REFRESH_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

    if (res.headersSent === false) {
      res
        .cookie(JWT_REFRESH_TOKEN_HEADER, jwtRefreshToken?.toString() || '', {
          secure: process.env.NODE_ENV == 'production',
          signed: true,
          httpOnly: true,
          sameSite: true,
          expires: new Date(moment().endOf('day').seconds())
        })
        .send({
          error: false,
          data: {
            appAgentAccDetails: {
              appAgentId: getAgent._id,
              email: getAgent.email,
              username: getAgent.first_name,
              appAccessGroup: {
                appAccessGroupId: doesAccessGroupExist._id,
                name: doesAccessGroupExist.name,
                description: doesAccessGroupExist.description
                // isAdministrator: doesAccessGroupExist.isAdministrator
              }
            },
            jwtToken: jwtToken
          },
          message: 'Agent Logged in successfully.'
        });
    }
  } catch (error: any) {
    console.log(error.message);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const appAgentLogout = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if Payload contains appAgentId
    if (req?.payload) {
      if (!req?.payload.appAgentId) {
        throw httpErrors.UnprocessableEntity(`JWT Refresh Token error : Missing Payload Data`);
      }
      // const getAgent = await appAgentModel.findOne({
      //   _id: req.payload.appAgentId,
      //   isDeleted: false,
      // });

      // Delete Refresh Token from Redis DB
      await jwtModule
        .removeToken({
          appAgentId: req.payload.appAgentId,
          appAccessGroupId: req.payload.appAccessGroupId,
          requestIP: req.payload.requestIP
        })
        .catch((error: any) => {
          throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
        });

      // await new appAgentTimeLogModel({
      //   appAgentId: getAgent._id,
      //   type: 'LOGGED_OUT',
      // }).save({});

      const JWT_REFRESH_TOKEN_HEADER = GlobalConfig.JWT_REFRESH_TOKEN_HEADER;

      if (!JWT_REFRESH_TOKEN_HEADER)
        throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

      // Delete cookies & send response
      res
        .clearCookie(JWT_REFRESH_TOKEN_HEADER, {
          secure: process.env.NODE_ENV == 'production',
          signed: true,
          httpOnly: true,
          sameSite: true
        })
        .send({
          error: false,
          data: {
            message: 'Agent logged out successfully.'
          }
        });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    next(error);
  }
};
const getAgentByToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    //get token from req.body
    const jwt_access_token: string = req.body.jwt_token;
    const JWT_ACCESS_TOKEN_SECRET = GlobalConfig.JWT_ACCESS_TOKEN_SECRET;
    console.log(jwt_access_token);
    console.log(JWT_ACCESS_TOKEN_SECRET);
    JWT.verify(jwt_access_token, JWT_ACCESS_TOKEN_SECRET, async (error: any, payload: any) => {
      if (error || payload?.payloadData?.requestIP != req.ip) {
        console.log(error);
        throw httpErrors.Unauthorized(notAuthorized);
      }
      const app_agentID = payload?.payloadData?.appAgentId;
      const agentDetails = await AppUser.findOne({
        _id: stringToObjectId(app_agentID),
        isDeleted: false
      });
      res.send({
        error: false,
        data: {
          agentDetails,
          app_agentID
        }
      });
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    next(error);
  }
};

// Export Methods
export { appAgentLogin, appAgentLogout, getAgentByToken };
