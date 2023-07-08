import { NextFunction, Request, Response } from 'express';
import httpErrors from 'http-errors';
import appTicketModel from '../../models/ticket/app_tickets.models';
import commentTicketModel from '../../models/ticket/app_ticket_comments.models';
import { appUserAttachmentModel } from '../../models/agent/fields/app_attachments.model';
import priorityTicketModel from '../../models/ticket/app_ticket_priority.models';
import statusTicketModel from '../../models/ticket/app_ticket_status.models';
import categoryTicketModel from '../../models/ticket/app_ticket_categories.models';
import typeTicketModel from '../../models/ticket/app_ticket_type.models';
import { appUserModel } from '../../models/agent/agent.model';
// const download = require('download');
import { logBackendError } from '../../helpers/common/backend.functions';
import {
  joiAppTickets,
  CreateTicketSchemaType,
  CreateTicketCategoriesSchemaType,
  CreateTicketStatusSchemaType,
  CreateTicketPrioritySchemaType,
  CreateTicketTypeSchemaType,
  ChangeAssignerSchemaType,
  UpdatePrioritySchemaType,
  UpdateStatusSchemaType,
  UpdateTicketCompletionSchemaType,
  AddUserSchemaType,
  TransferTicketSchemaType,
  chatUserSchemaType,
  GetTicketDetailsSchemaType,
  UploadFileSchemaType,
  GetAllTicketSchemaType,
  GetAllCategoryTicketSchemaType,
  GetAllSearchTicketSchemaType
} from '../../helpers/joi/ticket/index'
import mongoose from 'mongoose';
import nodeMailer from 'nodemailer'

// Controller Methods

const createNewTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: CreateTicketSchemaType = await joiAppTickets.createTicketSchema.validateAsync(
      req.body
    );
    const assignedBy_present: any = await appUserModel.findOne({ _id: ticketDetails.From });

    const already_subject: any = await appTicketModel.findOne({ From: ticketDetails.From, subject: ticketDetails.subject });

    if (already_subject) {
      throw httpErrors.Forbidden(
        `Already Ticket Present. Please try again.`
      );
    }

    if (!assignedBy_present) {
      throw httpErrors.Forbidden(
        `You are not valid user. Please try again.`
      );
    }
    for (let i = 0; i < ticketDetails.To.length; i++) {
      const assignedTo_present: any = await appUserModel.findOne({ _id: ticketDetails.To[i] });
      if (!assignedTo_present) {
        throw httpErrors.Forbidden(
          `${assignedTo_present?.name} is not present. Please try again.`
        );
      }
    }
    const attach_file_array = [];

    attach_file_array.push(ticketDetails.file_id);

    const status_id = await statusTicketModel.findOne({ name: 'Open' });

    const ticket = new appTicketModel({
      subject: ticketDetails.subject,
      content: ticketDetails?.content,
      appTicketPriorityId: ticketDetails.appTicketPriorityId,
      appTicketCategoryId: ticketDetails.appTicketCategoryId,
      appTicketStatusId: status_id?._id,
      initialAddedUserLength: ticketDetails.To.length,
      From: ticketDetails.From,
      To: ticketDetails.To,
      appAttachments: attach_file_array,
    })
    const created_ticket_detail = await ticket.save();

    if (res.headersSent === false) {
      res.status(200).send({
        message: 'success',
        ticket_detail: created_ticket_detail
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const createTicketCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: CreateTicketCategoriesSchemaType = await joiAppTickets.createTicketCategoriesSchema.validateAsync(
      req.body
    );
    const categoryname_present = await categoryTicketModel.findOne({ name: ticketDetails.name });
    if (categoryname_present) {
      throw httpErrors.Forbidden(
        `Already present. Please try again.`
      );
    }
    const category_table = new categoryTicketModel({
      name: ticketDetails.name,
      description: ticketDetails.description,
    })
    const created_category_detail = await category_table.save();
    if (res.headersSent === false) {
      res.status(200).send({
        created_category_detail: created_category_detail,
        message: 'success',
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const createTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log(req.body, 'Run Successfully 1');
  try {
    const ticketDetails: CreateTicketStatusSchemaType = await joiAppTickets.createTicketStatusSchema.validateAsync(
      req.body
    );
    const statusname_present = await statusTicketModel.findOne({ name: ticketDetails.name });
    if (statusname_present) {
      throw httpErrors.Forbidden(
        `Already present. Please try again.`
      );
    }
    const status_table = {
      name: ticketDetails.name,
      color: ticketDetails.color,
      description: ticketDetails.description,
    }

    const created_status_detail = await statusTicketModel.create(status_table);

    if (res.headersSent === false)
      res.status(200).send({
        message: 'success',
        created_status_detail: created_status_detail
      });

  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const createTicketPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: CreateTicketPrioritySchemaType = await joiAppTickets.priorityTableSchema.validateAsync(
      req.body
    );
    const priorityname_present = await priorityTicketModel.findOne({ name: ticketDetails.name });
    if (priorityname_present) {
      throw httpErrors.Forbidden(
        `Already present. Please try again.`
      );
    }
    const priority_table = {
      name: ticketDetails.name,
      color: ticketDetails.color,
      description: ticketDetails.description,
    }
    const created_priority_detail = await priorityTicketModel.create(priority_table);
    if (res.headersSent === false)
      res.status(200).send({
        message: 'success',
        created_priority_detail: created_priority_detail
      });
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const createTicketType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: CreateTicketTypeSchemaType = await joiAppTickets.createTicketTypeSchema.validateAsync(
      req.body
    );
    const typename_present = await typeTicketModel.findOne({ name: ticketDetails.name });
    if (typename_present) {
      throw httpErrors.Forbidden(
        `Type Name Already present. Please try again.`
      );
    }
    const type_table = {
      name: ticketDetails.name
    }
    const created_type_detail = await typeTicketModel.create(type_table);
    res.status(200).send({
      message: 'success',
      created_type_detail: created_type_detail
    });
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const all_category = await categoryTicketModel.find({});
    if (res.headersSent === false)
      res.status(200).send({
        error: false,
        data: {
        all_category: all_category,
        message: 'Category fetched successfully',
        }
      });
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const all_status = await statusTicketModel.find({});
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_status: all_status,
          message: 'Status fetched successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const getPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const all_priority = await priorityTicketModel.find({});
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_priority: all_priority,
          message: 'Priority fetched successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const changeAssigner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const changeAssignerDetails: ChangeAssignerSchemaType = await joiAppTickets.changeAssignerSchema.validateAsync(
      req.body
    );
    // let assignedNext_present = await appUserModel.findOne({ _id: assigner_data.assignedNext });
    // if (!assignedNext_present) {
    //   throw httpErrors.Forbidden(
    //     `assignedNext_present not present. Please try again.`
    //   );
    // }
    const ticket_id = changeAssignerDetails.ticket_id;
    const assignedNext = changeAssignerDetails.assignedNext;
    const ticketData: any = await appTicketModel.findOne({ _id: ticket_id });
    const all_assigned_user: any = ticketData?.To;
    let t = 1;
    for (let i = 0; i < all_assigned_user?.length; i++) {
      if (all_assigned_user[i] == changeAssignerDetails.removalUser) {
        t = 0;
      }
      if (all_assigned_user[i] == changeAssignerDetails.assignedNext) {
        throw httpErrors.Forbidden(
          `assignedNext already present. Please try again.`
        );
      }
    }
    if (t) {
      throw httpErrors.Forbidden(
        `removalUser not present. Please try again.`
      );
    }
    const all_assigned_user1 = all_assigned_user.filter((item: string) => item.toString() !== changeAssignerDetails.removalUser);
    all_assigned_user1.push(assignedNext);
    ticketData.To = all_assigned_user1;
    await ticketData.save();
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Assigner changed successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const updateTicketPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updatePriorityDetails: UpdatePrioritySchemaType = await joiAppTickets.updatePrioritySchema.validateAsync(
      req.body
    );

    const ticketData = await appTicketModel.findOne({ _id: updatePriorityDetails.ticket_id });

    if (!ticketData) {
      throw httpErrors.Forbidden(
        `Not present. Please try again.`
      );
    }

    ticketData.appTicketPriorityId = (updatePriorityDetails.priorityId);

    await ticketData.save();

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'updated ticket priority successfully.',
        }
      });
    }


  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

// All api of myTicket - 
const updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateStatusDetails: UpdateStatusSchemaType = await joiAppTickets.updateStatusSchema.validateAsync(
      req.body
    );

    const ticketData = await appTicketModel.findOne({ _id: updateStatusDetails.ticket_id });
    if (!ticketData) {
      throw httpErrors.Forbidden(
        `Not present. Please try again.`
      );
    }
    ticketData.appTicketStatusId = updateStatusDetails.statusId;
    await ticketData.save();
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'updated ticket status successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const updateTicketCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updateCompletionDetails: UpdateTicketCompletionSchemaType = await joiAppTickets.updateTicketCompletionSchema.validateAsync(
      req.body
    );

    const ticketData = await appTicketModel.findOne({ _id: updateCompletionDetails.ticket_id });
    if (!ticketData) {
      throw httpErrors.Forbidden(
        `Not present. Please try again.`
      );
    }
    ticketData.completedPercent = updateCompletionDetails.completionPercent;

    await ticketData.save();

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'updated ticket completion percent successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const addUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const AddUserDetails: AddUserSchemaType = await joiAppTickets.addUserSchema.validateAsync(
      req.body
    );

    for (let i = 0; i < AddUserDetails.addedUsersIds.length; i++) {
      const added_present = await appUserModel.findOne({ _id: AddUserDetails.addedUsersIds[i] });
      if (!added_present) {
        throw httpErrors.Forbidden(
          `${AddUserDetails.addedUsersIds[i]} not present. Please try again.`
        );
      }
    }
    const ticketData = await appTicketModel.findOne({ _id: AddUserDetails.ticket_id });
    if (!ticketData) {
      throw httpErrors.Forbidden(
        `Not present. Please try again.`
      );
    }
    const initial_added_user_length = ticketData.initialAddedUserLength;
    if (AddUserDetails.addedUsersIds.length > initial_added_user_length + 2) {
      throw httpErrors.Forbidden(
        `Can not add user more than two, Sorry.`
      );
    }
    ticketData.To = AddUserDetails.addedUsersIds;
    await ticketData.save();
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Added users successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const transferTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transferTicketDetails: TransferTicketSchemaType = await joiAppTickets.transferTicketSchema.validateAsync(
      req.body
    );

    const ticketData = await appTicketModel.findOne({ _id: transferTicketDetails.ticket_id });
    if (!ticketData) {
      throw httpErrors.Forbidden(
        `Not present. Please try again.`
      );
    }
    const all_assigned_user = ticketData.To;
    let transferByCheckIsPresent = 1;
    for (let i = 0; i < all_assigned_user.length; i++) {
      if (all_assigned_user[i] == transferTicketDetails.transferBy) {
        transferByCheckIsPresent = 0;
      }
      if (all_assigned_user[i] == transferTicketDetails.transferTo) {
        throw httpErrors.Forbidden(
          `This ticket is already assigned to this user. Please try again.`
        );
      }
    }
    if (transferByCheckIsPresent) {
      throw httpErrors.Forbidden(
        `This ticket is not assigned for you. Please try again.`
      );
    }
    const all_assigned_user1 = all_assigned_user.filter((item: mongoose.Types.ObjectId) => item.toString() !== transferTicketDetails.transferBy.toString());
    console.log(all_assigned_user1, 'all_assigned_user1');
    all_assigned_user1.push(transferTicketDetails.transferTo);
    ticketData.To = all_assigned_user1;
    await ticketData.save();
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Transfered Ticket successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const chatUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: chatUserSchemaType = await joiAppTickets.chatUserSchema.validateAsync(
      req.body
    );

    // let chatBy_present = await appUserModel.findOne({ _id: chat_user_data.chatBy });
    // if (!chatBy_present) {
    //   throw httpErrors.Forbidden(
    //     `chat User is not Exist. Please try again.`
    //   );
    // }
    let ticket_data;
    if (ticketDetails.filename) {
      const attachmentDetail = await appUserAttachmentModel.create({
        name: ticketDetails.filename,
        type: 'file',
        extention: 'pdf',
        uploadedBy: ticketDetails.chatBy
      })
      const attach_file_array = [];
      attach_file_array.push(attachmentDetail._id.toString());
      ticket_data = {
        appTicketId: ticketDetails.ticket_id,
        content: ticketDetails.content,
        appAgentId: ticketDetails.chatBy,
        appAttachments: attach_file_array
      }
    }
    else {
      ticket_data = {
        appTicketId: ticketDetails.ticket_id,
        content: ticketDetails.content,
        appAgentId: ticketDetails.chatBy
      }
    }
    await commentTicketModel.create(ticket_data);
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'Chat user successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getTicketDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: GetTicketDetailsSchemaType = await joiAppTickets.getTicketDetailsSchema.validateAsync(
      req.body
    );

    // let user_present = await appUserModel.findOne({ _id: ticket_details.userId });
    // if (!user_present) {
    //   throw httpErrors.Forbidden(
    //     `User is not Exist. Please try again.`
    //   );
    // }
    const ticket_detail = await appTicketModel.findOne({ _id: ticketDetails.ticket_id });
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          ticketDetails: ticket_detail,
          message: 'Get ticket details successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getFileExtension = (filename: any): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

