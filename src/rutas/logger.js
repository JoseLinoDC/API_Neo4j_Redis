// Exportar una función middleware que se ejecutará en cada solicitud
/*
module.exports = (req, res, next) => {
    res.on('finish', async () => {

        const key = `${req.method}:${Date.now()}:${req.originalUrl}`;
        const valor = JSON.stringify({
            clave: key,
            time: new Date(),
            req: {
                method: req.method,
                url: req.originalUrl,
                headers: req.headers,
                body: req.body
            },
            res: {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                response: req.method === 'GET' ? res.data : null
            }
        });
        console.log(valor)
    });
    next();
};
*/

const redis = require('redis');
const client = redis.createClient({
    socket: {
        port: 6379,
        host: '172.19.0.2'
    }
});

// Conectar al cliente de Redis al cargar el archivo
client.connect().catch(console.error);

module.exports = (req, res, next) => {
    let responseBody;  // Variable para almacenar el contenido de la respuesta

    // Sobreescribimos el método 'send' de res para capturar la respuesta
    const originalSend = res.send;
    res.send = function (body) {
        responseBody = body;  // Guardar el contenido de la respuesta
        originalSend.call(this, body);  // Llamar a la función original 'send'
    };

    res.on('finish', async () => {
        // Construir la clave y el valor
        const fecha = new Date();
        const key = `${req.method}:${fecha.toLocaleDateString()}-${fecha.getHours()}-${fecha.getMinutes()}-${fecha.getSeconds()}:${req.originalUrl}`;

        // Almacenar todo en un solo objeto JSON en el valor
        const valor = JSON.stringify({
            clave: key,
            time: fecha,
            req: {
                method: req.method,
                url: req.originalUrl,
                headers: req.headers,
                body: req.body
            },
            res: {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                response: responseBody
            }
        });
        console.log(valor);
        
        try {
            await client.set(key, valor);
        } catch (error) {
            console.error("Error al conectar o enviar datos a Redis:", error);
        }
    });
    next();
};

// Desconectar el cliente Redis al cerrar la aplicación
process.on('exit', () => {
    client.disconnect().catch(console.error);
});