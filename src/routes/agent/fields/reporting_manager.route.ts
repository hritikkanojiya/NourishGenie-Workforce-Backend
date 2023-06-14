import { Router } from 'express';
import * as appReportingManagerController from '../../../controllers/agent/fields/reporting_managers/reporting_manager.controller';
import permissionModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
export const appReportingManagerRouterV1 = Router();

appReportingManagerRouterV1.post(
  '/create-manager',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appReportingManagerController.createAppReportingManager
);

appReportingManagerRouterV1.post(
  '/get-manager',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appReportingManagerController.getAppReportingManager
);

appReportingManagerRouterV1.delete(
  '/delete-manager',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appReportingManagerController.deleteAppReportingManager
);

appReportingManagerRouterV1.put(
  '/update-manager',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appReportingManagerController.updateAppReportingManager
);

appReportingManagerRouterV1.get(
  '/get-non-reporting-manager',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appReportingManagerController.getNonReportingManager
);
