import { NextFunction, Request, Response } from 'express';
// import { FilterQuery, SortOrder } from 'mongoose';
// import { GetRequestObject } from 'helpers/shared/shared.type';
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
} from '../../../../helpers/common/backend.functions';
import Appdepartment from '../../../../models/account_fields/app_department.model';
import httpErrors from 'http-errors';
import {
  CreateAppDepartmentType,
  DeleteAppDepartmentType,
  GetAppDepartmentType,
  UpdateAppDepartmentType
} from '../../../../helpers/joi/permissions/department/department.joi.types';
import {
  createAppDepartmentSchema,
  deleteAppDepartmentSchema,
  getAppDepartmentSchema,
  updateAppDepartmentSchema
} from '../../../../helpers/joi/permissions/department/department.validation_schema';
import { GetRequestObject } from 'helpers/shared/shared.type';
import { FilterQuery, SortOrder } from 'mongoose';

type GetDepartmentQuery = {
  _id?: string;
  $or?: unknown;
  isDeleted?: boolean;
};

//description: create a new department
//route: POST /api/v1/department
//access: private
export const createAppdepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appdepartmentDetails: CreateAppDepartmentType = await createAppDepartmentSchema.validateAsync(req.body);
    // Check if department exist in Collection
    const doesdepartmentExist = await Appdepartment.find({
      name: appdepartmentDetails.name
    });
    if (doesdepartmentExist?.length > 0)
      throw httpErrors.Conflict(`department [${appdepartmentDetails.name}] already exist.`);
    // Else Construct Data
    const appdepartment = new Appdepartment({
      name: appdepartmentDetails.name,
      description: appdepartmentDetails.description
    });
    // Save Record in Collection
    const storedepartmentDetails = (
      await appdepartment.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    // Send Response
    res.status(201).json({
      status: 'success',
      message: 'department created successfully',
      data: {
        department: storedepartmentDetails
      }
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
export const getAppdepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const querySchema: GetAppDepartmentType = await getAppDepartmentSchema.validateAsync(req.body);
    compactObject(querySchema);
    const { sortBy, sortOn, limit, offset, fields } = await configureMetaData(
      querySchema as unknown as GetRequestObject
    );
    const fieldsToInclude = getFieldsToInclude(fields);
    const query: GetDepartmentQuery = { isDeleted: false };
    if (querySchema.appDepartmentId) query._id = querySchema.appDepartmentId;
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
    const appdepartment = await Appdepartment.find(query as FilterQuery<GetDepartmentQuery>, {}, {})
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
      appdepartment.map(async (AppDepartment: any) => {
        AppDepartment.AppDepartmentId = AppDepartment._id;
        delete AppDepartment._id;
        delete AppDepartment.__v;
        return AppDepartment;
      })
    );
    const totalRecords = await Appdepartment.find(query as FilterQuery<GetDepartmentQuery>).countDocuments();

    convertDateTimeFormat(appdepartment);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppDepartment: appdepartment,
          metaData: {
            sortBy: sortBy,
            sortOn: sortOn,
            limit: limit,
            offset: offset,
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

//description: delete a department
//route: DELETE /api/v1/department/:id
//access: private
export const deleteAppdepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appdepartmentDetails: DeleteAppDepartmentType = await deleteAppDepartmentSchema.validateAsync(req.body);
    // Update records in Collection
    const appdepartment = await Appdepartment.find({
      _id: { $in: stringToObjectId(appdepartmentDetails.appDepartmentId) },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appdepartment?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid Department ID.`);
    //Delete record by updating the isDelete value to true
    appdepartment.forEach(async department => {
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
export const updateAppdepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appdepartmentDetails: UpdateAppDepartmentType = await updateAppDepartmentSchema.validateAsync(req.body);
    // Check if department exist in Collection
    const doesdepartmentExist = await Appdepartment.findOne({
      _id: { $in: stringToObjectId(appdepartmentDetails.appDepartmentId) },
      isDeleted: false
    });

    if (!doesdepartmentExist) throw httpErrors.Conflict(`Group [${appdepartmentDetails.name}] does not exist.`);
    // Update records in Collection
    await Appdepartment.updateOne(
      { _id: { $in: stringToObjectId(appdepartmentDetails.appDepartmentId) } },
      {
        name: appdepartmentDetails.name,
        description: appdepartmentDetails.description
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
