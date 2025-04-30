import mongoose from "mongoose"

const companySchema = new mongoose.Schema({
    companyID: {type: Number, required: true, immutable: true, unique: true},
    name: {type: String, required: true, unique: true},
    document: {type: String, required: true, unique: true},
    phone: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    owner: {type: String, required: true},
    supervisors: {type: Array},
    agents: {type: Array},
    realStates: {type: Array},
    locationCode: {type: String},
    street: {type: String},
    streetNumber: {type: String},
    neighborhood: {type: String},
    city: {type: String},
    state: {type: String},
    country: {type: String},
    plan: {
        type: String,
        enum: ['standard', 'full', null]
    },
    createdAt: {type: Date, default: new Date},
    updatedAt: {type: Date, default: new Date},
    hidden: {type: Boolean, default: false}
});

export default mongoose.model('companies', companySchema)