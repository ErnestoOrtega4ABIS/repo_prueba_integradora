const db = require('../config/db'); // Importa la conexión a la base de datos

exports.getClients = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Parámetros para la paginación con valores por defecto
    const page = parseInt(req.query.page, 10) || 1; // Página actual (por defecto: 1)
    const limit = parseInt(req.query.limit, 10) || 5; // Límite de registros por página (por defecto: 10)

    // Validar parámetros de paginación
    if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
        return res.status(400).json({ error: 'Los parámetros de paginación no son válidos.' });
    }

    // Llamar al procedimiento almacenado
    const query = `CALL GetClients(?, ?, ?, ?)`;
    const queryParams = [UserType, IDUser, page, limit];

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al obtener los clientes mediante el procedimiento almacenado:', err);
            return res.status(500).json({ error: 'Error al obtener los clientes', details: err.sqlMessage });
        }

        // El resultado del procedimiento almacenado es un array de resultados
        const clients = results[0]; // Los datos están en la primera fila de resultados

        // Calcular el total de páginas para la paginación (lo ideal sería agregar esto en un segundo procedimiento)
        const totalQuery = `
            SELECT COUNT(*) AS total
            FROM user u
            WHERE u.UserType = 'Client' AND u.Status = 'Active'
        `;

        db.query(totalQuery, (countErr, countResults) => {
            if (countErr) {
                console.error('Error al contar los clientes:', countErr);
                return res.status(500).json({ error: 'Error al contar los clientes', details: countErr.sqlMessage });
            }

            const totalClients = countResults[0].total;
            const totalPages = Math.ceil(totalClients / limit);

            res.status(200).json({
                clients,
                total: totalClients,
                page,
                totalPages,
            });
        });
    });
};



exports.updateClient = (req, res) => {
    const clientId = req.params.id; // ID del cliente que se va a actualizar
    const { name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!name || !lastName || !surName || !gender || !phone || !cellphone || !email || !neighborhood || !address || !cp) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = `
        UPDATE user 
        SET 
            Name = ?, 
            LastName = ?, 
            SurName = ?, 
            Gender = ?, 
            Phone = ?, 
            Cellphone = ?, 
            Email = ?, 
            Neighborhood = ?, 
            Address = ?, 
            CP = ? 
        WHERE 
            IDUser = ? AND UserType = 'Client';
    `;

    db.query(
        query,
        [name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp, clientId],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar el cliente:', err);
                return res.status(500).json({ error: 'Error al actualizar el cliente', details: err.sqlMessage });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado o no tiene permisos para editar este cliente' });
            }

            res.json({ message: 'Cliente actualizado exitosamente' });
        }
    );
};


exports.deleteClient = (req, res) => {
    const clientId = req.params.id;

    // Consulta para actualizar el estado del cliente a "Inactive"
    const query = `
        UPDATE user
        SET Status = 'Inactive'
        WHERE IDUser = ? AND UserType = 'Client';
    `;

    db.query(query, [clientId], (err, result) => {
        if (err) {
            console.error('Error al eliminar al cliente:', err);
            return res.status(500).json({ 
                error: 'Error al elimianar al cliente', 
                details: err.sqlMessage 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado o ya está eliminado' });
        }

        res.json({ message: 'Cliente eliminado exitosamente' });
    });
};

exports.createClient = (req, res) => {
    const { name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp } = req.body;

    // Validar que todos los campos obligatorios estén presentes
    if (!name || !lastName || !surName || !gender || !phone || !cellphone || !email || !neighborhood || !address || !cp) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    // Consulta para insertar un nuevo cliente
    const query = `
        INSERT INTO user (Name, LastName, SurName, Gender, Phone, Cellphone, Email, Neighborhood, Address, CP, UserType, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Client', 'Active');
    `;

    db.query(query, [name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp], (err, result) => {
        if (err) {
            console.error('Error al insertar el cliente:', err);
            return res.status(500).json({ error: 'Error al insertar el cliente', details: err.sqlMessage });
        }
        res.status(201).json({ message: 'Cliente creado exitosamente', clientId: result.insertId });
    });
};

exports.getClientById = (req, res) => {
    const clientId = req.params.id;
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Consulta SQL base para obtener el cliente
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
            CP
        FROM user 
        WHERE IDUser = ? AND UserType = 'Client' AND Status = 'Active'
    `;

    // Agregar filtro si el usuario es un empleado
    if (UserType === 'Employee') {
        query += `
            AND IDUser IN (
                SELECT p.IDClient
                FROM project p
                JOIN assignment_employee ae ON p.IDProject = ae.IDProject
                WHERE ae.IDEmployee = ?
            )
        `;
    }

    db.query(
        query, 
        UserType === 'Employee' ? [clientId, IDUser] : [clientId], 
        (err, results) => {
            if (err) {
                console.error('Error al obtener el cliente:', err);
                return res.status(500).json({ error: 'Error al obtener el cliente', details: err.sqlMessage });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado o acceso denegado.' });
            }

            res.status(200).json(results[0]); // Devuelve los datos del cliente si es accesible
        }
    );
};

