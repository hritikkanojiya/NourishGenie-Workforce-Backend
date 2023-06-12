import { MetaDataResponse } from '../../../shared/shared.type';

export interface CreateAppDepartmentType {
  name: string;
  description: string;
}

export interface GetAppDepartmentType {
  appDepartmentId: string | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface DeleteAppDepartmentType {
  appDepartmentId: string[] | string;
}

export interface UpdateAppDepartmentType {
  appDepartmentId: string;
  name: string;
  description: string;
}

export interface GetSingleDepartment {
  appDepartmentId: string;
}
