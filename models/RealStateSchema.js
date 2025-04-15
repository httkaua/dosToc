import mongoose from "mongoose"

const ownerSchema = new mongoose.Schema({
    ownerID: {type: String, unique: true, immutable: true, required: true},
    name: {type: String, required: true},
    phoneNumber: {type: Number, required: true},
    email: {type: String},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date}
});

const RealStateSchema = new mongoose.Schema({
    realStateID: {type: Number, immutable: true, unique: true},
    type: {
        type: String,
        enum: ['Casa', 'Terreno', 'Apartamento', 'Sobrado', 'Sítio', 'Galpão', 'Studio/Sala comercial']
    },
    floor: {type: Number, default: 0},
    saleValue: {type: Number, default: 0},
    assessedValue: {type: Number, default: 0},
    financingMaxValue: {type: Number, default: 0},
    exchange: {type: Boolean, default: false},
    rentalOrSale: {
        type: String,
        enum: ['Venda', 'Aluguel', 'Ambos']
    },
    currency: {type: String, default: 'BRL'},
    financeable: {type: Boolean, default: false},
    tax: {type: Boolean, default: false},
    taxFrequency: {
        type: String,
        enum: ['Único', 'Mensal', 'Anual']
    },
    taxValue: {type: Number, default: 0},
    propertySituation: {
        type: String,
        enum: ['Novo', 'Usado', 'Em construção', 'Reformado', 'Em reforma']
    },
    commercialSituation: {
        type: String,
        enum: ['Ativo', 'Inativo', 'Vendido', 'Suspenso', 'Alugado', 'Permutado']
    },
    description: {type: String},
    bedrooms: {type: Number},
    rooms: {type: Number},
    bathrooms: {type: Number},
    parkingSpaces: {type: Number},
    locationCode: {type: String},
    address: {type: String},
    addressNumber: {type: Number, default: 0},
    complement: {type: String},
    neighborhood: {type: String},
    region: {type: String},
    city: {type: String},
    state: {type: String},
    country: {type: String},
    condominium: {type: Boolean, default: false},
    condominiumNumber: {type: Number, default: 0},
    landArea: {type: Number, default: 0},
    builtUpArea: {type: Number, default: 0},
    face: {
        type: String,
        enum: ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste', 'Não identificado']
    },
    tags: {type: Array},
    media: {type: Array},
    publish: {type: Boolean, default: false},
    userCreator: {type: String},
    owner: {type: ownerSchema},
    company: {type: String},
    src: {type: Array},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date},
    hidden: {type: Boolean, default: false}
});

export default mongoose.model("realstates", RealStateSchema);