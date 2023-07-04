import { Router } from 'express';
import { appAccessGroupRouterV1 } from '../../../routes/permissions/access_group/access_group.route';
import { appAgentAuthRouterV1 } from '../../../routes/agent/auth/auth.route';
import { appAgentDepartmentRouterV1 } from '../../../routes/agent/fields/department.route';
import { appAgentDesignationRouterV1 } from '../../../routes/agent/fields/designation.route';
import { appRouteRouterV1 } from '../../../routes/permissions/service_route/service_route.route';
import { menuRouterV1 } from '../../../routes/permissions/menu/menu.route';
import { appAccountRouterV1 } from '../../../routes/agent/accounts/account.route';
import { appAccountFileRouterV1 } from '../../../routes/agent/accounts/account_files.route';
import { appReportingManagerRouterV1 } from '../../../routes/agent/fields/reporting_manager.route';
import { appCountryStateCityRouterV1 } from '../../../routes/country_state_city/country_state_city.route';
import { agentActivityRouterV1 } from '../../../routes/agent/activity/activity.route';
import { appConstantsRouterV1 } from '../../../routes/constants/constants.route';
import { appAgentSalarySlipRouter } from '../../../routes/salary/salary.route';
import { appAutomatedJobRouterV1 } from '../../../routes/scheduler/automated_jobs/automated_jobs.route';
import { appCronExpressionRouterV1 } from '../../../routes/scheduler/cron_expression/cron_expression.route';
import { appSmartFunctionRouterV1 } from '../../../routes/scheduler/smart_functions/smart_functions.route';
import { userAttendanceRouterV1 } from '../../../routes/agent/attendance/attendance.route'


const v1 = Router();

v1.use('/permission/service-route', appRouteRouterV1);
v1.use('/permission/access-group', appAccessGroupRouterV1);
v1.use('/permission/menu', menuRouterV1);
v1.use('/agent/auth', appAgentAuthRouterV1);
v1.use('/agent/fields/department', appAgentDepartmentRouterV1);
v1.use('/agent/fields/designation', appAgentDesignationRouterV1);
v1.use('/agent/account/', appAccountRouterV1);
v1.use('/agent/account_files/', appAccountFileRouterV1);
v1.use('/agent/fields/reporting_manager', appReportingManagerRouterV1);
v1.use('/countries-states-cities', appCountryStateCityRouterV1);
v1.use('/agent/activity', agentActivityRouterV1);
v1.use('/constant', appConstantsRouterV1);
v1.use('/salary', appAgentSalarySlipRouter);
v1.use('/scheduler/cron-expression', appCronExpressionRouterV1);
v1.use('/scheduler/automated-job', appAutomatedJobRouterV1);
v1.use('/scheduler/smart-function', appSmartFunctionRouterV1);
v1.use('/user/attendance', userAttendanceRouterV1);





export { v1 };
