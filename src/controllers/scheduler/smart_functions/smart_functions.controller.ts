import mongoose from 'mongoose';

import httpErrors from 'http-errors';
import { logBackendError, configureMetaData, compactObject, getFieldsToInclude, convertDateTimeFormat } from '../../../helpers/common/backend.functions';
import { appSmartFunctionModel } from '../../../models/scheduler/smart_functions/smart_functions.model';
import * as appSmartFunctionService from '../../../helpers/service/smart_functions/smart_functions.service';
import { appAutomatedJobsModel } from '../../../models/scheduler/automated_jobs/automated_jobs.model';
import {
  joiAppSmartFunction,
  CreateAppSmartFunctionType,
  UpadteAppSmartFunctionType,
  DeleteAppSmartFunctionType,
  GetAppSmartFunctionQueryType,
  GetAppSmartFunctionType
} from '../../../helpers/joi/scheduler/smart_functions/index'
import { NextFunction, Request, Response } from 'express';
import { MetaDataBody } from 'helpers/shared/shared.type';

const createAppSmartFunction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const smartFunctionDetails: CreateAppSmartFunctionType =
      await joiAppSmartFunction.createAppSmartFunctionSchema.validateAsync(
        req.body
      );

    // Check if smart function exist in Collection
    const doesSmartFunctionsExist = await appSmartFunctionModel.find({
      name: smartFunctionDetails.name,
      isDeleted: false,
    });

    if (doesSmartFunctionsExist?.length > 0)
      throw httpErrors.Conflict(
        `Smart Function: ${smartFunctionDetails.name} already Exist.`
      );

    const smartFunctionsArray = await __checkAppSmartFunction();
    console.log(smartFunctionsArray);

    if (
      !(
        Array.isArray(smartFunctionsArray) &&
        smartFunctionsArray.includes(smartFunctionDetails.name)
      )
    )
      throw httpErrors.Conflict(
        `Smart Function: ${smartFunctionDetails.name} does not exist in module.`
      );

    const smartFunction = new appSmartFunctionModel({
      name: smartFunctionDetails.name,
      description: smartFunctionDetails.description,
      parameters: smartFunctionDetails.parameters,
      isDeleted: smartFunctionDetails.isDeleted === true ? true : false,
    });

    const storeSmartFunctionDetails = (await smartFunction.save()).toObject();

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appSmartFunction: {
            appSmartFunctionId: storeSmartFunctionDetails._id,
            name: storeSmartFunctionDetails.name,
            description: storeSmartFunctionDetails.description,
            parameters: storeSmartFunctionDetails.parameters,
            createdAt: storeSmartFunctionDetails.createdAt,
            updatedAt: storeSmartFunctionDetails.updatedAt,
          },
          message: 'Smart Function created successfully.',
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

const getAppSmartFunctions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const querySchema: GetAppSmartFunctionType =
      await joiAppSmartFunction.getAppSmartFunctionSchema.validateAsync(
        req.body
      );

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppSmartFunctionQueryType = { isDeleted: false };

    if (querySchema.appSmartFunctionId)
      query._id = querySchema.appSmartFunctionId;

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
    const appSmartFunctions: any = await appSmartFunctionModel
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


    const totalRecords = await appSmartFunctionModel
      .find(query)
      .countDocuments();

    await Promise.all(
      appSmartFunctions.map((appSmartFunction: any) => {
        appSmartFunction.appSmartFunctionId = appSmartFunction._id;
        delete appSmartFunction?._id;
        delete appSmartFunction?.__v;
        delete appSmartFunction?.isDeleted;
        return appSmartFunction;
      })
    );

    convertDateTimeFormat(appSmartFunctions);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appSmartFunctions: appSmartFunctions,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Smart Functions fetched successfully',
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

const updateAppSmartFunction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const smartFunctionDetails: UpadteAppSmartFunctionType =
      await joiAppSmartFunction.updateAppSmartFunctionSchema.validateAsync(
        req.body
      );

    // Check if smart function exist in Collection other than current record
    const doesSmartFunctionsExist = await appSmartFunctionModel.find({
      _id: { $ne: [smartFunctionDetails.appSmartFunctionId] },
      name: smartFunctionDetails.name,
      isDeleted: false,
    });

    if (doesSmartFunctionsExist?.length > 0)
      throw httpErrors.Conflict(
        `Smart Function : ${smartFunctionDetails.name} already Exist.`
      );

    // Update records in Collection
    const appSmartFunction = await appSmartFunctionModel
      .findOne({
        _id: smartFunctionDetails.appSmartFunctionId,
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!appSmartFunction)
      throw httpErrors.UnprocessableEntity(
        `Unable to find Smart Function with id ${smartFunctionDetails.appSmartFunctionId}`
      );

    const smartFunctionsArray = await __checkAppSmartFunction();

    if (
      !(
        Array.isArray(smartFunctionsArray) &&
        smartFunctionsArray.includes(smartFunctionDetails.name)
      )
    )
      throw httpErrors.Conflict(
        `Smart Function: ${smartFunctionDetails.name} does not exist in module.`
      );

    await appSmartFunction
      .updateOne(smartFunctionDetails, {
        new: true,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Smart Function updated successfully.',
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

const deleteAppSmartFunction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const smartFunctionDetails: DeleteAppSmartFunctionType =
      await joiAppSmartFunction.deleteAppSmartFunctionSchema.validateAsync(
        req.body
      );

    // Update records in Collection
    const smartFunctions = await appSmartFunctionModel
      .find({
        _id: {
          $in: smartFunctionDetails.appSmartFunctionIds,
        },
        isDeleted: false,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. Error : ${error?.message}`
        );
      });

    if (smartFunctions?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Smart Function IDs. Error : Invalid Records.`
      );

    await Promise.all(
      smartFunctions.map(async (smartFunction) => {
        await __isAppSmartFunctionAttached(smartFunction.id);
        await smartFunction.updateOne({
          isDeleted: true,
        });
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Smart Function deleted successfully.`,
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
const __checkAppSmartFunction = async (): Promise<string[]> => {
  try {
    const smartFunctionsArray = [];
    for (const key in appSmartFunctionService as any) {
      if (Object.hasOwnProperty.call(appSmartFunctionService, key)) {
        if (typeof (appSmartFunctionService as any)[key] === 'function') {
          smartFunctionsArray.push((appSmartFunctionService as any)[key].name);
        }
      }
    }
    return (smartFunctionsArray);
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    return (error);
  }
};

const getterCheckAppSmartFunction = (): Promise<string[]> => {
  try {
    return __checkAppSmartFunction();
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    return error;
  }
};

const __isAppSmartFunctionAttached = async (appSmartFunctionId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    const appAutomatedJobs = await appAutomatedJobsModel.find({
      appSmartFunctionId: appSmartFunctionId,
      isDeleted: false,
    });

    if (appAutomatedJobs?.length > 0) {
      Promise.reject(
        new Error(
          'Cannot delete smart functions that are attached with Automated Jobs.'
        )
      );
    }
    Promise.resolve();
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    Promise.reject(error);
  }

};

export {
  createAppSmartFunction,
  getAppSmartFunctions,
  updateAppSmartFunction,
  deleteAppSmartFunction,
  getterCheckAppSmartFunction,
};
