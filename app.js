import express from "express"
import flash from "express-flash"
import session from "express-session"
const app = express();

import Handlebars from "handlebars"
import { engine } from "express-handlebars"

import mongoose from "mongoose"

import User from "./routes/User.js"
import Admin from "./routes/Admin.js"

import passport from "passport"
import authHelper from "./helpers/Auth.js"
authHelper(passport)

import dotenv from "dotenv/config"

    // Config

        // Session
        app.use(
            session({
                secret: process.env.SESSION_SECRET,
                resave: true,
                saveUninitialized: true
            })
        );

        // Passport
        app.use(passport.initialize());
        app.use(passport.session());

        // Flash
        app.use(flash());
        
        // Globals
        app.use((req, res, next) => {
            res.locals.successMsg = req.flash('successMsg');
            res.locals.errorMsg = req.flash('errorMsg');
            res.locals.user = req.user || null;
            next();
        });

        // Static paths
        app.use(express.static('public'));
        app.use('/uploads', express.static('uploads'));
        
        // Mongoose
        mongoose.connect(process.env.DATABASE_URL).then(() => {
            console.log('connected to mongodb with success')
        }).catch((err) => {
            console.log(`There was an error connecting to mongoDB: ${err}`);
        });
            
        // Handlebars
        app.engine('handlebars', engine({
            defaultLayout: 'main' // in views/layouts
        }));
        app.set('view engine', 'handlebars');
        app.set('views', './views');
        

        // Body-parser
        app.use(express.json());
        app.use(express.urlencoded({extended: true}));



app.get('/', async (req, res) => {
    res.render('user/home')
})

app.use('/user', User);
app.use('/admin', Admin);

// Listen in a PORT of computer
app.listen(8088, 'localhost', () => {
    console.log(`Running in PORT 8088`)
})