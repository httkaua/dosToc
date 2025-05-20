import mongoose, { Document, Schema, Types } from "mongoose"

//* TS INTERFACE
export interface IUser extends Document {
    _id: Types.ObjectId
    userID: number
    name: string
    nameSearch: string
    companies?: Types.ObjectId[]
    email: string
    password: string
    passwordConfirm?: string //* Used in form validation
    createdAt: Date
    updatedAt: Date
    position?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    //* Positions ref: helpers/positionNames

    managers: Types.ObjectId[];
    underManagement: Types.ObjectId[];
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
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    nameSearch: { //* Normalized name for queries
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 50,
        match: /^[A-Z\s]+$/
    },
    companies: [{ //* An user can belong to (or have) one or more companies
        type: Schema.Types.ObjectId,
        ref: 'companies'
    }],
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1000,
        select: false
    },
    position: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7],
        default: 7,
        required: true
    },
    managers: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    underManagement: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
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
