import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILeads extends Document {
    _id: Types.ObjectId
    leadID: number;
    name: string;
    nameSearch: string;
    phone: string;
    document?: string;
    email?: string;
    sourceCode?: string;
    tags?: string[];
    interests: {
        realEstateIT?: Types.ObjectId[],
        typeIT?:
        'Indiferente' |
        'Casa' |
        'Sobrado' |
        'Apartamento' |
        'Chácara' |
        'Terreno' |
        'Studio/Sala comercial' |
        'Galpão' |
        'Outros',
        cityIT?: string[]
    };
    financial: {
        familyIncome?: number;
        inputValue?: number;
        propertyMaxValue?: number;
        propertyMaxMonthlyPortion?: number;
        sourceOfIncome?:
        'Desconhecido' |
        'Emprego em CLT' |
        'Autônomo' |
        'Funcionário público' |
        'Pró-Labore' |
        'Previdência/Aposentadoria' |
        'Misto' |
        'Outros'
    }

    status?:
    'Primeiro contato' |
    'Em conversa' |
    'Visita marcada' |
    'Com restrição' |
    'Cliente futuro' |
    'Encerrado';

    sourceOfLead?:
    'Facebook' |
    'Instagram' |
    'Internet' |
    'Visita à loja' |
    'Indicação' |
    'Outros';

    observations?: string;
    company?: Types.ObjectId;
    responsibleAgent?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    enabled: boolean;
}

const leadSchema = new Schema<ILeads>({
    leadID: {
        type: Number,
        required: true,
        immutable: true,
        unique: true
    },
    name: { //* To be showed for the user
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
    phone: { //* E.164 pattern
        type: String,
        required: true,
        minlength: 8,
        maxlength: 16,
        match: /^\+[0-9]{6,14}$/
    },
    document: {
        type: String,
        maxlength: 20,
    },
    email: {
        type: String,
        trim: true,
        maxlength: 50,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    sourceCode: { //* ID or code of another system
        type: String,
        trim: true,
        maxlength: 16,
    },
    tags: {
        type: [String]
    },
    interests: { //* IT = interested
        realEstateIT: {
            type: Schema.Types.ObjectId,
            ref: 'realestates'
        },
        TypeIT: {
            type: [String],
            enum: [
                'Indiferente',
                'Casa',
                'Sobrado',
                'Apartamento',
                'Chácara',
                'Terreno',
                'Studio/Sala comercial',
                'Galpão',
                'Outros'
            ]
        },
        cityIT: {
            type: [String]
        },
    },

    financial: {
        familyIncome: Number,
        inputValue: Number,
        propertyMaxValue: Number,
        propertyMaxMonthlyPortion: Number,
        sourceOfIncome: {
            type: String,
            enum: [
                'Desconhecido',
                'Emprego em CLT',
                'Autônomo',
                'Funcionário público',
                'Pró-Labore',
                'Previdência/Aposentadoria',
                'Misto',
                'Outros'
            ]
        }
    },

    status: {
        type: String,
        enum: [
            'Primeiro contato',
            'Em conversa',
            'Visita marcada',
            'Com restrição',
            'Cliente futuro',
            'Encerrado'
        ]
    },
    sourceOfLead: {
        type: String,
        enum: [
            'Facebook',
            'Instagram',
            'Chaves na mão',
            'Internet',
            'Visita à loja',
            'Indicação',
            'Outros'
        ]
    },
    observations: {
        type: String,
        maxlength: 2000
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: 'companies'
    },
    responsibleAgent: {
        type: Schema.Types.ObjectId,
        ref: 'users'
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
})

const Leads = mongoose.model<ILeads>('leads', leadSchema);
export default Leads