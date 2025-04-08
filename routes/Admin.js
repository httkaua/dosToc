import express from "express"
const router = express.Router();
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import passport from "passport"

/* separated in 2 lines because in es6 are sending
error with both in the same line */
import { ensureAuthenticated } from "../helpers/Auth"
import { ensureRole } from "../helpers/Auth"
import positionsI from "../helpers/positionsI"
import { createRecord } from "../helpers/newRecord"
// changed: { create: uploadMedia } to { uploadMedia }
import { uploadMedia } from "../helpers/uploadMedia"
import upload from "../helpers/Multer"

import "../models/CompanySchema"
import "../models/UserSchema"
import "../models/RecordsSchema"
import "../models/RealStateSchema"
import "../models/LeadSchema"

const Companies = mongoose.model('companies');
const Users = mongoose.model('users');
const Records = mongoose.model('records');
const RealStates = mongoose.model('realstates');
const Leads = mongoose.model('leads');

router.get('/',
    ensureAuthenticated,
    async (req, res, next) => {
    res.render('admin/home');
});


// ROUTES TYPE: Records / Histórico
router.get('/records',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3].map(i => positionsI[i])),
    async (req, res, next) => {

    // format date from ISO to DD/MM/YY - HH/MM/SS
    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
        const year = String(date.getFullYear()).slice(-2);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    };

    try {

        const allRecords = await Records.find().sort({ createdAt: -1 });

        const formattedRecords = allRecords.map(record => ({
            ...record._doc,
            createdAt: formatDate(record.createdAt),
            created: record.action === 'criou', //booleans below
            updated: record.action === 'atualizou',
            deleted: record.action === 'excluiu',
            hidded: record.action === 'excluiu*'
        }));

        res.render('admin/records', { records: formattedRecords });

    } catch (err) {

        req.flash('errorMsg', `Houve um erro ao encontrar os dados: ${err}`)
        res.status(500).send('Erro ao buscar os registros');

    }
});


// ROUTES TYPE: Account / Conta
router.get('/my-account/:userID',
    ensureAuthenticated,
    async (req, res, next) => {
    res.render('admin/my-account');
});

router.post('/my-account/:userID/update',
    ensureAuthenticated,
    async (req, res, user) => {
    
    const userID = parseInt(req.params.userID, 10);
    try {
        const userUp = await Users.findOne({ userID: userID });
  
        if (!userUp) {
          req.flash('errorMsg', 'Lead não encontrado.');
          return res.redirect('./');
        }
  
        const updatedData = req.body;
        const originalData = userUp.toObject();
  
        const { updatedAt, ...originalDataWithoutUpdatedAt } = originalData;
  
        const normalizeToString = (value) => {
          if (value === undefined || value === null || value === '') return '';
          if (Array.isArray(value)) return value.sort().join(',');
          return value.toString();
        };
  
        const changedFields = {};
        const oldFields = {};
  
        Object.keys(updatedData).forEach((key) => {
          const updatedValue = normalizeToString(updatedData[key]);
          const originalValue = normalizeToString(originalDataWithoutUpdatedAt[key]);
  
          if (updatedValue !== originalValue) {
            changedFields[key] = updatedData[key];
            oldFields[key] = originalDataWithoutUpdatedAt[key];
          }
        });

        // If fields are changed (need save)
        if (Object.keys(changedFields).length > 0) {
            Object.assign(userUp, changedFields);
            userUp.updatedAt = new Date();
            
            await userUp.save()
            .then(async() => {
                for (const key of Object.keys(changedFields)) {
                    
                    const recordInfo = {
                        userWhoChanged: req.user.userID,
                        affectedType: 'usuário',
                        affectedData: req.user.userID,
                        affectedPropertie: key,
                        oldData: oldFields[key] !== undefined ? `"${oldFields[key]}"` : "",
                        newData: changedFields[key] !== undefined ? `"${changedFields[key]}"` : "",
                        action: 'atualizou',
                        category: 'Usuários',
                        company: req.user.company
                    }

                    await createRecord(recordInfo)
                }

                req.flash('successMsg', `Dados da conta atualizados com sucesso!`)
            })
            .catch((err) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
            })
        }
        else {
            req.flash('successMsg', 'Nenhum campo foi alterado.')
        }

        res.redirect('./');

    } catch (error) {
        console.error(error);
        res.status(500).send('Erro no servidor.');
    }

});


