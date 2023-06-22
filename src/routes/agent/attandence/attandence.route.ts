import { Router } from 'express';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import * as appAttandenceController from '../../../controllers/agent/attandence/attandence.controller'

const appAttandenceRouterV1 = Router();

appAttandenceRouterV1.post(
    '/create-attandence',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appAttandenceController.createAttandence
);

// appAttandenceRouterV1.post(
//     '/delete-agent',
//     jwtModule.verifyAccessToken,
//     permissionsModule.validateRouteAccess,
//     appAttandenceController.deleteAttandence
// );

// appAttandenceRouterV1.post(
//     '/get-agent-details',
//     jwtModule.verifyAccessToken,
//     permissionsModule.validateRouteAccess,
//     appAttandenceController.getSingleAppUserDetails
// );

// appAttandenceRouterV1.post(
//     '/get-agents',
//     jwtModule.verifyAccessToken,
//     permissionsModule.validateRouteAccess,
//     appAttandenceController.getAllAppAgents
// );

appAttandenceRouterV1.put(
    '/update-attandence',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appAttandenceController.updateAttandence
);

export { appAttandenceRouterV1 }