var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Game = require("../models/game");

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
    var newUser = new User(
        {
            username : req.body.username,
            firstName: req.body.firstName,
            lastName : req.body.lastName,
            email    : req.body.email,
            avatar   : req.body.avatar
            
        });
    if(req.body.adminCode === "codemastercodesecret"){
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


//user profile
router.get("/users/:id", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
       if(err){
           req.flash("error", "Something went wrong.");
           res.redirect("/");
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

module.exports = router;