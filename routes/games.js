var express = require("express");
var router  = express.Router();
var Game = require("../models/game");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'codemasterflex', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



//INDEX - show all games
router.get("/", function(req, res){
    var perPage = 8;
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
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
    cloudinary.uploader.upload(req.file.path, function(result) {
        // add cloudinary url for the image to the game object under image property
        req.body.game.image = result.secure_url;
        // add author to game
        req.body.game.author = {
            id: req.user._id,
            username: req.user.username
        }
        Game.create(req.body.game, function(err, newGame) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        res.redirect('/games/');
        });
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

