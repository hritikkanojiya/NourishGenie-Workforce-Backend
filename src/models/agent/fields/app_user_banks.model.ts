import mongoose from 'mongoose';

const AppUserBanksSchema = new mongoose.Schema(
  {
    //foreign key
    appUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppUserSchema'
    },
    account_number: {
      type: Number,
      required: [true, 'must provide a account number'],
      trim: true
    },
    name_as_per_bank: {
      type: String,
      required: [true, 'must provide a name as per bank'],
      trim: true
    },
    bank_name: {
      type: String,
      required: [true, 'must provide a bank name'],
      trim: true
    },
    ifsc_code: {
      type: String,
      required: [true, 'must provide a ifsc code'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('app_agent_banks', AppUserBanksSchema);
