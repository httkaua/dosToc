import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
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
    managers: {type: Array, required: true},
    underManagement: {type: Array, required: true},
    document: {type: String},
    phone: {type: String, required: true},
    hidden: {type: Boolean, default: false}
})

// Setting the Schema for users collection in mongoDB
export default mongoose.model('users', userSchema);