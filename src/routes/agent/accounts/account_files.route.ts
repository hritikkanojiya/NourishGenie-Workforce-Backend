import { Router } from 'express';
import * as appAccountFileController from '../../../controllers/agent/accounts/account_files.controller';
import upload_file from '../../../middlewares/files/upload_file.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';


export const appAccountFileRouterV1 = Router();

appAccountFileRouterV1.post(
  '/delete-file',
  jwtModule.verifyRefreshToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.deleteFile
);
appAccountFileRouterV1.post(
  '/get-files',
  jwtModule.verifyRefreshToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.getAllFiles
);
appAccountFileRouterV1.post(
  '/get-file-details',
  jwtModule.verifyRefreshToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.getOneFile
);
appAccountFileRouterV1.post(
  '/update-file',
  jwtModule.verifyRefreshToken,
  permissionsModule.validateRouteAccess,
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  appAccountFileController.updateFile
);
appAccountFileRouterV1.post(
  '/test-file',
  jwtModule.verifyRefreshToken,
  permissionsModule.validateRouteAccess,
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  (_req, res, _next) => {
    res.send('Hello World');
  }
);
