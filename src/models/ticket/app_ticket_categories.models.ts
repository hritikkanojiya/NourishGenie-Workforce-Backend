import mongoose from 'mongoose';

const categoryticketSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
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
const categoryTicketModel = mongoose.model('ticketcategory', categoryticketSchema);

// Export model
export default categoryTicketModel;