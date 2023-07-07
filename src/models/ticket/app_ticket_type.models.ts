import mongoose from 'mongoose';

const typeticketSchema = new mongoose.Schema(
    {
        name: {
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
const typeTicketModel = mongoose.model('tickettype', typeticketSchema);

// Export model
export default typeTicketModel;