// ROUTES TYPE: Company / Empresa
router.get('/company',
    ensureAuthenticated,
    ensureRole([0, 1, 2].map(i => positionsI[i])),
    async (req, res, next) => {

    async function searchCompanyByUser() {
        const userOwner = req.user.userID;

        const userCompany = await Companies.findOne({ owner: userOwner }) || null
        return userCompany
    }

    const company = await searchCompanyByUser()

    res.render('admin/company', { company: company })
});

router.post('/newcompany',
    ensureAuthenticated,
    ensureRole([0, 1, 2].map(i => positionsI[i])),
    async (req, res, next) => {

    // Generating new company ID
    const generateNewCompanyID = async () => {
        try {

        const latestCompany = await Companies.findOne().sort({ companyID: -1 }).exec();
        const newID = latestCompany && latestCompany.companyID 
            ? parseInt(latestCompany.companyID, 10) + 1 
            : 40000;
        return newID;

        } catch (error) {
        console.error('Erro ao gerar novo userID:', error);
        throw error;
        }
    };

    // Validations below

    const newCpErrors = [];

    const fields = {
        cpName: req.body.claimantCpName,
        cpDocument: req.body.claimantCpDocument,
        phone: req.body.claimantPhone,
        email: req.body.claimantCpEmail,
        location: req.body.claimantCpLocation,
        street: req.body.claimantCpStreet,
        stNumber: req.body.claimantCpStreetNumber,
        nhood: req.body.claimantCpNeighborhood,
        city: req.body.claimantCpCity,
        state: req.body.claimantCpState,
        country: req.body.claimantCpCountry,
    };
    
    const errors = {
        undefined: Object.entries(fields).some(([key, value]) => value == undefined),
        null: Object.entries(fields).some(([key, value]) => value == null),
        empty: Object.entries(fields).some(([key, value]) => !value),
    };
    
    if (errors.undefined) {
        newCpErrors.push({ text: 'Erro 1004 - Campos indefinidos. Preencha todos os campos corretamente.' });
    }
    
    if (errors.null) {
        newCpErrors.push({ text: 'Erro 1005 - Campos nulos. Preencha todos os campos corretamente.' });
    }
    
    if (errors.empty) {
        newCpErrors.push({ text: 'Erro 1006 - Campos vazios. Preencha todos os campos corretamente.' });
    }
    

    // If it got some error
    if (newCpErrors.length > 0) {
        const errorMessages = newCpErrors.map(error => error.text);
        req.flash('errorMsg', errorMessages[0]); // passar um erro por vez
        res.redirect('company');
        return;
    }

    // Any error in the HTML Form
    else {

        // Email already used.
        if (await Companies.findOne({ email: fields.email })) {

            req.flash('errorMsg', 'Erro 1009 - Este e-mail já está sendo usado.')
            return res.redirect('company')
        }

        // Allright, creating account in the database

        else {

            const newCp = new Companies({
                companyID: await generateNewCompanyID(),
                name: fields.cpName,
                document: fields.cpDocument,
                phone: fields.phone,
                email: fields.email,
                owner: req.user.userID,
                supervisors: [],
                agents: [],
                realStates: [],
                locationCode: fields.location,
                street: fields.street,
                streetNumber: fields.stNumber,
                neighborhood: fields.nhood,
                city: fields.city,
                state: fields.state,
                country: fields.country,
                plan: null,
                createdAt: new Date,
                updatedAt: new Date
            });

            newCp.save()
            .then(async () => {

                // Adding to records
                try {
                    const recordInfo = {
                        userWhoChanged: newCp.owner,
                        affectedType: "empresa",
                        affectedData: newCp.companyID,
                        action: "criou",
                        category: "Empresas",
                        company: newCp.companyID
                    }

                    await createRecord(recordInfo);

                } catch (err) {
                    req.flash('errorMsg', `Erro ao criar registro em histórico: ${err}`);
                }

                return res.redirect('company');
            })
            .catch((err) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                return res.redirect('company');
            });

        }
        
    }

});


