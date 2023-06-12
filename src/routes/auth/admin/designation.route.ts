import { Router } from 'express';
import * as appAgentDesignationController from '../../../controllers/agent/fields/designation/designation.controller';
//import validateRouteAccess from '../../../middlewares/permissions/permissions.middleware';

export const appAgentDesignationRouterV1 = Router();
appAgentDesignationRouterV1.post(
  '/createAppDesignation',
  //validateRouteAccess,
  appAgentDesignationController.createAppdesignation
);
appAgentDesignationRouterV1.post(
  '/getAppDesignation',
  //validateRouteAccess,
  appAgentDesignationController.getAppdesignation
);

appAgentDesignationRouterV1.post(
  '/getSingleDesignation',
  //validateRouteAccess,
  appAgentDesignationController.getSingleDesignation
);
appAgentDesignationRouterV1.patch(
  '/updateAppDesignation',
  //validateRouteAccess,
  appAgentDesignationController.updateAppdesignation
);
appAgentDesignationRouterV1.post(
  '/deleteAppDesignation',
  //validateRouteAccess,
  appAgentDesignationController.deleteAppdesignation
);
