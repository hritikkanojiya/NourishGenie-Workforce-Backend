//controllers for updating a file and deleting a file
import { NextFunction, Request, Response } from 'express';
import appAttachmentModel from '../../../models/agent/fields/app_attachments.model';
import appAgentModel from '../../../models/agent/agent.model';
import appAgentFileModel from '../../../models/agent/fields/app_agent_files.model';
// import { appAgentFilesFolderModel } from '../../../models/agent/agent_files_folder.model'
import { logBackendError, removeDirectory } from '../../../helpers/common/backend.functions';
import {
  joiAgentFile,
  DeleteAppUserFileType,
  // GetSingleFileType,
  GetAppUserFileType,
  UpdateFilesType,
  UpdatedFilesType,
  UploadedFilesTypes,
  CreateFileType
} from '../../../helpers/joi/agent/account/account_files/index';
import httpErrors from 'http-errors';
import path from 'path';
import fs from 'fs';
import { GlobalConfig } from '../../../helpers/common/environment';
import mongoose from 'mongoose';

const FILE_UPLOAD_PATH = GlobalConfig.FILE_UPLOAD_PATH;

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgentDetails: CreateFileType = await joiAgentFile.CreateFileSchema.validateAsync(req.body);
    const appAgentFileDetails: UploadedFilesTypes = await joiAgentFile.uploadedFilesSchema.validateAsync(req.files);

    //extracting the file metadata first
    const profile_picture = appAgentFileDetails.profile_picture;
    const aadhar_card = appAgentFileDetails.aadhar_card;
    const pan_card = appAgentFileDetails.pan_card;
    const otherFiles = appAgentFileDetails.otherFiles;

    //profile picture
    const profileAttatchments = new appAttachmentModel({
      original_name: profile_picture[0].originalname,
      name: profile_picture[0].filename,
      type: profile_picture[0].mimetype,
      uploadedBy: appAgentDetails.appAgentId,
      extension: profile_picture[0].originalname.split('.')[1]
    });
    //save
    const storeProfilePicture = (
      await profileAttatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //aadhar card
    const aadharAttatchments = new appAttachmentModel({
      original_name: aadhar_card[0].originalname,
      name: aadhar_card[0].filename,
      type: aadhar_card[0].mimetype,
      uploadedBy: appAgentDetails.appAgentId,
      extension: aadhar_card[0].originalname.split('.')[1]
    });
    //save
    const storeAadharCard = (
      await aadharAttatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //pan card
    const panAttatchments = new appAttachmentModel({
      original_name: pan_card[0].originalname,
      name: pan_card[0].filename,
      type: pan_card[0].mimetype,
      uploadedBy: appAgentDetails.appAgentId,
      extension: pan_card[0].originalname.split('.')[1]
    });
    //save
    const storePanCard = (
      await panAttatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //save otherFiles
    const otherFilesDetails: mongoose.Types.ObjectId[] = [];
    otherFiles.map(async (otherFile) => {
      const otherFileAttachment = new appAttachmentModel({
        original_name: otherFile.originalname,
        name: otherFile.filename,
        type: otherFile.mimetype,
        uploadedBy: appAgentDetails.appAgentId,
        extension: otherFile.originalname.split('.')[1]
      });

      const storeOtherFile = (
        await otherFileAttachment.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();

      otherFilesDetails.push(storeOtherFile._id);
    })

    // storing the aadhar and pan card numbers in the file schema
    const appuserfiles = new appAgentFileModel({
      appAgentId: appAgentDetails.appAgentId,
      profile_picture: storeProfilePicture._id,
      aadhar_card_number: appAgentDetails.aadhar_number,
      aadhar_card_file: storeAadharCard._id,
      pan_card_number: appAgentDetails.pan_number,
      pan_card_file: storePanCard._id,
      // otherFiles: otherFilesDetails
    });
    // locate the files directory
    const dir = req.body.directory;

    removeDirectory(`${FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`)

    fs.renameSync(dir, `${FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`);

    const storeAppUserFileInfo = (
      await appuserfiles.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgentFiles: {
            appAgentFileId: storeAppUserFileInfo._id,
            aadhar_number: storeAppUserFileInfo.aadhar_card_number,
            pan_number: storeAppUserFileInfo.pan_card_number
          },

          message: 'Files uploaded successfully.'
        }
      });
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}

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
      appFileDetails.otherFilesId === null
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

    if (appFileDetails.otherFilesId) {
      //check if pfp file exists in collection
      const doesProfileOtherFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.otherFilesId),
        isDeleted: false
      });
      if (!doesProfileOtherFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.otherFilesId}] does not exist.`);

      const filePath = `${FILE_UPLOAD_PATH}/${doesProfileOtherFileExist?.uploadedBy}/documents/otherfiles/${doesProfileOtherFileExist?.name}`;

      fs.unlinkSync(filePath);

      //delete file
      await doesProfileOtherFileExist
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

// export const getOneFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   try {
//     //validate joi schema
//     const appFileDetails: GetSingleFileType = await joiAgentFile.getSingleFileSchema.validateAsync(req.body);
//     const appAgentAttachment = await appAttachmentModel.findOne({
//       _id: (appFileDetails.attachmentId)
//     });
//     if (!appAgentAttachment) throw httpErrors.BadRequest(`Attachment with Id: ${appFileDetails.attachmentId} DoesNot`)
//     if (appAgentAttachment.)
//       const filePath = `${FILE_UPLOAD_PATH}/${appAgentAttachment?.uploadedBy}/documents/${appAgentAttachment?.name}`;
//     // Send Response
//     if (res.headersSent === false) {
//       res.download(filePath);
//     }
//   } catch (error: any) {
//     logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
//     if (error?.isJoi === true) error.status = 422;
//     next(error);
//   }
// };

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

    //profile picture
    if (appFileDetails.profile_pictureId) {
      const doesProfilePictureFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.profile_pictureId),
        isDeleted: false
      });

      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appFileDetails.profile_pictureId}] does not exist.`);

      //upadate file
      const filepath = `${FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesProfilePictureFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const data = fs.readFileSync(updatedFilePath);
        const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(fileDirectory, appuserFiles.profile_picture[0].filename);
        fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
        removeDirectory(dir);
      }
      // update attchment
      await doesProfilePictureFileExist
        .updateOne({
          original_name: appuserFiles.profile_picture[0].originalname,
          name: appuserFiles.profile_picture[0].filename,
          type: appuserFiles.profile_picture[0].mimetype,
          extension: appuserFiles.profile_picture[0].originalname.split('.')[1],
          uploadedBy: (appFileDetails.appAgentId)
        },
          {
            new: true
          })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    //aadhar card
    if (appFileDetails.aadhar_cardId) {
      //check if file exists in the attatchment schema
      const doesAadharFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.aadhar_cardId),
        isDeleted: false
      });

      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appFileDetails.aadhar_cardId}] does not exist.`);

      const filepath = `${FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesAadharFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const data = fs.readFileSync(updatedFilePath);
        const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(fileDirectory, appuserFiles.aadhar_card[0].filename);
        fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
        removeDirectory(dir);
      }
      //update attachment
      await doesAadharFileExist
        .updateOne({
          original_name: appuserFiles.aadhar_card[0].originalname,
          name: appuserFiles.aadhar_card[0].filename,
          type: appuserFiles.aadhar_card[0].mimetype,
          extension: appuserFiles.aadhar_card[0].originalname.split('.')[1],
          uploadedBy: (appFileDetails.appAgentId)
        },
          {
            new: true
          })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }


    //pan card
    if (appFileDetails.pan_cardId) {
      //check if file exists in the attatchment schema
      const doesPanFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.pan_cardId),
        isDeleted: false
      });

      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appFileDetails.pan_cardId}] does not exist.`);

      const filepath = `${FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesPanFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const data = fs.readFileSync(updatedFilePath);
        const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(fileDirectory, appuserFiles.pan_card[0].filename);
        fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
        removeDirectory(dir);
      }
      //update attachment
      await doesPanFileExist
        .updateOne({
          original_name: appuserFiles.pan_card[0].originalname,
          name: appuserFiles.pan_card[0].filename,
          type: appuserFiles.pan_card[0].mimetype,
          extension: appuserFiles.pan_card[0].originalname.split('.')[1],
          uploadedBy: (appFileDetails.appAgentId)
        },
          {
            new: true
          })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    //other files documents
    if (appFileDetails.otherFilesId) {
      //check if file exists in the attatchment schema
      const doesDocumentFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.otherFilesId),
        isDeleted: false
      });
      if (!doesDocumentFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.otherFilesId}] does not exist.`);
      //delete file from uploads folder
      const filepath = `${FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/otherfiles/${doesDocumentFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents/otherfiles`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents/otherfiles`, file);
        const data = fs.readFileSync(updatedFilePath);
        const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(fileDirectory, appuserFiles.otherFiles[0].filename);
        fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
        removeDirectory(dir);
      }
      //change the state from the attatchment schema
      await doesDocumentFileExist
        .updateOne({
          original_name: appuserFiles.otherFiles[0].originalname,
          name: appuserFiles.otherFiles[0].filename,
          type: appuserFiles.otherFiles[0].mimetype,
          extension: appuserFiles.otherFiles[0].originalname.split('.')[1],
          uploadedBy: (appFileDetails.appAgentId)
        },
          {
            new: true
          })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //fetch all the user files
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
