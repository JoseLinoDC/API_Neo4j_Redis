const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./logger");

var driver = neo4j.driver(
    'neo4j://172.17.0.3',
    neo4j.auth.basic('neo4j', 'neo4j')
 );



// Q03. Obtener la lista de aviones con una autonomía de vuelo mayor a 5000 millas.
router.route('/aviones')
    .all(cache)
    .get(async (req, res) => {
       const Q3 = `
           MATCH (av:Avion)
           WHERE av.millas_autonomia > 5000
           RETURN av.id AS avion_id, av.modelo AS modelo, av.millas_autonomia AS autonomia
       `;
       const session = driver.session();
       await session.run(Q3)
           .then(result => {
               const aviones = result.records.map(record => {
                   return {
                       avion_id: record.get('avion_id'),
                       modelo: record.get('modelo'),
                       autonomia: record.get('autonomia')
                   };
               });
               res.valor=aviones;
               res.json({ Aviones: aviones });
           })
           .catch(error => {
               console.log(error);
               res.status(500).json({ error: 'Internal server error' });
           })
           .then(() => session.close());
   });
//Q17. Insertar un nuevo avion y asignarlo a una empresa ya existente
    router.route('/aviones/nuevo')
    .all(cache)
    .post(async (req, res) => {
        const { id, modelo, millas_autonomia, numero_pasajeros, numero_tripulacion, fecha_revision, nombreEmpresa } = req.body;
        const Q17 = `
                CREATE (av:Avion {
                    id: $id,
                    modelo: $modelo,
                    millas_autonomia: toInteger($millas_autonomia),
                    numero_pasajeros: $numero_pasajeros,
                    numero_tripulacion: $numero_tripulacion,
                    fecha_revision: $fecha_revision
                })
                WITH av
                MATCH (e:Empresa {nombre: $nombreEmpresa})
                CREATE (av)-[:PERTENECE_A]->(e)
                RETURN av, e

        `;
        const session = driver.session();
        await session.run(Q17, {
            id,
            modelo,
            millas_autonomia: parseInt(millas_autonomia, 10),
            numero_pasajeros,
            numero_tripulacion,
            fecha_revision,
            nombreEmpresa
        })
        .then(result => {
            if (result.records.length === 0) {
                res.status(404).json({ error: 'Empresa no encontrada en la base de datos.' });
            } else {
                const nuevoAvion = result.records.map(record => {
                    return {
                        avion: record.get('av').properties,
                        empresa: record.get('e').properties
                    };
                });
                res.valor=nuevoAvion
                res.json({ AvionCreado: nuevoAvion });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        })
        .then(() => session.close());
    });


   module.exports = router;