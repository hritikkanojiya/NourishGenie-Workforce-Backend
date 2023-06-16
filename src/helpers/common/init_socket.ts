import express from 'express';
import http from 'http';
const hrModuleBackendApp = express();
const httpServer = http.createServer(hrModuleBackendApp);
import JWT from 'jsonwebtoken';
import httpErrors from 'http-errors';
import { appConstantsModel } from '../../models/constants/constants.model';
const notAuthorized = 'Request not Authorized';

// import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
// import { ISocket } from '../shared/backend.interface';
const socketio: SocketIOServer = new SocketIOServer(httpServer, {
    cors: {
        origin: [process.env.APP_FRONTEND ?? '']
    }
});

socketio.use(async (socket: any, next) => {
    try {
        const SOCKET_TOKEN_HEADER = await appConstantsModel
            .findOne({
                name: 'SOCKET_TOKEN_HEADER',
                isDeleted: false
            })
            .select('value');

        if (!SOCKET_TOKEN_HEADER) throw httpErrors.UnprocessableEntity(`Unable to process Constant [SOCKET_TOKEN_HEADER]`);

        const socketTokenHeader = SOCKET_TOKEN_HEADER.value;
        if (!socket.handshake.headers?.[socketTokenHeader]) {
            throw httpErrors.Unauthorized(notAuthorized);
        }

        const authHeader = socket.handshake.headers?.[socketTokenHeader];
        let bearerToken: string[];
        bearerToken = [];
        if (typeof authHeader == 'string') {
            bearerToken = authHeader?.split(' ');
        }
        const accessToken = bearerToken[1] != undefined ? bearerToken[1] : false;
        const JWT_ACCESS_TOKEN_SECRET = await appConstantsModel
            .findOne({
                name: 'JWT_ACCESS_TOKEN_SECRET',
                isDeleted: false
            })
            .select('value');

        if (!JWT_ACCESS_TOKEN_SECRET)
            throw httpErrors.UnprocessableEntity(`Unable to process Constant [JWT_ACCESS_TOKEN_SECRET]`);

        if (!accessToken) throw httpErrors.Unauthorized(notAuthorized);

        JWT.verify(accessToken, JWT_ACCESS_TOKEN_SECRET.value, (error: any, payload: any) => {
            if (error) {
                throw httpErrors.Unauthorized(notAuthorized);
            }
            socket.appAgent = payload;
            next();
        });
    } catch (error: any) {
        next(error);
    }
});

export { hrModuleBackendApp, httpServer, socketio };
