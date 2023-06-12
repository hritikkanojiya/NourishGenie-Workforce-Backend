import { Router } from 'express';
import * as appAccessGroupController from '../../../controllers/permissions/access_group/access_group.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';

const appAccessGroupRouterV1 = Router();

appAccessGroupRouterV1.post(
  '/create-group',
  jwtModule.verifyAccessToken,
  appAccessGroupController.createAppAccessGroup
);

appAccessGroupRouterV1.post(
  '/get-group',
  //jwtModule.verifyAccessToken,
  appAccessGroupController.getAppAccessGroup
);

appAccessGroupRouterV1.put('/update-group', jwtModule.verifyAccessToken, appAccessGroupController.updateAppAccessGroup);

appAccessGroupRouterV1.delete(
  '/delete-group',
  jwtModule.verifyAccessToken,
  appAccessGroupController.deleteAppAccessGroup
);

export { appAccessGroupRouterV1 };
