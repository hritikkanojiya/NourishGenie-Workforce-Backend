import appDesignationModel from '../../../../models/agent/fields/app_designation.model';
import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import {
  joiAppDesignation,
  CreateAppDesignationType,
  DeleteAppDesignationType,
  GetAppDesignationType,
  GetSingleDesignation,
  UpdateAppDesignationType,
  GetAppDesignationQueryType
} from '../../../../helpers/joi/agent/fields/designation/index';

import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  getFieldsToInclude,
  logBackendError,
} from '../../../../helpers/common/backend.functions';
import { MetaDataBody } from '../../../../helpers/shared/shared.type';

//description: create a new designation
//route: POST /api/v1/designation
//access: private
export const createAppDesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appDesignationDetails: CreateAppDesignationType = await joiAppDesignation.createAppDesignationSchema.validateAsync(req.body);
    // Check if designation exist in Collection
    const doesDesignationExist = await appDesignationModel.find({
      name: appDesignationDetails.name
    });
    if (doesDesignationExist?.length > 0)
      throw httpErrors.Conflict(`designation [${appDesignationDetails.name}] already exist.`);
    // Else Construct Data
    const appDesignation = new appDesignationModel({
      name: appDesignationDetails.name,
      description: appDesignationDetails.description,
      isDeleted: false
    });
    // Save Record in Collection
    const storeDesignationDetails = await appDesignation.save({})
      .catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    // Send Response
    res.status(200).send({
      error: false,
      data: {
        appDesignation: {
          appDesignationId: storeDesignationDetails._id,
          name: storeDesignationDetails.name,
          description: storeDesignationDetails.description,
          createdAt: storeDesignationDetails.createdAt,
          updatedAt: storeDesignationDetails.updatedAt
        }
      },
      message: 'designation created successfully',
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get all designation
//route: GET /api/v1/designation
//access: private
export const getAppDesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppDesignationType = await joiAppDesignation.getAppDesignationSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(querySchema);

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppDesignationQueryType = { isDeleted: false };

    if (querySchema.appDesignationId) query._id = querySchema.appDesignationId;

    if (querySchema.search)
      query.$or = [
        {
          name: {
            $regex: querySchema.search,
            $options: 'is'
          }
        },
        {
          description: {
            $regex: querySchema.search,
            $options: 'is'
          }
        }
      ];
    // Execute the Query
    const appDesignations = await appDesignationModel
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

    await Promise.all(
      appDesignations.map(async (appDesignation: any) => {
        appDesignation.appDesignationId = appDesignation._id;
        delete appDesignation._id;
        delete appDesignation.__v;
        return appDesignation;
      })
    );
    const totalRecords = await appDesignationModel
      .find(query).countDocuments();
    convertDateTimeFormat(appDesignations);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appDesignations: appDesignations,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Designation fetched successfully.'
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

//description: get single designaiton details
//route: GET /api/v1/department/
//access: private
export const getSingleDesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const getSingleDesignationDetails: GetSingleDesignation = await joiAppDesignation.getSingleDesignationSchema.validateAsync(req.body);
    //check if the dept exists
    const designation = await appDesignationModel.findOne({
      _id: getSingleDesignationDetails.appDesignationId,
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    if (!designation) throw httpErrors.UnprocessableEntity(`Invalid Designation ID.`);
    const designationtDetails = designation;
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appDesignation: {
            appDesignationId: designationtDetails._id,
            name: designationtDetails.name,
            description: designationtDetails.description,
            createdAt: designationtDetails.createdAt,
            updatedAt: designationtDetails.updatedAt
          },
          message: `Designation details fetched successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: update a designation
//route: PUT /api/v1/designation
//access: private
export const updateAppDesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appdesignationDetails: UpdateAppDesignationType = await joiAppDesignation.updateAppDesignationSchema.validateAsync(req.body);
    // Check if designation exist in Collection
    const doesdesignationExist = await appDesignationModel.findOne({
      _id: { $in: appdesignationDetails.appDesignationId },
      isDeleted: false
    });

    if (!doesdesignationExist) throw httpErrors.Conflict(`Group [${appdesignationDetails.name}] does not exist.`);
    // Update records in Collection
    await appDesignationModel.updateOne(
      { _id: { $in: appdesignationDetails.appDesignationId } },
      {
        name: appdesignationDetails.name,
        description: appdesignationDetails.description
      }
    ).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(error.message);
    });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Designation updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: delete a designation
//route: DELETE /api/v1/designation
//access: private
export const deleteAppDesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appDesignationDetails: DeleteAppDesignationType = await joiAppDesignation.deleteAppDesignationSchema.validateAsync(req.body);
    // Update records in Collection
    const appDesignation = await appDesignationModel.find({
      _id: { $in: appDesignationDetails.appDesignationIds },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appDesignation?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid Designation IDs.`);
    //Delete record by updating the isDelete value to true
    appDesignation.forEach(async designation => {
      await designation
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Designation deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
