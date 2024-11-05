const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./logger");

var driver = neo4j.driver(
    'neo4j://172.19.0.3',
    neo4j.auth.basic('neo4j', 'neo4j')
 );


// Q02. Obtener la lista de empresas que trabajan en un aeropuerto específico
router.route('/empresas/:nombreAeropuerto')
    .all(cache)
    .get(async (req, res) => {
        const Q2 = `
            MATCH (e:Empresa)-[:TRABAJA_EN]->(a:Aeropuerto {nombre: $nombreAeropuerto})
            RETURN e.nombre AS empresa, a.nombre AS aeropuerto
        `;
        const session = driver.session();
        await session.run(Q2, { nombreAeropuerto: req.params.nombreAeropuerto })
            .then(result => {
                const empresas = result.records.map(record => {
                    return {
                        empresa: record.get('empresa'),
                        aeropuerto: record.get('aeropuerto')
                    };
                });
                res.data=empresas;
                res.json({ Empresas: empresas });
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            })
            .then(() => session.close());
});


//Q06. Eliminar una empresa que ya no trabaja en un aeropuerto específico, eliminando también la información asociada
router.route('/eliminar-empresa/:nombreEmpresa/:nombreAeropuerto')
    .all(cache)
    .delete(async (req, res) => {
        const session = driver.session();
        const Q6GetInfo = `
            MATCH (e:Empresa {nombre: $nombreEmpresa})-[rel:TRABAJA_EN]->(a:Aeropuerto {nombre: $nombreAeropuerto})
            RETURN e.nombre AS empresa, a.nombre AS aeropuerto, e AS detallesEmpresa
        `;
        const Q6Delete = `
            MATCH (e:Empresa {nombre: $nombreEmpresa})-[rel:TRABAJA_EN]->(a:Aeropuerto {nombre: $nombreAeropuerto})
            DETACH DELETE e
        `;

        await session.run(Q6GetInfo, {
            nombreEmpresa: req.params.nombreEmpresa,
            nombreAeropuerto: req.params.nombreAeropuerto
        })
        .then(async result => {
            if (result.records.length === 0) {
                res.status(404).json({ error: 'Empresa o aeropuerto no encontrados' });
            } else {
                const empresaInfo = result.records.map(record => {
                    return {
                        empresa: record.get('empresa'),
                        aeropuerto: record.get('aeropuerto'),
                        detalles: record.get('detallesEmpresa').properties
                    };
                });

                // Proceder a eliminar la empresa después de obtener la información
                await session.run(Q6Delete, {
                    nombreEmpresa: req.params.nombreEmpresa,
                    nombreAeropuerto: req.params.nombreAeropuerto
                });
                res.data=empresaInfo;
                res.json({
                    message: 'Empresa eliminada exitosamente',
                    datosEliminados: empresaInfo
                });
            }
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        })
        .then(() => session.close());
    });

//Q19. Actualizar de una empresa el numero de aviones que contiene y los países en los que no puede operar
router.route('/actualizar-empresa')
    .all(cache)
    .put(async (req, res) => {
        const { nombre, numero_aviones, paises_no_operar } = req.body;
        const Q19 = `
            MATCH (e:Empresa {nombre: $nombre})
            SET e.numero_aviones = toInteger($numero_aviones),
                e.paises_no_operar = $paises_no_operar
            RETURN e
        `;
        const session = driver.session();
        await session.run(Q19, { nombre, numero_aviones, paises_no_operar })
            .then(result => {
                if (result.records.length === 0) {
                    res.status(404).json({ error: 'Empresa no encontrada en la base de datos.' });
                } else {
                    const empresaActualizada = result.records[0].get('e').properties;
                    res.data=empresaActualizada;
                    res.json({ EmpresaActualizada: empresaActualizada });
                }
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            })
            .then(() => session.close());
    });






module.exports = router;