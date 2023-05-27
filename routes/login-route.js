var express = require('express');
var bcrypt = require('bcryptjs');
var router = express.Router();
var db = require('../database');
var app = express();
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
/* GET users listing. */
router.get('/login', function (req, res, next) {
  res.render('login-form.ejs');
});

router.post('/login', async function (req, res) {
  var emailAddress = req.body.email_address;
  var password = req.body.password;

  const isValid = await checkCredentials(emailAddress, password);
  if (!isValid) {
    res.render('login-form.ejs', {
      alertMsg: 'Your Email Address or password is wrong'
    });
    return;
  }
  req.session.loggedinUser = true;
  req.session.emailAddress = emailAddress;
  res.redirect('/userInfo');

  //   var sql = 'SELECT * FROM registration WHERE email_address =? AND password =?';
  // var sql = 'SELECT * FROM registration WHERE email_address =?';
  // db.query(sql, [emailAddress], function (err, data, fields) {
  //   if (err) throw err;
  //   if (data.length > 0) {
  //     bcrypt.compare(password, data[0].password, function (err, doesMatch) {
  //       if (!doesMatch) {
  //         res.render('login-form.ejs', {
  //           alertMsg: 'Your Email Address or password is wrong'
  //         });
  //       }
  //     });

  //     req.session.loggedinUser = true;
  //     req.session.emailAddress = emailAddress;
  //     res.redirect('/userInfo');
  //     // res.redirect('/blockchain');
  //   } else {
  //     res.render('login-form.ejs', {
  //       alertMsg: 'Your Email Address or password is wrong'
  //     });
  //   }
  // });
});

async function checkCredentials(email, password) {
  return new Promise((resolve, reject) => {
    var sql = 'SELECT * FROM registration WHERE email_address =?';
    db.query(sql, [email], function (err, data, fields) {
      if (err) reject(err);
      if (data.length > 0) {
        bcrypt.compare(password, data[0].password, function (err, doesMatch) {
          resolve(doesMatch);
        });
      } else {
        reject(0);
      }
    });
  });
}

module.exports = router;
