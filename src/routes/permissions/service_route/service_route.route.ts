// Import Packages
import express from 'express';
const appRouteRouterV1 = express.Router();
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import routeController from '../../../controllers/permissions/service_routes/service_routes.controller';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

// Define Routes
appRouteRouterV1.post(
    '/create-route',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    routeController.createAppServiceRoute
);

appRouteRouterV1.post(
    '/get-route',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    routeController.getAppServiceRoutes
);

appRouteRouterV1.put(
    '/update-route',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    routeController.updateAppServiceRoute
);

appRouteRouterV1.patch(
    '/toggle-group',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    routeController.toggleAppGroup
);

appRouteRouterV1.delete(
    '/delete-route',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    routeController.deleteAppRoute
);

// Export routes
export { appRouteRouterV1 };
