import { Router, Request, Response, NextFunction } from "express";
const router = Router();
import bcrypt from "bcrypt"
import ExcelJS from "exceljs"
import { Query, Types } from "mongoose";

import { ensureAuthenticated, IUserSession } from "../helpers/Auth.js"
import { ensureRole } from "../helpers/Auth.js"
import positionNames from "../helpers/positionNames.js"
import createRecord from "../helpers/newRecord.js"
import uploadMedia from "../helpers/uploadMedia.js"
import upload from "../helpers/Multer.js"

import Companies, { ICompany } from "../models/CompanySchema.js"
import Users, { IUser } from "../models/UserSchema.js"
import Records, { IRecord } from "../models/RecordSchema.js"
import RealEstates, { IRealEstate } from "../models/RealEstateSchema.js"
import Leads from "../models/LeadSchema.js"
import { ISendedRecord } from "../models/@types_ISendedRecord.js"
import passport, { use } from "passport";
import positionsNames from "../helpers/positionNames.js";

router.get('/feed-session',
    ensureAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {

        async function listCompanies(user: IUserSession) {
            const userCompanies: (ICompany | null)[] = await Promise.all(
                user.companies?.map(async (company) => {
                    const companyDoc = await Companies.findById(company)
                    return companyDoc ? companyDoc.toObject() : null
                }) || []
            )

            const enabledCompanies = userCompanies.filter(
                (company): company is ICompany =>
                    company != null &&
                    company.enabled == true
            )

            const companiesResponse = enabledCompanies.map(({ _id, companyID, name }) => ({
                _id,
                companyID,
                name
            }))

            return companiesResponse
        }

        if (!req.user) {
            return res.redirect('/user/signin')
        }

        const companyOptions = await listCompanies(req.user)

        req.session.companyOptions = companyOptions
        req.session.selectedCompany = companyOptions[0]

        req.session.save()

        res.redirect('/admin')
    })

router.get('/',
    ensureAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {

        const userWithPosition = {
            ...req.user,
            positionName: positionNames[req.user?.position ?? 0]
        }

        res.render('admin/home', { user: userWithPosition });
    })

//* ROUTES TYPE: Record
router.get('/records',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        //* format date from ISO to DD/MM/YY - HH/MM/SS
        const formatDate = (isoDate: Date) => {
            const date = new Date(isoDate);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
        };

        try {
            const allRecords = await Records.find().lean().sort({ createdAt: -1 });

            const recordsPOJO = allRecords.map(record => ({
                ...record,
                createdAt: formatDate(record.createdAt)
            }));

            res.render('admin/records', { records: recordsPOJO });

        } catch (err) {
            req.flash('errorMsg', `Houve um erro ao encontrar os dados: ${err}`)
            res.status(500).send('Erro ao buscar os registros');
        }
    })

//* ROUTES TYPE: Account
router.get('/my-account/:userID',
    ensureAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {

        const paramsID = String(req.params.userID)
        const sessionID = String(req.user?.userID)

        if (paramsID !== sessionID) {
            req.flash('errorMsg', `Usuário não confere com a solicitação.`)
            return res.redirect('/admin')
        }

        res.render('admin/my-account', { user: req.user });
    })

