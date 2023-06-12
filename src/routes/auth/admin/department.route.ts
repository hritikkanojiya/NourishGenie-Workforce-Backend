//department routes
import { Router } from 'express';

import * as appAgentDepartmentController from '../../../controllers/agent/fields/department/department.controller';
//import validateRouteAccess from '../../../middlewares/permissions/permissions.middleware';

export const appAgentDepartmentRouterV1 = Router();
appAgentDepartmentRouterV1.post(
  '/createAppDepartment',
  //validateRouteAccess,
  appAgentDepartmentController.createAppdepartment
);
appAgentDepartmentRouterV1.post(
  '/getAppDepartment',
  //validateRouteAccess,
  appAgentDepartmentController.getAppdepartment
);
appAgentDepartmentRouterV1.post(
  '/deleteAppDepartment',
  //validateRouteAccess,
  appAgentDepartmentController.deleteAppdepartment
);
appAgentDepartmentRouterV1.patch(
  '/updateAppDepartment',
  //validateRouteAccess,
  appAgentDepartmentController.updateAppdepartment
);
