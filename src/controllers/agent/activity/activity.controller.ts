import { NextFunction, Request, Response } from 'express';
import { calculateTimeSummary, logBackendError } from '../../../helpers/common/backend.functions';
import moment from 'moment';
import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model'
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import appAgentAcitivityModel from '../../../models/agent/activity/activity.model'

import {
  GetUserActivityType,
  GetUserActivityQueryType,
  joiUserActivity,
  CreateUserActivityLogsType,
  // UpdateUserAttandenceType,
  UserLastActivityType,
  GetUsersActivityType,
  // AppUserActivityType
  // GetTotalAgentActivityType
} from '../../../helpers/joi/agent/activity/index'
import httpErrors from 'http-errors';
import appAgentModel from '../../../models/agent/agent.model';

const updateAttendance = async (userActivities: any): Promise<any> => {
  try {
    for (const iterator of userActivities) {
      const appAgentDetails = await appAgentDetailsModel.findOne({ company_email: iterator.email, isDeleted: false });
      const timeSummary = await calculateTimeSummary(iterator);
      const startingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[0]) ? appAgentDetails?.working_hours?.split('-')[0] : '');
      const endingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[1]) ? appAgentDetails?.working_hours?.split('-')[1] : '');
      const totalLoginTimeWithoutBreak = moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours();
      let availability = 'not available';
      // let overTime = 0;
      if (totalLoginTimeWithoutBreak >= startingLimit && totalLoginTimeWithoutBreak <= endingLimit) {
        availability = 'full day';
      }
      else if (Math.abs(totalLoginTimeWithoutBreak - startingLimit) <= 1) {
        availability = 'half day';
      }
      else if (totalLoginTimeWithoutBreak > endingLimit) {
        availability = 'over Time'
        // overTime = (totalLoginTimeWithoutBreak - endingLimit) * 60;
      }
      const agentAttandence = await appUserAttendanceModel.findOne({
        appUserId: appAgentDetails?.appAgentId,
        createdAt: {
          $gte: moment(iterator.createdAt).startOf('day').toDate(),
          $lte: moment(iterator.createdAt).endOf('day').toDate(),
        },
        isDeleted: false,
      });
      console.log(agentAttandence);
      await agentAttandence?.updateOne({
        appUserId: appAgentDetails?.appAgentId,
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
    console.log(error);
    logBackendError(__filename, error?.message, null, null, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    return error;
  }
}

const createActivityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const queryDetails: CreateUserActivityLogsType = await joiUserActivity.createActivityLogsSchema.validateAsync(req.body);
    const userActivities = await appAgentAcitivityModel.find({
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
            time: moment().toDate(),
          });

          await appAgentAcitivityModel.updateOne(
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
            time: moment().toDate(),
          });

          await appAgentAcitivityModel.updateOne(
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
            time: moment().toDate(),
          });

          await appAgentAcitivityModel.updateOne(
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
            time: moment().toDate(),
          });

          await appAgentAcitivityModel.updateOne(
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
        await appAgentAcitivityModel.create({
          email: queryDetails.email,
          fullname: queryDetails.fullName,
          activities: [
            {
              activity: queryDetails.activity,
              time: moment().toDate(),
            },
          ],
        });

        message = `${queryDetails.activity} marked successfully`;
      }
    }
    const userActivity = await appAgentAcitivityModel.find({
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

const getAgentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const queryDetails: GetUserActivityType = await joiUserActivity.getAgentActivitySchema.validateAsync(req.body);
    const fromDate = new Date(queryDetails.date.from);
    const toDate = new Date(queryDetails.date.to);
    const appAgentDetails = await appAgentDetailsModel.findOne({ company_email: queryDetails.email, isDeleted: false });
    const appAgent = await appAgentModel.findOne({ _id: appAgentDetails?.appAgentId, isDeleted: false });
    const activities = await appAgentAcitivityModel.find({
      email: queryDetails.email,
      createdAt: {
        $gte: fromDate,
        $lte: new Date(toDate.setDate(toDate.getDate() + 1)),
      }
    });
    const agentActivities = [];
    const agentDetails = {
      email: queryDetails.email,
      fullName: `${appAgent?.first_name} ${appAgent?.last_name}`
    }
    for (const iterator of activities) {
      const timeSummary = await calculateTimeSummary(iterator);
      const startingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[0]) ? appAgentDetails?.working_hours?.split('-')[0] : '');
      const endingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[1]) ? appAgentDetails?.working_hours?.split('-')[1] : '');
      const totalLoginTimeWithoutBreak = moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours();
      let availability = 'not available';
      let overTime = 0;
      if (totalLoginTimeWithoutBreak >= startingLimit && totalLoginTimeWithoutBreak <= endingLimit) {
        availability = 'full day';
      }
      else if (Math.abs(totalLoginTimeWithoutBreak - startingLimit) <= 1) {
        availability = 'half day';
      }
      else if (totalLoginTimeWithoutBreak > endingLimit) {
        availability = 'over Time'
        overTime = (totalLoginTimeWithoutBreak - endingLimit) * 60;
      }
      // await convertDateTimeFormat(iterator.activities),
      agentActivities.push({
        activities: iterator.activities,
        createdAt: iterator.createdAt,
        updatedAt: iterator.updatedAt,
        availability: availability,
        status: totalLoginTimeWithoutBreak > 1 ? 'PRESENT' : 'ABSENT',
        totalLoggedinTime: `${moment.duration(timeSummary.totalLoggedInTime).asMinutes().toFixed(2)} Minutes`,
        totalBreakTime: `${moment.duration(timeSummary.totalBreakTime).asMinutes().toFixed(2)} Minutes`,
        totalLoginTimeWithoutBreak: `${moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asMinutes().toFixed(2)} Minutes`,
        overTime: `${overTime.toFixed(2)} Mintues`,
      });
    }

    if (res.headersSent == false) {
      res.status(200).send({
        error: false,
        data: {
          agentDetails: agentDetails,
          agentActivitiesDetails: agentActivities,
          message: 'Agent Activities fetched successfully'
        }
      });
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getTotalAgentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();
    console.log(startOfMonth);
    console.log(endOfMonth);
    console.log(req.body.email);
    const userActivity = await appAgentAcitivityModel.find({
      email: req.body.email,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const userData: Record<string, any> = {};
    for (const iterator of userActivity) {
      const { email, fullname } = iterator;
      const timeSummary = await calculateTimeSummary(iterator);

      if (!userData[email]) {
        userData[email] = {
          email,
          fullname,
          totalLoggedinTime: 0,
          totalBreakTime: 0,
          totalLoginTimeWithoutBreak: 0
        };
      }

      userData[email].totalLoggedinTime += timeSummary.totalLoggedInTime;
      userData[email].totalBreakTime += timeSummary.totalBreakTime;
      userData[email].totalLoginTimeWithoutBreak += timeSummary.totalLoggedInTimeWithoutBreaks;
    }

    for (const user in userData) {
      userData[user].totalLoggedinTime = `${moment.duration(userData[user].totalLoggedinTime).asHours().toPrecision(3)} Hours`

      userData[user].totalBreakTime = `${moment.duration(userData[user].totalBreakTime).asHours().toPrecision(3)} Hours`

      userData[user].totalLoginTimeWithoutBreak = `${moment.duration(userData[user].totalLoggedInTimeWithoutBreaks).asHours().toPrecision(3)} Hours`
    }

    const result = Object.values(userData);
    res.status(200).send({ error: false, data: result });
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getAgentLastActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agentLastActivity: UserLastActivityType = await joiUserActivity.agentLastActivitySchema.validateAsync(req.body);
    if (agentLastActivity.date == 'today') {
      const currentDate = moment().format('YYYY-MM-DD');
      agentLastActivity.date = currentDate
    }
    const findUser = await appAgentAcitivityModel.find({
      email: agentLastActivity.email,
      date: agentLastActivity.date
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
    const querySchema: GetUsersActivityType = await joiUserActivity.getUserActivitySchema.validateAsync(req.body);
    const query: GetUserActivityQueryType = {};

    query.createdAt = {
      $gte: moment().startOf('day'),
      $lte: moment().endOf('day'),
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

    const appAgentActivities = await appAgentAcitivityModel
      .find(query)
      .catch(error => {
        throw httpErrors.UnprocessableEntity(
          error?.message ? error.message : 'Unable to retrieve records from Database.'
        );
      });

    const loggedInUsers: any = [];
    const breakInUsers: any = [];
    for (const iterator of appAgentActivities) {
      const length = iterator.activities.length
      const appUserDetails = await appAgentDetailsModel.findOne({ company_email: iterator.email, isDeleted: false });
      const appUser = await appAgentModel.findOne({ _id: appUserDetails?.appAgentId, isDeleted: false });
      if (iterator.activities[length - 1].activity == 'checkin' || iterator.activities[length - 1].activity == 'breakout') {
        if (querySchema.employeeType && appUser?.employee_type === querySchema.employeeType)
          loggedInUsers.push({ appUserId: appUserDetails?.appAgentId, fullname: iterator.fullname, email: iterator.email });
        else if (!querySchema.employeeType)
          loggedInUsers.push({ appUserId: appUserDetails?.appAgentId, fullname: iterator.fullname, email: iterator.email });
      }
      else if (iterator.activities[length - 1].activity == 'breakin' || iterator.activities[length - 1].activity == 'checkout') {
        if (querySchema.employeeType && appUser?.employee_type === querySchema.employeeType)
          breakInUsers.push({ appUserId: appUserDetails?.appAgentId, fullname: iterator.fullname, email: iterator.email })
        else if (!querySchema.employeeType)
          breakInUsers.push({ appUserId: appUserDetails?.appAgentId, fullname: iterator.fullname, email: iterator.email })
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
  getAgentLastActivity,
  getTotalAgentActivity,
  getAgentActivity,
  createActivityLogs,
  updateAttendance
}