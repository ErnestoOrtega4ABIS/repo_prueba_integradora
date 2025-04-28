const express = require('express');
const credentialsController = require('../controllers/credentialsController');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth');
const router = express.Router();

router.post('/credentials/create', protectRoute,isAdmin,credentialsController.createCredentials);
router.put('/credentials/update/:idUser', protectRoute,isEmployee,credentialsController.updateCredentials);
router.delete('/credentials/delete/:idSesion', protectRoute,isAdmin,credentialsController.deleteCredentials);

module.exports = router;
