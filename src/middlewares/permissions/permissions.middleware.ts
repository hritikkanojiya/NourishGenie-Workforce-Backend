//only lets admins access the route
import { NextFunction, Response } from 'express';
import httpErrors from 'http-errors';
import {
  sanitizeUrl,
  stringToObjectId
} from '../../helpers/common/backend.functions';
import { appServiceRouteModel } from '../../models/permissions/service_routes/service_routes.model';
import { RequestType } from '../../helpers/shared/shared.type';
import { Types } from 'mongoose';

const validateRouteAccess = async (req: RequestType, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Sanitize Route
    const requestRoute: string = sanitizeUrl(req.baseUrl + req.route.path);
    // Find route within Collection
    const routeDetails = await appServiceRouteModel.findOne({
      method: req.method,
      path: requestRoute,
      isDeleted: false
    });
    // Validate the route Based on Response
    if (routeDetails) {
      if (routeDetails.secure === true) {
        // Check if Response has Logged In Agent's Access Group ID.
        const isPermitted = routeDetails.appAccessGroupIds.includes(stringToObjectId(req?.payload?.appAccessGroupId) as Types.ObjectId);

        // Terminate Request if request is not Permitted
        if (!isPermitted) throw httpErrors.Forbidden(`Route [${requestRoute}] access not permitted`);
        next();
      } else {
        next();
      }
    } else {
      throw httpErrors.Forbidden(`Route [${requestRoute}] not registered`);
    }
  } catch (error) {
    next(error);
  }
};

export default { validateRouteAccess };
