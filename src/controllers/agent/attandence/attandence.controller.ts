import httpErrors from 'http-errors';
import { NextFunction, Request, Response } from 'express';
import { logBackendError } from '../../../helpers/common/backend.functions';
import {
    CreateAttandenceType,
    joiAppAttandence,
    updateAttandenceType
} from '../../../helpers/joi/agent/attandence/index'
import { appAttandanceModel } from '../../../models/agent/attandence/attandence.model';
import appAgentModel from '../../../models/agent/agent.model';

const createAttandence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const appAttandenceDetails: CreateAttandenceType = await joiAppAttandence.createAppAttandenceSchema.validateAsync(req.body);

        const doesAgentExist = await appAgentModel.findOne({
            _id: appAttandenceDetails.appAgentId,
            isDeleted: false,
        })
        if (!doesAgentExist) throw httpErrors.Conflict(`Agent with id: ${appAttandenceDetails.appAgentId} does not exist`);

        const attandence = new appAttandanceModel({
            appAgentId: appAttandenceDetails.appAgentId,
            availabilty: appAttandenceDetails.availability,
            status: appAttandenceDetails.status,
            date: appAttandenceDetails.date,
            isDeleted: appAttandenceDetails.isDeleted
        })
        const storeAttandenceDetails = (
            await attandence.save({}).catch((error: any) => {
                throw httpErrors.InternalServerError(error.message);
            })
        ).toObject();

        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    appAttandence: storeAttandenceDetails,
                    message: 'Attandence created successfully.'
                }
            });

        }
    }
    catch (error: any) {
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
}

const updateAttandence = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Validate Joi Schema
        const appAttandenceDetails: updateAttandenceType = await joiAppAttandence.updateAppAttandenceSchema.validateAsync(req.body);

        // Check if attandence exist in Collection other than current record
        const doesAttandenceExist = await appAttandanceModel.find({
            _id: { $ne: appAttandenceDetails.appAttandenceId },
            appAgentId: appAttandenceDetails.appAgentId,
            isDeleted: false
        });

        if (doesAttandenceExist?.length > 0) throw httpErrors.Conflict(`Attandence for Agent with id: [${appAttandenceDetails.appAttandenceId}] already exist.`);

        // Update records in Collection
        const appAttandence = await appAttandanceModel.findOne({
            _id: appAttandenceDetails.appAttandenceId,
            isDeleted: false
        }).catch(() => {
            throw httpErrors.UnprocessableEntity(
                `Unable to find Attandence with id ${appAttandenceDetails.appAttandenceId}`
            );
        });

        if (!appAttandence)
            throw httpErrors.UnprocessableEntity(
                `Unable to find Attandence with id ${appAttandenceDetails.appAttandenceId}`
            );

        await appAttandence
            .updateOne(appAttandenceDetails, {
                new: true
            })
            .catch((error: any) => {
                throw httpErrors.UnprocessableEntity(error.message);
            });

        // Send Response
        if (res.headersSent === false) {
            res.status(200).send({
                error: false,
                data: {
                    message: 'Attandence updated successfully.'
                }
            });
        }
    } catch (error: any) {
        logBackendError(__filename, error?.message, req?.originalUrl, req?.ip, error?.stack);
        if (error?.isJoi === true) error.status = 422;
        next(error);
    }
};

export { updateAttandence, createAttandence }