router.post('/my-account/:userID/update',
    ensureAuthenticated,
    async (req: Request, res: Response) => {

        const userID = parseInt(req.params.userID, 10);
        try {
            const originalData = await Users.findOne({ userID: userID });
            if (!originalData) {
                req.flash('errorMsg', 'Conta não encontrada.')
                return res.redirect('/admin')
            }

            if (userID !== req.user?.userID) {
                req.flash('errorMsg', 'O usuário não confere com a solicitação.')
                return res.redirect('/admin')
            }

            //* Old (updatedAt discarded for key review)
            const { updatedAt, ...original } = originalData
            const oldFields: Record<string, string | number | object> = {}

            //* New
            const formData = req.body
            const changedFields: Record<string, string | number | object> = {}

            const changeableFields: string[] = ['name', 'phone', 'email']

            changeableFields.forEach((key) => {
                if (formData[key] != original[key as keyof typeof original]) {

                    changedFields[key] = formData[key]
                    oldFields[key] = original[key as keyof typeof original]
                }
            })

            if (Object.keys(changedFields).length > 0) {
                const dataToSave = Object.assign(originalData, changedFields);
                originalData.updatedAt = new Date();

                await dataToSave.save()
                    .then(async () => {
                        for (const key of Object.keys(changedFields)) {

                            const recordInfo: ISendedRecord = {
                                userWhoChanged: String(req.user?.userID),
                                affectedType: 'usuário',
                                affectedData: String(req.user?.userID),
                                affectedPropertie: key,
                                oldData: oldFields[key] !== undefined ? `"${oldFields[key]}"` : "",
                                newData: changedFields[key] !== undefined ? `"${changedFields[key]}"` : "",
                                action: 'atualizou',
                                category: 'Usuários',
                                company: '' //! CORRECT WITH COMPANY OBJECTID
                            }

                            await createRecord(recordInfo, req)
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

            res.redirect('/admin');

        } catch (error) {
            console.error(error);
            res.status(500).send('Erro no servidor.');
        }

    })

//* ROUTES TYPE: Company
router.get('/company',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const userOwner = req.user?._id;

            const userCompanies = await Companies.find({ "team.owner": userOwner }).lean()

            res.render('admin/company/companies', { companies: userCompanies })
        } catch (err) {
            req.flash('errorMsg', `There was an error searching company: ${err}`)
            return res.redirect('./')
        }
    })

router.get('/company/new-company',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        res.render('admin/company/new-company')
    })

router.post('/company/new-company/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        const generateNewCompanyID = async () => {
            try {

                const latestCompany = await Companies.findOne().lean().sort({ companyID: -1 }).exec();
                const newID = latestCompany && latestCompany.companyID
                    ? latestCompany.companyID + 1
                    : 40000;
                return newID;

            } catch (error) {
                console.error('Erro ao gerar novo userID:', error);
                throw error;
            }
        };

        const form: ICompany = req.body
        const formErrors: string[] = [];

        async function verifyFormErrors(form: ICompany) {
            if (Object.entries(form)
                .some(([key, value]) => value == undefined || null || '')) {
                formErrors.push('Erro 1004 - Preencha todos os campos para prosseguir.');
            }

            if (await freeCompanyEmail(form.email) == false) {
                formErrors.push('Erro 1009 - Este e-mail já está sendo usado.')
            }

            // If it got some error
            if (formErrors.length) {
                return formErrors[0]
            }
            else {
                return null
            }
        }

        async function freeCompanyEmail(email: string) {
            try {
                const user = await Users.findOne({ email })
                return !user
            } catch (err) {
                console.error(`There was an error parsing email: ${err}`);
                return false
            }
        }

        async function saveUserCompanies(company_id: Types.ObjectId, user_id: Types.ObjectId) {

            const user = await Users.findById(user_id)
            const company = await Companies.findById(company_id)

            if (!company) {
                req.flash('errorMsg', 'Não foi possível salvar a empresa')
                return
            }

            user?.companies?.push(company._id)

            user?.save()
                .then()
                .catch((err) => {
                    req.flash('errorMsg', `Não foi possível salvar os dados do usuário: ${err}`)
                    return
                })

        }

        const checkForm = await verifyFormErrors(form)

        if (checkForm !== null) {
            req.flash('errorMsg', `${checkForm}`)
            return res.redirect('/admin/new-company')
        }

        const newCompany: ICompany = new Companies({
            ...form,
            companyID: await generateNewCompanyID(),
            team: {
                owner: req.user?._id
            },
            createdAt: new Date,
            updatedAt: new Date
        });

        newCompany.save()
            .then(async () => {

                //* Updating user document
                if (!req.user?._id) {
                    req.flash('errorMsg', `Erro 2005 - Usuário não identificado`)
                    return res.redirect('/admin/company')
                }

                await saveUserCompanies(
                    newCompany?._id,
                    req.user?._id)


                //* Adding to records
                const recordInfo: ISendedRecord = {
                    userWhoChanged: String(req.user?.userID),
                    affectedType: "empresa",
                    affectedData: String(newCompany.companyID),
                    action: "criou",
                    category: "Empresas",
                    company: String(newCompany.companyID)
                }

                await createRecord(recordInfo, req);

                res.redirect('/admin/company');
            })
            .catch((err) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                res.redirect('/admin/company');
            });
    })

router.get('/company/details/:companyID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const paramID = Number(req.params.companyID)
            const companiesID = req.user?.companies

            const companiesInfo = await Companies.find({ _id: { $in: companiesID } }).lean()

            const companies = companiesInfo.map((company) => ({
                ...company
            }));

            const selectedCompany = companies.find(c => c.companyID === paramID);

            res.render('admin/company/companies', {
                companies,
                selectedCompany
            })
        } catch (err) {

            req.flash('errorMsg', `There was an error searching company: ${err}`)
            return res.redirect('/admin/company')
        }
    })

