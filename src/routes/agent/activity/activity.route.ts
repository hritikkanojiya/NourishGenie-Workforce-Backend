import { Router } from 'express';
import * as activityController from '../../../controllers/agent/activity/activity.controller';


export const agentActivityRouterV1 = Router();

agentActivityRouterV1.post('/markAttendence', activityController.attendenceMarker);
agentActivityRouterV1.post('/getUserActivity', activityController.getAgentActivity);
agentActivityRouterV1.post('/getTotalUserActivity', activityController.getTotalAgentActivity);


