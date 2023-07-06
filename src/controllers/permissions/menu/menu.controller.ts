import httpErrors from 'http-errors';
import {
  getMenuSchema,
  logBackendError,
  compactObject,
  configureMetaData,
  sanitizeUrl,
  getFieldsToInclude,
  getMaxMenuSeqNum,
  convertDateTimeFormat,
  objectIdToString,
  isValidURL,
  arrayUnion,
  arrayPull,
  getMaxSubMenuSeqNum
} from '../../../helpers/common/backend.functions';
import {
  joiAppMenu,
  CreateAppMenuType,
  GetAppMenuType,
  UpdateAppMenuType,
  DeleteAppMenuType,
  AppMenuQuery,
  AppMenuType,
  ToggleAppAccessGroupType,
  PreviewMenueType,
  SeralizeAppMenuType,
  AppSubMenuType,
  CreateAppSubMenuType,
  GetAppSubMenuType,
  AppSubMenuQuery,
  UpdateAppSubMenuType,
  DeleteAppSubMenuType
} from '../../../helpers/joi/permissions/menu/index'
import { appMenuModel, appSubMenuModel } from '../../../models/permissions/menu/menu.model';
import { appAccessGroupModel } from '../../../models/permissions/access_group/access_group.model';
import { NextFunction, Request, Response } from 'express';
import { MetaDataBody, RequestType } from 'helpers/shared/shared.type';
import mongoose from 'mongoose';
import { GlobalConfig } from '../../../helpers/common/environment'

const APP_FRONTEND = GlobalConfig.APP_FRONTEND;

// Define Controller Methods
const createAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const APP_FRONTEND = GlobalConfig.APP_FRONTEND;
    if (isValidURL(req.body.url)) {
      console.log('inif');

      req.body.url = sanitizeUrl(new URL(req.body.url).pathname).split(':')[0];
    } else {
      console.log(req.body.url);
      req.body.url = req.body.url
        ? sanitizeUrl(
          new URL(`${APP_FRONTEND}/${req.body.url}`).pathname
        ).split(':')[0]
        : null;
      console.log(req.body.url);

    }
    // console.log(req.body.url);
    // Validate Joi Schema
    const appMenuDetails: CreateAppMenuType = await joiAppMenu.createAppMenuSchema.validateAsync(
      req.body
    );


    const doesMenuExist = await appMenuModel.find({
      url: appMenuDetails.url,
      isDeleted: false,
    });

    if (doesMenuExist?.length > 0)
      throw httpErrors.Conflict(
        `Menu with URL : ${appMenuDetails.url} already Exist.`
      );

    // Validate Access Group IDs
    for (
      let index = 0;
      index < appMenuDetails.appAccessGroupIds.length;
      index++
    ) {
      const accessGroupId = appMenuDetails.appAccessGroupIds[index]

      const appAccessGroup = await appAccessGroupModel.findOne({
        _id: accessGroupId,
        isDeleted: false,
      });

      if (!appAccessGroup)
        throw httpErrors.BadRequest(
          `Invalid Access Group ID : ${accessGroupId}`
        );

      appMenuDetails.appAccessGroupIds[index] = appAccessGroup._id;
    }

    const sequenceNumber = await getMaxMenuSeqNum();
    // console.log(sequenceNumber);

    // Construct Data
    const appMenu = new appMenuModel({
      name: appMenuDetails.name,
      description: appMenuDetails.description,
      hasSubMenus: appMenuDetails.hasSubMenus,
      url: appMenuDetails.url,
      appAccessGroupIds: appMenuDetails.appAccessGroupIds,
      sequenceNumber: sequenceNumber,
      isDeleted: appMenuDetails.isDeleted === true ? true : false,
    });

    // Save Record in Collection
    const storeMenuDetails = (await appMenu.save()).toObject();

    convertDateTimeFormat(storeMenuDetails);
    console.log(storeMenuDetails);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appMenu: {
            appMenuId: storeMenuDetails._id,
            name: storeMenuDetails.name,
            description: storeMenuDetails.description,
            hasSubMenus: storeMenuDetails.hasSubMenus,
            url: storeMenuDetails.url,
            appAccessGroupIds: storeMenuDetails.appAccessGroupIds,
            sequenceNumber: sequenceNumber,
          },
          message: 'Menu created successfully',
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

const getAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: GetAppMenuType = await joiAppMenu.getAppMenuSchema.validateAsync(
      req.body
    );

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: AppMenuQuery = { isDeleted: false };

    if (querySchema.appMenuId) query._id = querySchema.appMenuId;
    if (
      querySchema?.appAccessGroupIds != null &&
      typeof querySchema.appAccessGroupIds === 'object' &&
      querySchema.appAccessGroupIds.length > 0
    ) {
      query.$or = [
        {
          appAccessGroupIds: {
            $in: querySchema.appAccessGroupIds,
          },
        },
      ];
    }

    if (querySchema.search) {
      if (query.$or && Array.isArray(query.$or) && query?.$or?.length > 0) {
        query.$or.push({
          name: {
            $regex: querySchema.search,
            $options: 'is',
          },
        });
        query.$or.push({
          description: {
            $regex: querySchema.search,
            $options: 'is',
          },
        });
        query.$or.push({
          url: {
            $regex: querySchema.search,
            $options: 'is',
          },
        });
      } else {
        query.$or = [
          {
            name: {
              $regex: querySchema.search,
              $options: 'is',
            },
          },
          {
            description: {
              $regex: querySchema.search,
              $options: 'is',
            },
          },
          {
            url: {
              $regex: querySchema.search,
              $options: 'is',
            },
          },
        ];
      }
    }

    // Execute the Query
    const appMenus: AppMenuType[] = await appMenuModel
      .find(query)
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

    const totalRecords = await appMenuModel.find(query).countDocuments();

    await Promise.all(
      appMenus.map((appMenu: AppMenuType) => {
        appMenu.appMenuId = appMenu._id;
        if (appMenu.hasSubMenus === false) {
          appMenu.url = appMenu.url ? APP_FRONTEND + appMenu.url : null;
        }
        else
          appMenu.url = null;
        if (querySchema.checkAppAccessGroupIds) {
          querySchema.checkAppAccessGroupIds.forEach((reqAccessGroupId: mongoose.Types.ObjectId) => {
            const checkGroups = appMenu.appAccessGroupIds?.filter(
              (appAccessGroupId) => {
                return (
                  objectIdToString(appAccessGroupId) ===
                  objectIdToString(reqAccessGroupId)
                );
              }
            );
            appMenu.isAdded =
              Array.isArray(checkGroups) && checkGroups.length > 0
                ? true
                : false;
          });
        }
        delete appMenu?._id;
        delete appMenu?.isDeleted;
        delete appMenu?.__v;
        return appMenu;
      })
    );

    convertDateTimeFormat(appMenus);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appMenus: appMenus,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Menus fetched successfully.',
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

const updateAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const APP_FRONTEND = GlobalConfig.APP_FRONTEND;

    // Santize Menu URL
    if (isValidURL(req.body.url)) {
      req.body.url = sanitizeUrl(new URL(req.body.url).pathname).split(':')[0];
    } else {
      req.body.url = req.body.url
        ? sanitizeUrl(
          new URL(`${APP_FRONTEND}/${req.body.url}`).pathname
        ).split(':')[0]
        : null;
    }

    // Validate Joi Schema
    const appMenuDetails: UpdateAppMenuType = await joiAppMenu.updateAppMenuSchema.validateAsync(
      req.body
    );

    const doesMenuExist = await appMenuModel.find({
      _id: { $ne: [appMenuDetails.appMenuId] },
      url: appMenuDetails.url,
      isDeleted: false,
    });

    if (doesMenuExist?.length > 0)
      throw httpErrors.Conflict(
        `Menu with URL : ${appMenuDetails.url} already Exist.`
      );

    // Validate Access Group IDs
    for (
      let index = 0;
      index < appMenuDetails.appAccessGroupIds.length;
      index++
    ) {
      const accessGroupId = appMenuDetails.appAccessGroupIds[index]


      const accessGroup = await appAccessGroupModel.findOne({
        _id: accessGroupId,
        isDeleted: false,
      });

      if (!accessGroup)
        throw httpErrors.BadRequest(
          `Invalid Access Group ID : ${accessGroupId}`
        );

      appMenuDetails.appAccessGroupIds[index] = accessGroup._id;
    }

    // Update records in Collection
    const appMenu = await appMenuModel
      .findOne({
        _id: appMenuDetails.appMenuId,
        isDeleted: false,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!appMenu)
      throw httpErrors.UnprocessableEntity(
        `Unable to find menu with id ${appMenuDetails.appMenuId}`
      );

    await appMenu
      .updateOne(appMenuDetails, {
        new: true,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Menu updated successfully.',
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

const deleteAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appMenuDetails: DeleteAppMenuType = await joiAppMenu.deleteAppMenuSchema.validateAsync(
      req.body
    );

    // Update records in Collection
    const appMenus: AppMenuType[] = await appMenuModel
      .find({
        _id: { $in: (appMenuDetails.appMenuIds) },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. Error : ${error?.message}`
        );
      });

    if (appMenus?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Menu IDs. Error : Invalid Records.`
      );

    for (let index = 0; index < appMenus.length; index++) {
      await appMenus[index].updateOne({
        isDeleted: true,
      });

      const childSubMenus = await appSubMenuModel.find({
        appMenuId: appMenus[index]._id,
        isDeleted: false,
      });

      if (childSubMenus.length > 0)
        childSubMenus.forEach(async (subMenu) => {
          await subMenu.updateOne({
            isDeleted: true,
          });
        });
    }

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Menu deleted successfully.`,
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

const createAppSubMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const APP_FRONTEND = process.env.APP_FRONTEND;

    // Santize Menu URL
    if (
      Array.isArray(req.body.appSubMenus) &&
      req.body.appSubMenus.length > 0
    ) {
      req.body.appSubMenus.forEach((subMenu: AppSubMenuType) => {
        if (subMenu.url && isValidURL(subMenu.url)) {
          subMenu.url = sanitizeUrl(new URL(subMenu.url).pathname).split(
            ':'
          )[0];
        } else {
          subMenu.url = subMenu.url
            ? sanitizeUrl(
              new URL(`${APP_FRONTEND}/${subMenu.url}`).pathname
            ).split(':')[0]
            : null;
        }
      });
    }

    // Validate Joi Schema
    const appSubMenuDetails: CreateAppSubMenuType =
      await joiAppMenu.createAppSubMenuSchema.validateAsync(req.body);

    const appMenuId = appSubMenuDetails.appMenuId;

    const appMenu = await appMenuModel.findOne({
      _id: appMenuId,
      hasSubMenus: true,
      isDeleted: false,
    });

    if (!appMenu)
      throw httpErrors.Conflict(
        `Menu [${appMenuId}] does not support sub menus.`
      );

    if (
      Array.isArray(appSubMenuDetails.appSubMenus) &&
      appSubMenuDetails.appSubMenus.length > 0
    ) {
      for (
        let index = 0;
        index < appSubMenuDetails.appSubMenus.length;
        index++
      ) {
        // Check if sub-menu exist in Collection
        const doesSubMenuExist = await appSubMenuModel.find({
          appMenuId: appSubMenuDetails.appMenuId,
          url: appSubMenuDetails.appSubMenus[index].url,
          isDeleted: false,
        });

        if (doesSubMenuExist?.length > 0)
          throw httpErrors.Conflict(
            `Sub Menu with URL : ${appSubMenuDetails.appSubMenus[index].url} already exist under Menu [${appMenuId}]`
          );
      }
    }

    const addedSubMenus = [];

    // Itterate over the array of Menu objects
    for (let index = 0; index < appSubMenuDetails.appSubMenus.length; index++) {
      const sequenceNumber = await getMaxSubMenuSeqNum();

      // Construct Data
      const subMenu: AppSubMenuType = new appSubMenuModel({
        appMenuId: appMenuId,
        name: appSubMenuDetails.appSubMenus[index].name,
        description: appSubMenuDetails.appSubMenus[index].description,
        url: appSubMenuDetails.appSubMenus[index].url,
        sequenceNumber: sequenceNumber,
        isDeleted:
          appSubMenuDetails.appSubMenus[index].isDeleted === true
            ? true
            : false,
      });

      // Save Record in Collection
      const storeSubMenuDetails = (await subMenu.save()).toObject();

      storeSubMenuDetails.appSubMenuId = storeSubMenuDetails._id;
      delete storeSubMenuDetails._id;
      delete storeSubMenuDetails.isDeleted;
      delete storeSubMenuDetails.__v;

      addedSubMenus.push(storeSubMenuDetails);
    }

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appSubMenus: {
            appMenuId: appMenuId,
            appSubMenus: addedSubMenus,
          },
          message: 'Sub Menu created successfully',
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

const getAppSubMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const querySchema: GetAppSubMenuType = await joiAppMenu.getAppSubMenuSchema.validateAsync(
      req.body
    );

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: AppSubMenuQuery = { isDeleted: false };

    if (querySchema.appSubMenuId) query._id = querySchema.appSubMenuId;
    if (querySchema.appMenuId) query.appMenuId = querySchema.appMenuId;

    if (querySchema.search) {
      query.$or = [
        {
          name: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
        {
          description: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
        {
          url: {
            $regex: querySchema.search,
            $options: 'is',
          },
        },
      ];
    }

    // Execute the Query
    const appSubMenus = await appSubMenuModel
      .find(query)
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

    const totalRecords = await appSubMenuModel.find(query).countDocuments();

    await Promise.all(
      appSubMenus.map((appSubMenu: AppSubMenuType) => {
        appSubMenu.appSubMenuId = appSubMenu._id;
        appSubMenu.url = appSubMenu.url
          ? `${APP_FRONTEND}${appSubMenu.url}`
          : null;
        delete appSubMenu?._id;
        delete appSubMenu?.__v;
        delete appSubMenu?.isDeleted;
        return appSubMenu;
      })
    );

    convertDateTimeFormat(appSubMenus);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appSubMenus: appSubMenus,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Sub-Menus fetched successfully.',
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

const updateAppSubMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const APP_FRONTEND = process.env.APP_FRONTEND;

    // Santize Menu URL
    if (isValidURL(req.body.url)) {
      req.body.url = sanitizeUrl(new URL(req.body.url).pathname).split(':')[0];
    } else {
      req.body.url = req.body.url
        ? sanitizeUrl(
          new URL(`${APP_FRONTEND}/${req.body.url}`).pathname
        ).split(':')[0]
        : null;
    }

    // Validate Joi Schema
    const appSubMenuDetails: UpdateAppSubMenuType =
      await joiAppMenu.updateAppSubMenuSchema.validateAsync(req.body);

    // Check if sub-menu exist in Collection other than current record
    const doesSubMenuExist = await appSubMenuModel.find({
      _id: { $ne: [appSubMenuDetails.appSubMenuId] },
      appMenuId: appSubMenuDetails.appMenuId,
      url: appSubMenuDetails.url,
      isDeleted: false,
    });

    if (doesSubMenuExist?.length > 0)
      throw httpErrors.Conflict(
        `Menu with URL : ${appSubMenuDetails.url} already Exist.`
      );

    const appMenu = await appMenuModel.findOne({
      _id: appSubMenuDetails.appMenuId,
      hasSubMenus: true,
      isDeleted: false,
    });

    if (!appMenu)
      throw httpErrors.Conflict(
        `Menu [${appSubMenuDetails.appMenuId}] does not support sub menus.`
      );

    // Update records in Collection
    const appSubMenu = await appSubMenuModel
      .findOne({
        _id: appSubMenuDetails.appSubMenuId,
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!appSubMenu)
      throw httpErrors.UnprocessableEntity(
        `Unable to find menu with id ${appSubMenuDetails.appSubMenuId}`
      );

    await appSubMenu
      .updateOne(appSubMenuDetails, {
        new: true,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Sub-Menu updated successfully.',
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

const deleteAppSubMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appSubMenuDetails: DeleteAppSubMenuType =
      await joiAppMenu.deleteAppSubMenuSchema.validateAsync(req.body);

    // Update records in Collection
    const appSubMenus = await appSubMenuModel
      .find({
        _id: { $in: appSubMenuDetails.appSubMenuIds },
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. ${error?.message}`
        );
      });

    if (appSubMenus?.length <= 0)
      throw httpErrors.UnprocessableEntity(`Unable to process Menu IDs.`);

    for (let index = 0; index < appSubMenus.length; index++) {
      await appSubMenus[index].updateOne({
        isDeleted: true,
      });
    }

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Sub-Menus deleted successfully.`,
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

const toggleAppAccessGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const toggleDetails: ToggleAppAccessGroupType = await joiAppMenu.toggleAppAccessGroupSchema.validateAsync(req.body);

    const toggleAction = toggleDetails.toggleAction;

    // Check if route exist in Collection other than current record
    const appMenuDetails = await appMenuModel.findOne({
      _id: toggleDetails.appMenuId,
      isDeleted: false,
    });

    if (!appMenuDetails)
      throw httpErrors.Conflict(
        `Menu : ${toggleDetails.appMenuId} does not Exist.`
      );

    // Validate Access Group IDs
    for (
      let index = 0;
      index < toggleDetails.appAccessGroupIds.length;
      index++
    ) {
      const accessGroupId = toggleDetails.appAccessGroupIds[index]


      const accessGroupDetails = await appAccessGroupModel.findOne({
        _id: accessGroupId,
        isDeleted: false,
      });

      if (!accessGroupDetails)
        throw httpErrors.BadRequest(
          `Invalid Access Group ID : ${accessGroupId}`
        );

      toggleDetails.appAccessGroupIds[index] = accessGroupId;
    }

    const newAccessGroupIds = ((): string[] => {
      switch (toggleAction) {
        case 'ADD':
          return arrayUnion([
            appMenuDetails.appAccessGroupIds.map((accessGroupId) =>
              objectIdToString(accessGroupId)
            ),
            toggleDetails.appAccessGroupIds.map((accessGroupId) =>
              objectIdToString(accessGroupId)
            ),
          ]);
        case 'REMOVE':
          return arrayPull(
            appMenuDetails.appAccessGroupIds.map((accessGroupId) =>
              objectIdToString(accessGroupId)
            ),
            toggleDetails.appAccessGroupIds.map((accessGroupId) =>
              objectIdToString(accessGroupId)
            )
          );
        default:
          throw httpErrors.Conflict(`Invalid toggle action [${toggleAction}]`);
      }
    })();

    // Update records in Collection
    await appMenuModel
      .findOne({
        _id: toggleDetails.appMenuId,
        isDeleted: false,
      })
      .updateOne({
        appAccessGroupIds: newAccessGroupIds,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Configuration updated successfully.',
        },
      });
    }
  } catch (error: any) {
    console.log(error);
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

const constructAppMenu = async (req: RequestType, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAccessGroupId = req.payload?.appAccessGroupId;

    // Check if access group exist in Collection
    const accessGroup = await appAccessGroupModel.findOne({
      _id: appAccessGroupId,
      isDeleted: false,
    });

    if (!accessGroup)
      throw httpErrors.BadRequest(
        `Invalid Access Group ID : ${appAccessGroupId}`
      );

    const appMenus = await appMenuModel
      .find({
        appAccessGroupIds: { $in: accessGroup._id },
        isDeleted: false,
      })
      .sort({ ['sequenceNumber']: 'asc' });

    if (appMenus?.length > 0)
      throw httpErrors.NotImplemented(
        `Unable to retrieve Menu. Please try again later`
      );

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: { appMenus: await getMenuSchema(appMenus) },
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

const previewAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    console.log(req.body);
    const querySchema: PreviewMenueType = await joiAppMenu.previewAppMenuSchema.validateAsync(
      req.body
    );

    compactObject(querySchema);

    const query: AppMenuQuery = { isDeleted: false };

    if (
      querySchema?.appAccessGroupIds != null &&
      typeof querySchema.appAccessGroupIds === 'object' &&
      querySchema.appAccessGroupIds.length > 0
    ) {
      query.$or = [
        {
          appAccessGroupIds: {
            $in: querySchema.appAccessGroupIds,
          },
        },
      ];
    }

    const appMenus = await appMenuModel
      .find(query)
      .sort({ ['sequenceNumber']: 'asc' });

    if (appMenus?.length < 0)
      throw httpErrors.NotImplemented(
        `Unable to retrieve Menu. Please try again later`
      );

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: { appMenus: await getMenuSchema(appMenus, true) },
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

const seralizeAppMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const appMenuDetails: SeralizeAppMenuType = await joiAppMenu.seralizeAppMenuSchema.validateAsync(
      req.body
    );

    for (let index = 0; index < appMenuDetails.sequenceOrder.length; index++) {
      const menuItterator = appMenuDetails.sequenceOrder[index];

      // Update records in Collection
      const appMenu = await appMenuModel
        .findOne({
          _id: menuItterator.appMenuId,
          isDeleted: false,
        })
        .catch((error) => {
          throw httpErrors.UnprocessableEntity(
            `Error retrieving records from DB ${error?.message}`
          );
        });

      if (!appMenu)
        throw httpErrors.UnprocessableEntity(
          `Unable to find menu with id ${menuItterator.appMenuId}`
        );

      await appMenu
        .updateOne(
          {
            sequenceNumber: menuItterator.sequenceNumber,
          },
          {
            new: true,
          }
        )
        .catch((error) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

      for (let index = 0; index < menuItterator.appSubMenus.length; index++) {
        const subMenuItterator = menuItterator.appSubMenus[index];

        const appSubMenu = await appSubMenuModel
          .findOne({
            _id: subMenuItterator.appSubMenuId,
            isDeleted: false,
          })
          .catch((error) => {
            throw httpErrors.UnprocessableEntity(
              `Error retrieving records from DB ${error?.message}`
            );
          });

        if (!appSubMenu)
          throw httpErrors.UnprocessableEntity(
            `Unable to find sub-menu with id ${subMenuItterator.appSubMenuId}`
          );

        await appSubMenu
          .updateOne(
            {
              sequenceNumber: subMenuItterator.sequenceNumber,
            },
            {
              new: true,
            }
          )
          .catch((error) => {
            throw httpErrors.UnprocessableEntity(error.message);
          });
      }
    }

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Menu seralized successfully.',
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

export {
  createAppMenu,
  getAppMenu,
  updateAppMenu,
  deleteAppMenu,
  toggleAppAccessGroup,
  createAppSubMenu,
  getAppSubMenu,
  updateAppSubMenu,
  deleteAppSubMenu,
  constructAppMenu,
  previewAppMenu,
  seralizeAppMenu,
};
