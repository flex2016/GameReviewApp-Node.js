var express = require("express");
var router  = express.Router({mergeParams: true});
var game = require("../models/game");
var Comment = require("../models/comment");

//Comments New
router.get("/new", function(req, res){
    // find game by id
    console.log(req.params.id);
    game.findById(req.params.id, function(err, game){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {game: game});
        }
    })
});

//Comments Create
router.post("/",function(req, res){
   //lookup game using ID
   game.findById(req.params.id, function(err, game){
       if(err){
           console.log(err);
           res.redirect("/games");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //save comment
               comment.save();
               game.comments.push(comment);
               game.save();
               console.log(comment);
               res.redirect('/games/' + game._id);
           }
        });
       }
   });
});


module.exports = router;