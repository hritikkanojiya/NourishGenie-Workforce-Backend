import { Router } from 'express';
import * as appAccountFileController from '../../controllers/accounts/account_files.controller';
import upload_file from '../../middlewares/files/upload_file.middleware';

export const appAccountFileRouterV1 = Router();

appAccountFileRouterV1.post('/deleteFile', appAccountFileController.deleteFile);
appAccountFileRouterV1.post('/getAllFiles', appAccountFileController.getAllFiles);
appAccountFileRouterV1.post('/getOneFiles', appAccountFileController.getOneFile);
appAccountFileRouterV1.post(
  '/updateFile',
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  appAccountFileController.updateFile
);
appAccountFileRouterV1.post(
  '/testFile',
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
