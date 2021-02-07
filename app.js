//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encryption = require("mongoose-encryption");

const app = express();
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,
useUnifiedTopology:true});

const userSchema = new mongoose.Schema({
  user : String,
  password: String
});
//string used for encryption

const secret = "SHAOMINE";
userSchema.plugin(encryption,{secret:process.env.SECRET,encryptedFields:['password']});

const User = mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){


  const newUser = new User({
    user : req.body.username,
    password : req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log("Error");
    }else{
      console.log("Saved");
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  User.findOne({user:req.body.username},function(err,founduser){
    if(founduser){
      if(founduser.password === req.body.password){
        res.render("secrets");
      }else{
        console.log("Wrong Pwd");
        res.redirect("/");
      }
    }else{
      console.log("Error");
    }
  });
});


let port = process.env.PORT;
if(port == "" || port == null){
  port = 3000;
};

app.listen(port,function(){
  console.log("Server started");
});
