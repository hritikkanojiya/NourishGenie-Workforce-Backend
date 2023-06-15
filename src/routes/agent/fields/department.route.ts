//department routes
import { Router } from 'express';
import * as appAgentDepartmentController from '../../../controllers/agent/fields/department/department.controller';
import permissionModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';

export const appAgentDepartmentRouterV1 = Router();
appAgentDepartmentRouterV1.post(
  '/create-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDepartmentController.createAppDepartment
);
appAgentDepartmentRouterV1.post(
  '/get-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDepartmentController.getAppDepartment
);
appAgentDepartmentRouterV1.post(
  '/get-single-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDepartmentController.getSingleDepartment
);

appAgentDepartmentRouterV1.delete(
  '/delete-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDepartmentController.deleteAppDepartment
);
appAgentDepartmentRouterV1.put(
  '/update-department',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDepartmentController.updateAppDepartment
);