router.get('/company/details/:companyID/change-plan',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const paramID = Number(req.params.companyID)

            const company = await Companies.findOne({ companyID: paramID }).lean()

            if (!company) {
                return req.flash('errorMsg', 'Empresa não encontrada!')
            }

            const currentPlan = company.plan

            res.render('admin/company/plans', {
                currentPlan,
                company
            })

        } catch (err) {
            req.flash('errorMsg', `There was an error searching company: ${err}`)
            return res.redirect('/admin/company')
        }
    })

//TODO: --- Still not working
router.post('/company/details/:companyID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        const paramID = Number(req.params?.companyID)
        const userClaimant = req.user?._id

        function normalizeObject(obj: Record<string, any>) {
            const res: Record<string, any> = {}

            for (const key in obj) {
                if (obj[key] == 'true') res[key] = true;
                if (obj[key] == 'false') res[key] = false;
                if (!isNaN(obj[key]) &&
                    obj[key] != '' &&
                    key != 'phone')
                    res[key] = Number(obj[key])

                else res[key] = obj[key];
            }

            return res
        }

        function flatten(obj: object, prefix = ''): Record<string, any> {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(acc, flatten(value, fullKey));
                } else {
                    acc[fullKey] = value;
                }
                return acc;
            }, {} as Record<string, any>);
        }


        try {
            const originalData = await Companies.findOne({ companyID: paramID }).select('+team.owner');

            if (!originalData) {
                req.flash('errorMsg', 'Dados não encontrados.')
                return res.redirect('/admin/company')
            }

            const originalNormalized = flatten(originalData.toObject())

            if (!originalData?.team.owner) {
                req.flash('errorMsg', 'Empresa não encontrada.')
                return res.redirect('/admin/company')
            }

            if (!originalData.team.owner.equals(userClaimant)) {
                req.flash('errorMsg', 'O usuário não confere com a solicitação.')
                return res.redirect('/admin/company')
            }

            //* Old (timestamps keys discarded for value review)
            const oldFields: Record<string, string | number | object> = {}

            //* New
            const formData = req.body
            const formNormalized = normalizeObject(formData)

            const changedFields: Record<string, string | number | object> = {}

            Object.keys(formNormalized).forEach((key) => {
                if (formNormalized[key] != originalNormalized[key]) {

                    changedFields[key] = formNormalized[key]
                    oldFields[key] = originalNormalized[key]
                }
            })

            if (Object.keys(changedFields).length > 0) {
                const dataToSave = Object.assign(originalData, changedFields);
                originalData.updatedAt = new Date();

                /*
                            await dataToSave.save()
                .then(async() => {
                    for (const key of Object.keys(changedFields)) {
                        
                        const recordInfo: ISendedRecord = {
                            userWhoChanged: String(req.user?.userID),
                            affectedType: 'empresa',
                            affectedData: String(dataToSave.companyID),
                            affectedPropertie: key,
                            oldData: oldFields[key] !== undefined ? `"${oldFields[key]}"` : "",
                            newData: changedFields[key] !== undefined ? `"${changedFields[key]}"` : "",
                            action: 'atualizou',
                            category: 'Empresas',
                            company: String(dataToSave.companyID)
                        }
    
                        await createRecord(recordInfo, req)
                    }
    
                    req.flash('successMsg', `Dados da conta atualizados com sucesso!`)
                })
                .catch((err) => {
                    req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                })
                */

            }

            else {
                req.flash('successMsg', 'Nenhum campo foi alterado.')
            }

            res.redirect('/admin');

        } catch (error) {
            console.error(error);
            res.status(500).send('Erro no servidor.');
        }
    })

//* Specifically in the plans page
router.post('/company/details/:companyID/change-plan/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        type PlanType = NonNullable<ICompany['plan']>

        const companyID = req.params.companyID
        const query = req.query?.plan?.toString()

        function isPlanType(value: unknown): value is PlanType {
            return (
                value === 'free' ||
                value === 'single' ||
                value === 'business'
            );
        }

        if (!query || !isPlanType(query)) {
            req.flash('errorMsg', 'Esse plano não existe!')
            return res.redirect('/admin/company')
        }

        try {
            const company = await Companies.findOne({ companyID: companyID })

            if (!company) {
                req.flash('errorMsg', 'Empresa não encontrada!')
                return res.redirect('/admin/company')
            }

            const oldPlan = company.plan

            company.plan = query
            company.updatedAt = new Date
            await company.save()
                .then(async () => {

                    if (!req.user?.userID) {
                        req.flash('errorMsg', 'Usuário não encontrado!')
                        return
                    }

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: req.user?.userID.toString(),
                        affectedType: 'empresa',
                        affectedData: company.companyID.toString(),
                        affectedPropertie: 'plan',
                        oldData: oldPlan,
                        newData: query,
                        action: 'atualizou',
                        category: 'Empresas',
                        company: company.companyID.toString()
                    }

                    await createRecord(recordInfo, req);

                    return res.redirect(`/admin/company/details/${companyID}`);
                })
                .catch((err) => {
                    req.flash('errorMsg', `Erro ao salvar o plano: ${err}`)
                    return res.redirect('/admin/company')
                })

        } catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
            return res.redirect('/admin/company')
        }
    })

