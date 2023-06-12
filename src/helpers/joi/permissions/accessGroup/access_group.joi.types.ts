import { MetaDataResponse } from '../../../shared/shared.type';

export interface CreateAppAccessGroupType {
  name: string;
  description: string;
  isAdministrator: boolean;
  isDeleted?: boolean;
}

export interface GetAppAccessGroupType {
  appAccessGroupId: string | null;
  isAdministrator: boolean | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface UpdateAppAccessGroupType {
  appAccessGroupId: string;
  name: string;
  description: string;
  isAdministrator: boolean;
}

export interface DeleteAppAccessGroupType {
  appAccessGroupIds: string[];
}
