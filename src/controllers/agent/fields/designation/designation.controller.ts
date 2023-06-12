import AppDesignation from '../../../../models/account_fields/app_designation.model';
import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import {
  CreateAppDesignationType,
  DeleteAppDesignationType,
  GetAppDesignationType,
  GetSingleDesignation
} from '../../../../helpers/joi/permissions/designation/designation.joi.types';
import {
  createAppDesignationSchema,
  deleteAppDesignationSchema,
  getAppDesignationSchema,
  getSingleDesignationSchema,
  updateAppDesignationSchema
} from '../../../../helpers/joi/permissions/designation/designation.validation_schema';
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  getFieldsToInclude,
  // configureMetaData,
  // convertDateTimeFormat,
  // getFieldsToInclude,
  logBackendError,
  stringToObjectId
  // stringToObjectId
  // stringToObjectId
} from '../../../../helpers/common/backend.functions';
import { GetRequestObject } from 'helpers/shared/shared.type';
import { FilterQuery, SortOrder } from 'mongoose';
import { UpdateAppDesignationType } from '../../../../helpers/joi/permissions/designation/designation.joi.types';
type GetDesignationQuery = {
  _id?: string;
  $or?: unknown;
  isDeleted?: boolean;
};

//description: create a new designation
//route: POST /api/v1/designation
//access: private
export const createAppdesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appdesignationDetails: CreateAppDesignationType = await createAppDesignationSchema.validateAsync(req.body);
    // Check if designation exist in Collection
    const doesdesignationExist = await AppDesignation.find({
      name: appdesignationDetails.name
    });
    if (doesdesignationExist?.length > 0)
      throw httpErrors.Conflict(`designation [${appdesignationDetails.name}] already exist.`);
    // Else Construct Data
    const appdesignation = new AppDesignation({
      name: appdesignationDetails.name,
      description: appdesignationDetails.description
    });
    // Save Record in Collection
    const storedesignationDetails = (
      await appdesignation.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    // Send Response
    res.status(201).json({
      status: 'success',
      message: 'designation created successfully',
      data: {
        designation: storedesignationDetails
      }
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
export const getAppdesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppDesignationType = await getAppDesignationSchema.validateAsync(req.body);
    compactObject(querySchema);
    const { sortBy, sortOn, limit, offset, fields } = await configureMetaData(
      querySchema as unknown as GetRequestObject
    );
    const fieldsToInclude = getFieldsToInclude(fields);
    const query: GetDesignationQuery = { isDeleted: false };

    if (querySchema.appDesignationId) query._id = querySchema.appDesignationId;
    //if (querySchema.isAdministrator) query.isAdministrator = querySchema.isAdministrator;
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
    const appdesignation = await AppDesignation.find(query as FilterQuery<GetDesignationQuery>, {}, {})
      .select(fieldsToInclude)
      .sort({ [sortOn]: sortBy } as { [key: string]: SortOrder })
      .skip(offset)
      .limit(limit)
      .lean()
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });

    await Promise.all(
      appdesignation.map(async (AppDesignation: any) => {
        AppDesignation.AppDesignationId = AppDesignation._id;
        delete AppDesignation._id;
        delete AppDesignation.__v;
        return AppDesignation;
      })
    );
    const totalRecords = await AppDesignation.find(query as FilterQuery<GetDesignationQuery>).countDocuments();
    convertDateTimeFormat(appdesignation);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppDesignation: appdesignation,
          metaData: {
            sortBy: sortBy,
            sortOn: sortOn,
            limit: limit,
            offset: offset,
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
    const getSingleDesignationDetails: GetSingleDesignation = await getSingleDesignationSchema.validateAsync(req.body);
    //check if the dept exists
    const designation = await AppDesignation.findOne({
      _id: stringToObjectId(getSingleDesignationDetails.appDesignationId),
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    if (!designation) throw httpErrors.UnprocessableEntity(`Invalid Designation ID.`);
    const designationtDetails = designation.toObject();
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          designation: designationtDetails,
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
export const updateAppdesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appdesignationDetails: UpdateAppDesignationType = await updateAppDesignationSchema.validateAsync(req.body);
    // Check if designation exist in Collection
    const doesdesignationExist = await AppDesignation.findOne({
      _id: { $in: stringToObjectId(appdesignationDetails.appDesignationId) },
      isDeleted: false
    });

    if (!doesdesignationExist) throw httpErrors.Conflict(`Group [${appdesignationDetails.name}] does not exist.`);
    // Update records in Collection
    await AppDesignation.updateOne(
      { _id: { $in: stringToObjectId(appdesignationDetails.appDesignationId) } },
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
export const deleteAppdesignation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appdesignationDetails: DeleteAppDesignationType = await deleteAppDesignationSchema.validateAsync(req.body);
    // Update records in Collection
    const appdesignation = await AppDesignation.find({
      _id: { $in: stringToObjectId(appdesignationDetails.appDesignationId) },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appdesignation?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid Designation ID.`);
    //Delete record by updating the isDelete value to true
    appdesignation.forEach(async designation => {
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
