import { Router } from 'express';
import * as appAgentSaleryController from '../../controllers/salary_document/salary.controller';
import * as jwtModule from '../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../middlewares/permissions/permissions.middleware';

const appAgentSalarySlipRouter = Router();


appAgentSalarySlipRouter.post(
    '/generate-salary-slip',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appAgentSaleryController.createAppUserSalarySlip
);

export { appAgentSalarySlipRouter };
