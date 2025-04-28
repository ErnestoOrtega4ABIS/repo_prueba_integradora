const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth');

// Ruta para obtener todos los clientes activos
router.get('/clients/read', protectRoute,isEmployee,clientController.getClients);
router.post('/clients/create', protectRoute,isAdmin,clientController.createClient);
router.put('/clients/update/:id', protectRoute,isAdmin,clientController.updateClient);
router.delete('/clients/delete/:id', protectRoute,isAdmin,clientController.deleteClient);
router.get('/clients/read/:id', protectRoute,isEmployee,clientController.getClientById);

module.exports = router;
