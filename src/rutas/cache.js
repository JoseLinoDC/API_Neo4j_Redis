//chache.js
/*
const redis = require('redis');
const client = redis.createClient({
   socket:{
       port:6379,
       host:'127.17.0.3'
   }
});
const cache = async function (req, res, next) {
   let fecha = new Date();
   await client.connect();
   await client.set(fecha.toLocaleDateString() + ":" + fecha.getHours() + "-" + fecha.getMinutes() + "-" + fecha.getSeconds(), " - " + req.method + " " + req.route.path);
   await client.disconnect();
   next()
}

module.exports = cache;
*/


const redis = require('redis');
const client = redis.createClient({
    socket: {
        port: 6379,
        host: '172.19.0.2'
    }
});

// Conectarse una vez al iniciar
client.connect().catch(console.error);

const cache = async function (req, res, next) {
    let fecha = new Date();
    const key = `${fecha.toLocaleDateString()}:${fecha.getHours()}-${fecha.getMinutes()}-${fecha.getSeconds()}`;
    
    const valor = JSON.stringify({
        method: req.method,
        path: req.route ? req.route.path : req.originalUrl,
        body: req.body
    });

    try {
        await client.set(key, valor);
    } catch (error) {
        console.error("Error al guardar en Redis:", error);
    }
    
    next();
};

// Al cerrar la aplicación, desconectar de Redis
process.on('exit', () => {
    client.disconnect().catch(console.error);
});




module.exports = cache;