// ROUTES TYPE: Team / Group / Equipe
router.get('/team',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3].map(i => positionsI[i])),
    async (req, res, next) => {
        try {
            const members = [];
            const teamMembers = req.user.underManagement;

            for (let i = 0; i < teamMembers.length; i++) {
                const element = teamMembers[i];
                
                const pick = await Users.findOne({ userID: element });

                const member = {
                    id: pick.userID,
                    name: `${pick.firstName} ${pick.lastName}`,
                    position: pick.position
                };

                members.push(member);
            }

            res.render('admin/team', { members });

        } catch (err) {
            req.flash('errorMsg', `Houve um erro ao buscar os dados: ${err}`);
            res.redirect('./');
        }
});

router.get('/team/new-member',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3].map(i => positionsI[i])),
    async (req, res, next) => {

        async function verifyOptions(req) {

            const userPosition = String(req.user.position);

            if (['Criador do sistema',
                'Administrador do sistema',
                'Diretor de imobiliária']
                .includes(userPosition)) {
                return ['Supervisor de vendas', 'Agente de vendas'];
            }
        
            if (userPosition == 'Supervisor de vendas') {
                return ['Agente de vendas'];
            }
        
            return [];
        }

        try {
            const positionsO = await verifyOptions(req);

            res.render('admin/team/new-member', {
                positions: positionsO
            });
        } catch (err) {
            req.flash('errorMsg', 'Houve um erro ao verificar as opções')
            res.redirect('./')
        }
});

