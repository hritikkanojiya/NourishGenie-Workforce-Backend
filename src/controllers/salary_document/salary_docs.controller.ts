import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';


export const generateSalarySlipPDF = async (_req: Request, res: Response): Promise<void> => {
    // Retrieve the necessary data for the salary slip
    const salaryData = {
        employeeName: 'John Doe',
        salary: 5000,
        deductions: 500,
        netSalary: 4500,
    };

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set the response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=salary-slip.pdf');

    // Pipe the PDF document directly to the response
    doc.pipe(res);

    // Write the PDF content using PDFKit
    doc.font('Helvetica').fontSize(20).text('Salary Slip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Employee Name: ${salaryData.employeeName}`);
    doc.fontSize(14).text(`Salary: $${salaryData.salary}`);
    doc.fontSize(14).text(`Deductions: $${salaryData.deductions}`);
    doc.fontSize(14).text(`Net Salary: $${salaryData.netSalary}`);

    // Finalize the PDF and end the response

    res.render('salary-slip', { salaryData });
    doc.end();
};
