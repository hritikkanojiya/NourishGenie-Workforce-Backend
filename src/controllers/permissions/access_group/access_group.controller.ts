import httpErrors from 'http-errors';
import AccessGroup from '../../../models/permissions/access_group/access_group.model';
// import * as joiAppAccessGroup from '../../../helpers/joi/permissions/accessGroup/access_group.validation_schema';
// import { CreateAppAccessGroupType, GetAppAccessGroupType, DeleteAppAccessGroupType, UpdateAppAccessGroupType } from '../../../helpers/joi/permissions/accessGroup/access_group.joi.types';
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  logBackendError,
  getFieldsToInclude,
  stringToObjectId
} from '../../../helpers/common/backend.functions';
import { NextFunction, Request, Response } from 'express';
import { FilterQuery, SortOrder } from 'mongoose';
import { GetRequestObject } from '../../../helpers/shared/shared.type';
import {
  CreateAppAccessGroupType,
  DeleteAppAccessGroupType,
  GetAppAccessGroupType,
  UpdateAppAccessGroupType,
  createAppAccessGroupSchema,
  deleteAppAccessGroupSchema,
  getAppAccessGroupSchema,
  updateAppAccessGroupSchema
} from '../../../helpers/joi/permissions/accessGroup';

type GetAccessGroupQuery = {
  _id?: string;
  isDeleted: boolean;
  isAdministrator?: boolean;
  $or?: unknown;
};

const createAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appAccessGroupDetails: CreateAppAccessGroupType = await createAppAccessGroupSchema.validateAsync(req.body);

    // Check if group exist in Collection
    const doesGroupExist = await AccessGroup.find({
      name: appAccessGroupDetails.name
    });

    if (doesGroupExist?.length > 0) throw httpErrors.Conflict(`Group [${appAccessGroupDetails.name}] already exist.`);

    // Construct Data
    const appAccessGroup = new AccessGroup({
      name: appAccessGroupDetails.name,
      description: appAccessGroupDetails.description
      // isAdministrator: appAccessGroupDetails.isAdministrator === true ? true : false,
      // isDeleted: appAccessGroupDetails.isDeleted === true ? true : false
    });

    // Save Record in Collection
    const storeAccessGroupDetails = (
      await appAccessGroup.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAccessGroup: {
            appAccessGroupId: storeAccessGroupDetails._id,
            name: storeAccessGroupDetails.name,
            description: storeAccessGroupDetails.description
          },
          message: 'Access Group created successfully'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: GetAppAccessGroupType = await getAppAccessGroupSchema.validateAsync(req.body);

    compactObject(querySchema);

    const { sortBy, sortOn, limit, offset, fields } = await configureMetaData(
      querySchema as unknown as GetRequestObject
    );

    const fieldsToInclude = getFieldsToInclude(fields);

    const query: GetAccessGroupQuery = { isDeleted: false };

    if (querySchema.appAccessGroupId) query._id = querySchema.appAccessGroupId;

    if (querySchema.isAdministrator) query.isAdministrator = querySchema.isAdministrator;

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
    const appAccessGroups = await AccessGroup.find(query as FilterQuery<GetAccessGroupQuery>, {}, {})
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
      appAccessGroups.map(async (appAccessGroup: any) => {
        appAccessGroup.appAccessGroupId = appAccessGroup._id;
        // appAccessGroup.totalAppAgents = await appAgentModel
        //   .find({
        //     appAccessGroupId: appAccessGroup._id,
        //   })
        //   .countDocuments();

        delete appAccessGroup._id;
        delete appAccessGroup.isDeleted;
        delete appAccessGroup.__v;
        return appAccessGroup;
      })
    );

    const totalRecords = await AccessGroup.find(query as FilterQuery<GetAccessGroupQuery>).countDocuments();

    convertDateTimeFormat(appAccessGroups);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAccessGroups: appAccessGroups,
          metaData: {
            sortBy: sortBy,
            sortOn: sortOn,
            limit: limit,
            offset: offset,
            total_records: totalRecords
          },
          message: 'Access group fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const updateAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appAccessGroupDetails: UpdateAppAccessGroupType = await updateAppAccessGroupSchema.validateAsync(req.body);

    // Check if access group exist in Collection other than current record
    const doesGroupExist = await AccessGroup.find({
      _id: { $ne: [stringToObjectId([appAccessGroupDetails.appAccessGroupId])] },
      name: appAccessGroupDetails.name
    });

    if (doesGroupExist?.length > 0) throw httpErrors.Conflict(`Group [${appAccessGroupDetails.name}] already exist.`);

    // Update records in Collection
    const appAccessGroup = await AccessGroup.findOne({
      _id: stringToObjectId([appAccessGroupDetails.appAccessGroupId]),
      isDeleted: false
    }).catch(() => {
      throw httpErrors.UnprocessableEntity(
        `Unable to find access group with id ${appAccessGroupDetails.appAccessGroupId}`
      );
    });

    if (!appAccessGroup)
      throw httpErrors.UnprocessableEntity(
        `Unable to find access group with id ${appAccessGroupDetails.appAccessGroupId}`
      );

    await appAccessGroup
      .updateOne(appAccessGroupDetails, {
        new: true
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Access group updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const deleteAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appAccessGroupDetails: DeleteAppAccessGroupType = await deleteAppAccessGroupSchema.validateAsync(req.body);

    // Update records in Collection
    const appAccessGroups = await AccessGroup.find({
      _id: { $in: stringToObjectId(appAccessGroupDetails.appAccessGroupIds) },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appAccessGroups?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid access groups.`);

    // appAccessGroups.forEach(async (appAccessGroup) => {
    //   await appAgentModel
    //     .find({
    //       appAccessGroupId: appAccessGroup._id,
    //       isDeleted: false,
    //     })
    //     .updateMany({
    //       isDeleted: true,
    //     });

    //   await appAccessGroup
    //     .updateOne({
    //       isDeleted: true,
    //     })
    //     .catch((error) => {
    //       throw httpErrors.UnprocessableEntity(error.message);
    //     });
    // });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Access group deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export { createAppAccessGroup, getAppAccessGroup, updateAppAccessGroup, deleteAppAccessGroup };
