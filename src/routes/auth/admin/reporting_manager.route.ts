import { Router } from 'express';
import * as appReportingManagerController from '../../../controllers/agent/fields/reporting_managers/reporting_manager.controller';

export const appReportingManagerRouterV1 = Router();

appReportingManagerRouterV1.post(
  '/createAppReportingManager',
  //validateRouteAccess,
  appReportingManagerController.createAppReportingManager
);

appReportingManagerRouterV1.post(
  '/getAppReportingManager',
  //validateRouteAccess,
  appReportingManagerController.getAppReportingManager
);

appReportingManagerRouterV1.post(
  '/deleteAppReportingManager',
  //validateRouteAccess,
  appReportingManagerController.deleteAppReportingManager
);

appReportingManagerRouterV1.get(
  '/getNonReportingManager',
  //validateRouteAccess,
  appReportingManagerController.getNonReportingManager
);
