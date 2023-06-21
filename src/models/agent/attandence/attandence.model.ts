import mongoose, { Schema, model } from 'mongoose';

const appAgentActivitiesLogsSchema = new Schema(
    {
        appAgentId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        check_in: {
            type: Date,
            required: true,
        },
        check_out: {
            type: Date,
            required: true
        },
        isDeleted: {
            type: Boolean,
            required: true
        }

    },
    {
        timestamps: true
    }
)

const appAgentAttandenceSchema = new Schema(
    {
        appAgentId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        work_status: {
            type: String,
            required: true
        },
        present: {
            type: Boolean,
            required: true
        },
        AgentActivityLogs: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const appAgentAttandanceModel = model('app_Agent_attandence', appAgentAttandenceSchema);
const appAgentActivitylogsModel = model('app_Agent_activity_log', appAgentActivitiesLogsSchema);


export {
    appAgentAttandanceModel,
    appAgentActivitylogsModel
};
