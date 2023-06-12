import { MetaDataResponse } from 'helpers/shared/shared.type';

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