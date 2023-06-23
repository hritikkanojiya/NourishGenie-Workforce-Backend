import { NextFunction, Request, Response } from 'express';
import { calculateTimeSummary } from '../../../helpers/common/backend.functions';

import  moment from'moment';
import activity from '../../../models/agent/activity/activity.model'

export const attendenceMarker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const currentDate = moment().format('DD-MM-YYYY');
  
    const promise = new Promise((resolve, reject) => {
      activity.findOne({ email: req.body.email, date: currentDate })
        .then(async (findUser) => {
          if (findUser) {
            const activities = findUser.activities;
            const latestActivity = activities[activities.length - 1].activity;
  
            if (req.body.activity === 'breakin') {
              // Check if the latest activity is checkin or checkout
              if (latestActivity === 'checkin' || latestActivity === 'breakout') {
                // Update the activities array with the new activity and time
                const updatedActivities = [...activities];
                updatedActivities.push({
                  activity: req.body.activity,
                  time: moment().format('HH:mm:ss'),
                });
  
                // Update the user's activities
                await activity.updateOne(
                  { email: req.body.email, date: currentDate },
                  {
                    $set: { activities: updatedActivities },
                  }
                );
  
                resolve({ message: `${req.body.activity} marked successfully` });
              } else {
                resolve({ message: 'Can\'t perform this activity without checking in or break out' });
              }
            } else if (req.body.activity === 'checkin') {
              // Check if the latest activity is checkout or checkin
              if (latestActivity === 'checkout') {
                // Update the activities array with the new activity and time
                const updatedActivities = [...activities];
                updatedActivities.push({
                  activity: req.body.activity,
                  time: moment().format('HH:mm:ss'),
                });
  
                // Update the user's activities
                await activity.updateOne(
                  { email: req.body.email, date: currentDate },
                  {
                    $set: { activities: updatedActivities },
                  }
                );
  
                resolve({ message: `${req.body.activity} marked successfully` });
              } else {
                resolve({ message: 'Can\'t perform this activity without checking out' });
              }
            } else if (req.body.activity === 'checkout') {
              // Check if the latest activity is checkin
              if (latestActivity === 'checkin' || latestActivity === 'breakout') {
                // Update the activities array with the new activity and time
                const updatedActivities = [...activities];
                updatedActivities.push({
                  activity: req.body.activity,
                  time: moment().format('HH:mm:ss'),
                });
  
                // Update the user's activities
                await activity.updateOne(
                  { email: req.body.email, date: currentDate },
                  {
                    $set: { activities: updatedActivities },
                  }
                );
  
                resolve({ message: `${req.body.activity} marked successfully` });
              } else {
                resolve({ message: 'Can\'t perform this activity without checking in' });
              }
            } else if (req.body.activity === 'breakout') {
              if (latestActivity === 'breakin') {
                // Update the activities array with the new activity and time
                const updatedActivities = [...activities];
                updatedActivities.push({
                  activity: req.body.activity,
                  time: moment().format('HH:mm:ss'),
                });
                // Update the user's activities
                await activity.updateOne(
                  { email: req.body.email, date: currentDate },
                  {
                    $set: { activities: updatedActivities },
                  }
                );
  
                resolve({ message: `${req.body.activity} marked successfully` });
              } else {
                resolve({ message: 'Can\'t perform this activity without breakin break' });
              }
            }
          } else {
            if (req.body.activity === 'checkout' || req.body.activity === 'breakin' || req.body.activity === 'breakout') {
              resolve({ message: 'Can\'t perform this activity without checking in' });
            } else {
              // Create a new attendance record for the user
              await activity.create({
                email: req.body.email,
                fullname: req.body.fullname,
                activities: [
                  {
                    activity: req.body.activity,
                    time: moment().format('HH:mm:ss'),
                  },
                ],
                date: currentDate,
              });
  
              resolve({ message: `${req.body.activity} marked successfully` });
            }
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  
    promise
      .then((data: any) => {
        res.status(200).send({ code: 200, message: data.message });
      })
      .catch((e) => {
        next(e);
      });
  };
  
  export const getUserActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // const currentDate = moment().format('DD-MM-YYYY');
    const { email , date } = req.body; 
  
    try {
     
        const userActivity = await activity.find({email:email , date: date });
  
        const userData = [];
        for (const iterator of userActivity) {
          const timeSummary = await calculateTimeSummary(iterator);
          userData.push({
            email: iterator.email,
            fullname: iterator.fullname,
            activities: iterator.activities,
            date: iterator.date,
            totalLoggedinTime: moment.duration(timeSummary.totalLoggedInTime).humanize(),
            totalBreakTime: moment.duration(timeSummary.totalBreakTime).humanize(),
            totalLoginTimeWithoutBreak: moment.duration(timeSummary.totalLoggedInTimeWithoutBreaks).humanize()
          });
        }
  
        res.status(200).send({ code: 200, data: userData });
      
    } catch (error) {
      next(error);
    }
  };
  

  export const getTotalUserActivity = async (
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
        userData[user].totalLoggedinTime = moment
          .duration(userData[user].totalLoggedinTime)
          .humanize();
  
        userData[user].totalBreakTime = moment
          .duration(userData[user].totalBreakTime)
          .humanize();
  
        userData[user].totalLoginTimeWithoutBreak = moment
          .duration(userData[user].totalLoginTimeWithoutBreak)
          .humanize();
      }
  
      const result = Object.values(userData);
      res.status(200).send({ code: 200, data: result });
    } catch (error) {
      next(error);
    }
  };

