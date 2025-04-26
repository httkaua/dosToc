import express from "express";
/* TS */ import { Request, Response, NextFunction } from "express"; 
import flash from "express-flash";
import session from "express-session";
import Handlebars from "handlebars";
import { engine } from "express-handlebars";
import mongoose from "mongoose";
import passport from "passport";
import dotenv from "dotenv";
dotenv.config()
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import User from "./routes/User.js";
import Admin from "./routes/Admin.js";
import authHelper from "./helpers/Auth.js";

const app = express();
authHelper(passport);

// Config

        // Session
        app.use(session({
            secret: process.env.SESSION_SECRET!,
            resave: true,
            saveUninitialized: true
        }));

        // Passport
        app.use(passport.initialize());
        app.use(passport.session());

        // Flash
        app.use(flash());

        // Helmet
        app.use(
            helmet.contentSecurityPolicy({
              directives: {
                defaultSrc: ["'self'"],
                /* AXIOS */ scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                /* SEARCH CEP */ connectSrc: ["'self'", "https://viacep.com.br"],
              }
            })
          )

        // User module for TS
        declare module 'express' {
            interface User {
                userID: String,
                firstName: String,
                lastName: String,
                company: String,
                email: String,
                password: String,
                createdAt: Date,
                updatedAt: Date,
                position: String,
                managers: Array<String>,
                underManagement: Array<String>,
                document: String,
                phone: String,
                hidden: Boolean
            }

            interface Request {
                user?: User;
              }
        }

        // Globals
        app.use((req: Request, res: Response, next: NextFunction) => {
            res.locals.successMsg = req.flash('successMsg');
            res.locals.errorMsg = req.flash('errorMsg');
            res.locals.user = req.user || null;
            next();
        });

        // Static paths
        app.use(express.static('public'));
        app.use('/uploads', express.static('uploads'));

        // Mongoose
        try {
            await mongoose.connect(process.env.DATABASE_URL || null);
            console.log('Connected to MongoDB with success');
        } catch (err) {
            console.error(`Error connecting to MongoDB: ${err.message}`);
            process.exit(1);
        }

        // Rate Limiter
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100, // 100 requires in 15 minutes
            message: "Muitas requisições. Tente novamente mais tarde."
        });
        app.use(limiter);

        // Handlebars
        app.engine('handlebars', engine({
            defaultLayout: 'main',
            helpers: {
                is400: (err: number) => err == 400,
                is401: (err: number) => err == 401,
                is403: (err: number) => err == 403,
                is404: (err: number) => err == 404,
                is500: (err: number) => err == 500,
                is503: (err: number) => err == 503,
                formatPhone: (phone: string) => {
                    phone = phone.replace(/\D/g, '');
                    if (phone.length === 11) {
                        const ddd = phone.slice(0, 2);
                        const parte1 = phone.slice(2, 7);
                        const parte2 = phone.slice(7);
                        return `(${ddd}) ${parte1}-${parte2}`;
                    }
                    return phone;
                }
            }
        }));
        app.set('view engine', 'handlebars');
        app.set('views', './views');


        // Body parser
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));



app.get('/', async (req: Request, res: Response) => {
    try {
        const Users = mongoose.model('users');
        const userPlained = await Users.findOne({ userID: req.user?.userID }).lean();

        res.render('user/home', { user: userPlained });
    } catch (error) {
        res.render('user/home', { user: null });
    }
});

app.use('/user', User);
app.use('/admin', Admin);

// Catch-all for HTTP errors
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).render('errorHTTP', { error: 404 });
});

// HTTP error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const errStatus = err.status || 500;
    res.status(errStatus).render('errorHTTP', { error: errStatus });
});

try {
    app.listen(8088, 'localhost', () => {
        console.log(`Running on PORT 8088`);
    });
} catch (err) {
    console.error('Erro ao iniciar servidor:', err.message);
}