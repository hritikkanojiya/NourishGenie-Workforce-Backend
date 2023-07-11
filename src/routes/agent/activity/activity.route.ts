import { Router } from 'express';
import * as activityController from '../../../controllers/agent/activity/activity.controller';
// import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

const agentActivityRouterV1 = Router();

agentActivityRouterV1.post(
    '/markAttendence',
    activityController.createActivityLogs
);
agentActivityRouterV1.post(
    '/get-agent-activity',
    // jwtModule.verifyAccessToken,
    // permissionsModule.validateRouteAccess,
    activityController.getUserActivity
);

agentActivityRouterV1.post(
    '/get-users-working_status',
    // jwtModule.verifyAccessToken,
    // permissionsModule.validateRouteAccess,
    activityController.getUsersWorkingStatus
);

agentActivityRouterV1.post(
    '/get-Agent-Last-Activity',
    // jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    activityController.getUserLastActivity
);

export { agentActivityRouterV1 }