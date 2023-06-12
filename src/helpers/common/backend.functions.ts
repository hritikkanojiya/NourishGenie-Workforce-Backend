// Common function definitions for the project
import httpErrors from 'http-errors';
import mongoose, { Types } from 'mongoose';
import _ from 'lodash';
import { MetaDataBody } from 'helpers/shared/shared.type';
import { LOGGER } from './init_winston';
import moment from 'moment';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { GlobalConfig } from './environment';
import { appMenuModel, appSubMenuModel } from '../../models/permissions/menu/menu.model'
import { AppMenuType } from 'helpers/joi/permissions/menu';
const appConstants = {
  DEFAULT_LIMIT_SIZE: 10,
  DEFAULT_OFFSET: 0,
  DEFAULT_SORT_BY: 'desc',
  DEFAULT_SORT_ON: '_id'
};

function stringToObjectId(rawData: string | string[] | undefined): Types.ObjectId | Types.ObjectId[] {
  try {
    const executionType = typeof rawData;
    const processedData: string[] = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
    const typecastedData = _.map(processedData, data => new mongoose.Types.ObjectId(data.toString()));
    return executionType === 'string' ? typecastedData[0] : typecastedData;
  } catch (error) {
    throw httpErrors.UnprocessableEntity('Error typecasting string to object-id');
  }
}

function sanitizeUrl(url: string): string {
  // Remove Parameters [:id,etc] => i.e (Gives raw route without any Parameters or Query String)
  return (url.split(':')[0].endsWith('/') ? url.split(':')[0] : url + '/').toString().replace(/\/{2,}/g, '/');
}


async function getMenuSchema(menus: AppMenuType[], requestType = false): Promise<AppMenuType[]> {
  try {
    // const APP_FRONTEND = process.env.APP_FRONTEND;
    const menuSchema: AppMenuType[] = [];
    for (let index = 0; index < menus.length; index++) {
      const appMenu: AppMenuType = {
        name: menus[index].name,
        description: menus[index].description,
        hasSubMenus: menus[index].hasSubMenus,
        url: `${menus[index].url}`
      };

      if (requestType) {
        appMenu.appMenuId = menus[index]._id;
        appMenu.appAccessGroupIds = menus[index].appAccessGroupIds;
        appMenu.sequenceNumber = menus[index].sequenceNumber;
      }

      menuSchema.push(appMenu);
    }
    return menuSchema;
  } catch (error: any) {
    return (error);
  }
}

async function getMaxMenuSeqNum(): Promise<number> {
  try {
    const latestMenu: AppMenuType[] = await appMenuModel
      .find()
      .sort({ ['sequenceNumber']: 'desc' })
      .select({ _id: 1, sequenceNumber: 1 })
      .limit(1);
    console.log(latestMenu);
    const maxMenuSeqNum =
      latestMenu.length == 1 && latestMenu[0]?.sequenceNumber != undefined
        ? parseInt(latestMenu[0]?.sequenceNumber) + 1
        : 1;
    return maxMenuSeqNum;
  } catch (error: any) {
    return (error);
  }
}


function isValidURL(url: string): boolean {
  try {
    const isValid = new URL(url);
    if (isValid.pathname) return true;
    return false;
  } catch (error) {
    return false;
  }
}

async function getMaxSubMenuSeqNum(): Promise<number> {
  try {
    const latestSubMenu = await appSubMenuModel
      .find()
      .sort({ ['sequenceNumber']: 'desc' })
      .select({ _id: 1, sequenceNumber: 1 })
      .limit(1);

    const maxSubMenuSeqNum =
      latestSubMenu.length == 1 &&
        latestSubMenu[0]?.sequenceNumber != undefined
        ? latestSubMenu[0]?.sequenceNumber + 1
        : 1;
    return (maxSubMenuSeqNum);
  } catch (error: any) {
    return (error);
  }
}

const objectIdToString = (rawData: mongoose.Types.ObjectId[] | mongoose.Types.ObjectId): string => {
  try {
    // const executionType = typeof rawData;
    rawData = Array.isArray(rawData) ? rawData : [rawData];
    const typecastedData = _.map(rawData, data => data.toString());
    return typecastedData[0];
  } catch (error) {
    throw httpErrors.UnprocessableEntity('Error typecasting object-id to string');
  }
};

function convertToIST(dateTime: Date | string, format: string | boolean = false): Date | string {
  try {
    return moment
      .utc(dateTime)
      .local()
      .format(format ? format.toString() : 'YYYY-MM-DDTHH:mm:ss.sssZ');
  } catch (error) {
    return dateTime;
  }
}

