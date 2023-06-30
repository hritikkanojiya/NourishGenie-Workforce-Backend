import mongoose from 'mongoose';

export interface CreateAppUserSalarySlipType {
    appUserId: mongoose.Types.ObjectId;
    incentive: number;
}