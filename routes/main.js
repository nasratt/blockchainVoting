var express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
var conn = require('../database');
var getAge = require('get-age');
var nodemailer = require('nodemailer');

var router = express.Router();

const USER = process.env.USER;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const REDIRECT_URL = process.env.REDIRECT_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: `${USER}`,
    accessToken: `${ACCESS_TOKEN}`,
    clientId: `${CLIENT_ID}`,
    clientSecret: `${CLIENT_SECRET}`,
    refreshToken: `${REFRESH_TOKEN}`
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (emailOptions) => {
  try {
    await transporter.sendMail(emailOptions);
  } catch (err) {
    console.log(err);
  }
};

router.get('/form', function (req, res, next) {
  // res.render('voter-registration.ejs');
  if (req.session.loggedinUser) {
    res.render('voter-registration.ejs');
  } else {
    res.redirect('/login');
  }
});

var rand = Math.floor(Math.random() * 10000 + 54);

var account_address;
var aadhar_no;

// app.use(express.static('public'));
// //app.use('/css',express.static(__dirname+'public/css'));
// //app.use(express.json());
// app.use(express.urlencoded());

router.post('/registerdata', function (req, res) {
  var dob = [];
  aadhar_no = req.body.aadharno; //data stores aadhar no
  account_address = req.body.account_address; //stores metamask acc address
  let sql = 'SELECT * FROM aadhar_info WHERE Aadharno = ?';
  conn.query(sql, aadhar_no, (error, results, fields) => {
    if (error) {
      return console.error(error.message);
    }
    dob = results[0].Dob;
    var email = results[0].Email;
    age = getAge(dob);
    is_registerd = results[0].Is_registered;

    if (is_registerd == 'YES') {
      res.render('voter-registration.ejs', {
        alertMsg: 'You are already registered. You cannot register again'
      });
      return;
    }
    if (age >= 18) {
      var mailOptions = {
        from: 'devtalash@gmail.com',
        to: email,
        subject: 'Please confirm your Email account',
        text: 'Hello, Your otp is ' + rand
      };
      // transporter.sendMail(mailOptions, function (error, info) {
      //   if (error) {
      //     console.log(error);
      //   } else {
      //     console.log('Email sent: ' + info.response);
      //   }
      // });

      sendEmail(mailOptions);
      res.render('emailverify.ejs');
    } else {
      res.send('You cannot vote as your age is less than 18');
    }
  });
});

router.post('/otpverify', (req, res) => {
  var otp = req.body.otp;
  if (otp == rand) {
    var record = { Account_address: account_address, Is_registered: true };
    var sql = 'INSERT INTO registered_users SET ?';
    conn.query(sql, record, function (err2, res2) {
      if (err2) {
        throw err2;
      } else {
        var sql1 = 'Update aadhar_info set Is_registered=? Where Aadharno=?';
        var record1 = [true, aadhar_no];

        conn.query(sql1, record1, function (err1, res1) {
          if (err1) {
            res.render('voter-registration.ejs');
          } else {
            var msg = 'You are successfully registered';
            // res.send('You are successfully registered');
            res.render('voter-registration.ejs', { alertMsg: msg });
          }
        });
      }
    });
  } else {
    res.render('voter-registration.ejs', {
      alertMsg: 'Session Expired! , You have entered wrong OTP '
    });
  }
});

// router.get('/register',function(req,res){
//     res.sendFile(__dirname+'/views/index.html')
// });

/*app.get('/signin_signup',function(req,res){
    res.sendFile(__dirname+'/views/signup.html')
});

app.get('/signup',function(req,res){
    console.log(req.body);
    res.sendFile(__dirname+'/views/signup.html')
});*/

module.exports = router;
