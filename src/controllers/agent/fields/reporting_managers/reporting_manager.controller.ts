import { NextFunction, Request, Response } from 'express';
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  getFieldsToInclude,
  logBackendError
} from '../../../../helpers/common/backend.functions';
import httpErrors from 'http-errors';
import { appUserModel } from '../../../../models/agent/agent.model';
import { appReportingManagerModel } from '../../../../models/agent/fields/app_reporting_managers.model';

import {
  CreateAppReportingManagerType,
  DeleteAppReportingManagerType,
  GetAppReportingManagerQueryType,
  GetAppReportingManagerType,
  UpdateAppReportingManagerType,
  joiAppReportingManager
} from '../../../../helpers/joi/agent/fields/reporting_managers/index';
import { MetaDataBody } from '../../../../helpers/shared/shared.type';
// //description: add a reporting manager
// //route: POST /api/v1/reporting_manager/
// //access: private
export const createAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appReportingManagerDetails: CreateAppReportingManagerType =
      await joiAppReportingManager.createAppReportingManagerSchema.validateAsync(req.body);
    // Check if reporting manager exist in Collection
    const doesReportingManagerExist = await appReportingManagerModel.findOne({
      appUserId: appReportingManagerDetails.appUserId,
      isDeleted: false
    });
    if (doesReportingManagerExist)
      throw httpErrors.Conflict(
        `Reporting Manager with app agent Id [${appReportingManagerDetails.appUserId}] already exist.`
      );
    // Check if Agent exist in Collection
    const doesAgentExist = await appUserModel.findOne({
      _id: appReportingManagerDetails.appUserId,
      isDeleted: false
    });
    if (!doesAgentExist)
      throw httpErrors.Conflict(`Agent with Id [${appReportingManagerDetails.appUserId}] does not exist.`);

    // Else Construct Data
    const appReportingManager = new appReportingManagerModel({
      appUserId: appReportingManagerDetails.appUserId
    });
    // Save Record in Collection
    const storeAppReportingManagerDetails = await appReportingManager.save().catch((error: any) => {
      throw httpErrors.UnprocessableEntity(error?.message ? error.message : 'Unable to save record in Database.');
    });
    // Construct Response
    //fetch the user details from the database using the reporting manager id

    //send response as user's details
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appReportingManager: {
            appManagerId: storeAppReportingManagerDetails._id,
            appUserId: storeAppReportingManagerDetails.appUserId,
            createdAt: storeAppReportingManagerDetails.createdAt,
            updatedAt: storeAppReportingManagerDetails.updatedAt
          },
          message: 'Reporting Manager created successfully.'
        }
      });
    }
  } catch (error: any) {
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

// description: get all reporting managers
// route: POST /api/v1/reporting_manager/
// access: private
export const getAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppReportingManagerType =
      await joiAppReportingManager.getAppReportingManagerSchema.validateAsync(req.body);
    compactObject(querySchema);
    const metaData: MetaDataBody = await configureMetaData(querySchema);
    const fieldsToInclude = getFieldsToInclude(metaData.fields);
    const query: GetAppReportingManagerQueryType = { isDeleted: false };
    if (querySchema.appManagerId) query._id = querySchema.appManagerId;
    if (querySchema.appUserId) query.appUserId = querySchema.appUserId;
    if (querySchema.search && querySchema.search.trim() !== '') {
      // Find app_agents with matching email
      const appAgentsWithEmail = await appUserModel
        .find({ email: new RegExp(querySchema.search.trim(), 'i') }, '_id')
        .lean()
        .exec();
      // If any app_agents found, add them to the query for appUserId
      if (appAgentsWithEmail.length > 0) {
        query.appUserId = { $in: appAgentsWithEmail.map((user: any) => user._id) } as any;
      } else {
        // If no matching app_agents found, return an empty result
        res.status(200).send({
          error: false,
          data: {
            appReportingManager: [],
            metaData: {
              sortBy: metaData.sortBy,
              sortOn: metaData.sortOn,
              limit: metaData.limit,
              offset: metaData.offset,
              total_records: 0
            },
            message: 'No reporting managers found for the provided email search.'
          }
        });
        return;
      }
    }
    // Execute the Query
    const appManagers = await appReportingManagerModel
      .find(query, {}, {})
      .populate('appUserId', 'email')
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
      appManagers.map(async (appManager: any) => {
        appManager.appManagerId = appManager._id;
        delete appManager._id;
        delete appManager.__v;
        return appManager;
      })
    );
    const totalRecords = await appReportingManagerModel.find(query).countDocuments();

    convertDateTimeFormat(appManagers);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appReportingManager: appManagers,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
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

export const updateAppReportingManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appReportingManagerDetails: UpdateAppReportingManagerType =
      await joiAppReportingManager.updateAppReportingManagerSchema.validateAsync(req.body);
    // Check if Reporting Manager exist in Collection
    const doesReportingManagerExist = await appReportingManagerModel.findOne({
      _id: { $in: appReportingManagerDetails.appManagerId },
      isDeleted: false
    });

    if (!doesReportingManagerExist)
      throw httpErrors.Conflict(
        `Reporting Manager with Id [${appReportingManagerDetails.appManagerId}] does not exist.`
      );
    // Check if Agent exist in Collection
    const doesAgentExist = await appUserModel.findOne({
      _id: appReportingManagerDetails.appUserId,
      isDeleted: false
    });
    if (!doesAgentExist)
      throw httpErrors.Conflict(`Agent with Id [${appReportingManagerDetails.appUserId}] does not exist.`);

    // Update records in Collection
    await appReportingManagerModel
      .updateOne(
        { _id: { $in: appReportingManagerDetails.appManagerId } },
        {
          appUserId: appReportingManagerDetails.appUserId
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Reporting  Manager updated successfully.'
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
    console.log(req.body);
    const appReportingManagerDetails: DeleteAppReportingManagerType =
      await joiAppReportingManager.deleteAppReportingManagerSchema.validateAsync(req.body);
    // Check if reporting manager exist in Collection
    const appReportingManagers = await appReportingManagerModel
      .find({
        _id: { $in: appReportingManagerDetails.appManagerIds },
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    if (appReportingManagers.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid Designation IDs.`);
    //update the isDeleted field to true
    appReportingManagers.forEach(async appReportingManager => {
      await appReportingManager
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    });
    //send response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        message: 'Reporting Managers deleted successfully.'
      });
    }
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
    const reportingManagers = await appReportingManagerModel.find({ isDeleted: false }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(
        error?.message ? error.message : 'Unable to retrieve records from Database.'
      );
    });
    const userIds = reportingManagers.map((manager: any) => manager.appUserId);
    const users = await appUserModel.find({ _id: { $nin: userIds }, isDeleted: false });
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
