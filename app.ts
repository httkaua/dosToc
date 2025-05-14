//* Express libraries
import express, { Request, Response, NextFunction } from "express";
const app = express();
import flash from "express-flash";
import session from "express-session";
import { engine } from "express-handlebars";
import rateLimit from 'express-rate-limit';

//* Security and database libraries
import mongoose, { Error } from "mongoose";
import passport from "passport";
import dotenv from "dotenv";
dotenv.config()
import helmet from 'helmet';

//* References (Routes, Helpers, Models)
import User from "./routes/User.js";
import Admin from "./routes/Admin.js";
import authHelper from "./helpers/Auth.js";
authHelper(passport);
import Users, { IUser } from "./models/UserSchema.js"

//* Config

        //* Ensure variables for TS
        if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
            throw new Error("Missing variable in environment variables");
        }

        //* Session
        app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: true,
            saveUninitialized: true
        }));

        //* Passport
        app.use(passport.initialize());
        app.use(passport.session());

        //* Flash
        app.use(flash());

        //* Helmet
        app.use(
            helmet.contentSecurityPolicy({
              directives: {
                defaultSrc: ["'self'"],
                /* AXIOS */ scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                /* SEARCH CEP */ connectSrc: ["'self'", "https://viacep.com.br"],
              }
            })
          )

        //* User module for TS
        declare global {
            
            //* Extending Express.js Types settings
            namespace Express {
                interface User extends IUser { }

                //* Creating req.user (if authenticated)
                interface Request {
                    user?: User;
                  }
            }
        }

        //* Request variables
        app.use((req, res, next) => {
            res.locals.successMsg = req.flash('successMsg');
            res.locals.errorMsg = req.flash('errorMsg');
            res.locals.user = req.user || null;
            next();
        });

        //* Static paths
        app.use(express.static('public'));
        app.use('/uploads', express.static('uploads'));

        //* Mongoose (MongoDB)
        try {
            await mongoose.connect(process.env.DATABASE_URL);
            console.log('Connected to MongoDB with success');
        } catch (err) {
            err instanceof Error ? 
            console.error(`Error connecting to MongoDB: ${err.message}`) : 
            console.error(`Unknown error connecting to MongoDB: ${err}`)

            process.exit(1);
        }

        //* Rate Limiter
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100, // 100 requires in 15 minutes
            message: "Muitas requisições. Tente novamente mais tarde."
        });
        app.use(limiter);

        //* Handlebars
        app.engine('handlebars', engine({
            defaultLayout: 'main',
            helpers: {
                //* HTTP common error status
                is400: (err: number) => err == 400,
                is401: (err: number) => err == 401,
                is403: (err: number) => err == 403,
                is404: (err: number) => err == 404,
                is500: (err: number) => err == 500,
                is503: (err: number) => err == 503,
                formatPhone: (phone: string) => {
                    //* (81) 81818-1818 
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

        //* Body parser
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));



app.get('/', async (req: Request, res: Response) => {
    try {
        const userPOJO = await Users.findOne({ userID: req.user?.userID }).lean();
        const userJSON = JSON.stringify(userPOJO)

        res.render('user/home', { user: userJSON });
    } catch (error) {
        res.render('user/home', { user: null });
    }
});

//* Config routes (need to de defined after main route)
app.use('/user', User);
app.use('/admin', Admin);

//* Catch-all for HTTP errors
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).render('errorHTTP', { error: 404 });
});

//* HTTP error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const errStatus = err.status || 500;
    res.status(errStatus).render('errorHTTP', { error: errStatus });
});

//* Listen
try {
    app.listen(8088, 'localhost', () => {
        console.log(`Running on PORT 8088`);
    });
} catch (err) {
    err instanceof Error
    ? console.error('Erro ao iniciar servidor:', err.message)
    : console.error('Erro ao iniciar servidor:', err)
    process.exit(1);
}