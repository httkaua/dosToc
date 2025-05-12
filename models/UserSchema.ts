import mongoose, { Document, Mongoose, Schema } from "mongoose"

//* TS INTERFACE
export interface IUser extends Document {
    userID: number;
    firstName: string;
    lastName: string;
    company?: Object;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    position?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
    //* Positions ref: helpers/positionNames

    managers: Object;
    underManagement: Object;
    document?: string;
    phone: string;
    enabled: boolean;
  }
  
//* MONGOOSE SCHEMA
const userSchema = new Schema<IUser>({
    userID: {
        type: Number,
        required: true,
        immutable: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'companies'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    position: {
        type: String,
        enum: [1, 2, 3, 4, 5, 6, 7],
        required: true
    },
    managers: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    underManagement: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    document: {
        type: String,
        maxlength: 20
    },
    phone: { //* E.164 pattern
        type: String,
        required: true,
        minlength: 8,
        maxlength: 16,
        match: /^\+[0-9]{6,14}$/
    },
    createdAt: {
        type: Date,
        default: new Date,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: new Date
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    }
})

//* Setting the Schema for users collection in mongoDB
const Users = mongoose.model<IUser>('users', userSchema)
export default Users
