import { MetaDataResponse } from '../../../shared/shared.type';

export interface CreateAppDesignationType {
  name: string;
  description: string;
}
export interface GetAppDesignationType {
  appDesignationId: string | null;
  search: string | null;
  metaData: MetaDataResponse;
}

export interface DeleteAppDesignationType {
  appDesignationId: string[] | string;
}

export interface UpdateAppDesignationType {
  appDesignationId: string;
  name: string;
  description: string;
}

export interface GetSingleDesignation {
  appDesignationId: string;
}
