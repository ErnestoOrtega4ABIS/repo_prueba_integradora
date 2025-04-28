const express = require('express');
const { loginUser, logoutUser } = require('../controllers/authController');
const router = express.Router();

router.post('/auth/user', loginUser);
router.post('/logout', logoutUser);

module.exports = router;
