// Import Packages
import httpErrors from 'http-errors';
import {
  logBackendError,
  compactObject,
  configureMetaData,
  getFieldsToInclude,
  convertDateTimeFormat,
} from '../../helpers/common/backend.functions';

import {
  joiAppConstants,
  CreateAppConstantsType,
  GetAppConstantsType,
  UpdateAppConstantsType,
  DeleteAppConstantsType,
  GetAppDepartmentQueryType,
  AppConstantsType
} from '../../helpers/joi/constants/index'

import { appConstantsModel } from '../../models/constants/constants.model';
import { NextFunction, Request, Response } from 'express';
import { MetaDataBody } from '../../helpers/shared/shared.type';

// Controller Methods
const createAppConstant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appConstantDetails: CreateAppConstantsType = await joiAppConstants.createAppConstantSchema.validateAsync(req.body);

    // Check if constant exist in Collection
    const doesAppConstantExist = await appConstantsModel.find({
      name: appConstantDetails.name,
      isDeleted: false,
    });

    if (doesAppConstantExist?.length > 0)
      throw httpErrors.Conflict(
        `Constant : ${appConstantDetails.name} already Exist.`
      );

    const constant = new appConstantsModel({
      name: appConstantDetails.name,
      value: appConstantDetails.value,
      isAutoLoad: appConstantDetails.isAutoLoad === true ? true : false,
      isDeleted: appConstantDetails.isDeleted === true ? true : false,
    });

    const storeAppConstant = (await constant.save()).toObject();

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appConstant: {
            appConstantId: storeAppConstant._id,
            name: storeAppConstant.name,
            value: storeAppConstant.value,
            isAutoLoad: storeAppConstant.isAutoLoad,
            createdAt: storeAppConstant.createdAt,
            updatedAt: storeAppConstant.updatedAt,
          },
          message: 'Constant created successfully.',
        },
      });
    }
  } catch (error: any) {
    if (error?.isJoi === true) error.status = 422;
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    next(error);
  }
};

const getAppConstants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: GetAppConstantsType = await joiAppConstants.getAppConstantsSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(querySchema);

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppDepartmentQueryType = { isDeleted: false };

    if (querySchema.appConstantId) query._id = querySchema.appConstantId;
    if (querySchema.isAutoLoad) query.isAutoLoad = querySchema.isAutoLoad;
    if (querySchema.search) {
      query.$or = [
        {
          name: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
      ];
    }

    // Execute the Query
    const appConstants = await appConstantsModel
      .find(query, {}, {})
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

    const totalRecords = await appConstantsModel.find(query).countDocuments();

    await Promise.all(
      appConstants.map((appConstant: AppConstantsType) => {
        appConstant.appConstantId = appConstant._id;
        delete appConstant?.isDeleted;
        delete appConstant?.__v;
        delete appConstant?._id;
        return appConstant;
      })
    );

    convertDateTimeFormat(appConstants);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appConstants: appConstants,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Constants fetched successfully',
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

const updateAppConstant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appConstantDetails: UpdateAppConstantsType = await joiAppConstants.updateAppConstantSchema.validateAsync(req.body);

    // Check if constant exist in Collection other than current record
    const doesAppConstantExist = await appConstantsModel.find({
      _id: { $ne: [appConstantDetails.appConstantId] },
      name: appConstantDetails.name,
      isDeleted: false,
    });

    if (doesAppConstantExist?.length > 0)
      throw httpErrors.Conflict(
        `Constant : ${appConstantDetails.name} already Exist.`
      );

    // Update records in Collection
    const appConstant = await appConstantsModel
      .findOne({
        _id: appConstantDetails.appConstantId,
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!appConstant)
      throw httpErrors.UnprocessableEntity(
        `Unable to find constant with id ${appConstantDetails.appConstantId}`
      );

    await appConstant
      .updateOne(appConstantDetails, {
        new: true,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Constant updated successfully.`,
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

const deleteAppConstants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appConstantDetails: DeleteAppConstantsType = await joiAppConstants.deleteAppConstantsSchema.validateAsync(req.body);

    // Update records in Collection
    const appConstants = await appConstantsModel
      .find({
        _id: { $in: appConstantDetails.appConstantIds },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. Error : ${error?.message}`
        );
      });

    if (appConstants?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Constant IDs. Error : Invalid Records.`
      );

    await Promise.all(
      appConstants.map(async (appConstant) => {
        await appConstant.updateOne({
          isDeleted: true,
        });
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Constant deleted successfully.`,
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

// Export Methods
export {
  createAppConstant,
  getAppConstants,
  updateAppConstant,
  deleteAppConstants,
};
