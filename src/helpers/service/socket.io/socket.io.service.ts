import { appUserModel } from '../../../models/agent/agent.model';
// import { findOne } from '../../../models/permissions/access_group/access_group.model';
import { logBackendError } from '../../common/backend.functions';
import { socketio } from '../../common/init_socket';
// import { ISocket } from '../../shared/backend.interface';
import { appAccessGroupModel } from '../../../models/permissions/access_group/access_group.model';
// import { IAgent } from '../../shared/backend.interface';


const connectedUsers: Record<string, { socketId: string }> = {};

// socket.io stream
socketio.on('connection', async (socket: any) => {
  try {
    const appUserId = socket?.appUser?.payloadData?.appUserId;

    if (!appUserId) {
      throw new Error('Invalid User Details.');
    }

    socket.on('forceLogout', (data: string) => {
      console.log('forceLogout', data);
      socketio.to(connectedUsers[data].socketId).emit('forceLogout');
    });

    // Global Event Emitters
    const __userConnected = async (): Promise<void> => {
      try {
        socketio.emit('agentConnected', await userConnected(socket, appUserId));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    const __userDisconnected = async (reason: string): Promise<void> => {
      try {
        socketio.emit('agentDisconnected', await userDisconnected(socket, reason, appUserId));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    const __connectedUsers = async (): Promise<void> => {
      try {
        socketio.emit('connectedUsers', await getConnectedUser(socket));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    __userConnected();
    __connectedUsers();

    // Global Event Listeners
    socket.on('disconnect', (reason: string) => {
      try {
        __userDisconnected(reason);
        __connectedUsers();
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    });
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      'socket.io => connection',
      socket?.handshake?.address,
      null,
      error?.stack
    );
  }
});

const getConnectedUser = async (socket: any): Promise<any[] | object> => {
  try {
    const connectedAgentIds = Object.keys(connectedUsers);
    const agents: any[] = [];
    await Promise.all(
      connectedAgentIds.map(async (appUserId: string) => {
        try {
          const data = await __getUserDetails(appUserId);
          if (typeof data != 'object') agents.push(data);
          else throw data;
        } catch (error: any) {
          console.error('Error while handling agent connection:', error);
          // send an error message back to the client
          socket.emit('error', error?.message);
        }
      })
    );
    return agents;
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      'socket.io => getconnectedUsers',
      socket?.handshake?.address,
      null,
      error?.stack
    );
    return { error: error?.message };
  }
};

const userConnected = async (socket: any, appUserId: string): Promise<any | object | undefined> => {
  try {
    console.log(`Agent [${appUserId}] Connected with Socket ID [${socket.id}]`);
    connectedUsers[appUserId] = { socketId: socket?.id };
    return await __getUserDetails(appUserId);
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      'socket.io => agentConnected',
      socket?.handshake?.address,
      null,
      error?.stack
    );
    return { error: error.message };
  }
};

const getAppUserConnectionDetails = async (appUserId: string): Promise<object> => {
  try {
    const connectionDetails = connectedUsers[appUserId];
    return connectionDetails ? connectionDetails : {};
  } catch (error: any) {
    logBackendError(__filename, error?.message, 'socket.io => getAgentSocketId', null, null, error?.stack);
    return { error: error.message };
  }
};

const userDisconnected = async (socket: any, _reason: string, appUserId: string): Promise<any | object> => {
  try {
    delete connectedUsers[appUserId];
    console.log(`User [${appUserId}] Disconnected`);
    return await __getUserDetails(appUserId);
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      'socket.io => userDisconnected',
      socket?.handshake?.address,
      null,
      error?.stack
    );
    return { error: error?.message };
  }
};

const forceLogoutUser = (agentConnectionDetails: any): void => {
  if (agentConnectionDetails) {
    socketio.to(agentConnectionDetails?.socketId).emit('forceLogout');
  }
};

// Private methods
const __getUserDetails = (appUserId: string): Promise<any | object> => {
  try {
    return new Promise((resolve, reject) => {
      appUserModel
        .findOne(
          { _id: (appUserId), isDeleted: false },
          {
            __v: 0,
            password: 0,
            isDeleted: 0,
            isNonDeleteAble: 0
          }
        )
        .lean()
        .then((appUser: any) => {
          if (!appUser) {
            return reject(new Error(`Unable to fetch Agent Details [${appUserId}]`));
          }

          appAccessGroupModel
            .findOne({
              _id: appUser?.appAccessGroupId,
              isDeleted: false
            })
            .select({ name: 1, description: 1, isAdministrator: 1 })
            .lean()
            .then((appAccessGroup: any) => {
              if (!appAccessGroup)
                return reject(
                  new Error(`Unable to fetch Agent's Access Group Details [${appUser?.appAccessGroupId}]`)
                );

              appUser.appAccessGroup = {
                appAccessGroupId: appAccessGroup?._id,
                name: appAccessGroup?.name,
                description: appAccessGroup?.description,
                isAdministrator: appAccessGroup?.isAdministrator
              };

              appUser.appUserId = appUser?._id;
              delete appUser?.appAccessGroupId;
              delete appUser?._id;
              return resolve(appUser);
            })
            .catch(error => reject(error));
        })
        .catch((error: any) => reject(error));
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, 'socket.io => __getAgentDetails', null, null, error?.stack);
    return Promise.reject({ error: error?.message });
  }
};

export { getConnectedUser, userConnected, userDisconnected, getAppUserConnectionDetails, forceLogoutUser };
