import mongoose, { Document, Schema, Types } from "mongoose"

/*
TODO: This collection saves the internal ID, not the ObjectID (recommended),
TODO: then, we can improve that, storing the ObjectID instead or in new fields.
*/

export interface IRecord extends Document {
    recordID: number,
    userWhoChanged: String,
    affectedType:
    'usuário' |
    'imóvel' |
    'empresa' |
    'lead',

    affectedData: String,
    affectedPropertie?: String,
    action:
    'criou' |
    'atualizou' |
    'excluiu' |
    'excluiu*' |
    'retirou',

    category:
    'Imóveis' |
    'Usuários' |
    'Empresas' |
    'Leads' |
    'Equipes',

    oldData?: String, //* FIELD NOT SAVED IN DATABASE
    newData?: String, //* FIELD NOT SAVED IN DATABASE
    message: String,
    company?: String,
    createdAt: Date
}

const recordSchema = new Schema({
    recordID: {
        type: Number,
        required: true,
        unique: true,
        immutable: true
    },
    userWhoChanged: {
        type: String,
        required: true
    },
    affectedType: {
        type: String,
        enum: ['usuário', 'imóvel', 'empresa', 'lead']
    },
    affectedData: { //* internal ID
        type: String,
        required: true
    },
    affectedPropertie: { //* Field name
        type: String
    },
    action: {
        type: String,
        enum: ['criou', 'atualizou', 'excluiu', 'excluiu*', 'retirou'],
        required: true
    },
    category: {
        type: String,
        enum: ['Imóveis', 'Usuários', 'Empresas', 'Leads', 'Equipes'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    company: {
        type: String
    },
    createdAt: {
        type: Date,
        default: new Date,
        required: true,
        immutable: true
    }
});

const Records = mongoose.model<IRecord>('records', recordSchema)
export default Records