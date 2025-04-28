const db = require('../config/db');

// Añadir un nuevo registro a formquotation
exports.addFormQuotation = (req, res) => {
  const { zona_proyecto, presupuesto_aproximado, descripcion_proyecto, contacto_telefono, contacto_correo, contacto_celular } = req.body;

  if (!zona_proyecto || !presupuesto_aproximado || !descripcion_proyecto) {
    return res.status(400).json({ error: 'Todos los campos son necesarios' });
  }

  const query = `
    INSERT INTO formquotation (zona_proyecto, presupuesto_aproximado, descripcion_proyecto, contacto_telefono, contacto_correo, contacto_celular, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
  `;
  
  db.query(query, [zona_proyecto, presupuesto_aproximado, descripcion_proyecto, contacto_telefono, contacto_correo, contacto_celular], (err, result) => {
    if (err) {
      console.error('Error al añadir el registro:', err);
      return res.status(500).json({ error: 'Error al añadir el registro', details: err.sqlMessage });
    }
    res.status(201).json({ message: 'Registro añadido exitosamente', id: result.insertId });
  });
};

// Consultar todos los registros de formquotation
exports.getFormQuotations = (req, res) => {
  const query = 'SELECT * FROM formquotation';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar los registros:', err);
      return res.status(500).json({ error: 'Error al consultar los registros', details: err.sqlMessage });
    }
    res.status(200).json({ formquotations: results });
  });
};

// Actualizar el estado de una cotización
exports.updateQuotationStatus = (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  const query = `
    UPDATE formquotation
    SET status = ?
    WHERE id = ?
  `;

  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el estado:', err);
      return res.status(500).json({ error: 'Error al actualizar el estado', details: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    res.status(200).json({ message: 'Estado actualizado exitosamente' });
  });
};

// Consultar una cotización por ID
exports.getFormQuotationById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'El ID es requerido' });
  }

  const query = 'SELECT * FROM formquotation WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al consultar la cotización:', err);
      return res.status(500).json({ error: 'Error al consultar la cotización', details: err.sqlMessage });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    res.status(200).json(result[0]);
  });
};

exports.deleteFormQuotation = (req, res) => {
  const id = req.params.id;

  const query = "DELETE FROM formquotation WHERE id = ?";
  db.query(query, [id], (err, result) => {
      if (err) {
          console.error("Error al eliminar la cotización:", err);
          return res.status(500).json({ error: "Error al eliminar la cotización", details: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.status(200).json({ message: "Cotización eliminada correctamente" });
  });
};