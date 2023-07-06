import { Router } from 'express';
import * as userAttendanceContoller from '../../../controllers/agent/attendance/attendance.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';

const userAttendanceRouterV1 = Router();

userAttendanceRouterV1.put(
    '/update-attendance',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    userAttendanceContoller.updateUserAttendance
);
userAttendanceRouterV1.post(
    '/get-attendance',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    userAttendanceContoller.getUsersAttendance
);


export { userAttendanceRouterV1 }