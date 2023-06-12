import { Router } from 'express';
import * as appAccountController from '../../controllers/accounts/account.controller';
import upload_file from '../../middlewares/files/upload_file.middleware';

export const appAccountRouterV1 = Router();
appAccountRouterV1.post(
  '/createAppAccount',
  upload_file.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'documents', maxCount: 3 }
  ]),
  appAccountController.createAccount
);

appAccountRouterV1.post('/deleteAppAccount', appAccountController.deleteAccount);
appAccountRouterV1.post('/getSingleAppAccount', appAccountController.getSingleAccount);
appAccountRouterV1.get('/getAllAppAccount', appAccountController.getAllAppUsers);
appAccountRouterV1.patch('/updateAppAccount', appAccountController.updateAppUserDetails);
appAccountRouterV1.post('/getSingleUserDetails', appAccountController.getSingleAppUserDetails);
