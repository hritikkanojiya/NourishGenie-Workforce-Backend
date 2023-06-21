import { NextFunction, Response } from 'express';
import moment from 'moment';
import httpErrors from 'http-errors';
// import JWT from 'jsonwebtoken';
import appAgentModel from '../../../models/agent/agent.model';
import appAccessGroupModel from '../../../models/permissions/access_group/access_group.model';
import { appConstantsModel } from '../../../models/constants/constants.model';
import { objectIdToString, logBackendError } from '../../../helpers/common/backend.functions';
import { RequestType } from '../../../helpers/shared/shared.type';
// import { GlobalConfig } from '../../../helpers/common/environment';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import {
  joiAgent,
  // AppAgentDetailsType,
  AppAgentLoginType,
  AppAgentType
} from '../../../helpers/joi/agent/index';
import { forceLogoutAgent, getAppAgentConnectionDetails } from '../../../helpers/service/socket.io/socket.io.service';

// Controller Methods
const appAgentLogin = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const agentLoginDetails: AppAgentLoginType = await joiAgent.appAgentLoginSchema.validateAsync(req.body);

    // Check if agent exist in Collection
    const getAgent: AppAgentType | null = await appAgentModel.findOne({
      email: agentLoginDetails.email,
      isDeleted: false
    });

    if (!getAgent) throw httpErrors.Forbidden(`Invalid Email or Password. Please try again.`);

    // Check if password matches to the agent details
    const doesPassMatch = await getAgent.isValidPassword?.(agentLoginDetails.password);

    if (!doesPassMatch) throw httpErrors.Forbidden(`Invalid Email or Password. Please try again.`);

    // Check if access group exist in Collection
    const doesAccessGroupExist = await appAccessGroupModel
      .findOne({
        _id: getAgent.appAccessGroupId,
        isDeleted: false
      })
      .select({ name: 1, description: 1, isAdministrator: 1 })
      .lean();

    if (!doesAccessGroupExist)
      throw httpErrors.Forbidden(`Access Group Id : ${getAgent.appAccessGroupId} does not Exist.`);

    const jwtToken = await jwtModule
      .signAccessToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Access Token error : ${error.message}`);
      });

    const jwtRefreshToken = await jwtModule
      .signRefreshToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
      });

    const JWT_REFRESH_TOKEN_HEADER = await appConstantsModel
      .findOne({
        name: 'JWT_REFRESH_TOKEN_HEADER',
        isDeleted: false
      })
      .select('value');

    if (!JWT_REFRESH_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

    if (res.headersSent === false) {
      res
        .cookie(JWT_REFRESH_TOKEN_HEADER.value, jwtRefreshToken, {
          secure: process.env.NODE_ENV == 'production',
          signed: true,
          httpOnly: true,
          sameSite: true,
          expires: new Date(moment().endOf('day').toDate())
        })
        .send({
          error: false,
          data: {
            appAgentAccDetails: {
              appAgentId: getAgent._id,
              email: getAgent.email,
              username: getAgent.first_name && getAgent.last_name ? getAgent.first_name + ' ' + getAgent.last_name : '',
              appAccessGroup: {
                appAccessGroupId: doesAccessGroupExist._id,
                name: doesAccessGroupExist.name,
                description: doesAccessGroupExist.description,
                isAdministrator: doesAccessGroupExist.isAdministrator
              }
            },
            jwtToken: jwtToken
          },
          message: 'Agent Logged in successfully.'
        });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const appAgentRefresh = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if Payload contains appAgentId
    if (!req?.payload?.appAgentId) {
      throw httpErrors.UnprocessableEntity(`JWT Refresh Token error : Missing Payload Data`);
    }
    // Check if agent exist in Collection
    const getAgent = await appAgentModel.findOne({
      _id: req.payload.appAgentId,
      isDeleted: false
    });
    if (!getAgent) throw httpErrors.UnprocessableEntity(`Unable to process Agent's Data.`);

    // Check if access group exist in Collection
    const doesAccessGroupExist = await appAccessGroupModel
      .findOne({
        _id: getAgent.appAccessGroupId,
        isDeleted: false
      })
      .select({ name: 1, description: 1, isAdministrator: 1 })
      .lean();

    if (!doesAccessGroupExist)
      throw httpErrors.Forbidden(`Access Group Id : ${getAgent.appAccessGroupId} does not Exist.`);

    // Sign new Access Token
    const newJwtToken = await jwtModule
      .signAccessToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Access Token error : ${error.message}`);
      });

    // Sign new Refresh Token
    const newJwtRefreshToken = await jwtModule
      .signRefreshToken({
        requestIP: req.ip,
        appAgentId: objectIdToString(getAgent._id),
        appAccessGroupId: objectIdToString(getAgent.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
      });

    const JWT_REFRESH_TOKEN_HEADER = await appConstantsModel
      .findOne({
        name: 'JWT_REFRESH_TOKEN_HEADER',
        isDeleted: false
      })
      .select('value');

    if (!JWT_REFRESH_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);
    // Attach cookies & send response
    res
      .cookie(JWT_REFRESH_TOKEN_HEADER.value, newJwtRefreshToken, {
        secure: process.env.NODE_ENV == 'production',
        signed: true,
        httpOnly: true,
        sameSite: true,
        expires: new Date(moment().endOf('day').toString())
      })
      .send({
        error: false,
        data: {
          appAgentAccDetails: {
            appAgentId: getAgent._id,
            email: getAgent.email,
            username: getAgent.first_name && getAgent.last_name ? getAgent.first_name + ' ' + getAgent.last_name : '',
            appAccessGroup: {
              appAccessGroupId: doesAccessGroupExist._id,
              name: doesAccessGroupExist.name,
              description: doesAccessGroupExist.description,
              isAdministrator: doesAccessGroupExist.isAdministrator
            }
          },
          jwtToken: newJwtToken
        },
        message: 'Token refreshed successfully.'
      });
  } catch (error: any) {
    console.log(error.message);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    next(error);
  }
};

const appAgentLogout = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if Payload contains appAgentId
    if (!req?.payload?.appAgentId) {
      throw httpErrors.UnprocessableEntity(`JWT Refresh Token error : Missing Payload Data`);
    }
    // const getAgent: IAgent | null = await appAgentModel.findOne({
    //   _id: req.payload.appAgentId,
    //   isDeleted: false,
    // });

    // Delete Refresh Token from Redis DB
    await jwtModule
      .removeToken({
        appAgentId: req.payload.appAgentId,
        requestIP: '',
        appAccessGroupId: ''
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
      });

    // await new appAgentTimeLogModel({
    //   appAgentId: getAgent._id,
    //   type: 'LOGGED_OUT',
    // }).save({});

    const JWT_REFRESH_TOKEN_HEADER = await appConstantsModel
      .findOne({
        name: 'JWT_REFRESH_TOKEN_HEADER',
        isDeleted: false
      })
      .select('value');

    if (!JWT_REFRESH_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

    // Delete cookies & send response
    res
      .clearCookie(JWT_REFRESH_TOKEN_HEADER.value, {
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
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    next(error);
  }
};

const appAgentForceLogout = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appAgentDetails = await joiAgent.forceLogoutAppAgentsSchema.validateAsync(req.body);

    await Promise.all(
      appAgentDetails.appAgentIds.map(async (appAgentId: string) => {
        const agentConnectionDetails = await getAppAgentConnectionDetails(appAgentId);
        forceLogoutAgent(agentConnectionDetails);
      })
    );

    // Send Response
    res.send({
      error: false,
      data: {
        message: 'Logout request sent successfully.'
      }
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    next(error);
  }
};

// const appAgentResetPasswordToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const appAgentDetails: IResetPassToken = await joiAgent.resetPassTokenSchema.validateAsync(req.body);

//         // Check if agent exist in Collection
//         const getAgent: IAgent | null = await appAgentModel.findOne({
//             email: appAgentDetails.email,
//             isDeleted: false
//         });

//         if (!getAgent) throw httpErrors.Forbidden(`Invalid Agent details.`);

//         // Construct Data
//         const token = new resetPassTokenModel({
//             appAgentId: getAgent._id,
//             isDeleted: appAgentDetails.isDeleted === true ? true : false
//         });

//         // Update all token as Overridden
//         await resetPassTokenModel.updateMany(
//             {
//                 appAgentId: getAgent._id
//             },
//             {
//                 isOverridden: true
//             }
//         );

//         // Save Record in Collection
//         const storeToken = await token.save({}).catch(error => {
//             throw httpErrors.InternalServerError(error.message);
//         });

//         const encryptedTokenId = encryptData(storeToken._id.toString());
//         const resetPassUrl = `${process.env.APP_FRONTEND}/agent/auth/update-password/${encryptedTokenId.data}/${encryptedTokenId.initialVector}`;
//         const activeMailService = process.env.ACTIVE_MAIL_SERVICE || 'send-in-blue';
//         const mailInfo: { messageId?: string; serviceName?: string } = {};

//         switch (activeMailService) {
//             case 'send-in-blue':
//                 await forgotPasswordMail(resetPassUrl, getAgent.email ?? '', getAgent.username ?? '')
//                     .catch((error: any) => {
//                         throw httpErrors.InternalServerError(`Oops!!! Server failed to send mail : ${error.message}`);
//                     })
//                     .then((response: any) => {
//                         mailInfo.messageId = response.messageId;
//                         mailInfo.serviceName = 'send-in-blue';
//                     });
//                 break;

//             default:
//                 await forgotPasswordMail(resetPassUrl, getAgent.email ?? '', getAgent.username ?? '')
//                     .catch((error: any) => {
//                         throw httpErrors.InternalServerError(`Oops!!! Server failed to send mail : ${error.message}`);
//                     })
//                     .then((response: any) => {
//                         mailInfo.messageId = response.messageId;
//                         mailInfo.serviceName = 'send-in-blue';
//                     });
//                 break;
//         }

//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     message: `Reset token sent to Email : ${getAgent.email}`,
//                     mailInfo
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const appAgentVerifyPassToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const tokenDetails: IVerifyResetPassToken = await joiAgent.verifyResetPassTokenSchema.validateAsync(req.body);

//         const token_details: IVerifyAccesToken = await __validateResetPassToken(tokenDetails);
//         if (token_details.error) {
//             throw token_details.errorObj;
//         }

//         // Check if agent exist in Collection
//         const getAgent = await appAgentModel.findOne({
//             _id: token_details?.data?.appAgentId,
//             isDeleted: false
//         });

//         if (!getAgent) throw httpErrors.Forbidden(`Invalid Agent details.`);

//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     appAgentAccDetails: {
//                         appAgentId: getAgent._id,
//                         username: getAgent.username,
//                         email: getAgent.email
//                     },
//                     message: 'Token verified successfully'
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const appAgentUpdatePassword = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const passwordDetails = await joiAgent.updatePassSchema.validateAsync(req.body);

//         const token_details = await __validateResetPassToken(passwordDetails);
//         if (token_details.error) {
//             throw token_details.errorObj;
//         }

//         // Check if agent exist in Collection
//         const getAgent: IAgent | null = await appAgentModel.findOne({
//             _id: token_details?.data?.appAgentId,
//             isDeleted: false
//         });

//         if (!getAgent) throw httpErrors.Forbidden(`Invalid Agent details.`);

//         // Update all token as Overridden
//         await resetPassTokenModel.updateMany(
//             {
//                 appAgentId: getAgent._id
//             },
//             {
//                 isOverridden: true
//             }
//         );

//         const appAgentUpdatePassword = await appAgentModel.updateOne(
//             {
//                 _id: getAgent._id,
//                 isDeleted: false
//             },
//             {
//                 password: passwordDetails.password
//             }
//         );

//         if (!appAgentUpdatePassword)
//             throw httpErrors.Forbidden(`Error updating account credentials. Please try again later`);

//         // Delete Refresh Token from Redis DB
//         await jwtModule
//             .removeToken({
//                 appAgentId: objectIdToString(getAgent._id)
//             })
//             .catch((error: any) => {
//                 throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
//             });

//         const JWT_REFRESH_TOKEN_HEADER = await appConstantsModel
//             .findOne({
//                 name: 'JWT_REFRESH_TOKEN_HEADER',
//                 isDeleted: false
//             })
//             .select('value');

//         if (!JWT_REFRESH_TOKEN_HEADER)
//             throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

//         // Clear Cookies and send response
//         res
//             .clearCookie(JWT_REFRESH_TOKEN_HEADER.value, {
//                 secure: true,
//                 httpOnly: true,
//                 sameSite: true
//             })
//             .send({
//                 error: false,
//                 data: {
//                     appAgentAccDetails: { appAgentId: getAgent._id },
//                     message: 'Password updated successfully'
//                 }
//             });
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const getAppAgents = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const querySchema: IGetAgentSchema = await joiAgent.getAppAgentsSchema.validateAsync(req.body);

//         compactObject(querySchema);

//         const metaData: IMetaData = await configureMetaData(querySchema);

//         const fieldsToInclude = getFieldsToInclude(metaData.fields);

//         const query: IAgentQuery = { isDeleted: false };

//         if (querySchema.appAccessGroupId) query.appAccessGroupId = querySchema.appAccessGroupId;

//         if (querySchema.search) {
//             query.$or = [
//                 {
//                     username: {
//                         $regex: querySchema.search,
//                         $options: 'is'
//                     }
//                 },
//                 {
//                     email: {
//                         $regex: querySchema.search,
//                         $options: 'is'
//                     }
//                 }
//             ];
//         }

//         // Execute the Query
//         const appAgents: IAgent[] = await appAgentModel
//             .find(query, {}, {})
//             .select(fieldsToInclude)
//             .sort({ [metaData.sortOn]: metaData.sortBy })
//             .skip(metaData.offset)
//             .limit(metaData.limit)
//             .lean()
//             .catch(error => {
//                 throw httpErrors.UnprocessableEntity(
//                     error?.message ? error.message : 'Unable to retrieve records from Database.'
//                 );
//             });

//         const totalRecords = await appAgentModel.find(query).countDocuments();

//         await Promise.all(
//             appAgents.map(async appAgent => {
//                 // Check if access group exist in Collection
//                 const doesAccessGroupExist = await appAccessGroupModel
//                     .findOne({
//                         _id: appAgent.appAccessGroupId,
//                         isDeleted: false
//                     })
//                     .select({ name: 1, description: 1, isAdministrator: 1 })
//                     .lean();

//                 if (!doesAccessGroupExist)
//                     throw httpErrors.Forbidden(`Access Group Id : ${appAgent.appAccessGroupId} does not Exist.`);

//                 appAgent.appAgentId = appAgent._id;
//                 appAgent.appAccessGroup = {
//                     appAccessGroupId: doesAccessGroupExist._id,
//                     name: doesAccessGroupExist.name,
//                     description: doesAccessGroupExist.description,
//                     isAdministrator: doesAccessGroupExist.isAdministrator
//                 };
//                 appAgent.lastLoggedIn = moment(appAgent?.lastLoggedIn).fromNow();
//                 delete appAgent.appAccessGroupId;
//                 delete appAgent._id;
//                 delete appAgent?.password;
//                 delete appAgent?.__v;
//                 delete appAgent?.isNonDeleteAble;
//                 delete appAgent?.isDeleted;
//                 return appAgent;
//             })
//         );

//         convertDateTimeFormat(appAgents);

//         // await maskFields(req.payload.appAccessGroupId, appAgents, ['email']);

//         // Send Response
//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     appAgents: appAgents,
//                     metaData: {
//                         sortBy: metaData.sortBy,
//                         sortOn: metaData.sortOn,
//                         limit: metaData.limit,
//                         offset: metaData.offset,
//                         total_records: totalRecords
//                     },
//                     message: 'Agents fetched successfully'
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const getAppAgentDetails = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const getAgentDetailSchema = await joiAgent.getAppAgentDetailSchema.validateAsync(req.body);

//         // Check if agent exist in Collection
//         const appAgent = await appAgentModel
//             .findOne({
//                 _id: (getAgentDetailSchema.appAgentId),
//                 isDeleted: false
//             })
//             .select({
//                 password: 0,
//                 isDeleted: 0,
//                 __v: 0
//             })
//             .lean();

//         if (!appAgent) throw httpErrors.Forbidden(`Invalid Agent ID [${getAgentDetailSchema.appAgentId}]`);

//         // Check if access group exist in Collection
//         const doesAccessGroupExist = await appAccessGroupModel
//             .findOne({
//                 _id: appAgent.appAccessGroupId,
//                 isDeleted: false
//             })
//             .select({ name: 1, description: 1, isAdministrator: 1 })
//             .lean();

//         if (!doesAccessGroupExist)
//             throw httpErrors.Forbidden(`Access Group Id : ${appAgent.appAccessGroupId} does not Exist.`);

//         const appAgentRecentActivities = await appActivityModel
//             .find({
//                 appAgentId: appAgent._id,
//                 isDeleted: false
//             })
//             .select({
//                 appAgentId: 0,
//                 'activityDetails.request.headers': 0,
//                 'activityDetails.request._id': 0,
//                 'activityDetails.response.headers': 0,
//                 'activityDetails.response._id': 0,
//                 'activityDetails._id': 0,
//                 isDeleted: 0,
//                 __v: 0
//             })
//             .sort({
//                 _id: 'desc'
//             })
//             .limit(5)
//             .lean();

//         await Promise.all(
//             appAgentRecentActivities.map(appAgentRecentActivity => {
//                 appAgentRecentActivity.appActivityId = appAgentRecentActivity._id;
//                 delete appAgentRecentActivity._id;
//             })
//         );

//         appAgent.appAgentId = appAgent._id;
//         appAgent.appAccessGroup = {
//             appAccessGroupId: doesAccessGroupExist._id,
//             name: doesAccessGroupExist.name,
//             description: doesAccessGroupExist.description,
//             isAdministrator: doesAccessGroupExist.isAdministrator
//         };

//         appAgent.socketDetails = await getAppAgentConnectionDetails(objectIdToString(appAgent._id));

//         appAgent.recentActivities = appAgentRecentActivities;

//         convertDateTimeFormat(appAgent);

//         appAgent.lastLoggedIn = moment(appAgent.lastLoggedIn).fromNow();

//         delete appAgent._id;
//         delete appAgent.appAccessGroupId;

//         // await maskFields(req.payload.appAccessGroupId, appAgent, ['email']);

//         if (res.headersSent === false) {
//             res.send({
//                 error: false,
//                 data: {
//                     appAgentAccDetails: appAgent
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const getAppActivities = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const querySchema: IAppActivity = await joiAgent.getAppActivitiesSchema.validateAsync(req.body);

//         compactObject(querySchema);

//         const metaData: IMetaData = await configureMetaData(querySchema);

//         const fieldsToInclude = getFieldsToInclude(metaData.fields);

//         const query: IAppActivityQuerySchema = { isDeleted: false };

//         if (querySchema.appActivityId) query._id = querySchema.appActivityId;
//         if (querySchema.appAgentId) query.appAgentId = querySchema.appAgentId;

//         if (querySchema.search) {
//             query.$or = [
//                 {
//                     url: {
//                         $regex: querySchema.search,
//                         $options: 'is'
//                     }
//                 }
//             ];
//         }

//         // Execute the Query
//         const appActivities = await appActivityModel
//             .find(query, {}, {})
//             .select(fieldsToInclude)
//             .sort({ [metaData.sortOn]: metaData.sortBy })
//             .skip(metaData.offset)
//             .limit(metaData.limit)
//             .lean()
//             .catch((error: any) => {
//                 throw httpErrors.UnprocessableEntity(
//                     error?.message ? error.message : 'Unable to retrieve records from Database.'
//                 );
//             });

//         await Promise.all(
//             appActivities.map((appActivity: any) => {
//                 appActivity.appActivityId = appActivity._id;
//                 delete appActivity?._id;
//                 delete appActivity?.activityDetails?.request?.headers;
//                 delete appActivity?.activityDetails?.request?._id;
//                 delete appActivity?.activityDetails?.response?.headers;
//                 delete appActivity?.activityDetails?.response?._id;
//                 delete appActivity?.activityDetails?._id;
//                 delete appActivity?.isDeleted;
//                 delete appActivity?.__v;
//                 return appActivity;
//             })
//         );

//         const totalRecords = await appActivityModel.find(query).countDocuments();

//         convertDateTimeFormat(appActivities);

//         // Send Response
//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     appActivities: appActivities,
//                     metaData: {
//                         sortBy: metaData.sortBy,
//                         sortOn: metaData.sortOn,
//                         limit: metaData.limit,
//                         offset: metaData.offset,
//                         total_records: totalRecords
//                     },
//                     message: 'App activities fetched successfully.'
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// Private Methods
// const __validateResetPassToken = async (tokenDetails: any): Promise<IVerifyAccesToken> => {
//     try {
//         const decryptedTokenId: IDecryptedData = decryptData(tokenDetails?.token, tokenDetails?.secret);

//         // Check if token exist in Collection
//         const getTokenDetails: IGetToken | null = await resetPassTokenModel.findOne({
//             _id: (decryptedTokenId.data),
//             isOverridden: false,
//             isDeleted: false
//         });

//         if (!getTokenDetails)
//             throw httpErrors.UnprocessableEntity(`Token is either invalid or expired. Please generate a new token.`);

//         const tokenExpiredTime = moment(getTokenDetails.createdAt ?? '').add(getTokenDetails.expiresInMinutes, 'minutes');

//         const isTokenValid = moment() < tokenExpiredTime;

//         if (!isTokenValid)
//             throw httpErrors.UnprocessableEntity(`Token is either invalid or expired. Please generate a new token.`);

//         return {
//             error: false,
//             data: getTokenDetails
//         };
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, null, null, null, error?.stack);
//         return {
//             error: true,
//             errorObj: error
//         };
//     }
// };

// Export Methods
export {
  appAgentLogin,
  appAgentRefresh,
  appAgentLogout,
  appAgentForceLogout
  // appAgentResetPasswordToken,
  // appAgentUpdatePassword,
  // appAgentVerifyPassToken,
  // getAppAgents,
  // getAppAgentDetails,
  // getAppActivities
};
