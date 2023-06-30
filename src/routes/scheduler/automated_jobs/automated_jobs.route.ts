import express from 'express';
import * as appAutomatedJobController from '../../../controllers/scheduler/automated_jobs/automated_jobs.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
const appAutomatedJobRouterV1 = express.Router();

appAutomatedJobRouterV1.post(
  '/create-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.createAppAutomatedJob
);

appAutomatedJobRouterV1.post(
  '/get-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.getAppAutomatedJobs
);

appAutomatedJobRouterV1.put(
  '/update-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.updateAppAutomatedJob
);

appAutomatedJobRouterV1.delete(
  '/delete-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.deleteAppAutomatedJob
);

appAutomatedJobRouterV1.put(
  '/toggle-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.toggleAppAutomatedJob
);

appAutomatedJobRouterV1.post(
  '/force-execute-automated-job',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.forceExecuteAutomatedJob
);

appAutomatedJobRouterV1.post(
  '/read-automated-job-logs',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAutomatedJobController.readAppAutomatedJobLogs
);

export { appAutomatedJobRouterV1 };
