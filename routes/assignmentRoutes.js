const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth');

// Rutas para manejar asignaciones
router.get('/assignments/read', protectRoute,isEmployee,assignmentController.getAssignments);
router.get('/assignments/read/:id', protectRoute,isEmployee,assignmentController.getAssignmentById);
router.get('/assignments/employees', protectRoute,isEmployee,assignmentController.getEmployees);
router.get('/assignments/projects', protectRoute,isEmployee,assignmentController.getProjects);
router.post('/assignments/create', protectRoute,isAdmin,assignmentController.createAssignment);
router.put('/assignments/update/:id', protectRoute,isAdmin,assignmentController.updateAssignment);
router.delete('/assignments/delete/:id', protectRoute,isAdmin,assignmentController.deleteAssignment);

module.exports = router;
