import { Schema, model } from 'mongoose'

const citySchema = new Schema(
    {
        cityShortId: {
            type: String
        },
        name: {
            type: String,
            require: true
        },
        state_id: {
            type: String,
            require: true
        }
    }
);

const appCityModel = model('app_cities', citySchema);

export {
    appCityModel
}
