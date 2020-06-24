const express = require('express');
const userController = require('../controllers/user');
const {body} = require('express-validator/check');

const router = express.Router();
const isAuth  = require('../middleware/is-auth');

router.get('/status',isAuth,userController.getStatus);
router.put('/status',isAuth,[
    body('status').trim().isLength({min:1})
],userController.updateStatus);

module.exports = router;