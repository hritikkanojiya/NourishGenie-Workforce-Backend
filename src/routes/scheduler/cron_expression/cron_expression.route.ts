import express from 'express';
import * as appCronExpressionController from '../../../controllers/scheduler/cron_expression/cron_expression.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
const appCronExpressionRouterV1 = express.Router();

appCronExpressionRouterV1.post(
  '/create-expression',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appCronExpressionController.createAppCronExpression
);

appCronExpressionRouterV1.post(
  '/get-expression',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appCronExpressionController.getAppCronExpression
);

appCronExpressionRouterV1.put(
  '/update-expression',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appCronExpressionController.updateAppCronExpression
);

appCronExpressionRouterV1.delete(
  '/delete-expression',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appCronExpressionController.deleteAppCronExpression
);

export { appCronExpressionRouterV1 };