router.post('/team/new-member/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3].map(i => positionsI[i])),
    async (req, res, next) => {

        const newMemberErr = [];

        const fields = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            position: req.body.position,
            phone: req.body.phone,
            email: req.body.email,
            password: req.body.password
        };

        async function findEmail(email) {
            try {
                const boolUser = await Users.findOne({email: email})
                return !!boolUser
            } catch (err) {
                throw new Error(`There was an error parsing email: ${err.message}`);
            }
        }

        // Generating new userID for claimant
        const generateNewUserID = async () => {
            try {

            const latestUser = await Users.findOne().sort({ userID: -1 }).exec();
            const newID = latestUser && latestUser.userID 
                ? parseInt(latestUser.userID, 10) + 1 
                : 20000;
            return newID;

            } catch (error) {
            console.error('Erro ao gerar novo userID:', error);
            throw error;
            }
        };

        // Update the current user team
        async function updateTeam(recordInfo) {
            
            let currentUser = await Users.findOne({ userID: recordInfo.userWhoChanged });

            const i = currentUser.underManagement.length
            const newTeamMember = recordInfo.affectedData;

            currentUser.underManagement[i] = newTeamMember
            currentUser.updatedAt = new Date;
    
            currentUser.save()
            .then(async () => {
                req.flash('successMsg', 'Usuário adicionado a equipe com sucesso!')})
            .catch((err) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
            })
        }

        const errors = {
            undefined: Object.entries(fields).some(([key, value]) => value === undefined),
            null: Object.entries(fields).some(([key, value]) => value === null),
            empty: Object.entries(fields).some(([key, value]) => !value),
        };

        if (errors.undefined) {
            newMemberErr.push({ text: 'Erro 1004 - Campos indefinidos. Preencha todos os campos corretamente.' });
        }

        if (errors.null) {
            newMemberErr.push({ text: 'Erro 1005 - Campos nulos. Preencha todos os campos corretamente.' });
        }

        if (errors.empty) {
            newMemberErr.push({ text: 'Erro 1006 - Campos vazios. Preencha todos os campos corretamente.' });
        }

        // If it got some error
        if (newMemberErr.length > 0) {
            const errorMessages = newMemberErr.map(error => error.text);
            req.flash('errorMsg', errorMessages[0]);
            res.redirect('./');
            return;
        }

        // Any error in the HTML Form
        else {

            // Email already used.
            if (await findEmail(fields.email) == true) {

                req.flash('errorMsg', 'Erro 1009 - Este e-mail já está sendo usado.')
                return res.redirect('./')
            }

            // Allright, creating account in the database

            else {

                const newAcc = new Users({
                    userID: await generateNewUserID(),
                    firstName: fields.firstName,
                    lastName: fields.lastName,
                    phone: fields.phone,
                    company: req.user.company,
                    email: fields.email,
                    position: fields.position,
                    managers: req.user.userID,
                    createdAt: new Date,
                    updatedAt: new Date
                });

                // generating hash
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        req.flash('errorMsg', `Erro 3004 - Houve um erro ao gerar SALT: ${err}`)
                        res.redirect('./');
                    }

                    bcrypt.hash(fields.password, salt, (err, hash) => {
                        if (err) {
                            req.flash(`errorMsg', 'Erro 3005 - Houve um erro ao gerar HASH: ${err}`)
                            return res.redirect('./');
                        };

                        newAcc.password = hash;

                        newAcc.save()
                        .then(async () => {
                            req.flash('successMsg', 'Usuário criado com sucesso!');

                                // Complementary processes
                                try {
                                    const recordInfo = {
                                        userWhoChanged: newAcc.managers[0].toString(),
                                        affectedType: "usuário",
                                        affectedData: newAcc.userID,
                                        action: "criou",
                                        category: "Usuários",
                                        company: newAcc.company
                                    }

                                    await createRecord(recordInfo);

                                    // Updating team
                                    await updateTeam(recordInfo);

                                } catch (err) {
                                    req.flash('errorMsg', `Erro ao criar registro em histórico: ${err}`)
                                }

                            return res.redirect('../');
                        })
                        .catch((err) => {
                            req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                            return res.redirect('./');
                        });
                    });
                });
            };
        };
});

router.get('/team/:userID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, user) => {

        try {

            // Manager user
            const dataToHidden = await Users.findOne({ userID: req.user.userID });

            const userToPop = req.params.userID

            const underManagement = dataToHidden.underManagement

            underManagement.pop(userToPop)

            if (!dataToHidden) {
                req.flash('errorMsg', `Lead ${leadID} não encontrado.`);
            }

            await dataToHidden.save()
            .then(async () => {

                const recordInfo = {
                    userWhoChanged: req.user.userID,
                    affectedType: 'usuário',
                    affectedData: userToPop,
                    action: 'retirou',
                    category: 'Equipes',
                    company: req.user.company
                }

                await createRecord(recordInfo);

                req.flash('successMsg', `membro da equipe excluído com sucesso.`)

            })
            .catch((err) => {
                req.flash('errorMsg', `Não foi possível excluir o membro: ${err}`)
            })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('../')
    }
);


// ROUTES TYPE: Leads / Customers / Clientes
router.get('/leads',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {

    async function searchLeads(req) {
        try {
            const userR = req.user.userID;
            
            const leads = await Leads.find({ responsibleAgent: userR }).exec();

            const visibleLeads = leads.filter(lead => !lead.hidden);
            
            const formattedLeads = visibleLeads.map(lead => ({
                id: lead.leadID,
                name: lead.name,
                phone: lead.phone,
                status: lead.status
            }));
            
            return formattedLeads;
        } catch (err) {
            console.error(`Houve um erro ao buscar os dados: ${err}`);
            throw err;
        }
    }

    const leadsByUser = await searchLeads(req);

    res.render('admin/leads', { lead: leadsByUser })
});

