//department routes
import { Router } from 'express';
import * as appUserDepartmentController from '../../../controllers/agent/fields/department/department.controller';
import permissionModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';

export const appUserDepartmentRouterV1 = Router();
appUserDepartmentRouterV1.post(
  '/create-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDepartmentController.createAppDepartment
);
appUserDepartmentRouterV1.post(
  '/get-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDepartmentController.getAppDepartment
);
appUserDepartmentRouterV1.post(
  '/get-single-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDepartmentController.getSingleDepartment
);

appUserDepartmentRouterV1.delete(
  '/delete-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDepartmentController.deleteAppDepartment
);
appUserDepartmentRouterV1.put(
  '/update-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDepartmentController.updateAppDepartment
);
