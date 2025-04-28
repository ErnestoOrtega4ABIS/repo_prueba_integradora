const mysql = require('mysql2');

const port = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'renovatio_gc';
const DB_PORT = process.env.DB_PORT || 3306;


const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,       
    password: DB_PASSWORD,   
    database: DB_NAME,
    port: DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
    console.log('Conectado a la base de datos');
});

module.exports = db;
