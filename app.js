const express = require('express');
const cors= require("cors")
const db = require('./config/db')
const sessionMiddleware = require('./middleware/session');
const bodyParser = require('body-parser');
const path = require('path');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const credentialsRoutes = require('./routes/credentialsRoutes');
const formQuotationRoutes = require('./routes/formQuoRoutes')


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(bodyParser.json());

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true,
}));
app.use('/api', projectRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', clientRoutes);
app.use('/api', employeeRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', credentialsRoutes);
app.use('/api', formQuotationRoutes); 

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/login', express.static(path.join(__dirname, '..', 'frontend', 'login')));


app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname,'..','frontend', 'login', 'index.html'))
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
