import nodeScheduler, { Job } from 'node-schedule';
import { appConstantsModel } from '../../../models/constants/constants.model';
import { appAutomatedJobLogsModel } from '../../../models/scheduler/automated_jobs/automated_jobs.model';
import { appCronExpressionModel } from '../../../models/scheduler/cron_expression/cron_expression.model';
import { appSmartFunctionModel } from '../../../models/scheduler/smart_functions/smart_functions.model';
import { objectIdToString, logBackendError } from '../../common/backend.functions';
import * as appSmartFunctionService from '../smart_functions/smart_functions.service';
import mongoose from 'mongoose';
import httpErrors from 'http-errors';

const scheduleAppAutomatedJob = async (automatedJob: any, forceExecute = false): Promise<mongoose.Types.ObjectId> => {
  try {
    const cronExpression = await appCronExpressionModel.findOne({
      _id: automatedJob?.appCronExpressionId,
    });

    if (!cronExpression)
      throw new Error(
        `Error retrieving Cron Expression for Automated Job: ${automatedJob?._id}`
      );

    const smartFunction = await appSmartFunctionModel.findOne({
      _id: automatedJob?.appSmartFunctionId,
      isDeleted: false,
    });

    if (!smartFunction)
      throw new Error(
        `Error retrieving smart function for Automated Job: ${automatedJob?._id}`
      );

    const FORCE_EXECUTE_TIME_DELAY_IN_MS: any = await appConstantsModel
      .findOne({
        name: 'FORCE_EXECUTE_TIME_DELAY_IN_MS',
        isDeleted: false,
      })
      .select('value');

    if (!FORCE_EXECUTE_TIME_DELAY_IN_MS)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Constant [FORCE_EXECUTE_TIME_DELAY_IN_MS]`
      );

    nodeScheduler.scheduleJob(
      forceExecute
        ? `FORCE-${objectIdToString(automatedJob._id)}`
        : objectIdToString(automatedJob._id),
      forceExecute
        ? new Date(
          Date.now() + parseInt(FORCE_EXECUTE_TIME_DELAY_IN_MS.value)
        )
        : cronExpression.expression,
      async (eventFiredAt) => {
        console.log(
          `Automated Job [${automatedJob._id}] executed on ${eventFiredAt}`
        );

        await createAppAutomatedJobLog(
          automatedJob._id,
          forceExecute ? 'FORCE-EXECUTE' : 'EXECUTE',
          `${forceExecute ? 'Force' : ''} Executed Automated Job [${automatedJob._id
          }]`,
          __filename,
          'scheduleAppAutomatedJob => nodeScheduler.scheduleJob'
        );
        (appSmartFunctionService as any)[smartFunction.name](...Object.values(automatedJob.parameters));
      }
    );

    !forceExecute
      ? await createAppAutomatedJobLog(
        automatedJob._id,
        'SCHEDULE',
        `Scheduled Automated Job [${automatedJob._id}]`,
        __filename,
        'scheduleAppAutomatedJob'
      )
      : null;

    return (automatedJob._id);
  } catch (error: any) {
    await createAppAutomatedJobLog(
      automatedJob._id,
      'ERROR',
      error?.message,
      __filename,
      'cancelScheduledJob'
    );
    logBackendError(__filename, error?.messag, null, null, error?.stacke);
    throw httpErrors.InternalServerError(`${error?.message}`);
  }
};

const getScheduledJobs = async (appAutomatedJobId: any): Promise<boolean | Job> => {
  try {
    const scheduledJob = nodeScheduler.scheduledJobs[appAutomatedJobId];
    return (scheduledJob ? scheduledJob : false);
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    throw httpErrors.InternalServerError(`${error?.message}`);
  }
};

const cancelScheduledJob = async (appAutomatedJobId: any): Promise<void> => {
  try {
    const scheduledJob = nodeScheduler.scheduledJobs[appAutomatedJobId];
    if (scheduledJob != undefined) {
      await createAppAutomatedJobLog(
        appAutomatedJobId,
        'CANCEL',
        `Cancelled Automated Job [${appAutomatedJobId}]`,
        __filename,
        'cancelScheduledJob'
      );
    }
    if (scheduledJob !== undefined) scheduledJob.cancel();
  } catch (error: any) {
    await createAppAutomatedJobLog(
      appAutomatedJobId,
      'ERROR',
      error?.message,
      __filename,
      'cancelScheduledJob'
    );
    logBackendError(__filename, error?.message, null, null, error?.stack);
    throw httpErrors.InternalServerError(`${error?.message}`);
  }
};

const createAppAutomatedJobLog = async (
  appAutomatedJobId: mongoose.Types.ObjectId,
  logType: string,
  description: string | null = null,
  scriptPath: string | null = null,
  methodName: string | null = null,
  isDeleted = false
): Promise<void> => {
  try {
    // Construct Data
    const automatedJobLog = new appAutomatedJobLogsModel({
      appAutomatedJobId: appAutomatedJobId,
      type: logType,
      description: description,
      scriptPath: scriptPath,
      methodName: methodName,
      isDeleted: isDeleted === true ? true : false,
    });

    // Save Record in Collection
    await automatedJobLog.save();

  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    throw httpErrors.InternalServerError(`${error?.message}`);
  }
};

export {
  scheduleAppAutomatedJob,
  getScheduledJobs,
  cancelScheduledJob,
  createAppAutomatedJobLog,
};
