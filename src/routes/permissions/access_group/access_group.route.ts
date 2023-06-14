import { Router } from 'express';
import * as appAccessGroupController from '../../../controllers/permissions/access_group/access_group.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

const appAccessGroupRouterV1 = Router();

appAccessGroupRouterV1.post(
  '/create-group',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccessGroupController.createAppAccessGroup
);

appAccessGroupRouterV1.post(
  '/get-group',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccessGroupController.getAppAccessGroup
);

appAccessGroupRouterV1.put(
  '/update-group',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccessGroupController.updateAppAccessGroup
);

appAccessGroupRouterV1.delete(
  '/delete-group',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appAccessGroupController.deleteAppAccessGroup
);

export { appAccessGroupRouterV1 };
