// Import Packages
import express from 'express';
const appConstantsRouterV1 = express.Router();
import * as jwtModule from '../../middlewares/jwt/jwt.middleware';
import * as appConstantsController from '../../controllers/constants/constants.controller';
import permissionsModule from '../../middlewares/permissions/permissions.middleware';

// Define Routes
appConstantsRouterV1.post(
    '/create-constant',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appConstantsController.createAppConstant
);

appConstantsRouterV1.post(
    '/get-constants',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appConstantsController.getAppConstants
);

appConstantsRouterV1.put(
    '/update-constant',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appConstantsController.updateAppConstant
);

appConstantsRouterV1.delete(
    '/delete-constant',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appConstantsController.deleteAppConstants
);

// Export routes
export { appConstantsRouterV1 };
