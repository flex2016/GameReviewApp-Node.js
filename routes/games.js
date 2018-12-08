var express = require("express");
var router  = express.Router();
var Game = require("../models/game");
var middleware = require("../middleware");

//INDEX - show all games
router.get("/", function(req, res){
    var perPage = 4;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Game.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allGames) {
            Game.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allGames.length < 1) {
                        noMatch = "No games match that query, please try again.";
                    }
                    res.render("games/index", {
                        games: allGames,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all games from DB
        Game.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allGames) {
            Game.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("games/index", {
                        games: allGames,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

//CREATE - add new game to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to games array
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newGame = {name: name, image: image, price: price, description: desc, author:author}
    // Create a new game and save to DB
    Game.create(newGame, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to games page
            req.flash("success", "Successfully added a Game");  
            res.redirect("/games");
        }
    });
});

//NEW - show form to create new game
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("games/new"); 
});

// SHOW - shows more info about one game
router.get("/:id", function(req, res){
    //find the game with provided ID
    Game.findById(req.params.id).populate("comments").exec(function(err, foundGame){
        if(err || !foundGame){
            req.flash("error", "Game not found");
            res.redirect("back");
            console.log(err);
        } else {
            console.log(foundGame)
            //render show template with that game
            res.render("games/show", {game: foundGame});
        }
    });
});

// EDIT GAME ROUTE
router.get("/:id/edit", middleware.checkGameOwnership, function(req, res){
    Game.findById(req.params.id, function(err, foundGame){
        res.render("games/edit", {game: foundGame});
    });
});

// UPDATE GAME ROUTE
router.put("/:id", middleware.checkGameOwnership, function(req, res){
    // find and update the correct game
    Game.findByIdAndUpdate(req.params.id, req.body.game, function(err, updatedGame){
       if(err){
           req.flash("eroor", "Something Went Wrong!");
           res.redirect("/games");
       } else {
           //redirect somewhere(show page)
           req.flash("success", "Game Updated");
           res.redirect("/games/" + req.params.id);
       }
    });
});

// DESTROY GAME ROUTE
router.delete("/:id", middleware.checkGameOwnership, function(req, res){
   Game.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/games");
      } else {
          req.flash("success", "Game deleted");
          res.redirect("/games");
      }
   });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