router.get('/leads/new-lead',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {
        
    res.render('admin/leads/new-lead')
});

router.post('/leads/new-lead/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {
        
    // Generating new company ID
    const generateNewLeadID = async () => {
        try {

        const latestLead = await Leads.findOne().sort({ leadID: -1 }).exec();
        const newID = latestLead && latestLead.leadID 
            ? parseInt(latestLead.leadID, 10) + 1 
            : 50000;
        return newID;

        } catch (error) {
        console.error('Erro ao gerar novo leadID:', error);
        throw error;
        }
    };

    // Validations below

    const newLeadErrors = [];

    const fields = {
        name: req.body.name,
        document: req.body.document,
        phone: req.body.phone,
        email: req.body.email,
        pTypeInterested: req.body.pTypeInterested,
        currentCity: req.body.currentCity,
        currentState: req.body.currentState,
        currentCountry: req.body.currentCountry,
        pCityInterested: req.body.pCityInterested,
        pStateInterested: req.body.pStateInterested,
        pCountryInterested: req.body.pCountryInterested,
        condominiumInterested: req.body.condominiumInterested,
        familyIncome: req.body.familyIncome,
        inputValue: req.body.inputValue,
        pMaxValue: req.body.pMaxValue,
        pMaxMonthlyPortion: req.body.pMaxMonthlyPortion,
        sourceOfIncome: req.body.sourceOfIncome,
        status: req.body.status,
        sourceOfLead: req.body.sourceOfLead,
        observations: req.body.observations
    };
    
    const errors = {
        undefined: Object.entries(fields).some(([key, value]) => value == undefined),
        null: Object.entries(fields).some(([key, value]) => value == null)
    };
    
    if (errors.undefined) {
        newLeadErrors.push({ text: 'Erro 1004 - Campos indefinidos. Preencha todos os campos corretamente.' });
    }
    
    if (errors.null) {
        newLeadErrors.push({ text: 'Erro 1005 - Campos nulos. Preencha todos os campos corretamente.' });
    }
    
    if (errors.empty) {
        newLeadErrors.push({ text: 'Erro 1006 - Campos vazios. Preencha todos os campos corretamente.' });
    }
    

    // If it got some error
    if (newLeadErrors.length > 0) {
        const errorMessages = newLeadErrors.map(error => error.text);
        req.flash('errorMsg', errorMessages[0]);
        res.redirect('./');
        return;
    }

    // Any error in the HTML Form
    else {

        // Email already used.
        if (await Leads.findOne({ email: fields.email })) {
            req.flash('errorMsg', `Erro 1009 - Este e-mail já está ocupado.`)
            return res.redirect('./')
        }

        if (await Leads.findOne({ phone: fields.phone })) {
            req.flash('errorMsg', `Erro 1009 - Este telefone já está ocupado.`)
            return res.redirect('./')
        }

        // Allright, creating account in the database

        else {

            const newLead = new Leads({
                leadID: await generateNewLeadID(),
                name: fields.name,
                phone: fields.phone,
                document: fields.document,
                email: fields.email,
                currentCity: fields.currentCity,
                currentState: fields.currentState,
                currentCountry: fields.currentCountry,
                tags: [],
                pTypeInterested: fields.pTypeInterested,
                pCityInterested: fields.pCityInterested,
                pStateInterested: fields.pStateInterested,
                pCountryInterested: fields.pCountryInterested,
                condominiumInterested: fields.condominiumInterested,
                familyIncome: fields.familyIncome,
                inputValue: fields.inputValue,
                pMaxValue: fields.pMaxValue,
                pMaxMonthlyPortion: fields.pMaxMonthlyPortion,
                sourceOfIncome: fields.sourceOfIncome,
                status: fields.status,
                sourceOfLead: fields.sourceOfLead,
                observations: fields.observations,
                company: req.user.company,
                responsibleAgent: req.user.userID,
                createdAt: new Date,
                updatedAt: new Date
            });

            newLead.save()
            .then(async () => {
                req.flash('successMsg', 'Lead criado com sucesso!');

                // Adding to records
                try {

                    const recordInfo = {
                        userWhoChanged: newLead.responsibleAgent,
                        affectedType: "lead",
                        affectedData: newLead.leadID,
                        action: "criou",
                        category: "Leads",
                        company: newLead.company
                    }

                    await createRecord(recordInfo);

                }
                catch (err) {
                    req.flash('errorMsg', `Houve um erro ao criar o registro em histórico: ${err}`)
                }

                res.redirect('../');

            })
            .catch((err) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                res.redirect('../');
            });

        }
        
    }
    
});

