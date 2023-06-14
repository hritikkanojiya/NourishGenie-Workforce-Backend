// Import Packages
import express from 'express';
const menuRouterV1 = express.Router();
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import * as menuController from '../../../controllers/permissions/menu/menu.controller';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

// Define Routes
menuRouterV1.post(
    '/get-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.getAppMenu
);

menuRouterV1.post(
    '/create-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.createAppMenu
);

menuRouterV1.put(
    '/update-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.updateAppMenu
);

menuRouterV1.delete(
    '/delete-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.deleteAppMenu
);

menuRouterV1.patch(
    '/toggle-group',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.toggleAppAccessGroup
);

menuRouterV1.post(
    '/get-sub-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.getAppSubMenu
);

menuRouterV1.post(
    '/create-sub-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.createAppSubMenu
);

menuRouterV1.put(
    '/update-sub-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.updateAppSubMenu
);

menuRouterV1.delete(
    '/delete-sub-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.deleteAppSubMenu
);

menuRouterV1.get(
    '/construct-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.constructAppMenu
);

menuRouterV1.post(
    '/preview-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.previewAppMenu
);

menuRouterV1.patch(
    '/seralize-menu',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    menuController.seralizeAppMenu
);

// Export routes
export { menuRouterV1 };
