import { Router } from 'express';
import * as appAccountController from '../../../controllers/agent/accounts/account.controller';
//import upload_file from '../../../middlewares/files/upload_file.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';

export const appAccountRouterV1 = Router();
appAccountRouterV1.post(
  '/create-agent',
  jwtModule.verifyAccessToken,
  // permissionsModule.validateRouteAccess,
  // upload_file.fields([
  //   { name: 'profile_picture', maxCount: 1 },
  //   { name: 'aadhar_card', maxCount: 1 },
  //   { name: 'pan_card', maxCount: 1 },
  //   { name: 'documents', maxCount: 3 }
  // ]),
  appAccountController.createAccount
);

appAccountRouterV1.post(
  '/delete-agent',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.deleteAccount
);
appAccountRouterV1.post(
  '/get-agent-details',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.getSingleAccount
);
appAccountRouterV1.post(
  '/get-agents',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.getAllAppAgents
);
appAccountRouterV1.put(
  '/update-agents',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountController.updateAppAgentDetails
);
appAccountRouterV1.post('/get-all-details', appAccountController.getSingleAppUserDetails);
