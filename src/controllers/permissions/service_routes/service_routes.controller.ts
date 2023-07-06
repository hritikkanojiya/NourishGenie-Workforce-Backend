import httpErrors from 'http-errors';
import { appServiceRouteModel } from '../../../models/permissions/service_routes/service_routes.model';
import {
  compactObject,
  configureMetaData,
  logBackendError,
  objectIdToString,
  getFieldsToInclude,
  convertDateTimeFormat,
  arrayUnion,
  arrayPull,
  stringToObjectId
} from '../../../helpers/common/backend.functions';
import { appAccessGroupModel } from '../../../models/permissions/access_group/access_group.model';
import { MetaDataBody } from '../../../helpers/shared/shared.type';
import { NextFunction, Request, Response } from 'express';
import {
  joiAppServiceRoute,
  CreateAppServiceRouteType,
  GetAppServiceRouteType,
  AppServiceRouteQuery,
  UpdateAppServiceRouteType,
  ToggleGroupType,
  DeleteAppServiceRouteType,
  AppServiceRouteType
} from '../../../helpers/joi/permissions/service_route/index';
import mongoose from 'mongoose';
// const APP_FRONTEND = process.env.APP_FRONTEND!;

// Define Controller Methods
const createAppServiceRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // const hostName = getHostnameFromURL(req.body.path);

    // req.body.path = `${APP_FRONTEND}${!hostName && APP_FRONTEND.toString().includes(hostName) ? '' : '/'
    //     }${req.body.path}`;

    // req.body.path = req.body.path
    //     ? sanitizeUrl(new URL(req.body.path).pathname).split(':')[0]
    //     : null;

    // // Validate Joi Schema
    const appRouteDetails: CreateAppServiceRouteType = await joiAppServiceRoute.createAppRouteSchema.validateAsync(
      req.body
    );

    // Check if route exist in Collection
    const doesRouteExist: AppServiceRouteType[] = await appServiceRouteModel.find({
      path: appRouteDetails.path,
      isDeleted: false
    });

    if (doesRouteExist?.length > 0) throw httpErrors.Conflict(`Route : ${appRouteDetails.path} already Exist.`);

    // Validate Access Group IDs
    if (appRouteDetails.secure && Array.isArray(appRouteDetails.appAccessGroupIds)) {
      for (let index = 0; index < appRouteDetails.appAccessGroupIds.length; index++) {
        const accessGroupId = appRouteDetails.appAccessGroupIds[index];

        const appAccessGroup: any = await appAccessGroupModel.findOne({
          _id: accessGroupId,
          isDeleted: false
        });

        if (!appAccessGroup) throw httpErrors.BadRequest(`Invalid Access Group ID : ${accessGroupId}`);

        appRouteDetails.appAccessGroupIds[index] = appAccessGroup._id;
      }
    } else {
      appRouteDetails.appAccessGroupIds = [];
    }

    // Construct Data
    const route = new appServiceRouteModel({
      method: appRouteDetails.method,
      path: appRouteDetails.path,
      type: 'MANUAL',
      secure: appRouteDetails.secure === true ? true : false,
      appAccessGroupIds: appRouteDetails.secure === true ? appRouteDetails.appAccessGroupIds : [],
      isDeleted: appRouteDetails.isDeleted === true ? true : false
    });

    // Save Record in Collection
    const storeAppRouteDetails = (await route.save()).toObject();

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appRoute: {
            appRouteId: storeAppRouteDetails._id,
            method: storeAppRouteDetails.method,
            type: storeAppRouteDetails.type,
            path: storeAppRouteDetails.path,
            secure: storeAppRouteDetails.secure,
            appAccessGroupIds:
              storeAppRouteDetails.appAccessGroupIds.length > 0 ? storeAppRouteDetails.appAccessGroupIds : [],
            createdAt: storeAppRouteDetails.createdAt,
            updatedAt: storeAppRouteDetails.updatedAt
          },
          message: 'Servcie Route created successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getAppServiceRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: GetAppServiceRouteType = await joiAppServiceRoute.getAppRoutesSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(querySchema);

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: AppServiceRouteQuery = { isDeleted: false };

    if (querySchema.appRouteId) query._id = querySchema.appRouteId;
    if (querySchema.method) query.method = querySchema.method;
    if (querySchema.type) query.type = querySchema.type;
    if (typeof querySchema?.secure === 'boolean') query.secure = querySchema.secure;
    if (
      querySchema?.appAccessGroupIds != null &&
      typeof querySchema.appAccessGroupIds === 'object' &&
      querySchema.appAccessGroupIds.length > 0
    ) {
      query.$or = [
        {
          appAccessGroupIds: {
            $in: querySchema.appAccessGroupIds
          }
        }
      ];
    }

    if (querySchema.search) {
      if (query.$or && Array.isArray(query.$or) && query.$or?.length > 0) {
        query.$or?.push(
          {
            path: {
              $regex: querySchema.search,
              $options: 'is'
            }
          },
          {
            method: {
              $regex: querySchema.search,
              $options: 'is'
            }
          }
        );
      } else {
        query.$or = [
          {
            path: {
              $regex: querySchema.search,
              $options: 'is'
            }
          },
          {
            method: {
              $regex: querySchema.search,
              $options: 'is'
            }
          }
        ];
      }
    }

    // Execute the Query
    const appRoutes: AppServiceRouteType[] = await appServiceRouteModel
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

    const totalRecords = await appServiceRouteModel.find(query).countDocuments();

    if (querySchema.checkAppAccessGroupIds) {
      appRoutes?.forEach(appRoute => {
        querySchema.checkAppAccessGroupIds.forEach((reqAccessGroupId: any) => {
          const checkGroups = appRoute?.appAccessGroupIds?.filter((appAccessGroupId: mongoose.Types.ObjectId) => {
            return objectIdToString(appAccessGroupId) === objectIdToString(reqAccessGroupId);
          });
          appRoute.isAdded = Array.isArray(checkGroups) && checkGroups.length > 0 ? true : false;
        });
      });
    }

    appRoutes.map(appRoute => {
      appRoute.appRouteId = appRoute._id;
      delete appRoute?._id;
      delete appRoute?.isDeleted;
      delete appRoute?.__v;
      return appRoute;
    });

    convertDateTimeFormat(appRoutes);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appRoutes: appRoutes,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Service Route fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const updateAppServiceRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appRouteDetails: UpdateAppServiceRouteType = await joiAppServiceRoute.updateAppRouteSchema.validateAsync(
      req.body
    );

    // Check if route exist in Collection other than current record
    const doesRouteExist: AppServiceRouteType[] = await appServiceRouteModel.find({
      _id: { $ne: appRouteDetails.appRouteId },
      path: appRouteDetails.path,
      isDeleted: false
    });

    if (doesRouteExist?.length > 0) throw httpErrors.Conflict(`Route : ${appRouteDetails.path} already Exist.`);

    // Validate Access Group IDs
    if (appRouteDetails.secure && Array.isArray(appRouteDetails.appAccessGroupIds)) {
      for (let index = 0; index < appRouteDetails.appAccessGroupIds.length; index++) {
        const accessGroupId = appRouteDetails.appAccessGroupIds[index];

        const appAccessGroup = await appAccessGroupModel.findOne({
          _id: accessGroupId,
          isDeleted: false
        });

        if (!appAccessGroup) throw httpErrors.BadRequest(`Invalid Access Group ID : ${accessGroupId}`);

        appRouteDetails.appAccessGroupIds[index] = appAccessGroup._id;
      }
    } else {
      appRouteDetails.appAccessGroupIds = [];
    }

    appRouteDetails['type'] = 'MANUAL';

    // Update records in Collection
    const appRoute = await appServiceRouteModel
      .findOne({
        _id: appRouteDetails.appRouteId,
        isDeleted: false
      })
      .catch(error => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB ${error?.message}`);
      });

    if (!appRoute) throw httpErrors.UnprocessableEntity(`Unable to find route with id ${appRouteDetails.appRouteId}`);

    await appRoute
      .updateOne(appRouteDetails, {
        new: true
      })
      .catch(error => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Service Route updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const toggleAppGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const toggleDetails: ToggleGroupType = await joiAppServiceRoute.toggleGroupSchema.validateAsync(req.body);

    const toggleAction = toggleDetails.toggleAction;

    // Check if route exist in Collection other than current record
    const appRouteDetails = await appServiceRouteModel.findOne({
      _id: toggleDetails.appRouteId,
      isDeleted: false
    });

    if (!appRouteDetails) throw httpErrors.Conflict(`Route : ${toggleDetails.appRouteId} does not Exist.`);

    // Validate Access Group IDs
    for (let index = 0; index < toggleDetails.appAccessGroupIds.length; index++) {
      const accessGroupId = toggleDetails.appAccessGroupIds[index];

      const appAccessGroup = await appAccessGroupModel.findOne({
        _id: accessGroupId,
        isDeleted: false
      });

      if (!appAccessGroup) throw httpErrors.BadRequest(`Invalid Access Group ID : ${accessGroupId}`);

      toggleDetails.appAccessGroupIds[index] = appAccessGroup._id;
    }

    const newAppAccessGroupIds = ((): string[] => {
      switch (toggleAction) {
        case 'ADD':
          return arrayUnion([
            appRouteDetails.appAccessGroupIds.map(appAccessGroupId => objectIdToString(appAccessGroupId)),
            toggleDetails.appAccessGroupIds.map((appAccessGroupId: mongoose.Types.ObjectId) =>
              objectIdToString(appAccessGroupId)
            )
          ]);
        case 'REMOVE':
          return arrayPull(
            appRouteDetails.appAccessGroupIds.map(appAccessGroupId => objectIdToString(appAccessGroupId)),
            toggleDetails.appAccessGroupIds.map((appAccessGroupId: mongoose.Types.ObjectId) =>
              objectIdToString(appAccessGroupId)
            )
          );
        default:
          throw httpErrors.Conflict(`Invalid toggle action [${toggleAction}]`);
      }
    })();

    // Update records in Collection
    await appServiceRouteModel
      .findOne({
        _id: toggleDetails.appRouteId,
        isDeleted: false
      })
      .updateOne({
        type: 'MANUAL',
        appAccessGroupIds: stringToObjectId(newAppAccessGroupIds)
      })
      .catch(error => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB ${error?.message}`);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Configuration updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const deleteAppRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appRouteDetails: DeleteAppServiceRouteType = await joiAppServiceRoute.deleteAppRouteSchema.validateAsync(
      req.body
    );

    // Update records in Collection
    const appRoutes: AppServiceRouteType[] = await appServiceRouteModel
      .find({
        _id: { $in: appRouteDetails.appRouteIds },
        isDeleted: false
      })
      .catch(error => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appRoutes?.length <= 0) throw httpErrors.UnprocessableEntity(`Invalid App Routes.`);

    appRoutes.forEach(async (appRoute: AppServiceRouteType) => {
      await appRoute
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
          message: `Service Routes deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export default {
  createAppServiceRoute,
  getAppServiceRoutes,
  toggleAppGroup,
  updateAppServiceRoute,
  deleteAppRoute
};
