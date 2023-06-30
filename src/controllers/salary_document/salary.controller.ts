import fs from 'fs';
// import httpErrors from 'http-errors'

import appAgentDetailsModel from '../../models/agent/fields/app_agent_details.model';
import appAgentModel from '../../models/agent/agent.model';
// import { GlobalConfig } from '../../helpers/common/environment';
import { logBackendError } from '../../helpers/common/backend.functions';
// import path from 'path';
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import {
    joiAppUserSalarySlip,
    CreateAppUserSalarySlipType
} from '../../helpers/joi/salary_slip/index'


const _calculateLeavesAmount = (userBasicSalary: number, userLeavesCount: number): number => {
    try {
        const perDayAmount: number = parseInt((userBasicSalary / 30).toFixed(2));
        return perDayAmount * userLeavesCount;
    } catch (error: any) {
        logBackendError(__filename, error?.message, null, null, error?.stack);
        return error;
    }
}

export const generateSalarySlipPDF = async (agentId: mongoose.Types.ObjectId, incentive = 5000): Promise<Buffer> => {
    try {
        // Launch a headless browser instance
        const browser = await puppeteer.launch({
            headless: 'new'
        });
        const page = await browser.newPage();

        const temaplatePath = '/home/deepak/Desktop/NourishGenie/hr_module/backend/src/template/salary_slip.ejs'; // Replace with the actual file path to the EJS file

        const appUserDetails = await appAgentModel.findOne({
            _id: (agentId),
            isDeleted: false
        });

        const appUserCompanydetails: any = await appAgentDetailsModel.findOne({
            appAgentId: (agentId),
            isDeleted: false
        });

        const leavesAmount: number = _calculateLeavesAmount(parseInt(appUserCompanydetails?.salary), 2)

        // Define the data to be set in the EJS template
        const data = {
            employeeName: `${appUserDetails?.first_name} ${appUserDetails?.last_name}`,
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
        const filename = `${agentId._id}.pdf`; // Replace with the desired filename

        const filePath = `${directoryPath}/${filename}`;

        const createStream = fs.createWriteStream(filePath);
        // Save the PDF buffer to a file
        createStream.write(pdfBuffer);
        createStream.close()
        createStream.end();

        // Send the PDF buffer as the response
        console.log('PDF generated and saved successfully.');

        // Close the browser instance
        await browser.close();

        return pdfBuffer;
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return error;
    }
};

const createAppUserSalarySlip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appUserSalarySlipDetails: CreateAppUserSalarySlipType = await joiAppUserSalarySlip.createAppUserSalarySlipSchema.validateAsync(req.body);
        const pdfBuffer: Buffer = await generateSalarySlipPDF(appUserSalarySlipDetails.appUserId, appUserSalarySlipDetails.incentive);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=salary-slip.pdf');
        res.send(pdfBuffer);
    } catch (error: any) {
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
}

export { createAppUserSalarySlip }


