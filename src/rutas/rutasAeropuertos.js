const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./logger");

var driver = neo4j.driver(
    'neo4j://172.17.0.3',
    neo4j.auth.basic('neo4j', 'neo4j')
 );

 // Q01. Obtener la lista de aeropuertos con más de 3 pistas
router.route('/aeropuertos')
    .all(cache)
    .get(async (req, res) => {
        const Q1 = 'MATCH (a:Aeropuerto) WHERE a.numero_pistas > 3 RETURN a';
        const session = driver.session();
        await session.run(Q1)
            .then(result => {
                const aeropuertos = result.records.map(record => {
                    return record.get('a').properties;
                });
                res.valor=aeropuertos;
                res.json({ Aeropuertos: aeropuertos });
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            })
            .then(() => session.close());
});

//Q15. Un aeropuerto será remodelado, debe ser eliminado y todas sus operaciones deben ser reasignadas
router.route('/remodelar/:nombreAntiguo/:nombreNuevo')
    .all(cache)
    .delete(async (req, res) => {
        const { nombreAntiguo, nombreNuevo } = req.params;
        const session = driver.session();
        
        try {
            // Primer paso: Transferir todas las relaciones y operaciones
            const Q15Transfer = `
                MATCH (a1:Aeropuerto {nombre: $nombreAntiguo})
                MATCH (a2:Aeropuerto {nombre: $nombreNuevo})
                MATCH (e:Empresa)-[rel:TRABAJA_EN]->(a1)
                DELETE rel
                CREATE (e)-[:TRABAJA_EN]->(a2)
                RETURN a1.nombre AS aeropuertoAntiguo, a2.nombre AS aeropuertoNuevo
            `;
            
            // Ejecutar la transferencia de relaciones
            const transferResult = await session.run(Q15Transfer, { nombreAntiguo, nombreNuevo });

            if (transferResult.records.length === 0) {
                res.status(404).json({ error: 'Uno o ambos aeropuertos especificados no se encontraron en la base de datos.' });
                return;
            }

            // Segundo paso: Eliminar el aeropuerto antiguo
            const Q15Delete = `
                MATCH (a1:Aeropuerto {nombre: $nombreAntiguo})
                DETACH DELETE a1
            `;
            await session.run(Q15Delete, { nombreAntiguo });

            const remodelacionInfo = transferResult.records.map(record => ({
                aeropuertoAntiguo: record.get('aeropuertoAntiguo'),
                aeropuertoNuevo: record.get('aeropuertoNuevo')
            }));
            res.valor = remodelacionInfo;
            res.json({
                message: 'Aeropuerto remodelado exitosamente y operaciones reasignadas',
                detallesRemodelacion: remodelacionInfo
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            session.close();
        }
    });

//Q16. Insertar un aeropuerto y relacionarlo con una empresa ya existente
router.route('/insertar-aeropuerto')
   .post(async (req, res) => {
       console.log("Solicitud recibida en /insertar-aeropuerto:", req.body);
       const { id, nombre, ciudad, direccion, numero_pistas, nombreEmpresa } = req.body;
       const session = driver.session();

       try {
           // Verificar si la empresa existe
           console.log("Verificando existencia de la empresa...");
           const empresaExistente = await session.run(
               `MATCH (e:Empresa {nombre: $nombreEmpresa}) RETURN e`, 
               { nombreEmpresa }
           );

           if (empresaExistente.records.length === 0) {
               console.log("Empresa no encontrada");
               return res.status(404).json({ error: 'Empresa no encontrada en la base de datos.' });
           }
           console.log("Empresa encontrada, procediendo a crear el aeropuerto...");

           // Crear el aeropuerto y establecer la relación
           const Q16 = `
               CREATE (a:Aeropuerto {
                   id: $id,
                   nombre: $nombre,
                   ciudad: $ciudad,
                   direccion: $direccion,
                   numero_pistas: toInteger($numero_pistas)
               })
               WITH a
               MATCH (e:Empresa {nombre: $nombreEmpresa})
               CREATE (e)-[:TRABAJA_EN]->(a)
               RETURN a, e
           `;

           const result = await session.run(Q16, {
               id,
               nombre,
               ciudad,
               direccion,
               numero_pistas,
               nombreEmpresa
           });

           if (result.records.length === 0) {
               console.log("No se pudo crear el aeropuerto o establecer la relación");
               res.status(500).json({ error: 'No se pudo crear el aeropuerto o establecer la relación.' });
           } else {
               const aeropuertoCreado = result.records.map(record => ({
                   aeropuerto: record.get('a').properties,
                   empresa: record.get('e').properties
               }));
               res.valor = aeropuertoCreado;
               console.log("Aeropuerto creado exitosamente:", aeropuertoCreado);
               res.json({ AeropuertoCreado: aeropuertoCreado });
           }

       } catch (error) {
           console.error("Error en el proceso:", error);
           res.status(500).json({ error: 'Internal server error' });
       } finally {
           session.close();
       }
   });






//Q18. Actualizar el numero de pistas de un aeropuerto 
    router.route('/actualizar-pistas')
    .put(async (req, res) => {
        const { id, numero_pistas } = req.body;
        const Q18 = `
            MATCH (a:Aeropuerto {id: $id})
            SET a.numero_pistas = toInteger($numero_pistas)
            RETURN a
        `;
        const session = driver.session();
        await session.run(Q18, { id, numero_pistas })
            .then(result => {
                if (result.records.length === 0) {
                    res.status(404).json({ error: 'Aeropuerto no encontrado en la base de datos.' });
                } else {
                    const aeropuertoActualizado = result.records[0].get('a').properties;
                    res.valor = aeropuertoActualizado;
                    res.json({ AeropuertoActualizado: aeropuertoActualizado });
                }
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            })
            .then(() => session.close());
    });

 



module.exports = router;