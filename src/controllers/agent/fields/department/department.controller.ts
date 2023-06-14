import { NextFunction, Request, Response } from 'express';
// import { FilterQuery, SortOrder } from 'mongoose';
// import { GetRequestObject } from 'helpers/shared/shared.type';
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  getFieldsToInclude,
  logBackendError,
} from '../../../../helpers/common/backend.functions';
import appDepartmentModel from '../../../../models/agent/fields/app_department.model';
import httpErrors from 'http-errors';
import {
  joiAppDepartment,
  CreateAppDepartmentType,
  DeleteAppDepartmentType,
  GetAppDepartmentQueryType,
  GetAppDepartmentType,
  GetSingleDepartment,
  UpdateAppDepartmentType,
} from '../../../../helpers/joi/agent/fields/department/index';

import { MetaDataBody } from '../../../../helpers/shared/shared.type';

//description: create a new department
//route: POST /api/v1/department
//access: private
export const createAppDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appDepartmentDetails: CreateAppDepartmentType = await joiAppDepartment.createAppDepartmentSchema.validateAsync(req.body);
    // Check if department exist in Collection
    const doesDepartmentExist = await appDepartmentModel.find({
      name: appDepartmentDetails.name
    });
    if (doesDepartmentExist?.length > 0)
      throw httpErrors.Conflict(`department [${appDepartmentDetails.name}] already exist.`);
    // Else Construct Data
    const appDepartment = new appDepartmentModel({
      name: appDepartmentDetails.name,
      description: appDepartmentDetails.description
    });
    // Save Record in Collection
    const storeDepartmentDetails = (
      await appDepartment.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    // Send Response
    res.status(201).json({
      error: false,
      data: {
        appDepartment: {
          appDepartmentId: storeDepartmentDetails._id,
          name: storeDepartmentDetails.name,
          description: storeDepartmentDetails.description,
          createdAt: storeDepartmentDetails.createdAt,
          updatedAt: storeDepartmentDetails.updatedAt
        }
      },
      message: 'department created successfully',
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get all departments
//route: GET /api/v1/department
//access: private
export const getAppDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppDepartmentType = await joiAppDepartment.getAppDepartmentSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(querySchema);

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppDepartmentQueryType = { isDeleted: false };

    if (querySchema.appDepartmentId) query._id = querySchema.appDepartmentId;

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
    const appDepartments = await appDepartmentModel
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
      appDepartments.map(async (appDepartment: any) => {
        appDepartment.appDepartmentId = appDepartment._id;
        delete appDepartment._id;
        delete appDepartment.__v;
        return appDepartment;
      })
    );
    const totalRecords = await appDepartmentModel.find(query).countDocuments();

    convertDateTimeFormat(appDepartments);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppDepartment: appDepartments,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Department fetched successfully.'
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

//description: get single department details
//route: GET /api/v1/department/
//access: private
export const getSingleDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const getSingleDepartmentDetails: GetSingleDepartment = await joiAppDepartment.getSingleDepartmentSchema.validateAsync(req.body);
    //check if the dept exists
    const department = await appDepartmentModel.findOne({
      _id: getSingleDepartmentDetails.appDepartmentId,
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    if (!department) throw httpErrors.UnprocessableEntity(`Invalid Department ID.`);
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appDepartment: {
            appDepartmentId: department._id,
            name: department.name,
            description: department.description,
            createdAt: department.createdAt,
            updatedAt: department.updatedAt
          },
          message: `Department details fetched successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: delete a department
//route: DELETE /api/v1/department/:id
//access: private
export const deleteAppDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appDepartmentDetails: DeleteAppDepartmentType = await joiAppDepartment.deleteAppDepartmentSchema.validateAsync(req.body);
    // Update records in Collection
    const appDepartment = await appDepartmentModel.find({
      _id: { $in: appDepartmentDetails.appDepartmentIds },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appDepartment?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid Department ID.`);
    //Delete record by updating the isDelete value to true
    appDepartment.forEach(async department => {
      await department
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
          message: `Department deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: update a department
//route: PUT /api/v1/department/
//access: private
export const updateAppDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appDepartmentDetails: UpdateAppDepartmentType = await joiAppDepartment.updateAppDepartmentSchema.validateAsync(req.body);
    // Check if department exist in Collection
    const doesDepartmentExist = await appDepartmentModel.findOne({
      _id: appDepartmentDetails.appDepartmentId,
      isDeleted: false
    });

    if (!doesDepartmentExist) throw httpErrors.Conflict(`Group [${appDepartmentDetails.name}] does not exist.`);
    // Update records in Collection
    await appDepartmentModel.updateOne(
      { _id: { $in: appDepartmentDetails.appDepartmentId } },
      {
        name: appDepartmentDetails.name,
        description: appDepartmentDetails.description
      }
    ).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(error.message);
    });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Department updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
