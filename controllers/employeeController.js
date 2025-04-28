const db = require('../config/db');

exports.getEmployees = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Parámetros de paginación
    const page = parseInt(req.query.page, 10) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit, 10) || 5; // Número de registros por página (por defecto 5)

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
        return res.status(400).json({ error: 'Parámetros de paginación inválidos.' });
    }

    if (UserType === 'Employee') {
        // Consulta específica para empleados
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
            WHERE UserType = 'Employee' AND Status = 'Active' AND IDUser = ?;
        `;

        db.query(query, [IDUser], (err, results) => {
            if (err) {
                console.error('Error al obtener el empleado:', err);
                return res.status(500).json({ error: 'Error al obtener el empleado', details: err.sqlMessage });
            }

            res.status(200).json({ employees: results, total: results.length, page, totalPages: 1 });
        });
    } else if (UserType === 'Admin') {
        // Usar el procedimiento almacenado para obtener empleados (admin)
        const query = `CALL GetEmployeesAdmin(?, ?)`;

        db.query(query, [page, limit], (err, results) => {
            if (err) {
                console.error('Error al obtener los empleados mediante procedimiento almacenado:', err);
                return res.status(500).json({ error: 'Error al obtener los empleados', details: err.sqlMessage });
            }

            const employees = results[0]; // Primer conjunto contiene los empleados

            // Consultar el número total de empleados
            const totalQuery = `
                SELECT COUNT(*) AS total
                FROM user 
                WHERE UserType = 'Employee' AND Status = 'Active';
            `;

            db.query(totalQuery, [], (countErr, countResults) => {
                if (countErr) {
                    console.error('Error al contar empleados:', countErr);
                    return res.status(500).json({ error: 'Error al contar empleados', details: countErr.sqlMessage });
                }

                const totalEmployees = countResults[0]?.total || 0;
                const totalPages = Math.ceil(totalEmployees / limit);

                res.status(200).json({
                    employees,
                    total: totalEmployees,
                    page,
                    totalPages,
                });
            });
        });
    } else {
        res.status(403).json({ error: 'Acceso denegado. Solo empleados o administradores pueden acceder a esta información.' });
    }
};


// Actualizar un empleado
exports.updateEmployee = (req, res) => {
    const employeeId = req.params.id;
    const { name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp } = req.body;

    if (!name || !lastName || !surName || !gender || !phone || !cellphone || !email || !neighborhood || !address || !cp) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    const query = `
        UPDATE user
        SET Name = ?, LastName = ?, SurName = ?, Gender = ?, Phone = ?, Cellphone = ?, Email = ?, Neighborhood = ?, Address = ?, CP = ?
        WHERE IDUser = ? AND UserType = 'Employee' AND Status = 'Active';
    `;

    db.query(query, [name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp, employeeId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el empleado:', err);
            return res.status(500).json({ error: 'Error al actualizar el empleado', details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado o inactivo' });
        }

        res.json({ message: 'Empleado actualizado exitosamente' });
    });
};


exports.deleteEmployee = (req, res) => {
    const employeeId = req.params.id;

    const query = `
        UPDATE user
        SET Status = 'Inactive'
        WHERE IDUser = ? AND UserType = 'Employee';
    `;

    db.query(query, [employeeId], (err, result) => {
        if (err) {
            // Capturar el error del disparador
            if (err.code === 'ER_SIGNAL_EXCEPTION') {
                return res.status(400).json({
                    error: 'No se puede eliminar al empleado porque tiene proyectos asignados.',
                });
            }

            console.error('Error al eliminar al empleado:', err);
            return res.status(500).json({ 
                error: 'Error interno al eliminar al empleado',
                details: err.sqlMessage,
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado o ya está inactivo' });
        }

        res.json({ message: 'Empleado eliminado exitosamente' });
    });
};



// Crear un empleado
exports.createEmployee = (req, res) => {
    const { name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp } = req.body;

    if (!name || !lastName || !surName || !gender || !phone || !cellphone || !email || !neighborhood || !address || !cp) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    const query = `
        INSERT INTO user (Name, LastName, SurName, Gender, Phone, Cellphone, Email, Neighborhood, Address, CP, UserType, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Employee', 'Active');
    `;

    db.query(query, [name, lastName, surName, gender, phone, cellphone, email, neighborhood, address, cp], (err, result) => {
        if (err) {
            console.error('Error al insertar el empleado:', err);
            return res.status(500).json({ error: 'Error al insertar el empleado', details: err.sqlMessage });
        }
        res.status(201).json({ message: 'Empleado creado exitosamente', employeeId: result.insertId });
    });
};

exports.getEmployeeById = (req, res) => {
    const employeeId = req.params.id;
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Verificar si el usuario es un empleado y está intentando acceder a los datos de otro usuario
    if (UserType === 'Employee' && parseInt(employeeId) !== IDUser) {
        return res.status(403).json({ error: 'Acceso denegado. No puedes ver los datos de otro empleado.' });
    }

    const query = `
        SELECT 
            IDUser, Name, LastName, SurName, Gender, Phone, Cellphone, Email, Neighborhood, Address, CP
        FROM user 
        WHERE IDUser = ? AND UserType = 'Employee' AND Status = 'Active';
    `;

    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error al obtener el empleado:', err);
            return res.status(500).json({ error: 'Error al obtener el empleado', details: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado.' });
        }

        res.status(200).json(results[0]); // Devuelve los datos del empleado
    });
};

