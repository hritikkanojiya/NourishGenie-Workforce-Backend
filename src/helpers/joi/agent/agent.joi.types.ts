import { MetaDataResponse } from 'helpers/shared/shared.type';
import mongoose from 'mongoose';


export interface AppUserType {
  _id: mongoose.Types.ObjectId;
  appUserId?: mongoose.Types.ObjectId;
  appUserIdOfDepartment?: string;
  first_name?: string;
  last_name?: string
  email?: string
  password?: string
  appReportingManagerId?: mongoose.Types.ObjectId;
  appAccessGroupId: mongoose.Types.ObjectId;
  appDepartmentId?: mongoose.Types.ObjectId;
  appDesignationId?: mongoose.Types.ObjectId;
  employee_type?: string;
  isDeleted?: string
  isAdminstrator: boolean,
  __v?: number;
  createdAt?: Date;
  isValidPassword?: (plainPassword: string) => Promise<boolean>;
  updatedAt?: Date;
  isAdded?: boolean;
  updateOne?: any;
}

export interface AppUserRegistrationType {
  username: string;
  email: string;
  password: string;
  appAccessGroupId: string;
  isNonDeleteAble: boolean;
  isDeleted: boolean;
}

export interface AppUserLoginType {
  email: string;
  password: string;
}

export interface GetAppUserType {
  appAccessGroupId: string | null;
  search: string | null;
  metaData: MetaDataResponse;
  isDeleted: boolean;
}

export interface AppUserDetailsType {
  appUserId: string;
}

export interface GetAppActivityType {
  appActivityId: string | null;
  appUserId: string | null;
  search: string | null;
  metaData: MetaDataResponse;
  isDeleted: boolean;
}

export interface ResetPassTokenType {
  email: string;
}

export interface VerifyResetPassTokenType {
  token: string;
  secret: string;
}

export interface UpdatePassType {
  token: string;
  secret: string;
  password: string;
  cfmPassword: string;
}

export interface ForceLogoutAppUsersType {
  appUserIds: string[]
}