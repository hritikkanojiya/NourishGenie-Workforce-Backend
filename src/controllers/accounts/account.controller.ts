import { NextFunction, Request, Response } from 'express';
import { logBackendError, stringToObjectId } from '../../helpers/common/backend.functions';
import httpErrors from 'http-errors';
import AppUser from '../../models/accounts/app_user.model';
import AppUserDetails from '../../models/account_fields/app_user_details.model';
import AppUserBank from '../../models/account_fields/app_user_banks.model';
import AppUserAddress from '../../models/account_fields/app_user_address.model';
import AppUserContact from '../../models/account_fields/app_user_contacts.model';
import AppUserFile from '../../models/account_fields/app_user_files.model';
import AppAttatchments from '../../models/account_fields/app_attachments.model';
import {
  CreateAppUserType,
  GetAppUserType,
  UpdateAppUserType,
  UploadedFiles
} from '../../helpers/joi/account/account.joi.types';
import {
  createAppUserSchema,
  getAppUserSchema,
  updateAppUserSchema,
  uploadedFilesSchema
} from '../../helpers/joi/account/account.validation_schema';
import { Types } from 'mongoose';
import { DeleteAppUserType } from '../../helpers/joi/account/account.joi.types';
import { deleteAppUserSchema } from '../../helpers/joi/account/account.validation_schema';
import fs from 'fs';
const FILE_UPLOAD_PATH: any = process.env.FILE_UPLOAD_PATH;

