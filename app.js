//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");


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
  password: String
});

// userSchema.plugin(encryption,{secret:process.env.SECRET,encryptedFields:['password']});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    console.log("Authenticated already");
    res.render("secrets");
  }else{
    console.log("authentication expired");
    res.redirect("/login");
  }
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
