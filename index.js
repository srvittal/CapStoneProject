const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
let cookieParser = require('cookie-parser')
const session = require('express-session');
const path = require('path');
const i18n = require("i18n-express");
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const gcal = require('./googleCal');
const config = require('./APIKEY');

const app = express();

let hbs = exphbs.create({
    layoutsDir: './views/layouts',
    helpers: {}
});

app.engine('handlebars', hbs.engine);

app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser())

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

app.use(i18n({
    translationsPath: path.join(__dirname, 'i18n'),
    cookieLangName: 'prefLang',
    defaultLang: "en",
    siteLangs: ["en", "zu", "af", "xh", "nso"],
    textsVarName: 'translation',
}));

open({
    filename: './patient_database.db',
    driver: sqlite3.Database
}).then(async function (db) {

    // run migrations

    await db.migrate();

    // only setup the routes once the database connection has been established

    app.get('/', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        // await db.all('SELECT * FROM customer')
        //     .then(function (customer) {
        //         console.log(customer);
        //     });
        res.render('landingPage', {
            layouts: 'main',
        });
    });

    app.post('/', function (req, res) {
        req.session.prefLang = req.body.prefLang
        res.cookie('prefLang', req.session.prefLang);
        req.cookies.lastRoute
        if (req.cookies.lastRoute == "/") {
            res.redirect("/?clang=" + req.session.prefLang);

        } else {
            res.redirect(req.cookies.lastRoute + "/?clang=" + req.session.prefLang);
        }
    });

    app.get('/login', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        res.render('login', {
            layouts: 'main',
            login_Message: req.session.message
        });
    });

    app.post('/login', async function (req, res) {

        if (req.body.login == 'true') {
            req.session.username = '';
            req.session.password = '';

            await db.all('SELECT * FROM patient_login WHERE IDno = ? AND Pwd = ?', req.body.username, req.body.password)
                .then(function (patient_login) {
                    if (patient_login.length != 0) {
                        req.session.username = patient_login[0].IDno;
                        req.session.password = patient_login[0].Pwd;
                        req.session.firstName = patient_login[0].Firstname;
                        req.session.lastName = patient_login[0].Lastname;
                        req.session.number = patient_login[0].ConNo;
                        req.session.email = patient_login[0].Email;
                        req.session.prefLang = patient_login[0].LangPref;

                        res.cookie('prefLang', req.session.prefLang);
                        res.cookie('firstName', req.session.firstName);
                        res.cookie('lastName', req.session.lastName);
                        res.cookie('number', req.session.number);
                        res.cookie('email', req.session.email);

                        res.redirect('/service');
                    } else {
                        req.session.username = ' ';
                        req.session.password = ' ';
                        req.session.message = ' ';
                        res.redirect('/login');
                    }
                });
        } else if (req.body.back == 'true') {
            res.redirect('/');
        }

    });

    app.get('/register', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        res.render('registration', {
            layouts: 'main',
        });
    });

    app.post('/register', async function (req, res) {
        let register = 'INSERT INTO patient_login(Firstname, Lastname, DOB, Gender, IDno, ConNo, Email, LangPref, Pwd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        await db.run(register, req.body.firstName, req.body.lastName, req.body.DOB, req.body.gender, req.body.IDno, req.body.cellNo, req.body.email, req.body.language, req.body.password);

        res.redirect('/login');
    });

    app.post('/back', async function (req, res) {
        res.redirect('/');
    });

    app.get('/service', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        res.render('service', {
            layouts: 'main',
        });
    });

    app.get('/medication', function (req, res) {
        req.session.status = "Packed - Ready for Collection/Delivery";
        res.cookie('lastRoute', req.route.path);
        res.render('med', {
            layouts: 'main',
            firstname: req.cookies.firstName,
            surname: req.cookies.lastName,
            number: req.cookies.number,
            email:req.cookies.email,
            Doctor: "Dr Baloyi",
            pDate: "26 Oct 2021",
            pRepeat: "6 Months",
            repeatRemain: "5 Months",
            medStatus: req.session.status
        });
    });

    app.post('/collect', function(req, res){
        res.cookie('lastRoute', req.route.path);
        req.session.status = "Set for Collection"
        res.render('med', {
            layouts: 'main',
            firstname: req.cookies.firstName,
            surname: req.cookies.lastName,
            number: req.cookies.number,
            email: req.cookies.email,
            Doctor: "Dr Baloyi",
            pDate: "26 Oct 2021",
            pRepeat: "6 Months",
            repeatRemain: "5 Months",
            medStatus: req.session.status
        });
    });

    app.get('/collect', function(req, res){
        res.cookie('lastRoute', req.route.path);
        req.session.status = "Set for Collection"
        res.render('med', {
            layouts: 'main',
            firstname: req.cookies.firstName,
            surname: req.cookies.lastName,
            number: req.cookies.number,
            email: req.cookies.email,
            Doctor: "Dr Baloyi",
            pDate: "26 Oct 2021",
            pRepeat: "6 Months",
            repeatRemain: "5 Months",
            medStatus: req.session.status
        });
    });

    app.post('/deliver', function(req, res){
        res.cookie('lastRoute', req.route.path);
        req.session.status = "Set for Delivery"
        res.render('med', {
            layouts: 'main',
            firstname: req.cookies.firstName,
            surname: req.cookies.lastName,
            number: req.cookies.number,
            email: req.cookies.email,
            Doctor: "Dr Baloyi",
            pDate: "26 Oct 2021",
            pRepeat: "6 Months",
            repeatRemain: "5 Months",
            medStatus: req.session.status
        });
    });

    app.get('/deliver', function(req, res){
        res.cookie('lastRoute', req.route.path);
        req.session.status = "Set for Delivery"
        res.render('med', {
            layouts: 'main',
            firstname: req.cookies.firstName,
            surname: req.cookies.lastName,
            number: req.cookies.number,
            email: req.cookies.email,
            Doctor: "Dr Baloyi",
            pDate: "26 Oct 2021",
            pRepeat: "6 Months",
            repeatRemain: "5 Months",
            medStatus: req.session.status
        });
    });

    app.get('/new_appointment', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        res.render('new_appoint', {
            layouts: 'main',
            username: req.cookies.firstName + " " + req.cookies.lastName,
            symptoms: req.cookies.gcalSymp,
            diagnosis: req.cookies.gcalDiag,
        });
    });

    app.post('/new_appointment', function (req, res) {
        let start = req.cookies.gcalStart;
        let end = req.cookies.gcalEnd;
        let symptom = req.cookies.gcalSymp;
        let diagnosis = req.cookies.gcalDiag;

        let event = {
            'summary': `Appointment for ` + req.cookies.firstName + " " + req.cookies.lastName,
            'description': `Patient Name: ${req.cookies.firstName} ${req.cookies.lastName}\nID no.: ${req.session.username}\nSymptoms: ${symptom}\nPossible Diagnosis: ${diagnosis}`,
            'start': {
                'dateTime': start.toString(),
                'timeZone': 'Africa/Johannesburg'
            },
            'end': {
                'dateTime': end.toString(),
                'timeZone': 'Africa/Johannesburg'
            }
        };

        gcal.insertEvent(event);
        res.redirect('/new_appointment')
    });

    app.get('/followUp', function (req, res) {
        res.cookie('lastRoute', req.route.path);
        res.cookie('Token', config.TOKEN._W);
        res.render('followUp', {
            layouts: 'main',
        });
    });

});

const PORT = process.env.PORT || 2021;

app.listen(PORT, function () {
    console.log('App started at port:' + PORT);
})