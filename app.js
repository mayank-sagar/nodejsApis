const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const fileStorage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null,'images');
    },
    filename:(req,file,cb) => {
        cb(null,parseInt((Math.random() * 1000),10) + '-' + file.originalname);
    }
});


const fileFilter = (req,file,cb) => {
    if(file.mimetype == 'image/png' || 
    file.mimetype == "image/jpg" || 
    file.mimetype == 'image/jpeg') {
        cb(null,true);
    } else {
        cb(null,false);
    }
}
const path = require('path');
const MONGODB_URI = 'mongodb+srv://user:password%40123@ecommerce-dphpz.mongodb.net/blog?retryWrites=true&w=majority';

app.use(bodyParser.urlencoded({extended:false})); // x-www-form-urlencoded <form>
app.use(bodyParser.json());
app.use(multer({storage : fileStorage,fileFilter:fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname,"images")));
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
    next();
})

app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);
app.use('/user',userRoutes);
app.use((error,req,res,next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message,data:data});
})
mongoose.connect(MONGODB_URI,{ 
    useNewUrlParser: true
  }).then(() => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection',socket => {
        console.log('client connected');
    });
})
.catch(err => console.log(err));