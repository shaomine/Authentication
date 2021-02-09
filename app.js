//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
// const encryption = require("mongoose-encryption");
// const md5 = require("md5");
const bCrypt = require("bcrypt");
const saltrounds = 10;

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

// userSchema.plugin(encryption,{secret:process.env.SECRET,encryptedFields:['password']});

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

  bCrypt.hash(req.body.password,saltrounds,function(err,hash){
    const newUser = new User({
      user : req.body.username,
      password : hash
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
});

app.post("/login",function(req,res){
  User.findOne({user:req.body.username},function(err,founduser){
    if(founduser){
      bCrypt.compare(req.body.password,founduser.password,function(err,result){
        if(result === true){
          res.render("secrets");
        }else{
          console.log("Wrong Pwd");
          res.redirect("/");
        }
      });
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
