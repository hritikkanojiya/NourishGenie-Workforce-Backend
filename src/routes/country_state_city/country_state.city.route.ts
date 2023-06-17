import { Router } from 'express';
import * as jwtModule from '../../middlewares/jwt/jwt.middleware';
import permissionsModule from '../../middlewares/permissions/permissions.middleware';
import * as appCountryStateCityController from '../../controllers/country_state_city/country_state_city.controller'

const appCountryStateCityRouterV1 = Router();

appCountryStateCityRouterV1.get(
    '/get-countries',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appCountryStateCityController.getAllCountries
);

appCountryStateCityRouterV1.post(
    '/get-states',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appCountryStateCityController.getStates
);


appCountryStateCityRouterV1.post(
    '/get-cities',
    jwtModule.verifyAccessToken,
    permissionsModule.validateRouteAccess,
    appCountryStateCityController.getCities
);

export { appCountryStateCityRouterV1 }