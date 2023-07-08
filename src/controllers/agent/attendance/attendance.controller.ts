import httpErrors from 'http-errors';
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import { appUserAcitivityModel } from '../../../models/agent/activity/activity.model'

import {
    compactObject,
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
import { appUserModel } from '../../../models/agent/agent.model';
import { appUserDepartmentModel } from '../../../models/agent/fields/app_department.model';

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

        const query: GetUsersAttendanceQueryType = {};

        let startOfMonth = moment().startOf('month').toDate();
        let endOfMonth = moment().endOf('month').toDate();

        if (querySchema.month && querySchema.year) {
            const dateStr = `${querySchema.year} ${querySchema.month}`;
            startOfMonth = moment(dateStr, 'YYYY-MMM').startOf('month').toDate();
            endOfMonth = moment(dateStr, 'YYYY-MMM').endOf('month').toDate();
        }

        query.createdAt = {
            $gte: startOfMonth,
            $lte: endOfMonth
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
            .sort({ ['createdAt']: 'asc' })
            .catch(error => {
                throw httpErrors.UnprocessableEntity(
                    error?.message ? error.message : 'Unable to retrieve records from Database.'
                );
            });

        const usersAttendancesArr: { [key: string]: any[] } = {};
        let tempArr;
        await Promise.all(
            usersAttendances.map(async (attendance) => {
                const user = await appUserModel.findOne({ _id: attendance.appUserId, isDeleted: false });
                const userDepartment = await appUserDepartmentModel.findOne({ _id: user?.appDepartmentId, isDeleted: false });
                const dateIndex = attendance.createdAt.getDate();
                if (querySchema.departmentName && userDepartment?.name === querySchema.departmentName) {
                    if (!usersAttendancesArr[`${attendance.appUserId}`]) {
                        tempArr = new Array(31);
                        tempArr.fill('N/A');
                        tempArr[dateIndex] = attendance;
                        usersAttendancesArr[`${attendance.appUserId}`] = tempArr;
                    }
                    else {
                        usersAttendancesArr[`${attendance.appUserId}`][dateIndex] = attendance;
                    }
                }
                else if (!querySchema.departmentName) {
                    if (!usersAttendancesArr[`${attendance.appUserId}`]) {
                        tempArr = new Array(31);
                        tempArr.fill('N/A');
                        tempArr[dateIndex] = attendance;
                        usersAttendancesArr[`${attendance.appUserId}`] = tempArr;
                    }
                    else {
                        usersAttendancesArr[`${attendance.appUserId}`][dateIndex] = attendance;
                    }
                }
            })
        )

        // Send Response
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    usersAttendances: usersAttendancesArr,
                    message: 'user attendance fetched successfully.'
                }
            });
        }

    } catch (error: any) {
        console.log(error);
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
}

export {
    updateUserAttendance,
    getUsersAttendance,
}