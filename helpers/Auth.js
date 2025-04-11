import { Strategy as localStrategy } from "passport-local"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

import "../models/UserSchema.js"
const User = mongoose.model('users');

export function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('errorMsg', 'Você precisa estar logado para acessar.');
    res.redirect('/user/signin');
}

export function ensureRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.flash('errorMsg', 'Você precisa estar logado para acessar esta página.');
            return res.redirect('/user/login');
        }

        const userRoles = Array(req.user.position);

        if (userRoles && userRoles.some(role => allowedRoles.includes(role))) {
            return next();
        }

        req.flash('errorMsg', 'Você não tem permissão para acessar esta página.');
        res.redirect('/');
    };
}

export default function (passport) {
    passport.use(new localStrategy({
        usernameField: 'signUserEmail',
        passwordField: 'signUserPassword'
    }, (email, password, done) => {
        User.findOne({ email }).then(user => {
            if (!user) {
                return done(null, false, { message: 'Esta conta não existe!' });
            }

            bcrypt.compare(password, user.password, (err, ok) => {
                if (ok) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Senha incorreta!' });
                }
            });
        }).catch(err => done(err));
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id).then(user => done(null, user)).catch(err => done(err));
    });
}
