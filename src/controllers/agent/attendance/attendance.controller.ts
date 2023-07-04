import httpErrors from 'http-errors';
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import appAgentAcitivityModel from '../../../models/agent/activity/activity.model'

import {
    compactObject,
    logBackendError
} from '../../../helpers/common/backend.functions'

import {
    joiUserAttendance,
    UpdateUserAttendanceType,
    GetUserAttendanceType,
    GetUserAttendanceQueryType,
    GetUsersMonthAttendanceQueryType,
    GetUsersMonthAttendanceType
} from '../../../helpers/joi/agent/attendance/index';
import {
    updateAttendance
} from '../activity/activity.controller'
import { NextFunction, Request, Response } from 'express';
import moment from 'moment';

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

const getUsersMonthAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const querySchema: GetUsersMonthAttendanceType = await joiUserAttendance.getUsersMonthAttendanceSchema.validateAsync(req.body);

        compactObject(querySchema);

        const query: GetUsersMonthAttendanceQueryType = {};

        // Calculate the end of the month
        let startOfMonth = moment().clone().startOf('month').toDate();

        // Calculate the end of the month
        let endOfMonth = moment().clone().endOf('month').toDate();

        if (querySchema.month && querySchema.year) {
            const dateStr = `${querySchema.month} ${querySchema.year}`;
            const yourDate = moment(dateStr, 'MMMM YYYY');
            startOfMonth = yourDate.clone().startOf('month').toDate();
            endOfMonth = yourDate.clone().endOf('month').toDate();
        }
        console.log(startOfMonth);
        console.log(endOfMonth);
        query.createdAt = {
            $gte: startOfMonth,
            $lte: endOfMonth
        };

        if (querySchema.search)
            query.$or = [
                {
                    fullname: {
                        $regex: querySchema.search,
                        $options: 'is'
                    }
                },
            ];

        const userActivities = await appAgentAcitivityModel
            .find(query)
            .catch(error => {
                throw httpErrors.UnprocessableEntity(
                    error?.message ? error.message : 'Unable to retrieve records from Database.'
                );
            });

        await updateAttendance(userActivities);


        const usersAttendance = await appUserAttendanceModel
            .find({
                createdAt: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            })
            .catch(error => {
                throw httpErrors.UnprocessableEntity(
                    error?.message ? error.message : 'Unable to retrieve records from Database.'
                );
            });

        // Send Response
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    userAttendance: usersAttendance,
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


const getUserAttendances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const querySchema: GetUserAttendanceType = await joiUserAttendance.getUserAttendanceSchema.validateAsync(req.body);

        compactObject(querySchema);

        const query: GetUserAttendanceQueryType = { isDeleted: false };
        query.appUserId = querySchema.appUserId;

        const monthNames: {
            [key: string]: number;
        } = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11
        };

        let fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        let toDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
        if (querySchema.month && querySchema.year) {
            fromDate = new Date(parseInt(querySchema.year), monthNames[querySchema.month], 1);
            toDate = new Date(parseInt(querySchema.year), monthNames[querySchema.month + 1], 0);
        }

        query.createdAt = {
            $gte: fromDate,
            $lte: toDate
        };

        if (querySchema.search)
            query.$or = [
                {
                    email: {
                        $regex: querySchema.search,
                        $options: 'is'
                    }
                },
            ];

        const userAttendance = await appUserAttendanceModel
            .find(query)
            .catch(error => {
                throw httpErrors.UnprocessableEntity(
                    error?.message ? error.message : 'Unable to retrieve records from Database.'
                );
            });


        // await Promise.all(
        // userAttendance.map(async(attendance) => {

        // })
        // );



        // Send Response
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    userAttendance: userAttendance,
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
    getUsersMonthAttendance,
    getUserAttendances
}