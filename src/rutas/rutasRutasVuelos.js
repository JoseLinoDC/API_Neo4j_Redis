const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./logger");

var driver = neo4j.driver(
    'neo4j://172.17.0.3',
    neo4j.auth.basic('neo4j', 'neo4j')
 );



//Q14. Listar todos los vuelos incluyendo las escalas que realiza cada vuelo
router.route('/vuelos')
    .all(cache)
    .get(async (req, res) => {
        const Q14 = `
            MATCH (r:Ruta)
            RETURN r.codigo AS ruta, r.origen AS origen, r.destino AS destino, r.escalas AS escalas
        `;
        const session = driver.session();
        await session.run(Q14)
            .then(result => {
                const vuelos = result.records.map(record => {
                    return {
                        ruta: record.get('ruta'),
                        origen: record.get('origen'),
                        destino: record.get('destino'),
                        escalas: record.get('escalas')
                    };
                });
                res.valor=vuelos;
                res.json({ Vuelos: vuelos });
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            })
            .then(() => session.close());
});

//Q11. Agregar una nueva ruta de vuelo entre dos aeropuertos con tres escalas (tres nodos intermedios) entre el origen y el destino
router.route('/ruta-nueva')
    .all(cache)
    .post(async (req, res) => {
        const { codigo, origen, destino, duracion, escalas, empresaNombre, pilotoNombre, avionId } = req.body;
        const Q11 = `
            MATCH (aOrigen:Aeropuerto {ciudad: $origen}),
                    (aEscala1:Aeropuerto {ciudad: $escala1}),
                    (aEscala2:Aeropuerto {ciudad: $escala2}),
                    (aDestino:Aeropuerto {ciudad: $destino}),
                    (empresa:Empresa {nombre: $empresaNombre}),
                    (piloto:Piloto {nombre: $pilotoNombre}),
                    (avion:Avion {id: $avionId})

            CREATE (ruta:Ruta {codigo: $codigo, origen: $origen, destino: $destino, duracion: $duracion, escalas: [$origen, $escala1, $destino]})
            CREATE (aOrigen)-[:ESCALA_EN]->(ruta)
            CREATE (aEscala1)-[:ESCALA_EN]->(ruta)
            CREATE (aEscala2)-[:ESCALA_EN]->(ruta)
            CREATE (aDestino)-[:DESTINO_DE]->(ruta)
            CREATE (empresa)-[:OPERA]->(ruta)
            CREATE (piloto)-[:PUEDE_VOLAR]->(ruta)
            CREATE (avion)-[:ASIGNADO_A]->(ruta)
            RETURN ruta.codigo AS codigo, ruta.origen AS origen, ruta.destino AS destino, ruta.duracion AS duracion, ruta.escalas AS escalas
        `;
        const session = driver.session();
        await session.run(Q11, {
            codigo,
            origen,
            destino,
            duracion,
            escala1: escalas[0],
            escala2: escalas[1],
            empresaNombre,
            pilotoNombre,
            avionId
        })
        .then(result => {
            if (result.records.length === 0) {
                res.status(404).json({ error: 'Uno o más nodos especificados no se encontraron en la base de datos.' });
            } else {
                const nuevaRuta = result.records.map(record => {
                    return {
                        codigo: record.get('codigo'),
                        origen: record.get('origen'),
                        destino: record.get('destino'),
                        duracion: record.get('duracion'),
                        escalas: record.get('escalas')
                    };
                });
                res.valor=nuevaRuta;
                res.json({ RutaCreada: nuevaRuta });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        })
        .then(() => session.close());
    });






module.exports = router;


