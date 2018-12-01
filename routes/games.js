var express = require("express");
var router  = express.Router();
var game = require("../models/game");

//INDEX - show all games
router.get("/", function(req, res){
    // Get all games from DB
    game.find({}, function(err, allgames){
       if(err){
           console.log(err);
       } else {
          res.render("games/index",{games:allgames});
       }
    });
});

//CREATE - add new game to DB
router.post("/", function(req, res){
    // get data from form and add to games array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newgame = {name: name, image: image, description: desc}
    // Create a new game and save to DB
    game.create(newgame, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to games page
            res.redirect("/games");
        }
    });
});

//NEW - show form to create new game
router.get("/new", function(req, res){
   res.render("games/new"); 
});

// SHOW - shows more info about one game
router.get("/:id", function(req, res){
    //find the game with provided ID
    game.findById(req.params.id).populate("comments").exec(function(err, foundgame){
        if(err){
            console.log(err);
        } else {
            console.log(foundgame)
            //render show template with that game
            res.render("games/show", {game: foundgame});
        }
    });
});

module.exports = router;

