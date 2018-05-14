var Campground = require("../models/campground");
var Comment   = require("../models/comment");

// all middelware goes here

var middelwareObject = {};

// Campgrounds middleware
middelwareObject.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundcampground){
            if(err || !foundcampground) {
                console.log(err);
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            } else {
                if(foundcampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

// Comments middleware
middelwareObject.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment) {
                req.flash("error", "Campground not found!");
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id)|| req.user.isAdmin){
                    next();
                } else {
                    req.flash("error", "You don't permission to do that!!");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}
// Login middleware
middelwareObject.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
}
module.exports = middelwareObject;
