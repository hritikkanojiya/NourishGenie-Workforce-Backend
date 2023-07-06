import httpErrors from 'http-errors';
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import { appUserAcitivityModel } from '../../../models/agent/activity/activity.model'

import {
    compactObject,
    configureMetaData,
    getFieldsToInclude,
    logBackendError
} from '../../../helpers/common/backend.functions'

import {
    joiUserAttendance,
    UpdateUserAttendanceType,
    GetUsersAttendanceType,
    GetUsersAttendanceQueryType
} from '../../../helpers/joi/agent/attendance/index';
import {
    updateAttendance
} from '../activity/activity.controller'
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';
import { MetaDataBody } from '../../../helpers/shared/shared.type';

const updateUserAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userAttendanceDetails: UpdateUserAttendanceType = await joiUserAttendance.updateUserAttendanceSchema.validateAsync(req.body);
        const userAttendance = await appUserAttendanceModel.findOne({
            _id: userAttendanceDetails.appUserAttendanceId,
            isDeleted: false
        });

        if (!userAttendance)
            throw httpErrors.NotFound(`Attendance  with id: ${userAttendanceDetails.appUserAttendanceId} does not exist`);

        await userAttendance?.updateOne(userAttendanceDetails,
            {
                new: true
            });

        if (res.headersSent == false) {
            res.status(200).send({
                error: false,
                data: {
                    message: 'User attendance updated successfully'
                }
            });
        }

    } catch (error: any) {
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
}

const getUsersAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const querySchema: GetUsersAttendanceType = await joiUserAttendance.getUsersAttendanceSchema.validateAsync(req.body);

        compactObject(querySchema);

        const metaData: MetaDataBody = await configureMetaData(querySchema);

        const fieldsToInclude = getFieldsToInclude(metaData.fields);

        const query: GetUsersAttendanceQueryType = {};

        query.createdAt = {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate(),
        }

        if (querySchema.date) {
            query.createdAt = {
                $gte: moment(querySchema.date.from).startOf('day').toDate(),
                $lte: moment(querySchema.date.to).endOf('day').toDate(),
            }
        }

        if (querySchema.search)
            query.$or = [
                {
                    fullName: {
                        $regex: querySchema.search,
                        $options: 'is'
                    }
                },
            ];

        const usersActivities = await appUserAcitivityModel
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

        await updateAttendance(usersActivities).catch(error => {
            throw error;
        });

        const usersAttendances = await appUserAttendanceModel
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

        const totalRecords = await appUserAttendanceModel.find(query).countDocuments();

        // Send Response
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    userAttendance: usersAttendances,
                    metaData: {
                        sortBy: metaData.sortBy,
                        sortOn: metaData.sortOn,
                        limit: metaData.limit,
                        offset: metaData.offset,
                        total_records: totalRecords
                    },
                    message: 'user attendance fetched successfully.'
                }
            });
        }

    } catch (error: any) {
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
}

export {
    updateUserAttendance,
    getUsersAttendance,
}