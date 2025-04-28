const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protectRoute, isAdmin, isEmployee } = require('../middleware/auth');

router.get('/employees/read', protectRoute,isEmployee,employeeController.getEmployees);
router.get('/employees/read/:id', protectRoute,isEmployee,employeeController.getEmployeeById);
router.delete('/employees/delete/:id', protectRoute,isAdmin,employeeController.deleteEmployee);
router.post('/employees/create', protectRoute,isAdmin,employeeController.createEmployee);
router.put('/employees/update/:id', protectRoute,isAdmin,employeeController.updateEmployee);


module.exports = router;
