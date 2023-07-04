import fs from 'fs';
import httpErrors from 'http-errors'

import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model';
import appAgentModel from '../../../models/agent/agent.model';
import { logBackendError } from '../../../helpers/common/backend.functions';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import { appUserAttendanceModel } from '../../../models/agent/attendance/attendance.model';
import moment from 'moment';

const _calculateLeavesAmount = (userBasicSalary: number, userLeavesCount: number): number => {
  try {
    const perDayAmount: number = parseInt((userBasicSalary / 30).toFixed(2));
    return perDayAmount * userLeavesCount;
  } catch (error: any) {
    logBackendError(__filename, error?.message, null, null, error?.stack);
    return error;
  }
}

const generateSalarySlipPDF = async (incentive = 5000): Promise<void> => {
  try {
    // Launch a headless browser instance
    const browser = await puppeteer.launch({
      headless: 'new'
    });
    const page = await browser.newPage();

    const temaplatePath = '/home/deepak/Desktop/NourishGenie/hr_module/backend/src/template/salary_slip.ejs'; // Replace with the actual file path to the EJS file

    const appUsers = await appAgentModel.find({
      isDeleted: false
    });

    for (const user of appUsers) {
      const appUserCompanydetails: any = await appAgentDetailsModel.findOne({
        appAgentId: user._id,
        isDeleted: false
      });

      const leavesAmount: number = _calculateLeavesAmount(parseInt(appUserCompanydetails?.salary), 2)

      // Define the data to be set in the EJS template
      const data = {
        employeeName: `${user?.first_name} ${user?.last_name}`,
        salary: appUserCompanydetails.salary,
        professionTax: 200,
        noOfLeaves: 2,
        leaveAmount: leavesAmount,
        totalDeduction: leavesAmount + 200,
        totalAmount: parseInt(appUserCompanydetails.salary) + incentive,
        incentive: incentive,
        netSalary: parseInt(appUserCompanydetails.salary) + 5000 - leavesAmount - 200,
      };

      const fileContent = fs.readFileSync(temaplatePath, 'utf8');
      const renderedContent = ejs.render(fileContent, data);

      await page.setContent(renderedContent);

      // Generate the PDF from the HTML template
      const pdfBuffer = await page.pdf();

      // Set the response headers

      const directoryPath = '/home/deepak/Desktop/NourishGenie/hr_module/backend/src/template'; // Replace with the desired directory path
      const filename = `${user._id}.pdf`; // Replace with the desired filename

      const filePath = `${directoryPath}/${filename}`;

      const createStream = fs.createWriteStream(filePath);
      // Save the PDF buffer to a file
      createStream.write(pdfBuffer);
      createStream.close()
      createStream.end();

      // Send the PDF buffer as the response
      console.log('PDF generated and saved successfully.');
    }
    // Close the browser instance
    await browser.close();

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return error;
  }
};

const markAttendance = async (status: string): Promise<void> => {
  try {
    const appUsers = await appAgentDetailsModel.find({
      isDeleted: false
    });
    await Promise.all(
      appUsers.map(async (user) => {
        const doesAttendanceExist = await appUserAttendanceModel.findOne({
          appUserId: user.appAgentId,
          createdAt: {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
          }
        })

        if (!doesAttendanceExist) {
          const userAttendance = new appUserAttendanceModel({
            appUserId: user.appAgentId,
            email: user.company_email,
            availability: 'Not Available',
            status: status,
          })
          await userAttendance.save().catch((error) => {
            throw httpErrors.UnprocessableEntity(error?.message);
          });
        }
      })
    )
    console.log('Attendance Marked Successfully');
  } catch (error: any) {
    console.log(error);
    return error;
  }
};

function printName(name: string): void {
  console.log(typeof name);
  console.log(`your name is ${name}`);
}

export {
  printName,
  generateSalarySlipPDF,
  markAttendance
}