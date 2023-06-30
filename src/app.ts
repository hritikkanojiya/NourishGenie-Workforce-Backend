import fs from 'fs';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import httpErrors from 'http-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { hrModuleBackendApp, httpServer } from './helpers/common/init_socket';
import { v1 } from './helpers/common/route_versions/v1';
import { GlobalConfig } from './helpers/common/environment';
import { LOGGER } from './helpers/common/init_winston';
import './helpers/common/init_mongodb';
import endPoints from 'express-list-endpoints';
import appServiceRouteModel from './models/permissions/service_routes/service_routes.model';
import { logBackendError } from './helpers/common/backend.functions';
import { appConstantsModel } from './models/constants/constants.model';
import nodeScheduler from 'node-schedule';
import sleep from 'atomic-sleep';
import { reScheduleAutomatedJobsOnInit, synchronizeAppRoutesOnInit } from './helpers/common/init_app';
require('dotenv');

// Activate Middlewares
hrModuleBackendApp.use(helmet());
hrModuleBackendApp.use(
  compression({
    level: 6,
    threshold: 50 * 1000,
    filter: (req, res) => {
      return req.headers['request-no-compression'] ? false : compression.filter(req, res);
    }
  })
);

hrModuleBackendApp.use(express.json());
// hrModuleBackendApp.use(upload.any());
hrModuleBackendApp.use(express.urlencoded({ extended: true }));
hrModuleBackendApp.use(cookieParser(GlobalConfig.APP_COOKIE_SECRET));
hrModuleBackendApp.use(
  cors({
    credentials: true,
    origin: process.env.APP_FRONTEND
  })
);
hrModuleBackendApp.use(function (_req, res, next) {
  res.header('Content-Type', 'application/json;charset=UTF-8');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
hrModuleBackendApp.set('trust proxy', true);

// Enable Service Request Logging
hrModuleBackendApp.use(
  morgan('combined', {
    stream: fs.createWriteStream(`./access.log`, {
      flags: 'a'
    })
  })
);

// Displaying Service Request in Console
if (process.env.NODE_ENV !== 'production') {
  hrModuleBackendApp.use(morgan('dev'));
}

// Import Route Modules
hrModuleBackendApp.use('/v1', v1);
const getAllRoutes = async (): Promise<void> => {
  try {
    const allEndPoints = endPoints(hrModuleBackendApp);
    await Promise.all(
      allEndPoints.map(async (endPoint: any) => {
        endPoint.methods.map(async (method: any) => {
          const doesExist = await appServiceRouteModel.findOne({ path: endPoint.path, method: method, });
          if (!doesExist) {
            const serviceRoute = new appServiceRouteModel({
              secure: false,
              type: 'AUTOMATED',
              path: endPoint.path,
              method: method,
              appAccessGroupIds: [],
              isDeleted: false
            })
            await serviceRoute.save();
          }
        })
      })
    )
  } catch (error) {
    LOGGER.error(`Unable to get all routes Error : ${error}`);
  }
}
getAllRoutes();

// Setup Error Handler for unhandled Route Requests.
hrModuleBackendApp.use(async (req, _res, next) => {
  next(httpErrors.NotFound(`Route not Found for [${req.method}] ${req.url}`));
});

// Common Error Handler
hrModuleBackendApp.use(
  (
    err: { status: number; message: string },
    req: { method: any; url: any },
    res: {
      headersSent: boolean;
      status: (arg0: any) => void;
      send: (arg0: { error: { status: any; message: any } }) => void;
    },
    next: () => void
  ) => {
    const responseStatus = err.status || 500;
    const responseMessage = err.message || `Cannot resolve request [${req.method}] ${req.url}`;
    if (res.headersSent === false) {
      res.status(responseStatus);
      res.send({
        error: {
          status: responseStatus,
          message: responseMessage
        }
      });
    }
    next();
  }
);

// Start Express Application
// const app = (appPort: number): boolean => {
//   try {
//     httpServer.listen(appPort, async () => {
//       try {
//         LOGGER.http(`Express Application Running on Port : ${appPort}`);
//       } catch (error) {
//         process.exit(0);
//       }
//     });
//     return true;
//   } catch (error) {
//     LOGGER.error(`Unable to start Express Server. Error : ${error}`);
//     process.exit(0);
//     return false;
//   }
// };

// app(parseInt(process.env.APP_PORT ? process.env.APP_PORT : '3500'));


((hrModuleBackendAppPort): void => {
  try {
    httpServer.listen(hrModuleBackendAppPort, async () => {
      try {
        const appEnvironment = process.env?.NODE_ENV;
        // const delayInMS = parseInt(process.env?.delayInMS);

        console.log(
          `Express Application Running on Port`,
          hrModuleBackendAppPort
        );

        // await watchAppCollection();

        const AUTO_EXECUTE_TIME_DELAY_IN_MS = await appConstantsModel
          .findOne({
            name: 'AUTO_EXECUTE_TIME_DELAY_IN_MS',
            isDeleted: false,
          })
          .select('value');

        if (!AUTO_EXECUTE_TIME_DELAY_IN_MS)
          throw httpErrors.UnprocessableEntity(
            `Unable to process Constant [AUTO_EXECUTE_TIME_DELAY_IN_MS]`
          );

        const EVENT_SLEEP_DURATION_IN_MS = await appConstantsModel
          .findOne({
            name: 'EVENT_SLEEP_DURATION_IN_MS',
            isDeleted: false,
          })
          .select('value');

        if (!EVENT_SLEEP_DURATION_IN_MS)
          throw httpErrors.UnprocessableEntity(
            `Unable to process Constant [EVENT_SLEEP_DURATION_IN_MS]`
          );

        const sleepDuration = parseInt(
          EVENT_SLEEP_DURATION_IN_MS.value
        );

        nodeScheduler.scheduleJob(
          `EXECUTE_INIT_FUNCTIONS`,
          new Date(Date.now() + parseInt(AUTO_EXECUTE_TIME_DELAY_IN_MS.value)),
          async () => {
            (async function initFunctionsStack(): Promise<void> {
              const sleepTime =
                appEnvironment != 'production' ? 1000 : sleepDuration;
              sleep(sleepTime);
              await reScheduleAutomatedJobsOnInit();
              sleep(sleepTime);
              await synchronizeAppRoutesOnInit(hrModuleBackendApp);
              sleep(sleepTime);
            })();
          }
        );
      } catch (error: any) {
        console.error('Error :', error.message);
        logBackendError(__filename, error?.message, null, null, error?.stack);
        process.exit(0);
      }
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    console.error(`Unable to start Express Server. Error : ${error}`);
    process.exit(0);
  }
})(GlobalConfig.APP_PORT || 3500);

process.on('SIGINT', () => {
  setTimeout(() => {
    LOGGER.warn('Application terminated successfully.');
    process.exit(0);
  }, 500);
});

process.on('uncaughtException', error => {
  LOGGER.error(`Uncaught Exception Occurred\n${error}`);
});
