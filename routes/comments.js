var express = require("express");
var router  = express.Router({mergeParams: true});
var Game = require("../models/game");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find game by id
    console.log(req.params.id);
    Game.findById(req.params.id, function(err, game){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {game: game});
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup game using ID
   Game.findById(req.params.id, function(err, game){
       if(err){
           req.flash("error", "Something went wrong");
           console.log(err);
           res.redirect("/games");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               game.comments.push(comment);
               game.save();
               console.log(comment);
               req.flash("success", "Successfully added comment");
               res.redirect('/games/' + game._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Game.findById(req.params.id, function(err, foundGame){
        if(err || !foundGame){
            req.flash("error", "No game found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash("error", "No Comment found");
                res.redirect("back");
            } else {
                res.render("comments/edit", {game_id: req.params.id, comment: foundComment});
            }
        });
    });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          res.redirect("back");
      } else {
          req.flash("success", "Comment Edited");
          res.redirect("/games/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/games/" + req.params.id);
        }
    });
});


module.exports = router;