import httpErrors from 'http-errors';
import { appCronExpressionModel } from '../../../models/scheduler/cron_expression/cron_expression.model';
import { logBackendError, configureMetaData, compactObject, getFieldsToInclude, convertDateTimeFormat } from '../../../helpers/common/backend.functions';
import {
  joiAppCronExpression,
  CreateAppCronExpressionType,
  GetAppCronExpressionQueryType,
  GetAppCronExpressionType,
  UpadteAppCronExpressionType,
  DeleteAppCronExpressionType
} from '../../../helpers/joi/scheduler/cron_expression/index'
import { NextFunction, Request, Response } from 'express';
import { MetaDataBody } from 'helpers/shared/shared.type';


const createAppCronExpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expressionDetails: CreateAppCronExpressionType =
      await joiAppCronExpression.createAppCronExpressionSchema.validateAsync(req.body);

    const doesExpressionExist = await appCronExpressionModel.find({
      name: expressionDetails.name,
      isDeleted: false,
    });

    if (doesExpressionExist?.length > 0)
      throw httpErrors.Conflict(
        `Cron Expression with name : ${expressionDetails.name} already Exist.`
      );

    const expression = new appCronExpressionModel({
      name: expressionDetails.name,
      description: expressionDetails.description,
      expression: expressionDetails.expression,
      isDeleted: expressionDetails.isDeleted === true ? true : false,
    });

    const cronExpressionDetails = (await expression.save()).toObject();

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appCronExpression: {
            appCronExpressionId: cronExpressionDetails._id,
            name: cronExpressionDetails.name,
            description: cronExpressionDetails.description,
            expression: cronExpressionDetails.expression,
            createdAt: cronExpressionDetails.createdAt,
            updatedAt: cronExpressionDetails.updatedAt,
          },
          message: 'Cron Expression created successfully.',
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

const getAppCronExpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const querySchema: GetAppCronExpressionType =
      await joiAppCronExpression.getAppCronExpressionSchema.validateAsync(req.body);

    compactObject(querySchema);

    const metaData: MetaDataBody = await configureMetaData(
      querySchema
    );

    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: GetAppCronExpressionQueryType = { isDeleted: false };

    if (querySchema.appCronExpressionId)
      query._id = querySchema.appCronExpressionId;
    if (querySchema.expression) query.expression = querySchema.expression;

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
      ];
    }

    // Execute the Query
    const appCronExpressions = await appCronExpressionModel
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
    const totalRecords = await appCronExpressionModel
      .find(query)
      .countDocuments();

    await Promise.all(
      appCronExpressions.map((appCronExpression: any) => {
        appCronExpression.appCronExpressionId = appCronExpression._id;
        delete appCronExpression?._id;
        delete appCronExpression?.__v;
        delete appCronExpression?.isDeleted;
        return appCronExpression;
      })
    );

    convertDateTimeFormat(appCronExpressions);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appCronExpressions: appCronExpressions,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Cron Expression fetched successfully.',
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

const updateAppCronExpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const expressionDetails: UpadteAppCronExpressionType =
      await joiAppCronExpression.updateAppCronExpressionSchema.validateAsync(req.body);

    // Check if expression exist in Collection other than current record
    const doesExpressionExist = await appCronExpressionModel.find({
      _id: { $ne: [expressionDetails.appCronExpressionId] },
      name: expressionDetails.name,
      isDeleted: false,
    });

    if (doesExpressionExist?.length > 0)
      throw httpErrors.Conflict(
        `Cron Expression with Name : ${expressionDetails.name} already Exist.`
      );

    // Update records in Collection
    const expression = await appCronExpressionModel
      .findOne({
        _id: expressionDetails.appCronExpressionId,
        isDeleted: false,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB ${error?.message}`
        );
      });

    if (!expression)
      throw httpErrors.UnprocessableEntity(
        `Unable to find data source with id ${expressionDetails.appCronExpressionId}`
      );

    await expression
      .updateOne(expressionDetails, {
        new: true,
      })
      .catch((error) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Cron Expression updated successfully.',
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

const deleteAppCronExpression = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate Joi Schema
    const expressionDetails: DeleteAppCronExpressionType =
      await joiAppCronExpression.deleteAppCronExpressionSchema.validateAsync(req.body);

    // Update records in Collection
    const expressions = await appCronExpressionModel
      .find({
        _id: { $in: expressionDetails.appCronExpressionIds },
        isDeleted: false,
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(
          `Error retrieving records from DB. Error : ${error?.message}`
        );
      });

    if (expressions?.length <= 0)
      throw httpErrors.UnprocessableEntity(
        `Unable to process Cron Expression IDs. Error : Invalid Records.`
      );

    await Promise.all(
      expressions.map(async (expression) => {
        await expression.updateOne({
          isDeleted: true,
        });
      })
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Cron Expression deleted successfully.`,
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
  createAppCronExpression,
  getAppCronExpression,
  updateAppCronExpression,
  deleteAppCronExpression,
};
