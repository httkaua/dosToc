import mongoose from "mongoose"

const leadSchema = new mongoose.Schema({
    leadID: {type: Number, required: true, immutable: true, unique: true},
    name: {type: String, required: true},
    phone: {type: String, required: true, unique: true},
    document: {type: String},
    email: {type: String, required: true, unique: true},
    currentCity: {type: String},
    currentState: {type: String},
    currentCountry: {type: String},
    tags: {type: Array},

    // p == property
    pTypeInterested: {
        type: String,
        enum: ['Casa', 'Terreno', 'Apartamento', 'Sobrado', 'Sítio', 'Galpão', 'Studio/Sala comercial']
    },
    pCityInterested: {type: Array},
    pStateInterested: {type: Array},
    pCountryInterested: {type: Array},
    condominiumInterested: {type: Array},
    familyIncome: {type: Number},
    inputValue: {type: Number},
    pMaxValue: {type: Number},
    pMaxMonthlyPortion: {type: Number},
    sourceOfIncome: {
        type: String,
        enum: ['Desconhecido', 'Emprego em CLT', 'Autônomo', 'Funcionário público', 'Pró-Labore', 'Previdência/Aposentadoria', 'Misto', 'Outros']
    },
    status: {
        type: String,
        enum: ['Primeiro contato', 'Em conversa', 'Visita marcada', 'Com restrição', 'Cliente futuro', 'Encerrado']
    },
    sourceOfLead: {
        type: String,
        enum: ['Facebook', 'Instagram', 'Internet', 'Visita à loja', 'Indicação', 'Outros']
    },
    observations: {type: String},
    company: {type: String},
    responsibleAgent: {type: String},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date},
    hidden: {type: Boolean, default: false}
})

export default mongoose.model('leads', leadSchema);