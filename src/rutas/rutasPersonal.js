const express = require('express');
var router = express.Router();
const neo4j = require("neo4j-driver");
const cache = require("./logger");

var driver = neo4j.driver(
    'neo4j://172.19.0.3',
    neo4j.auth.basic('neo4j', 'neo4j')
 );


//Q04. Obtener la lista de pilotos que tienen licencia para volar una ruta específica
router.route('/pilotos/:codigoRuta')
    .all(cache)
    .get(async (req, res) => {
       const Q4 = `
           MATCH (p:Piloto)-[:PUEDE_VOLAR]->(r:Ruta {codigo: $codigoRuta})
           RETURN p.nombre AS piloto, p.licencia AS licencia, r.codigo AS ruta, r.origen AS origen, r.destino AS destino
       `;
       const session = driver.session();
       await session.run(Q4, { codigoRuta: req.params.codigoRuta })
           .then(result => {
               const pilotos = result.records.map(record => {
                   return {
                       piloto: record.get('piloto'),
                       licencia: record.get('licencia'),
                       ruta: record.get('ruta'),
                       origen: record.get('origen'),
                       destino: record.get('destino')
                   };
               });
               res.valor=pilotos;
               res.json({ Pilotos: pilotos });
           })
           .catch(error => {
               console.log(error);
               res.status(500).json({ error: 'Internal server error' });
           })
           .then(() => session.close());
   });


//Q09. Obtener la lista de personal de tierra que tiene más de 3 certificaciones y que trabaja para empresas que tienen más de 20 aviones
router.route('/personal-tierra')
    .all(cache)
    .get(async (req, res) => {
       const Q9 = `
           MATCH (pt:PersonalTierra)-[:TRABAJA_PARA]->(e:Empresa)
           WHERE size(pt.certificaciones) > 3 AND e.numero_aviones > 20
           RETURN pt.nombre AS personal, e.nombre AS empresa, pt.certificaciones AS certificaciones
       `;
       const session = driver.session();
       await session.run(Q9)
           .then(result => {
               const personalTierra = result.records.map(record => {
                   return {
                       personal: record.get('personal'),
                       empresa: record.get('empresa'),
                       certificaciones: record.get('certificaciones')
                   };
               });
               res.valor=personalTierra;
               res.json({ PersonalTierra: personalTierra });
           })
           .catch(error => {
               console.log(error);
               res.status(500).json({ error: 'Internal server error' });
           })
           .then(() => session.close());
   });

   
   module.exports = router;