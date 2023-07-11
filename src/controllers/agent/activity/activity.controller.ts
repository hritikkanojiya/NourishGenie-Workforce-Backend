import { NextFunction, Request, Response } from 'express';
import { calculateTimeSummary, compactObject, configureMetaData, getFieldsToInclude, logBackendError } from '../../../helpers/common/backend.functions';
import moment from 'moment';
import { appUserDetailsModel } from '../../../models/agent/fields/app_agent_details.model'
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import { appUserAcitivityModel } from '../../../models/agent/activity/activity.model'

import {
  GetUserActivityType,
  GetUserWorkingStatusType,
  joiUserActivity,
  CreateUserActivityLogsType,
  UserLastActivityType,
  GetUserWorkingStatusQueryType,
  GetUserActivityQueryType,
} from '../../../helpers/joi/agent/activity/index'
import httpErrors from 'http-errors';
import { appUserModel } from '../../../models/agent/agent.model';
import { MetaDataBody } from '../../../helpers/shared/shared.type';

const updateAttendance = async (userActivities: any): Promise<void> => {
  try {
    for (const iterator of userActivities) {
      const appUserDetails = await appUserDetailsModel.findOne({ company_email: iterator.email, isDeleted: false });
      const timeSummary = await calculateTimeSummary(iterator);
      const startingLimit = parseInt((appUserDetails?.working_hours?.split('-')[0]) ? appUserDetails?.working_hours?.split('-')[0] : '');
      const endingLimit = parseInt((appUserDetails?.working_hours?.split('-')[1]) ? appUserDetails?.working_hours?.split('-')[1] : '');
      const totalLoginTimeWithoutBreak = moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours();
      let availability = 'not available';
      if (totalLoginTimeWithoutBreak >= startingLimit && totalLoginTimeWithoutBreak <= endingLimit) {
        availability = 'full day';
      }
      else if (Math.abs(totalLoginTimeWithoutBreak - startingLimit) <= 1) {
        availability = 'half day';
      }
      else if (totalLoginTimeWithoutBreak > endingLimit) {
        availability = 'over Time'
      }
      const UserAttandence = await appUserAttendanceModel.findOne({
        appUserId: appUserDetails?.appUserId,
        createdAt: {
          $gte: moment(iterator.createdAt).startOf('day').toDate(),
          $lte: moment(iterator.createdAt).endOf('day').toDate(),
        },
      });
      await UserAttandence?.updateOne({
        appUserId: appUserDetails?.appUserId,
        email: iterator.email,
        availability: availability,
        status: totalLoginTimeWithoutBreak > 1 ? 'PRESENT' : 'ABSENT',
      },
        {
          new: true
        }
      );
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

const createActivityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(req.headers)
    const queryDetails: CreateUserActivityLogsType = await joiUserActivity.createActivityLogsSchema.validateAsync(req.body);
    const userActivities = await appUserAcitivityModel.find({
      email: queryDetails.email,
      createdAt: {
        $gte: moment().startOf('day'),
        $lte: moment().endOf('day')
      }
    });
    let message;
    if (userActivities.length > 0) {
      const activities = userActivities[0].activities;
      const latestActivity = activities[activities.length - 1].activity;
      if (queryDetails.activity === 'breakin') {
        if (latestActivity === 'checkin' || latestActivity === 'breakout') {
          const updatedActivities = [...activities];
          updatedActivities.push({
            activity: queryDetails.activity,
            time: moment().format('HH:mm:ss'),
          });

          await appUserAcitivityModel.updateOne(
            {
              email: queryDetails.email,
              createdAt: {
                $gte: moment().startOf('day'),
                $lte: moment().endOf('day')
              }
            },
            {
              $set: { activities: updatedActivities },
            }
          );
          message = `${queryDetails.activity} marked successfully`;
        } else {
          message = 'Can\'t perform this activity without checking in or break out'
          throw new Error(message);
        }
      } else if (queryDetails.activity === 'checkin') {
        if (latestActivity === 'checkout') {
          const updatedActivities = [...activities];
          updatedActivities.push({
            activity: queryDetails.activity,
            time: moment().format('HH:mm:ss'),
          });

          await appUserAcitivityModel.updateOne(
            {
              email: queryDetails.email,
              createdAt: {
                $gte: moment().startOf('day'),
                $lte: moment().endOf('day')
              }
            },
            {
              $set: { activities: updatedActivities },
            }
          );
          message = `${queryDetails.activity} marked successfully`;
        } else {
          message = 'Can\'t perform this activity without checking out';
          throw new Error(message);
        }
      } else if (queryDetails.activity === 'checkout') {
        if (latestActivity === 'checkin' || latestActivity === 'breakout') {
          const updatedActivities = [...activities];
          updatedActivities.push({
            activity: queryDetails.activity,
            time: moment().format('HH:mm:ss'),
          });

          await appUserAcitivityModel.updateOne(
            {
              email: queryDetails.email,
              createdAt: {
                $gte: moment().startOf('day'),
                $lte: moment().endOf('day')
              }
            },
            {
              $set: { activities: updatedActivities },
            }
          );
          message = `${queryDetails.activity} marked successfully`;
        } else {
          message = 'Can\'t perform this activity without checking in';
          throw new Error(message);

        }
      } else if (queryDetails.activity === 'breakout') {
        if (latestActivity === 'breakin') {
          const updatedActivities = [...activities];
          updatedActivities.push({
            activity: queryDetails.activity,
            time: moment().format('HH:mm:ss'),
          });

          await appUserAcitivityModel.updateOne(
            {
              email: queryDetails.email,
              createdAt: {
                $gte: moment().startOf('day'),
                $lte: moment().endOf('day')
              }
            },
            {
              $set: { activities: updatedActivities },
            }
          );
          message = `${queryDetails.activity} marked successfully`;
        } else {
          message = 'Can\'t perform this activity without breakin break';
          throw new Error(message);
        }
      }
    } else {
      if (queryDetails.activity === 'checkout' || queryDetails.activity === 'breakin' || queryDetails.activity === 'breakout') {
        message = 'Can\'t perform this activity without checking in';
        throw new Error(message);
      }
      else {
        await appUserAcitivityModel.create({
          email: queryDetails.email,
          fullName: queryDetails.fullName,
          activities: [
            {
              activity: queryDetails.activity,
              time: moment().format('HH:mm:ss'),
            },
          ],
        });

        message = `${queryDetails.activity} marked successfully`;
      }
    }
    const userActivity = await appUserAcitivityModel.find({
      email: queryDetails.email,
      createdAt: {
        $gte: moment().startOf('day'),
        $lte: moment().endOf('day')
      }
    })

    await updateAttendance(userActivity);

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: message
        }
      });
    }
  }
  catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getUserActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const querySchema: GetUserActivityType = await joiUserActivity.getUserActivitySchema.validateAsync(req.body);
    compactObject(querySchema);
    const metaData: MetaDataBody = await configureMetaData(querySchema);
    const fieldsToInclude = getFieldsToInclude(metaData.fields);
    const query: GetUserActivityQueryType = {};
    if (querySchema.email) query.email = querySchema.email;

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
        {
          email: {
            $regex: querySchema.search,
            $options: 'is'
          }
        }
      ];
    const activities = await appUserAcitivityModel
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
    const totalRecords = await appUserAcitivityModel.find(query).countDocuments();
    const appUserDetails = await appUserDetailsModel.findOne({ company_email: querySchema.email, isDeleted: false });
    const UserActivities = [];
    for (const iterator of activities) {
      const timeSummary = await calculateTimeSummary(iterator);
      const endingLimit = parseInt((appUserDetails?.working_hours?.split('-')[1]) ? appUserDetails?.working_hours?.split('-')[1] : '');
      const totalLoginTimeWithoutBreak = moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours();
      let overTime = 0;
      if (totalLoginTimeWithoutBreak > endingLimit) {
        overTime = (totalLoginTimeWithoutBreak - endingLimit) * 60;
      }
      UserActivities.push({
        email: iterator.email,
        fullName: iterator.fullName,
        activities: iterator.activities,
        totalLoggedinTime: `${moment.duration(timeSummary.totalLoggedInTime).asMinutes().toFixed(2)} Minutes`,
        totalBreakTime: `${moment.duration(timeSummary.totalBreakTime).asMinutes().toFixed(2)} Minutes`,
        totalLoginTimeWithoutBreak: `${moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asMinutes().toFixed(2)} Minutes`,
        overTime: `${overTime.toFixed(2)} Mintues`,
        createdAt: iterator.createdAt,
        updatedAt: iterator.updatedAt,
      });
    }

    if (res.headersSent == false) {
      res.status(200).send({
        error: false,
        data: {
          UserActivitiesDetails: UserActivities,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'User Activities fetched successfully'
        }
      });
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getUserLastActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const UserLastActivity: UserLastActivityType = await joiUserActivity.UserLastActivitySchema.validateAsync(req.body);
    // if (UserLastActivity.date == 'today') {
    //   const currentDate = moment().format('YYYY-MM-DD');
    //   UserLastActivity.date = currentDate
    // }
    const findUser = await appUserAcitivityModel.find({
      email: UserLastActivity.email,
      createdAt: {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate(),
      }
    });
    let message
    if (findUser.length > 0) {
      const activities = findUser[0]?.activities;
      message = activities[activities.length - 1]?.activity;
    }
    else {
      message = null
    }
    res.status(200).send({
      error: false,
      data: {
        message: message
      }
    });

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getUsersWorkingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const querySchema: GetUserWorkingStatusType = await joiUserActivity.getUserActivitySchema.validateAsync(req.body);
    const query: GetUserWorkingStatusQueryType = {};

    query.createdAt = {
      $gte: moment().startOf('day').toDate(),
      $lte: moment().endOf('day').toDate(),
    }
    if (querySchema.search)
      query.$or = [
        {
          fullname: {
            $regex: querySchema.search,
            $options: 'is'
          }
        },
        {
          email: {
            $regex: querySchema.search,
            $options: 'is'
          }
        }
      ];

    const appUserActivities = await appUserAcitivityModel
      .find(query)
      .catch(error => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });

    const loggedInUsers: any = [];
    const breakInUsers: any = [];
    for (const iterator of appUserActivities) {
      const length = iterator.activities.length
      const appUserDetails = await appUserDetailsModel.findOne({ company_email: iterator.email, isDeleted: false });
      const appUser = await appUserModel.findOne({ _id: appUserDetails?.appUserId, isDeleted: false });
      if (iterator.activities[length - 1].activity == 'checkin' || iterator.activities[length - 1].activity == 'breakout') {
        if (querySchema.employeeType && appUser?.employee_type === querySchema.employeeType)
          loggedInUsers.push({ appUserId: appUserDetails?.appUserId, fullName: iterator.fullName, email: iterator.email });
        else if (!querySchema.employeeType)
          loggedInUsers.push({ appUserId: appUserDetails?.appUserId, fullName: iterator.fullName, email: iterator.email });
      }
      else if (iterator.activities[length - 1].activity == 'breakin' || iterator.activities[length - 1].activity == 'checkout') {
        if (querySchema.employeeType && appUser?.employee_type === querySchema.employeeType)
          breakInUsers.push({ appUserId: appUserDetails?.appUserId, fullName: iterator.fullName, email: iterator.email })
        else if (!querySchema.employeeType)
          breakInUsers.push({ appUserId: appUserDetails?.appUserId, fullName: iterator.fullName, email: iterator.email })
      }
    }

    if (res.headersSent == false) {
      res.status(200).send({
        error: false,
        data: {
          loggedInUsers: loggedInUsers,
          breakInUsers: breakInUsers,
          message: 'Users fetched  successfully'
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
  getUsersWorkingStatus,
  getUserLastActivity,
  getUserActivity,
  createActivityLogs,
  updateAttendance
}