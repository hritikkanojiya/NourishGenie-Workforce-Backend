import appAgentModel from '../../../models/agent/agent.model';
// import { findOne } from '../../../models/permissions/access_group/access_group.model';
import { logBackendError } from '../../common/backend.functions';
import { socketio } from '../../common/init_socket';
// import { ISocket } from '../../shared/backend.interface';
import appAccessGroupModel from '../../../models/permissions/access_group/access_group.model';
// import { IAgent } from '../../shared/backend.interface';


const connectedAgents: Record<string, { socketId: string }> = {};

// socket.io stream
socketio.on('connection', async (socket: any) => {
  try {
    const appAgentId = socket?.appAgent?.payloadData?.appAgentId;

    if (!appAgentId) {
      throw new Error('Invalid Agent Details.');
    }

    socket.on('forceLogout', (data: string) => {
      console.log('forceLogout', data);
      socketio.to(connectedAgents[data].socketId).emit('forceLogout');
    });

    // Global Event Emitters
    const __agentConnected = async (): Promise<void> => {
      try {
        socketio.emit('agentConnected', await agentConnected(socket, appAgentId));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    const __agentDisconnected = async (reason: string): Promise<void> => {
      try {
        socketio.emit('agentDisconnected', await agentDisconnected(socket, reason, appAgentId));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    const __connectedAgents = async (): Promise<void> => {
      try {
        socketio.emit('connectedAgents', await getConnectedAgents(socket));
      } catch (error: any) {
        console.error('Error while handling agent connection:', error);
        // send an error message back to the client
        socket.emit('error', error?.message);
      }
    };

    __agentConnected();
    __connectedAgents();

    // Global Event Listeners
    socket.on('disconnect', (reason: string) => {
      try {
        __agentDisconnected(reason);
        __connectedAgents();
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

const getConnectedAgents = async (socket: any): Promise<any[] | object> => {
  try {
    const connectedAgentIds = Object.keys(connectedAgents);
    const agents: any[] = [];
    await Promise.all(
      connectedAgentIds.map(async (appAgentId: string) => {
        try {
          const data = await __getAgentDetails(appAgentId);
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
      'socket.io => getConnectedAgents',
      socket?.handshake?.address,
      null,
      error?.stack
    );
    return { error: error?.message };
  }
};

const agentConnected = async (socket: any, appAgentId: string): Promise<any | object | undefined> => {
  try {
    console.log(`Agent [${appAgentId}] Connected with Socket ID [${socket.id}]`);
    connectedAgents[appAgentId] = { socketId: socket?.id };
    return await __getAgentDetails(appAgentId);
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

const getAppAgentConnectionDetails = async (appAgentId: string): Promise<object> => {
  try {
    const connectionDetails = connectedAgents[appAgentId];
    return connectionDetails ? connectionDetails : {};
  } catch (error: any) {
    logBackendError(__filename, error?.message, 'socket.io => getAgentSocketId', null, null, error?.stack);
    return { error: error.message };
  }
};

const agentDisconnected = async (socket: any, _reason: string, appAgentId: string): Promise<any | object> => {
  try {
    delete connectedAgents[appAgentId];
    console.log(`Agent [${appAgentId}] Disconnected`);
    return await __getAgentDetails(appAgentId);
  } catch (error: any) {
    logBackendError(
      __filename,
      error?.message,
      'socket.io => agentDisconnected',
      socket?.handshake?.address,
      null,
      error?.stack
    );
    return { error: error?.message };
  }
};

const forceLogoutAgent = (agentConnectionDetails: any): void => {
  if (agentConnectionDetails) {
    socketio.to(agentConnectionDetails?.socketId).emit('forceLogout');
  }
};

// Private methods
const __getAgentDetails = (appAgentId: string): Promise<any | object> => {
  try {
    return new Promise((resolve, reject) => {
      appAgentModel
        .findOne(
          { _id: (appAgentId), isDeleted: false },
          {
            __v: 0,
            password: 0,
            isDeleted: 0,
            isNonDeleteAble: 0
          }
        )
        .lean()
        .then((appAgent: any) => {
          if (!appAgent) {
            return reject(new Error(`Unable to fetch Agent Details [${appAgentId}]`));
          }

          appAccessGroupModel
            .findOne({
              _id: appAgent?.appAccessGroupId,
              isDeleted: false
            })
            .select({ name: 1, description: 1, isAdministrator: 1 })
            .lean()
            .then((appAccessGroup: any) => {
              if (!appAccessGroup)
                return reject(
                  new Error(`Unable to fetch Agent's Access Group Details [${appAgent?.appAccessGroupId}]`)
                );

              appAgent.appAccessGroup = {
                appAccessGroupId: appAccessGroup?._id,
                name: appAccessGroup?.name,
                description: appAccessGroup?.description,
                isAdministrator: appAccessGroup?.isAdministrator
              };

              appAgent.appAgentId = appAgent?._id;
              delete appAgent?.appAccessGroupId;
              delete appAgent?._id;
              return resolve(appAgent);
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  } catch (error: any) {
    logBackendError(__filename, error?.message, 'socket.io => __getAgentDetails', null, null, error?.stack);
    return Promise.reject({ error: error?.message });
  }
};

export { getConnectedAgents, agentConnected, agentDisconnected, getAppAgentConnectionDetails, forceLogoutAgent };
