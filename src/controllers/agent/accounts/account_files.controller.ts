//controllers for updating a file and deleting a file
import { NextFunction, Request, Response } from 'express';
import appAttachmentModel from '../../../models/agent/fields/app_attachments.model';
import appAgentModel from '../../../models/agent/agent.model';
import appAgentFileModel from '../../../models/agent/fields/app_agent_files.model';
// import { appAgentFilesFolderModel } from '../../../models/agent/agent_files_folder.model'
import { logBackendError } from '../../../helpers/common/backend.functions';
import {
  joiAgentFile,
  DeleteAppUserFileType,
  GetSingleFileType,
  GetAppUserFileType,
  UpdateFilesType,
  UpdatedFilesType
} from '../../../helpers/joi/agent/account/account_files/index';
import httpErrors from 'http-errors';
import path from 'path';
import fs from 'fs';
import { GlobalConfig } from '../../../helpers/common/environment';

const FILE_UPLOAD_PATH = GlobalConfig.FILE_UPLOAD_PATH

//description: delete a file
//route: POST: /api/v1/account_files/deleteFile
//access: private
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const appFileDetails: DeleteAppUserFileType = await joiAgentFile.deleteAppUserFileSchema.validateAsync(req.body);
    //check if user exist in collection

    if (
      appFileDetails.aadhar_cardId === null &&
      appFileDetails.pan_cardId === null &&
      appFileDetails.profile_pictureId === null &&
      appFileDetails.documentId === null
    )
      throw httpErrors.Conflict(`no file to delete.`);

    if (appFileDetails.aadhar_cardId) {
      const doesAadharFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.aadhar_cardId),
        isDeleted: false
      });
      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appFileDetails.aadhar_cardId}] does not exist.`);

      //delete file
      const filePath = `${FILE_UPLOAD_PATH}/${doesAadharFileExist?.uploadedBy}/documents/${doesAadharFileExist?.name}`;

      fs.unlinkSync(filePath);

      await doesAadharFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    if (appFileDetails.pan_cardId) {
      //check if file exists in collection
      const doesPanFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.pan_cardId),
        isDeleted: false
      });

      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appFileDetails.pan_cardId}] does not exist.`);

      const filePath = `${FILE_UPLOAD_PATH}/${doesPanFileExist?.uploadedBy}/documents/${doesPanFileExist?.name}`;

      fs.unlinkSync(filePath);
      //delete file
      await doesPanFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }
    if (appFileDetails.profile_pictureId) {
      //check if pfp file exists in collection
      const doesProfilePictureFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.profile_pictureId),
        isDeleted: false
      });
      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appFileDetails.profile_pictureId}] does not exist.`);

      const filePath = `${FILE_UPLOAD_PATH}/${doesProfilePictureFileExist?.uploadedBy}/documents/${doesProfilePictureFileExist?.name}`;

      fs.unlinkSync(filePath);

      //delete file
      await doesProfilePictureFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }
    if (appFileDetails.documentId) {
      //check if document file exists in collection
      const doesDocumentFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.documentId),
        isDeleted: false
      });
      if (!doesDocumentFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.documentId}] does not exist.`);
      //delete file
      await doesDocumentFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }
    //send response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `User file deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get all files
//route: POST: /api/v1/account_files/getAllFiles
//access: private
export const getAllFiles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    //validate joi schema
    const appFileDetails: GetAppUserFileType = await joiAgentFile.getAppUserFileSchema.validateAsync(req.body);
    const appAgentFiles = await appAttachmentModel.find({
      uploadedBy: (appFileDetails.appAgentId)
    })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentFiles?.length < 0) throw httpErrors.Conflict(`Agent with Id: ${appFileDetails.appAgentId} has not any uploaded file.`)

    // console.log(appAgentFiles);
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgentId: appAgentFiles,
          message: 'All files fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get one file
//route: POST: /api/v1/account_files/getOneFile
//access: private

