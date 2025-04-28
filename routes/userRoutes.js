const express = require('express');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth')
const {
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser
} = require('../controllers/userController');
const router = express.Router();

router.post('/register', protectRoute,isAdmin,registerUser);              // Crear un nuevo usuario
router.get('/users', protectRoute,isEmployee,getAllUsers);                   // Obtener todos los usuarios
router.get('/users/:id', protectRoute,isEmployee,getUserById);               // Obtener un solo usuario por ID
router.put('/users/:id', protectRoute,isAdmin,updateUser);                // Actualizar un usuario por ID
router.delete('/users/:id', protectRoute,isAdmin,deactivateUser);         // Desactivar un usuario (cambia el estado a "Inactive")

module.exports = router;
