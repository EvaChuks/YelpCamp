
var express     =      require("express"),
app             = express(),
bodyParser     = require("body-parser"),
mongoose       = require("mongoose"),
passport       = require("passport"),
LocalStrategy  = require("passport-local"),
flash          = require("connect-flash"),
methodOverride = require("method-override"),
Campground     = require("./models/campground"),
Comment        = require("./models/comment"),
seedDB         = require("./seed"),
User          = require("./models/user")

var camgroundRoutes     = require("./routes/campgrounds"),
    commentRoutes      = require("./routes/comments"),
    indexRoutes        = require("./routes/index"),
    contactRoutes = require("./routes/contact")


console.log(process.env.DATABASEURL);
mongoose.connect(process.env.DATABASEURL);
//mongoose.connect("mongodb://chuks:chuks2018@ds035844.mlab.com:35844/yelpcamp");

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); seed the DB
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "My name is Saint Chuks",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    console.log(req.user);
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/campgrounds", camgroundRoutes);
app.use("/campgrounds/:id/comment", commentRoutes);
app.use("/contact", contactRoutes);




app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp server has started!!");
});