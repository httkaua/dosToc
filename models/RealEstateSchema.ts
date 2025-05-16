import mongoose, { Document, ObjectExpressionOperatorReturningArray, ObjectId, Schema, Types } from "mongoose"

//* TS INTERFACES
export interface IOwner extends Document {
    ownerID: string;
    name: string;
    phoneNumber: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
export interface IRealEstate extends Document {
_id: ObjectId
realStateID: number;
classification?:
'Casa' |
'Terreno' |
'Apartamento' |
'Sobrado' |
'Sítio' |
'Galpão' |
'Studio/Sala comercial';

condominium: {
    block: string,
    internalNumber: string,
    floor: number
},
rentalOrSale?:
'Venda' |
'Aluguel' |
'Ambos';

financial: {
    saleValue: number;
    assessedValue: number;
    financingMaxValue: number;
    exchange: boolean;
    currency: string;
    financeable: boolean;
    tax: boolean;
    taxFrequency?:
    'Único' |
    'Mensal' |
    'Anual';

    taxValue: number;
},

propertySituation?:
'Novo' |
'Usado' |
'Em construção' |
'Reformado' |
'Em reforma';

commercialSituation?:
'Ativo' |
'Inativo' |
'Vendido' |
'Suspenso' |
'Alugado' |
'Permutado';

description?: string,
rooms: {
    bedrooms?: number;
    livingRooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
},

address: {
    locationCode?: string;
    street?: string;
    streetNumber: number;
    complement?: string;
    neighborhood?: string;
    region?: string;
    city?: string;
    state?: string;
    country?: string;
},

landArea: number;
builtUpArea: number;
face?:
'Norte' |
'Nordeste' |
'Leste' |
'Sudeste' |
'Sul' |
'Sudoeste' |
'Oeste' |
'Noroeste' |
'Não identificado';

tags?: string[];
media?: string[];
publish: boolean;
userCreator?: Types.ObjectId;
owner?: Types.ObjectId;
company?: Types.ObjectId;
createdAt: Date;
updatedAt: Date;
enabled: boolean;
}

//* MONGODB SCHEMAS
const ownerSchema = new Schema<IOwner>({
    ownerID: {
        type: String,
        immutable: true,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 50
    },
    phoneNumber: { //* E.164 pattern
        type: String,
        required: true,
        minlength: 8,
        maxlength: 16,
        match: /^\+[0-9]{6,14}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    createdAt: {
        type: Date,
        default: new Date,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: new Date
    }
});

const RealStateSchema = new Schema<IRealEstate>({
    realStateID: {
        type: Number,
        immutable: true,
        unique: true,
        required: true
    },
    classification: {
        type: String,
        enum: [
            'Casa',
            'Terreno',
            'Apartamento',
            'Sobrado',
            'Sítio',
            'Galpão',
            'Studio/Sala comercial'
        ]
    },
    condominium: {
        block: {
            type: String,
            maxlength: 10
        },
        internalNumber: {
            type: String,
            maxlength: 10
        },
        floor: {
            type: Number,
            default: 0,
            min: 0,
            max: 200
        }
    },
    rentalOrSale: {
    type: String,
    enum: [
        'Venda',
        'Aluguel',
        'Ambos'
    ]
    },
    financial: {
        saleValue: {
        type: Number,
        default: 0,
        min: 0,
        max: 99999999
        },
        assessedValue: {
            type: Number,
            default: 0,
            min: 0,
            max: 99999999
        },
        financingMaxValue: {
            type: Number,
            default: 0,
            min: 0,
            max: 99999999
        },
        exchange: {
            type: Boolean,
            default: false
        },
        currency: {
            type: String,
            default: 'BRL',
            maxlength: 10
        },
        financeable: {
            type: Boolean,
            default: true
        },
        tax: {
            type: Boolean,
            default: false
        },
        taxFrequency: {
            type: String,
            enum: [
                'Único',
                'Mensal',
                'Anual'
            ]
        },
        taxValue: {
            type: Number,
            default: 0,
            min: 0,
            max: 99999999
        },
    },

    propertySituation: {
        type: String,
        enum: [
            'Novo',
            'Usado',
            'Em construção',
            'Reformado',
            'Em reforma'
        ]
    },
    commercialSituation: {
        type: String,
        enum: [
            'Ativo',
            'Inativo',
            'Vendido',
            'Suspenso',
            'Alugado',
            'Permutado'
        ]
    },
    description: {
        type: String,
        maxlength: 2000
    },
    rooms: {
        bedrooms: {
        type: Number,
        min: 0,
        max: 100
        },
        livingRooms: {
            type: Number,
            min: 0,
            max: 100
        },
        bathrooms: {
            type: Number,
            min: 0,
            max: 100
        },
        parkingSpaces: {
            type: Number,
            min: 0,
            max: 100
        },
    },

    address: {
        locationCode: {
            type: String,
            maxlength: 20
        },
        street: {
            type: String,
            maxlength: 50
        },
        streetNumber: {
            type: Number,
            default: 0,
            min: 0,
            max: 999999
        },
        complement: {
            type: String,
            maxlength: 50
        },
        neighborhood: {
            type: String,
            maxlength: 50
        },
        region: {
            type: String,
            maxlength: 50
        },
        city: {
            type: String,
            maxlength: 50
        },
        state: {
            type: String,
            maxlength: 50
        },
        country: {
            type: String,
            maxlength: 50
        },
    },

    landArea: {
        type: Number,
        default: 0,
        min: 0,
        max: 99999
    },
    builtUpArea: {
        type: Number,
        default: 0,
        min: 0,
        max: 99999
    },
    face: {
        type: String,
        enum: [
            'Norte',
            'Nordeste',
            'Leste',
            'Sudeste',
            'Sul',
            'Sudoeste',
            'Oeste',
            'Noroeste',
            'Não identificado'
        ]
    },
    tags: { //TODO: Custom tags feature 
        type: [String]
    },
    media: { //* The 0 in array it's the main photo (thumbnail)
        type: [String]
    },
    publish: { //* To publish the real state in a portal
        type: Boolean,
        default: false
    },
    userCreator: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    owner: { //* Owner of the porperty (maybe is the constructor person)
        type: ownerSchema
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'companies'
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
        default: true
    }
});

const RealEstates = mongoose.model<IRealEstate>("realestates", RealStateSchema);
export default RealEstates