function compactObject(requestObject: any): any {
  try {
    Object.entries(requestObject).forEach(obj => {
      if (obj[1] != null && typeof obj[1] === 'object') {
        requestObject[obj[0]] = compactObject(requestObject[obj[0]]);
      }
      obj[1] === null ? delete requestObject[obj[0]] : 0;
    });
    return requestObject;
  } catch (error) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Please try again`);
  }
}

const arrayPull = (masterArray: string[], valuesToRemove: string[]): string[] => {
  try {
    const executionType = typeof valuesToRemove;
    console.log(executionType);
    valuesToRemove = executionType === 'object' ? valuesToRemove : valuesToRemove;
    return _.without(masterArray, ...valuesToRemove);
  } catch (error) {
    throw httpErrors.UnprocessableEntity('Error performing [arrayPull] operation.');
  }
};

const arrayUnion = (multiDimArray: string[][]): string[] => {
  try {
    return _.union(...multiDimArray);
  } catch (error) {
    throw httpErrors.UnprocessableEntity('Error performing [arrayUnion] operation.');
  }
};


async function configureMetaData(querySchema: any): Promise<MetaDataBody> {
  try {
    return {
      sortBy: querySchema?.metaData?.sortBy ? querySchema.metaData.sortBy : appConstants.DEFAULT_SORT_BY,
      sortOn: querySchema?.metaData?.sortOn ? querySchema.metaData.sortOn : appConstants.DEFAULT_SORT_ON,
      limit: querySchema?.metaData?.limit
        ? querySchema.metaData.limit === -1
          ? 0
          : querySchema.metaData.limit
        : appConstants.DEFAULT_LIMIT_SIZE,
      offset: querySchema?.metaData?.offset ? querySchema.metaData.offset : appConstants.DEFAULT_OFFSET,
      fields:
        querySchema?.metaData?.fields?.length && querySchema?.metaData?.fields?.length > 0
          ? querySchema.metaData.fields
          : []
    };
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(error?.message);
  }
}

async function logBackendError(
  scriptPath: string,
  errorMessage: string | null,
  routePath: string | null = null,
  clientAddress: string | null = null,
  miscellaneous: string | null = null,
  level?: string
): Promise<boolean> {
  try {
    if (mongoose.connection.readyState === 1) {
      // const errorDetails = new appBackendErrorModel({
      //   level: level ? level : 'error',
      //   details: {
      //     clientAddress,
      //     errorMessage,
      //     miscellaneous,
      //     routePath,
      //     scriptPath,
      //   },
      // });
      // await errorDetails.save().catch((error) => {
      //   throw error;
      // });
      return true;
    } else {
      LOGGER.info({
        level: level ? level : 'error',
        details: {
          clientAddress,
          errorMessage,
          miscellaneous,
          routePath,
          scriptPath
        }
      });
      return false;
    }
  } catch (error: any) {
    console.log(`Error while creating a log : ${error?.message}`);
    return false;
  }
}

function getFieldsToInclude(fieldsArray: string[]): { [k: string]: number } {
  try {
    return Object.fromEntries(fieldsArray.map(field => [field, 1]));
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

async function convertDateTimeFormat(dataDetails: any): Promise<void> {
  if (Array.isArray(dataDetails)) {
    await Promise.all(
      dataDetails.map(data => {
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            convertDateTimeFormat(value);
          } else if (typeof value === 'object') {
            convertDateTimeFormat(value);
          }
          if (value instanceof Date) {
            data[key] = convertToIST(value);
          }
        });
      })
    );
  } else if (dataDetails !== null && typeof dataDetails === 'object') {
    Object.entries(dataDetails).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        convertDateTimeFormat(value);
      } else if (typeof value === 'object') {
        convertDateTimeFormat(value);
      }
      if (value instanceof Date) {
        dataDetails[key] = convertToIST(value);
      }
    });
  }
}

function encryptData(plainText: string): { initialVector: string; data: string } {
  try {
    const initialVector = randomBytes(16);
    const cipher = createCipheriv(GlobalConfig.CRYPTO_ALGORITHM, GlobalConfig.CRYPTO_SECRET, initialVector);
    const encryptedData = Buffer.concat([cipher.update(plainText), cipher.final()]);
    return {
      initialVector: initialVector.toString('hex'),
      data: encryptedData.toString('hex')
    };
  } catch (error: any) {
    logBackendError(__filename, error?.message || `Unable to encrypt data ${plainText}`, null, null, error?.stack);
    throw httpErrors.InternalServerError(`Unable to process request. Please try again`);
  }
}

function decryptData(cipherText: string, initialVector: string): { data: string } {
  try {
    const decipher = createDecipheriv(
      GlobalConfig.CRYPTO_ALGORITHM,
      GlobalConfig.CRYPTO_SECRET,
      Buffer.from(initialVector, 'hex')
    );
    const decryptedData = Buffer.concat([decipher.update(Buffer.from(cipherText, 'hex')), decipher.final()]);
    return { data: decryptedData.toString() };
  } catch (error: any) {
    logBackendError(__filename, error?.message || `Unable to decrypt data ${cipherText}`, null, null, error?.stack);
    throw httpErrors.InternalServerError(`Unable to process request. Please try again`);
  }
}

async function getTokenExpTime(): Promise<number> {
  // const dayRemainingTime = parseInt(moment.duration(moment().endOf('day')).asMinutes().toString());

  const endOfDay: moment.Moment = moment().endOf('day');
  const dayRemainingTime: number = parseInt(moment.duration(endOfDay.diff(moment())).asMinutes().toString());

  const JWT_ACCESS_TOKEN_EXP_MINS = GlobalConfig.JWT_ACCESS_TOKEN_EXP_MINS;

  if (!JWT_ACCESS_TOKEN_EXP_MINS)
    throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_EXP_MINS]`);

  console.log(JWT_ACCESS_TOKEN_EXP_MINS, dayRemainingTime);
  return JWT_ACCESS_TOKEN_EXP_MINS < dayRemainingTime ? JWT_ACCESS_TOKEN_EXP_MINS : dayRemainingTime;
}

export {
  stringToObjectId,
  objectIdToString,
  compactObject,
  sanitizeUrl,
  configureMetaData,
  logBackendError,
  getFieldsToInclude,
  convertDateTimeFormat,
  convertToIST,
  encryptData,
  decryptData,
  getTokenExpTime,
  arrayPull,
  arrayUnion,
  getMenuSchema,
  getMaxMenuSeqNum,
  getMaxSubMenuSeqNum,
  isValidURL
};
