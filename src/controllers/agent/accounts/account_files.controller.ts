//controllers for updating a file and deleting a file
import { NextFunction, Request, Response } from 'express';
import { appUserAttachmentModel } from '../../../models/agent/fields/app_attachments.model';
import { appUserModel } from '../../../models/agent/agent.model';
import { appUserFilesModel } from '../../../models/agent/fields/app_agent_files.model';
import { logBackendError, removeDirectory } from '../../../helpers/common/backend.functions';
import {
  joiUserFile,
  DeleteFileType,
  GetFileType,
  UpdateFilesType,
  UpdatedFilesType,
  UploadedFilesTypes,
  CreateFileType,
  GetProfilePictureType,
  UploadSingleFileType
} from '../../../helpers/joi/agent/account/account_files/index';
import httpErrors from 'http-errors';
import path from 'path';
import fs from 'fs';
import { GlobalConfig } from '../../../helpers/common/environment';
import mongoose from 'mongoose';
//import { json } from 'body-parser';

const MAIN_FILE_UPLOAD_PATH = GlobalConfig.MAIN_FILE_UPLOAD_PATH;
const DELETED_FILE_UPLOAD_PATH = GlobalConfig.DELETED_FILE_UPLOAD_PATH;

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appUserDetails: CreateFileType = await joiUserFile.CreateFileSchema.validateAsync(req.body);
    const appUserFileDetails: UploadedFilesTypes = await joiUserFile.uploadedFilesSchema.validateAsync(req.files);

    //extracting the file metadata first
    const profile_picture = appUserFileDetails.profile_picture;
    const aadhar_card = appUserFileDetails.aadhar_card;
    const pan_card = appUserFileDetails.pan_card;
    const otherFiles = appUserFileDetails.otherFiles;

    //profile picture
    const profileAttatchments = new appUserAttachmentModel({
      original_name: profile_picture[0].originalname,
      name: profile_picture[0].filename,
      type: profile_picture[0].mimetype,
      uploadedBy: appUserDetails.appUserId,
      extension: profile_picture[0].originalname.split('.')[1]
    });
    //save
    const storeProfilePicture = (
      await profileAttatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //aadhar card
    const aadharAttatchments = new appUserAttachmentModel({
      original_name: aadhar_card[0].originalname,
      name: aadhar_card[0].filename,
      type: aadhar_card[0].mimetype,
      uploadedBy: appUserDetails.appUserId,
      extension: aadhar_card[0].originalname.split('.')[1]
    });
    //save
    const storeAadharCard = (
      await aadharAttatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //pan card
    const panAttatchments = new appUserAttachmentModel({
      original_name: pan_card[0].originalname,
      name: pan_card[0].filename,
      type: pan_card[0].mimetype,
      uploadedBy: appUserDetails.appUserId,
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
      otherFiles.map(async otherFile => {
        const otherFileAttachment = new appUserAttachmentModel({
          original_name: otherFile.originalname,
          name: otherFile.filename,
          type: otherFile.mimetype,
          uploadedBy: appUserDetails.appUserId,
          extension: otherFile.originalname.split('.')[1]
        });

        const storeOtherFile = (
          await otherFileAttachment.save({}).catch((error: any) => {
            throw httpErrors.InternalServerError(error.message);
          })
        ).toObject();

        otherFilesDetails.push(storeOtherFile._id);
      })
    );

    const doesUserFileExist: any = await appUserFilesModel.findOne({
      appUserId: appUserDetails.appUserId,
      isDeleted: false
    });
    let storeAppUserFileInfo: any = null;

    if (doesUserFileExist) {
      await doesUserFileExist.updateOne(
        {
          appUserId: doesUserFileExist.appUserId,
          profile_picture: storeProfilePicture ? storeProfilePicture._id : doesUserFileExist.profile_picture,
          aadhar_card_number: appUserDetails.aadhar_number
            ? appUserDetails.aadhar_number
            : doesUserFileExist.aadhar_card_number,
          aadhar_card_file: storeAadharCard ? storeAadharCard._id : doesUserFileExist.aadhar_card_file,
          pan_card_number: appUserDetails.pan_number ? appUserDetails.pan_number : doesUserFileExist.pan_card_number,
          pan_card_file: storePanCard ? storePanCard._id : doesUserFileExist.pan_card_file,
          otherFiles: otherFilesDetails
        },
        {
          new: true
        }
      );
    } else {
      const appUserfiles = new appUserFilesModel({
        appUserId: appUserDetails?.appUserId,
        profile_picture: storeProfilePicture ? storeProfilePicture._id : null,
        aadhar_card_number: appUserDetails.aadhar_number ? appUserDetails.aadhar_number : null,
        aadhar_card_file: storeAadharCard ? storeAadharCard._id : null,
        pan_card_number: appUserDetails.pan_number ? appUserDetails.pan_number : null,
        pan_card_file: storePanCard ? storePanCard._id : null,
        otherFiles: otherFilesDetails
      });
      storeAppUserFileInfo = (
        await appUserfiles.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();
    }

    // locate the files directory
    const dir = req.body.directory;
    removeDirectory(`${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}`);
    fs.renameSync(dir, `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}`);

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appUserFiles: {
            appUserFileId: storeAppUserFileInfo ? storeAppUserFileInfo._id : doesUserFileExist._id,
            aadhar_number: storeAppUserFileInfo
              ? storeAppUserFileInfo.aadhar_card_number
              : doesUserFileExist.aadhar_card_number,
            pan_number: storeAppUserFileInfo
              ? storeAppUserFileInfo.pan_card_number
              : doesUserFileExist.pan_card_number
          },

          message: 'Files uploaded successfully.'
        }
      });
    }
  } catch (error: any) {
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

const saveFileInFolder = async (appUserDetails: any, dir: any, fileArr: any, isOtherFile = false): Promise<void> => {
  try {
    if (!isOtherFile) {
      const newFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}`;
      const files = fs.readdirSync(`${dir}/documents`);
      if (!fs.existsSync(newFileDirectory)) {
        fs.mkdirSync(newFileDirectory),
        {
          recursive: true
        };
      }
      const fileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents`, file);
        const stats = fs.statSync(updatedFilePath);
        if (!stats.isDirectory()) {
          const data = fs.readFileSync(updatedFilePath);
          const newFilePath = path.join(fileDirectory, fileArr[0].filename);
          fs.writeFileSync(newFilePath, data);
          fs.unlinkSync(updatedFilePath);
          break;
        }
      }
    } else {
      const newFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}`;
      const files = fs.readdirSync(`${dir}/documents/otherfiles`);
      if (!fs.existsSync(newFileDirectory)) {
        fs.mkdirSync(newFileDirectory),
        {
          recursive: true
        };
      }
      const fileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}/documents`;
      if (!fs.existsSync(fileDirectory)) {
        fs.mkdirSync(fileDirectory),
        {
          recursive: true
        };
      }

      const otherFileDirectory = `${MAIN_FILE_UPLOAD_PATH}/${appUserDetails.appUserId}/documents/otherfiles`;
      if (!fs.existsSync(otherFileDirectory)) {
        fs.mkdirSync(otherFileDirectory),
        {
          recursive: true
        };
      }

      for (const file of files) {
        const updatedFilePath = path.join(`${dir}/documents/otherfiles`, file);
        const data = fs.readFileSync(updatedFilePath);
        // const fileDirectory = path.dirname(filepath);
        const newFilePath = path.join(otherFileDirectory, fileArr[0].filename);
        // fs.renameSync(filepath, newFilePath);
        fs.writeFileSync(newFilePath, data);
        fs.unlinkSync(updatedFilePath);
        break;
      }
    }
    return;
  } catch (error: any) {
    console.log(error);
    return error;
  }
};

