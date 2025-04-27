import mongoose, { Document, Schema } from "mongoose"

interface ICompany extends Document {
    companyID: number;
    name: string;
    document: string;
    phone: string;
    email: string;
    owner: string;
    supervisors?: string[];
    agents?: string[];
    realStates?: string[];
    locationCode?: string;
    street?: string;
    streetNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    plan?: 'standard' | 'full' | null;
    createdAt: Date;
    updatedAt: Date;
    hidden: boolean;
  }

const companySchema = new Schema<ICompany>({
    companyID: {type: Number, required: true, immutable: true, unique: true},
    name: {type: String, required: true, unique: true},
    document: {type: String, required: true, unique: true},
    phone: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    owner: {type: String, required: true},
    supervisors: [String],
    agents: [String],
    realStates: [String],
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

const Companies = mongoose.model<ICompany>('companies', companySchema)
export default Companies