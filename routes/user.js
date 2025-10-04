const express = require('express');
const router = express.Router();
const userLogincontrol = require('../controllers/userLogin');

const { authenticateToken } = require('../middleware/auth');

//starts with /users
router.post('/signup', userLogincontrol.signup);
router.post('/login', userLogincontrol.login);
// router.post('/logout', authenticateToken, userLogincontrol.logout);
router.post('/verify-email', userLogincontrol.verifyEmail);
router.post('/forgot-password', userLogincontrol.forgotPass);
router.post('/reset-password', userLogincontrol.resetPassword);
router.get('/current-user', authenticateToken, userLogincontrol.getCurrentUser);
module.exports = router;