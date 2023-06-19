import { Schema, model } from 'mongoose';

const stateSchema = new Schema({
  stateShortId: {
    type: String
  },
  name: {
    type: String,
    require: true
  },
  country_id: {
    type: String,
    require: true
  }
});

const appStateModel = model('app_states', stateSchema);

export { appStateModel };
