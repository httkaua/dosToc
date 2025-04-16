import express from "express"
const router = express.Router();
import bcrypt from "bcrypt"
import passport from "passport"
import mongoose from "mongoose"
import createRecord from "../helpers/newRecord.js"

import "../models/UserSchema.js"
const Users = mongoose.model('users');

import "../models/RecordsSchema.js"
const Records = mongoose.model('records');


router.get('/', async (req, res, next) => {
    /*
    Unused route, then redirect to admin to authentication verify
    */
    res.redirect('/admin')
});

router.get('/signin', async (req, res, next) => {
    res.render('user/signin');
});

router.post('/signin/authentication', async (req, res, next) => {

    try {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                req.flash('errorMsg', 'Erro 3006 - Houve um erro durante a autenticação.');
                return res.redirect('./');
            }
            if (!user) {
                req.flash('errorMsg', info.message || '1010 - Credenciais inválidas.');
                return res.redirect('./');
            }
            req.logIn(user, (err) => {
                if (err) {
                    req.flash('errorMsg', '3007 - Ocorreu um erro durante o LogIn.');
                    return res.redirect('./');
                }
                req.flash('successMsg', 'Seja bem-vindo!');
                return res.redirect('/admin');
            });
        })(req, res, next);
    } catch (err) {
        req.flash('errorMsg', `Ocorreu um erro interno: ${err}`)
    }
});

router.get('/register', async (req, res, next) => {
    res.render('user/register');
});

// Optimize this code
router.post('/newaccount', async (req, res, next) => {

    const newAccErrors = [];

    // REQs from HTML Form
    let claimantNewID = null;
    const claimantFtName = req.body.claimantFirstName;
    const claimantLtName = req.body.claimantLastName;
    const claimantPhone = req.body.claimantPhone;
    const claimantCompany = req.body.claimantCompany;
    const claimantEmail = req.body.claimantEmail;
    const claimantPassw = req.body.claimantPassword;
    const claimantPasswConfirm = req.body.claimantPasswordConfirm;

    const numbPsw = (claimantPassw.match(/\d/g) || []).length

    async function findEmail(claimantEmail) {
        try {
            const user = await Users.findOne({email: claimantEmail})
            return !!user // convert to boolean
        } catch (err) {
            throw new Error(`There was an error parsing email: ${err}`);
        }
    }

    // Special characters count
    function sCharacters (str) {
        const specialChar = /[^a-zA-Z0-9\s]/g;
        const matches = str.match(specialChar);
        return matches ? matches.length : 0
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

    // Validations from Form below

    // Password different from confirmation 
    if (claimantPassw !== claimantPasswConfirm) {
        newAccErrors.push({text: `A senha é diferente da confirmação de senha.`})
    }
    
    // Undefined inputs
    if (claimantFtName == undefined ||
        claimantLtName == undefined ||
        claimantPhone == undefined ||
        claimantCompany == undefined ||
        claimantEmail == undefined ||
        claimantPassw == undefined ||
        claimantPasswConfirm == undefined
    ) {
        newAccErrors.push({text: 'Erro 1004 - Campos indefinidos. Preencha todos os campos corretamente.'});
    }

    // Null inputs
    if (
        claimantFtName == null ||
        claimantLtName == null ||
        claimantPhone == null ||
        claimantCompany == null ||
        claimantEmail == null ||
        claimantPassw == null ||
        claimantPasswConfirm == null
    ) {
        newAccErrors.push({text: 'Erro 1005 - Campos nulos. Preencha todos os campos corretamente.'})
    }

    // Empty inputs
    if (
        !claimantFtName ||
        !claimantLtName ||
        !claimantPhone ||
        !claimantCompany ||
        !claimantEmail ||
        !claimantPassw ||
        !claimantPasswConfirm
    ) {
        newAccErrors.push({text: 'Erro 1006 - Campos vazios. Preencha todos os campos corretamente.'})
    }
    
    // Too short passwords
    if (
        claimantPassw.length < 8
    ) {
        newAccErrors.push({text: 'Erro 1007 - Senha muito curta. Crie uma senha de ao menos 8 caracteres.'});
    }
    
    // Weak passwords
    if (numbPsw < 1 || sCharacters(claimantPassw) < 1) {
        newAccErrors.push({text: 'Erro 1008 - Senha muito fraca. É necessário ao menos um número e um caractere especial (exemplos: &, %, $, #, @)'})
    }

        // If it got some error
        if (newAccErrors.length > 0) {
            const errorMessages = newAccErrors.map(error => error.text);
            req.flash('errorMsg', errorMessages[0]); // passar um erro por vez
            res.redirect('register');
            return;
        }

        // Any error in the HTML Form
        else {

            // Email already used.
            if (await findEmail(claimantEmail) == true) {

                req.flash('errorMsg', 'Erro 1009 - Este e-mail já está sendo usado.')
                return res.redirect('register')
            }

            // Allright, creating account in the database

            else {

                const newAcc = new Users({
                    userID: await generateNewUserID(),
                    firstName: claimantFtName,
                    lastName: claimantLtName,
                    phone: claimantPhone,
                    email: claimantEmail,
                    position: 'Diretor de imobiliária',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // generating hash
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        req.flash('errorMsg', `Erro 3004 - Houve um erro ao gerar SALT: ${err}`)
                        return res.redirect('register')
                    }

                    bcrypt.hash(claimantPassw, salt, (err, hash) => {
                        if (err) {
                            req.flash(`errorMsg', 'Erro 3005 - Houve um erro ao gerar HASH: ${err}`)
                            return res.redirect('register');
                        };

                        newAcc.password = hash;

                        newAcc.save()
                        .then(async () => {
                            req.flash('successMsg', 'Usuário criado com sucesso!');

                            // Adding to records
                            const recordInfo = {
                                userWhoChanged: newAcc.userID,
                                affectedType: 'usuário',
                                affectedData: newAcc.userID,
                                action: 'criou',
                                category: 'Usuários'
                            }

                            await createRecord(recordInfo);

                            return res.redirect('signin');
                        })
                        .catch((err) => {
                            req.flash('errorMsg', `Erro 2004 - Houve um erro ao salvar os dados: ${err}`)
                            return res.redirect('register');
                        });
                    });
                });

            }
            
        }

});

router.get('/forgot-password', async (req, res, next) => {
    res.render('admin/forgot-password');
});

export default router