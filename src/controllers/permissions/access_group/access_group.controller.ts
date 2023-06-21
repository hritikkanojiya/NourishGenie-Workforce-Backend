import httpErrors from 'http-errors';
import appAccessGroupModel from '../../../models/permissions/access_group/access_group.model';
import appAgentModel from '../../../models/agent/agent.model'
import {
  compactObject,
  configureMetaData,
  convertDateTimeFormat,
  logBackendError,
  getFieldsToInclude,
} from '../../../helpers/common/backend.functions';
import { NextFunction, Request, Response } from 'express';
import { MetaDataBody } from '../../../helpers/shared/shared.type';
import {
  joiAppAccessGroup,
  CreateAppAccessGroupType,
  DeleteAppAccessGroupType,
  GetAppAccessGroupType,
  UpdateAppAccessGroupType,
  GetAccessGroupQueryType
} from '../../../helpers/joi/permissions/access_group';


const createAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appAccessGroupDetails: CreateAppAccessGroupType = await joiAppAccessGroup.createAppAccessGroupSchema.validateAsync(req.body);

    // Check if group exist in Collection
    const doesGroupExist = await appAccessGroupModel.find({
      name: appAccessGroupDetails.name
    });

    if (doesGroupExist?.length > 0) throw httpErrors.Conflict(`Group [${appAccessGroupDetails.name}] already exist.`);

    // Construct Data
    const appAccessGroup = new appAccessGroupModel({
      name: appAccessGroupDetails.name,
      description: appAccessGroupDetails.description,
      isAdministrator: appAccessGroupDetails.isAdministrator === true ? true : false,
      isDeleted: appAccessGroupDetails.isDeleted === true ? true : false
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
    const querySchema: GetAppAccessGroupType = await joiAppAccessGroup.getAppAccessGroupSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(querySchema);

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAccessGroupQueryType = { isDeleted: false };

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
    const appAccessGroups = await appAccessGroupModel
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

    const totalRecords = await appAccessGroupModel.find(query).countDocuments();
    convertDateTimeFormat(appAccessGroups);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAccessGroups: appAccessGroups,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
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
    const appAccessGroupDetails: UpdateAppAccessGroupType = await joiAppAccessGroup.updateAppAccessGroupSchema.validateAsync(req.body);

    // Check if access group exist in Collection other than current record
    const doesGroupExist = await appAccessGroupModel.find({
      _id: { $ne: appAccessGroupDetails.appAccessGroupId },
      name: appAccessGroupDetails.name,
      isDeleted: false
    });

    if (doesGroupExist?.length > 0) throw httpErrors.Conflict(`Group [${appAccessGroupDetails.name}] already exist.`);

    // Update records in Collection
    const appAccessGroup = await appAccessGroupModel.findOne({
      _id: appAccessGroupDetails.appAccessGroupId,
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
    const appAccessGroupDetails: DeleteAppAccessGroupType = await joiAppAccessGroup.deleteAppAccessGroupSchema.validateAsync(req.body);

    // Update records in Collection
    const appAccessGroups = await appAccessGroupModel.find({
      _id: { $in: appAccessGroupDetails.appAccessGroupIds },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (appAccessGroups?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid access groups.`);

    await Promise.all(
      appAccessGroups.map(async (appAccessGroup) => {
        const agentsCount = await appAgentModel
          .find({
            appAccessGroupId: appAccessGroup._id,
          })
          .countDocuments();

        if (agentsCount > 0)
          throw httpErrors.Conflict(
            'AccessGroup with agents assigned cannot be deleted'
          );

        await appAgentModel
          .find({
            appAccessGroupId: appAccessGroup._id,
            isDeleted: false,
          })
          .updateMany({
            isDeleted: true,
          });

        await appAccessGroup
          .updateOne({
            isDeleted: true,
          })
          .catch((error) => {
            throw httpErrors.UnprocessableEntity(error.message);
          });
      })
    );

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

export {
  createAppAccessGroup,
  getAppAccessGroup,
  updateAppAccessGroup,
  deleteAppAccessGroup
};
