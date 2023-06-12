import { Router } from 'express';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import * as appAgentAuthController from '../../../controllers/agent/auth/auth.controller';

const appAgentAuthRouterV1 = Router();

appAgentAuthRouterV1.post('/login', appAgentAuthController.appAgentLogin);

appAgentAuthRouterV1.post(
  '/logout',
  jwtModule.verifyAccessToken,
  // permissionsModule.validateRouteAccess,
  appAgentAuthController.appAgentLogout
);
appAgentAuthRouterV1.post('/getAgentByToken', appAgentAuthController.getAgentByToken);
export { appAgentAuthRouterV1 };
