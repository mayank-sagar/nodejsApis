const User = require('../models/user');
const { validationResult } = require('express-validator/check');
exports.getStatus = async (req,res,next) => {
    const userId = req.userId;
    try {
        const user =  await User.findById(userId)
        if(!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({'message':'Status fetched Successfully',status:user.status});
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updateStatus = async (req,res,next) => {
    const userId = req.userId;
    const newStatus = req.body.status;

    const results = validationResult(req);
    if(!results.isEmpty()) {
        const error = new Error("Validation failed, entered data is in correct");
        error.statusCode = 422;
        error.data = results.array()
        throw error;
    }
    try {
    const user = await User.findById(userId)
    if(!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
    user.status = newStatus;
    await user.save(); 
    return res.status(200).json({'message':'Status Updated Successfully'});
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};