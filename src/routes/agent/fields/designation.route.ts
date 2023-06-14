import { Router } from 'express';
import * as appAgentDesignationController from '../../../controllers/agent/fields/designation/designation.controller';
import permissionModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
const appAgentDesignationRouterV1 = Router();
appAgentDesignationRouterV1.post(
  '/create-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDesignationController.createAppDesignation
);
appAgentDesignationRouterV1.post(
  '/get-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDesignationController.getAppDesignation
);

appAgentDesignationRouterV1.post(
  '/get-single-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDesignationController.getSingleDesignation
);
appAgentDesignationRouterV1.put(
  '/update-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDesignationController.updateAppDesignation
);
appAgentDesignationRouterV1.delete(
  '/delete-designation',
  jwtModule.verifyAccessToken,
  permissionModule.validateRouteAccess,
  appAgentDesignationController.deleteAppDesignation
);

export { appAgentDesignationRouterV1 }
