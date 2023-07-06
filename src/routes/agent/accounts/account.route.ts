import { Router } from 'express';
import * as appAccountController from '../../../controllers/agent/accounts/account.controller';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';

export const appAccountRouterV1 = Router();

appAccountRouterV1.post(
  '/create-agent',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.createUserAccount
);

appAccountRouterV1.post(
  '/delete-agent',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.deleteUserAccount
);

appAccountRouterV1.post(
  '/get-agent-details',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.getSingleAppUserDetails
);

appAccountRouterV1.post(
  '/get-agents',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.getAllAppUsers
);

// appAccountRouterV1.put(
//   '/update-agent',
//   jwtModule.verifyAccessToken,
//   permissionsModule.validateRouteAccess,
//   appAccountController.updateAppUserDetails
// );

appAccountRouterV1.put(
  '/update-app-agent',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.updateUserAccount
);
