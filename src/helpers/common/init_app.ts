// File to save functions and call stacks to be executed when app is started
import nodeScheduler from 'node-schedule';
import listEndpoints from 'express-list-endpoints';
import { logBackendError, convertToIST, emitSocketEvent, sanitizeUrl } from './backend.functions';
import moment from 'moment';
import * as scheduler from './init_scheduler';
import { appConstantsModel } from '../../models/constants/constants.model';
import appRouteModel from '../../models/permissions/service_routes/service_routes.model';
import httpErrors from 'http-errors';
import { GlobalConfig } from './environment';

const appInitScriptsActivityId = parseInt(
    GlobalConfig.APP_INIT_SCRIPTS_ACTIVITY_ID
);

const synchronizeAppRoutesOnInit = async (appInstance: any): Promise<void> => {
    try {
        const AUTO_EXECUTE_TIME_DELAY_IN_MS = await appConstantsModel
            .findOne({
                name: 'AUTO_EXECUTE_TIME_DELAY_IN_MS',
                isDeleted: false,
            })
            .select('value');

        if (!AUTO_EXECUTE_TIME_DELAY_IN_MS)
            throw httpErrors.UnprocessableEntity(
                `Unable to process Constant [AUTO_EXECUTE_TIME_DELAY_IN_MS]`
            );

        nodeScheduler.scheduleJob(
            `SYNCHRONIZE_SERVICE_ROUTES`,
            new Date(Date.now() + parseInt(AUTO_EXECUTE_TIME_DELAY_IN_MS.value)),
            async () => {
                try {
                    console.log(
                        `Executing Function: synchronizeAppRoutesOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );

                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Executing Function: synchronizeAppRoutesOnInit',
                        'started',
                        `Synchronizing Application routes from NodeJS into MongoDB`,
                        convertToIST(moment().toDate()),
                        {}
                    );

                    const appServiceRoutes = listEndpoints(appInstance);

                    const SERVICE_ROUTES_DUMP_SPLIT_LIMIT = await appConstantsModel
                        .findOne({
                            name: 'SERVICE_ROUTES_DUMP_SPLIT_LIMIT',
                            isDeleted: false,
                        })
                        .select('value');

                    if (!SERVICE_ROUTES_DUMP_SPLIT_LIMIT)
                        throw httpErrors.UnprocessableEntity(
                            `Unable to process Constant [SERVICE_ROUTES_DUMP_SPLIT_LIMIT]`
                        );

                    for (
                        let index = 0;
                        index <
                        Math.ceil(
                            appServiceRoutes.length /
                            parseInt(SERVICE_ROUTES_DUMP_SPLIT_LIMIT.value)
                        );
                        index++
                    ) {
                        await Promise.all(
                            appServiceRoutes
                                .slice(
                                    index * parseInt(SERVICE_ROUTES_DUMP_SPLIT_LIMIT.value),
                                    (index + 1) * parseInt(SERVICE_ROUTES_DUMP_SPLIT_LIMIT.value)
                                )
                                .map(async (appRoute) => {
                                    appRoute.methods.map(async (routeMethod) => {
                                        const routePath = sanitizeUrl(appRoute.path);
                                        const doesRouteExist = await appRouteModel.findOne({
                                            path: routePath,
                                            method: routeMethod,
                                            isDeleted: false,
                                        });

                                        if (!doesRouteExist) {
                                            await new appRouteModel({
                                                path: routePath,
                                                method: routeMethod,
                                                type: 'AUTOMATED',
                                                secure: false,
                                                appAccessGroupIds: [],
                                            }).save({});
                                        }
                                    });
                                })
                        );
                    }

                    console.log(
                        `Executed Function: synchronizeAppRoutesOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );

                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Executed Function: synchronizeAppRoutesOnInit',
                        'completed',
                        `Synchronized Application routes from NodeJS into MongoDB`,
                        convertToIST(moment().toDate()),
                        {}
                    );
                } catch (error: any) {
                    console.log(
                        `Terminated Function: synchronizeAppRoutesOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );
                    console.log(moment().toDate());
                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Terminated Function: synchronizeAppRoutesOnInit',
                        'suspended',
                        `${error.message
                            ? error.message
                            : 'Something went wrong while synchronizing Application routes from NodeJS into MongoDB'
                        } `,
                        convertToIST(moment().toDate()),
                        {}
                    );
                    throw error;
                }
            }
        );
    } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, error?.stack);
    }
};

const reScheduleAutomatedJobsOnInit = async (): Promise<void> => {
    try {
        const AUTO_EXECUTE_TIME_DELAY_IN_MS = await appConstantsModel
            .findOne({
                name: 'AUTO_EXECUTE_TIME_DELAY_IN_MS',
                isDeleted: false,
            })
            .select('value');

        if (!AUTO_EXECUTE_TIME_DELAY_IN_MS)
            throw httpErrors.UnprocessableEntity(
                `Unable to process Constant [AUTO_EXECUTE_TIME_DELAY_IN_MS]`
            );

        nodeScheduler.scheduleJob(
            `RESCHEDULE_AUTOMATED_JOBS`,
            new Date(Date.now() + parseInt(AUTO_EXECUTE_TIME_DELAY_IN_MS.value)),
            async () => {
                try {
                    console.log(
                        `Executing Function: reScheduleAutomatedJobsOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );

                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Executing Function: reScheduleAutomatedJobsOnInit',
                        'started',
                        `Re-Scheduling Automated Jobs`,
                        convertToIST(moment().toDate()),
                        {}
                    );

                    await scheduler.reScheduleAutomatedJobs();

                    console.log(
                        `Executed Function: reScheduleAutomatedJobsOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );

                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Executed Function: reScheduleAutomatedJobsOnInit',
                        'completed',
                        `Automated Jobs Re-Scheduled`,
                        convertToIST(moment().toDate()),
                        {}
                    );
                } catch (error: any) {
                    console.log(
                        `Terminated Function: reScheduleAutomatedJobsOnInit [${moment().format(
                            'DD MMM YYYY, h:mm:ss A'
                        )}]`
                    );

                    await emitSocketEvent(
                        appInitScriptsActivityId,
                        'Terminated Function: reScheduleAutomatedJobsOnInit',
                        'suspended',
                        `${error.message
                            ? error.message
                            : 'Something went wrong while rescheduling automated jobs'
                        } `,
                        convertToIST(moment().toDate()),
                        {}
                    );
                    throw error;
                }
            }
        );
    } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, error?.stack);
    }
};

export { reScheduleAutomatedJobsOnInit, synchronizeAppRoutesOnInit }