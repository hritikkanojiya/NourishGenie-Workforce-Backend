import { NextFunction, Request, Response } from 'express';
import { logBackendError, } from '../../../helpers/common/backend.functions';
import httpErrors from 'http-errors';
import appAgentModel from '../../../models/agent/agent.model';
import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model';
import appAgentBanksModel from '../../../models/agent/fields/app_agent_banks.model';
import appAgentAddressModel from '../../../models/agent/fields/app_agent_address.model';
import appAgentContactModel from '../../../models/agent/fields/app_agent_contacts.model';
// import appAgentFilesModel from '../../../models/agent/fields/app_agent_files.model';
// import appAttachmentsModel from '../../../models/agent/fields/app_attachments.model';
import {
  joiAgentAccount,
  CreateAppUserType,
  GetAppUserType,
  UpdateAppAgentType,
  // UploadedFiles,
  DeleteAppUserType
} from '../../../helpers/joi/agent/account/index';
// import { Types } from 'mongoose';
// import fs from 'fs';
// const FILE_UPLOAD_PATH: any = process.env.FILE_UPLOAD_PATH;

//description: create a new account
//route: POST /api/v1/createAccount
//access: private
export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    console.log(req.body);
    const appAgentDetails: CreateAppUserType = await joiAgentAccount.createAppUserSchema.validateAsync(req.body);
    // const appAgentFileDetails: UploadedFiles = await joiAgentAccount.uploadedFilesSchema.validateAsync(req.files);

    //check if user exist in collection
    const doesAppAgentExist = await appAgentModel.find({
      email: appAgentDetails.email,
      isDeleted: false
    });
    if (doesAppAgentExist?.length > 0) throw httpErrors.Conflict(`user [${appAgentDetails.email}] already exist.`);
    // Else Construct Data
    //user basic details
    const app_agents = new appAgentModel({
      //basic details of user
      first_name: appAgentDetails.first_name,
      last_name: appAgentDetails.last_name,
      email: appAgentDetails.email,
      password: appAgentDetails.password,
      appAccessGroupId: (appAgentDetails.appAccessGroupId),
      appDepartmentId: (appAgentDetails.appDepartmentId),
      appDesignationId: (appAgentDetails.appDesignationId),
      employee_type: appAgentDetails.employee_type
    });
    // save
    const storeAppAgentBasicDetails = (
      await app_agents.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user company details
    const app_agent_details = new appAgentDetailsModel({
      appAgentId: storeAppAgentBasicDetails._id,
      primary_email: appAgentDetails.primary_email,
      company_email: appAgentDetails.company_email,
      gender: appAgentDetails.gender,
      contact_number: appAgentDetails.contact_number,
      date_of_birth: appAgentDetails.date_of_birth,
      marital_status: appAgentDetails.marital_status,
      date_of_joining: appAgentDetails.date_of_joining,
      working_hours: appAgentDetails.working_hours,
      salary: appAgentDetails.salary
    }); //save
    const storeAppAgentPersonalDetails = (
      await app_agent_details.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user bank details
    const appAgentBank = new appAgentBanksModel({
      appAgentId: storeAppAgentBasicDetails._id,
      name_as_per_bank: appAgentDetails.name_as_per_bank,
      account_number: appAgentDetails.account_number,
      ifsc_code: appAgentDetails.ifsc_code,
      bank_name: appAgentDetails.bank_name
    });
    //save
    const storeAppUserBankDetails = (
      await appAgentBank.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //address details
    const appAgentAddress = new appAgentAddressModel({
      appAgentId: storeAppAgentBasicDetails._id,
      address: appAgentDetails.address,
      city: appAgentDetails.city,
      state: appAgentDetails.state,
      country: appAgentDetails.country,
      pincode: appAgentDetails.pincode,
      landmark: appAgentDetails.landmark
    });
    //save
    const storeAppAgentAddressDetails = (
      await appAgentAddress.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user contact
    const appAgentContact = new appAgentContactModel({
      appAgentId: storeAppAgentBasicDetails._id,
      number: appAgentDetails.contact_number,
      relation: appAgentDetails.relation
    });
    //save
    const storeAppAgentContactDetails = (
      await appAgentContact.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    // //extracting the file metadata first
    // const profile_picture = appAgentFileDetails.profile_picture;
    // const aadhar_card = appAgentFileDetails.aadhar_card;
    // const pan_card = appAgentFileDetails.pan_card;
    // // const documents = appAgentFileDetails.documents;
    // //profile picture
    // const profileAttachments = new appAttachmentsModel({
    //   original_name: profile_picture[0].originalname,
    //   name: profile_picture[0].filename,
    //   type: profile_picture[0].mimetype,
    //   uploadedBy: storeAppAgentBasicDetails._id,
    //   extension: profile_picture[0].originalname.split('.')[1]
    // });
    // //save
    // const storeProfilePicture = (
    //   await profileAttachments.save({}).catch((error: any) => {
    //     throw httpErrors.InternalServerError(error.message);
    //   })
    // ).toObject();

    // //aadhar card
    // const aadharAttachments = new appAttachmentsModel({
    //   original_name: aadhar_card[0].originalname,
    //   name: aadhar_card[0].filename,
    //   type: aadhar_card[0].mimetype,
    //   uploadedBy: storeAppAgentBasicDetails._id,
    //   extension: aadhar_card[0].originalname.split('.')[1]
    // });
    // //save
    // const storeAadharCard = (
    //   await aadharAttachments.save({}).catch((error: any) => {
    //     throw httpErrors.InternalServerError(error.message);
    //   })
    // ).toObject();

    // //pan card
    // const panAttachments = new appAttachmentsModel({
    //   original_name: pan_card[0].originalname,
    //   name: pan_card[0].filename,
    //   type: pan_card[0].mimetype,
    //   uploadedBy: storeAppAgentBasicDetails._id,
    //   extension: pan_card[0].originalname.split('.')[1]
    // });
    // //save
    // const storePanCard = (
    //   await panAttachments.save({}).catch((error: any) => {
    //     throw httpErrors.InternalServerError(error.message);
    //   })
    // ).toObject();

    // const object_ids: Types.ObjectId[] = [];

    // Create an array of promises
    // const savePromises = documents.map(async document => {
    //   const documentAttachments = new appAttachmentsModel({
    //     original_name: document.originalname,
    //     name: document.filename,
    //     type: document.mimetype,
    //     uploadedBy: storeAppAgentBasicDetails._id,
    //     extension: document.originalname.split('.')[1]
    //   });

    //   // Save the document and return the saved object
    //   const storeDocuments = await documentAttachments.save().catch((error: any) => {
    //     throw httpErrors.InternalServerError(error.message);
    //   });

    //   return storeDocuments.toObject();
    // });

    // // Wait for all the promises to resolve
    // const savedDocuments = await Promise.all(savePromises);

    // // Push the _id of each saved document to object_ids array
    // savedDocuments.forEach(document => {
    //   object_ids.push(document._id);
    // });

    // console.log(object_ids);

    //storing the aadhar and pan card numbers in the file schema
    // const appAgentFiles = new appAgentFilesModel({
    //   appAgentId: storeAppAgentBasicDetails._id,
    //   profile_picture: storeProfilePicture._id,
    //   aadhar_card_number: appAgentDetails.aadhar_number,
    //   aadhar_card_file: storeAadharCard._id,
    //   pan_card_number: appAgentDetails.pan_number,
    //   pan_card_file: storePanCard._id,
    //   // documents: object_ids
    // });

    // //locate the files directory
    // const dir = req.body.directory;

    // //rename the directory with the user's objectID
    // fs.renameSync(dir, `${FILE_UPLOAD_PATH}/${storeAppAgentBasicDetails._id}`);

    // //save
    // const storeAppAgentFileInfo = (
    //   await appAgentFiles.save({}).catch((error: any) => {
    //     throw httpErrors.InternalServerError(error.message);
    //   })
    // ).toObject();

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgent: {
            appAgentid: storeAppAgentBasicDetails._id,
            email: storeAppAgentBasicDetails.email,
            password: storeAppAgentBasicDetails.password
          },
          appAgentDetails: {
            appAgentDetailsId: storeAppAgentPersonalDetails._id,
            primary_email: storeAppAgentPersonalDetails.primary_email
          },
          appAgentBank: {
            appAgentBankId: storeAppUserBankDetails._id,
            name_as_per_bank: storeAppUserBankDetails.name_as_per_bank
          },
          appAgentAddress: {
            appAgentAddressId: storeAppAgentAddressDetails._id,
            country: storeAppAgentAddressDetails.country
          },
          appAgentContact: {
            appAgentContactId: storeAppAgentContactDetails._id,
            number: storeAppAgentContactDetails.number
          },
          // appAgentFiles: {
          //   appAgentFileId: storeAppAgentFileInfo._id,
          //   aadhar_number: storeAppAgentFileInfo.aadhar_card_number,
          //   pan_number: storeAppAgentFileInfo.pan_card_number
          // },

          message: 'Agent created successfully and files uploaded successfully.'
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

//description: delete an account
//route: DELETE /api/v1/deleteAppAccount
//access: private
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgentDetails: DeleteAppUserType = await joiAgentAccount.deleteAppUserSchema.validateAsync(req.body);
    // Update records in Collection
    const appAgent = await appAgentModel
      .findOne({
        _id: { $in: (appAgentDetails.appAgentId) },
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (!appAgent) throw httpErrors.UnprocessableEntity(`Invalid user ID.`);

    await appAgent
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
//route: GET /api/v1/getappAgentDetails
//access: private
export const getSingleAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appAgentDetails: GetAppUserType = await joiAgentAccount.getAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const appAgent = await appAgentModel.findOne(
      {
        _id: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .populate('appAccessGroupId')
      .populate('appDepartmentId')
      .populate('appDesignationId')

    if (!appAgent) throw httpErrors.Conflict(`Agent with Id: [${appAgentDetails.appAgentId}] does not exist.`);
    console.log(appAgent._id);
    // console.log(appAgentDetails.appAgentId);

    // const appAgentPersonalDetails = await appAgentDetailsModel.findOne(
    //   {
    //     appAgentId: appAgent._id,
    //     isDeleted: false
    //   })
    // console.log(appAgentPersonalDetails);

    // if (!appAgentPersonalDetails)
    //   throw httpErrors.Conflict(`Agent with Id: [${appAgentDetails.appAgentId}] does not has personal details.`);

    // const appAgentBankDetails = await appAgentBanksModel.findOne(
    //   {
    //     appAgentId: appAgentDetails.appAgentId,
    //   })

    // if (!appAgentBankDetails)
    //   throw httpErrors.Conflict(`Agent with Id: [${appAgentDetails.appAgentId}] does not has bank details.`);

    // const appAgentAddressDetails = await appAgentAddressModel.findOne(
    //   {
    //     appAgentId: appAgentDetails.appAgentId,
    //   })

    // if (!appAgentAddressDetails)
    //   throw httpErrors.Conflict(`Agent with Id: [${appAgentDetails.appAgentId}] does not has Address details.`);

    // const appAgentContactDetails = await appAgentContactModel.findOne(
    //   {
    //     appAgentId: appAgentDetails.appAgentId,
    //   })

    // if (!appAgentContactDetails)
    //   throw httpErrors.Conflict(`Agent with Id: [${appAgentDetails.appAgentId}] does not has contact details.`);


    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appAgentBasicDetails: appAgent,
          // appAgentPersonalDetails: appAgentPersonalDetails,
          // appAgentBankDetails: appAgentBankDetails,
          // appAgentAddressDetails: appAgentAddressDetails,
          // appAgentContactDetails: appAgentContactDetails,
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
export const getAllAppAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgents = await appAgentModel.find({
      isDeleted: false
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
    });
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUsers: appAgents,
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
//route: PUT /api/v1/updateappAgentDetails
//access: private
// export const updateAppAgentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const responseQuery: any = {};

//     //validate joi schema
//     const appAgentDetails: UpdateAppAgentType = await joiAgentAccount.updateAppUserSchema.validateAsync(req.body);

//     //check if user exist in collection
//     const doesAppAgentExist = await appAgentModel.findOne({
//       _id: appAgentDetails.appAgentId
//     });

//     if (!doesAppAgentExist) throw httpErrors.Conflict(`user [${appAgentDetails.appAgentId}] does not exist.`);
//     //if there is an upadte in the  user basic details

//     const basicDetailsQuery: any = {};
//     if (appAgentDetails.first_name) {
//       basicDetailsQuery['first_name'] = appAgentDetails.first_name;
//     }
//     if (appAgentDetails.last_name) {
//       basicDetailsQuery['last_name'] = appAgentDetails.last_name;
//     }
//     if (appAgentDetails.email) {
//       basicDetailsQuery['email'] = appAgentDetails.email;
//     }
//     if (appAgentDetails.appReportingManagerId) {
//       basicDetailsQuery['appReportingManagerId'] = appAgentDetails.appReportingManagerId;
//     }
//     if (appAgentDetails.appAccessGroupId) {
//       basicDetailsQuery['appAccessGroupId'] = appAgentDetails.appAccessGroupId;
//     }
//     if (appAgentDetails.appDepartmentId) {
//       basicDetailsQuery['appDepartmentId'] = appAgentDetails.appDepartmentId;
//     }
//     if (appAgentDetails.appDesignationId) {
//       basicDetailsQuery['appDesignationId'] = appAgentDetails.appDesignationId;
//     }
//     if (appAgentDetails.employee_type) {
//       basicDetailsQuery['employee_type'] = appAgentDetails.employee_type;
//     }
//     if (
//       appAgentDetails.first_name ||
//       appAgentDetails.last_name ||
//       appAgentDetails.email ||
//       appAgentDetails.appReportingManagerId ||
//       appAgentDetails.appAccessGroupId ||
//       appAgentDetails.appDepartmentId ||
//       appAgentDetails.appDesignationId ||
//       appAgentDetails.employee_type
//     ) {
//       const updateAgentBasicDetails = await appAgentModel.findOneAndUpdate(
//         { _id: appAgentDetails.appAgentId },
//         {
//           $set: basicDetailsQuery
//         },
//         { new: true }
//       ).catch((error: any) => {
//         throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//       });
//       responseQuery['basicDetails'] = updateAgentBasicDetails;
//     }

//     //if there is an update in the company info details
//     const companyDetailsQuery: any = {};
//     if (appAgentDetails.primary_email) {
//       companyDetailsQuery['primary_email'] = appAgentDetails.primary_email;
//     }
//     if (appAgentDetails.company_email) {
//       companyDetailsQuery['company_email'] = appAgentDetails.company_email;
//     }
//     if (appAgentDetails.gender) {
//       companyDetailsQuery['gender'] = appAgentDetails.company_email;
//     }
//     if (appAgentDetails.date_of_birth) {
//       companyDetailsQuery['date_of_birth'] = appAgentDetails.date_of_birth;
//     }
//     if (appAgentDetails.date_of_joining) {
//       companyDetailsQuery['date_of_joining'] = appAgentDetails.date_of_joining;
//     }
//     if (appAgentDetails.working_hours) {
//       companyDetailsQuery['working_hours'] = appAgentDetails.working_hours;
//     }
//     if (appAgentDetails.salary) {
//       companyDetailsQuery['salary'] = appAgentDetails.salary;
//     }
//     if (appAgentDetails.marital_status) {
//       companyDetailsQuery['marital_status'] = appAgentDetails.marital_status;
//     }
//     if (
//       appAgentDetails.primary_email ||
//       appAgentDetails.company_email ||
//       appAgentDetails.gender ||
//       appAgentDetails.date_of_birth ||
//       appAgentDetails.date_of_joining ||
//       appAgentDetails.working_hours ||
//       appAgentDetails.salary ||
//       appAgentDetails.marital_status
//     ) {
//       const appAgentCompanyDetails = await appAgentModel.findOneAndUpdate(
//         { appAgentId: appAgentDetails.appAgentId },
//         {
//           $set: {
//             primary_email: appAgentDetails.primary_email,
//             company_email: appAgentDetails.company_email,
//             gender: appAgentDetails.gender,
//             date_of_birth: appAgentDetails.date_of_birth,
//             date_of_joining: appAgentDetails.date_of_joining,
//             working_hours: appAgentDetails.working_hours,
//             salary: appAgentDetails.salary,
//             marital_status: appAgentDetails.marital_status
//           }
//         },
//         { new: true }
//       ).catch((error: any) => {
//         throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//       });
//       responseQuery['companyDetails'] = appAgentCompanyDetails;
//     }
//     //if there is an update in the contact info details
//     const contactDetailsQuery: any = {};
//     if (appAgentDetails.number) {
//       contactDetailsQuery['number'] = appAgentDetails.number;
//     }
//     if (appAgentDetails.relation) {
//       contactDetailsQuery['relation'] = appAgentDetails.relation;
//     }
//     if (appAgentDetails.number || appAgentDetails.relation) {
//       const appusercontactdetails = await appAgentContactModel.findOneAndUpdate(
//         { appAgentId: appAgentDetails.appAgentId },
//         {
//           $set: {
//             number: appAgentDetails.number,
//             relation: appAgentDetails.relation
//           }
//         },
//         { new: true }
//       ).catch((error: any) => {
//         throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//       });
//       responseQuery['contactDetails'] = appusercontactdetails;
//     }
//     //if there is an update in the address info details
//     const addressDetailsQuery: any = {};
//     if (appAgentDetails.address) {
//       addressDetailsQuery['address'] = appAgentDetails.address;
//     }
//     if (appAgentDetails.city) {
//       addressDetailsQuery['city'] = appAgentDetails.city;
//     }
//     if (appAgentDetails.state) {
//       addressDetailsQuery['state'] = appAgentDetails.state;
//     }
//     if (appAgentDetails.country) {
//       addressDetailsQuery['country'] = appAgentDetails.country;
//     }
//     if (appAgentDetails.pincode) {
//       addressDetailsQuery['pincode'] = appAgentDetails.pincode;
//     }
//     if (appAgentDetails.landmark) {
//       addressDetailsQuery['landmark'] = appAgentDetails.landmark;
//     }

//     if (
//       appAgentDetails.address ||
//       appAgentDetails.city ||
//       appAgentDetails.state ||
//       appAgentDetails.country ||
//       appAgentDetails.pincode ||
//       appAgentDetails.landmark
//     ) {
//       const appAgentAddressDetails = await appAgentAddressModel.findOneAndUpdate(
//         { appAgentId: appAgentDetails.appAgentId },
//         {
//           $set: {
//             address: appAgentDetails.address,
//             city: appAgentDetails.city,
//             state: appAgentDetails.state,
//             country: appAgentDetails.country,
//             pincode: appAgentDetails.pincode,
//             landmark: appAgentDetails.landmark
//           }
//         },
//         { new: true }
//       ).catch((error: any) => {
//         throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//       });
//       responseQuery['addressDetails'] = appAgentAddressDetails;
//     }
//     //if there is an update in the bank info details
//     if (
//       appAgentDetails.name_as_per_bank ||
//       appAgentDetails.account_number ||
//       appAgentDetails.bank_name ||
//       appAgentDetails.ifsc_code
//     ) {
//       const appAgentBankDetails = await appAgentBanksModel.findOneAndUpdate(
//         { appAgentId: appAgentDetails.appAgentId },
//         {
//           $set: {
//             name_as_per_bank: appAgentDetails.name_as_per_bank,
//             account_number: appAgentDetails.account_number,
//             bank_name: appAgentDetails.bank_name,
//             ifsc_code: appAgentDetails.ifsc_code
//           }
//         },
//         { new: true }
//       ).catch((error: any) => {
//         throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//       });
//       responseQuery['bankDetails'] = appAgentBankDetails;
//     }
//     // Send Response
//     if (res.headersSent === false) {
//       res.status(200).send({
//         error: false,
//         data: {
//           UpdatedDetails: responseQuery,
//           message: 'User details updated successfully.'
//         }
//       });
//     }
//   } catch (error: any) {
//     logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
//     if (error?.isJoi === true) error.status = 422;
//     next(error);
//   }
// };

export const updateAgentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgentDetails: UpdateAppAgentType = await joiAgentAccount.updateAppUserSchema.validateAsync(req.body);
    const doesAgentExist = await appAgentModel.findOne(
      {
        _id: appAgentDetails.appAgentId,
        isDeleted: false
      });

    if (!doesAgentExist) {
      throw httpErrors.Conflict(`Agent with Id: ${appAgentDetails.appAgentId} does not exist`);
    }

    //check whether email id already associated with any user in database or not.
    const doesEmailExist = await appAgentModel.findOne(
      {
        email: appAgentDetails.email,
        isDeleted: false
      });

    if (doesEmailExist) {
      throw httpErrors.Conflict(`Agent with email: ${appAgentDetails.appAgentId} already exist`);
    }

    const appAgent = await appAgentModel.findOne(
      {
        _id: appAgentDetails.appAgentId,
        isDeleted: false
      }).catch(() => {
        throw httpErrors.UnprocessableEntity(
          `Unable to find Agent with id ${appAgentDetails.appAgentId}`
        );
      });

    await appAgent?.updateOne(appAgentDetails, {
      new: true
    }).catch((error: any) => {
      throw httpErrors.UnprocessableEntity(error.message);
    });
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          UpdatedDetails: appAgent,
          message: 'Agent details updated successfully.'
        }
      });
    }

  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
}


//description: get single users all details
//route: GET /api/v1/getSingleappAgentDetails
//access: private
// export const getSingleAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     //validate joi schema
//     const appuserDetails: GetAppUserType = await getAppUserSchema.validateAsync(req.body);
//     //check if user exist in collection
//     const doesAppUserExist = await AppUser.findOne({
//       _id: appuserDetails.appAgentId,
//       isDeleted: false
//     }).populate('appAccessGroupId appDepartmentId appDesignationId');
//     if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appAgentId}] does not exist.`);
//     //get user company details
//     const singleusercompanydetails = await AppUserDetails.findOne({
//       appAgentId: appuserDetails.appAgentId
//     }).catch((error: any) => {
//       throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
//     });
//     //get user bank details
//     const singleuserbankdetails = await AppUserBank.findOne({
//       appAgentId: appuserDetails.appAgentId
//     }).catch((error: any) => {
//       throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
//     });
//     //get user address details
//     const singleuseraddressdetails = await AppUserAddress.findOne({
//       appAgentId: appuserDetails.appAgentId
//     }).catch((error: any) => {
//       throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
//     });
//     //get user contact details
//     const singleusercontactdetails = await AppUserContact.findOne({
//       appAgentId: appuserDetails.appAgentId
//     }).catch((error: any) => {
//       throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
//     });

//     //send response
//     if (res.headersSent === false) {
//       res.status(200).send({
//         error: false,
//         data: {
//           user_details: doesAppUserExist,
//           company_details: singleusercompanydetails,
//           bank_details: singleuserbankdetails,
//           address_details: singleuseraddressdetails,
//           contact_details: singleusercontactdetails
//         }
//       });
//     }
//   } catch (error: any) {
//     logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
//     if (error?.isJoi === true) error.status = 422;
//     next(error);
//   }
// };
