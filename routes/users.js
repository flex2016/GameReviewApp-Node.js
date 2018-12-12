var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Game = require("../models/game");

var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);




//user profile
router.get("/:id", function(req, res){
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
router.get("/:id/edit",middleware.isLoggedIn,middleware.checkUser, function(req, res){
    User.findById(req.params.id, function(err, foundUser){
       if(err){
           req.flash("error", "Something went wrong.");
           return res.redirect("/");
        }
        res.render("users/edit", {user: foundUser});
    }); 
});

//handle update user
router.put("/:id",middleware.isLoggedIn, middleware.checkUser, function(req, res){
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