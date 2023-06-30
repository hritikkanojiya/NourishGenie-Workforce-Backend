// Import Packages
import fs from 'fs';
import jsZip from 'jszip';
import moment from 'moment';
import nodeScheduler from 'node-schedule';
import { GlobalConfig } from './environment';
import { appAutomatedJobsModel } from '../../models/scheduler/automated_jobs/automated_jobs.model';
import { scheduleAppAutomatedJob } from '../service/node_scheduler/node_scheduler.service';
import { logBackendError } from './backend.functions';

// Export Access Log
const exportAccessLog = (): Promise<unknown> => {
  return new Promise<void>((resolve, reject) => {
    const accessFile = 'access.log';
    nodeScheduler.scheduleJob('Export Access Logs', GlobalConfig.EXPORT_ACCESS_LOG_CRON, () => {
      try {
        const JSZip = new jsZip();
        JSZip.file(accessFile, fs.readFileSync(`./${accessFile}`));
        JSZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
          .pipe(fs.createWriteStream(`${GlobalConfig.EXPORT_ACCESS_LOG_NAME + moment.now()}.zip`))
          .on('finish', () => {
            fs.open(`./${accessFile}`, 'w', (error, fd) => {
              if (error) throw error;
              fs.close(fd, error => {
                if (error) throw error;
              });
            });
            return resolve();
          });
      } catch (error) {
        return reject(error);
      }
    });
  });
};

const reScheduleAutomatedJobs = async (): Promise<void> => {
  try {
    const automatedJobs = await appAutomatedJobsModel.find({
      isActive: true,
      isDeleted: false,
    });

    if (automatedJobs.length > 0) {
      await Promise.all(
        automatedJobs.map(async (automatedJob) => {
          await scheduleAppAutomatedJob(automatedJob);
        })
      );
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    return (error);
  }

};
// Export Scheduler Jobs
export { exportAccessLog, reScheduleAutomatedJobs };
