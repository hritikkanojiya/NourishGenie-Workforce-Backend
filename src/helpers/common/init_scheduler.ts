// Import Packages
import fs from 'fs';
import jsZip from 'jszip';
import moment from 'moment';
import nodeScheduler from 'node-schedule';
import { GlobalConfig } from './environment';

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
  // return new Promise<void>(async (resolve, reject) => {
  // });
};

// Export Scheduler Jobs
module.exports = { exportAccessLog, reScheduleAutomatedJobs };
