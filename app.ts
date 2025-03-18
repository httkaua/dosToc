const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const app = express();

const Handlebars = require('handlebars');
const { engine } = require('express-handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const mongoose = require('mongoose');

const User = require('./routes/User');
const Admin = require('./routes/Admin');

const passport = require('passport');
const bodyParser = require('body-parser');
require('./helpers/Auth')(passport);

require("dotenv").config()

    // Config

        // Session
        app.use(
            session({
                secret: 'isso ai eu resolv0 em dostoc',
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
        mongoose.connect('mongodb://localhost/dosTocDB').then(() => {
            console.log('connected to mongodb with success')
        }).catch((err) => {
            console.log(`There was an error connecting to mongoDB: ${err}`);
        });
            
        // Handlebars
        app.engine('handlebars', engine({
            defaultLayout: 'main', // in views/layouts
            handlebars: allowInsecurePrototypeAccess(Handlebars)
        }));
        app.set('view engine', 'handlebars');
        app.set('views', './views');

        // Body-parser
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(express.json());



app.get('/', async (req, res) => {
    res.render('user/home')
})

app.use('/user', User);
app.use('/admin', Admin);

// Listen in a PORT of computer
app.listen(8088, 'localhost', () => {
    console.log(`Running in PORT 8088`)
})