router.get('/company/switch/:companyID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    async (req: Request, res: Response) => {

        const paramID = Number(req.params.companyID)

        const companyOptions = req.session.companyOptions

        const newSelectedCompany = companyOptions?.find(company => company.companyID == paramID)

        req.session.selectedCompany = newSelectedCompany

        req.session.save()

        res.redirect('/admin')
    })



//* ROUTES TYPE: Team
router.get('/team',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const members = [];
            const teamMembers = req.user?.underManagement ? req.user?.underManagement : [];

            for (let i = 0; i < teamMembers.length; i++) {
                const memberID = teamMembers[i];

                const pickMember = await Users.findOne({ userID: memberID }).lean();
                if (!pickMember) {
                    req.flash('errorMsg', 'Erro 4400 - vazio inesperado')
                    return res.redirect('/admin')
                }

                const member = {
                    id: pickMember.userID,
                    name: pickMember.name,
                    position: pickMember.position
                };

                members.push(member);
            }

            res.render('admin/team/members', { members });

        } catch (err) {
            req.flash('errorMsg', `Houve um erro ao buscar os dados: ${err}`);
            res.redirect('./');
        }
    });

router.get('/team/new-member',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        async function verifyCreatingOptions() {

            const userPosition = req.user?.position

            if (!userPosition) {
                return []
            }

            switch (userPosition) {
                case 1:
                case 2:
                case 3:
                    return ['Supervisor de vendas', 'Agente de vendas']
                case 4:
                    return ['Agente de vendas']
                default:
                    return []
            }
        }

        try {
            const creatingOptions = await verifyCreatingOptions();

            if (creatingOptions.length < 1) {
                req.flash('errorMsg', 'Você não possui nível de permissão para criar usuários.')
                return res.redirect('/admin/team')
            }

            res.render('admin/team/new-member', {
                positions: creatingOptions
            });
        } catch (err) {
            req.flash('errorMsg', 'Houve um erro ao verificar as opções')
            res.redirect('/admin/team')
        }
    });

