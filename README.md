# DOCUMENTACION DE LA API  
## Bases de Datos NoSQL
> [!NOTE]
> **Alumno:** José Lino Díaz Canales `@joselino25`  
> **Grupo:** 5A (7:00-8:00)  
> **Docente:** Jorge Saúl Montes Cáceres  

**1. Considere el caso de una empresa mayorista de materiales de construcción. Todas las ventas que hace una sucursal implica la emisión de una factura. A la empresa le interesan los siguientes aspectos:**

## Prerequisitos de las APIS:
**1.1 Desargar el archivo txt llamado Datos_Neo4j.txt**

**1.2 Inicializar primeramente el contenedor de redis**
```
docker run -d --name redis01 -p 6379:6379 redis:latest
```

**1.3 Inicializar el contenedor de Neo4j**
```
Docker run -d --name neo01 -p 7474:7474 -p 7687:7687 --env=NEO4J_AUTH=none neo4j
```

**1.4. Descargar desde DockerHub la imagen de la API con el siguiente comando:**
```
docker pull joselino25/api_neo4j_redis:v1.0
```

**1.5 Utilizar los datos del archivo .txt que se encuentra en el proyecto en Neo4j**
```
http://localhost:7474/browser/
```

> [!NOTE]
> **Si desea hacer pruebas de la API con postman use la coleccion que  se encuentra en el proyecto**
> **Postman Collection:** Consultas NoSql.postman_collection.json


## Consultas Cypher

Las siguientes consultas pueden ejecutarse en Neo4j para obtener información del escenario.

### Q01. Obtener la lista de aeropuertos con más de 3 pistas
```cypher
MATCH (a:Aeropuerto) WHERE a.numero_pistas > 3 RETURN a.nombre AS aeropuerto, a.ciudad AS ciudad, a.numero_pistas AS umero_pistas
```

Ruta en Postman
```
/GET http://localhost:3000/api/aeropuertos
```

### Q02. Obtener la lista de empresas que trabajan en un aeropuerto específico
```cypher
MATCH (e:Empresa)-[:TRABAJA_EN]->(a:Aeropuerto {nombre: 'Aeropuerto Internacional CDMX'})
RETURN e.nombre AS empresa, a.nombre AS aeropuerto
```

Ruta en Postman
```
/GET http://localhost:3000/api/empresas/Aeropuerto Internacional Guadalajara
```

### Q03. Obtener la lista de aviones con una autonomía de vuelo mayor a 5000 millas
```cypher
MATCH (av:Avion)
WHERE av.millas_autonomia > 5000
RETURN av.id AS avion_id, av.modelo AS modelo, av.millas_autonomia AS autonomia
```

Ruta en Postman
```
/GET http://localhost:3000/api/aviones
```

### Q04. Obtener la lista de pilotos que tienen licencia para volar una ruta específica
```cypher
MATCH (p:Piloto)-[:PUEDE_VOLAR]->(r:Ruta {codigo: 'R1'})
RETURN p.nombre AS piloto, p.licencia AS licencia, r.codigo AS ruta, r.origen AS origen, r.destino AS destino
```

Ruta en Postman
```
/GET http://localhost:3000/api/pilotos/R10
```

### Q05. Obtener la lista de países en los que una empresa internacional no puede operar
```cypher
MATCH (e:Empresa) WHERE e.tipo = 'internacional' AND size(e.paises_no_operar) > 0 RETURN e.nombre AS empresa, e.paises_no_operar AS paises_restringidos
```

### Q06. Eliminar una empresa que ya no trabaja en un aeropuerto específico, eliminando también la información asociada
```cypher
MATCH (e:Empresa {nombre: 'AeroMex'})-[rel:TRABAJA_EN]->(a:Aeropuerto {nombre: 'Aeropuerto Internacional CDMX'})
DETACH DELETE e
```

Ruta en Postman
```
/DELETE http://localhost:3000/api/eliminar-empresa/AeroMex/Aeropuerto Internacional Cancún
```

### Q07. Encontrar las empresas que tienen más de 10 aviones y que trabajan en al menos dos aeropuertos diferentes
```cypher
MATCH (e:Empresa)-[:TRABAJA_EN]->(a:Aeropuerto)
WITH e, COUNT(DISTINCT a) AS numero_aeropuertos
WHERE e.numero_aviones > 10 AND numero_aeropuertos >= 2
RETURN e.nombre AS empresa, e.numero_aviones AS aviones, numero_aeropuertos
```

### Q08. Obtener la lista de rutas que son operadas por pilotos con licencia de tipo ATPL y que tienen una duración de vuelo mayor a 2 horas
```cypher
MATCH (p:Piloto {licencia: 'ATPL'})-[:PUEDE_VOLAR]->(r:Ruta)
WHERE r.duracion > 2
RETURN DISTINCT r.codigo AS ruta, r.origen AS origen, r.destino AS destino, r.duracion AS duracion
```

### Q09. Obtener la lista de personal de tierra que tiene más de 3 certificaciones y que trabaja para empresas que tienen más de 20 aviones
```cypher
MATCH (pt:PersonalTierra)-[:TRABAJA_PARA]->(e:Empresa)
WHERE size(pt.certificaciones) > 3 AND e.numero_aviones > 20
RETURN pt.nombre AS personal, e.nombre AS empresa, pt.certificaciones AS certificaciones
```

