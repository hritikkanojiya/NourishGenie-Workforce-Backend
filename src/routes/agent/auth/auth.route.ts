import { Router } from 'express';
import * as appAgentAuthController from '../../../controllers/agent/auth/auth.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

const appAgentAuthRouterV1 = Router();

appAgentAuthRouterV1.post(
  '/login',
  appAgentAuthController.appAgentLogin
);

appAgentAuthRouterV1.post(
  '/refresh',
  jwtModule.verifyRefreshToken,
  appAgentAuthController.appAgentRefresh
);

appAgentAuthRouterV1.post(
  '/logout',
  jwtModule.verifyAccessToken,
  appAgentAuthController.appAgentLogout
);

appAgentAuthRouterV1.delete(
  '/force-logout',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAgentAuthController.appAgentForceLogout
);


// appAgentAuthRouterV1.post(
//   '/get-details',
//   jwtModule.verifyAccessToken,
//   permissionsModule.validateRouteAccess,
//   appAgentAuthController.
// );
// appAgentAuthRouterV1.post(
//   '/getAgentByToken',
//   jwtModule.verifyAccessToken,
//   permissionsModule.validateRouteAccess,
//   appAgentAuthController.getAgentByToken
// );
export { appAgentAuthRouterV1 };
