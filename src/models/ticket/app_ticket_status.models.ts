import mongoose from 'mongoose';

const statusticketSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
const statusTicketModel = mongoose.model('ticketstatu', statusticketSchema);

// Export model
export default statusTicketModel;