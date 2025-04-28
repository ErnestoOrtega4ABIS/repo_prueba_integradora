const db = require('../config/db'); // Importa la conexión a la base de datos

exports.getAssignments = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Obtener los parámetros de paginación de la solicitud
    const limit = parseInt(req.query.limit, 10) || 5; // Valor por defecto: 5
    const page = parseInt(req.query.page, 10) || 1;   // Valor por defecto: 1
    const offset = (page - 1) * limit;

    // Consulta SQL base
    let query = `
        SELECT 
            ae.IDAssignment, 
            ae.AssignmentDate, 
            e.Name AS EmployeeName, 
            e.LastName AS EmployeeLastName, 
            e.Cellphone AS EmployeePhone, 
            p.Name AS ProjectName, 
            ae.Status
        FROM assignment_employee ae
        JOIN user e ON ae.IDEmployee = e.IDUser AND e.UserType = 'Employee'
        JOIN project p ON ae.IDProject = p.IDProject
    `;

    // Agregar filtro si el usuario es un empleado
    if (UserType === 'Employee') {
        query += ` WHERE ae.IDEmployee = ?`;
    } else {
        query += ` WHERE ae.Status = 'Active'`;
    }

    // Agregar la paginación a la consulta
    query += ` LIMIT ? OFFSET ?`;

    // Parámetros para la consulta
    const params = UserType === 'Employee' ? [IDUser, limit, offset] : [limit, offset];

    // Ejecutar la consulta
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener las asignaciones:', err);
            return res.status(500).json({ error: 'Error al obtener las asignaciones', details: err.sqlMessage });
        }

        // Obtener el total de asignaciones para la paginación
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM assignment_employee ae
            ${UserType === 'Employee' ? `WHERE ae.IDEmployee = ?` : `WHERE ae.Status = 'Active'`}
        `;
        const countParams = UserType === 'Employee' ? [IDUser] : [];

        db.query(countQuery, countParams, (countErr, countResults) => {
            if (countErr) {
                console.error('Error al contar las asignaciones:', countErr);
                return res.status(500).json({ error: 'Error al contar las asignaciones', details: countErr.sqlMessage });
            }

            const total = countResults[0].total;

            // Responder con los datos y la información de paginación
            res.status(200).json({
                total,
                page,
                limit,
                assignments: results,
            });
        });
    });
};



// Obtener todos los empleados activos
exports.getEmployees = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    let query = `
        SELECT 
            IDUser AS EmployeeID, 
            Name AS EmployeeName, 
            LastName AS EmployeeLastName, 
            Cellphone AS EmployeePhone,
            Email AS EmployeeEmail
        FROM user
        WHERE UserType = 'Employee' AND Status = 'Active'
    `;

    // Agregar filtro si el usuario es un empleado
    if (UserType === 'Employee') {
        query += ` AND IDUser = ?`; // Solo mostrar los datos del usuario autenticado
    }

    db.query(query, [UserType === 'Employee' ? IDUser : null], (err, results) => {
        if (err) {
            console.error('Error al obtener empleados:', err);
            return res.status(500).json({ error: 'Error al obtener empleados', details: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron datos para este usuario.' });
        }

        res.status(200).json(results);
    });
};



exports.getProjects = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    let query = `
        SELECT 
            p.IDProject, 
            p.Name AS ProjectName,
            p.LandArea AS ProjectArea, 
            u.Name AS ClientName
        FROM project p
        JOIN user u ON p.IDClient = u.IDUser AND u.UserType = 'Client'
    `;

    // Agregar filtro si el usuario es un empleado
    if (UserType === 'Employee') {
        query += `
            JOIN assignment_employee ae ON p.IDProject = ae.IDProject
            WHERE ae.IDEmployee = ?
        `;
    } else {
        query += ` WHERE p.Status = 'Active'`; // Sin filtro adicional para Admin
    }

    db.query(query, [UserType === 'Employee' ? IDUser : null], (err, results) => {
        if (err) {
            console.error('Error al obtener proyectos:', err);
            return res.status(500).json({ error: 'Error al obtener proyectos', details: err.sqlMessage });
        }
        res.status(200).json(results);
    });
};



// Crear una nueva asignación
exports.createAssignment = (req, res) => {
    const { idEmployee, idProject } = req.body;

    console.log('Datos recibidos:', { idEmployee, idProject });

    if (!idEmployee || !idProject) {
        return res.status(400).json({ error: 'Los campos ID de empleado y proyecto son necesarios' });
    }

    const query = `
        INSERT INTO assignment_employee (AssignmentDate, IDEmployee, IDProject, Status)
        VALUES (NOW(), ?, ?, 'Active');
    `;

    db.query(query, [idEmployee, idProject], (err, result) => {
        if (err) {
            console.error('Error al crear la asignación:', err);
            return res.status(500).json({ error: 'Error al crear la asignación', details: err.sqlMessage });
        }
        res.status(201).json({ message: 'Asignación creada exitosamente', assignmentId: result.insertId });
    });
};


// Modificar una asignación existente
exports.updateAssignment = (req, res) => {
    const assignmentId = req.params.id;
    const { idEmployee, idProject, assignmentDate, status = 'Active' } = req.body; // Incluye assignmentDate

    if (!idEmployee || !idProject || !assignmentDate) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios (empleado, proyecto y fecha).' });
    }

    const query = `
        UPDATE assignment_employee 
        SET 
            IDEmployee = ?, 
            IDProject = ?, 
            AssignmentDate = ?, 
            Status = ?
        WHERE 
            IDAssignment = ?;
    `;

    db.query(query, [idEmployee, idProject, assignmentDate, status, assignmentId], (err, result) => {
        if (err) {
            console.error('Error al actualizar la asignación:', err);
            return res.status(500).json({ error: 'Error al actualizar la asignación', details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada o no se pudo actualizar' });
        }

        res.json({ message: 'Asignación actualizada exitosamente' });
    });
};



// Obtener una asignación específica por ID
exports.getAssignmentById = (req, res) => {
    const assignmentId = req.params.id;
    const user = req.user; // Extraemos el usuario autenticado
    const { UserType, IDUser } = user;

    // Consulta SQL base para obtener la asignación
    const query = `
        SELECT 
            ae.IDAssignment,
            ae.AssignmentDate,
            ae.IDEmployee,
            e.Name AS EmployeeName,
            e.LastName AS EmployeeLastName,
            e.Cellphone AS EmployeePhone,
            ae.IDProject,
            p.Name AS ProjectName,
            p.LandArea AS ProjectArea,
            u.Name AS ClientName,
            ae.Status
        FROM assignment_employee ae
        JOIN user e ON ae.IDEmployee = e.IDUser AND e.UserType = 'Employee'
        JOIN project p ON ae.IDProject = p.IDProject
        JOIN user u ON p.IDClient = u.IDUser AND u.UserType = 'Client'
        WHERE ae.IDAssignment = ? 
    `;

    db.query(query, [assignmentId], (err, results) => {
        if (err) {
            console.error('Error al obtener la asignación:', err);
            return res.status(500).json({ error: 'Error al obtener la asignación', details: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada.' });
        }

        const assignment = results[0];

        // Validar si el usuario tiene acceso a esta asignación
        if (UserType === 'Employee' && assignment.IDEmployee !== IDUser) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permiso para ver esta asignación.' });
        }

        res.status(200).json(assignment); // Devuelve la asignación si el acceso es válido
    });
};




// Cambiar el estado de una asignación a Inactive
exports.deleteAssignment = (req, res) => {
    const assignmentId = req.params.id;

    const query = `
        UPDATE assignment_employee
        SET Status = 'Inactive'
        WHERE IDAssignment = ?;
    `;

    db.query(query, [assignmentId], (err, result) => {
        if (err) {
            console.error('Error al eliminar la asignación:', err);
            return res.status(500).json({ error: 'Error al eliminar la asignación', details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Asignación no encontrada' });
        }

        res.json({ message: 'Asignación eliminada exitosamente' });
    });
};

