const {validationResult} = require('express-validator/check');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User  = require('../models/user');
const io = require('../socket');
const { emit } = require('process');

exports.getPosts = async (req,res,next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    try {
    const count = await Post.find().countDocuments();
    const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage).sort({createdAt:-1}).populate('creator');
    res.status(200).json({
        message:"Fetched posts successfully",
        posts:posts,
        totalItems:count
    });
    }catch(err)  {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPosts = async (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error("Validation failed, entered data is in correct");
        error.statusCode = 422;
        throw error;
    }

    if(!req.file) {
        const error = new Error('No image found');
       error.statusCode = 422;
       throw error; 
    }
    const imageUrl = req.file.path;
    console.log(req.file);
    const title = req.body.title;
    const content = req.body.content;
    const userId = req.userId;
    let creator;
    try {
        const post = new Post({
            title:title,
            content:content,
            imageUrl: imageUrl,
            creator: userId,
        });
    
        const savePost = await post.save();
        creator = await User.findById(req.userId);
        console.log('creator : ',creator);
        creator.posts.push(savePost);
        creator = await creator.save();
        post.creator = creator;
        io.getIO().emit('posts',{action:'create',post: post})
        return res.status(201).json({
            message:'Post create successfully!',
            post:post,
            creator:{_id: creator._id,name: creator.name}
        });    
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.getPost = async (req,res,next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId)
        if(!post) {
            const error = new Error('Count not find post');
            error.statusCode = 404;
            throw error;
        }
        return res.status(200).json({message:'Post Fetched',post:post});
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updatePost = async (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error("Validation failed, entered data is in correct");
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file) {
        imageUrl = req.file.path;
    }
    if(!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId).populate('creator');
        if(!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
        if(post.creator._id.toString() !== req.userId) {
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        io.getIO().emit('posts',{action:'update',post: result})
        return res.status(200).json({message:'Post updated!',post:result});
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        } 
        next(err);
    }
};

exports.deletePost = async (req,res,next) => {
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    try {
        if(!post) {
            let error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId) {
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user =  await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        io.getIO().emit('posts',{action:'delete',post:postId});
        return res.status(200).json({message:'Deleted successfully'});    
    } catch(err) {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    } 
}

const clearImage = filePath => {
    filePath = path.join(__dirname,'..',filePath);
    fs.unlink(filePath,err => console.log(err));
};