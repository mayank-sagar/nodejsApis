const User = require('../models/user');
const { body } = require('express-validator/check');
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signUp = async (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    try {
        const email = req.body.email;
        const name = req.body.name;
        const password = req.body.password;
        const hashedPw = await bcrypt.hash(password,12);
        const user = new User({
            email:email,
            password:hashedPw,
            name:name
        });
        await user.save();
        res.status(201).json({message:'User Created!', userId: user._id});    
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500
        }
        next(err);
    }
}

exports.login = async (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({email:email});
   try {
     if(!user) {
            const error = new Error("User with this email not found");
            error.statusCode = 401;
            throw error;
        }
     const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch) {
            const error = new Error("Password do not match");
            error.statusCode = 401;
            throw err;
        } 
        const token = jwt.sign({
            email:user.email,
            userId:user._id.toString()
        },'secret',{expiresIn:'1h'});
        return res.status(200).json({token:token,userId: user._id.toString()});
    } catch (err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    } 
}