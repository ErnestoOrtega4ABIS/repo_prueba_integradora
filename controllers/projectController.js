const db = require('../config/db'); // Importa la conexión a la base de datos

exports.getProjects = (req, res) => {
    const user = req.user; // Usuario autenticado
    const { UserType, IDUser } = user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const query = `CALL GetProjects(?, ?, ?, ?)`;

    db.query(query, [UserType, IDUser, page, limit], (err, results) => {
        if (err) {
            console.error('Error al ejecutar el procedimiento almacenado:', err);
            return res.status(500).json({ error: 'Error al obtener los proyectos' });
        }

        // El resultado de un procedimiento almacenado en MySQL está en la primera posición del array de resultados.
        const projects = results[0];

        // Obtener total de proyectos
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM project p
            ${UserType === 'Employee' ? 'JOIN assignment_employee ae ON p.IDProject = ae.IDProject WHERE ae.IDEmployee = ? AND p.Status = "Active"' : 'WHERE p.Status = "Active"'}
        `;

        db.query(countQuery, UserType === 'Employee' ? [IDUser] : [], (err, countResult) => {
            if (err) {
                console.error('Error al contar los proyectos:', err);
                return res.status(500).json({ error: 'Error al contar los proyectos' });
            }

            res.status(200).json({
                projects: projects,
                total: countResult[0].total,
                page,
                totalPages: Math.ceil(countResult[0].total / limit),
            });
        });
    });
};


// Crear un nuevo proyecto
exports.createProject = (req, res) => {
    const { name, landArea, startDate, endDate, clientId, projectTypeId } = req.body;
    const status = req.body.status || "Active"; // Valor por defecto "Active"

    // Validación de los datos recibidos
    if (!name || !landArea || !startDate || !endDate || !clientId || !projectTypeId) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    const query = `
        INSERT INTO project (Name, LandArea, StartDate, EndDate, IDClient, IDType, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [name, landArea, startDate, endDate, clientId, projectTypeId, status], (err, result) => {
        if (err) {
            console.error('Error al crear el proyecto:', err);
            return res.status(500).json({ error: 'Error al crear el proyecto', details: err.sqlMessage });
        }
        res.status(201).json({ message: 'Proyecto creado exitosamente', projectId: result.insertId });
    });
};


// Modificar un proyecto existente
exports.updateProject = (req, res) => {
    const projectId = req.params.id; // El ID del proyecto que se va a actualizar
    const { name, landArea, startDate, endDate, clientId, projectTypeId} = req.body;

    // Validación de los datos recibidos
    if (!name || !landArea || !startDate || !endDate || !clientId || !projectTypeId) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' });
    }

    const query = `
        UPDATE project
        SET Name = ?, LandArea = ?, StartDate = ?, EndDate = ?, IDClient = ?, IDType = ?
        WHERE IDProject = ?
    `;

    db.query(query, [name, landArea, startDate, endDate, clientId, projectTypeId, projectId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el proyecto:', err);
            return res.status(500).json({ error: 'Error al actualizar el proyecto', details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ message: 'Proyecto actualizado exitosamente' });
    });
};

exports.deleteProject = (req, res) => {
    const projectId = req.params.id;

    const query = `
        UPDATE project
        SET Status = 'Inactive'
        WHERE IDProject = ?
    `;

    db.query(query, [projectId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el proyecto:', err);
            return res.status(500).json({ error: 'Error al eliminar el proyecto', details: err.sqlMessage });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ message: 'Proyecto eliminado exitosamente' });
    });
};


exports.getProjectTypes = (req, res) => {
    const query = `SELECT IDProjectType, Description FROM project_type`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los tipos de proyecto:', err);
            return res.status(500).json({ error: 'Error al obtener los tipos de proyecto' });
        }
        res.status(200).json(results);
    });
};

// Controlador para obtener clientes
exports.getClients = (req, res) => {
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    let query = `
        SELECT 
            u.IDUser AS ClientID, 
            u.Email, 
            u.Name AS ClientName, 
            u.LastName, 
            u.Phone
        FROM user u
        WHERE u.UserType = 'Client' AND u.Status = 'Active'
    `;

    // Agregar filtro si el usuario es un empleado
    if (UserType === 'Employee') {
        query += `
            AND u.IDUser IN (
                SELECT p.IDClient
                FROM project p
                JOIN assignment_employee ae ON p.IDProject = ae.IDProject
                WHERE ae.IDEmployee = ?
            )
        `;
    }

    db.query(query, [UserType === 'Employee' ? IDUser : null], (err, results) => {
        if (err) {
            console.error('Error al obtener los clientes:', err);
            return res.status(500).json({ error: 'Error al obtener los clientes', details: err.sqlMessage });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron clientes asociados.' });
        }

        res.status(200).json(results);
    });
};


exports.getProjectById = (req, res) => {
    const projectId = req.params.id;
    const user = req.user; // Extraemos los datos del usuario autenticado
    const { UserType, IDUser } = user;

    // Consulta SQL base para obtener el proyecto
    let query = `
        SELECT 
            p.IDProject,
            p.Name AS ProjectName,
            p.LandArea,
            p.StartDate,
            p.EndDate,
            u.IDUser AS ClientID,
            pt.IDProjectType AS ProjectTypeID,
            p.Status
        FROM 
            project p
        JOIN 
            user u ON p.IDClient = u.IDUser
        JOIN 
            project_type pt ON p.IDType = pt.IDProjectType
        WHERE 
            p.IDProject = ?
    `;

    // Agregar validación para empleados
    if (UserType === 'Employee') {
        query += `
            AND p.IDProject IN (
                SELECT ae.IDProject
                FROM assignment_employee ae
                WHERE ae.IDEmployee = ?
            )
        `;
    }

    db.query(
        query, 
        UserType === 'Employee' ? [projectId, IDUser] : [projectId], 
        (err, results) => {
            if (err) {
                console.error('Error al obtener el proyecto:', err);
                return res.status(500).json({ error: 'Database query failed', details: err.sqlMessage });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado o acceso denegado.' });
            }

            res.json(results[0]); // Devuelve los datos del proyecto si es accesible
        }
    );
};

