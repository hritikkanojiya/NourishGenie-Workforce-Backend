import { Router } from 'express';
import { appAccessGroupRouterV1 } from '../../../routes/permissions/access_group/access_group.route';
import { appAgentAuthRouterV1 } from '../../../routes/agent/auth/auth.route';
import { appAgentDepartmentRouterV1 } from '../../../routes/auth/admin/department.route';
import { appAgentDesignationRouterV1 } from '../../../routes/auth/admin/designation.route';
import { appRouteRouterV1 } from '../../../routes/permissions/service_route/service_route.route';
import { menuRouterV1 } from '../../../routes/permissions/menu/menu.route';
import { appAccountRouterV1 } from '../../../routes/accounts/account.route';
import { appAccountFileRouterV1 } from '../../../routes/accounts/account_files.route';
import { appReportingManagerRouterV1 } from '../../../routes/auth/admin/reporting_manager.route';

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

export { v1 };