//description: create a new account
//route: POST /api/v1/createAccount
//access: private
export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appuserDetails: CreateAppUserType = await createAppUserSchema.validateAsync(req.body);
    const appuserFileDetails: UploadedFiles = await uploadedFilesSchema.validateAsync(req.files);
    //check if user exist in collection
    const doesAppUserExist = await AppUser.find({
      email: appuserDetails.email,
      isDeleted: false
    });
    if (doesAppUserExist?.length > 0) throw httpErrors.Conflict(`user [${appuserDetails.email}] already exist.`);
    // Else Construct Data
    //user basic details
    const app_agents = new AppUser({
      //basic details of user
      first_name: appuserDetails.first_name,
      last_name: appuserDetails.last_name,
      email: appuserDetails.email,
      password: appuserDetails.password,
      appAccessGroupId: stringToObjectId(appuserDetails.appAccessGroupId),
      appDepartmentId: stringToObjectId(appuserDetails.appDepartmentId),
      appDesignationId: stringToObjectId(appuserDetails.appDesignationId),
      employee_type: appuserDetails.employee_type
    });
    // save
    const storeAppUserBasicDetails = (
      await app_agents.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user company details
    const app_agent_details = new AppUserDetails({
      appUserId: storeAppUserBasicDetails._id,
      primary_email: appuserDetails.primary_email,
      company_email: appuserDetails.company_email,
      gender: appuserDetails.gender,
      contact_number: appuserDetails.contact_number,
      date_of_birth: appuserDetails.date_of_birth,
      marital_status: appuserDetails.marital_status,
      date_of_joining: appuserDetails.date_of_joining,
      working_hours: appuserDetails.working_hours,
      salary: appuserDetails.salary
    }); //save
    const storeAppUserPersonalDetails = (
      await app_agent_details.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user bank details
    const appuserbank = new AppUserBank({
      appUserId: storeAppUserBasicDetails._id,
      name_as_per_bank: appuserDetails.name_as_per_bank,
      account_number: appuserDetails.account_number,
      ifsc_code: appuserDetails.ifsc_code,
      bank_name: appuserDetails.bank_name
    });
    //save
    const storeAppUserBankDetails = (
      await appuserbank.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //address details
    const appuseraddress = new AppUserAddress({
      appUserId: storeAppUserBasicDetails._id,
      address: appuserDetails.address,
      city: appuserDetails.city,
      state: appuserDetails.state,
      country: appuserDetails.country,
      pincode: appuserDetails.pincode,
      landmark: appuserDetails.landmark
    });
    //save
    const storeAppUserAddressDetails = (
      await appuseraddress.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user contact
    const appusercontact = new AppUserContact({
      appUserId: storeAppUserBasicDetails._id,
      number: appuserDetails.contact_number,
      relation: appuserDetails.relation
    });
    //save
    const storeAppUserContactDetails = (
      await appusercontact.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //extracting the file metadata first
    const profile_picture = appuserFileDetails.profile_picture;
    const aadhar_card = appuserFileDetails.aadhar_card;
    const pan_card = appuserFileDetails.pan_card;
    const documents = appuserFileDetails.documents;
    //profile picture
    const profileattatchments = new AppAttatchments({
      original_name: profile_picture[0].originalname,
      name: profile_picture[0].filename,
      type: profile_picture[0].mimetype,
      uploadedBy: storeAppUserBasicDetails._id,
      extension: profile_picture[0].originalname.split('.')[1]
    });
    //save
    const storeProfilePicture = (
      await profileattatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //aadhar card
    const aadharattatchments = new AppAttatchments({
      original_name: aadhar_card[0].originalname,
      name: aadhar_card[0].filename,
      type: aadhar_card[0].mimetype,
      uploadedBy: storeAppUserBasicDetails._id,
      extension: aadhar_card[0].originalname.split('.')[1]
    });
    //save
    const storeAadharCard = (
      await aadharattatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //pan card
    const panattatchments = new AppAttatchments({
      original_name: pan_card[0].originalname,
      name: pan_card[0].filename,
      type: pan_card[0].mimetype,
      uploadedBy: storeAppUserBasicDetails._id,
      extension: pan_card[0].originalname.split('.')[1]
    });
    //save
    const storePanCard = (
      await panattatchments.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    const object_ids: Types.ObjectId[] = [];

    // Create an array of promises
    const savePromises = documents.map(async document => {
      const documentattatchments = new AppAttatchments({
        original_name: document.originalname,
        name: document.filename,
        type: document.mimetype,
        uploadedBy: storeAppUserBasicDetails._id,
        extension: document.originalname.split('.')[1]
      });

      // Save the document and return the saved object
      const storeDocuments = await documentattatchments.save().catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      });

      return storeDocuments.toObject();
    });

    // Wait for all the promises to resolve
    const savedDocuments = await Promise.all(savePromises);

    // Push the _id of each saved document to object_ids array
    savedDocuments.forEach(document => {
      object_ids.push(document._id);
    });

    console.log(object_ids);

    //storing the aadhar and pan card numbers in the file schema
    const appuserfiles = new AppUserFile({
      appUserId: storeAppUserBasicDetails._id,
      profile_picture: storeProfilePicture._id,
      aadhar_card_number: appuserDetails.aadhar_number,
      aadhar_card_file: storeAadharCard._id,
      pan_card_number: appuserDetails.pan_number,
      pan_card_file: storePanCard._id,
      documents: object_ids
    });
    //locate the files directory
    const dir = req.body.directory;
    //rename the directory with the user's objectID
    fs.renameSync(dir, `${FILE_UPLOAD_PATH}/${storeAppUserBasicDetails._id}`);
    //save
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
          appuser: {
            appUserId: storeAppUserBasicDetails._id,
            email: storeAppUserBasicDetails.email,
            password: storeAppUserBasicDetails.password
          },
          appuserdetails: {
            appUserDetailsId: storeAppUserPersonalDetails._id,
            primary_email: storeAppUserPersonalDetails.primary_email
          },
          appuserbank: {
            appUserBankId: storeAppUserBankDetails._id,
            name_as_per_bank: storeAppUserBankDetails.name_as_per_bank
          },
          appuseraddress: {
            appUserAddressId: storeAppUserAddressDetails._id,
            country: storeAppUserAddressDetails.country
          },
          appusercontact: {
            appUserContactId: storeAppUserContactDetails._id,
            number: storeAppUserContactDetails.number
          },
          appuserfileid: {
            appUserFileId: storeAppUserFileInfo._id,
            aadhar_number: storeAppUserFileInfo.aadhar_card_number,
            pan_number: storeAppUserFileInfo.pan_card_number
          },

          message: 'user created successfully and files uploaded successfully.'
        }
      });
    }
  } catch (error: any) {
    console.log(error.message);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: delete an account
//route: DELETE /api/v1/deleteAppAccount
//access: private
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appuserDetails: DeleteAppUserType = await deleteAppUserSchema.validateAsync(req.body);
    // Update records in Collection
    const appuser = await AppUser.findOne({
      _id: { $in: stringToObjectId(appuserDetails.appUserId) },
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    if (!appuser) throw httpErrors.UnprocessableEntity(`Invalid user ID.`);

    await appuser
      .updateOne({
        isDeleted: true
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          message: `User deleted successfully.`
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get user details
//route: GET /api/v1/getAppUserDetails
//access: private
export const getSingleAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appuserDetails: GetAppUserType = await getAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist = await AppUser.findOne({
      _id: appuserDetails.appUserId,
      isDeleted: false
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    //get user details
    // const singleuserdetails = await AppUser.findOne({ appUserId: appuserDetails.appUserId }).catch((error: any) => {
    //   throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    // });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUser: doesAppUserExist,
          message: 'User details fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get all users
//route: GET /api/v1/getAllAppUsers
//access: private
export const getAllAppUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appusers = await AppUser.find({
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUsers: appusers,
          message: 'All users fetched successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: update user details
//route: PUT /api/v1/updateAppUserDetails
//access: private
export const updateAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const responseQuery: any = {};
    //validate joi schema
    const appuserDetails: UpdateAppUserType = await updateAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist = await AppUser.findOne({
      _id: appuserDetails.appUserId
    });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    //if there is an upadte in the  user basic details
    const basicdetailsquery: any = {};
    if (appuserDetails.first_name) {
      basicdetailsquery['first_name'] = appuserDetails.first_name;
    }
    if (appuserDetails.last_name) {
      basicdetailsquery['last_name'] = appuserDetails.last_name;
    }
    if (appuserDetails.email) {
      basicdetailsquery['email'] = appuserDetails.email;
    }
    if (appuserDetails.appReportingManagerId) {
      basicdetailsquery['appReportingManagerId'] = appuserDetails.appReportingManagerId;
    }
    if (appuserDetails.appAccessGroupId) {
      basicdetailsquery['appAccessGroupId'] = appuserDetails.appAccessGroupId;
    }
    if (appuserDetails.appDepartmentId) {
      basicdetailsquery['appDepartmentId'] = appuserDetails.appDepartmentId;
    }
    if (appuserDetails.appDesignationId) {
      basicdetailsquery['appDesignationId'] = appuserDetails.appDesignationId;
    }
    if (appuserDetails.employee_type) {
      basicdetailsquery['employee_type'] = appuserDetails.employee_type;
    }
    if (
      appuserDetails.first_name ||
      appuserDetails.last_name ||
      appuserDetails.email ||
      appuserDetails.appReportingManagerId ||
      appuserDetails.appAccessGroupId ||
      appuserDetails.appDepartmentId ||
      appuserDetails.appDesignationId ||
      appuserDetails.employee_type
    ) {
      const updateuserbasicdetails = await AppUser.findOneAndUpdate(
        { _id: appuserDetails.appUserId },
        {
          $set: basicdetailsquery
        },
        { new: true }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
      });
      responseQuery['basicDetails'] = updateuserbasicdetails;
    }

    //if there is an update in the company info details
    const companyDetailsQuery: any = {};
    if (appuserDetails.primary_email) {
      companyDetailsQuery['primary_email'] = appuserDetails.primary_email;
    }
    if (appuserDetails.company_email) {
      companyDetailsQuery['company_email'] = appuserDetails.company_email;
    }
    if (appuserDetails.gender) {
      companyDetailsQuery['gender'] = appuserDetails.company_email;
    }
    if (appuserDetails.date_of_birth) {
      companyDetailsQuery['date_of_birth'] = appuserDetails.date_of_birth;
    }
    if (appuserDetails.date_of_joining) {
      companyDetailsQuery['date_of_joining'] = appuserDetails.date_of_joining;
    }
    if (appuserDetails.working_hours) {
      companyDetailsQuery['working_hours'] = appuserDetails.working_hours;
    }
    if (appuserDetails.salary) {
      companyDetailsQuery['salary'] = appuserDetails.salary;
    }
    if (appuserDetails.marital_status) {
      companyDetailsQuery['marital_status'] = appuserDetails.marital_status;
    }
    if (
      appuserDetails.primary_email ||
      appuserDetails.company_email ||
      appuserDetails.gender ||
      appuserDetails.date_of_birth ||
      appuserDetails.date_of_joining ||
      appuserDetails.working_hours ||
      appuserDetails.salary ||
      appuserDetails.marital_status
    ) {
      const appusercompanydetails = await AppUserDetails.findOneAndUpdate(
        { appUserId: appuserDetails.appUserId },
        {
          $set: {
            primary_email: appuserDetails.primary_email,
            company_email: appuserDetails.company_email,
            gender: appuserDetails.gender,
            date_of_birth: appuserDetails.date_of_birth,
            date_of_joining: appuserDetails.date_of_joining,
            working_hours: appuserDetails.working_hours,
            salary: appuserDetails.salary,
            marital_status: appuserDetails.marital_status
          }
        },
        { new: true }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
      });
      responseQuery['companyDetails'] = appusercompanydetails;
    }
    //if there is an update in the contact info details
    const contactDetailsQuery: any = {};
    if (appuserDetails.number) {
      contactDetailsQuery['number'] = appuserDetails.number;
    }
    if (appuserDetails.relation) {
      contactDetailsQuery['relation'] = appuserDetails.relation;
    }
    if (appuserDetails.number || appuserDetails.relation) {
      const appusercontactdetails = await AppUserContact.findOneAndUpdate(
        { appUserId: appuserDetails.appUserId },
        {
          $set: {
            number: appuserDetails.number,
            relation: appuserDetails.relation
          }
        },
        { new: true }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
      });
      responseQuery['contactDetails'] = appusercontactdetails;
    }
    //if there is an update in the address info details
    const addressDetailsQuery: any = {};
    if (appuserDetails.address) {
      addressDetailsQuery['address'] = appuserDetails.address;
    }
    if (appuserDetails.city) {
      addressDetailsQuery['city'] = appuserDetails.city;
    }
    if (appuserDetails.state) {
      addressDetailsQuery['state'] = appuserDetails.state;
    }
    if (appuserDetails.country) {
      addressDetailsQuery['country'] = appuserDetails.country;
    }
    if (appuserDetails.pincode) {
      addressDetailsQuery['pincode'] = appuserDetails.pincode;
    }
    if (appuserDetails.landmark) {
      addressDetailsQuery['landmark'] = appuserDetails.landmark;
    }

    if (
      appuserDetails.address ||
      appuserDetails.city ||
      appuserDetails.state ||
      appuserDetails.country ||
      appuserDetails.pincode ||
      appuserDetails.landmark
    ) {
      const appuseraddressdetails = await AppUserAddress.findOneAndUpdate(
        { appUserId: appuserDetails.appUserId },
        {
          $set: {
            address: appuserDetails.address,
            city: appuserDetails.city,
            state: appuserDetails.state,
            country: appuserDetails.country,
            pincode: appuserDetails.pincode,
            landmark: appuserDetails.landmark
          }
        },
        { new: true }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
      });
      responseQuery['addressDetails'] = appuseraddressdetails;
    }
    //if there is an update in the bank info details
    if (
      appuserDetails.name_as_per_bank ||
      appuserDetails.account_number ||
      appuserDetails.bank_name ||
      appuserDetails.ifsc_code
    ) {
      const appuserbankdetails = await AppUserBank.findOneAndUpdate(
        { appUserId: appuserDetails.appUserId },
        {
          $set: {
            name_as_per_bank: appuserDetails.name_as_per_bank,
            account_number: appuserDetails.account_number,
            bank_name: appuserDetails.bank_name,
            ifsc_code: appuserDetails.ifsc_code
          }
        },
        { new: true }
      ).catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
      });
      responseQuery['bankDetails'] = appuserbankdetails;
    }
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          UpdatedDetails: responseQuery,
          message: 'User details updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

//description: get single users all details
//route: GET /api/v1/getSingleAppUserDetails
//access: private
export const getSingleAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appuserDetails: GetAppUserType = await getAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist = await AppUser.findOne({
      _id: appuserDetails.appUserId,
      isDeleted: false
    }).populate('appAccessGroupId appDepartmentId appDesignationId');
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    //get user company details
    const singleusercompanydetails = await AppUserDetails.findOne({
      appUserId: appuserDetails.appUserId
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    //get user bank details
    const singleuserbankdetails = await AppUserBank.findOne({
      appUserId: appuserDetails.appUserId
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    //get user address details
    const singleuseraddressdetails = await AppUserAddress.findOne({
      appUserId: appuserDetails.appUserId
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    //get user contact details
    const singleusercontactdetails = await AppUserContact.findOne({
      appUserId: appuserDetails.appUserId
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });

    //send response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          user_details: doesAppUserExist,
          company_details: singleusercompanydetails,
          bank_details: singleuserbankdetails,
          address_details: singleuseraddressdetails,
          contact_details: singleusercontactdetails
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};
