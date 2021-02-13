//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate"); //to make findOrCreate method work
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//setup session
app.use(session({
  secret:"SECRET",
  resave:false,
  saveUninitialized:false     //recommended false setting
}));

//setup passport
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,
useUnifiedTopology:true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  user : String,
  password: String,
  googleId : String,
  secret : String
});

// userSchema.plugin(encryption,{secret:process.env.SECRET,encryptedFields:['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
  });

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    console.log("Authenticated already");
    res.render("submit");
  }else{
    console.log("authentication expired");
    res.redirect("/login");
  }

})


app.post("/submit",function(req,res){
    const submittedText = req.body.secret;

    User.findOne({_id : req.user.id},function(err,found_user){
      if(err){
        console.log(err);
      }else{
        found_user.secret = submittedText;
        found_user.save(function(){
          res.redirect("/secrets");
        });
      }
    });
});

app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
  //   console.log("Authenticated already");
  //   User.find({"secret" : {$ne:null}},function(err,foundUsers){
  //     if(err){
  //       console.log(err);
  //     }else{
  //       res.render("secrets",{usersWithSecrets:foundUsers});
  //     }
  //   });
  // }else{
  //   console.log("authentication expired");
  //   res.redirect("/login");
  // }

    User.find({"secret" : {$ne:null}},function(err,foundUsers){
      if(err){
        console.log(err);
      }else{
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    });
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){

  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate('local')(req,res,function(){
      res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",function(req,res){

  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log();
    }else{
      console.log("logged in successfully");
      passport.authenticate('local')(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

let port = process.env.PORT;
if(port == "" || port == null){
  port = 3000;
};

app.listen(port,function(){
  console.log("Server started");
});