router.post('/team/new-member/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        const formErrors: string[] = []

        const formFields = req.body;

        async function verifyFormErrors(form: IUser): Promise<string | null> {

            if (Object.entries(form)
                .some(([key, value]) => value == undefined || null || '')) {
                formErrors.push('Preencha todos os campos para prosseguir.');
            }

            if (form.password.length < 8) {
                formErrors.push('Senha muito curta. Crie uma senha de ao menos 8 caracteres.');
            }

            if (isValidEmail(form.email) == false) {
                formErrors.push('Email inválido. Verifique se há @ e o domínio (exemplo: .com). Não deve conter espaços. Verifique se dirigou corretamente')
            }

            if (await freeEmail(form.email) == false) {
                formErrors.push('Este e-mail já está sendo usado.')
            }

            if (await strongPassword(form.password) == false) {
                formErrors.push('Senha muito fraca. É necessário ao menos um número e um caractere especial (exemplos: &, %, $, #, @)')
            }

            //* If it got some error
            if (formErrors.length) {
                return formErrors[0]
            }
            else {
                return null
            }
        }

        async function strongPassword(password: string) {
            const numberCount = (password.match(/\d/g) || []).length

            if (numberCount < 1 || checkSpecialChar(password) < 1) {
                return false
            }
            else {
                return true
            }

        }

        function isValidEmail(email: string): boolean {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        function checkSpecialChar(password: string) {
            const specialChar = /[^a-zA-Z0-9\s]/g;
            const matches = password.match(specialChar);
            return matches ? matches.length : 0
        }

        async function freeEmail(email: string) {
            try {
                const user = await Users.findOne({ email })
                return !user
            } catch (err) {
                console.error(`There was an error parsing email: ${err}`);
                return false
            }
        }

        //* Generating new userID for the claimant
        const generateNewUserID = async () => {
            try {

                const latestUser = await Users.findOne().sort({ userID: -1 }).exec();
                const newID = latestUser && latestUser.userID
                    ? latestUser.userID + 1
                    : 20000;
                return newID;

            } catch (error) {
                console.error('Erro ao gerar novo userID:', error);
                throw error;
            }
        };

        //* Update the current user team
        async function updateTeam(recordInfo: ISendedRecord) {

            try {
                let currentUser = await Users.findOne({ userID: req.user?.userID });
                if (!currentUser) {
                    req.flash('errorMsg', 'Vazio inesperado')
                    return res.redirect('./')
                }

                const createdUser = await Users.findOne({ userID: recordInfo.affectedData });
                if (!createdUser) {
                    req.flash('errorMsg', 'Vazio inesperado')
                    return res.redirect('./')
                }

                const i = currentUser.underManagement.length
                const newTeamMember = createdUser._id

                currentUser.underManagement[i] = newTeamMember
                currentUser.updatedAt = new Date;

                currentUser.save()
                    .then(async () => {
                        req.flash('successMsg', 'Usuário adicionado a equipe com sucesso!')
                    })
                    .catch((err) => {
                        req.flash('errorMsg', `Houve um erro ao salvar os dados: ${err}`)
                    })
            } catch (error) {
                throw new Error(`Erro ao atualizar: ${error}`);
            }
        }

        function normalizeName(name: string): string {
            return name
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toUpperCase()
                .replace(/\s+/g, ' ');
        }

        const checkForm = await verifyFormErrors(formFields)

        if (checkForm !== null) {
            req.flash('errorMsg', `${checkForm}`)
            console.log(checkForm)
            return res.redirect('/admin/team')
        }

        const positionIndex = positionsNames.indexOf(formFields.position) || 6

        const newAcc = new Users({
            userID: await generateNewUserID(),
            name: formFields.name,
            nameSearch: normalizeName(formFields.name),
            phone: formFields.phone,
            company: req.session?.selectedCompany?._id,
            email: formFields.email,
            position: positionIndex,
            managers: req.user?._id,
            createdAt: new Date,
            updatedAt: new Date
        });

        //* generating hash
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                req.flash('errorMsg', `Houve um erro ao gerar SALT: ${err}`)
                return res.redirect('./');
            }

            bcrypt.hash(formFields.password, salt, (err, hash) => {
                if (err) {
                    req.flash(`errorMsg', 'Houve um erro ao gerar HASH: ${err}`)
                    return res.redirect('./');
                };

                newAcc.password = hash;

                newAcc.save()
                    .then(async () => {
                        req.flash('successMsg', 'Usuário criado com sucesso!');

                        try {
                            const recordInfo: ISendedRecord = {
                                userWhoChanged: String(req.user?.userID),
                                affectedType: "usuário",
                                affectedData: String(newAcc.userID),
                                action: "criou",
                                category: "Usuários",
                                company: req.session?.selectedCompany?.companyID
                            }

                            await createRecord(recordInfo, req);

                            await updateTeam(recordInfo);

                        } catch (err) {
                            req.flash('errorMsg', `Erro ao criar registro em histórico: ${err}`)
                        }

                        return res.redirect('/admin/team');
                    })
                    .catch((err) => {
                        req.flash('errorMsg', `Houve um erro ao salvar os dados: ${err}`)
                        return res.redirect('/admin/team');
                    });
            });
        });
    });

router.get('/team/:teamuserID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        try {

            const managedUserID = String(req.params.teamuserID)
            const userManagerID = String(req.user?.userID)
            const userManager = await Users.findOne({ userID: userManagerID });
            const managedUser = await Users.findOne({ userID: managedUserID });

            if (!userManager || !managedUser) {
                return req.flash('errorMsg', `Usuário ${managedUserID} ou ${req.user?.userID} não encontrado.`);
            }

            const newUnderManArray = userManager.underManagement.filter(item => item !== managedUserID)
            const newManagersArray = managedUser.managers.filter(item => item !== userManagerID)

            userManager.underManagement = newUnderManArray
            managedUser.managers = newManagersArray

            await userManager.save()
                .then(async () => {

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(userManagerID),
                        affectedType: 'usuário',
                        affectedData: String(managedUserID),
                        action: 'retirou',
                        category: 'Equipes',
                        company: req.user?.company
                    }

                    await createRecord(recordInfo, req);

                    await managedUser.save()
                        .then()
                        .catch((err) => {
                            req.flash('errorMsg', `Não foi possível registrar a exclusão do gestor: ${err}`)
                        })

                    req.flash('successMsg', `membro da equipe excluído com sucesso.`)

                })
                .catch((err) => {
                    req.flash('errorMsg', `Não foi possível registrar a exclusão do membro: ${err}`)
                })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('/admin/team')
    }
);