export const getOneFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    //validate joi schema
    const appFileDetails: GetSingleFileType = await joiAgentFile.getSingleFileSchema.validateAsync(req.body);
    const appAgentAttachment = await appAttachmentModel.findOne({
      _id: (appFileDetails.attachmentId)
    });
    if (!appAgentAttachment) throw httpErrors.BadRequest(`Attachment with Id: ${appFileDetails.attachmentId} DoesNot`)
    const filePath = `${FILE_UPLOAD_PATH}/${appAgentAttachment?.uploadedBy}/documents/${appAgentAttachment?.name}`;
    // Send Response
    if (res.headersSent === false) {
      res.download(filePath);
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: update a file
//route: POST: /api/v1/account_files/updateFile
//access: private
export const updateFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const appFileDetails: UpdateFilesType = await joiAgentFile.updateAppUserFileSchema.validateAsync(req.body);
    const appuserFiles: UpdatedFilesType = await joiAgentFile.updatedFilesSchema.validateAsync(req.files);
    //check if file exist in collection
    const doesAppUserExist = await appAgentModel.findOne({
      _id: (appFileDetails.appAgentId)
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appFileDetails.appAgentId}] does not exist.`);

    //locate the files directory
    const dir = req.body.directory;

    //rename the directory with the user's objectID
    fs.renameSync(dir, `${FILE_UPLOAD_PATH}/${doesAppUserExist._id}`);

    //profile picture
    if (appFileDetails.profile_pictureId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      const doesProfilePictureFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.profile_pictureId),
        isDeleted: false
      });
      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appFileDetails.profile_pictureId}] does not exist.`);
      //upadate file
      await doesProfilePictureFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //delete the file from the upolaods folder
      const filePath = `${FILE_UPLOAD_PATH}/${doesProfilePictureFileExist?.uploadedBy}/documents/${doesProfilePictureFileExist?.name}`;
      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newProfilePictureFile = new appAttachmentModel({
        original_name: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].originalname : '',
        name: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].filename : '',
        type: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].mimetype : '',
        extension: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].originalname.split('.')[1] : '',
        uploadedBy: (appFileDetails.appAgentId)
      });
      await newProfilePictureFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await appAgentFileModel.updateOne(
        { appAgentId: (appFileDetails.appAgentId) },
        { profile_picture: newProfilePictureFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    }
    //aadhar card
    if (appFileDetails.aadhar_cardId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      //check if file exists in the attatchment schema
      const doesAadharFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.aadhar_cardId),
        isDeleted: false
      });
      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appFileDetails.aadhar_cardId}] does not exist.`);
      //delete file
      await doesAadharFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //delete the file from the upolaods folder
      const filePath = `${FILE_UPLOAD_PATH}/${doesAadharFileExist?.uploadedBy}/documents/${doesAadharFileExist?.name}`;
      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newAadharFile = new appAttachmentModel({
        original_name: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].originalname : '',
        name: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].filename : '',
        type: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].mimetype : '',
        extension: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].originalname.split('.')[1] : '',
        uploadedBy: (appFileDetails.appAgentId)
      });
      await newAadharFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await appAgentFileModel.updateOne(
        { appAgentId: (appFileDetails.appAgentId) },
        { aadhar_card_file: newAadharFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    }
    //pan card
    if (appFileDetails.pan_cardId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      //check if file exists in the attatchment schema
      const doesPanFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.pan_cardId),
        isDeleted: false
      });
      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appFileDetails.pan_cardId}] does not exist.`);
      //delete file
      await doesPanFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //delete the file from the upolaods folder
      const filePath = `${FILE_UPLOAD_PATH}/${doesPanFileExist?.uploadedBy}/documents/${doesPanFileExist?.name}`;

      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newPanFile = new appAttachmentModel({
        original_name: appuserFiles.pan_card ? appuserFiles.pan_card[0].originalname : '',
        name: appuserFiles.pan_card ? appuserFiles.pan_card[0].filename : '',
        type: appuserFiles.pan_card ? appuserFiles.pan_card[0].mimetype : '',
        extension: appuserFiles.pan_card ? appuserFiles.pan_card[0].originalname.split('.')[1] : '',
        uploadedBy: (appFileDetails.appAgentId)
      });
      await newPanFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await appAgentFileModel.updateOne(
        { appAgentId: (appFileDetails.appAgentId) },
        { pan_card_file: newPanFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

      //updating the documents
      if (appFileDetails.documentId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
        //check if file exists in the attatchment schema
        const doesDocumentFileExist = await appAttachmentModel.findOne({
          _id: (appFileDetails.documentId),
          isDeleted: false
        });
        if (!doesDocumentFileExist)
          throw httpErrors.Conflict(`document file [${appFileDetails.documentId}] does not exist.`);
        //delete file from uploads folder
        console.log(__dirname);
        const filePath = path.join(__dirname, `${doesDocumentFileExist?.name}`);
        fs.unlinkSync(filePath);
        //change the state from the attatchment schema
        await doesDocumentFileExist
          .updateOne({
            isDeleted: true
          })
          .catch((error: any) => {
            throw httpErrors.UnprocessableEntity(error.message);
          });
        //fetch all the user files
        const appuserfiles = await appAgentFileModel.findOne({
          appAgentId: (appFileDetails.appAgentId)
        });
        //create the new attatchment
        const newDocumentFile = new appAttachmentModel({
          original_name: appuserFiles.documents ? appuserFiles.documents[0].originalname : '',
          name: appuserFiles.documents ? appuserFiles.documents[0].filename : '',
          type: appuserFiles.documents ? appuserFiles.documents[0].mimetype : '',
          extension: appuserFiles.documents ? appuserFiles.documents[0].originalname.split('.')[1] : '',
          uploadedBy: (appFileDetails.appAgentId)
        });
        await newDocumentFile.save().catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
        //pop the old file from the file schema and push the new file
        appuserfiles?.documents.filter(documentId => {
          return documentId !== (appFileDetails.documentId ? appFileDetails.documentId : '');
        });
        //push the new file
        appuserfiles?.documents.push(newDocumentFile._id);
      }
    }

    if (!doesAppUserExist) throw httpErrors.Conflict(`user file [${appFileDetails.appAgentId}] does not exist.`);

    //send response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `Agent file updated successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
