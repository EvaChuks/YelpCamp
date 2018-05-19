var express    = require("express");
var router     = express.Router();
var passport   = require("passport");
var User       = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var multer = require('multer');



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


router.get("/", function(req, res){
    res.render("landing");
});

//   ======================
//   AUTH ROUTES
//   ======================
// show register form
router.get("/register", function(req, res) {
    res.render("register", {page: 'register'});
});

// handle sign up logic

router.post("/register", upload.single('image'), function(req, res) {
 

            //image variable needs to be here so the image can be stored and uploaded to cloudinary
            
    var newUser = new User();
    //     username: req.body.username,
    //     firstName: req.body.firstName,
    //     lastName: req.body.lastName,
    //     email: req.body.email,
    //     image: req.body.image,
    //     imageId: req.body.imageId
    // });
    var username = req.body.username;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email   = req.body.email;
    var image  = req.body.image;
    var imageId = req.body.imageId;
    var message = message;
    if(req.body.adminCode === '27-05-1981'){
        newUser.isAdmin = true;
    }
     cloudinary.uploader.upload(req.file.path, function (result) {
    image = result.secure_url;
    imageId= result.public_id;
    newUser = {username: username, firstName: firstName, lastName: lastName, email: email,image: image, imageId: imageId, message: message};
    User.register(newUser, req.body.password,  function(err, user){
        if(err || !user){
    console.log(err);
    req.flash("error", "something went wrong");
    return res.render("register", {error: err.message});
       }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " +  user.username);
            res.redirect("/campgrounds");
        });
    });
  });
});

// show login form
router.get("/login", function(req, res) {
    res.render("login", {page: 'login'});
    
});

// handling login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    
}), function(req, res) {
    
});
// logout route
router.get("/logout", function(req, res) {
    
    req.logout();
    req.flash("success", "Logged You Out!!");
    res.redirect("/campgrounds");
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
          user: 'walter4chuks@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'evaristus.ihezurumba@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'https://' + req.headers.host + '/reset/' + token + '\n\n' +
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
          user: 'walter4chuks@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'evaristus.ihezurumba@gmail.com',
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
    res.redirect('/campgrounds');
  });
});

// USER PROFILE
router.get("/users/:id", function(req, res) {
  User.findById(req.params.id, function(err, foundUser) {
    if(err) {
      req.flash("error", "Something went wrong.");
      res.redirect("/");
    }
    Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/");
      }
      res.render("users/show", {user: foundUser, campgrounds: campgrounds});
    })
  });
});



module.exports  = router;