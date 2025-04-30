import mongoose from "mongoose"

const recordSchema = new mongoose.Schema({
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

export default mongoose.model('records', recordSchema);