import nodeScheduler from 'node-schedule';
import { logBackendError } from '../../common/backend.functions';

// import { generateSalarySlipPDF } from '../../../controllers/salary_document/salary.controller';
import { createAppUsersAttendance } from '../../../controllers/agent/attendance/attendance.controller';
// import appAgentModel from '../../../models/agent/agent.model';

export const scheduleAppAutomatedJob = (): void => {
  try {
    nodeScheduler.scheduleJob('*/1 * * * *', async () => {
      // const appUsers = await appAgentModel.find();
      // await Promise.all(
      //   appUsers.map(async (appUser) => {
      //     // console.log(appUser._id);
      //     await generateSalarySlipPDF(appUser?._id);
      //   })
      // )
      await createAppUsersAttendance();
      console.log('Attendance created successfully');
    })
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stacke);
    return error
  }
};

// const getScheduledJobs = (appAutomatedJobId) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const scheduledJob = nodeScheduler.scheduledJobs[appAutomatedJobId];
//       resolve(scheduledJob ? scheduledJob : false);
//     } catch (error) {
//       logBackendError(__filename, error?.message, null, null, error?.stack);
//       reject(error);
//     }
//   });
// };

// const cancelScheduledJob = (appAutomatedJobId) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const scheduledJob = nodeScheduler.scheduledJobs[appAutomatedJobId];
//       if (scheduledJob != undefined) {
//         await createAppAutomatedJobLog(
//           appAutomatedJobId,
//           'CANCEL',
//           `Cancelled Automated Job [${appAutomatedJobId}]`,
//           __filename,
//           'cancelScheduledJob'
//         );
//       }

//       return scheduledJob !== undefined
//         ? scheduledJob.cancel()
//           ? resolve()
//           : reject()
//         : resolve();
//     } catch (error) {
//       await createAppAutomatedJobLog(
//         appAutomatedJobId,
//         'ERROR',
//         error?.message,
//         __filename,
//         'cancelScheduledJob'
//       );
//       logBackendError(__filename, error?.message, null, null, error?.stack);
//       reject(error);
//     }
//   });
// };

// const createAppAutomatedJobLog = (
//   appAutomatedJobId,
//   logType,
//   description = null,
//   scriptPath = null,
//   methodName = null,
//   isDeleted = false
// ) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Construct Data
//       const automatedJobLog = new appAutomatedJobLogsModel({
//         appAutomatedJobId: appAutomatedJobId,
//         type: logType,
//         description: description,
//         scriptPath: scriptPath,
//         methodName: methodName,
//         isDeleted: isDeleted === true ? true : false,
//       });

//       // Save Record in Collection
//       const storeAutomatedJobLog = await automatedJobLog.save();

//       return resolve(storeAutomatedJobLog);
//     } catch (error) {
//       logBackendError(__filename, error?.message, null, null, error?.stack);
//       return reject(error);
//     }
//   });
// };

// module.exports = {
//   scheduleAppAutomatedJob,
//   getScheduledJobs,
//   cancelScheduledJob,
//   createAppAutomatedJobLog,
// };
