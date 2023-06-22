import { MetaDataResponse } from 'helpers/shared/shared.type';
import mongoose from 'mongoose';


export interface AppAgentType {
  _id: mongoose.Types.ObjectId;
  appAgentId?: mongoose.Types.ObjectId;
  appAgentIdOfDepartment?: string;
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

export interface AppAgentRegistrationType {
  username: string;
  email: string;
  password: string;
  appAccessGroupId: string;
  isNonDeleteAble: boolean;
  isDeleted: boolean;
}

export interface AppAgentLoginType {
  email: string;
  password: string;
}

export interface GetAppAgentType {
  appAccessGroupId: string | null;
  search: string | null;
  metaData: MetaDataResponse;
  isDeleted: boolean;
}

export interface AppAgentDetailsType {
  appAgentId: string;
}

export interface GetAppActivityType {
  appActivityId: string | null;
  appAgentId: string | null;
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

export interface ForceLogoutAppAgentsType {
  appAgentIds: string[]
}