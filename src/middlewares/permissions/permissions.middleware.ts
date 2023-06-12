//only lets admins access the route
import { NextFunction, Response } from 'express';
import httpErrors from 'http-errors';
import {
  sanitizeUrl,
  stringToObjectId
} from '../../helpers/common/backend.functions';
import appRouteModel from '../../models/permissions/service_routes/service_routes.model';
import { RequestType } from '../../helpers/shared/shared.type';
import { Types } from 'mongoose';

const validateRouteAccess = async (req: RequestType, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Sanitize Route
    const requestRoute: string = sanitizeUrl(req.baseUrl + req.route.path);

    // Find route within Collection
    const routeDetails = await appRouteModel.findOne({
      method: req.method,
      path: requestRoute,
      secure: true,
      isDeleted: false
    });
    // Validate the route Based on Response
    if (routeDetails) {
      // Check if Response has Logged In Agent's Access Group ID.
      const isPermitted: boolean = routeDetails.appAccessGroupIds.includes(
        stringToObjectId(req.payload?.appAccessGroupId) as Types.ObjectId
      );
      // Terminate Request if request is not Permitted
      if (!isPermitted) throw httpErrors.Forbidden(`Route : ${requestRoute} access not permitted`);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default validateRouteAccess;
