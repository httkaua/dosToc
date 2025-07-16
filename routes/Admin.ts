import { Router, Request, Response, NextFunction } from "express";
const router = Router();
import bcrypt from "bcrypt"
import ExcelJS from "exceljs"
import mongoose, { Types } from "mongoose";
const { ObjectId } = mongoose.Types

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
import Leads, { ILeads } from "../models/LeadSchema.js"
import { ISendedRecord } from "../models/@types_ISendedRecord.js"
import passport, { use } from "passport";
import positionsNames from "../helpers/positionNames.js";
import { unflattenObject, compareObjects } from "../helpers/ObjectUnflatter.js"

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

        const paramsUserID = Number(req.params.userID);
        const formData = unflattenObject(req.body)
        console.log(formData)

        async function userRepositoryQuery() {
            return Users.find({ userID: paramsUserID }).lean()
        }

        const originalUser = await userRepositoryQuery()
        console.log('Original data: \n')
        console.log(originalUser)
        console.log('\n')

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

                const latestCompany = await Companies
                    .findOne()
                    .sort({ companyID: -1 })
                    .exec()

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

router.post('/company/details/:companyID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3]),
    async (req: Request, res: Response, next: NextFunction) => {

        const paramsCompanyID = Number(req.params?.companyID)
        const formData = unflattenObject(req.body)
        console.log(formData)

        async function companyRepositoryQuery() {
            return Companies.find({ companyID: paramsCompanyID }).lean()
        }

        const originalCompany = await companyRepositoryQuery()
        console.log('Original data:')
        console.log(originalCompany)
        console.log('\n')

    })

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
            const members: Record<string, any>[] = [];
            const teamMembers = req.user?.underManagement ? req.user?.underManagement : [];

            teamMembers.map(async (id) => {

                const member = await Users.findById(id).lean();
                if (!member) {
                    req.flash('errorMsg', 'Vazio inesperado')
                    return res.redirect('/admin')
                }

                const isPartOfCompany = member.companies
                    ?.map(id => id.toString())
                    ?.includes(req.session?.selectedCompany?._id)

                const isEnabled = member.enabled

                if (isPartOfCompany && isEnabled) {
                    const memberToPage = {
                        id: member.userID,
                        name: member.name,
                        position: member.position
                    };

                    members.push(memberToPage);
                }
            })

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
                    return [4, 5, 6]
                case 4:
                    return [5, 6]
                default:
                    return []
            }
        }

        try {
            const creatingOptions: number[] = await verifyCreatingOptions();

            if (creatingOptions.length < 1) {
                req.flash('errorMsg', 'Você não possui nível de permissão para criar usuários.')
                return res.redirect('/admin/team')
            }

            const optionsInText = creatingOptions.map((option) => {
                return positionsNames[option]
            })

            res.render('admin/team/new-member', {
                positions: optionsInText
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

        const requestData = req.body;

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

                const latestUser = await Users
                    .findOne()
                    .sort({ userID: -1 })
                    .exec()

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

        const checkForm = await verifyFormErrors(requestData)

        if (checkForm !== null) {
            req.flash('errorMsg', `${checkForm}`)
            console.log(checkForm)
            return res.redirect('/admin/team')
        }

        const positionIndex = positionsNames.indexOf(requestData.position) || 6

        const newAcc = new Users({
            userID: await generateNewUserID(),
            name: requestData.name,
            nameSearch: normalizeName(requestData.name),
            phone: requestData.phone,
            companies: [req.session?.selectedCompany?._id],
            email: requestData.email,
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

            bcrypt.hash(requestData.password, salt, (err, hash) => {
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

        const paramID = req.params.teamuserID

        const userToBeHidden = await Users.findOne({ userID: paramID })

        if (!userToBeHidden) {
            req.flash('errorMsg', 'Usuário não encontrado')
            return res.redirect('/admin/team')
        }

        const isUnderThisUser = req.user?.underManagement
            .map(id => id.toString())
            .includes(String(userToBeHidden._id))

        if (!isUnderThisUser) {
            req.flash('errorMsg', 'Você não é gestor do usuário a ser excluído')
            return res.redirect('/admin/team')
        }

        await Users.findByIdAndUpdate(userToBeHidden._id, { enabled: false })
            .then(async () => {

                const recordInfo: ISendedRecord = {
                    userWhoChanged: String(req.user?.userID),
                    affectedType: 'usuário',
                    affectedData: String(userToBeHidden.userID),
                    action: 'retirou',
                    category: 'Equipes',
                    company: req.session?.selectedCompany?.companyID
                }

                await createRecord(recordInfo, req);

                req.flash('successMsg', `membro da equipe excluído com sucesso.`)

            })
            .catch((err) => {
                req.flash('errorMsg', `Não foi possível registrar a exclusão do membro: ${err}`)
            })

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
                const leads = await Leads
                    .find({
                        company: req.session?.selectedCompany?._id,
                        responsibleAgent: req.user?._id,
                        enabled: true
                    })
                    .lean()
                    .exec()
                return leads
            } catch (err) {
                req.flash('errorMsg', `Houve um erro ao buscar os dados: ${err}`)
            }
        }

        res.render('admin/leads/leads', { lead: (await searchLeads()) })
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

        const requestData = req.body;

        const generateNewLeadID = async () => {
            try {

                const latestLead = await Leads
                    .findOne()
                    .sort({ leadID: -1 })
                    .exec()

                const newID = latestLead && latestLead.leadID
                    ? latestLead.leadID + 1
                    : 1;
                return newID;

            } catch (error) {
                console.error('Erro ao gerar novo leadID:', error);
                throw error;
            }
        };

        function normalizeName(name: string): string {
            return name
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toUpperCase()
                .replace(/\s+/g, ' ');
        }

        const userLeads = async function queryUserLeads() {
            const companyLeads = await Leads
                .find({ responsibleAgent: req.user?._id })
                .lean()
            return companyLeads
        }()

        async function verifyUndefinedAndNullFields(requestData: Record<string, any>) {
            const errors = {
                undefined: Object.entries(requestData).some(([key, value]) => value == undefined),
                null: Object.entries(requestData).some(([key, value]) => value == null)
            };

            if (errors.undefined || errors.null) {
                return 'Erro de campos. Preencha todos os campos corretamente.'
            }
            return null
        }

        async function verifyPhoneDuplicity(requestData: Record<string, any>) {
            if ((await userLeads).some(lead => lead.phone == requestData.phone)) {
                return `Este telefone já está ocupado.`
            }
            return null
        }

        async function verifyEmailDuplicity(requestData: Record<string, any>) {
            if ((await userLeads).find(lead => lead.email == requestData.email)) {
                return `Este e-mail já está ocupado.`
            }
            return null
        }

        async function verifyNewLeadProblems(requestData: Record<string, any>) {
            const newLeadErrors: (string | null)[] = [];

            newLeadErrors.push(await verifyUndefinedAndNullFields(requestData))
            newLeadErrors.push(await verifyPhoneDuplicity(requestData))
            newLeadErrors.push(await verifyEmailDuplicity(requestData))

            return newLeadErrors.filter(error => error !== null) as string[]
        }

        try {

            const leadProblems = await verifyNewLeadProblems(requestData)

            if (leadProblems.length > 0) {
                req.flash('errorMsg', leadProblems[0] || 'erro interno de validação.')
                return res.redirect('/admin/leads')
            }

            const newLead: ILeads = new Leads({
                ...requestData,
                leadID: await generateNewLeadID(),
                nameSearch: normalizeName(requestData.name),
                interests: {
                    realEstateIT: requestData.realEstateIT !== ''
                        ? requestData.realEstateIT
                        : null,
                    TypeIT: requestData.TypeIT,
                    cityIT: requestData.cityIT
                },
                company: req.session?.selectedCompany?._id,
                responsibleAgent: req.user?._id
            });

            newLead.save()
                .then(async () => {
                    req.flash('successMsg', 'Lead criado com sucesso!');

                    try {

                        const recordInfo: ISendedRecord = {
                            userWhoChanged: String(req.user?.userID),
                            affectedType: "lead",
                            affectedData: String(newLead.leadID),
                            action: "criou",
                            category: "Leads",
                            company: req.session?.selectedCompany?.companyID
                        }

                        await createRecord(recordInfo, req);
                        return res.redirect('/admin/leads');

                    }
                    catch (err) {
                        req.flash('errorMsg', `Houve um erro ao criar o registro em histórico: ${err}`)
                        return res.redirect('/admin/leads');
                    }
                })
                .catch((err) => {
                    req.flash('errorMsg', `Houve um erro ao salvar os dados: ${err}`)
                    return res.redirect('/admin/leads');
                });
        } catch (error) {
            req.flash('errorMsg', `Erro interno: ${error}`)
            res.redirect('/admin/leads');
        }
    });

router.post('/leads/export-all',
    ensureAuthenticated,
    async (req: Request, res: Response) => {

        async function searchLeads() {
            const leads = await Leads.find({
                company: req.session?.selectedCompany?._id,
                responsibleAgent: req.user?._id,
                enabled: true
            })
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            return leads
        }

        function convertToExcelDateSerial(dateInput: string | Date): number {
            const MILLISECONDS_PER_DAY = 86_400_000
            const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30))

            const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

            const utcDateOnly = new Date(Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate()
            ));

            const diffInMs = utcDateOnly.getTime() - EXCEL_EPOCH.getTime();

            return Math.floor(diffInMs / MILLISECONDS_PER_DAY);
        }

        try {
            const leads: Record<string, any> = await searchLeads()

            if (leads.length < 1) {
                req.flash(`errorMsg`, `Você não possui nenhum lead para exportar.`)
                return res.redirect('/admin/leads')
            }

            const formattedLeads = leads.map((lead: any) => ({
                ...lead,
                createdAt: convertToExcelDateSerial(lead.createdAt) || null,
                updatedAt: convertToExcelDateSerial(lead.updatedAt) || null
            }));

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
                {
                    header: 'Data de cadastro',
                    key: 'createdAt',
                    style: { numFmt: 'dd/mm/yyyy' }
                },
                {
                    header: 'Última atualização',
                    key: 'updatedAt',
                    style: { numFmt: 'dd/mm/yyyy' }
                },
                { header: 'Observações', key: 'observations' }
            ]

            worksheet.addRows(formattedLeads);

            //* Table header style (blue and white) xlsx
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
            const lead = await Leads.findOne({ leadID })
                .lean()

            if (!lead) {
                req.flash('errorMsg', `Lead não encontrado em sua base.`)
                return res.redirect('./')
            }

            res.render('admin/leads/leadinfo', { lead })

        } catch (err) {
            req.flash('errorMsg',
                `Houve um erro interno no servidor ao buscar o lead: ${err}`)
            res.redirect('./')
        }
    }
);

