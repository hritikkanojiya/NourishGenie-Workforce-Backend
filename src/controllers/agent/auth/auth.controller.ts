import { NextFunction, Response } from 'express';
import moment from 'moment';
import httpErrors from 'http-errors';
// import JWT from 'jsonwebtoken';
import { appUserModel } from '../../../models/agent/agent.model';
import { appAccessGroupModel } from '../../../models/permissions/access_group/access_group.model';
import { appConstantsModel } from '../../../models/constants/constants.model';
import { objectIdToString, logBackendError } from '../../../helpers/common/backend.functions';
import { RequestType } from '../../../helpers/shared/shared.type';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import {
  // AppAgentDetailsType,
  AppUserLoginType,
  AppUserType,
  joiUser
} from '../../../helpers/joi/agent/index';
import { forceLogoutUser, getAppUserConnectionDetails } from '../../../helpers/service/socket.io/socket.io.service';

// Controller Methods
const appUserLogin = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const userLoginDetails: AppUserLoginType = await joiUser.appUserLoginSchema.validateAsync(req.body);

    // Check if agent exist in Collection
    const getUser: AppUserType | null = await appUserModel.findOne({
      email: userLoginDetails.email,
      isDeleted: false
    });

    if (!getUser) throw httpErrors.Forbidden(`Invalid Email or Password. Please try again.`);

    // Check if password matches to the User details
    const doesPassMatch = await getUser.isValidPassword?.(userLoginDetails.password);

    if (!doesPassMatch) throw httpErrors.Forbidden(`Invalid Email or Password. Please try again.`);

    // Check if access group exist in Collection
    const doesAccessGroupExist = await appAccessGroupModel
      .findOne({
        _id: getUser.appAccessGroupId,
        isDeleted: false
      })
      .select({ name: 1, description: 1, isAdministrator: 1 })
      .lean();

    if (!doesAccessGroupExist)
      throw httpErrors.Forbidden(`Access Group Id : ${getUser.appAccessGroupId} does not Exist.`);

    const jwtToken = await jwtModule
      .signAccessToken({
        requestIP: req.ip,
        appUserId: objectIdToString(getUser._id),
        appAccessGroupId: objectIdToString(getUser.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Access Token error : ${error.message}`);
      });

    const jwtRefreshToken = await jwtModule
      .signRefreshToken({
        requestIP: req.ip,
        appUserId: objectIdToString(getUser._id),
        appAccessGroupId: objectIdToString(getUser.appAccessGroupId)
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
            appUserAccDetails: {
              appUserId: getUser._id,
              email: getUser.email,
              username: getUser.first_name && getUser.last_name ? getUser.first_name + ' ' + getUser.last_name : '',
              appAccessGroup: {
                appAccessGroupId: doesAccessGroupExist._id,
                name: doesAccessGroupExist.name,
                description: doesAccessGroupExist.description,
                isAdministrator: doesAccessGroupExist.isAdministrator
              }
            },
            jwtToken: jwtToken
          },
          message: 'User Logged in successfully.'
        });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const appUserRefresh = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if Payload contains appUserId
    if (!req?.payload?.appUserId) {
      throw httpErrors.UnprocessableEntity(`JWT Refresh Token error : Missing Payload Data`);
    }
    // Check if User exist in Collection
    const getUser = await appUserModel.findOne({
      _id: req.payload.appUserId,
      isDeleted: false
    });
    if (!getUser) throw httpErrors.UnprocessableEntity(`Unable to process User's Data.`);

    // Check if access group exist in Collection
    const doesAccessGroupExist = await appAccessGroupModel
      .findOne({
        _id: getUser.appAccessGroupId,
        isDeleted: false
      })
      .select({ name: 1, description: 1, isAdministrator: 1 })
      .lean();

    if (!doesAccessGroupExist)
      throw httpErrors.Forbidden(`Access Group Id : ${getUser.appAccessGroupId} does not Exist.`);

    // Sign new Access Token
    const newJwtToken = await jwtModule
      .signAccessToken({
        requestIP: req.ip,
        appUserId: objectIdToString(getUser._id),
        appAccessGroupId: objectIdToString(getUser.appAccessGroupId)
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Access Token error : ${error.message}`);
      });

    // Sign new Refresh Token
    const newJwtRefreshToken = await jwtModule
      .signRefreshToken({
        requestIP: req.ip,
        appUserId: objectIdToString(getUser._id),
        appAccessGroupId: objectIdToString(getUser.appAccessGroupId)
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
          appUserAccDetails: {
            appUserId: getUser._id,
            email: getUser.email,
            username: getUser.first_name && getUser.last_name ? getUser.first_name + ' ' + getUser.last_name : '',
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

const appUserLogout = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if Payload contains appUserId
    if (!req?.payload?.appUserId) {
      throw httpErrors.UnprocessableEntity(`JWT Refresh Token error : Missing Payload Data`);
    }
    // const getUser: IUser | null = await appUserModel.findOne({
    //   _id: req.payload.appUserId,
    //   isDeleted: false,
    // });

    // Delete Refresh Token from Redis DB
    await jwtModule
      .removeToken({
        appUserId: req.payload.appUserId,
        requestIP: '',
        appAccessGroupId: ''
      })
      .catch((error: any) => {
        throw httpErrors.InternalServerError(`JWT Refresh Token error : ${error.message}`);
      });

    // await new appUserTimeLogModel({
    //   appUserId: getUser._id,
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
          message: 'User logged out successfully.'
        }
      });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    next(error);
  }
};

const appUserForceLogout = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appUserDetails = await joiUser.forceLogoutAppUsersSchema.validateAsync(req.body);

    await Promise.all(
      appUserDetails.appUserIds.map(async (appUserId: string) => {
        const UserConnectionDetails = await getAppUserConnectionDetails(appUserId);
        forceLogoutUser(UserConnectionDetails);
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

// const appUserResetPasswordToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const appUserDetails: IResetPassToken = await joiUser.resetPassTokenSchema.validateAsync(req.body);

//         // Check if User exist in Collection
//         const getUser: IUser | null = await appUserModel.findOne({
//             email: appUserDetails.email,
//             isDeleted: false
//         });

//         if (!getUser) throw httpErrors.Forbidden(`Invalid User details.`);

//         // Construct Data
//         const token = new resetPassTokenModel({
//             appUserId: getUser._id,
//             isDeleted: appUserDetails.isDeleted === true ? true : false
//         });

//         // Update all token as Overridden
//         await resetPassTokenModel.updateMany(
//             {
//                 appUserId: getUser._id
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
//         const resetPassUrl = `${process.env.APP_FRONTEND}/User/auth/update-password/${encryptedTokenId.data}/${encryptedTokenId.initialVector}`;
//         const activeMailService = process.env.ACTIVE_MAIL_SERVICE || 'send-in-blue';
//         const mailInfo: { messageId?: string; serviceName?: string } = {};

//         switch (activeMailService) {
//             case 'send-in-blue':
//                 await forgotPasswordMail(resetPassUrl, getUser.email ?? '', getUser.username ?? '')
//                     .catch((error: any) => {
//                         throw httpErrors.InternalServerError(`Oops!!! Server failed to send mail : ${error.message}`);
//                     })
//                     .then((response: any) => {
//                         mailInfo.messageId = response.messageId;
//                         mailInfo.serviceName = 'send-in-blue';
//                     });
//                 break;

//             default:
//                 await forgotPasswordMail(resetPassUrl, getUser.email ?? '', getUser.username ?? '')
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
//                     message: `Reset token sent to Email : ${getUser.email}`,
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

// const appUserVerifyPassToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const tokenDetails: IVerifyResetPassToken = await joiUser.verifyResetPassTokenSchema.validateAsync(req.body);

//         const token_details: IVerifyAccesToken = await __validateResetPassToken(tokenDetails);
//         if (token_details.error) {
//             throw token_details.errorObj;
//         }

//         // Check if User exist in Collection
//         const getUser = await appUserModel.findOne({
//             _id: token_details?.data?.appUserId,
//             isDeleted: false
//         });

//         if (!getUser) throw httpErrors.Forbidden(`Invalid User details.`);

//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     appUserAccDetails: {
//                         appUserId: getUser._id,
//                         username: getUser.username,
//                         email: getUser.email
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

// const appUserUpdatePassword = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const passwordDetails = await joiUser.updatePassSchema.validateAsync(req.body);

//         const token_details = await __validateResetPassToken(passwordDetails);
//         if (token_details.error) {
//             throw token_details.errorObj;
//         }

//         // Check if User exist in Collection
//         const getUser: IUser | null = await appUserModel.findOne({
//             _id: token_details?.data?.appUserId,
//             isDeleted: false
//         });

//         if (!getUser) throw httpErrors.Forbidden(`Invalid User details.`);

//         // Update all token as Overridden
//         await resetPassTokenModel.updateMany(
//             {
//                 appUserId: getUser._id
//             },
//             {
//                 isOverridden: true
//             }
//         );

//         const appUserUpdatePassword = await appUserModel.updateOne(
//             {
//                 _id: getUser._id,
//                 isDeleted: false
//             },
//             {
//                 password: passwordDetails.password
//             }
//         );

//         if (!appUserUpdatePassword)
//             throw httpErrors.Forbidden(`Error updating account credentials. Please try again later`);

//         // Delete Refresh Token from Redis DB
//         await jwtModule
//             .removeToken({
//                 appUserId: objectIdToString(getUser._id)
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
//                     appUserAccDetails: { appUserId: getUser._id },
//                     message: 'Password updated successfully'
//                 }
//             });
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const getAppUsers = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const querySchema: IGetUserSchema = await joiUser.getAppUsersSchema.validateAsync(req.body);

//         compactObject(querySchema);

//         const metaData: IMetaData = await configureMetaData(querySchema);

//         const fieldsToInclude = getFieldsToInclude(metaData.fields);

//         const query: IUserQuery = { isDeleted: false };

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
//         const appUsers: IUser[] = await appUserModel
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

//         const totalRecords = await appUserModel.find(query).countDocuments();

//         await Promise.all(
//             appUsers.map(async appUser => {
//                 // Check if access group exist in Collection
//                 const doesAccessGroupExist = await appAccessGroupModel
//                     .findOne({
//                         _id: appUser.appAccessGroupId,
//                         isDeleted: false
//                     })
//                     .select({ name: 1, description: 1, isAdministrator: 1 })
//                     .lean();

//                 if (!doesAccessGroupExist)
//                     throw httpErrors.Forbidden(`Access Group Id : ${appUser.appAccessGroupId} does not Exist.`);

//                 appUser.appUserId = appUser._id;
//                 appUser.appAccessGroup = {
//                     appAccessGroupId: doesAccessGroupExist._id,
//                     name: doesAccessGroupExist.name,
//                     description: doesAccessGroupExist.description,
//                     isAdministrator: doesAccessGroupExist.isAdministrator
//                 };
//                 appUser.lastLoggedIn = moment(appUser?.lastLoggedIn).fromNow();
//                 delete appUser.appAccessGroupId;
//                 delete appUser._id;
//                 delete appUser?.password;
//                 delete appUser?.__v;
//                 delete appUser?.isNonDeleteAble;
//                 delete appUser?.isDeleted;
//                 return appUser;
//             })
//         );

//         convertDateTimeFormat(appUsers);

//         // await maskFields(req.payload.appAccessGroupId, appUsers, ['email']);

//         // Send Response
//         if (res.headersSent === false) {
//             res.status(200).send({
//                 error: false,
//                 data: {
//                     appUsers: appUsers,
//                     metaData: {
//                         sortBy: metaData.sortBy,
//                         sortOn: metaData.sortOn,
//                         limit: metaData.limit,
//                         offset: metaData.offset,
//                         total_records: totalRecords
//                     },
//                     message: 'Users fetched successfully'
//                 }
//             });
//         }
//     } catch (error: any) {
//         logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
//         if (error?.isJoi === true) error.status = 422;
//         next(error);
//     }
// };

// const getAppUserDetails = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         // Validate Joi Schema
//         const getUserDetailSchema = await joiUser.getAppUserDetailSchema.validateAsync(req.body);

//         // Check if User exist in Collection
//         const appUser = await appUserModel
//             .findOne({
//                 _id: (getUserDetailSchema.appUserId),
//                 isDeleted: false
//             })
//             .select({
//                 password: 0,
//                 isDeleted: 0,
//                 __v: 0
//             })
//             .lean();

//         if (!appUser) throw httpErrors.Forbidden(`Invalid User ID [${getUserDetailSchema.appUserId}]`);

//         // Check if access group exist in Collection
//         const doesAccessGroupExist = await appAccessGroupModel
//             .findOne({
//                 _id: appUser.appAccessGroupId,
//                 isDeleted: false
//             })
//             .select({ name: 1, description: 1, isAdministrator: 1 })
//             .lean();

//         if (!doesAccessGroupExist)
//             throw httpErrors.Forbidden(`Access Group Id : ${appUser.appAccessGroupId} does not Exist.`);

//         const appUserRecentActivities = await appActivityModel
//             .find({
//                 appUserId: appUser._id,
//                 isDeleted: false
//             })
//             .select({
//                 appUserId: 0,
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
//             appUserRecentActivities.map(appUserRecentActivity => {
//                 appUserRecentActivity.appActivityId = appUserRecentActivity._id;
//                 delete appUserRecentActivity._id;
//             })
//         );

//         appUser.appUserId = appUser._id;
//         appUser.appAccessGroup = {
//             appAccessGroupId: doesAccessGroupExist._id,
//             name: doesAccessGroupExist.name,
//             description: doesAccessGroupExist.description,
//             isAdministrator: doesAccessGroupExist.isAdministrator
//         };

//         appUser.socketDetails = await getAppUserConnectionDetails(objectIdToString(appUser._id));

//         appUser.recentActivities = appUserRecentActivities;

//         convertDateTimeFormat(appUser);

//         appUser.lastLoggedIn = moment(appUser.lastLoggedIn).fromNow();

//         delete appUser._id;
//         delete appUser.appAccessGroupId;

//         // await maskFields(req.payload.appAccessGroupId, appUser, ['email']);

//         if (res.headersSent === false) {
//             res.send({
//                 error: false,
//                 data: {
//                     appUserAccDetails: appUser
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
//         const querySchema: IAppActivity = await joiUser.getAppActivitiesSchema.validateAsync(req.body);

//         compactObject(querySchema);

//         const metaData: IMetaData = await configureMetaData(querySchema);

//         const fieldsToInclude = getFieldsToInclude(metaData.fields);

//         const query: IAppActivityQuerySchema = { isDeleted: false };

//         if (querySchema.appActivityId) query._id = querySchema.appActivityId;
//         if (querySchema.appUserId) query.appUserId = querySchema.appUserId;

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
const getUserByToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    const getUser = await appUserModel.findOne({ _id: req?.payload?.appUserId });
    res.status(200).json({
      User: {
        appUserId: getUser?._id,
        email: getUser?.email,
        username: getUser?.first_name && getUser?.last_name ? getUser?.first_name + ' ' + getUser?.last_name : ''
      }
    });
  } catch (error: any) {
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    next(error);
  }
};

// Export Methods
export {
  appUserLogin,
  appUserRefresh,
  appUserLogout,
  getUserByToken,
  appUserForceLogout
};
