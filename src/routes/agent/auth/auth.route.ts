import { Router } from 'express';
import * as appUserAuthController from '../../../controllers/agent/auth/auth.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

const appUserAuthRouterV1 = Router();

appUserAuthRouterV1.post('/login', appUserAuthController.appUserLogin);

appUserAuthRouterV1.post('/refresh', jwtModule.verifyRefreshToken, appUserAuthController.appUserRefresh);

appUserAuthRouterV1.post('/logout', jwtModule.verifyAccessToken, appUserAuthController.appUserLogout);

appUserAuthRouterV1.delete(
  '/force-logout',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appUserAuthController.appUserForceLogout
);

// appUserAuthRouterV1.post(
//   '/get-details',
//   jwtModule.verifyAccessToken,
//   permissionsModule.validateRouteAccess,
//   appAgentAuthController.
// );
appUserAuthRouterV1.get('/getAgentByToken', jwtModule.verifyAccessToken, appUserAuthController.getUserByToken);
export { appUserAuthRouterV1 };
