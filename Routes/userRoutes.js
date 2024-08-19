
const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const userModel = require('../models/userModel');
const registerModel = require('../models/registerModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const userRouter = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null,Date.now() + path.extname(file.originalname));
    },
    fileFilter: (req, file, cb) =>{
        const fileTypes = /jpeg|jpg|png/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimeType);
        if(extName && mimeType){
            return cb(null, true);
        }else{
            cb('Error: Image Only');
        }
    }
  });
  
  const upload = multer({ storage: storage });

  userRouter.post('/signup', upload.single('profilePicture'), (req, res)=>{
    try{
        const newUser ={
            name : req.body.name,
            email : req.body.email,
            profilePicture : req.body.path,
            additionalPictures:[],
        };
        userModel.createUser(newUser);
        res.redirect('/users');
    }
    catch(err){
        res.status(400).send(err);
    }

  })

  userRouter.get('/', (req, res)=>{
   try{
    const users = userModel.getAllUsers();
    res.send(users);
   }
   catch(err){
    res.status(400).send(err);
   }
  })

  userRouter.post('/update/:id', upload.single('profilePicture'), (req, res)=>{
    try{
        const updatedUser = {
            name: req.body.name,
            email : req.body.email,
            profilePicture : req.file ? req.file.path: undefined,
        };
        if(!updatedUser.profilePicture)delete updatedUser.profilePicture;
        userModel.updateUser(parseInt(req.params.id), updatedUser);
        res.redirect('/users');
    }
    catch(err){
        res.status(400).send(err);
    }
  })

  userRouter.post('/delete/:id', (req, res)=>{
    try{
        userModel.deleteUser(parseInt(req.params.id));
        res.redirect('/users');
    }
    catch(err){
        res.status(400).send(err);
    }
  })

  userRouter.post('/upload/:id', upload.array('additionalPictures',5), (req, res)=>{
    try{
        const user = userModel.getAllUsers().find(user => user.id === parseInt(req.params.id));
        const files = req.files.map(file => file.path);
        user.additionalPictures = user.additionalPictures.concat(files);
        userModel.updateUser(parseInt(req.params.id), {additionalPictures: user.additionalPictures});
        res.redirect('/users');
    }
    catch(err){
        res.status(400).send(err);
    }
  })

  userRouter.post("/register", async(req, res)=>{
    const {username, email, password} = req.body;

    try{
        const check = await registerModel.findOne({email: req.body.email});

        if(check){
            return res.status(400).json({message: "this email is already registered try to login"})
        }
        bcrypt.hash(password, 5, async(err, hash)=>{
            if(err)console.log(err);
            const user = await registerModel.create({
                username: username,
                email: email,
                password: hash,
            });
            res.status(201).json({message : "user is registerd successfully"});
        })
    }
    catch(err){
        res.status(500).json({message: 'Internal server error'});
    }
  })

  userRouter.post("/login", async(req, res)=>{
    const {username, email, password} = req.body;

    try{
        const check = await registerModel.findOne({email: req.body.email});

        if(!check){
            return res.status(400).json({message: "this email is not registered try to register yourself"})
        }
        bcrypt.compare(password, check.password, async(err, result)=>{
            if(err)console.log(err);
            const payload = {email: check.email};
            if(result){
                jwt.sign(payload, process.env.SECRET_KEY, (err, token)=>{
                    if(err)console.log(err);
                    console.log(err);
                    return res.status(200).json({token: token});
                });
            }else{
                return res.status(400).json({
                    message: 'user info is not correct try to check the details',
                })
            }
        });
    }
    catch(err){
        res.status(500).json({message: 'Internal server error'});
    }
  })

  module.exports = userRouter;

 