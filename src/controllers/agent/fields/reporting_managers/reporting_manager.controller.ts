import { NextFunction, Request, Response } from 'express';
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  getFieldsToInclude,
  // compactObject,
  // configureMetaData,
  // getFieldsToInclude,
  // configureMetaData,
  // convertDateTimeFormat,
  // getFieldsToInclude,
  logBackendError,
  stringToObjectId
  // stringToObjectId
  // stringToObjectId
} from '../../../../helpers/common/backend.functions';
import httpErrors from 'http-errors';
import AppUserSchema from '../../../../models/accounts/app_user.model';
import AppReportingManager from '../../../../models/account_fields/app_reporting_managers.model';
import {
  createAppReportingManagerSchema,
  deleteAppReportingManagerSchema,
  getAppReportingManagerSchema
} from '../../../../helpers/joi/permissions/reporting_managers/reporting_managers.validation_schema';
import {
  CreateAppReportingManagerType,
  DeleteAppReportingManagerType,
  GetAppReportingManagerType
} from '../../../../helpers/joi/permissions/reporting_managers/reporting_managers.joi.types';
import { GetRequestObject } from '../../../../helpers/shared/shared.type';
import { FilterQuery, SortOrder } from 'mongoose';

// //description: add a reporting manager
// //route: POST /api/v1/reporting_manager/
// //access: private
export const createAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appReportingManagerDetails: CreateAppReportingManagerType =
      await createAppReportingManagerSchema.validateAsync(req.body);
    // Check if reporting manager exist in Collection
    const doesReportingManagerExist = await AppReportingManager.find({
      _id: stringToObjectId(appReportingManagerDetails.ReportingManagerId)
    });
    if (doesReportingManagerExist?.length > 0)
      throw httpErrors.Conflict(`Reporting Manager [${appReportingManagerDetails.ReportingManagerId}] already exist.`);
    // Else Construct Data
    const appReportingManager = new AppReportingManager({
      appUserId: appReportingManagerDetails.ReportingManagerId
    });
    // Save Record in Collection
    await appReportingManager.save().catch((error: any) => {
      throw httpErrors.UnprocessableEntity(error?.message ? error.message : 'Unable to save record in Database.');
    });
    // Construct Response
    //fetch the user details from the database using the reporting manager id
    const reportingManagerDetails = await AppUserSchema.findOne({
      _id: stringToObjectId(appReportingManagerDetails.ReportingManagerId)
    });
    //send response as user's details

    res.status(201).json({
      error: false,
      message: `Reporting Manager [${appReportingManagerDetails.ReportingManagerId}] created successfully.`,
      data: reportingManagerDetails
    });
  } catch (error: any) {
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
type GetReportingManagerQuery = {
  _id?: string;
  $or?: unknown;
  isDeleted?: boolean;
};

// description: get all reporting managers
// route: POST /api/v1/reporting_manager/
// access: private
export const getAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppReportingManagerType = await getAppReportingManagerSchema.validateAsync(req.body);
    compactObject(querySchema);
    const { sortBy, sortOn, limit, offset, fields } = await configureMetaData(
      querySchema as unknown as GetRequestObject
    );
    const fieldsToInclude = getFieldsToInclude(fields);
    const query: GetReportingManagerQuery = { isDeleted: false };
    // Execute the Query
    const appmanager = await AppReportingManager.find(query as FilterQuery<GetReportingManagerQuery>, {}, {})
      .select(fieldsToInclude)
      .sort({ [sortOn]: sortBy } as { [key: string]: SortOrder })
      .skip(offset)
      .limit(limit)
      .populate('appUserId', 'email')
      .lean()
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });
    const totalRecords = await AppReportingManager.find(
      query as FilterQuery<GetReportingManagerQuery>
    ).countDocuments();

    convertDateTimeFormat(appmanager);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppReportingManager: appmanager,
          metaData: {
            sortBy: sortBy,
            sortOn: sortOn,
            limit: limit,
            offset: offset,
            total_records: totalRecords
          },
          message: 'Reporting Managers fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: delete a reporting manager
//route: POST /api/v1/reporting_manager/
//access: private
export const deleteAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appReportingManagerDetails: DeleteAppReportingManagerType =
      await deleteAppReportingManagerSchema.validateAsync(req.body);
    // Check if reporting manager exist in Collection
    const doesReportingManagerExist = await AppReportingManager.find({
      _id: stringToObjectId(appReportingManagerDetails.ReportingManagerId)
    });
    if (!doesReportingManagerExist)
      throw httpErrors.Conflict(`Reporting Manager [${appReportingManagerDetails.ReportingManagerId}] does not exist.`);
    //update the isDeleted field to true
    const deleteReportingManager = await AppReportingManager.updateOne(
      { _id: stringToObjectId(appReportingManagerDetails.ReportingManagerId) },
      { $set: { isDeleted: true } }
    );
    //send response
    res.status(201).json({
      error: false,
      message: `Reporting Manager [${appReportingManagerDetails.ReportingManagerId}] deleted successfully.`,
      data: deleteReportingManager
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get all non reporting managers
//route: POST /api/v1/reporting_manager/
//access: private
export const getNonReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reportingManagers = await AppReportingManager.find({ isDeleted: false }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(
        error?.message ? error.message : 'Unable to retrieve records from Database.'
      );
    });
    const userIds = reportingManagers.map(manager => manager.appUserId);
    const users = await AppUserSchema.find({ _id: { $nin: userIds } });
    //send response
    res.status(201).json({
      message: `Non Reporting Managers fetched successfully.`,
      data: users
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
