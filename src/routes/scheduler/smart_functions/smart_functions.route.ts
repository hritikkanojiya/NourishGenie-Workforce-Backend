import express from 'express';
import * as appSmartFunctionController from '../../../controllers/scheduler/smart_functions/smart_functions.controller';
import * as jwtModule from '../../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../../middlewares/permissions/permissions.middleware';
const appSmartFunctionRouterV1 = express.Router();

appSmartFunctionRouterV1.post(
  '/create-smart-function',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appSmartFunctionController.createAppSmartFunction
);

appSmartFunctionRouterV1.post(
  '/get-smart-function',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appSmartFunctionController.getAppSmartFunctions
);

appSmartFunctionRouterV1.put(
  '/update-smart-function',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appSmartFunctionController.updateAppSmartFunction
);

appSmartFunctionRouterV1.delete(
  '/delete-smart-function',
  jwtModule.verifyAccessToken,
  permissionsModule.validateRouteAccess,
  appSmartFunctionController.deleteAppSmartFunction
);

export { appSmartFunctionRouterV1 };
