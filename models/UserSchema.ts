import mongoose, { Document, Schema } from "mongoose"

// TS INTERFACE
export interface IUser extends Document {
    userID: number;
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    position?: 'Diretor de imobiliária' | 'Agente de vendas' | 'Supervisor de vendas' | 'Angariador de imóveis' | 'Administrador do sistema' | 'Criador do sistema' | 'Usuário avulso';
    managers: string[];
    underManagement: string[];
    document?: string;
    phone: string;
    hidden: boolean;
  }
  
// MONGOOSE SCHEMA
const userSchema = new Schema<IUser>({
    userID: {type: Number, required: true, immutable: true, unique: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    company: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    createdAt: {type: Date, default: new Date, immutable: true},
    updatedAt: {type: Date, default: new Date},
    position: {
        type: String,
        enum: ['Diretor de imobiliária', 'Agente de vendas', 'Supervisor de vendas', 'Angariador de imóveis', 'Administrador do sistema', 'Criador do sistema', 'Usuário avulso']
    },
    managers: {type: [String], required: true},
    underManagement: {type: [String], required: true},
    document: {type: String},
    phone: {type: String, required: true},
    hidden: {type: Boolean, default: false}
})

// Setting the Schema for users collection in mongoDB
const Users = mongoose.model<IUser>('users', userSchema)
export default Users
