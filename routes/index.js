var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Game = require("../models/game");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    };
    var newUser = new User(
        {
            username : req.body.username,
            firstName: req.body.firstName,
            lastName : req.body.lastName,
            email    : req.body.email,
            avatar   : req.body.avatar,
            description   : req.body.description,
            lat : data[0].latitude,
            lng : data[0].longitude,
            location : data[0].formattedAddress
            
        });
    if(req.body.adminCode === process.env.ADMIN_CODE){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            return res.render("register", {"error": err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Top Games " + user.username);
            res.redirect("/games"); 
        });
    });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});



//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/games",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome Back to Top Games!'
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/games");
});


// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'codemasterflexdev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'codemasterflexdev@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'codemasterflexdev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'codemasterflexdev@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/games');
  });
});


//user profile
router.get("/users/:id", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
       if(err){
           req.flash("error", "Something went wrong.");
           return res.redirect("/");
        }
        Game.find().where('author.id').equals(foundUser._id).exec(function(err, games) {
            if(err) {
                req.flash("error", "Something went wrong.");
                return res.redirect("/");
            }
       res.render("users/show", { user: foundUser, games: games});
        })
   }); 
});

//user edit 
router.get("/users/:id/edit",middleware.isLoggedIn,middleware.checkUser, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
       if(err){
           req.flash("error", "Something went wrong.");
           return res.redirect("/");
        }
        res.render("users/edit", {user: foundUser});
    }); 
});

//handle update user
router.put("/users/:id",middleware.isLoggedIn, middleware.checkUser, function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.user.lat = data[0].latitude;
    req.body.user.lng = data[0].longitude;
    req.body.user.location = data[0].formattedAddress;
    User.findByIdAndUpdate(req.params.id , req.body.user, function(err, updatedUser){
      if(err){
          res.redirect("back");
      } else {
          req.flash("success", "User Updated");
          res.redirect("/users/" + req.params.id );
      }
   });
    });
});

module.exports = router;