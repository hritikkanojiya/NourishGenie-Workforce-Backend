import { NextFunction, Request, Response } from 'express';
import { calculateTimeSummary, logBackendError } from '../../../helpers/common/backend.functions';
import moment from 'moment';
import activity from '../../../models/agent/activity/activity.model'
import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model'
import { appAttandanceModel } from '../../../models/agent/attandence/attandence.model';

import {
  GetAgentActivityType,
  joiAgentActivity,
  MarkAttandanceType,
  updateAgentAttandenceType
  // GetTotalAgentActivityType
} from '../../../helpers/joi/agent/activity/index'

// export const attendenceMarker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   const currentDate = moment().format('DD-MM-YYYY');
//   const promise = new Promise((resolve, reject) => {
//     const queryDetails: MarkAttandanceType = await joiAgentActivity.markAttandanceSchema.validateAsync(req.body);
//     activity.findOne({ email: req.body.email, date: currentDate })
//       .then(async (findUser) => {
//         if (findUser) {
//           const activities = findUser.activities;
//           const latestActivity = activities[activities.length - 1].activity;

//           if (queryDetails.activity === 'breakin') {
//             // Check if the latest activity is checkin or checkout
//             if (latestActivity === 'checkin' || latestActivity === 'breakout') {
//               // Update the activities array with the new activity and time
//               const updatedActivities = [...activities];
//               updatedActivities.push({
//                 activity: req.body.activity,
//                 time: moment().format('HH:mm:ss'),
//               });

//               // Update the user's activities
//               await activity.updateOne(
//                 { email: req.body.email, date: currentDate },
//                 {
//                   $set: { activities: updatedActivities },
//                 }
//               );

//               resolve({ message: `${req.body.activity} marked successfully` });
//             } else {
//               resolve({ message: 'Can\'t perform this activity without checking in or break out' });
//             }
//           } else if (req.body.activity === 'checkin') {
//             // Check if the latest activity is checkout or checkin
//             if (latestActivity === 'checkout') {
//               // Update the activities array with the new activity and time
//               const updatedActivities = [...activities];
//               updatedActivities.push({
//                 activity: req.body.activity,
//                 time: moment().format('HH:mm:ss'),
//               });

//               // Update the user's activities
//               await activity.updateOne(
//                 { email: req.body.email, date: currentDate },
//                 {
//                   $set: { activities: updatedActivities },
//                 }
//               );

//               resolve({ message: `${req.body.activity} marked successfully` });
//             } else {
//               resolve({ message: 'Can\'t perform this activity without checking out' });
//             }
//           } else if (req.body.activity === 'checkout') {
//             // Check if the latest activity is checkin
//             if (latestActivity === 'checkin' || latestActivity === 'breakout') {
//               // Update the activities array with the new activity and time
//               const updatedActivities = [...activities];
//               updatedActivities.push({
//                 activity: req.body.activity,
//                 time: moment().format('HH:mm:ss'),
//               });

//               // Update the user's activities
//               await activity.updateOne(
//                 { email: req.body.email, date: currentDate },
//                 {
//                   $set: { activities: updatedActivities },
//                 }
//               );

//               resolve({ message: `${req.body.activity} marked successfully` });
//             } else {
//               resolve({ message: 'Can\'t perform this activity without checking in' });
//             }
//           } else if (req.body.activity === 'breakout') {
//             if (latestActivity === 'breakin') {
//               // Update the activities array with the new activity and time
//               const updatedActivities = [...activities];
//               updatedActivities.push({
//                 activity: req.body.activity,
//                 time: moment().format('HH:mm:ss'),
//               });
//               // Update the user's activities
//               await activity.updateOne(
//                 { email: req.body.email, date: currentDate },
//                 {
//                   $set: { activities: updatedActivities },
//                 }
//               );

//               resolve({ message: `${req.body.activity} marked successfully` });
//             } else {
//               resolve({ message: 'Can\'t perform this activity without breakin break' });
//             }
//           }
//         } else {
//           if (req.body.activity === 'checkout' || req.body.activity === 'breakin' || req.body.activity === 'breakout') {
//             resolve({ message: 'Can\'t perform this activity without checking in' });
//           } else {
//             // Create a new attendance record for the user
//             await activity.create({
//               email: req.body.email,
//               fullname: req.body.fullname,
//               activities: [
//                 {
//                   activity: req.body.activity,
//                   time: moment().format('HH:mm:ss'),
//                 },
//               ],
//               date: currentDate,
//             });

//             resolve({ message: `${req.body.activity} marked successfully` });
//           }
//         }
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });

//   promise
//     .then((data: any) => {
//       res.status(200).send({ error: false, message: data.message });
//     })
//     .catch((error) => {
//       next(error);
//     });
// };


