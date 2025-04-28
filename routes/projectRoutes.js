const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth');

// Route to get all projects with client and project type names
router.get('/projects/read', protectRoute,isEmployee,projectController.getProjects);
router.get('/projects/project-types', protectRoute,isEmployee,projectController.getProjectTypes);
router.get('/projects/clients', protectRoute,isEmployee,projectController.getClients);
router.get('/projects/read/:id', protectRoute,isEmployee,projectController.getProjectById);
router.post('/projects/create', protectRoute,isAdmin,projectController.createProject);
router.put('/projects/update/:id',protectRoute,isAdmin, projectController.updateProject);
router.delete('/projects/delete/:id', protectRoute,isAdmin,projectController.deleteProject);

module.exports = router;
