import mongoose, { Schema, model } from 'mongoose';
const appAgentFilesFolderSchema = new Schema(
    {
        agentId: {
            type: String,
            required: true
        },
        agentFilesFolderName: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const appAgentFilesFolderModel = model('app_agent_files_folder', appAgentFilesFolderSchema);

export { appAgentFilesFolderModel };
