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
  CreateFileType,
  GetSingleFileType
} from '../../../helpers/joi/agent/account/account_files/index';
import httpErrors from 'http-errors';
import path from 'path';
import fs from 'fs';
import { GlobalConfig } from '../../../helpers/common/environment';
import mongoose from 'mongoose';

const MAIN_FILE_UPLOAD_PATH = GlobalConfig.MAIN_FILE_UPLOAD_PATH;
const DELETED_FILE_UPLOAD_PATH = GlobalConfig.DELETED_FILE_UPLOAD_PATH;


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
    await Promise.all(
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
      }));

    const doesAgentFileExist: any = await appAgentFileModel.findOne({
      appAgentId: appAgentDetails.appAgentId,
      isDeleted: false
    })
    let storeAppAgentFileInfo: any = null

    if (doesAgentFileExist) {
      await doesAgentFileExist.updateOne({
        appAgentId: doesAgentFileExist.appAgentId,
        profile_picture: storeProfilePicture ? storeProfilePicture._id : doesAgentFileExist.profile_picture,
        aadhar_card_number: appAgentDetails.aadhar_number ? appAgentDetails.aadhar_number : doesAgentFileExist.aadhar_card_number,
        aadhar_card_file: storeAadharCard ? storeAadharCard._id : doesAgentFileExist.aadhar_card_file,
        pan_card_number: appAgentDetails.pan_number ? appAgentDetails.pan_number : doesAgentFileExist.pan_card_number,
        pan_card_file: storePanCard ? storePanCard._id : doesAgentFileExist.pan_card_file,
        otherFiles: otherFilesDetails
      }, {
        new: true
      })
    }
    else {
      const appAgentfiles = new appAgentFileModel({
        appAgentId: appAgentDetails?.appAgentId,
        profile_picture: storeProfilePicture ? storeProfilePicture._id : null,
        aadhar_card_number: appAgentDetails.aadhar_number ? appAgentDetails.aadhar_number : null,
        aadhar_card_file: storeAadharCard ? storeAadharCard._id : null,
        pan_card_number: appAgentDetails.pan_number ? appAgentDetails.pan_number : null,
        pan_card_file: storePanCard ? storePanCard._id : null,
        otherFiles: otherFilesDetails
      });
      storeAppAgentFileInfo = (
        await appAgentfiles.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();
    }

    // locate the files directory
    const dir = req.body.directory;
    removeDirectory(`${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`)
    fs.renameSync(dir, `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgentFiles: {
            appAgentFileId: storeAppAgentFileInfo ? storeAppAgentFileInfo._id : doesAgentFileExist._id,
            aadhar_number: storeAppAgentFileInfo ? storeAppAgentFileInfo.aadhar_card_number : doesAgentFileExist.aadhar_card_number,
            pan_number: storeAppAgentFileInfo ? storeAppAgentFileInfo.pan_card_number : doesAgentFileExist.pan_card_number
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

// const saveFileInFolder = async (appAgentDetails: any, dir: any, fileArr: any, isOtherFile = false): Promise<void> => {
//   try {
//     if (!isOtherFile) {
//       const newFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`;
//       const files = fs.readdirSync(`${dir}/documents`);
//       if (!fs.existsSync(newFileDirectory)) {
//         fs.mkdirSync(newFileDirectory),
//         {
//           recursive: true
//         };
//       }
//       const fileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}/documents`;
//       if (!fs.existsSync(fileDirectory)) {
//         fs.mkdirSync(fileDirectory),
//         {
//           recursive: true
//         };
//       }

//       for (const file of files) {
//         const updatedFilePath = path.join(`${dir}/documents`, file);
//         console.log(updatedFilePath);
//         console.log(fileArr);
//         const stats = fs.statSync(updatedFilePath);
//         if (!stats.isDirectory()) {
//           const data = fs.readFileSync(updatedFilePath);
//           // const fileDirectory = path.dirname(filepath);
//           const newFilePath = path.join(fileDirectory, fileArr[0].filename);
//           // fs.renameSync(filepath, newFilePath);
//           fs.writeFileSync(newFilePath, data);
//           fs.unlinkSync(updatedFilePath);
//           break;
//         }
//       }

//     }
//     else {
//       const newFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`;
//       const files = fs.readdirSync(`${dir}/documents/otherfiles`);
//       if (!fs.existsSync(newFileDirectory)) {
//         fs.mkdirSync(newFileDirectory),
//         {
//           recursive: true
//         };
//       }
//       const fileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}/documents`;
//       if (!fs.existsSync(fileDirectory)) {
//         fs.mkdirSync(fileDirectory),
//         {
//           recursive: true
//         };
//       }

//       const otherFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}/documents/otherfiles`;
//       if (!fs.existsSync(otherFileDirectory)) {
//         fs.mkdirSync(otherFileDirectory),
//         {
//           recursive: true
//         };
//       }

//       for (const file of files) {
//         const updatedFilePath = path.join(`${dir}/documents/otherfiles`, file);
//         const data = fs.readFileSync(updatedFilePath);
//         // const fileDirectory = path.dirname(filepath);
//         const newFilePath = path.join(otherFileDirectory, fileArr[0].filename);
//         // fs.renameSync(filepath, newFilePath);
//         fs.writeFileSync(newFilePath, data);
//         fs.unlinkSync(updatedFilePath);
//         break;
//       }
//     }
//     return

//   } catch (error: any) {
//     return error;
//   }
// }

// export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const appAgentDetails: CreateFileType = await joiAgentFile.CreateFileSchema.validateAsync(req.body);
//     const appAgentFileDetails: UploadedFilesTypes = await joiAgentFile.uploadedFilesSchema.validateAsync(req.files);

//     //extracting the file metadata first
//     const profile_picture = appAgentFileDetails.profile_picture;
//     const aadhar_card = appAgentFileDetails.aadhar_card;
//     const pan_card = appAgentFileDetails.pan_card;
//     const otherFiles = appAgentFileDetails.otherFiles;

//     const dir = req.body.directory;


//     //profile picture
//     let storeProfilePicture = null
//     if (profile_picture && profile_picture.length > 0) {
//       const profileAttatchments = new appAttachmentModel({
//         original_name: profile_picture[0].originalname,
//         name: profile_picture[0].filename,
//         type: profile_picture[0].mimetype,
//         uploadedBy: appAgentDetails.appAgentId,
//         extension: profile_picture[0].originalname.split('.')[1]
//       });
//       //save
//       storeProfilePicture = (
//         await profileAttatchments.save({}).catch((error: any) => {
//           throw httpErrors.InternalServerError(error.message);
//         })
//       ).toObject();
//       await saveFileInFolder(appAgentDetails, dir, profile_picture);
//     }

//     //aadhar card
//     let storeAadharCard = null;
//     if (aadhar_card && aadhar_card.length > 0) {
//       const aadharAttatchments = new appAttachmentModel({
//         original_name: aadhar_card[0].originalname,
//         name: aadhar_card[0].filename,
//         type: aadhar_card[0].mimetype,
//         uploadedBy: appAgentDetails.appAgentId,
//         extension: aadhar_card[0].originalname.split('.')[1]
//       });
//       //save
//       storeAadharCard = (
//         await aadharAttatchments.save({}).catch((error: any) => {
//           throw httpErrors.InternalServerError(error.message);
//         })
//       ).toObject();
//       await saveFileInFolder(appAgentDetails, dir, aadhar_card);

//     }

//     //pan card
//     let storePanCard = null;
//     if (pan_card && pan_card.length > 0) {
//       const panAttatchments = new appAttachmentModel({
//         original_name: pan_card[0].originalname,
//         name: pan_card[0].filename,
//         type: pan_card[0].mimetype,
//         uploadedBy: appAgentDetails.appAgentId,
//         extension: pan_card[0].originalname.split('.')[1]
//       });
//       //save
//       storePanCard = (
//         await panAttatchments.save({}).catch((error: any) => {
//           throw httpErrors.InternalServerError(error.message);
//         })
//       ).toObject();
//       await saveFileInFolder(appAgentDetails, dir, pan_card);

//     }

//     //save otherFiles
//     const otherFilesDetails: mongoose.Types.ObjectId[] = [];
//     if (otherFiles && otherFiles.length > 0) {
//       await Promise.all(
//         otherFiles.map(async (otherFile) => {
//           const otherFileAttachment = new appAttachmentModel({
//             original_name: otherFile.originalname,
//             name: otherFile.filename,
//             type: otherFile.mimetype,
//             uploadedBy: appAgentDetails.appAgentId,
//             extension: otherFile.originalname.split('.')[1]
//           });

//           const storeOtherFile = (
//             await otherFileAttachment.save({}).catch((error: any) => {
//               throw httpErrors.InternalServerError(error.message);
//             })
//           ).toObject();

//           otherFilesDetails.push(storeOtherFile._id);
//         }));
//       await saveFileInFolder(appAgentDetails, dir, otherFiles, true)
//     }
//     removeDirectory(dir);

//     // storing the aadhar and pan card numbers in the file schema
//     const doesAgentFileExist: any = await appAgentFileModel.findOne({
//       appAgentId: appAgentDetails.appAgentId,
//       isDeleted: false
//     })
//     let storeAppAgentFileInfo: any = null
//     console.log(doesAgentFileExist);

//     if (doesAgentFileExist) {
//       await doesAgentFileExist.updateOne({
//         appAgentId: doesAgentFileExist.appAgentId,
//         profile_picture: storeProfilePicture ? storeProfilePicture._id : doesAgentFileExist.profile_picture,
//         aadhar_card_number: appAgentDetails.aadhar_number ? appAgentDetails.aadhar_number : doesAgentFileExist.aadhar_card_number,
//         aadhar_card_file: storeAadharCard ? storeAadharCard._id : doesAgentFileExist.aadhar_card_file,
//         pan_card_number: appAgentDetails.pan_number ? appAgentDetails.pan_number : doesAgentFileExist.pan_card_number,
//         pan_card_file: storePanCard ? storePanCard._id : doesAgentFileExist.pan_card_file,
//         otherFiles: otherFilesDetails
//       }, {
//         new: true
//       })
//     }
//     else {
//       const appAgentfiles = new appAgentFileModel({
//         appAgentId: appAgentDetails?.appAgentId,
//         profile_picture: storeProfilePicture ? storeProfilePicture._id : null,
//         aadhar_card_number: appAgentDetails.aadhar_number ? appAgentDetails.aadhar_number : null,
//         aadhar_card_file: storeAadharCard ? storeAadharCard._id : null,
//         pan_card_number: appAgentDetails.pan_number ? appAgentDetails.pan_number : null,
//         pan_card_file: storePanCard ? storePanCard._id : null,
//         otherFiles: otherFilesDetails
//       });
//       storeAppAgentFileInfo = (
//         await appAgentfiles.save({}).catch((error: any) => {
//           throw httpErrors.InternalServerError(error.message);
//         })
//       ).toObject();
//     }

//     // locate the files directory

//     // removeDirectory(`${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`)

//     // fs.renameSync(dir, `${MAIN_FILE_UPLOAD_PATH}/${appAgentDetails.appAgentId}`);
//     // console.log(storeAppAgentFileInfo._id);

//     console.log(doesAgentFileExist._id);
//     // Send Response
//     if (res.headersSent === false) {
//       res.status(200).send({
//         error: false,
//         data: {
//           appAgentFiles: {
//             appAgentFileId: storeAppAgentFileInfo ? storeAppAgentFileInfo._id : doesAgentFileExist._id,
//             aadhar_number: storeAppAgentFileInfo ? storeAppAgentFileInfo.aadhar_card_number : doesAgentFileExist.aadhar_card_number,
//             pan_number: storeAppAgentFileInfo ? storeAppAgentFileInfo.pan_card_number : doesAgentFileExist.pan_card_number
//           },

//           message: 'Files uploaded successfully.'
//         }
//       });
//     }

//   } catch (error: any) {
//     logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
//     if (error?.isJoi === true) error.status = 422;
//     next(error);
//   }
// }

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

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesAadharFileExist?.uploadedBy}/documents/${doesAadharFileExist?.name}`;
      const deletedAgentFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesAadharFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedAgentFilesDirectory)) {
        fs.mkdirSync(deletedAgentFilesDirectory),
        {
          recursive: true
        };
      }

      const fileDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesAadharFileExist.uploadedBy}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }
      const fileName = doesAadharFileExist?.name ? doesAadharFileExist?.name : '';
      const fileData = fs.readFileSync(filePath);
      const deletedFilePath = path.join(fileDirectory, fileName);
      fs.writeFileSync(deletedFilePath, fileData);
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

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesPanFileExist?.uploadedBy}/documents/${doesPanFileExist?.name}`;
      const deletedAgentFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesPanFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedAgentFilesDirectory)) {
        fs.mkdirSync(deletedAgentFilesDirectory),
        {
          recursive: true
        };
      }

      const fileDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesPanFileExist.uploadedBy}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }
      const fileName = doesPanFileExist?.name ? doesPanFileExist?.name : '';
      const fileData = fs.readFileSync(filePath);
      const deletedFilePath = path.join(fileDirectory, fileName);
      fs.writeFileSync(deletedFilePath, fileData);
      fs.unlinkSync(filePath);

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

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesProfilePictureFileExist?.uploadedBy}/documents/${doesProfilePictureFileExist?.name}`;
      const deletedAgentFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfilePictureFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedAgentFilesDirectory)) {
        fs.mkdirSync(deletedAgentFilesDirectory),
        {
          recursive: true
        };
      }

      const fileDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfilePictureFileExist.uploadedBy}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }
      const fileName = doesProfilePictureFileExist?.name ? doesProfilePictureFileExist?.name : '';
      const fileData = fs.readFileSync(filePath);
      const deletedFilePath = path.join(fileDirectory, fileName);
      fs.writeFileSync(deletedFilePath, fileData);
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

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist?.uploadedBy}/documents/otherfiles/${doesProfileOtherFileExist?.name}`;
      const deletedAgentFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedAgentFilesDirectory)) {
        fs.mkdirSync(deletedAgentFilesDirectory),
        {
          recursive: true
        };
      }

      const fileDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist.uploadedBy}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }

      const otherFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist.uploadedBy}/documents/otherfiles`;
      if (!fs.existsSync(otherFilesDirectory)) {
        fs.mkdirSync(otherFilesDirectory),
        {
          recursive: true
        };
      }

      const fileName = doesProfileOtherFileExist?.name ? doesProfileOtherFileExist?.name : '';
      const fileData = fs.readFileSync(filePath);
      const deletedFilePath = path.join(otherFilesDirectory, fileName);
      fs.writeFileSync(deletedFilePath, fileData);
      fs.unlinkSync(filePath);

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
          message: `Agent file deleted successfully.`
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
    const appAgentFiles = await appAgentFileModel.findOne({
      appAgentId: (appFileDetails.appAgentId)
    })
      .populate('profile_picture aadhar_card_file pan_card_file otherFiles')
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    // console.log(appAgentFiles);
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgentFiles: appAgentFiles,
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

export const getProfilePicture = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    //validate joi schema
    const appFileDetails: GetSingleFileType = await joiAgentFile.getSingleFileSchema.validateAsync(req.body);
    const appAgentAttachment = await appAttachmentModel.findOne({
      _id: (appFileDetails.attachmentId)
    });
    if (!appAgentAttachment) throw httpErrors.BadRequest(`Attachment with Id: ${appFileDetails.attachmentId} DoesNot`)
    const filePath = `${MAIN_FILE_UPLOAD_PATH}/${appAgentAttachment?.uploadedBy}/documents/${appAgentAttachment?.name}`;
    // Send Response
    if (res.headersSent === false) {
      res.sendFile(filePath);
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
    console.log(req.body.directory);
    const appFileDetails: UpdateFilesType = await joiAgentFile.updateAppUserFileSchema.validateAsync(req.body);
    const appuserFiles: UpdatedFilesType = await joiAgentFile.updatedFilesSchema.validateAsync(req.files);
    //check if file exist in collection
    const doesAppUserExist = await appAgentModel.findOne({
      _id: (appFileDetails.appAgentId)
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`Agent [${appFileDetails.appAgentId}] does not exist.`);

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
      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesProfilePictureFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);
      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const stats = fs.statSync(updatedFilePath);
        if (!stats.isDirectory()) {
          const data = fs.readFileSync(updatedFilePath);
          const fileDirectory = path.dirname(filepath);
          const newFilePath = path.join(fileDirectory, appuserFiles.profile_picture[0].filename);
          fs.renameSync(filepath, newFilePath);
          fs.writeFileSync(newFilePath, data);
        }
      }
      removeDirectory(dir);
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
          console.log(error);
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

      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesAadharFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const stats = fs.statSync(updatedFilePath);
        if (!stats.isDirectory()) {
          const data = fs.readFileSync(updatedFilePath);
          const fileDirectory = path.dirname(filepath);
          const newFilePath = path.join(fileDirectory, appuserFiles.aadhar_card[0].filename);
          fs.renameSync(filepath, newFilePath);
          fs.writeFileSync(newFilePath, data);
        }
      }
      removeDirectory(dir);

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

      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/${doesPanFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const stats = fs.statSync(updatedFilePath);
        if (!stats.isDirectory()) {
          const data = fs.readFileSync(updatedFilePath);
          const fileDirectory = path.dirname(filepath);
          const newFilePath = path.join(fileDirectory, appuserFiles.pan_card[0].filename);
          fs.renameSync(filepath, newFilePath);
          fs.writeFileSync(newFilePath, data);
        }
      }
      removeDirectory(dir);

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
      console.log('deepak');
      const doesDocumentFileExist = await appAttachmentModel.findOne({
        _id: (appFileDetails.otherFilesId),
        isDeleted: false
      });
      if (!doesDocumentFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.otherFilesId}] does not exist.`);
      //delete file from uploads folder
      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appAgentId}/documents/otherfiles/${doesDocumentFileExist?.name}`;
      const files = fs.readdirSync(`${dir}/documents/otherfiles`);

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents/otherfiles`, file);
        const data = fs.readFileSync(updatedFilePath);
        const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(fileDirectory, appuserFiles.otherFiles[0].filename);
        fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
      }
      removeDirectory(dir);

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
