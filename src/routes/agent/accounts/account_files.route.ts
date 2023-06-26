import { Router } from 'express';
import * as appAccountFileController from '../../../controllers/agent/accounts/account_files.controller';
import upload_file from '../../../middlewares/files/upload_file.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
const appAccountFileRouterV1 = Router();

appAccountFileRouterV1.post(
  '/upload-file',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'otherFiles', maxCount: 5 }
  ]),
  appAccountFileController.uploadFile
);

appAccountFileRouterV1.post(
  '/delete-file',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.deleteFile
);

appAccountFileRouterV1.post(
  '/get-files',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.getAllFiles
);

appAccountFileRouterV1.post(
  '/get-profile-picture',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccountFileController.getProfilePicture
);

appAccountFileRouterV1.post(
  '/update-file',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'otherFiles', maxCount: 5 }
  ]),
  appAccountFileController.updateFile
);


appAccountFileRouterV1.post(
  '/upload-single-file',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'otherFiles', maxCount: 5 }
  ]),
  appAccountFileController.uploadSingleFile
);
export { appAccountFileRouterV1 };