router.post('/leads/:leadID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        const paramsLeadID = Number(req.params.leadID);
        const formData = unflattenObject(req.body)
        console.log(formData)

        async function leadRepositoryQuery() {
            return Leads.find({ leadID: paramsLeadID }).lean()
        }

        const originalLead = await leadRepositoryQuery()
        console.log('Original data:')
        console.log(originalLead)
        console.log('\n')

    }
);

router.get('/leads/:leadID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        const leadID = req.params.leadID;

        try {
            const dataToHidden = await Leads.findOne({ leadID });
            if (!dataToHidden) {
                req.flash('errorMsg', 'Lead não encontrado')
                return res.redirect('/admin/leads')
            }

            dataToHidden.enabled = false;

            await dataToHidden.save()
                .then(async () => {

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: 'lead',
                        affectedData: String(leadID),
                        action: 'excluiu*',
                        category: 'Leads',
                        company: req.session?.selectedCompany?.companyID
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
router.get('/real-estates',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {

        async function searchRealEstates() {
            const realEstates = await RealEstates
                .find({
                    company: req.session?.selectedCompany?._id,
                    enabled: true
                })
                .lean()
                .exec()
            return realEstates
        }

        async function formatRealEstates(realEstates: Record<string, any>[]) {
            const formattedRealStates = realEstates.map(realestate => ({
                media: realestate.media?.[0],
                id: realestate.realEstateID,
                classification: realestate.classification,
                bedrooms: realestate.rooms.bedrooms,
                neighborhood: realestate.address.neighborhood,
                city: realestate.address.city,
                saleValue: realestate.financial.saleValue
            }));
            return formattedRealStates
        }

        try {
            const realEstates = await searchRealEstates()
            const realEstatesForViewPage = await formatRealEstates(realEstates)

            res.render('admin/real-estates/real-estates', { property: realEstatesForViewPage });

        } catch (err) {
            console.error(`Houve um erro ao buscar os dados: ${err}`)
            req.flash('errorMsg', 'Erro interno do servidor.')
            res.redirect('/admin')
        }
    }
);

router.get('/real-estates/new-real-estate',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response, next: NextFunction) => {
        res.render('admin/real-estates/new-real-estate')
    }
);

router.post('/real-estates/new-real-estate/create',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4, 6]),
    upload.single("uploaded_file"),
    async (req: Request, res: Response, next: NextFunction) => {

        const requestData = req.body

        const generateNewRealEstateID = async () => {
            try {
                const latestRealState = await RealEstates
                    .findOne()
                    .sort({ realEstateID: -1 })
                    .exec()

                const newID = latestRealState?.realEstateID
                    ? latestRealState.realEstateID + 1
                    : 1

                return newID

            } catch (error) {
                console.error('Erro ao gerar novo realStateID:', error);
                throw error;
            }
        }

        const generateNewOwnerID = async (): Promise<number> => {
            try {
                const latestOwner = await RealEstates
                    .findOne()
                    .lean()
                    .sort({ "owner.ownerID": -1 })
                    .exec()

                const newID: number = latestOwner?.owner?.ownerID
                    ? latestOwner.owner.ownerID + 1
                    : 1

                return newID
            } catch (error) {
                console.error('Erro ao gerar novo ownerID:', error)
                throw error
            }
        }

        async function verifyUndefinedAndNullFields() {
            const errors = {
                undefined: Object.entries(requestData).some(([key, value]) => value == undefined),
                null: Object.entries(requestData).some(([key, value]) => value == null)
            };
            if (errors.undefined || errors.null) {
                return 'Campos inválidos. Recarregue a página e tente novamente'
            }
            return null
        }

        async function verifyIfMediaWasSended() {
            if (!req.file) {
                return 'Nenhuma mídia foi enviada. Para cadastrar um imóvel, deve ser enviado ao menos uma foto.'
            }
            return null
        }

        async function verifyIfIsValidEmail(email: string) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email == '' || email == null)
                return null  //* email is an optional field. Don't need validation if empty
            return emailRegex.test(email)
                ? null
                : 'Formato de e-mail inválido. Verifique e tente novamente. Exemplos de formato correto: "exemplo@gmail.com | exemplo2@outlook.br"'
        }

        async function verifyNewRealEstateProblems() {
            const problems: (string | null)[] = []
            problems.push(await verifyUndefinedAndNullFields())
            problems.push(await verifyIfMediaWasSended())
            problems.push(await verifyIfIsValidEmail(requestData.email))

            return problems.filter(i => i !== null) as string[]
        }

        async function createPropertyOwnerNestedObject() {
            const ownerName = requestData.name
            const propertyOwner = {
                ownerID: await generateNewOwnerID(),
                name: ownerName.trim(),
                nameSearch: ownerName.trim().toUpperCase(),
                phoneNumber: requestData.phoneNumber,
                email: requestData.email.trim()
            }
            return propertyOwner
        }

        async function createCondominiumNestedObject() {
            const condominium = {
                block: requestData.block,
                internalNumber: requestData.internalNumber,
                floor: requestData.floor
            }
            return condominium
        }

        async function createFinancialNestedObject() {
            const financial = {
                saleValue: requestData.saleValue,
                assessedValue: requestData.assessedValue,
                financingMaxValue: requestData.financingMaxValue,
                exchange: requestData.exchange,
                currency: requestData.currency,
                financeable: requestData.financeable,
                tax: requestData.tax,
                taxFrequency: requestData.taxFrequency,
                taxValue: requestData.taxValue
            }
            return financial
        }

        async function createRoomsNestedObject() {
            const rooms = {
                bedrooms: requestData.bedrooms,
                livingRooms: requestData.livingRooms,
                bathrooms: requestData.bathrooms,
                parkingSpaces: requestData.parkingSpaces
            }
            return rooms
        }

        async function createAddressNestedObject() {
            const address = {
                locationCode: requestData.locationCode,
                street: requestData.street,
                streetNumber: requestData.streetNumber,
                complement: requestData.complement,
                neighborhood: requestData.neighborhood,
                region: requestData.region,
                city: requestData.city,
                state: requestData.state,
                country: requestData.country,
            }
            return address
        }

        async function separateNoNestedFieldsForNewRealEstate() {
            const noNestedFieldsFromRequest = [
                'classification',
                'rentalOrSale',
                'propertySituation',
                'commercialSituation',
                'description',
                'landArea',
                'builtUpArea',
                'face',
                'publish'
            ]
            const noNestedFields = Object.fromEntries(Object.entries(requestData)
                .filter(([key]) => noNestedFieldsFromRequest.includes(key)))
            return noNestedFields
        }

        async function setDBReferencesForNewRealEstate(newRealEstate: Record<string, any>) {
            newRealEstate.realEstateID = await generateNewRealEstateID()
            newRealEstate.company = req.session?.selectedCompany?._id
            newRealEstate.userCreator = req.user?._id
            return newRealEstate
        }

        async function fillNestedFieldsForNewRealEstate(newRealEstate: Record<string, any>) {
            newRealEstate.owner = await createPropertyOwnerNestedObject()
            newRealEstate.condominium = await createCondominiumNestedObject()
            newRealEstate.financial = await createFinancialNestedObject()
            newRealEstate.rooms = await createRoomsNestedObject()
            newRealEstate.address = await createAddressNestedObject()
            return newRealEstate
        }

        //* Req.body send us a no-nested file. We need to organize before store it in MongoDB
        async function createNewRealEstateObject() {
            const noREFnoNESTEDNewRealEstate: Record<string, any> = await separateNoNestedFieldsForNewRealEstate()
            const noNESTEDNewRealEstate = await setDBReferencesForNewRealEstate(noREFnoNESTEDNewRealEstate)
            const newRealEstate = await fillNestedFieldsForNewRealEstate(noNESTEDNewRealEstate)
            return newRealEstate
        }

        const newRealEtateProblems = await verifyNewRealEstateProblems()

        if (newRealEtateProblems.length > 0) {
            req.flash('errorMsg', newRealEtateProblems[0]);
            return res.redirect('/admin/real-estates');
        }

        const newRealEstate = new RealEstates(await createNewRealEstateObject())

        await uploadMedia(req.file!, newRealEstate)
            .then()
            .catch((err) => {
                err instanceof Error
                    ? req.flash('errorMsg', `Erro ao salvar imagem: ${err.message}`)
                    : req.flash('errorMsg', `Erro ao salvar imagem: ${err}`)
                return res.redirect('/admin/real-estates');
            })

        await newRealEstate.save()
            .then(async () => {
                const recordInfo: ISendedRecord = {
                    userWhoChanged: String(req.user?.userID),
                    affectedType: 'imóvel',
                    affectedData: String(newRealEstate.realEstateID),
                    action: 'criou',
                    category: 'Imóveis',
                    company: req.session?.selectedCompany?.companyID
                }

                await createRecord(recordInfo, req)

                req.flash('successMsg', 'Imóvel cadastrado com sucesso!');
            })
            .catch((err: any) => {
                req.flash('errorMsg', `Não foi possível salvar os dados: ${err}`)
            })

        return res.redirect('/admin/real-estates');
    }
);

