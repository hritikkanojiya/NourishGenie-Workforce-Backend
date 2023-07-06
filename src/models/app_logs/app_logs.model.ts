// Import Packages
import { GlobalConfig } from '../../helpers/common/environment';
import mongoose from 'mongoose';

const backendErrorDetailsSchema = new mongoose.Schema({
    clientAddress: {
        type: String,
        default: null,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    miscellaneous: {
        type: String,
        default: null,
    },
    routePath: {
        type: String,
        default: null,
    },
    scriptPath: {
        type: String,
        default: null,
    },
});

const appActivityRequestSchema = new mongoose.Schema({
    remoteAddress: {
        type: String,
        default: null,
    },
    remoteFamily: {
        type: String,
        default: null,
    },
    httpVersion: {
        type: String,
        default: null,
    },
    method: {
        type: String,
        default: null,
    },
    originalUrl: {
        type: String,
        default: null,
    },
    url: {
        type: String,
        default: null,
    },
    path: {
        type: String,
        default: null,
    },
    headers: {
        type: Object,
        default: {},
    },
    body: {
        type: Object,
        default: {},
    },
    params: {
        type: Object,
        default: {},
    },
    query: {
        type: Object,
        default: {},
    },
});

const appActivityResponseSchema = new mongoose.Schema({
    statusCode: {
        type: Number,
        default: null,
    },
    statusMessage: {
        type: String,
        default: null,
    },
    headers: {
        type: Object,
        default: null,
    },
});

const appActivityDetailsSchema = new mongoose.Schema({
    processingTime: {
        type: Number,
        default: null,
    },
    request: {
        type: appActivityRequestSchema,
        default: null,
    },
    response: {
        type: appActivityResponseSchema,
        default: null,
    },
    errorMessage: {
        type: String,
        default: null,
    },
});

// Design Schema
const backendErrorSchema = new mongoose.Schema(
    {
        level: {
            type: String,
            required: true,
            default: 'error',
        },
        details: {
            type: backendErrorDetailsSchema,
            required: true,
        },
        encounteredAt: {
            type: Date,
            default: Date.now(),
            expires: parseInt(GlobalConfig.ERROR_LOG_TTL_IN_SEC) || 604800,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const appActivitySchema = new mongoose.Schema(
    {
        appUserId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        activityDetails: {
            type: appActivityDetailsSchema,
            default: {},
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const appEventSchema = new mongoose.Schema(
    {
        appEventId: {
            type: Number,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            Enum: ['started', 'running', 'suspended', 'completed'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        metaData: {
            type: Object,
            required: true,
        },
        triggeredAt: {
            type: Date,
            required: true,
            default: Date.now(),
            expires: parseInt(GlobalConfig.EVENT_LOG_TTL_IN_SEC) || 604800,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Define Mongoose Model
const appBackendErrorModel = mongoose.model(
    'backend_error',
    backendErrorSchema
);
const appActivityModel = mongoose.model('app_activity_log', appActivitySchema);
const appEventLogModel = mongoose.model('app_event_log', appEventSchema);

// Export model
export {
    appBackendErrorModel,
    appActivityModel,
    appEventLogModel,
};
