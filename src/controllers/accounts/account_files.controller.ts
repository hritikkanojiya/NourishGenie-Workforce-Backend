//controllers for updating a file and deleting a file
import { NextFunction, Request, Response } from 'express';
import AppAttatchments from '../../models/account_fields/app_attachments.model';
import AppUser from '../../models/accounts/app_user.model';
import AppUserFiles from '../../models/account_fields/app_user_files.model';
import { logBackendError } from '../../helpers/common/backend.functions';
import {
  deleteAppUserFileSchema,
  getAppUserFileSchema,
  getSingleFileSchema,
  updateAppUserFileSchema,
  updatedFilesSchema
} from '../../helpers/joi/account/account files/account_file.validaton_schema';
import {
  DeleteAppUserFileType,
  GetSingleFileType,
  UpdatedFiles,
  UpdatedFilesId
} from '../../helpers/joi/account/account files/account_files.joi.types';
import { GetAppUserFileType } from '../../helpers/joi/account/account files/account_files.joi.types';
import httpErrors from 'http-errors';
import { stringToObjectId } from '../../helpers/common/backend.functions';
import path from 'path';
import fs from 'fs';

//description: delete a file
//route: POST: /api/v1/account_files/deleteFile
//access: private
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    console.log('hrutika0');
    const appuserDetails: DeleteAppUserFileType = await deleteAppUserFileSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist: any = await AppUser.findOne({
      _id: appuserDetails.appUserId
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    if (
      appuserDetails.aadhar_cardId === null &&
      appuserDetails.pan_cardId === null &&
      appuserDetails.profile_pictureId === null &&
      appuserDetails.documentId === null
    )
      throw httpErrors.Conflict(`no file to delete.`);

    if (appuserDetails.aadhar_cardId) {
      //check if file exists in collection
      const doesAadharFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.aadhar_cardId),
        isDeleted: false
      });
      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appuserDetails.aadhar_cardId}] does not exist.`);
      //delete file
      await doesAadharFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

    if (appuserDetails.pan_cardId) {
      //check if file exists in collection
      const doesPanFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.pan_cardId),
        isDeleted: false
      });
      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appuserDetails.pan_cardId}] does not exist.`);
      //delete file
      await doesPanFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }
    if (appuserDetails.profile_pictureId) {
      //check if pfp file exists in collection
      const doesProfilePictureFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.profile_pictureId),
        isDeleted: false
      });
      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appuserDetails.profile_pictureId}] does not exist.`);
      //delete file
      await doesProfilePictureFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }
    if (appuserDetails.documentId) {
      //check if document file exists in collection
      const doesDocumentFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.documentId),
        isDeleted: false
      });
      if (!doesDocumentFileExist)
        throw httpErrors.Conflict(`document file [${appuserDetails.documentId}] does not exist.`);
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
    const appuserDetails: GetAppUserFileType = await getAppUserFileSchema.validateAsync(req.body);
    const appuserfiles = await AppUserFiles.findOne({
      appUserId: stringToObjectId(appuserDetails.appUserId)
    })
      .populate('profile_picture')
      .populate('aadhar_card_file')
      .populate('pan_card_file')
      .populate('documents')
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUserFiles: appuserfiles,
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
    const appuserDetails: GetSingleFileType = await getSingleFileSchema.validateAsync(req.body);
    const appuserattatchment = await AppAttatchments.findOne({
      _id: stringToObjectId(appuserDetails.attatchmentId)
    });
    //create file path
    const filePath = path.join(__dirname, `../../../src/uploads/${appuserattatchment?.name}`);
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
    const appuserDetails: UpdatedFilesId = await updateAppUserFileSchema.validateAsync(req.body);
    const appuserFiles: UpdatedFiles = await updatedFilesSchema.validateAsync(req.files);
    //check if file exist in collection
    const doesAppUserExist = await AppUser.findOne({
      _id: stringToObjectId(appuserDetails.appUserId)
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    //profile picture
    console.log('hrutika3');
    if (appuserDetails.profile_pictureId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      const doesProfilePictureFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.profile_pictureId),
        isDeleted: false
      });
      if (!doesProfilePictureFileExist)
        throw httpErrors.Conflict(`profile picture file [${appuserDetails.profile_pictureId}] does not exist.`);
      //upadate file
      console.log('hrutika4');
      await doesProfilePictureFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      console.log('hrutika5');
      //delete the file from the upolaods folder
      const filePath = path.join(__dirname, `../../../src/uploads/${doesProfilePictureFileExist?.name}`);
      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newProfilePictureFile = new AppAttatchments({
        original_name: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].originalname : '',
        name: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].filename : '',
        type: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].mimetype : '',
        extension: appuserFiles.profile_picture ? appuserFiles.profile_picture[0].originalname.split('.')[1] : '',
        uploadedBy: stringToObjectId(appuserDetails.appUserId)
      });
      await newProfilePictureFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await AppUserFiles.updateOne(
        { appUserId: stringToObjectId(appuserDetails.appUserId) },
        { profile_picture: newProfilePictureFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    }
    //aadhar card
    if (appuserDetails.aadhar_cardId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      //check if file exists in the attatchment schema
      const doesAadharFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.aadhar_cardId),
        isDeleted: false
      });
      if (!doesAadharFileExist)
        throw httpErrors.Conflict(`aadhar card file [${appuserDetails.aadhar_cardId}] does not exist.`);
      //delete file
      await doesAadharFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //delete the file from the upolaods folder
      const filePath = path.join(__dirname, `../../../src/uploads/${doesAadharFileExist?.name}`);
      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newAadharFile = new AppAttatchments({
        original_name: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].originalname : '',
        name: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].filename : '',
        type: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].mimetype : '',
        extension: appuserFiles.aadhar_card ? appuserFiles.aadhar_card[0].originalname.split('.')[1] : '',
        uploadedBy: stringToObjectId(appuserDetails.appUserId)
      });
      await newAadharFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await AppUserFiles.updateOne(
        { appUserId: stringToObjectId(appuserDetails.appUserId) },
        { aadhar_card_file: newAadharFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    }
    //pan card
    if (appuserDetails.pan_cardId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
      //check if file exists in the attatchment schema
      const doesPanFileExist = await AppAttatchments.findOne({
        _id: stringToObjectId(appuserDetails.pan_cardId),
        isDeleted: false
      });
      if (!doesPanFileExist) throw httpErrors.Conflict(`pan card file [${appuserDetails.pan_cardId}] does not exist.`);
      //delete file
      await doesPanFileExist
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
      //delete the file from the upolaods folder
      const filePath = path.join(__dirname, `../../../src/uploads/${doesPanFileExist?.name}`);
      fs.unlinkSync(filePath);
      //create a new file in the attatcahments collection
      const newPanFile = new AppAttatchments({
        original_name: appuserFiles.pan_card ? appuserFiles.pan_card[0].originalname : '',
        name: appuserFiles.pan_card ? appuserFiles.pan_card[0].filename : '',
        type: appuserFiles.pan_card ? appuserFiles.pan_card[0].mimetype : '',
        extension: appuserFiles.pan_card ? appuserFiles.pan_card[0].originalname.split('.')[1] : '',
        uploadedBy: stringToObjectId(appuserDetails.appUserId)
      });
      await newPanFile.save().catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
      //upadte the file schema
      await AppUserFiles.updateOne(
        { appUserId: stringToObjectId(appuserDetails.appUserId) },
        { pan_card_file: newPanFile._id }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

      //updating the documents
      if (appuserDetails.documentId && appuserFiles && Array.isArray(appuserFiles) && appuserFiles.length > 0) {
        //check if file exists in the attatchment schema
        const doesDocumentFileExist = await AppAttatchments.findOne({
          _id: stringToObjectId(appuserDetails.documentId),
          isDeleted: false
        });
        if (!doesDocumentFileExist)
          throw httpErrors.Conflict(`document file [${appuserDetails.documentId}] does not exist.`);
        //delete file from uploads folder
        const filePath = path.join(__dirname, `../../../src/uploads/${doesDocumentFileExist?.name}`);
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
        const appuserfiles = await AppUserFiles.findOne({
          appUserId: stringToObjectId(appuserDetails.appUserId)
        });
        //create the new attatchment
        const newDocumentFile = new AppAttatchments({
          original_name: appuserFiles.documents ? appuserFiles.documents[0].originalname : '',
          name: appuserFiles.documents ? appuserFiles.documents[0].filename : '',
          type: appuserFiles.documents ? appuserFiles.documents[0].mimetype : '',
          extension: appuserFiles.documents ? appuserFiles.documents[0].originalname.split('.')[1] : '',
          uploadedBy: stringToObjectId(appuserDetails.appUserId)
        });
        await newDocumentFile.save().catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
        //pop the old file from the file schema and push the new file
        appuserfiles?.documents.filter(documentId => {
          return documentId !== stringToObjectId(appuserDetails.documentId ? appuserDetails.documentId : '');
        });
        //push the new file
        appuserfiles?.documents.push(newDocumentFile._id);
      }
    }

    if (!doesAppUserExist) throw httpErrors.Conflict(`user file [${appuserDetails.appUserId}] does not exist.`);

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