router.get('/real-estates/:realEstateID',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4, 6]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const realEstateID = Number(req.params.realEstateID)

            const realEstateForViewPage = await RealEstates.findOne({ realEstateID }).lean()

            if (!realEstateForViewPage || !realEstateForViewPage.media) {
                req.flash('errorMsg', `Imóvel não encontrado em sua base.`);
                return res.redirect('/admin/real-estates');
            }

            res.render('admin/real-estates/real-estate-info', realEstateForViewPage)

        } catch (err) {
            req.flash('errorMsg', `Houve um erro interno no servidor ao buscar o lead: ${err}`);
            res.redirect('/admin/real-estates')
        }
    }
);

router.post('/real-estates/:realEstateID/update',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4, 6]),
    async (req: Request, res: Response) => {

        //* ---------- STEP 1: keep front-end data
        const paramsRealEstateID = Number(req.params.realEstateID)
        const formData = unflattenObject(req.body)
        console.log(formData)

        //* ---------- STEP 2: search the current object in DB
        async function realEstateRepositoryQuery() {
            return RealEstates.findOne({ realEstateID: paramsRealEstateID }).lean()
        }

        const originalRealEstate = await realEstateRepositoryQuery()
        console.log('Original data:')
        console.log(originalRealEstate)
        console.log('\n')

        //* ---------- STEP 3: return error if current object don't exists
        if (!originalRealEstate) {
            req.flash('errorMsg', 'Dado não encontrado na base.')
            return res.redirect('/admin/real-estates')
        }

        //* ---------- STEP 4: set the keys that can be updated by form
        const {
            _id,
            realEstateID,
            media,
            userCreator,
            company,
            createdAt,
            updatedAt,
            enabled,
            ...originalRealEstateOnlyChangeableFields
        } = originalRealEstate

        //* ---------- STEP 5: compare the objects and return the different fields
        const differencesToUpdate = compareObjects(originalRealEstateOnlyChangeableFields, formData)
        console.log(differencesToUpdate)

        //* ---------- STEP 6: create the update object with the fields changed
        //* ---------- STEP 7: update the object in the DB
        //* ---------- STEP 8: create the records for each changed field
        //* ---------- STEP 9: redirect the user or return error

    }
);

router.get('/real-estates/:realEstateID/hidden',
    ensureAuthenticated,
    ensureRole([0, 1, 2, 3, 4]),
    async (req: Request, res: Response) => {

        const realEstateID = Number(req.params.realEstateID)

        try {
            const dataToHidden = await RealEstates.findOne({ realEstateID })
            if (!dataToHidden) {
                req.flash('errorMsg', 'Não foi possível excluir o imóvel: Vazio inesperado')
                return res.redirect('/admin/real-estates')
            }

            dataToHidden.enabled = false;

            await dataToHidden.save()
                .then(async () => {

                    const recordInfo: ISendedRecord = {
                        userWhoChanged: String(req.user?.userID),
                        affectedType: 'imóvel',
                        affectedData: String(realEstateID),
                        action: 'excluiu*',
                        category: 'Imóveis',
                        company: req.session?.selectedCompany?._id
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

        res.redirect('/admin/real-estates')
    }
);

export default router