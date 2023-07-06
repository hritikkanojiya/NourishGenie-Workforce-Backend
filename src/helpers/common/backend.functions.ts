// Common function definitions for the project
import httpErrors from 'http-errors';
import mongoose, { Types } from 'mongoose';
import _ from 'lodash';
import { MetaDataBody } from '../shared/shared.type';
import { LOGGER } from './init_winston';
import moment, { Moment } from 'moment';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { GlobalConfig } from './environment';
import { appMenuModel, appSubMenuModel } from '../../models/permissions/menu/menu.model'
import { AppMenuType } from '../joi/permissions/menu/index';
import fs from 'fs'
import path from 'path';
import { appBackendErrorModel, appEventLogModel } from '../../models/app_logs/app_logs.model';
import { socketio } from './init_socket';

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
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

function sanitizeUrl(url: string): string {
  // Remove Parameters [:id,etc] => i.e (Gives raw route without any Parameters or Query String)
  return (url.split(':')[0].endsWith('/') ? url.split(':')[0] : url).toString().replace(/\/{2,}/g, '/');
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
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

const objectIdToString = (rawData: mongoose.Types.ObjectId[] | mongoose.Types.ObjectId): string => {
  try {
    // const executionType = typeof rawData;
    rawData = Array.isArray(rawData) ? rawData : [rawData];
    const typecastedData = _.map(rawData, data => data.toString());
    return typecastedData[0];
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);

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
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

const arrayPull = (masterArray: string[], valuesToRemove: string[]): string[] => {
  try {
    const executionType = typeof valuesToRemove;
    console.log(executionType);
    valuesToRemove = executionType === 'object' ? valuesToRemove : valuesToRemove;
    return _.without(masterArray, ...valuesToRemove);
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
};

const arrayUnion = (multiDimArray: string[][]): string[] => {
  try {
    return _.union(...multiDimArray);
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
        querySchema?.metaData?.fields?.length > 0
          ? querySchema.metaData.fields
          : []
    };
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

function removeDirectory(directoryPath: string): void {
  try {
    if (!fs.existsSync(directoryPath)) {
      return;
    }
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    }
    fs.rmdirSync(directoryPath);
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
      const errorDetails = new appBackendErrorModel({
        level: level ? level : 'error',
        details: {
          clientAddress,
          errorMessage,
          miscellaneous,
          routePath,
          scriptPath,
        },
      });
      await errorDetails.save().catch((error) => {
        throw error;
      });
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
  try {
    if (Array.isArray(dataDetails)) {
      await Promise.all(
        dataDetails.map(data => {
          Object.entries(data).forEach(async ([key, value]) => {
            if (Array.isArray(value)) {
              await convertDateTimeFormat(value);
            } else if (value != null && typeof value === 'object') {
              await convertDateTimeFormat(value);
            }
            if (value instanceof Date) {
              data[key] = convertToIST(value);
            }
          });
        })
      );
    } else if (dataDetails != null && typeof dataDetails === 'object') {
      Object.entries(dataDetails).forEach(async ([key, value]) => {
        if (Array.isArray(value)) {
          await convertDateTimeFormat(value);
        } else if (value != null && typeof value === 'object') {
          await convertDateTimeFormat(value);
        }
        if (value instanceof Date) {
          dataDetails[key] = convertToIST(value);
        }
      });
    }
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
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
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

async function getTokenExpTime(): Promise<number> {
  // const dayRemainingTime = parseInt(moment.duration(moment().endOf('day')).asMinutes().toString());
  try {
    const endOfDay: moment.Moment = moment().endOf('day');
    const dayRemainingTime: number = parseInt(moment.duration(endOfDay.diff(moment())).asMinutes().toString());

    const JWT_ACCESS_TOKEN_EXP_MINS = GlobalConfig.JWT_ACCESS_TOKEN_EXP_MINS;

    if (!JWT_ACCESS_TOKEN_EXP_MINS)
      throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_EXP_MINS]`);

    // console.log(JWT_ACCESS_TOKEN_EXP_MINS, dayRemainingTime);
    return JWT_ACCESS_TOKEN_EXP_MINS < dayRemainingTime ? JWT_ACCESS_TOKEN_EXP_MINS : dayRemainingTime;

  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }

}


function arrayDifference(masterArray: string[], valuesToCompare: string[][]): Array<string> {
  try {
    return _.difference(masterArray, ...valuesToCompare);
  } catch (error: any) {
    throw httpErrors.UnprocessableEntity(`Unable to process request. Error : ${error?.message}`);
  }
}

function convertTimeToDate(time: string, date: any): Moment {
  // Convert the time to milliseconds
  const timeArr = time.split(':');
  const convertedDate = moment(date).set({
    hour: parseInt(timeArr[0]),
    minute: parseInt(timeArr[1]),
    second: parseInt(timeArr[2])
  });
  return convertedDate;
}


async function calculateTimeSummary(userActivity: any): Promise<any> {
  try {
    const checkInTimes = [];
    const breakInTimes = [];
    const breakOutTimes = [];
    const checkOutTimes = [];
    let totalLoggedInTime = 0;
    let totalBreakTime = 0;

    if (userActivity) {
      for (const iterator of userActivity.activities) {
        if (iterator.activity === 'checkin') {
          checkInTimes.push(iterator.time);
        }
        else if (iterator.activity === 'breakin') {
          breakInTimes.push(iterator.time);
        }
        else if (iterator.activity === 'breakout') {
          breakOutTimes.push(iterator.time);
        }
        else {
          checkOutTimes.push(iterator.time);
        }
      }
      for (let i = 0; i < Math.min(checkInTimes.length, checkOutTimes.length); i++) {
        const checkInTime = convertTimeToDate(checkInTimes[i], userActivity.createdAt);
        const checkOutTime = convertTimeToDate(checkOutTimes[i], userActivity.createdAt);
        totalLoggedInTime += moment.duration(checkOutTime.diff(checkInTime)).asMilliseconds();
      }
      if (checkInTimes.length > checkOutTimes.length) {
        const checkInTime = convertTimeToDate(checkInTimes[checkInTimes.length - 1], userActivity.createdAt);
        const checkOutTime = moment();
        totalLoggedInTime += moment.duration(checkOutTime.diff(checkInTime)).asMilliseconds();
      }

      for (let i = 0; i < Math.min(breakInTimes.length, breakOutTimes.length); i++) {
        const breakInTime = convertTimeToDate(breakInTimes[i], userActivity.createdAt);
        const breakOutTime = convertTimeToDate(breakOutTimes[i], userActivity.createdAt);
        totalBreakTime += moment.duration(breakOutTime.diff(breakInTime)).asMilliseconds();
      }
      if (breakInTimes.length > breakOutTimes.length) {
        const breakInTime = convertTimeToDate(breakInTimes[breakInTimes.length - 1], userActivity.createdAt);
        const breakOutTime = moment();
        totalBreakTime += moment.duration(breakOutTime.diff(breakInTime)).asMilliseconds();
      }
    }
    const totalLoggedInTimeWithoutBreaks = totalLoggedInTime - totalBreakTime;
    return {
      totalLoggedInTime,
      totalBreakTime,
      totalLoggedInTimeWithoutBreaks
    }
  } catch (error: any) {
    throw httpErrors.InternalServerError(error);
  }
}



async function emitSocketEvent(
  appEventId: any,
  eventName: any,
  eventStatus: any,
  eventMessage: any,
  eventTriggeredAt: any,
  metaData = {}
): Promise<void> {
  try {
    const saveEvent: any = (
      await new appEventLogModel({
        appEventId: appEventId,
        name: eventName,
        status: eventStatus,
        message: eventMessage,
        metaData: metaData,
        triggeredAt: eventTriggeredAt,
      }).save()
    ).toObject();

    saveEvent.appEventLogId = saveEvent._id;
    delete saveEvent._id;
    delete saveEvent.__v;
    socketio.emit('appEvent', saveEvent);
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message || `Unable to emit socket data for event [${eventName}]`,
      null,
      null,
      JSON.stringify(metaData)
    );
    return (error);
  }
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
  isValidURL,
  removeDirectory,
  calculateTimeSummary,
  arrayDifference,
  emitSocketEvent

};
