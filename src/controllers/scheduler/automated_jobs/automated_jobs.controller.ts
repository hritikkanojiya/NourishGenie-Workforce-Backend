import httpErrors from 'http-errors';
import {
  joiAppAutomatedJob,
  CreateAppAutomatedJobType,
  UpadteAppAutomatedJobType,
  DeleteAppAutomatedJobType,
  GetAppAutomatedJobQueryType,
  ReadAppAutomatedJobLogsType,
  GetAppAutomatedJobType,
  ReadAppAutomatedJobLogsQueryType,
  ForceExecuteAutomatedJobType,
  ToggleAppAutomatedJobType,
} from '../../../helpers/joi/scheduler/automated_jobs/index'
import { logBackendError, configureMetaData, compactObject, getFieldsToInclude, objectIdToString, arrayDifference, convertDateTimeFormat } from '../../../helpers/common/backend.functions';
import { appAutomatedJobsModel, appAutomatedJobLogsModel } from '../../../models/scheduler/automated_jobs/automated_jobs.model';
import { scheduleAppAutomatedJob, getScheduledJobs, cancelScheduledJob, createAppAutomatedJobLog } from '../../../helpers/service/node_scheduler/node_scheduler.service';
import { appCronExpressionModel } from '../../../models/scheduler/cron_expression/cron_expression.model';
import { appSmartFunctionModel } from '../../../models/scheduler/smart_functions/smart_functions.model';
import { NextFunction } from 'connect';
import { Request, Response } from 'express';
import { MetaDataBody } from 'helpers/shared/shared.type';

const createAppAutomatedJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automatedJobDetails: CreateAppAutomatedJobType =
      await joiAppAutomatedJob.createAppAutomatedJobSchema.validateAsync(req.body);
    // Check if job exist in Collection
    const doesAutomatedJobExist = await appAutomatedJobsModel.find({
      name: automatedJobDetails.name,
      isDeleted: false,
    });

    if (doesAutomatedJobExist?.length > 0)
      throw httpErrors.Conflict(
        `Automated Job : ${automatedJobDetails.name} already Exist.`
      );

    const doesCronExpressionExist = await appCronExpressionModel.findOne({
      _id: automatedJobDetails.appCronExpressionId,
      isDeleted: false,
    });

    if (!doesCronExpressionExist)
      throw httpErrors.Conflict(
        `Invalid Cron Expression ID : ${automatedJobDetails.appCronExpressionId}`
      );

    const doesSmartFunctionsExist = await appSmartFunctionModel.findOne({
      _id: automatedJobDetails.appSmartFunctionId,
      isDeleted: false,
    });

    if (!doesSmartFunctionsExist)
      throw httpErrors.Conflict(
        `Invalid Smart Function ID : ${automatedJobDetails.appSmartFunctionId}`
      );

    const requiredSmartFunctionParams = await __checkSmartFunctionParameters(
      doesSmartFunctionsExist,
      automatedJobDetails.parameters
    );

    if (requiredSmartFunctionParams.length > 0) {
      throw httpErrors.UnprocessableEntity(
        `Parameters [${requiredSmartFunctionParams.join(', ')}] are required.`
      );
    }

    const automatedJob = new appAutomatedJobsModel({
      appCronExpressionId: automatedJobDetails.appCronExpressionId,
      appSmartFunctionId: automatedJobDetails.appSmartFunctionId,
      name: automatedJobDetails.name,
      description: automatedJobDetails.description,
      parameters: automatedJobDetails.parameters,
      isActive: automatedJobDetails.isActive,
      isDeleted: automatedJobDetails.isDeleted === true ? true : false,
    });

    const storeAutomatedJobDetails = (await automatedJob.save()).toObject();

    await createAppAutomatedJobLog(
      storeAutomatedJobDetails._id,
      'CREATE',
      `Created new Automated Job [${storeAutomatedJobDetails._id}]`,
      __filename,
      'createAutomatedJob'
    );

    await scheduleAppAutomatedJob(storeAutomatedJobDetails);

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAutomatedJob: {
            appAutomatedJobId: storeAutomatedJobDetails._id,
            appCronExpressionId: storeAutomatedJobDetails.appCronExpressionId,
            appSmartFunctionId: storeAutomatedJobDetails.appSmartFunctionId,
            name: storeAutomatedJobDetails.name,
            description: storeAutomatedJobDetails.description,
            parameters: storeAutomatedJobDetails.parameters,
            isActive: storeAutomatedJobDetails.isActive,
            createdAt: storeAutomatedJobDetails.createdAt,
            updatedAt: storeAutomatedJobDetails.updatedAt,
          },
          message: 'Automated Job created successfully.',
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getAppAutomatedJobs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const querySchema: GetAppAutomatedJobType =
      await joiAppAutomatedJob.getAppAutomatedJobSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppAutomatedJobQueryType = { isDeleted: false };

    if (querySchema.appAutomatedJobId)
      query._id = querySchema.appAutomatedJobId;
    if (querySchema.appCronExpressionId)
      query.appCronExpressionId = querySchema.appCronExpressionId;
    if (querySchema.appSmartFunctionId)
      query.appSmartFunctionId = querySchema.appSmartFunctionId;
    if (typeof querySchema.isActive === 'boolean')
      query.isActive = querySchema.isActive;
    if (querySchema.search) {
      query.$or = [
        {
          name: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
        {
          description: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
      ];
    }

    // Execute the Query
    const appAutomatedJobs: any = await appAutomatedJobsModel
      .find(query)
      .select(fieldsToInclude)
      .sort({ [metaData.sortOn]: metaData.sortBy })
      .skip(metaData.offset)
      .limit(metaData.limit)
      .lean()
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });

    await Promise.all(
      appAutomatedJobs.map(async (appAutomatedJob: any) => {
        const jobAddedToScheduler = await getScheduledJobs(
          objectIdToString(appAutomatedJob._id)
        );
        appAutomatedJob.jobAddedToScheduler = jobAddedToScheduler
          ? true
          : false;
        appAutomatedJob.appAutomatedJobId = appAutomatedJob._id;
        delete appAutomatedJob?._id;
        delete appAutomatedJob?.__v;
        delete appAutomatedJob?.isDeleted;
        return appAutomatedJob;
      })
    );

    const totalRecords = await appAutomatedJobsModel
      .find(query)
      .countDocuments();

    convertDateTimeFormat(appAutomatedJobs);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAutomatedJobs: appAutomatedJobs,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Automated Jobs fetched successfully.',
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const updateAppAutomatedJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automatedJobDetails: UpadteAppAutomatedJobType =
      await joiAppAutomatedJob.updateAppAutomatedJobSchema.validateAsync(req.body);

    // Check if automated job exist in Collection other than current record
    const doesAutomatedJobExist = await appAutomatedJobsModel.find({
      _id: { $ne: [automatedJobDetails.appAutomatedJobId] },
      name: automatedJobDetails.name,
      isDeleted: false,
    });

    if (doesAutomatedJobExist?.length > 0)
      throw httpErrors.Conflict(
        `Automated Job : ${automatedJobDetails.name} already Exist.`
      );

    const doesCronExpressionExist = await appCronExpressionModel.findOne({
      _id: automatedJobDetails.appCronExpressionId,
      isDeleted: false,
    });

    if (!doesCronExpressionExist)
      throw httpErrors.Conflict(
        `Invalid Cron Expression ID : ${automatedJobDetails.appCronExpressionId}`
      );

    const doesSmartFunctionsExist = await appSmartFunctionModel.findOne({
      _id: automatedJobDetails.appSmartFunctionId,
      isDeleted: false,
    });

    if (!doesSmartFunctionsExist)
      throw httpErrors.Conflict(
        `Invalid Smart Function ID : ${automatedJobDetails.appSmartFunctionId}`
      );

    const requiredSmartFunctionParams = await __checkSmartFunctionParameters(
      doesSmartFunctionsExist,
      automatedJobDetails.parameters ? automatedJobDetails.parameters : []
    );

    if (requiredSmartFunctionParams.length > 0) {
      throw httpErrors.UnprocessableEntity(
        `Parameters [${requiredSmartFunctionParams.join(', ')}] are required.`
      );
    }

    // Update records in Collection
    const automatedJob = await appAutomatedJobsModel
      .findOne({
        _id: automatedJobDetails.appAutomatedJobId,
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!automatedJob)
      throw httpErrors.UnprocessableEntity(
        `Unable to find automated job with id ${automatedJobDetails.appAutomatedJobId}`
      );

    const updatedAutomatedJobDetails = await appAutomatedJobsModel
      .findOneAndUpdate(
        {
          _id: automatedJobDetails.appAutomatedJobId,
          isDeleted: false,
        },
        automatedJobDetails,
        {
          returnDocument: 'after',
        }
      )
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error updating records from DB ${error?.message}`
        );
      });

    await createAppAutomatedJobLog(
      automatedJobDetails.appAutomatedJobId,
      'UPDATE',
      `Updated Automated Job [${automatedJobDetails.appAutomatedJobId}]`,
      __filename,
      'updateAutomatedJob'
    );

    await cancelScheduledJob(automatedJobDetails.appAutomatedJobId);

    await scheduleAppAutomatedJob(updatedAutomatedJobDetails);

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Automated Job updated successfully.',
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const deleteAppAutomatedJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const automatedJobDetails: DeleteAppAutomatedJobType =
      await joiAppAutomatedJob.deleteAppAutomatedJobSchema.validateAsync(req.body);

    // Update records in Collection
    const automatedJobs = await appAutomatedJobsModel
      .find({
        _id: { $in: automatedJobDetails.appAutomatedJobIds },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. ${error?.message}`
        );
      });

    if (automatedJobs?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Automated Job IDs. Error : Invalid Records.`
      );

    await Promise.all(
      automatedJobs.map(async (automatedJob) => {
        await automatedJob.updateOne({
          isDeleted: true,
        });

        await createAppAutomatedJobLog(
          automatedJob._id,
          'DELETE',
          `Deleted Automated Job [${automatedJob._id}]`,
          __filename,
          'deleteAutomatedJob'
        );

        await cancelScheduledJob(objectIdToString(automatedJob._id));
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Automated Job deleted successfully.`,
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const toggleAppAutomatedJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const automatedJobDetails: ToggleAppAutomatedJobType =
      await joiAppAutomatedJob.toggleAppAutomatedJobSchema.validateAsync(req.body);

    // Update records in Collection
    const appAutomatedJobs = await appAutomatedJobsModel
      .find({
        _id: { $in: automatedJobDetails.appAutomatedJobIds },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. Error : ${error?.message}`
        );
      });

    if (appAutomatedJobs?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Automated Job IDs. Error : Invalid Records.`
      );

    await Promise.all(
      appAutomatedJobs.map(async (appAutomatedJob) => {
        await appAutomatedJob.updateOne({
          isActive: automatedJobDetails.isActive === false ? false : true,
        });

        await createAppAutomatedJobLog(
          appAutomatedJob._id,
          'TOGGLE',
          `Toggled Automated Job [${appAutomatedJob._id}] state to ${automatedJobDetails.isActive === true ? 'Active' : 'Inactive'
          } `,
          __filename,
          'toggleAutomatedJob'
        );

        await cancelScheduledJob(objectIdToString(appAutomatedJob._id));
        if (automatedJobDetails.isActive === true) {
          const automatedJobDetails = await appAutomatedJobsModel.findOne({
            _id: appAutomatedJob._id,
            isDeleted: false,
          });

          await scheduleAppAutomatedJob(automatedJobDetails);
        }
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Configuration updated successfully.`,
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const forceExecuteAutomatedJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const automatedJobDetails: ForceExecuteAutomatedJobType =
      await joiAppAutomatedJob.forceExecuteAutomatedJobSchema.validateAsync(
        req.body
      );

    const automatedJobs = await appAutomatedJobsModel
      .find({
        _id: { $in: automatedJobDetails.appAutomatedJobIds },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. ${error?.message}`
        );
      });

    if (automatedJobs?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Automated Job IDs. Error : Invalid Records.`
      );

    await Promise.all(
      automatedJobs.map(async (automatedJob) => {
        await scheduleAppAutomatedJob(automatedJob, true);
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Automated Job will be executed in 5 Seconds.`,
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const readAppAutomatedJobLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: ReadAppAutomatedJobLogsType = await joiAppAutomatedJob.readAppAutomatedJobLogsSchema.validateAsync(
      req.body
    );

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: ReadAppAutomatedJobLogsQueryType = { isDeleted: false };

    if (querySchema.appAutomatedJobId)
      query.appAutomatedJobId = querySchema.appAutomatedJobId;

    // Execute the Query
    const automatedJobLogs: any = await appAutomatedJobLogsModel
      .find(query)
      .select(fieldsToInclude)
      .sort({ [metaData.sortOn]: metaData.sortBy })
      .skip(metaData.offset)
      .limit(metaData.limit)
      .lean()
      .catch(error => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });

    const totalRecords = await appAutomatedJobLogsModel
      .find(query)
      .countDocuments();

    await Promise.all(
      automatedJobLogs.map(async (automatedJobLog: any) => {
        automatedJobLog.appAutomatedJobLogsId = automatedJobLog._id;
        delete automatedJobLog?._id;
        delete automatedJobLog?.__v;
        delete automatedJobLog?.isDeleted;
        return automatedJobLog;
      })
    );

    convertDateTimeFormat(automatedJobLogs);

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          automatedJobLogs: automatedJobLogs,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Automated Job Logs retrieved successfully.',
        },
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

// Private Methods
const __checkSmartFunctionParameters = async (smartFunction: any, automatedJobParameters: object): Promise<string[]> => {
  try {
    const requiredParams: string[] = smartFunction.parameters
      .filter((params: any) => {
        return params.required === true;
      })
      .map((params: any) => {
        return params.parameterName;
      });
    if (requiredParams.length > 0) {
      return arrayDifference(requiredParams, [Object.keys(automatedJobParameters)]);
    } else return [];
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    throw httpErrors.InternalServerError(`${error?.message}`);
  }
};

export {
  createAppAutomatedJob,
  getAppAutomatedJobs,
  updateAppAutomatedJob,
  deleteAppAutomatedJob,
  toggleAppAutomatedJob,
  forceExecuteAutomatedJob,
  readAppAutomatedJobLogs,
};