export const uploadSingleFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appUserDetails: UploadSingleFileType = await joiUserFile.uploadSingleFileSchema.validateAsync(req.body);
    const appUserFileDetails: UploadedFilesTypes = await joiUserFile.uploadedSingleFilesSchema.validateAsync(
      req.files
    );

    //extracting the file metadata first
    const profile_picture = appUserFileDetails.profile_picture;
    const aadhar_card = appUserFileDetails.aadhar_card;
    const pan_card = appUserFileDetails.pan_card;
    const otherFiles = appUserFileDetails.otherFiles;

    const dir = req.body.directory;

    //profile picture
    let storeProfilePicture = null;
    if (profile_picture && profile_picture.length > 0) {
      const profileAttatchments = new appUserAttachmentModel({
        original_name: profile_picture[0].originalname,
        name: profile_picture[0].filename,
        type: profile_picture[0].mimetype,
        uploadedBy: appUserDetails.appUserId,
        extension: profile_picture[0].originalname.split('.')[1]
      });
      //save
      storeProfilePicture = (
        await profileAttatchments.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();
      await saveFileInFolder(appUserDetails, dir, profile_picture);
    }

    //aadhar card
    let storeAadharCard = null;
    if (aadhar_card && aadhar_card.length > 0) {
      const aadharAttatchments = new appUserAttachmentModel({
        original_name: aadhar_card[0].originalname,
        name: aadhar_card[0].filename,
        type: aadhar_card[0].mimetype,
        uploadedBy: appUserDetails.appUserId,
        extension: aadhar_card[0].originalname.split('.')[1]
      });
      //save
      storeAadharCard = (
        await aadharAttatchments.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();
      await saveFileInFolder(appUserDetails, dir, aadhar_card);
    }

    //pan card
    let storePanCard = null;
    if (pan_card && pan_card.length > 0) {
      const panAttatchments = new appUserAttachmentModel({
        original_name: pan_card[0].originalname,
        name: pan_card[0].filename,
        type: pan_card[0].mimetype,
        uploadedBy: appUserDetails.appUserId,
        extension: pan_card[0].originalname.split('.')[1]
      });
      //save
      storePanCard = (
        await panAttatchments.save({}).catch((error: any) => {
          throw httpErrors.InternalServerError(error.message);
        })
      ).toObject();
      await saveFileInFolder(appUserDetails, dir, pan_card);
    }

    //save otherFiles
    const otherFilesDetails: mongoose.Types.ObjectId[] = [];
    if (otherFiles && otherFiles.length > 0) {
      await Promise.all(
        otherFiles.map(async otherFile => {
          const otherFileAttachment = new appUserAttachmentModel({
            original_name: otherFile.originalname,
            name: otherFile.filename,
            type: otherFile.mimetype,
            uploadedBy: appUserDetails.appUserId,
            extension: otherFile.originalname.split('.')[1]
          });

          const storeOtherFile = (
            await otherFileAttachment.save({}).catch((error: any) => {
              throw httpErrors.InternalServerError(error.message);
            })
          ).toObject();

          otherFilesDetails.push(storeOtherFile._id);
        })
      );
      await saveFileInFolder(appUserDetails, dir, otherFiles, true);
    }
    removeDirectory(dir);

    // storing the aadhar and pan card numbers in the file schema
    const doesUserFileExist: any = await appUserFilesModel.findOne({
      appUserId: appUserDetails.appUserId,
      isDeleted: false
    });

    await doesUserFileExist.updateOne(
      {
        appUserId: doesUserFileExist.appUserId,
        profile_picture: storeProfilePicture ? storeProfilePicture._id : doesUserFileExist.profile_picture,
        aadhar_card_number: doesUserFileExist.aadhar_number,
        aadhar_card_file: storeAadharCard ? storeAadharCard._id : doesUserFileExist.aadhar_card_file,
        pan_card_number: doesUserFileExist.pan_card_number,
        pan_card_file: storePanCard ? storePanCard._id : doesUserFileExist.pan_card_file,
        otherFiles: otherFilesDetails?.length > 0 ? otherFilesDetails : doesUserFileExist.otherFiles
      },
      {
        new: true
      }
    );

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: 'File updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const appFileDetails: DeleteFileType = await joiUserFile.deleteFileSchema.validateAsync(req.body);

    if (
      appFileDetails.aadhar_cardId === null &&
      appFileDetails.pan_cardId === null &&
      appFileDetails.profile_pictureId === null &&
      appFileDetails.otherFilesId === null
    )
      throw httpErrors.Conflict(`no file to delete.`);

    if (appFileDetails.aadhar_cardId) {
      const doesAadharFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.aadhar_cardId,
        isDeleted: false
      });
      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appFileDetails.aadhar_cardId}] does not exist.`);

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesAadharFileExist?.uploadedBy}/documents/${doesAadharFileExist?.name}`;
      const deletedUserFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesAadharFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedUserFilesDirectory)) {
        fs.mkdirSync(deletedUserFilesDirectory),
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
      const doesPanFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.pan_cardId,
        isDeleted: false
      });

      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appFileDetails.pan_cardId}] does not exist.`);

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesPanFileExist?.uploadedBy}/documents/${doesPanFileExist?.name}`;
      const deletedUserFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesPanFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedUserFilesDirectory)) {
        fs.mkdirSync(deletedUserFilesDirectory),
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
      const doesProfilePictureFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.profile_pictureId,
        isDeleted: false
      });
      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appFileDetails.profile_pictureId}] does not exist.`);

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesProfilePictureFileExist?.uploadedBy}/documents/${doesProfilePictureFileExist?.name}`;
      const deletedUserFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfilePictureFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedUserFilesDirectory)) {
        fs.mkdirSync(deletedUserFilesDirectory),
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
      const doesProfileOtherFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.otherFilesId,
        // uploadedBy: appFileDetails.appUserId,
        isDeleted: false
      });
      if (!doesProfileOtherFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.otherFilesId}] does not exist.`);

      const filePath = `${MAIN_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist?.uploadedBy}/documents/otherfiles/${doesProfileOtherFileExist?.name}`;
      const deletedUserFilesDirectory = `${DELETED_FILE_UPLOAD_PATH}/${doesProfileOtherFileExist.uploadedBy}`;
      if (!fs.existsSync(deletedUserFilesDirectory)) {
        fs.mkdirSync(deletedUserFilesDirectory),
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
          message: `User file deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export const getAllFiles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    //validate joi schema
    const appFileDetails: GetFileType = await joiUserFile.getFileSchema.validateAsync(req.body);
    const appUserFiles = await appUserFilesModel
      .findOne({
        appUserId: appFileDetails.appUserId,
        isDeleted: false
      })
      .populate('profile_picture aadhar_card_file pan_card_file')
      .populate({ path: 'otherFiles', match: { isDeleted: false } })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    // console.log(appUserFiles);
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appUserFiles: appUserFiles,
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
    console.log(req.body);
    const appFileDetails: GetProfilePictureType = await joiUserFile.getProfilePictureSchema.validateAsync(req.body);
    const appUserFile = await appUserFilesModel.findOne({
      appUserId: appFileDetails.appUserId,
      isDeleted: false
    });
    if (!appUserFile || !appUserFile.profile_picture)
      throw httpErrors.BadRequest(`User with Id: ${appFileDetails.appUserId} Does not have any File`);
    const profilePicturAttachment: any = await appUserAttachmentModel.findOne({
      _id: appUserFile.profile_picture,
      isDeleted: false
    });
    if (!profilePicturAttachment) {
      throw httpErrors.NotFound(`User with id: ${appFileDetails.appUserId} does not have profile picture.`);
    }
    // Send Response
    const filePath = `${profilePicturAttachment?.uploadedBy}/documents/${profilePicturAttachment?.name}`;

    if (res.headersSent === false) {
      //res.json({ message: 'success', data: filePath });

      res.status(200).send({
        error: false,
        data: {
          profile_picture: filePath,
          message: 'Profile picture fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export const updateFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    console.log(req.body.directory);
    const appFileDetails: UpdateFilesType = await joiUserFile.updateFileSchema.validateAsync(req.body);
    const appuserFiles: UpdatedFilesType = await joiUserFile.updatedFilesSchema.validateAsync(req.files);
    //check if file exist in collection
    const doesAppUserExist = await appUserModel.findOne({
      _id: appFileDetails.appUserId
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`User [${appFileDetails.appUserId}] does not exist.`);

    //locate the files directory
    const dir = req.body.directory;

    //profile picture
    if (appFileDetails.profile_pictureId) {
      const doesProfilePictureFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.profile_pictureId,
        isDeleted: false
      });

      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appFileDetails.profile_pictureId}] does not exist.`);

      //upadate file
      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appUserId}/documents/${doesProfilePictureFileExist?.name}`;
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
        .updateOne(
          {
            original_name: appuserFiles.profile_picture[0].originalname,
            name: appuserFiles.profile_picture[0].filename,
            type: appuserFiles.profile_picture[0].mimetype,
            extension: appuserFiles.profile_picture[0].originalname.split('.')[1],
            uploadedBy: appFileDetails.appUserId
          },
          {
            new: true
          }
        )
        .catch((error: any) => {
          console.log(error);
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    //aadhar card
    if (appFileDetails.aadhar_cardId) {
      //check if file exists in the attatchment schema
      const doesAadharFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.aadhar_cardId,
        isDeleted: false
      });

      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appFileDetails.aadhar_cardId}] does not exist.`);

      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appUserId}/documents/${doesAadharFileExist?.name}`;
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
        .updateOne(
          {
            original_name: appuserFiles.aadhar_card[0].originalname,
            name: appuserFiles.aadhar_card[0].filename,
            type: appuserFiles.aadhar_card[0].mimetype,
            extension: appuserFiles.aadhar_card[0].originalname.split('.')[1],
            uploadedBy: appFileDetails.appUserId
          },
          {
            new: true
          }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    //pan card
    if (appFileDetails.pan_cardId) {
      //check if file exists in the attatchment schema
      const doesPanFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.pan_cardId,
        isDeleted: false
      });

      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appFileDetails.pan_cardId}] does not exist.`);

      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appUserId}/documents/${doesPanFileExist?.name}`;
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
        .updateOne(
          {
            original_name: appuserFiles.pan_card[0].originalname,
            name: appuserFiles.pan_card[0].filename,
            type: appuserFiles.pan_card[0].mimetype,
            extension: appuserFiles.pan_card[0].originalname.split('.')[1],
            uploadedBy: appFileDetails.appUserId
          },
          {
            new: true
          }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    //other files documents
    if (appFileDetails.otherFilesId) {
      //check if file exists in the attatchment schema
      console.log('deepak');
      const doesDocumentFileExist = await appUserAttachmentModel.findOne({
        _id: appFileDetails.otherFilesId,
        isDeleted: false
      });
      if (!doesDocumentFileExist)
        throw httpErrors.Conflict(`document file [${appFileDetails.otherFilesId}] does not exist.`);
      //delete file from uploads folder
      const filepath = `${MAIN_FILE_UPLOAD_PATH}/${appFileDetails.appUserId}/documents/otherfiles/${doesDocumentFileExist?.name}`;
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
        .updateOne(
          {
            original_name: appuserFiles.otherFiles[0].originalname,
            name: appuserFiles.otherFiles[0].filename,
            type: appuserFiles.otherFiles[0].mimetype,
            extension: appuserFiles.otherFiles[0].originalname.split('.')[1],
            uploadedBy: appFileDetails.appUserId
          },
          {
            new: true
          }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //fetch all the user files
    }

    if (!doesAppUserExist) throw httpErrors.Conflict(`user file [${appFileDetails.appUserId}] does not exist.`);

    //send response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `User file updated successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