router.get('/leads/:leadID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {
        try {
            const leadID = req.params.leadID;

            const lead = await Leads.findOne({ leadID: leadID });

            if (!lead) {
                req.flash(`Lead não encontrado em sua base.`);
                res.redirect('./');
            }

            res.render('admin/leads/leadinfo', { lead });

        } catch (err) {
            req.flash(`Houve um erro interno no servidor ao buscar o lead: ${err}`);
            res.redirect('./')
        }
    }
);

router.post('/leads/:leadID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, user) => {
      const leadID = parseInt(req.params.leadID, 10);
  
      try {
        const lead = await Leads.findOne({ leadID: leadID });
  
        if (!lead) {
          req.flash('errorMsg', 'Lead não encontrado.');
          return res.redirect('./');
        }
  
        const updatedData = req.body;
        const originalData = lead.toObject();
  
        const { updatedAt, ...originalDataWithoutUpdatedAt } = originalData;
  
        const normalizeToString = (value) => {
          if (value === undefined || value === null || value === '') return '';
          if (Array.isArray(value)) return value.sort().join(',');
          return value.toString();
        };
  
        const changedFields = {};
        const oldFields = {};
  
        Object.keys(updatedData).forEach((key) => {
          const updatedValue = normalizeToString(updatedData[key]);
          const originalValue = normalizeToString(originalDataWithoutUpdatedAt[key]);
  
          if (updatedValue !== originalValue) {
            changedFields[key] = updatedData[key];
            oldFields[key] = originalDataWithoutUpdatedAt[key];
          }
        });
  
        // Salvar mudanças, se houver
        if (Object.keys(changedFields).length > 0) {
          Object.assign(lead, changedFields);
          lead.updatedAt = new Date();
  
          await lead.save();

          for (const key of Object.keys(changedFields)) {
            const oldLeadData = oldFields[key];
            const newLeadData = changedFields[key];
        
            const recordInfo = {
                userWhoChanged: req.user.userID,
                affectedType: "lead",
                affectedData: leadID,
                action: "atualizou",
                affectedPropertie: key,
                oldData: oldLeadData !== undefined ? `"${oldLeadData}"` : "",
                newData: newLeadData !== undefined ? `"${newLeadData}"` : "",
                category: "Leads",
                company: req.user.company
            };
        
            await createRecord(recordInfo);
        }
  
          req.flash('successMsg', 'Lead atualizado com sucesso!');
        } else {
          req.flash('successMsg', 'Nenhum campo foi alterado.');
        }
  
        res.redirect('../');
      } catch (err) {
        req.flash('errorMsg', `Erro no servidor: ${err}`);
        res.redirect('./');
      }
    }
);

router.get('/leads/:leadID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, user) => {

        const leadID = req.params.leadID;

        try {
            const dataToHidden = await Leads.findOne({ leadID: leadID });

            dataToHidden.hidden = true;

            if (!dataToHidden) {
                req.flash('errorMsg', `Lead ${leadID} não encontrado.`);
            }

            await dataToHidden.save()
            .then(async () => {

                const recordInfo = {
                    userWhoChanged: req.user.userID,
                    affectedType: 'lead',
                    affectedData: leadID,
                    action: 'excluiu*',
                    category: 'Leads',
                    company: req.user.company
                }

                await createRecord(recordInfo);

                req.flash('successMsg', `Lead excluído com sucesso.`)

            })
            .catch((err) => {
                req.flash('errorMsg', `Não foi possível excluir o lead: ${err}`)
            })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('../')
    }
);


