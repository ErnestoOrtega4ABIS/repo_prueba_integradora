const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.KEY || 'your_secret_key'; // Asegúrate de que sea la misma clave usada en el middleware

const loginUser = (req, res) => {
    const { email, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const query = `
        SELECT u.*, ur.Password
        FROM user u
        JOIN user_register ur ON u.IDUser = ur.IDUser
        WHERE ur.Email = ?
    `;

    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = results[0];
        const storedPassword = user.Password;

        // Verificar si el usuario es un cliente
        if (user.UserType === 'Client') {
            return res.status(403).json({ error: 'Acceso denegado. Los clientes no tienen permisos para iniciar sesión.' });
        }

        try {
            // Comparar la contraseña ingresada con la encriptada almacenada
            const isMatch = await bcrypt.compare(password, storedPassword);
            if (!isMatch) {
                return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            }

            const token = jwt.sign(
                {
                    IDUser: user.IDUser,
                    Email: user.Email,
                    UserType: user.UserType,
                    Status: user.Status,
                    Name: user.Name,
                    LastName: user.LastName
                },
                SECRET_KEY,
                { expiresIn: '2h' }
            );

            res.status(200).json({
                message: 'Inicio de sesión exitoso',
                token
            });
        } catch (err) {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    });
};

const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada exitosamente' });
    });
};

module.exports = {
    loginUser,
    logoutUser
};
