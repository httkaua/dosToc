import { Strategy as LocalStrategy } from "passport-local";
import mongoose, { Document, Schema } from "mongoose"
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import Users, { IUser } from "../models/UserSchema.js"

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction): asserts req is Request & { user: IUser } {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('errorMsg', 'Você precisa estar logado para acessar.');
  res.redirect('/user/signin');
}

export function ensureRole(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      req.flash('errorMsg', 'Você precisa estar logado para acessar esta página.');
      return res.redirect('/user/login');
    }

    const userRoles = req.user?.position ? [req.user.position.toString()] : [];

    if (userRoles.some(role => allowedRoles.includes(role))) {
      return next();
    }

    req.flash('errorMsg', 'Você não tem permissão para acessar esta página.');
    res.redirect('/admin');
  };
}

export default function (passport: typeof import("passport")): void {
  passport.use(new LocalStrategy({
    usernameField: 'signUserEmail',
    passwordField: 'signUserPassword'
  }, (email: string, password: string, done) => {
    Users.findOne({ email }).then(user => {
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

  passport.serializeUser((user: IUser, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: string, done) => {
    Users.findById(id).then(user => done(null, user)).catch(err => done(err));
  });
}
