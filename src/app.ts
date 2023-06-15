import fs from 'fs';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import httpErrors from 'http-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { marketingBackendApp, httpServer } from './helpers/common/init_socket';
import { v1 } from './helpers/common/route_versions/v1';
import { GlobalConfig } from './helpers/common/environment';
import { LOGGER } from './helpers/common/init_winston';
import './helpers/common/init_mongodb';
// import endPoints from 'express-list-endpoints';
// import appServiceRouteModel from './models/permissions/service_routes/service_routes.model';

require('dotenv');

// Activate Middlewares
marketingBackendApp.use(helmet());
marketingBackendApp.use(
  compression({
    level: 6,
    threshold: 50 * 1000,
    filter: (req, res) => {
      return req.headers['request-no-compression'] ? false : compression.filter(req, res);
    }
  })
);

marketingBackendApp.use(express.json());
marketingBackendApp.use(express.urlencoded({ extended: true }));
marketingBackendApp.use(cookieParser(GlobalConfig.APP_COOKIE_SECRET));
marketingBackendApp.use(
  cors({
    credentials: true,
    origin: process.env.APP_FRONTEND
  })
);
marketingBackendApp.use(function (_req, res, next) {
  res.header('Content-Type', 'application/json;charset=UTF-8');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
marketingBackendApp.set('trust proxy', true);

// Enable Service Request Logging
marketingBackendApp.use(
  morgan('combined', {
    stream: fs.createWriteStream(`./access.log`, {
      flags: 'a'
    })
  })
);

// Displaying Service Request in Console
if (process.env.NODE_ENV !== 'production') {
  marketingBackendApp.use(morgan('dev'));
}

// Import Route Modules
marketingBackendApp.use('/v1', v1);
// const getAllRoutes = async (): Promise<void> => {
//   try {
//     const allEndPoints = endPoints(marketingBackendApp);
//     await Promise.all(
//       allEndPoints.map(async (endPoint: any) => {
//         endPoint.methods.map(async (method: any) => {
//           const doesExist = await appServiceRouteModel.findOne({ path: endPoint.path, method: method, });
//           if (!doesExist) {
//             const serviceRoute = new appServiceRouteModel({
//               secure: false,
//               type: 'AUTOMATED',
//               path: endPoint.path,
//               method: method,
//               appAccessGroupIds: [],
//               isDeleted: false
//             })
//             await serviceRoute.save();
//           }
//         })
//       })
//     )
//   } catch (error) {
//     LOGGER.error(`Unable to get all routes Error : ${error}`);
//     console.log(error);
//   }
// }
// getAllRoutes();

// Setup Error Handler for unhandled Route Requests.
marketingBackendApp.use(async (req, _res, next) => {
  next(httpErrors.NotFound(`Route not Found for [${req.method}] ${req.url}`));
});

// Common Error Handler
marketingBackendApp.use(
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
const app = (appPort: number): boolean => {
  try {
    httpServer.listen(appPort, async () => {
      try {
        LOGGER.http(`Express Application Running on Port : ${appPort}`);
      } catch (error) {
        process.exit(0);
      }
    });
    return true;
  } catch (error) {
    LOGGER.error(`Unable to start Express Server. Error : ${error}`);
    process.exit(0);
    return false;
  }
};

app(parseInt(process.env.APP_PORT ? process.env.APP_PORT : '3500'));

process.on('SIGINT', () => {
  setTimeout(() => {
    LOGGER.warn('Application terminated successfully.');
    process.exit(0);
  }, 500);
});

process.on('uncaughtException', error => {
  LOGGER.error(`Uncaught Exception Occurred\n${error}`);
});
