import { NextFunction, Request, Response } from 'express';
import {
  compactObject,
  configureMetaData,
  getFieldsToInclude,
  convertDateTimeFormat,
  logBackendError,
  stringToObjectId
} from '../../../helpers/common/backend.functions';
import httpErrors from 'http-errors';
import { appUserModel } from '../../../models/agent/agent.model';
import { appUserDetailsModel } from '../../../models/agent/fields/app_agent_details.model';
import { appUserBanksModel } from '../../../models/agent/fields/app_agent_banks.model';
import { appUserAddressModel } from '../../../models/agent/fields/app_agent_address.model';
import { appUserContactsModel } from '../../../models/agent/fields/app_agent_contacts.model';
import { appUserFilesModel } from '../../../models/agent/fields/app_agent_files.model';
import { appUserAttachmentModel } from '../../../models/agent/fields/app_attachments.model';
import {
  joiUserAccount,
  CreateAppUserType,
  GetAppUserType,
  UpdateAppUserType,
  FilterUserType,
  DeleteAppUserType

} from '../../../helpers/joi/agent/account/index';
import { MetaDataBody } from '../../../helpers/shared/shared.type';

const createUserAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appUserDetails: CreateAppUserType = await joiUserAccount.createAppUserSchema.validateAsync(req.body);

    //check if user exist in collection
    const doesAppUserExist = await appUserModel.findOne({
      email: appUserDetails.email,
      isDeleted: false
    });

    if (doesAppUserExist) throw httpErrors.Conflict(`User with email: [${appUserDetails.email}] already exist.`);

    //user basic details
    const app_Users = new appUserModel({
      //basic details of user
      first_name: appUserDetails.first_name,
      last_name: appUserDetails.last_name,
      email: appUserDetails.email,
      password: appUserDetails.password,
      appAccessGroupId: stringToObjectId(appUserDetails.appAccessGroupId),
      appDepartmentId: stringToObjectId(appUserDetails.appDepartmentId),
      appReportingManagerId: appUserDetails.appReportingManagerId
        ? stringToObjectId(appUserDetails.appReportingManagerId)
        : null,
      appDesignationId: stringToObjectId(appUserDetails.appDesignationId),
      employee_type: appUserDetails.employee_type
    });
    // save
    const storeAppUserBasicDetails = (
      await app_Users.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    const doesappUserDetailsExist = await appUserDetailsModel.findOne({
      $or: [{ primary_email: appUserDetails.email }, { company_email: appUserDetails.company_email }],
      isDeleted: false
    });

    if (doesappUserDetailsExist)
      throw httpErrors.Conflict(
        `User with primary email: [${appUserDetails.primary_email}] or company email: [${appUserDetails.company_email}] already exist.`
      );

    //user company details
    const app_user_details = new appUserDetailsModel({
      appUserId: storeAppUserBasicDetails._id,
      primary_email: appUserDetails.primary_email,
      company_email: appUserDetails.company_email,
      gender: appUserDetails.gender,
      contact_number: appUserDetails.contact_number,
      date_of_birth: appUserDetails.date_of_birth,
      marital_status: appUserDetails.marital_status,
      date_of_joining: appUserDetails.date_of_joining,
      working_hours: appUserDetails.working_hours,
      salary: appUserDetails.salary
    }); //save
    const storeAppUserPersonalDetails = (
      await app_user_details.save({}).catch(async (error: any) => {
        await appUserModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //user bank details
    const appUserBank: any = new appUserBanksModel({
      appUserId: storeAppUserBasicDetails._id,
      name_as_per_bank: appUserDetails.name_as_per_bank,
      account_number: appUserDetails.account_number,
      ifsc_code: appUserDetails.ifsc_code,
      bank_name: appUserDetails.bank_name
    });
    //save
    const storeAppUserBankDetails = (
      await appUserBank.save({}).catch(async (error: any) => {
        await appUserDetailsModel.deleteOne({ _id: storeAppUserPersonalDetails._id });
        await appUserModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //address details
    const appUserAddress = new appUserAddressModel({
      appUserId: storeAppUserBasicDetails._id,
      address: appUserDetails.address,
      city: appUserDetails.city,
      state: appUserDetails.state,
      country: appUserDetails.country,
      pincode: appUserDetails.pincode,
      landmark: appUserDetails.landmark
    });
    //save
    const storeAppUserAddressDetails = (
      await appUserAddress.save({}).catch(async (error: any) => {
        await appUserModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        await appUserDetailsModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        await appUserBanksModel.deleteOne({ _id: storeAppUserBankDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();
    //user contact
    const appUserContact = new appUserContactsModel({
      appUserId: storeAppUserBasicDetails._id,
      number: appUserDetails.contact_number,
      relation: appUserDetails.relation
    });
    //save
    const storeAppUserContactDetails = (
      await appUserContact.save({}).catch(async (error: any) => {
        await appUserModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        await appUserDetailsModel.deleteOne({ _id: storeAppUserBasicDetails._id });
        await appUserBanksModel.deleteOne({ _id: storeAppUserBankDetails._id });
        await appUserAddressModel.deleteOne({ _id: storeAppUserAddressDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          appUser: {
            appUserId: storeAppUserBasicDetails._id,
            email: storeAppUserBasicDetails.email,
            password: storeAppUserBasicDetails.password
          },
          appUserDetails: {
            appUserDetailsId: storeAppUserPersonalDetails._id,
            primary_email: storeAppUserPersonalDetails.primary_email
          },
          appUserBank: {
            appUserBankId: storeAppUserBankDetails._id,
            name_as_per_bank: storeAppUserBankDetails.name_as_per_bank
          },
          appUserAddress: {
            appUserAddressId: storeAppUserAddressDetails._id,
            country: storeAppUserAddressDetails.country
          },
          appUserContact: {
            appUserContactId: storeAppUserContactDetails._id,
            number: storeAppUserContactDetails.number
          },

          message: 'User created successfully.'
        }
      });
    }
  } catch (error: any) {
    if (error.message.includes('duplicate key error')) {
      // Extract the duplicate key value from the error message
      const duplicateField = error.message.split('dup key: ')[1];

      // Return the duplicate key error message to the frontend
      res.status(200).json({ error: true, message: `Duplicate key error: ${duplicateField}` });
    } else {
      logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
      if (error?.isJoi === true) error.status = 422;
      next(error);
    }
  }
};

const deleteUserAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appUserDetails: DeleteAppUserType = await joiUserAccount.deleteAppUserSchema.validateAsync(req.body);
    // Update records in Collection
    const appUser = await appUserModel
      .findOne({
        _id: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (!appUser) throw httpErrors.UnprocessableEntity(`Invalid user ID.`);

    await appUser
      .updateOne({
        isDeleted: true
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });
    // delete User company details.
    const appUserCompanyDetails = await appUserDetailsModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appUserCompanyDetails)
      await appUserCompanyDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete User address details.
    const appUserAddressDetails = await appUserAddressModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appUserAddressDetails)
      await appUserAddressDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete User bank details.
    const appUserBankDetails = await appUserBanksModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appUserBankDetails)
      await appUserBankDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete User attachment details.
    const appUserAttachmentDetails = await appUserAttachmentModel
      .find({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appUserAttachmentDetails) {
      appUserAttachmentDetails.map(async (appAttachment: any) => {
        await appAttachment
          .updateOne({
            isDeleted: true
          })
          .catch((error: any) => {
            throw httpErrors.UnprocessableEntity(error.message);
          });
      });
    }

    // delete User attachment details.
    const appUserFilesDetails = await appUserFilesModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appUserFilesDetails) {
      await appUserFilesDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });
    }

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

const getAllAppUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(req.body);
    //validate joi schema
    const filterContent: FilterUserType = await joiUserAccount.filterUserSchema.validateAsync(req.body);
    compactObject(filterContent);
    const metaData: MetaDataBody = await configureMetaData(filterContent);
    const fieldsToInclude = getFieldsToInclude(metaData.fields);

    const query: any = {
      isDeleted: false
    };
    if (filterContent.appDepartmentId) {
      query['appDepartmentId'] = filterContent.appDepartmentId;
    }
    if (filterContent.appDesignationId) {
      query['appDesignationId'] = filterContent.appDesignationId;
    }

    if (filterContent.search) {
      query['$or'] = [{ first_name: { $regex: filterContent.search, $options: 'i' } }];
    }
    const appUsers = await appUserModel
      .find(query, {}, {})
      .select(fieldsToInclude)
      .sort({ [metaData.sortOn]: metaData.sortBy })
      .skip(metaData.offset)
      .limit(metaData.limit)
      .lean()
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    await Promise.all(
      appUsers.map(async (appUser: any) => {
        appUser.appUserId = appUser._id;
        delete appUser._id;
        delete appUser.__v;
        return appUser;
      })
    );
    const totalRecords = await appUserModel.find(query).countDocuments();
    convertDateTimeFormat(appUsers);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUsers: appUsers,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Users fetched successfully.'
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

// const updateAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const responseQuery: any = {};
//     console.log(req.body);
//     //validate joi schema
//     const appUserDetails: UpdateAppUserType = await joiUserAccount.updateAppUserSchema.validateAsync(req.body);
//     console.log('validation done');
//     //check if user exist in collection
//     const doesAppUserExist = await appUserModel.findOne({
//       _id: appUserDetails.appUserId
//     });

//     if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appUserDetails.appUserId}] does not exist.`);
//     //if there is an upadte in the  user basic details

//     const basicDetailsQuery: any = {};
//     if (appUserDetails.first_name) {
//       basicDetailsQuery['first_name'] = appUserDetails.first_name;
//     }
//     if (appUserDetails.last_name) {
//       basicDetailsQuery['last_name'] = appUserDetails.last_name;
//     }
//     if (appUserDetails.email) {
//       basicDetailsQuery['email'] = appUserDetails.email;
//     }
//     if (appUserDetails.appReportingManagerId) {
//       basicDetailsQuery['appReportingManagerId'] = appUserDetails.appReportingManagerId;
//     } else {
//       basicDetailsQuery['appReportingManagerId'] = null;
//     }
//     if (appUserDetails.appAccessGroupId) {
//       basicDetailsQuery['appAccessGroupId'] = appUserDetails.appAccessGroupId;
//     }
//     if (appUserDetails.appDepartmentId) {
//       basicDetailsQuery['appDepartmentId'] = appUserDetails.appDepartmentId;
//     }
//     if (appUserDetails.appDesignationId) {
//       basicDetailsQuery['appDesignationId'] = appUserDetails.appDesignationId;
//     }
//     if (appUserDetails.employee_type) {
//       basicDetailsQuery['employee_type'] = appUserDetails.employee_type;
//     }
//     console.log('basic details were updated');
//     if (
//       appUserDetails.first_name ||
//       appUserDetails.last_name ||
//       appUserDetails.email ||
//       appUserDetails.appReportingManagerId ||
//       appUserDetails.appAccessGroupId ||
//       appUserDetails.appDepartmentId ||
//       appUserDetails.appDesignationId ||
//       appUserDetails.employee_type
//     ) {
//       const updateUserBasicDetails = await appUserModel
//         .findOneAndUpdate(
//           { _id: appUserDetails.appUserId },
//           {
//             $set: basicDetailsQuery
//           },
//           { new: true }
//         )
//         .catch((error: any) => {
//           throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//         });
//       responseQuery['basicDetails'] = updateUserBasicDetails;
//     }

//     //if there is an update in the company info details
//     const companyDetailsQuery: any = {};
//     if (appUserDetails.primary_email) {
//       companyDetailsQuery['primary_email'] = appUserDetails.primary_email;
//     }
//     if (appUserDetails.company_email) {
//       companyDetailsQuery['company_email'] = appUserDetails.company_email;
//     }
//     if (appUserDetails.gender) {
//       companyDetailsQuery['gender'] = appUserDetails.company_email;
//     }
//     if (appUserDetails.date_of_birth) {
//       companyDetailsQuery['date_of_birth'] = appUserDetails.date_of_birth;
//     }
//     if (appUserDetails.date_of_joining) {
//       companyDetailsQuery['date_of_joining'] = appUserDetails.date_of_joining;
//     }
//     if (appUserDetails.working_hours) {
//       companyDetailsQuery['working_hours'] = appUserDetails.working_hours;
//     }
//     if (appUserDetails.salary) {
//       companyDetailsQuery['salary'] = appUserDetails.salary;
//     }
//     if (appUserDetails.marital_status) {
//       companyDetailsQuery['marital_status'] = appUserDetails.marital_status;
//     }
//     console.log('company details were updated');

//     if (
//       appUserDetails.primary_email ||
//       appUserDetails.company_email ||
//       appUserDetails.gender ||
//       appUserDetails.date_of_birth ||
//       appUserDetails.date_of_joining ||
//       appUserDetails.working_hours ||
//       appUserDetails.salary ||
//       appUserDetails.marital_status
//     ) {
//       const appUserCompanyDetails = await appUserDetailsModel
//         .findOneAndUpdate(
//           { appUserId: appUserDetails.appUserId },
//           {
//             $set: {
//               primary_email: appUserDetails.primary_email,
//               company_email: appUserDetails.company_email,
//               gender: appUserDetails.gender,
//               date_of_birth: appUserDetails.date_of_birth,
//               date_of_joining: appUserDetails.date_of_joining,
//               working_hours: appUserDetails.working_hours,
//               salary: appUserDetails.salary,
//               marital_status: appUserDetails.marital_status
//             }
//           },
//           { new: true }
//         )
//         .catch((error: any) => {
//           console.log(error);
//           throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//         });
//       responseQuery['companyDetails'] = appUserCompanyDetails;
//     }
//     //if there is an update in the contact info details
//     const contactDetailsQuery: any = {};
//     if (appUserDetails.number) {
//       contactDetailsQuery['number'] = appUserDetails.number;
//     }
//     if (appUserDetails.relation) {
//       contactDetailsQuery['relation'] = appUserDetails.relation;
//     }
//     console.log('emergency  details were updated');

//     if (appUserDetails.number || appUserDetails.relation) {
//       const appusercontactdetails = await appUserContactsModel
//         .findOneAndUpdate(
//           { appUserId: appUserDetails.appUserId },
//           {
//             $set: {
//               number: appUserDetails.number,
//               relation: appUserDetails.relation
//             }
//           },
//           { new: true }
//         )
//         .catch((error: any) => {
//           throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//         });
//       responseQuery['contactDetails'] = appusercontactdetails;
//     }
//     //if there is an update in the address info details
//     const addressDetailsQuery: any = {};
//     if (appUserDetails.address) {
//       addressDetailsQuery['address'] = appUserDetails.address;
//     }
//     if (appUserDetails.city) {
//       addressDetailsQuery['city'] = appUserDetails.city;
//     }
//     if (appUserDetails.state) {
//       addressDetailsQuery['state'] = appUserDetails.state;
//     }
//     if (appUserDetails.country) {
//       addressDetailsQuery['country'] = appUserDetails.country;
//     }
//     if (appUserDetails.pincode) {
//       addressDetailsQuery['pincode'] = appUserDetails.pincode;
//     }
//     if (appUserDetails.landmark) {
//       addressDetailsQuery['landmark'] = appUserDetails.landmark;
//     }
//     console.log('address details were updated');

//     if (
//       appUserDetails.address ||
//       appUserDetails.city ||
//       appUserDetails.state ||
//       appUserDetails.country ||
//       appUserDetails.pincode ||
//       appUserDetails.landmark
//     ) {
//       const appUserAddressDetails = await appUserAddressModel
//         .findOneAndUpdate(
//           { appUserId: appUserDetails.appUserId },
//           {
//             $set: {
//               address: appUserDetails.address,
//               city: appUserDetails.city,
//               state: appUserDetails.state,
//               country: appUserDetails.country,
//               pincode: appUserDetails.pincode,
//               landmark: appUserDetails.landmark
//             }
//           },
//           { new: true }
//         )
//         .catch((error: any) => {
//           throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//         });
//       responseQuery['addressDetails'] = appUserAddressDetails;
//     }
//     //if there is an update in the bank info details
//     console.log('bank details were updated');

//     if (
//       appUserDetails.name_as_per_bank ||
//       appUserDetails.account_number ||
//       appUserDetails.bank_name ||
//       appUserDetails.ifsc_code
//     ) {
//       const appUserBankDetails = await appUserBanksModel
//         .findOneAndUpdate(
//           { appUserId: appUserDetails.appUserId },
//           {
//             $set: {
//               name_as_per_bank: appUserDetails.name_as_per_bank,
//               account_number: appUserDetails.account_number,
//               bank_name: appUserDetails.bank_name,
//               ifsc_code: appUserDetails.ifsc_code
//             }
//           },
//           { new: true }
//         )
//         .catch((error: any) => {
//           throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
//         });
//       responseQuery['bankDetails'] = appUserBankDetails;
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
//     console.log(error);
//     logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
//     if (error?.isJoi === true) error.status = 422;
//     next(error);
//   }
// };

const updateUserAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appUserDetails: UpdateAppUserType = await joiUserAccount.updateAppUserSchema.validateAsync(req.body);
    const doesUserExist = await appUserModel.findOne({
      _id: appUserDetails.appUserId,
      isDeleted: false
    });

    if (!doesUserExist) {
      throw httpErrors.Conflict(`User with Id: ${appUserDetails.appUserId} does not exist`);
    }

    const appUser = await appUserModel
      .findOne({
        _id: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find User with id ${appUserDetails.appUserId}`);
      });

    await appUser
      ?.updateOne(
        {
          first_name: appUserDetails.first_name,
          last_name: appUserDetails.last_name,
          email: appUserDetails.email,
          password: appUserDetails.password,
          appAccessGroupId: appUserDetails.appAccessGroupId,
          appDepartmentId: appUserDetails.appDepartmentId,
          appReportingManagerId: appUserDetails.appReportingManagerId ? appUserDetails.appReportingManagerId : null,
          appDesignationId: appUserDetails.appDesignationId,
          employee_type: appUserDetails.employee_type
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appUserCompanyDetails = await appUserDetailsModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find User with id ${appUserDetails.appUserId}`);
      });

    await appUserCompanyDetails
      ?.updateOne(
        {
          appUserId: appUserDetails.appUserId,
          primary_email: appUserDetails.primary_email,
          company_email: appUserDetails.company_email,
          gender: appUserDetails.gender,
          contact_number: appUserDetails.contact_number,
          date_of_birth: appUserDetails.date_of_birth,
          marital_status: appUserDetails.marital_status,
          date_of_joining: appUserDetails.date_of_joining,
          working_hours: appUserDetails.working_hours,
          salary: appUserDetails.salary
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appUserBankDetails = await appUserBanksModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find User with id ${appUserDetails.appUserId}`);
      });

    await appUserBankDetails
      ?.updateOne(
        {
          appUserId: appUserDetails.appUserId,
          name_as_per_bank: appUserDetails.name_as_per_bank,
          account_number: appUserDetails.account_number,
          ifsc_code: appUserDetails.ifsc_code,
          bank_name: appUserDetails.bank_name
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appUserAddressDetails = await appUserBanksModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find User with id ${appUserDetails.appUserId}`);
      });

    await appUserAddressDetails
      ?.updateOne(
        {
          appUserId: appUserDetails.appUserId,
          name_as_per_bank: appUserDetails.name_as_per_bank,
          account_number: appUserDetails.account_number,
          ifsc_code: appUserDetails.ifsc_code,
          bank_name: appUserDetails.bank_name
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appUserContactDetails = await appUserBanksModel
      .findOne({
        appUserId: appUserDetails.appUserId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find User with id ${appUserDetails.appUserId}`);
      });

    await appUserContactDetails
      ?.updateOne(
        {
          appUserId: appUserDetails.appUserId,
          number: appUserDetails.contact_number,
          relation: appUserDetails.relation
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
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

const getSingleAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    const appuserDetails: GetAppUserType = await joiUserAccount.getAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist = await appUserModel
      .findOne({
        _id: appuserDetails.appUserId,
        isDeleted: false
      })
      .populate('appAccessGroupId appDepartmentId appDesignationId')
      .populate({ path: 'appReportingManagerId', populate: { path: 'appUserId' } });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appUserId}] does not exist.`);
    //get user company details
    const singleusercompanydetails = await appUserDetailsModel
      .findOne({
        appUserId: appuserDetails.appUserId
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user bank details
    const singleuserbankdetails = await appUserBanksModel
      .findOne({
        appUserId: appuserDetails.appUserId
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user address details
    const singleuseraddressdetails = await appUserAddressModel
      .findOne({
        appUserId: appuserDetails.appUserId
      })
      .populate('country state city')
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user contact details
    const singleusercontactdetails = await appUserContactsModel
      .findOne({
        appUserId: appuserDetails.appUserId
      })
      .catch((error: any) => {
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

export {
  getSingleAppUserDetails,
  updateUserAccount,
  getAllAppUsers,
  deleteUserAccount,
  createUserAccount
}