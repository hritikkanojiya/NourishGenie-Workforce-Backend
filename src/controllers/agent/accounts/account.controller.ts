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
import appAgentModel from '../../../models/agent/agent.model';
import appAgentDetailsModel from '../../../models/agent/fields/app_agent_details.model';
import appAgentBanksModel from '../../../models/agent/fields/app_agent_banks.model';
import appAgentAddressModel from '../../../models/agent/fields/app_agent_address.model';
import appAgentContactModel from '../../../models/agent/fields/app_agent_contacts.model';
import appAgentFilesModel from '../../../models/agent/fields/app_agent_files.model';
import appAttachmentsModel from '../../../models/agent/fields/app_attachments.model';
import {
  joiAgentAccount,
  CreateAppAgentType,
  GetAppAgentType,
  UpdateAppAgentType,
  DeleteAppAgentType,
  FilterAgentType
} from '../../../helpers/joi/agent/account/index';
import { MetaDataBody } from '../../../helpers/shared/shared.type';

export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    //validate joi schema
    console.log(req.body);
    const appAgentDetails: CreateAppAgentType = await joiAgentAccount.createAppUserSchema.validateAsync(req.body);
    //const appuserFileDetails: UploadedFiles = await joiAgentAccount.uploadedFilesSchema.validateAsync(req.files);
    //check if user exist in collection
    const doesAppAgentExist = await appAgentModel.findOne({
      email: appAgentDetails.email,
      isDeleted: false
    });

    if (doesAppAgentExist) throw httpErrors.Conflict(`Agent with email: [${appAgentDetails.email}] already exist.`);

    //user basic details
    const app_agents = new appAgentModel({
      //basic details of user
      first_name: appAgentDetails.first_name,
      last_name: appAgentDetails.last_name,
      email: appAgentDetails.email,
      password: appAgentDetails.password,
      appAccessGroupId: stringToObjectId(appAgentDetails.appAccessGroupId),
      appDepartmentId: stringToObjectId(appAgentDetails.appDepartmentId),
      appReportingManagerId: appAgentDetails.appReportingManagerId
        ? stringToObjectId(appAgentDetails.appReportingManagerId)
        : null,
      appDesignationId: stringToObjectId(appAgentDetails.appDesignationId),
      employee_type: appAgentDetails.employee_type
    });
    // save
    const storeAppAgentBasicDetails = (
      await app_agents.save({}).catch((error: any) => {
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    const doesAppAgentDetailsExist = await appAgentDetailsModel.findOne({
      $or: [{ primary_email: appAgentDetails.email }, { company_email: appAgentDetails.company_email }],
      isDeleted: false
    });

    if (doesAppAgentDetailsExist)
      throw httpErrors.Conflict(
        `Agent with primary email: [${appAgentDetails.primary_email}] or company email: [${appAgentDetails.company_email}] already exist.`
      );

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
      await app_agent_details.save({}).catch(async (error: any) => {
        await appAgentModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

    //user bank details
    const appAgentBank: any = new appAgentBanksModel({
      appAgentId: storeAppAgentBasicDetails._id,
      name_as_per_bank: appAgentDetails.name_as_per_bank,
      account_number: appAgentDetails.account_number,
      ifsc_code: appAgentDetails.ifsc_code,
      bank_name: appAgentDetails.bank_name
    });
    //save
    const storeAppUserBankDetails = (
      await appAgentBank.save({}).catch(async (error: any) => {
        await appAgentDetailsModel.deleteOne({ _id: storeAppAgentPersonalDetails._id });
        await appAgentModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
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
      await appAgentAddress.save({}).catch(async (error: any) => {
        await appAgentModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
        await appAgentDetailsModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
        await appAgentBanksModel.deleteOne({ _id: storeAppUserBankDetails._id });
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
      await appAgentContact.save({}).catch(async (error: any) => {
        await appAgentModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
        await appAgentDetailsModel.deleteOne({ _id: storeAppAgentBasicDetails._id });
        await appAgentBanksModel.deleteOne({ _id: storeAppUserBankDetails._id });
        await appAgentAddressModel.deleteOne({ _id: storeAppAgentAddressDetails._id });
        throw httpErrors.InternalServerError(error.message);
      })
    ).toObject();

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

          message: 'Agent created successfully.'
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

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgentDetails: DeleteAppAgentType = await joiAgentAccount.deleteAppUserSchema.validateAsync(req.body);
    // Update records in Collection
    const appAgent = await appAgentModel
      .findOne({
        _id: appAgentDetails.appAgentId,
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
    // delete agent company details.
    const appAgentCompanyDetails = await appAgentDetailsModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentCompanyDetails)
      await appAgentCompanyDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete agent address details.
    const appAgentAddressDetails = await appAgentAddressModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentAddressDetails)
      await appAgentAddressDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete agent bank details.
    const appAgentBankDetails = await appAgentBanksModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentBankDetails)
      await appAgentBankDetails
        .updateOne({
          isDeleted: true
        })
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(error.message);
        });

    // delete agent attachment details.
    const appAgentAttachmentDetails = await appAttachmentsModel
      .find({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentAttachmentDetails) {
      appAgentAttachmentDetails.map(async (appAttachment: any) => {
        await appAttachment
          .updateOne({
            isDeleted: true
          })
          .catch((error: any) => {
            throw httpErrors.UnprocessableEntity(error.message);
          });
      });
    }

    // delete agent attachment details.
    const appAgentFilesDetails = await appAgentFilesModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });

    if (appAgentFilesDetails) {
      await appAgentFilesDetails
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

export const getAllAppAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(req.body);
    //validate joi schema
    const filterContent: FilterAgentType = await joiAgentAccount.filterUserSchema.validateAsync(req.body);
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
    const appAgents = await appAgentModel
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
      appAgents.map(async (appAgent: any) => {
        appAgent.appAgentId = appAgent._id;
        delete appAgent._id;
        delete appAgent.__v;
        return appAgent;
      })
    );
    const totalRecords = await appAgentModel.find(query).countDocuments();
    convertDateTimeFormat(appAgents);
    // Send Response
    if (res.headersSent === false) {
      res.status(200).send({
        error: false,
        data: {
          AppUsers: appAgents,
          metaData: {
            sortBy: metaData.sortBy,
            sortOn: metaData.sortOn,
            limit: metaData.limit,
            offset: metaData.offset,
            total_records: totalRecords
          },
          message: 'Agents fetched successfully.'
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

export const updateAppAgentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const responseQuery: any = {};
    console.log(req.body);
    //validate joi schema
    const appAgentDetails: UpdateAppAgentType = await joiAgentAccount.updateAppUserSchema.validateAsync(req.body);
    console.log('validation done');
    //check if user exist in collection
    const doesAppAgentExist = await appAgentModel.findOne({
      _id: appAgentDetails.appAgentId
    });

    if (!doesAppAgentExist) throw httpErrors.Conflict(`user [${appAgentDetails.appAgentId}] does not exist.`);
    //if there is an upadte in the  user basic details

    const basicDetailsQuery: any = {};
    if (appAgentDetails.first_name) {
      basicDetailsQuery['first_name'] = appAgentDetails.first_name;
    }
    if (appAgentDetails.last_name) {
      basicDetailsQuery['last_name'] = appAgentDetails.last_name;
    }
    if (appAgentDetails.email) {
      basicDetailsQuery['email'] = appAgentDetails.email;
    }
    if (appAgentDetails.appReportingManagerId) {
      basicDetailsQuery['appReportingManagerId'] = appAgentDetails.appReportingManagerId;
    } else {
      basicDetailsQuery['appReportingManagerId'] = null;
    }
    if (appAgentDetails.appAccessGroupId) {
      basicDetailsQuery['appAccessGroupId'] = appAgentDetails.appAccessGroupId;
    }
    if (appAgentDetails.appDepartmentId) {
      basicDetailsQuery['appDepartmentId'] = appAgentDetails.appDepartmentId;
    }
    if (appAgentDetails.appDesignationId) {
      basicDetailsQuery['appDesignationId'] = appAgentDetails.appDesignationId;
    }
    if (appAgentDetails.employee_type) {
      basicDetailsQuery['employee_type'] = appAgentDetails.employee_type;
    }
    console.log('basic details were updated');
    if (
      appAgentDetails.first_name ||
      appAgentDetails.last_name ||
      appAgentDetails.email ||
      appAgentDetails.appReportingManagerId ||
      appAgentDetails.appAccessGroupId ||
      appAgentDetails.appDepartmentId ||
      appAgentDetails.appDesignationId ||
      appAgentDetails.employee_type
    ) {
      const updateAgentBasicDetails = await appAgentModel
        .findOneAndUpdate(
          { _id: appAgentDetails.appAgentId },
          {
            $set: basicDetailsQuery
          },
          { new: true }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
        });
      responseQuery['basicDetails'] = updateAgentBasicDetails;
    }

    //if there is an update in the company info details
    const companyDetailsQuery: any = {};
    if (appAgentDetails.primary_email) {
      companyDetailsQuery['primary_email'] = appAgentDetails.primary_email;
    }
    if (appAgentDetails.company_email) {
      companyDetailsQuery['company_email'] = appAgentDetails.company_email;
    }
    if (appAgentDetails.gender) {
      companyDetailsQuery['gender'] = appAgentDetails.company_email;
    }
    if (appAgentDetails.date_of_birth) {
      companyDetailsQuery['date_of_birth'] = appAgentDetails.date_of_birth;
    }
    if (appAgentDetails.date_of_joining) {
      companyDetailsQuery['date_of_joining'] = appAgentDetails.date_of_joining;
    }
    if (appAgentDetails.working_hours) {
      companyDetailsQuery['working_hours'] = appAgentDetails.working_hours;
    }
    if (appAgentDetails.salary) {
      companyDetailsQuery['salary'] = appAgentDetails.salary;
    }
    if (appAgentDetails.marital_status) {
      companyDetailsQuery['marital_status'] = appAgentDetails.marital_status;
    }
    console.log('company details were updated');

    if (
      appAgentDetails.primary_email ||
      appAgentDetails.company_email ||
      appAgentDetails.gender ||
      appAgentDetails.date_of_birth ||
      appAgentDetails.date_of_joining ||
      appAgentDetails.working_hours ||
      appAgentDetails.salary ||
      appAgentDetails.marital_status
    ) {
      const appAgentCompanyDetails = await appAgentDetailsModel
        .findOneAndUpdate(
          { appAgentId: appAgentDetails.appAgentId },
          {
            $set: {
              primary_email: appAgentDetails.primary_email,
              company_email: appAgentDetails.company_email,
              gender: appAgentDetails.gender,
              date_of_birth: appAgentDetails.date_of_birth,
              date_of_joining: appAgentDetails.date_of_joining,
              working_hours: appAgentDetails.working_hours,
              salary: appAgentDetails.salary,
              marital_status: appAgentDetails.marital_status
            }
          },
          { new: true }
        )
        .catch((error: any) => {
          console.log(error);
          throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
        });
      responseQuery['companyDetails'] = appAgentCompanyDetails;
    }
    //if there is an update in the contact info details
    const contactDetailsQuery: any = {};
    if (appAgentDetails.number) {
      contactDetailsQuery['number'] = appAgentDetails.number;
    }
    if (appAgentDetails.relation) {
      contactDetailsQuery['relation'] = appAgentDetails.relation;
    }
    console.log('emergency  details were updated');

    if (appAgentDetails.number || appAgentDetails.relation) {
      const appusercontactdetails = await appAgentContactModel
        .findOneAndUpdate(
          { appAgentId: appAgentDetails.appAgentId },
          {
            $set: {
              number: appAgentDetails.number,
              relation: appAgentDetails.relation
            }
          },
          { new: true }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
        });
      responseQuery['contactDetails'] = appusercontactdetails;
    }
    //if there is an update in the address info details
    const addressDetailsQuery: any = {};
    if (appAgentDetails.address) {
      addressDetailsQuery['address'] = appAgentDetails.address;
    }
    if (appAgentDetails.city) {
      addressDetailsQuery['city'] = appAgentDetails.city;
    }
    if (appAgentDetails.state) {
      addressDetailsQuery['state'] = appAgentDetails.state;
    }
    if (appAgentDetails.country) {
      addressDetailsQuery['country'] = appAgentDetails.country;
    }
    if (appAgentDetails.pincode) {
      addressDetailsQuery['pincode'] = appAgentDetails.pincode;
    }
    if (appAgentDetails.landmark) {
      addressDetailsQuery['landmark'] = appAgentDetails.landmark;
    }
    console.log('address details were updated');

    if (
      appAgentDetails.address ||
      appAgentDetails.city ||
      appAgentDetails.state ||
      appAgentDetails.country ||
      appAgentDetails.pincode ||
      appAgentDetails.landmark
    ) {
      const appAgentAddressDetails = await appAgentAddressModel
        .findOneAndUpdate(
          { appAgentId: appAgentDetails.appAgentId },
          {
            $set: {
              address: appAgentDetails.address,
              city: appAgentDetails.city,
              state: appAgentDetails.state,
              country: appAgentDetails.country,
              pincode: appAgentDetails.pincode,
              landmark: appAgentDetails.landmark
            }
          },
          { new: true }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
        });
      responseQuery['addressDetails'] = appAgentAddressDetails;
    }
    //if there is an update in the bank info details
    console.log('bank details were updated');

    if (
      appAgentDetails.name_as_per_bank ||
      appAgentDetails.account_number ||
      appAgentDetails.bank_name ||
      appAgentDetails.ifsc_code
    ) {
      const appAgentBankDetails = await appAgentBanksModel
        .findOneAndUpdate(
          { appAgentId: appAgentDetails.appAgentId },
          {
            $set: {
              name_as_per_bank: appAgentDetails.name_as_per_bank,
              account_number: appAgentDetails.account_number,
              bank_name: appAgentDetails.bank_name,
              ifsc_code: appAgentDetails.ifsc_code
            }
          },
          { new: true }
        )
        .catch((error: any) => {
          throw httpErrors.UnprocessableEntity(`Error updating records in DB. ${error?.message}`);
        });
      responseQuery['bankDetails'] = appAgentBankDetails;
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
    console.log(error);
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export const updateAgentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appAgentDetails: UpdateAppAgentType = await joiAgentAccount.updateAppUserSchema.validateAsync(req.body);
    const doesAgentExist = await appAgentModel.findOne({
      _id: appAgentDetails.appAgentId,
      isDeleted: false
    });

    if (!doesAgentExist) {
      throw httpErrors.Conflict(`Agent with Id: ${appAgentDetails.appAgentId} does not exist`);
    }

    const appAgent = await appAgentModel
      .findOne({
        _id: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find Agent with id ${appAgentDetails.appAgentId}`);
      });

    await appAgent
      ?.updateOne(
        {
          first_name: appAgentDetails.first_name,
          last_name: appAgentDetails.last_name,
          email: appAgentDetails.email,
          password: appAgentDetails.password,
          appAccessGroupId: appAgentDetails.appAccessGroupId,
          appDepartmentId: appAgentDetails.appDepartmentId,
          appReportingManagerId: appAgentDetails.appReportingManagerId ? appAgentDetails.appReportingManagerId : null,
          appDesignationId: appAgentDetails.appDesignationId,
          employee_type: appAgentDetails.employee_type
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appAgentCompanyDetails = await appAgentDetailsModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find Agent with id ${appAgentDetails.appAgentId}`);
      });

    await appAgentCompanyDetails
      ?.updateOne(
        {
          appAgentId: appAgentDetails.appAgentId,
          primary_email: appAgentDetails.primary_email,
          company_email: appAgentDetails.company_email,
          gender: appAgentDetails.gender,
          contact_number: appAgentDetails.contact_number,
          date_of_birth: appAgentDetails.date_of_birth,
          marital_status: appAgentDetails.marital_status,
          date_of_joining: appAgentDetails.date_of_joining,
          working_hours: appAgentDetails.working_hours,
          salary: appAgentDetails.salary
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appAgentBankDetails = await appAgentBanksModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find Agent with id ${appAgentDetails.appAgentId}`);
      });

    await appAgentBankDetails
      ?.updateOne(
        {
          appAgentId: appAgentDetails.appAgentId,
          name_as_per_bank: appAgentDetails.name_as_per_bank,
          account_number: appAgentDetails.account_number,
          ifsc_code: appAgentDetails.ifsc_code,
          bank_name: appAgentDetails.bank_name
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appAgentAddressDetails = await appAgentBanksModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find Agent with id ${appAgentDetails.appAgentId}`);
      });

    await appAgentAddressDetails
      ?.updateOne(
        {
          appAgentId: appAgentDetails.appAgentId,
          name_as_per_bank: appAgentDetails.name_as_per_bank,
          account_number: appAgentDetails.account_number,
          ifsc_code: appAgentDetails.ifsc_code,
          bank_name: appAgentDetails.bank_name
        },
        {
          new: true
        }
      )
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(error.message);
      });

    const appAgentContactDetails = await appAgentBanksModel
      .findOne({
        appAgentId: appAgentDetails.appAgentId,
        isDeleted: false
      })
      .catch(() => {
        throw httpErrors.UnprocessableEntity(`Unable to find Agent with id ${appAgentDetails.appAgentId}`);
      });

    await appAgentContactDetails
      ?.updateOne(
        {
          appAgentId: appAgentDetails.appAgentId,
          number: appAgentDetails.contact_number,
          relation: appAgentDetails.relation
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
          message: 'Agent details updated successfully.'
        }
      });
    }
  } catch (error: any) {
    logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
    if (error?.isJoi === true) error.status = 422;
    next(error);
  }
};

