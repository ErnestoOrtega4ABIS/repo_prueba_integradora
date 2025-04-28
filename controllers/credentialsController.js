const db = require('../config/db');
const bcrypt = require('bcrypt');

// Crear credenciales
exports.createCredentials = async (req, res) => {
    const { idUser, email, password, confirmPassword } = req.body;

    // Validar campos
    if (!idUser || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    try {
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO user_register (IDSesion, IDUser, Email, Password)
            VALUES (UUID(), ?, ?, ?)
        `;

        db.query(query, [idUser, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error al crear credenciales:', err);
                return res.status(500).json({ error: 'Error al crear credenciales', details: err.sqlMessage });
            }
            res.status(201).json({ message: 'Credenciales creadas exitosamente' });
        });
    } catch (err) {
        console.error('Error al encriptar la contraseña:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Modificar credenciales
exports.updateCredentials = async (req, res) => {
    const { idUser } = req.params; // Cambiado a idUser
    const { email, password, confirmPassword } = req.body;

    // Verificar datos requeridos
    if (!email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    try {
        // Mostrar datos recibidos para depuración
        console.log('ID de usuario recibido:', idUser);
        console.log('Datos recibidos:', { email, password });

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Contraseña encriptada:', hashedPassword);

        // Actualizar credenciales utilizando IDUser
        const query = `
            UPDATE user_register
            SET Email = ?, Password = ?
            WHERE IDUser = ?
        `;
        console.log('Query ejecutada:', query);
        console.log('Parámetros:', [email, hashedPassword, idUser]);

        db.query(query, [email, hashedPassword, idUser], (err, result) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
                return res.status(500).json({ error: 'Error al actualizar credenciales', details: err.sqlMessage });
            }

            if (result.affectedRows === 0) {
                console.warn('No se encontraron credenciales con el ID de usuario proporcionado.');
                return res.status(404).json({ error: 'Credenciales no encontradas' });
            }

            res.json({ message: 'Credenciales actualizadas exitosamente' });
        });
    } catch (err) {
        console.error('Error interno:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};




    // Eliminar credenciales
    exports.deleteCredentials = (req, res) => {
        const { idSesion } = req.params;

        const query = `
        DELETE FROM user_register
        WHERE IDSesion = ?
    `;

        db.query(query, [idSesion], (err, result) => {
            if (err) {
                console.error('Error al eliminar credenciales:', err);
                return res.status(500).json({ error: 'Error al eliminar credenciales', details: err.sqlMessage });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Credenciales no encontradas' });
            }

            res.json({ message: 'Credenciales eliminadas exitosamente' });
        });
    };