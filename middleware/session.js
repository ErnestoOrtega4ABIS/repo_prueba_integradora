const session = require('express-session');

const sessionMiddleware = session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Cambia a true si usas HTTPS
});

module.exports = sessionMiddleware;