//* ROUTES TYPE: Leads
router.get('/leads',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        async function searchLeads() {
            try {
                const userR = req.user?.userID;

                const leads = await Leads.find({ responsibleAgent: userR }).lean().exec();
                if (leads.length < 1) {
                    return null
                }

                const visibleLeads = leads.filter(lead => !lead.hidden);

                const formattedLeads = visibleLeads.map(lead => ({
                    ...lead.toObject ? lead.toObject() : lead,
                    id: lead.leadID,
                    name: lead.name,
                    phone: lead.phone,
                    status: lead.status
                }));

                return formattedLeads;
            } catch (err) {
                req.flash('errorMsg', `Houve um erro ao buscar os dados: ${err}`)
                return res.redirect('/admin')
            }
        }

        const leadsByUser = await searchLeads();

        res.render('admin/leads', { lead: leadsByUser })
    });

router.get('/leads/new-lead',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        res.render('admin/leads/new-lead')
    });

router.post('/leads/new-lead/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        // Generating new company ID
        const generateNewLeadID = async () => {
            try {

                const latestLead = await Leads.findOne().sort({ leadID: -1 }).exec();
                const newID = latestLead && latestLead.leadID
                    ? latestLead.leadID + 1
                    : 50000;
                return newID;

            } catch (error) {
                console.error('Erro ao gerar novo leadID:', error);
                throw error;
            }
        };

        // Validations below
        try {
            const newLeadErrors = [];

            const fields = {
                name: req.body.name,
                document: req.body.document,
                phone: req.body.phone,
                email: req.body.email,
                sourceCode: req.body.sourceCode,
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
                        sourceCode: fields.sourceCode,
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
                        company: req.user?.company,
                        responsibleAgent: req.user?.userID,
                        createdAt: new Date,
                        updatedAt: new Date
                    });

                    newLead.save()
                        .then(async () => {
                            req.flash('successMsg', 'Lead criado com sucesso!');

                            // Adding to records
                            try {

                                const recordInfo: ISendedRecord = {
                                    userWhoChanged: String(newLead.responsibleAgent),
                                    affectedType: "lead",
                                    affectedData: String(newLead.leadID),
                                    action: "criou",
                                    category: "Leads",
                                    company: newLead.company
                                }

                                await createRecord(recordInfo, req);

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
        } catch (error) {
            req.flash('errorMsg', `Erro interno: ${error}`)
        }
    });

router.post('/leads/export-all',
    ensureAuthenticated,
    async (req: Request, res: Response) => {

        try {
            let leads = await Leads.find({ responsibleAgent: req.user?.userID })
                .sort({ createdAt: -1 })
                .lean()
                .exec();

            if (leads.length < 1) {
                req.flash(`errorMsg`, `Você não possui nenhum lead para exportar.`)
                return res.redirect('./')
            }

            leads = leads.filter(lead => !lead.hidden)
            leads = leads.map(lead => ({
                ...lead,
                createdAt: new Date(lead.createdAt),
                updatedAt: new Date(lead.updatedAt)
            }))

            // creating a new worksheet
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet()

            worksheet.views = [{ state: 'frozen', ySplit: 1 }];

            worksheet.columns = [
                { header: 'Nome', key: 'name' },
                { header: 'Telefone', key: 'phone' },
                { header: 'Email', key: 'email' },
                { header: 'Documento / CPF', key: 'document' },
                { header: 'Imóvel interessado', key: 'sourceCode' },
                { header: 'Renda bruta familiar', key: 'familyIncome' },
                { header: 'Status', key: 'status' },
                { header: 'Data de cadastro', key: 'createdAt', style: { numFmt: 'dd/mm/yyyy' } },
                { header: 'Última atualização', key: 'updatedAt', style: { numFmt: 'dd/mm/yyyy' } },
                { header: 'Observações', key: 'observations' }
            ]

            worksheet.addRows(leads);

            // Table header xlsx
            worksheet.getRow(1).eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1F4E78' }
                };
                cell.font = {
                    color: { argb: 'FFFFFFFF' },
                    bold: true
                };
            });

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=Leads_ativos.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            req.flash('errorMsg', `Houve um erro interno: ${err}`)
            return res.redirect('./')
        }
    })

