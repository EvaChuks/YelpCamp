//----------------------------------------------------------------------------//
//--------------------------Dependencies For Route----------------------------//
//----------------------------------------------------------------------------//

var express    = require("express");
var router     = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var async = require("async");


//Node Geocoder API Configuration 
var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};
 
var geocoder = NodeGeocoder(options);

//Multer Storage
var storage = multer.diskStorage({
       filename: function(req, file, callback) {
       callback(null, Date.now() + file.originalname);
  }
});

//Multer Filter
var imageFilter = function (req, file, cb) {
    // accept image files only
       if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
};
//Storing Image + Filter
var upload = multer({ storage: storage, fileFilter: imageFilter});

//Cloudinary Configuration
var cloudinary = require('cloudinary');
    cloudinary.config({ 
    cloud_name: 'dnposhqpc', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX - SHOW ALL CAMPGROUNDS

router .get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if (req.query.search) {
       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // GET ALL CAMPGROUNDS FROM THE DB
    Campground.find({"name": regex}, function(err, allCampgrounds){
   
        if(err || !allCampgrounds){
             console.log(err);
            req.flash("error", "Something went wrong!");
        } else {
            
            if(allCampgrounds.length < 1){
                
                noMatch = "No campground match that query, please try again.";
            }
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: 'campgrounds', noMatch: noMatch});
        }
    });
 } else {
     Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec( function(err, allCampgrounds){
    Campground.count().exec(function (err, count) {
         if(err) {
             console.log(err);
         } else {
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: 'campgrounds', noMatch: noMatch,
                campgrounds: allCampgrounds,
                    current: pageNumber,
                    pages: Math.ceil(count / perPage)
            }); 
         }
    });
     })
 }
});
//----------------------------------------------------------------//
//-----------------CREATE  NEW CAMPGROUNDS -----------//
//----------------------------------------------------------------//

//CREATE - ADD NEW CAMPGROUND TO DB

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){

  // local variables
  
  // Request  The Name
  var name = req.body.name;
  
  // Request The Image
  var image = req.body.image;
  var imageId = req.body.imageId;
  
  // Request The descriptions
  var desc = req.body.descriptions;
  
  // Request The Price
  var price = req.body.price;
  
  // Request The Author's ID + Username
  var author = {
      id: req.user._id,
      username: req.user.username
  };
  //Location Code - Geocode Package
  geocoder.geocode(req.body.location, function (err, data ) {
      
      //Error Handling For Autocomplete API Requests
      
     //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
          if (err || data.status === 'ZERO_RESULTS') {
             req.flash('error', 'Invalid address, try typing a new address');
             return res.redirect('back');
        }
    //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
         if (err || data.status === 'REQUEST_DENIED') {
            req.flash('error', 'Something Is Wrong Your Request Was Denied');
            return res.redirect('back');
          }

 // Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'OVER_QUERY_LIMIT') {
            req.flash('error', 'All Requests Used Up');
            return res.redirect('back');
        }
  //Credit To Ian For Fixing The Geocode Problem - https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/2788856        
      var lat = data[0].latitude;
      var lng = data[0].longitude;
      var location = data[0].formattedAddress;
    
    
    //Reference: Zarko And Ian Helped Impliment the Image Upload - https://github.com/nax3t/image_upload_example

        cloudinary.uploader.upload(req.file.path, function (result) {

            //image variable needs to be here so the image can be stored and uploaded to cloudinary
            image = result.secure_url;
            imageId= result.public_id;
            
        //Captures All Objects And Stores Them
         var newCampground = {name: name, image: image, description: desc, price: price, author:author, location: location, lat: lat, lng: lng, imageId: imageId};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err || !newlyCreated){
             //Logs Error
            req.flash('error', err.message);
             return res.redirect('back');
        } else {
            //redirect back to campgrounds page

                    //Logs Error
                    
            console.log(newlyCreated);
            
            //Flash Message 
            req.flash("success", "Campground Added Successfully");

            //Redirects Back To Featured Campgrounds Page
            res.redirect("/campgrounds");
         }
        });
        
    });
    
 });
 
});
// NEW - SHOW FORM TO CREATE NEW CAMPGROUND
router.get("/new", middleware.isLoggedIn, function(req, res) {
    
    res.render("campgrounds/new");
    
});

// SHOW - SHOW ONLY ONE CAMPGROUND FROM THE DB
router.get("/:id", function(req, res) {
    // find campround with the Provided id
    Campground.findById(req.params.id).populate("comment").exec(function(err, foundcampground){
        if(err || !foundcampground){
            console.log(err);
            req.flash("error", "Sorry, that campground does not exist!");
            res.redirect("back"); // you need to redirect the user in case there isn't anything found by the provided id
        } else {
            console.log(foundcampground);
    // render the show template
        res.render("campgrounds/show", {campground: foundcampground});
            
        }
    });
    
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundcampground){
        if(err || !foundcampground){
            console.log(err);
            req.flash("error", "campground not found");
            return res.redirect("back");
        }
            res.render("campgrounds/edit", {campground: foundcampground});
    });
});

//----------------------------------------------------------------//
//-----------------Update  CAMPGROUNDS -----------//
//----------------------------------------------------------------//

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res, next){
     async.waterfall([
         function(done) {
            geocoder.geocode(req.body.campground.location, function (err, data) {
                if (err || !data.length) {
                  req.flash('error', 'Invalid address');
                  return res.redirect('back');
                }
                done(null, data);
            });
        },
        
        function(data, done) {
            // handle image uploading
            Campground.findById(req.params.id, function(err, foundCampground) {
                if(err || !foundCampground) {
                    console.log(err);
                     req.flash("error", err.message);
                     return res.redirect("back");
                }  else {
                    done(null, foundCampground, data);
                }
            });
        },
        
        function(foundCampground, data, done) {
            if(req.file) { 
                cloudinary.v2.uploader.destroy(foundCampground.imageId, function(err, result) {
                    if(err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    } else {
                        done(null, foundCampground, data);
                    }
                });
            } else {
                done(null, foundCampground, data);
            }
        },
     function(foundCampground, data, done) {
            // if new image uploaded, destroy the old one
            if(req.file) { 
                cloudinary.uploader.upload(req.file.path, function(result) {
                    req.body.campground.imageId = result.public_id;
                    req.body.campground.image = result.secure_url;
                    done(null, foundCampground, data);
                });
            } else {
                done(null, foundCampground, data);
            }
        },
        
         function(foundCampground, data) {
            // update 
            // var newCampground = {name: req.name, price: price, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng};
            req.body.campground.lat = data[0].latitude;
            req.body.campground.lng = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
            Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/campgrounds');
    });
});

// DESTORY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
 Campground.findByIdAndRemove(req.params.id, function(err, foundcampground){
     if(err || !foundcampground){
         req.flash("error", "Something went wrong!");
         res.redirect("/campgrouns");
     } else {
         req.flash("success", "You have successfully deleted a campground");
         res.redirect("/campgrounds");
     }
 });
    
})
// Middleware
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports  = router;