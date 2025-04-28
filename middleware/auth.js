const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Clave secreta para firmar y verificar tokens
const SECRET_KEY = process.env.KEY || 'your_secret_key';

// Middleware para proteger rutas
const protectRoute = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const query = `SELECT * FROM user WHERE IDUser = ? AND Status = 'Active'`;

        // Verificar usuario en la base de datos
        db.query(query, [decoded.IDUser], (err, results) => {
            if (err) {
                console.error('Error al verificar usuario:', err);
                return res.status(500).json({ error: 'Error en el servidor.' });
            }

            if (results.length === 0) {
                return res.status(403).json({ error: 'Acceso denegado. Usuario no encontrado o inactivo.' });
            }

            req.user = results[0]; // Guardar usuario autenticado
            next();
        });
    } catch (err) {
        console.error('Error al verificar token:', err.message);
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};


const isAdmin = (req, res, next) => {
    if (!req.user || req.user.Status !== 'Active' || req.user.UserType !== 'Admin') {
        return res.status(403).json({ error: 'Acceso denegado. Solo los administradores pueden realizar esta acción.' });
    }
    next();
};

const isEmployee = (req, res, next) => {
    if (!req.user || req.user.Status !== 'Active' || (req.user.UserType !== 'Employee' && req.user.UserType !== 'Admin')) {
        return res.status(403).json({ error: 'Acceso denegado. Solo empleados o administradores pueden acceder.' });
    }
    next();
};


module.exports = { protectRoute, isAdmin, isEmployee };
