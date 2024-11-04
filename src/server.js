//server.js
const express = require('express');
const app = express();
const neo4j = require("neo4j-driver");
const bodyParser = require('body-parser');
const PORT = 3000;

const rutasAeropuertos = require('./rutas/rutasAeropuertos');
const rutasAviones = require('./rutas/rutasAviones');
const rutasEmpresas = require('./rutas/rutasEmpresas');
const rutasPersonal = require('./rutas/rutasPersonal');
const rutasRutasVuelos = require('./rutas/rutasRutasVuelos');
const rutaslogger = require('./rutas/logger');


//middlewares
app.use(rutaslogger);
app.use(bodyParser.urlencoded({extended: true }));
app.use(bodyParser.json());
app.use('/api', rutasAeropuertos, rutasAviones,rutasEmpresas, rutasPersonal,rutasRutasVuelos );
app.listen(PORT, () => { console.log('Server en http://localhost:' + PORT) });