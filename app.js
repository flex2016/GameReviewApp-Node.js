require('dotenv').config();

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    game        = require("./models/game"),
    Comment     = require("./models/comment"),
    User        = require("./models/user")
    
    
//requring routes
var commentRoutes    = require("./routes/comments"),
    reviewRoutes     = require("./routes/reviews"),
    gameRoutes       = require("./routes/games"),
    indexRoutes      = require("./routes/index")
    
//mongoose.connect("mongodb://localhost/game_review");
mongoose.connect(process.env.MONGO_DB);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: process.env.SECRET_KEY,
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
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/games", gameRoutes);
app.use("/games/:id/comments", commentRoutes);
app.use("/games/:id/reviews", reviewRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The Game Review Server Has Started!");
});