Ruta en Postman
```
/GET http://localhost:3000/api/personal-tierra
```

### Q10. Encontrar las rutas que son operadas por al menos dos empresas diferentes y que tienen una escala en un aeropuerto específico
```cypher
MATCH (r:Ruta)-[:OPERA]-(e:Empresa)
WITH r, COUNT(DISTINCT e) AS empresas_operando
WHERE empresas_operando >= 2 AND "Aeropuerto Internacional Monterrey" IN r.escalas
RETURN r.codigo AS Ruta, empresas_operando AS Empresas_que_Operan
```

### Q11. Agregar una nueva ruta de vuelo entre dos aeropuertos con tres escalas (tres nodos intermedios) entre el origen y el destino
```cypher
MATCH (a4:Aeropuerto {ciudad: 'Cancún'}),
      (a6:Aeropuerto {ciudad: 'Mazatlan'}),
      (a2:Aeropuerto {ciudad: 'Guadalajara'}),
      (empresa:Empresa {nombre: 'AirLink'}),
      (piloto:Piloto {nombre: 'Juan Pérez'}),
      (avion:Avion {id: 'AV1'})
CREATE (r11:Ruta {codigo: 'R11', origen: 'Cancún', destino: 'Guadalajara', duracion: 12, escalas: ['Cancún', 'Mazatlan', 'Guadalajara']})
CREATE (a4)-[:ESCALA_EN]->(r11)
CREATE (a6)-[:ESCALA_EN]->(r11)
CREATE (a2)-[:DESTINO_DE]->(r11)
CREATE (empresa)-[:OPERA]->(r11)
CREATE (piloto)-[:PUEDE_VOLAR]->(r11)
CREATE (avion)-[:ASIGNADO_A]->(r11);
```

Ruta en Postman
```
/POST http://localhost:3000/api/ruta-nueva
```

### Q12. Por cuestiones de política laboral, una empresa requiere dar de baja del sistema a todos sus pilotos
```cypher
MATCH (e:Empresa {nombre: 'VuelaConti'})<-[:TRABAJA_PARA]-(p:Piloto)
DETACH DELETE p
```

### Q13. Una venta de activos implica que todos los vuelos, pilotos, personal, etc., deben pasar de una empresa a otra
```cypher
MATCH (e1:Empresa {nombre: 'SkyWorld'})<-[:TRABAJA_PARA]-(p)
MATCH (e2:Empresa {nombre: 'AirLink'})
MERGE (p)-[:TRABAJA_PARA]->(e2)
DETACH DELETE e1
```

### Q14. Listar todos los vuelos incluyendo las escalas que realiza cada vuelo
```cypher
MATCH (r:Ruta)
RETURN r.codigo AS ruta, r.origen AS origen, r.destino AS destino, r.escalas AS escalas
```

### Q15. Un aeropuerto será remodelado, debe ser eliminado y todas sus operaciones deben ser reasignadas
```cypher
MATCH (a1:Aeropuerto {nombre: 'Aeropuerto Internacional CDMX'})
MATCH (a2:Aeropuerto {nombre: 'Aeropuerto Internacional Guadalajara'})
MATCH (e:Empresa)-[rel:TRABAJA_EN]->(a1)
DELETE rel
CREATE (e)-[:TRABAJA_EN]->(a2)
DETACH DELETE a1
```


### Q16. Insertar un aeropuerto y relacionarlo con una empresa ya existente

```cypher
CREATE (a7:Aeropuerto {id: 'A7', nombre: 'Aeropuerto Internacional Mérida', ciudad: 'Mérida', direccion: 'Carretera Mérida-Cancún', numero_pistas: 3})
WITH a7
MATCH (e:Empresa {nombre: 'EagleAir'})
CREATE (e)-[:TRABAJA_EN]->(a7)
RETURN a7, e
```

Ruta en Postman
```
/POST http://localhost:3000/api/insertar-aeropuerto
```

### Q17. Insertar un nuevo avion y asignarlo a una empresa ya existente


```cypher
CREATE (av6:Avion {id: 'AV6', modelo: 'Embraer E190', millas_autonomia: 4000, numero_pasajeros: 100, numero_tripulacion: 4, fecha_revision: '2024-04-10'})
WITH av6
MATCH (e:Empresa {nombre: 'VuelaConti'})
CREATE (av6)-[:PERTENECE_A]->(e)
RETURN av6, e
```

Ruta en Postman
```
/POST http://localhost:3000/api/aviones/nuevo
```

### Q18. Actualizar el numero de pistas de un aeropuerto 

```cypher
MATCH (a:Aeropuerto {id: 'A5'})
SET a.numero_pistas = 5
RETURN a
```

Ruta en Postman
```
/PUT http://localhost:3000/api/actualizar-pistas
```

### Q19. Actualizar de una empresa el numero de aviones que contiene y los países en los que no puede operar

```cypher
MATCH (e:Empresa {nombre: 'VuelaConti'})
SET e.numero_aviones = 20,
    e.paises_no_operar = ['China', 'Rusia', 'Irán']
RETURN e
```

Ruta en Postman
```
/PUT http://localhost:3000/api/actualizar-empresa
```

