import mongoose, { Document, Schema } from "mongoose"

interface IRecord extends Document {
    recordID: Number,
    userWhoChanged: String,
    affectedType: 'usuário' | 'imóvel' | 'empresa' | 'lead',
    affectedData: String,
    affectedPropertie: String,
    action: 'criou' | 'atualizou' | 'excluiu' | 'excluiu*' | 'retirou',
    category: 'Imóveis' | 'Usuários' | 'Empresas' | 'Leads' | 'Equipes',
    message: String,
    company: String,
    createdAt: Date,
    hidden: Boolean
}

const recordSchema = new Schema({
    recordID: {type: Number, required: true, unique: true, immutable: true},
    userWhoChanged: {type: String, required: true},
    affectedType: {
        type: String,
        enum: ['usuário', 'imóvel', 'empresa', 'lead']
    },
    affectedData: {type: String, required: true}, // ID
    affectedPropertie: {type: String}, // Propriedade alterada
    action: {
        type: String,
        enum: ['criou', 'atualizou', 'excluiu', 'excluiu*', 'retirou']
    },
    category: {
        type: String,
        enum: ['Imóveis', 'Usuários', 'Empresas', 'Leads', 'Equipes']
    },
    message: {type: String},
    company: {type: String},
    createdAt: {type: Date, default: new Date, required: true, immutable: true},
    hidden: {type: Boolean, default: false}
});

const Records = mongoose.model<IRecord>('records', recordSchema)
export default Records