router.get('/leads/:leadID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const leadID = req.params.leadID;
            const lead = await Leads.findOne({ leadID: leadID }).lean();

            if (!lead) {
                req.flash(`Lead não encontrado em sua base.`);
                return res.redirect('./');
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
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {
        const leadID = parseInt(req.params.leadID, 10);

        try {
            const lead = await Leads.findOne({ leadID: leadID });

            if (!lead) {
                req.flash('errorMsg', 'Lead não encontrado.');
                return res.redirect('./');
            }

            const updatedData = req.body;
            const originalData = lead.toObject();

            const { updatedAt, ...original } = originalData;

            const normalizeToString = (value: string | null | undefined) => {
                if (value === undefined || value === null || value === '') return '';
                if (Array.isArray(value)) return value.sort().join(',');
                return value.toString();
            };

            const changedFields: Record<string, any> = {};
            const oldFields: Record<string, any> = {};

            Object.keys(updatedData).forEach((key) => {
                const updatedValue = normalizeToString(updatedData[key]);
                const originalValue = normalizeToString(original[key as keyof typeof original]);

                if (updatedValue !== originalValue) {
                    changedFields[key] = updatedData[key];
                    oldFields[key] = original[key as keyof typeof original];
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

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: "lead",
                        affectedData: String(leadID),
                        action: "atualizou",
                        affectedPropertie: key,
                        oldData: oldLeadData !== undefined ? `"${oldLeadData}"` : "",
                        newData: newLeadData !== undefined ? `"${newLeadData}"` : "",
                        category: "Leads",
                        company: req.user?.company
                    };

                    await createRecord(recordInfo, req);
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
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        const leadID = req.params.leadID;

        try {
            const dataToHidden = await Leads.findOne({ leadID: leadID });
            if (!dataToHidden) {
                req.flash('errorMsg', 'Erro 4400 - vazio inesperado')
                return res.redirect('./')
            }

            dataToHidden.hidden = true;

            if (!dataToHidden) {
                req.flash('errorMsg', `Lead ${leadID} não encontrado.`);
            }

            await dataToHidden.save()
                .then(async () => {

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: 'lead',
                        affectedData: String(leadID),
                        action: 'excluiu*',
                        category: 'Leads',
                        company: req.user?.company
                    }

                    await createRecord(recordInfo, req);

                    req.flash('successMsg', `Lead excluído com sucesso.`)

                })
                .catch((err) => {
                    req.flash('errorMsg', `Não foi possível excluir o lead: ${err}`)
                })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('/admin/leads')
    }
);


//* ROUTES TYPE: Real Etates
router.get('/real-states',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const userCompany = req.user?.company;
            const RealEstates = await RealEstates.find({ company: userCompany }).lean().exec();
            const visibleRealStates = RealEstates.filter(realstate => !realstate.hidden);

            const formattedRealStates = visibleRealStates.map(realstate => ({
                src: realstate.src?.[0],
                id: realstate.realStateID,
                type: realstate.type,
                bedrooms: realstate.bedrooms,
                neighborhood: realstate.neighborhood,
                city: realstate.city,
                saleValue: realstate.saleValue
            }));

            res.render('admin/RealEstates/real-states', { property: formattedRealStates });

        } catch (err) {
            console.error(`Houve um erro ao buscar os dados: ${err}`);
            next(err);
        }
    }
);

router.get('/real-states/new-real-state',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {
        res.render('admin/RealEstates/new-real-state')
    }
);

router.post('/real-states/new-real-state/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    upload.single("uploaded_file"),
    async (req: Request, res: Response, next: NextFunction) => {

        const generateNewRealStateID = async () => {
            try {

                const latestRealState = await RealEstates.findOne().sort({ realStateID: -1 }).exec();
                const newID = latestRealState && latestRealState.realStateID
                    ? latestRealState.realStateID + 1
                    : 60000;
                return newID;

            } catch (error) {
                console.error('Erro ao gerar novo realStateID:', error);
                throw error;
            }
        };

        const generateNewOwnerID = async () => {
            try {

                const latestOwner = await RealEstates.findOne().lean().sort({ "owner.ownerID": -1 }).exec();
                if (!latestOwner) {
                    req.flash('errorMsg', 'Erro 4400 - vazio inesperado')
                    return res.redirect('./')
                }

                const newID = latestOwner && latestOwner.owner?.ownerID
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
        const newRealState: any = new RealEstates(fieldsWithoutOwner);
        newRealState.src = [];

        try {
            if (!req.file) {
                req.flash('errorMsg', 'Erro 4400 - vazio inesperado.')
                return res.redirect('./')
            }

            await uploadMedia(req.file, newRealState);
        } catch (err) {
            err instanceof Error ?
                req.flash('errorMsg', `Erro ao salvar imagem: ${err.message}`)
                : req.flash('errorMsg', `Erro ao salvar imagem: ${err}`)

            return res.redirect('./');
        }

        newRealState.owner = propertyOwner;
        newRealState.realStateID = await generateNewRealStateID();
        newRealState.tags = [];
        newRealState.company = req.user?.company;
        newRealState.responsibleAgent = req.user?.userID;
        newRealState.createdAt = new Date();
        newRealState.updatedAt = new Date();

        try {
            await newRealState.save();
            req.flash('successMsg', 'Imóvel cadastrado com sucesso!');

            const recordInfo: ISendedRecord = {
                userWhoChanged: String(req.user?.userID),
                affectedType: 'imóvel',
                affectedData: String(newRealState.realStateID),
                action: 'criou',
                category: 'Imóveis',
                company: req.user?.company
            }

            createRecord(recordInfo, req)

        } catch (err) {
            req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`);
        }

        return res.redirect('/admin/real-states');
    }
);

router.get('/real-states/:realStateID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const realStateID = req.params.realStateID;

            const realS = await RealEstates.findOne({ realStateID: realStateID }).lean();

            if (!realS) {
                req.flash('errorMsg', `Imóvel não encontrado em sua base.`);
                return res.redirect('admin/RealEstates');
            }

            res.render('admin/RealEstates/real-state-info', { realS });

        } catch (err) {
            req.flash('errorMsg', `Houve um erro interno no servidor ao buscar o lead: ${err}`);
            res.redirect('./')
        }
    }

);

router.post('/real-states/:realStateID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {
        const realStateID = parseInt(req.params.realStateID, 10);

        try {
            const realS = await RealEstates.findOne({ realStateID: realStateID });

            if (!realS) {
                req.flash('errorMsg', 'Lead não encontrado.');
                return res.redirect('./');
            }

            const updatedData = req.body;
            const originalData = realS.toObject();

            const { updatedAt, ...original } = originalData;

            const normalizeToString = (value: string | null | undefined) => {
                if (value === undefined || value === null || value === '') return '';
                if (Array.isArray(value)) return value.sort().join(',');
                return value.toString();
            };

            const changedFields: Record<string, any> = {};
            const oldFields: Record<string, any> = {};


            Object.keys(updatedData).forEach((key) => {
                const updatedValue = normalizeToString(updatedData[key]);
                const originalValue = normalizeToString(original[key as keyof typeof original]);

                if (updatedValue !== originalValue) {
                    changedFields[key] = updatedData[key];
                    oldFields[key] = original[key as keyof typeof original];
                }
            });

            if (Object.keys(changedFields).length > 0) {
                Object.assign(realS, changedFields);
                realS.updatedAt = new Date();

                await realS.save();

                for (const key of Object.keys(changedFields)) {
                    const oldData = oldFields[key];
                    const newData = changedFields[key];

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: "imóvel",
                        affectedData: String(realS.realStateID),
                        action: "atualizou",
                        affectedPropertie: key,
                        oldData: oldData !== undefined ? `"${oldData}"` : "",
                        newData: newData !== undefined ? `"${newData}"` : "",
                        category: "Imóveis",
                        company: String(req.user?.company)
                    };

                    await createRecord(recordInfo, req);
                }

                req.flash('successMsg', 'Imóvel atualizado com sucesso!');
            } else {
                req.flash('successMsg', 'Nenhum campo foi alterado.');
            }

            res.redirect('/admin/real-states');
        } catch (err) {
            req.flash('errorMsg', `Erro no servidor: ${err}`);
            res.redirect('/admin/real-states');
        }
    }
);

router.get('/real-states/:realStateID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        const realStateID = req.params.realStateID;

        try {
            const dataToHidden = await RealEstates.findOne({ realStateID: realStateID });
            if (!dataToHidden) {
                req.flash('errorMsg', 'Erro 4400 - vazio inesperado')
                return res.redirect('./')
            }

            dataToHidden.hidden = true;

            if (!dataToHidden) {
                req.flash('errorMsg', `Imóvel ${realStateID} não encontrado.`);
            }

            await dataToHidden.save()
                .then(async () => {

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: 'imóvel',
                        affectedData: realStateID,
                        action: 'excluiu*',
                        category: 'Imóveis',
                        company: req.user?.company
                    }

                    await createRecord(recordInfo, req);

                    req.flash('successMsg', `Imóvel excluído com sucesso.`)

                })
                .catch((err) => {
                    req.flash('errorMsg', `Não foi possível excluir o imóvel: ${err}`)
                })
        }
        catch (err) {
            req.flash('errorMsg', `Erro interno: ${err}`)
        }

        res.redirect('/admin/real-states')
    }
);

export default router