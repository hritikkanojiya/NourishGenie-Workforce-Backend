import { MetaDataResponse } from '../../../../helpers/shared/shared.type';

export interface CreateAppReportingManagerType {
  ReportingManagerId: string;
}

export interface GetAppReportingManagerType {
  metaData: MetaDataResponse;
}

export interface UpdateAppReportingManagerType {
  ReportingManagerId: string;
}

export interface DeleteAppReportingManagerType {
  ReportingManagerId: string;
}
