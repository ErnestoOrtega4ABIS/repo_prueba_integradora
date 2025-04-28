const db = require('../config/db');

// Crear un nuevo usuario
const registerUser = (req, res) => {
    const {
        name,
        lastname,
        surname,
        gender,
        phone,
        cellphone,
        email,
        neighborhood,
        address,
        cp,
        userType,
        status
    } = req.body;

    const query = `
        INSERT INTO user (Name, LastName, SurName, Gender, Phone, Cellphone, Email, Neighborhood, Address, \C.P\, UserType, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [name, lastname, surname, gender, phone, cellphone, email, neighborhood, address, cp, userType, status];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al insertar el usuario:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.send('Usuario registrado exitosamente');
    });
};

// Leer todos los usuarios
const getAllUsers = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Consulta SQL base
    let query = `
        SELECT 
            IDUser, 
            Name, 
            LastName, 
            SurName, 
            Gender, 
            Phone, 
            Cellphone, 
            Email, 
            Neighborhood, 
            Address, 
            CP, 
            UserType, 
            Status
        FROM user
        WHERE Status = 'Active'
    `;

    const params = [];

    // Si no es Admin, limitar la consulta a los datos del usuario autenticado
    if (UserType !== 'Admin') {
        query += ` AND IDUser = ?`;
        params.push(IDUser);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron usuarios.' });
        }

        res.status(200).json(results); // Devuelve todos los usuarios (o el usuario autenticado)
    });
};



// Leer un solo usuario por ID
const getUserById = (req, res) => {
    const { id } = req.params; // ID del usuario solicitado
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Verificar acceso: los administradores pueden acceder a cualquier usuario
    if (UserType !== 'Admin' && parseInt(id) !== IDUser) {
        return res.status(403).json({ error: 'Acceso denegado. No puedes ver los datos de otro usuario.' });
    }

    // Consulta SQL para obtener los datos del usuario solicitado
    const query = `
        SELECT 
            IDUser, 
            Name, 
            LastName, 
            SurName, 
            Gender, 
            Phone, 
            Cellphone, 
            Email, 
            Neighborhood, 
            Address, 
            CP, 
            UserType, 
            Status
        FROM user 
        WHERE IDUser = ? AND Status = 'Active';
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener el usuario:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o inactivo.' });
        }

        res.status(200).json(results[0]); // Devuelve los datos del usuario solicitado
    });
};



// Actualizar un usuario
const updateUser = (req, res) => {
    const { id } = req.params;
    const {
        name,
        lastname,
        surname,
        gender,
        phone,
        cellphone,
        email,
        neighborhood,
        address,
        cp,
        userType,
        status
    } = req.body;

    const query = `
        UPDATE user
        SET Name = ?, LastName = ?, SurName = ?, Gender = ?, Phone = ?, Cellphone = ?, Email = ?, Neighborhood = ?, Address = ?, \C.P\ = ?, UserType = ?, Status = ?
        WHERE IDUser = ?
    `;

    const values = [name, lastname, surname, gender, phone, cellphone, email, neighborhood, address, cp, userType, status, id];

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al actualizar el usuario:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.send('Usuario actualizado exitosamente');
    });
};

// Cambiar el estado de un usuario a "Inactive" en lugar de eliminarlo
const deactivateUser = (req, res) => {
    const { id } = req.params;
    const query = 'UPDATE user SET Status = "Inactive" WHERE IDUser = ?';

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al desactivar el usuario:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.send('Usuario desactivado exitosamente');
    });
};

module.exports = {
    registerUser,
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser
};