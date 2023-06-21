import JWT from 'jsonwebtoken';
import moment from 'moment';
import httpErrors from 'http-errors';
import { NextFunction, Response } from 'express';
import { appConstantsModel } from '../../models/constants/constants.model';
import { RequestType } from '../../helpers/shared/shared.type';
import { redisClient } from '../../helpers/common/init_redis';
import { logBackendError, getTokenExpTime, objectIdToString } from '../../helpers/common/backend.functions';
const notAuthorized = 'Request not Authorized';

type PayloadDataType = {
  requestIP: string;
  appAgentId: string;
  appAccessGroupId: string;
};

const signAccessToken = (payloadData: PayloadDataType): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    (async (): Promise<void> => {
      try {
        const jwtPayload = { payloadData };
        const JWT_ACCESS_TOKEN_SECRET = await appConstantsModel
          .findOne({
            name: 'JWT_ACCESS_TOKEN_SECRET',
            isDeleted: false
          })
          .select('value');

        if (!JWT_ACCESS_TOKEN_SECRET)
          throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_SECRET]`);
        const JWT_ISSUER = await appConstantsModel
          .findOne({
            name: 'JWT_ISSUER',
            isDeleted: false
          })
          .select('value');

        if (!JWT_ISSUER) throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ISSUER]`);

        const jwtSecretKey = JWT_ACCESS_TOKEN_SECRET.value;
        const jwtConfigOptions = {
          expiresIn: `${await getTokenExpTime()}m`,
          issuer: JWT_ISSUER.value
        };

        JWT.sign(jwtPayload, jwtSecretKey, jwtConfigOptions, (error, jwtToken) => {
          return error ? reject(error) : resolve(jwtToken);
        });
      } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, null, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        return reject(error);
      }
    })();
  });
};

const signRefreshToken = (payloadData: PayloadDataType): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    (async (): Promise<void> => {
      try {
        const jwtPayload = { payloadData };
        const JWT_REFRESH_TOKEN_SECRET = await appConstantsModel
          .findOne({
            name: 'JWT_REFRESH_TOKEN_SECRET',
            isDeleted: false
          })
          .select('value');

        if (!JWT_REFRESH_TOKEN_SECRET)
          throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_SECRET]`);
        const JWT_ISSUER = await appConstantsModel
          .findOne({
            name: 'JWT_ISSUER',
            isDeleted: false
          })
          .select('value');

        if (!JWT_ISSUER) throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ISSUER]`);
        const jwtSecretKey = JWT_REFRESH_TOKEN_SECRET.value;
        const jwtConfigOptions = {
          expiresIn: parseInt(moment.duration(moment().endOf('day').diff(moment())).asSeconds().toString()),
          issuer: JWT_ISSUER.value
        };
        JWT.sign(jwtPayload, jwtSecretKey, jwtConfigOptions, async (error, jwtRefreshToken) => {
          if (error) {
            return reject(error);
          }
          await redisClient
            .SET(payloadData.appAgentId, jwtRefreshToken ?? '', {
              EX: parseInt(moment.duration(moment().endOf('day').diff(moment())).asSeconds().toString())
            })
            .then(() => {
              resolve(jwtRefreshToken);
            })
            .catch(error => {
              logBackendError(__filename, error?.message, null, null, null, error?.stack);
              return reject(httpErrors.InternalServerError());
            });
        });
      } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, null, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        return reject(error);
      }
    })();
  });
};

const removeToken = async (payloadData: PayloadDataType): Promise<void> => {
  try {
    await redisClient
      .DEL(payloadData.appAgentId.toString())
      .catch(error => {
        throw httpErrors.InternalServerError(error);
      })
      .then(() => {
        return;
      });
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    return error;
  }
};

const verifyAccessToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    const JWT_ACCESS_TOKEN_HEADER = await appConstantsModel
      .findOne({
        name: 'JWT_ACCESS_TOKEN_HEADER',
        isDeleted: false
      })
      .select('value');

    if (!JWT_ACCESS_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_HEADER]`);

    const refreshTokenHeader = JWT_ACCESS_TOKEN_HEADER.value;
    console.log(refreshTokenHeader);
    if (!req.headers?.[refreshTokenHeader]) throw httpErrors.Unauthorized(notAuthorized);
    const authHeader = req.headers?.[refreshTokenHeader];
    let bearerToken: string[] = [];
    if (typeof authHeader === 'string') {
      bearerToken = authHeader.split(' ');
    }
    const accessToken = bearerToken[1] != undefined ? bearerToken[1] : false;

    if (!accessToken) throw httpErrors.Unauthorized(notAuthorized);


    const JWT_ACCESS_TOKEN_SECRET = await appConstantsModel
      .findOne({
        name: 'JWT_ACCESS_TOKEN_SECRET',
        isDeleted: false
      })
      .select('value');

    if (!JWT_ACCESS_TOKEN_SECRET)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_SECRET]`);

    JWT.verify(accessToken, JWT_ACCESS_TOKEN_SECRET.value, (error: any, payload: any) => {
      if (error || payload?.payloadData?.requestIP != req.ip) {
        throw httpErrors.Unauthorized(notAuthorized);
      }
      req.payload = payload.payloadData;
      next();
    });
  } catch (error) {
    __sendJWTError(error, req, res);
  }
};

const verifyRefreshToken = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {

    const JWT_REFRESH_TOKEN_HEADER = await appConstantsModel
      .findOne({
        name: 'JWT_REFRESH_TOKEN_HEADER',
        isDeleted: false
      })
      .select('value');

    if (!JWT_REFRESH_TOKEN_HEADER)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_HEADER]`);

    const refreshTokenHeader = JWT_REFRESH_TOKEN_HEADER.value;

    const refreshToken = req.signedCookies[refreshTokenHeader];

    if (!refreshToken) throw httpErrors.BadRequest(`Unable to process JWT Token. Please try again later.`);

    const JWT_REFRESH_TOKEN_SECRET = await appConstantsModel
      .findOne({
        name: 'JWT_REFRESH_TOKEN_SECRET',
        isDeleted: false
      })
      .select('value');
    if (!JWT_REFRESH_TOKEN_SECRET)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_REFRESH_TOKEN_SECRET]`);

    JWT.verify(refreshToken, JWT_REFRESH_TOKEN_SECRET.value, async (error: any, payload: any) => {
      if (error || payload.payloadData.requestIP != req.ip) {
        return next(httpErrors.Unauthorized(notAuthorized));
      }
      redisClient
        .GET(objectIdToString(payload.payloadData.appAgentId))
        .catch((error: any) => {
          console.log(error);
          logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
          return next(httpErrors.Unauthorized(notAuthorized));
        })
        .then(cachedRefreshToken => {
          if (refreshToken === cachedRefreshToken) {
            req.payload = payload.payloadData;
            return next();
          } else {
            return next(httpErrors.Unauthorized(notAuthorized));
          }
        });
    });
  } catch (error: any) {
    console.log(error);
    __sendJWTError(error, req, res);
  }
};

const __sendJWTError = async (error: any, req: RequestType, res: Response): Promise<void> => {
  const responseStatus = error.status || 500;
  const responseMessage = error.message || `Cannot resolve request [${req.method}] ${req.url}`;
  if (res.headersSent === false) {
    res.status(responseStatus);
    res.send({
      error: {
        status: responseStatus,
        message: responseMessage
      }
    });
  }
};

export { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, removeToken };