// ROUTES TYPE: Real States / Properties / Imóveis
router.get('/real-states',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {

        try {
            const userCompany = req.user.company;
            
            const realStates = await RealStates.find({ company: userCompany }).exec();

            const visibleRealStates = realStates.filter(realstate => !realstate.hidden);
            
            const formattedRealStates = visibleRealStates.map(realstate => ({
                src: realstate.src[0],
                id: realstate.realStateID,
                type: realstate.type,
                rooms: realstate.rooms,
                neighborhood: realstate.neighborhood,
                city: realstate.city,
                saleValue: realstate.saleValue
            }));

            res.render('admin/realStates/real-states', { property: formattedRealStates });

        } catch (err) {
            console.error(`Houve um erro ao buscar os dados: ${err}`);
            next(err);
        }
    }
);

router.get('/real-states/new-real-state',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {
        res.render('admin/realStates/new-real-state')
    }
);

router.post('/real-states/new-real-state/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    upload.single("uploaded_file"),
    async (req, res, next) => {

        const generateNewRealStateID = async () => {
            try {
    
            const latestRealState = await RealStates.findOne().sort({ realStateID: -1 }).exec();
            const newID = latestRealState && latestRealState.realStateID 
                ? parseInt(latestRealState.realStateID, 10) + 1 
                : 60000;
            return newID;
    
            } catch (error) {
            console.error('Erro ao gerar novo realStateID:', error);
            throw error;
            }
        };
    
        const generateNewOwnerID = async () => {
            try {
    
            const latestOwner = await RealStates.findOne().sort({ "owner.ownerID": -1 }).exec();
            const newID = latestOwner && latestOwner.owner.ownerID 
                ? parseInt(latestOwner.owner.ownerID, 10) + 1 
                : 70000;
            return newID;
    
            } catch (error) {
            console.error('Erro ao gerar novo ownerID:', error);
            throw error;
            }
        };

        const newLeadErrors = [];

        const fields = req.body;
        
        const errors = {
            undefined: Object.entries(fields).some(([key, value]) => value == undefined),
            null: Object.entries(fields).some(([key, value]) => value == null)
        };
        
        if (errors.undefined) {
            newLeadErrors.push({ text: 'Erro 1004 - Campos indefinidos. Preencha todos os campos corretamente.' });
        }
        
        if (errors.null) {
            newLeadErrors.push({ text: 'Erro 1005 - Campos nulos. Preencha todos os campos corretamente.' });
        }
        
        if (newLeadErrors.length > 0) {
            req.flash('errorMsg', newLeadErrors[0].text);
            return res.redirect('./');
        }

        const propertyOwner = {
            ownerID: await generateNewOwnerID(),
            name: req.body.name.trim(),
            phoneNumber: Number(req.body.phoneNumber),
            email: req.body.email.trim(),
            updatedAt: new Date(),
            createdAt: new Date()
        };

        const { name, phoneNumber, email, ...fieldsWithoutOwner } = fields;
        const newRealState = new RealStates(fieldsWithoutOwner);
        newRealState.src = [];

        try {
            await uploadMedia(req.file, newRealState);
        } catch (err) {
            console.error('Erro ao acessar uploadMedia:', err);
            req.flash('errorMsg', `Erro ao salvar imagem: ${err.message}`);
            return res.redirect('./');
        }

        newRealState.owner = propertyOwner;
        newRealState.realStateID = await generateNewRealStateID();
        newRealState.tags = [];
        newRealState.company = req.user.company;
        newRealState.responsibleAgent = req.user.userID;
        newRealState.createdAt = new Date();
        newRealState.updatedAt = new Date();

        try {
            await newRealState.save();
            req.flash('successMsg', 'Imóvel cadastrado com sucesso!');
    
            const recordInfo = {
                userWhoChanged: req.user.userID,
                affectedType: 'imóvel',
                affectedData: newRealState.realStateID,
                action: 'criou',
                category: 'Imóveis',
                company: req.user.company
            }

            createRecord(recordInfo)

        } catch (err) {
            req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`);
        }

        return res.redirect('../');
    }
);

router.get('/real-states/:realStateID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, next) => {
        try {
            const realStateID = req.params.realStateID;

            const realS = await RealStates.findOne({ realStateID: realStateID });

            if (!realS) {
                req.flash(`Imóvel não encontrado em sua base.`);
                res.redirect('./');
            }

            res.render('admin/realStates/real-state-info', { realS });

        } catch (err) {
            req.flash(`Houve um erro interno no servidor ao buscar o lead: ${err}`);
            res.redirect('./')
        }
    }

);

router.post('/real-states/:realStateID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, user) => {
      const realStateID = parseInt(req.params.realStateID, 10);
  
      try {
        const realS = await RealStates.findOne({ realStateID: realStateID });
  
        if (!realS) {
          req.flash('errorMsg', 'Lead não encontrado.');
          return res.redirect('./');
        }
  
        const updatedData = req.body;
        const originalData = realS.toObject();
  
        const { updatedAt, ...originalDataWithoutUpdatedAt } = originalData;
  
        const normalizeToString = (value) => {
          if (value === undefined || value === null || value === '') return '';
          if (Array.isArray(value)) return value.sort().join(',');
          return value.toString();
        };
  
        const changedFields = {};
        const oldFields = {};
  
        Object.keys(updatedData).forEach((key) => {
          const updatedValue = normalizeToString(updatedData[key]);
          const originalValue = normalizeToString(originalDataWithoutUpdatedAt[key]);
  
          if (updatedValue !== originalValue) {
            changedFields[key] = updatedData[key];
            oldFields[key] = originalDataWithoutUpdatedAt[key];
          }
        });
  
        if (Object.keys(changedFields).length > 0) {
          Object.assign(realS, changedFields);
          realS.updatedAt = new Date();
  
          await realS.save();

          for (const key of Object.keys(changedFields)) {
            const oldData = oldFields[key];
            const newData = changedFields[key];
        
            const recordInfo = {
                userWhoChanged: req.user.userID,
                affectedType: "imóvel",
                affectedData: realS.realStateID,
                action: "atualizou",
                affectedPropertie: key,
                oldData: oldData !== undefined ? `"${oldData}"` : "",
                newData: newData !== undefined ? `"${newData}"` : "",
                category: "Imóveis",
                company: req.user.company
            };
        
            await createRecord(recordInfo);
        }
  
          req.flash('successMsg', 'Imóvel atualizado com sucesso!');
        } else {
          req.flash('successMsg', 'Nenhum campo foi alterado.');
        }
  
        res.redirect('./');
      } catch (err) {
        req.flash('errorMsg', `Erro no servidor: ${err}`);
        res.redirect('./');
      }
    }
);

router.get('/real-states/:realStateID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4].map(i => positionsI[i])),
    async (req, res, user) => {

        const realStateID = req.params.realStateID;

        try {
            const dataToHidden = await RealStates.findOne({ realStateID: realStateID });

            dataToHidden.hidden = true;

            if (!dataToHidden) {
                req.flash('errorMsg', `Imóvel ${realStateID} não encontrado.`);
            }

            await dataToHidden.save()
            .then(async () => {

                const recordInfo = {
                    userWhoChanged: req.user.userID,
                    affectedType: 'imóvel',
                    affectedData: realStateID,
                    action: 'excluiu*',
                    category: 'Imóveis',
                    company: req.user.company
                }

                await createRecord(recordInfo);

                req.flash('successMsg', `Imóvel excluído com sucesso.`)

            })
            .catch((err) => {
                req.flash('errorMsg', `Não foi possível excluir o imóvel: ${err}`)
            })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('../')
    }
);

export default router