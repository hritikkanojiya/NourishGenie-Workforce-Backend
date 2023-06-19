import { Schema, model } from 'mongoose';

const countrySchema = new Schema({
  countryShortId: {
    type: String
  },
  shortname: {
    type: String,
    require: true
  },
  name: {
    type: String,
    require: true
  }
});

const appCountryModel = model('app_countries', countrySchema);

export { appCountryModel };
