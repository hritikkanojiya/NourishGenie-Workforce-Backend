import {
    logBackendError,
} from '../../helpers/common/backend.functions';

import { NextFunction, Request, Response } from 'express';
import { appCountryModel } from '../../models/country/country.model'
import { appStateModel } from '../../models/state/state.model';
import {
    joiCountryStateCity,
    GetCitiesSchemaType,
    GetStatesSchemaType
} from '../../helpers/joi/country_state_city/index'
import { appCityModel } from '../../models/city/city.model';

export const getAllCountries = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appCounrties = await appCountryModel.find();
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    counrties: appCounrties,
                    message: 'Countries fetched successfully.',
                },
            });

        }
    } catch (error: any) {
        logBackendError(
            __filename,
            error?.message,
            _req?.originalUrl,
            _req?.ip,
            error?.stack
        );
        next(error);

    }
}

export const getStates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log('deepak');
        const stateDetails: GetStatesSchemaType = await joiCountryStateCity.getStatesSchema.validateAsync(req.body);
        const appStates = await appStateModel.find({ country_id: stateDetails.country_id });
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    states: appStates,
                    message: 'States fetched successfully.',
                },
            });

        }
    } catch (error: any) {
        console.log(error);
        if (error?.isJoi === true) error.status = 422;
        logBackendError(
            __filename,
            error?.message,
            req?.originalUrl,
            req?.ip,
            error?.stack
        );
        next(error);

    }
}

export const getCities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cityDetails: GetCitiesSchemaType = await joiCountryStateCity.getCitiesSchema.validateAsync(req.body);
        const appCities = await appCityModel.find({ state_id: cityDetails.state_id });
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    cities: appCities,
                    message: 'Cities fetched successfully.',
                },
            });

        }
    } catch (error: any) {
        if (error?.isJoi === true) error.status = 422;
        logBackendError(
            __filename,
            error?.message,
            req?.originalUrl,
            req?.ip,
            error?.stack
        );
        next(error);

    }
}