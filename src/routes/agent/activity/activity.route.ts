import { Router } from 'express';
import * as activityController from '../../../controllers/agent/activity/activity.controller';


export const agentActivityRouterV1 = Router();

agentActivityRouterV1.post(
    '/markAttendence',
    activityController.attendenceMarker
);
agentActivityRouterV1.post(
    '/get-agent-activity',
    activityController.getAgentActivity
);

agentActivityRouterV1.put(
    '/update-attandence',
    activityController.updateAttandence
);

agentActivityRouterV1.post(
    '/get-Agent-month-Activity',
    activityController.getTotalAgentActivity
);

agentActivityRouterV1.post(
    '/get-Agent-Last-Activity',
    activityController.getAgentLastActivity
);
