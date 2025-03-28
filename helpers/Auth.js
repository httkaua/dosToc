const localStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('../models/UserSchema');
const User = mongoose.model('users');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('errorMsg', 'Você precisa estar logado para acessar.');
    res.redirect('/user/signin');
}

function ensureRole(allowedRoles) {
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

module.exports = function (passport) {
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
};

module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.ensureRole = ensureRole;