export const attendenceMarker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentDate = moment().format('YYYY-MM-DD');
    // console.log(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    const queryDetails: MarkAttandanceType = await joiAgentActivity.markAttandanceSchema.validateAsync(req.body);
    const findUser = await activity.find({
      email: queryDetails.email,
      date: currentDate
    });
    let message;
    if (findUser.length > 0) {
      const activities = findUser[0].activities;
      const latestActivity = activities[activities.length - 1].activity;
      if (queryDetails.activity === 'breakin') {
        if (latestActivity === 'checkin' || latestActivity === 'breakout') {
          const updatedActivities = [...activities];
          updatedActivities.push({
            activity: queryDetails.activity,
            time: moment().format('HH:mm:ss'),
          });

          await activity.updateOne(
            { email: queryDetails.email, date: currentDate },
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

          await activity.updateOne(
            { email: queryDetails.email, date: currentDate },
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

          await activity.updateOne(
            { email: queryDetails.email, date: currentDate },
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

          await activity.updateOne(
            { email: queryDetails.email, date: currentDate },
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
        await activity.create({
          email: queryDetails.email,
          fullname: queryDetails.fullName,
          activities: [
            {
              activity: queryDetails.activity,
              time: moment().format('HH:mm:ss'),
            },
          ],
          date: currentDate,
        });

        message = `${queryDetails.activity} marked successfully`;
      }
    }
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
export const getAgentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const queryDetails: GetAgentActivityType = await joiAgentActivity.getAgentActivitySchema.validateAsync(req.body);
    const fromDate = new Date(queryDetails.date.from);
    const toDate = new Date(queryDetails.date.to);
    const appAgentDetails = await appAgentDetailsModel.findOne({ company_email: queryDetails.email, isDeleted: false });
    const activities = await activity.find({
      email: queryDetails.email,
      createdAt: {
        $gte: fromDate,
        $lte: new Date(toDate.setDate(toDate.getDate() + 1)),
      }
    });
    const agentActivities = [];
    const agentDetails = {
      email: queryDetails.email,
      fullName: activities[0].fullname
    }
    for (const iterator of activities) {
      const agentAttandence = await appAttandanceModel.findOne({
        email: queryDetails.email,
        date: iterator.date
      });
      if (agentAttandence) {
        const timeSummary = await calculateTimeSummary(iterator);
        const startingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[0]) ? appAgentDetails?.working_hours?.split('-')[0] : '');
        const endingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[1]) ? appAgentDetails?.working_hours?.split('-')[1] : '');
        const totalLoginTimeWithoutBreak = parseInt(moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours().toPrecision(3));
        let availaibility;
        if (totalLoginTimeWithoutBreak >= startingLimit && totalLoginTimeWithoutBreak <= endingLimit) {
          availaibility = 'full day';
        }
        else if ((totalLoginTimeWithoutBreak - startingLimit) <= 1) {
          availaibility = 'half day';
        }
        else if (totalLoginTimeWithoutBreak > endingLimit) {
          availaibility = 'over Time'
        }
        agentActivities.push({
          activities: iterator.activities,
          date: iterator.date,
          createdAt: iterator.createdAt,
          updatedAt: iterator.updatedAt,
          availaibility: availaibility,
          status: agentAttandence.status,
          totalLoggedinTime: `${moment.duration(timeSummary.totalLoggedInTime).asMinutes().toPrecision(3)} Minutes`,
          totalBreakTime: `${moment.duration(timeSummary.totalBreakTime).asMinutes().toPrecision(3)} Minutes`,
          totalLoginTimeWithoutBreak: `${moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asMinutes().toPrecision(3)} Minutes`,
        });
        await agentAttandence.updateOne({
          appAgentId: appAgentDetails?.appAgentId,
          email: queryDetails.email,
          status: agentAttandence.status,
          date: iterator.date,
        },
          {
            new: true
          }
        )
      }
      else {
        const timeSummary = await calculateTimeSummary(iterator);
        const startingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[0]) ? appAgentDetails?.working_hours?.split('-')[0] : '');
        const endingLimit = parseInt((appAgentDetails?.working_hours?.split('-')[1]) ? appAgentDetails?.working_hours?.split('-')[1] : '');
        const totalLoginTimeWithoutBreak = parseInt(moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asHours().toPrecision(3));
        let availaibility;
        if (totalLoginTimeWithoutBreak >= startingLimit && totalLoginTimeWithoutBreak <= endingLimit) {
          availaibility = 'full day';
        }
        else if ((totalLoginTimeWithoutBreak - startingLimit) <= 1) {
          availaibility = 'half day';
        }
        else if (totalLoginTimeWithoutBreak > startingLimit) {
          availaibility = 'over Time'
        }
        agentActivities.push({
          activities: iterator.activities,
          date: iterator.date,
          createdAt: iterator.createdAt,
          updatedAt: iterator.updatedAt,
          availaibility: availaibility,
          status: iterator.activities.length > 0 ? 'PRESENT' : 'ABSENT',
          totalLoggedinTime: `${moment.duration(timeSummary.totalLoggedInTime).asMinutes().toPrecision(3)} Minutes`,
          totalBreakTime: `${moment.duration(timeSummary.totalBreakTime).asMinutes().toPrecision(3)} Minutes`,
          totalLoginTimeWithoutBreak: `${moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).asMinutes().toPrecision(3)} Minutes`,
        });
        const newAttandence = new appAttandanceModel({
          appAgentId: appAgentDetails?._id,
          email: iterator.email,
          date: iterator.date,
          status: iterator.activities.length > 0 ? 'PRESENT' : 'ABSENT',
        })
        await newAttandence.save().catch(error => { throw new Error(error) });
      }
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

export const updateAttandence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const agentAttandenceDetails: updateAgentAttandenceType = await joiAgentActivity.updateAgentAttandenceSchema.validateAsync(req.body);

    const agentAttandence = await appAttandanceModel.findOne({
      email: agentAttandenceDetails.email,
      date: agentAttandenceDetails.date,
      isDeleted: false
    });
    await agentAttandence?.updateOne(agentAttandenceDetails,
      {
        new: true
      });

    if (res.headersSent == false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Agent attandence updated successfully'
        }
      });
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

export const getTotalAgentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();
    console.log(req.body.email);
    const userActivity = await activity.find({
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth
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

