//* Libraries
import { Router, Request, Response, NextFunction } from "express";
const router = Router();
import bcrypt from "bcrypt"
import passport from 'passport';

//* References
import createRecord from "../helpers/newRecord.js"
import Users, { IUser } from "../models/UserSchema.js"
import { ISendedRecord } from "../models/@types_ISendedRecord.js"



//TODO: Main style page announcing Dostoc
router.get('/',
    async (req: Request, res: Response, next: NextFunction) => {
    res.render('user/signin');
});

router.get('/signin',
    async (req: Request, res: Response, next: NextFunction) => {
    res.render('user/signin');
});

router.post('/signin/authentication',
    (req: Request, res: Response, next: NextFunction) => {

    function getAuthErrorMessage(err: Error | null, user?: Express.User): string | null {
        if (err) return 'Erro 3006 - Houve um erro durante a autenticação.';
        if (!user) return '1010 - Credenciais inválidas.';
        return null;
    }

    //* Login process
    function loginUser(req: Request, res: Response, user: Express.User): void {
        req.logIn(user, (errLog) => {
            if (errLog) {
                console.error('Erro no req.logIn:', errLog);
                req.flash('errorMsg', '3007 - Ocorreu um erro durante o LogIn.');
                return res.redirect('/user/signin/');
            }

            req.flash('successMsg', 'Seja bem-vindo!');
            return res.redirect('/admin');
        });
    }

        passport.authenticate(
            'local',
            (err: Error | null, user: Express.User, info: { message?: string }) => {
                const errorMsg = getAuthErrorMessage(err, user);

                if (errorMsg) {
                    console.warn('Falha na autenticação:', info?.message || errorMsg);
                    req.flash('errorMsg', errorMsg);
                    return res.redirect('/user/signin/');
                }

                loginUser(req, res, user);
            }
        )(req, res, next);
    }
);

router.get('/register',
    async (req: Request, res: Response, next: NextFunction) => {
    res.render('user/register');
});

router.post('/newaccount',
    async (req: Request, res: Response, next: NextFunction) => {

    const formErrors: string[] = [];

    const form: IUser = req.body

    async function verifyFormErrors (form: IUser): Promise<string | null> {

        if (form.password !== form.passwordConfirm) {
            formErrors.push(`A senha é diferente da confirmação de senha.`)
        }

        if(Object.entries(form)
            .some(([key, value]) => value == undefined || null || '')) {
            formErrors.push('Erro 1004 - Preencha todos os campos para prosseguir.');
        }

        if (form.password.length < 8) {
            formErrors.push('Erro 1007 - Senha muito curta. Crie uma senha de ao menos 8 caracteres.');
        }

        // Weak passwords
        if (await strongPassword(form.password) == false) {
            formErrors.push('Erro 1008 - Senha muito fraca. É necessário ao menos um número e um caractere especial (exemplos: &, %, $, #, @)')
        }

        if (await freeEmail(form.email) == false) {
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

    async function strongPassword(password: string) {
        const numberCount = (password.match(/\d/g) || []).length

        if (numberCount < 1 || checkSpecialChar(password) < 1) {
            return false
        }
        else {
            return true
        }

    }

    function checkSpecialChar (password: string) {
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

    function normalizeName(name: string): string {
    return name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');
    }
    
    //* To be stored in database
    const generateNewUserID = async () => {
        try {

        const latestUser = await Users.findOne().sort({ userID: -1 }).lean().exec();
        const newID = latestUser && latestUser.userID 
            ? latestUser.userID + 1 
            : 20000;
        return newID;

        } catch (error) {
        console.error('Erro ao gerar novo userID:', error);
        throw error;
        }
    };

    const checkForm = await verifyFormErrors(form)

    if (checkForm !== null) {
        req.flash('errorMsg', `${checkForm}`)
        console.log(checkForm)
        return res.redirect('register')
    }

    const newUser = new Users({
        ...req.body,
        userID: await generateNewUserID(),
        nameSearch: normalizeName(form.name),
        position: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    //* generating hash
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            req.flash('errorMsg', `Erro 3004 - Houve um erro ao gerar SALT: ${err}`)
            console.log(err)
            return res.redirect('/user/register')
        }

        bcrypt.hash(newUser.password, salt, async (err, hash) => {
            if (err) {
                req.flash(`errorMsg', 'Erro 3005 - Houve um erro ao gerar HASH: ${err}`)
                console.log(err)
                return res.redirect('/user/register');
            };

            console.log(newUser.password)
            console.log(hash)
            newUser.password = hash;

            await newUser.save()
            .then(async () => {
                req.flash('successMsg', 'Usuário criado com sucesso!');

                // Adding to records
                const recordInfo: ISendedRecord = {
                    userWhoChanged: newUser.userID.toString(),
                    affectedType: 'usuário',
                    affectedData: newUser.userID.toString(),
                    action: 'criou',
                    category: 'Usuários'
                }

                await createRecord(recordInfo, req);

                return res.redirect('/user/signin');
            })
            .catch((err: Error) => {
                req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                console.log(err)
                return res.redirect('/user/register');
            });
        });
    });
});

router.get('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    res.render('admin/forgot-password');
});

export default router