export const getSingleAppUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log(req.body);
    //validate joi schema
    const appuserDetails: GetAppAgentType = await joiAgentAccount.getAppUserSchema.validateAsync(req.body);
    //check if user exist in collection
    const doesAppUserExist = await appAgentModel
      .findOne({
        _id: appuserDetails.appAgentId,
        isDeleted: false
      })
      .populate('appAccessGroupId appDepartmentId appDesignationId')
      .populate({ path: 'appReportingManagerId', populate: { path: 'appAgentId' } });
    if (!doesAppUserExist) throw httpErrors.Conflict(`user [${appuserDetails.appAgentId}] does not exist.`);
    //get user company details
    const singleusercompanydetails = await appAgentDetailsModel
      .findOne({
        appAgentId: appuserDetails.appAgentId
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user bank details
    const singleuserbankdetails = await appAgentBanksModel
      .findOne({
        appAgentId: appuserDetails.appAgentId
      })
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user address details
    const singleuseraddressdetails = await appAgentAddressModel
      .findOne({
        appAgentId: appuserDetails.appAgentId
      })
      .populate('country state city')
      .catch((error: any) => {
        throw httpErrors.UnprocessableEntity(`Error retrieving records from DB. ${error?.message}`);
      });
    //get user contact details
    const singleusercontactdetails = await appAgentContactModel
      .findOne({
        appAgentId: appuserDetails.appAgentId
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
