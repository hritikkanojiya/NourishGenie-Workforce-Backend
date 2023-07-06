import { Router } from 'express';
import * as appUserDesignationController from '../../../controllers/agent/fields/designation/designation.controller';
import permissionModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
const appUserDesignationRouterV1 = Router();
appUserDesignationRouterV1.post(
  '/create-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDesignationController.createAppDesignation
);
appUserDesignationRouterV1.post(
  '/get-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDesignationController.getAppDesignation
);

appUserDesignationRouterV1.post(
  '/get-single-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDesignationController.getSingleDesignation
);
appUserDesignationRouterV1.put(
  '/update-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDesignationController.updateAppDesignation
);
appUserDesignationRouterV1.delete(
  '/delete-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appUserDesignationController.deleteAppDesignation
);

export { appUserDesignationRouterV1 }
