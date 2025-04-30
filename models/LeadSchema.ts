import mongoose, { Document, Schema } from "mongoose";

interface ILeads extends Document {
  leadID: number;
  name: string;
  phone?: string;
  document?: string;
  email?: string;
  sourceCode?: string;
  currentCity?: string;
  currentState?: string;
  currentCountry?: string;
  tags?: string[];
  
  // p == property
  pTypeInterested?: 'Casa' | 'Terreno' | 'Apartamento' | 'Sobrado' | 'Sítio' | 'Galpão' | 'Studio/Sala comercial';
  pCityInterested?: string[];
  pStateInterested?: string[];
  pCountryInterested?: string[];
  condominiumInterested?: string[];
  familyIncome?: number;
  inputValue?: number;
  pMaxValue?: number;
  pMaxMonthlyPortion?: number;
  sourceOfIncome?: 'Desconhecido' | 'Emprego em CLT' | 'Autônomo' | 'Funcionário público' | 'Pró-Labore' | 'Previdência/Aposentadoria' | 'Misto' | 'Outros';
  status?: 'Primeiro contato' | 'Em conversa' | 'Visita marcada' | 'Com restrição' | 'Cliente futuro' | 'Encerrado';
  sourceOfLead?: 'Facebook' | 'Instagram' | 'Internet' | 'Visita à loja' | 'Indicação' | 'Outros';
  observations?: string;
  company?: string;
  responsibleAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  hidden: boolean;
}

const leadSchema = new Schema<ILeads>({
    leadID: {type: Number, required: true, immutable: true, unique: true},
    name: {type: String, required: true},
    phone: {type: String},
    document: {type: String},
    email: {type: String},
    sourceCode: {type: String},
    currentCity: {type: String},
    currentState: {type: String},
    currentCountry: {type: String},
    tags: [String],

    // p == property
    pTypeInterested: {
        type: String,
        enum: ['Casa', 'Terreno', 'Apartamento', 'Sobrado', 'Sítio', 'Galpão', 'Studio/Sala comercial']
    },
    pCityInterested: [String],
    pStateInterested: [String],
    pCountryInterested: [String],
    condominiumInterested: [String],
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
        enum: ['Facebook', 'Instagram', 'Chaves na mão', 'Internet', 'Visita à loja', 'Indicação', 'Outros']
    },
    observations: {type: String},
    company: {type: String},
    responsibleAgent: {type: String},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date},
    hidden: {type: Boolean, default: false}
})

const Leads = mongoose.model<ILeads>('leads', leadSchema);
export default Leads