const fileTypes: Record<string, string> = {
  'txt': 'Text File',
  'doc': 'Microsoft Word Document',
  'docx': 'Microsoft Word Document',
  'xls': 'Microsoft Excel Spreadsheet',
  'xlsx': 'Microsoft Excel Spreadsheet',
  'pdf': 'PDF Document',
  'jpg': 'JPEG Image',
  'png': 'PNG Image',
  // Add more file types as needed
};
const getFileType = (extension: string): string => {

  return fileTypes[extension.toLowerCase()] || 'Unknown File Type';
}
const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketFileDetails: UploadFileSchemaType = await joiAppTickets.uploadFileSchema.validateAsync(
      req.body
    );

    const extension: string = getFileExtension(req?.file?.filename);
    const fileType = getFileType(extension);

    let attachmentDetail;
    if (req?.file?.filename) {
      attachmentDetail = await appUserAttachmentModel.create({
        name: req?.file?.filename,
        type: fileType,
        extension: extension,
        uploadedBy: ticketFileDetails.From,
        original_name: req?.file?.filename
      })
    }
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          attachmentDetailId: attachmentDetail?._id,
          message: 'upload file successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getAllTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: GetAllTicketSchemaType = await joiAppTickets.getAllTicketSchema.validateAsync(
      req.body
    );

    let all_ticket1, all_ticket2;
    if (!ticketDetails.sortBy && !ticketDetails.sortOn) {
      all_ticket1 = appTicketModel.find({ From: (ticketDetails.From) }).sort({ _id: -1 });
      all_ticket2 = await appTicketModel.find({ From: (ticketDetails.From) }).sort({ _id: -1 });
    }
    else {
      all_ticket1 = appTicketModel.find({ From: (ticketDetails.From) }).sort({ subject: ticketDetails.sortBy == 'asc' ? 1 : -1 });
      all_ticket2 = await appTicketModel.find({ From: (ticketDetails.From) }).sort({ subject: ticketDetails.sortBy == 'asc' ? 1 : -1 });
    }
    const total_ticket = all_ticket2?.length;
    const skip = (ticketDetails.page - 1) * ticketDetails.limit;
    const all_ticket = await all_ticket1.skip(skip).limit(ticketDetails.limit);
    const priority_detail = await priorityTicketModel.find({});
    const category_detail = await categoryTicketModel.find({});
    const status_detail = await statusTicketModel.find({});
    let all_ticket_detail: any = []
    const ticket_array: any = [];
    for (let i = 0; i < all_ticket.length; i++) {
      const category = await categoryTicketModel.findOne({ _id: (all_ticket[i].appTicketCategoryId) });
      ticket_array.push({ _id: all_ticket[i]._id, subject: all_ticket[i].subject, content: all_ticket[i].content, To: all_ticket[i].To, priority: all_ticket[i].appTicketPriorityId, category: category?.name, status: all_ticket[i].appTicketStatusId, complete: all_ticket[i].completedPercent, attachements: all_ticket[i].appAttachments });
    }
    all_ticket_detail = ticket_array;
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_ticket: all_ticket_detail,
          priority_detail: priority_detail,
          category_detail: category_detail,
          status_detail: status_detail,
          total_ticket: total_ticket,
          message: 'All tickets fetched successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getAllMyTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: GetAllTicketSchemaType = await joiAppTickets.getAllTicketSchema.validateAsync(
      req.body
    );

    let all_ticket1, all_ticket2;
    if (!ticketDetails.sortBy && !ticketDetails.sortOn) {
      all_ticket1 = appTicketModel.find({ To: { $in: [(ticketDetails.From)] } }).sort({ _id: -1 });
      all_ticket2 = await appTicketModel.find({ To: { $in: [(ticketDetails.From)] } }).sort({ _id: -1 });
    }
    else {
      all_ticket1 = appTicketModel.find({ To: { $in: [(ticketDetails.From)] } }).sort({ subject: ticketDetails.sortBy == 'asc' ? 1 : -1 });
      all_ticket2 = await appTicketModel.find({ To: { $in: [(ticketDetails.From)] } }).sort({ subject: ticketDetails.sortBy == 'asc' ? 1 : -1 });
    }
    const total_ticket = all_ticket2?.length;
    const skip = (ticketDetails.page - 1) * ticketDetails.limit;
    const all_ticket = await all_ticket1.skip(skip).limit(ticketDetails.limit);
    const priority_detail = await priorityTicketModel.find({});
    const category_detail = await categoryTicketModel.find({});
    const status_detail = await statusTicketModel.find({});
    let all_ticket_detail: any = []
    const ticket_array = [];
    for (let i = 0; i < all_ticket.length; i++) {
      const category = await categoryTicketModel.findOne({ _id: (all_ticket[i].appTicketCategoryId) });
      ticket_array.push({ _id: all_ticket[i]._id, subject: all_ticket[i].subject, content: all_ticket[i].content, To: all_ticket[i].To, priority: all_ticket[i].appTicketPriorityId, category: category?.name, status: all_ticket[i].appTicketStatusId, complete: all_ticket[i].completedPercent, attachements: all_ticket[i].appAttachments });
    }
    all_ticket_detail = ticket_array;
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_ticket: all_ticket_detail,
          priority_detail: priority_detail,
          category_detail: category_detail,
          status_detail: status_detail,
          total_ticket: total_ticket,
          message: 'All My tickets fetched successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getAllCategoryTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: GetAllCategoryTicketSchemaType = await joiAppTickets.getAllCategoryTicketSchema.validateAsync(
      req.body
    );
    let all_ticket1;
    let total_ticket = 0;
    if (ticketDetails.ticketPriorityId && ticketDetails.ticketStatusId) {
      all_ticket1 = appTicketModel.find({
        From: (ticketDetails.From),
        appTicketPriorityId: (ticketDetails.ticketPriorityId),
        appTicketStatusId: (ticketDetails.ticketStatusId)
      })
      total_ticket = await appTicketModel.countDocuments({
        From: (ticketDetails.From),
        appTicketPriorityId: (ticketDetails.ticketPriorityId),
        appTicketStatusId: (ticketDetails.ticketStatusId)
      });
    }
    else if (ticketDetails.ticketPriorityId && !ticketDetails.ticketStatusId) {
      all_ticket1 = appTicketModel.find({
        From: (ticketDetails.From),
        appTicketPriorityId: (ticketDetails.ticketPriorityId)
      })
      total_ticket = await appTicketModel.countDocuments({
        From: (ticketDetails.From),
        appTicketPriorityId: (ticketDetails.ticketPriorityId)
      });
    }
    else if (!ticketDetails.ticketPriorityId && ticketDetails.ticketStatusId) {
      all_ticket1 = appTicketModel.find({
        From: (ticketDetails.From),
        appTicketStatusId: (ticketDetails.ticketStatusId)
      })
      total_ticket = await appTicketModel.countDocuments({
        From: (ticketDetails.From),
        appTicketStatusId: (ticketDetails.ticketStatusId)
      });
    }
    else {
      all_ticket1 = appTicketModel.find({
        From: (ticketDetails.From)
      })
      total_ticket = await appTicketModel.countDocuments({
        From: (ticketDetails.From)
      });
    }
    const skip = (ticketDetails.page - 1) * ticketDetails.limit;
    const all_ticket = await all_ticket1.skip(skip).limit(ticketDetails.limit);
    let all_ticket_detail: any = []
    const ticket_array = [];
    for (let i = 0; i < all_ticket.length; i++) {
      ticket_array.push({ _id: all_ticket[i]._id, subject: all_ticket[i].subject, content: all_ticket[i].content, To: all_ticket[i].To, priority: all_ticket[i].appTicketPriorityId, category: all_ticket[i].appTicketCategoryId, status: all_ticket[i].appTicketStatusId, complete: all_ticket[i].completedPercent });
    }
    all_ticket_detail = ticket_array;
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_category_ticket: all_ticket_detail,
          total_ticket: total_ticket,
          message: 'All category tickets fetched successfully.',
        }
      });
    }
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getAllSearchTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketDetails: GetAllSearchTicketSchemaType = await joiAppTickets.getAllSearchTicketSchema.validateAsync(
      req.body
    );

    const all_ticket1 = appTicketModel.find({ From: ticketDetails.From, subject: { $regex: ticketDetails.searchValue } })
    const total_ticket = await appTicketModel.countDocuments({ From: ticketDetails.From, subject: { $regex: ticketDetails.searchValue } });
    const skip = (ticketDetails.page - 1) * ticketDetails.limit;
    const all_ticket = await all_ticket1.skip(skip).limit(ticketDetails.limit);
    let all_ticket_detail: any = []
    const ticket_array = [];
    for (let i = 0; i < all_ticket.length; i++) {
      ticket_array.push({ _id: all_ticket[i]._id, subject: all_ticket[i].subject, content: all_ticket[i].content, To: all_ticket[i].To, priority: all_ticket[i].appTicketPriorityId, category: all_ticket[i].appTicketCategoryId, status: all_ticket[i].appTicketStatusId, complete: all_ticket[i].completedPercent });
    }
    all_ticket_detail = ticket_array;

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          all_search_ticket: all_ticket_detail,
          total_ticket: total_ticket,
          message: 'All Saerch tickets fetched successfully.',
        }
      });
    }

  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

const getAllUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const all_user = await appUserModel.find({}, { first_name: 1, last_name: 1 });
    const allUser: any = [];
    for (let i = 0; i < all_user.length; i++) {
      allUser.push({ value: all_user[i]._id, label: `${all_user[i].first_name} ${all_user[i].last_name}` });
    }
    if (res.headersSent === false) {
      res.status(200).send({
        allUsers: allUser,
        message: 'All users fetched successfully',
      });
    };
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

// const downloadFile = async (req: Request, res: Response, next:NextFunction) => {
//   console.log(req.body, 'Run Successfully 1');
//   try {
//     // const filePath = path.join(__dirname, '../../../../public/UserFile');
//     const name = '1685074295792_Screenshot (12).png';
//     const file = `../../../../public/UserFile'/${name}`;
//     // Path to store the downloaded file
//     const filePath = `${__dirname}/files`;

//     download(file, filePath)
//       .then(() => {
//         console.log('File downloaded successfully!');
//       })
//     res.set('Access-Control-Allow-Origin', '*');
//     if (res.headersSent === false) {
//       res.status(200).send({
//         message: 'success',
//       });
//     };
//   } catch(error: any) {
//     console.log(error, 'error catch found');
//     res.status(400).send({ message: 'error' });
//   }
// };

const getFileName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const attachements = req.body.attachements;
    const file_name_array = [];
    for (let i = 0; i < attachements.length; i++) {
      const file_name = await appUserAttachmentModel.findOne({ _id: attachements[i] });
      file_name_array.push(file_name?.name);
    }
    if (res.headersSent === false) {
      res.status(200).send({
        file_name_array: file_name_array,
        message: 'File name fetched successfully',
      });
    };
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
const sendRemainder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reciever_id = req.body.reciever_id;
    const message = req.body.message;
    const sender_user = await appUserModel.findOne({ _id: '6370e0792f7c84e5b547e329' });
    const reciever_user = await appUserModel.findOne({ _id: reciever_id });
    const sender_email = sender_user?.email;
    const reciever_email = reciever_user?.email;
    const transporter = nodeMailer?.createTransport({
      service: 'gmail',
      auth: {
        user: 'faizabadamit26@gmail.com',
        pass: 'xwgksbbxrweruwyl',
      },
    });

    // send mail with defined transport object
    const mailStatus = await transporter.sendMail({
      from: sender_email, // sender address
      to: reciever_email, // list of recipients
      subject: 'Remind! Ticket generated against you',
      text: message, // plain text
    });

    console.log(`Message sent: ${mailStatus.messageId}`);

    if (res.headersSent === false) {
      res.status(200).send({
        message: 'success',
      });
    };
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      req?.originalUrl,
      req?.ip,
      error?.stack
    );
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};



// Export Methods
export {
  createNewTicket,
  changeAssigner,
  updateTicketPriority,
  updateTicketStatus,
  updateTicketCompletion,
  addUser,
  chatUser,
  transferTicket,
  createTicketPriority,
  createTicketType,
  createTicketStatus,
  createTicketCategories,
  getTicketDetail,
  getPriority,
  getCategory,
  getStatus,
  uploadFile,
  getAllTicket,
  getAllCategoryTicket,
  getAllSearchTicket,
  getAllMyTicket,
  getAllUser,
  // downloadFile,
  getFileName,
  sendRemainder
};