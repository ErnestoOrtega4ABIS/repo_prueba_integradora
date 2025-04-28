const express = require('express');
const router = express.Router();
const formQuotationController = require('../controllers/formQuoController');

router.post('/formquotations/create', formQuotationController.addFormQuotation);
router.get('/formquotations', formQuotationController.getFormQuotations);
router.put('/formquotations/update-status', formQuotationController.updateQuotationStatus);
router.get('/formquotations/:id', formQuotationController.getFormQuotationById);
router.delete('/formquotations/delete/:id', formQuotationController.deleteFormQuotation);


module.exports = router;
