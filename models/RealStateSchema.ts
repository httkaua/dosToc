import mongoose, { Document, Schema, Types } from "mongoose"

// TS INTERFACES
interface IOwner extends Document {
    ownerID: string;
    name: string;
    phoneNumber: number;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
interface IRealstate extends Document {
realStateID: number;
type?: 'Casa' | 'Terreno' | 'Apartamento' | 'Sobrado' | 'Sítio' | 'Galpão' | 'Studio/Sala comercial';
floor: number;
saleValue: number;
assessedValue: number;
financingMaxValue: number;
exchange: boolean;
rentalOrSale?: 'Venda' | 'Aluguel' | 'Ambos';
currency: string;
financeable: boolean;
tax: boolean;
taxFrequency?: 'Único' | 'Mensal' | 'Anual';
taxValue: number;
propertySituation?: 'Novo' | 'Usado' | 'Em construção' | 'Reformado' | 'Em reforma';
commercialSituation?: 'Ativo' | 'Inativo' | 'Vendido' | 'Suspenso' | 'Alugado' | 'Permutado';
description?: string;
bedrooms?: number;
rooms?: number;
bathrooms?: number;
parkingSpaces?: number;
locationCode?: string;
address?: string;
addressNumber: number;
complement?: string;
neighborhood?: string;
region?: string;
city?: string;
state?: string;
country?: string;
condominium: boolean;
condominiumNumber: number;
landArea: number;
builtUpArea: number;
face?: 'Norte' | 'Nordeste' | 'Leste' | 'Sudeste' | 'Sul' | 'Sudoeste' | 'Oeste' | 'Noroeste' | 'Não identificado';
tags?: string[];
media?: string[];
publish: boolean;
userCreator?: string;
owner?: IOwner;
company?: string;
src?: string[];
createdAt: Date;
updatedAt: Date;
hidden: boolean;
}

// MONGODB SCHEMAS
const ownerSchema = new Schema<IOwner>({
    ownerID: {type: String, unique: true, immutable: true, required: true},
    name: {type: String, required: true},
    phoneNumber: {type: Number, required: true},
    email: {type: String},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date}
});

const RealStateSchema = new Schema<IRealstate>({
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
    tags: [String],
    media: [String],
    publish: {type: Boolean, default: false},
    userCreator: {type: String},
    owner: {type: ownerSchema},
    company: {type: String},
    src: [String],
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date},
    hidden: {type: Boolean, default: false}
});

const Realstates = mongoose.model<IRealstate>("realstates", RealStateSchema);
export default Realstates