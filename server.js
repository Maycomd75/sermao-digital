const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
let presentations = [];

wss.on('connection', function connection(ws) {
    clients.push(ws);
    console.log('Cliente conectado');

    ws.on('message', function incoming(message) {
        console.log('Mensagem recebida:', message.toString());

        const data = JSON.parse(message);

        if (data.type === 'SLIDE') {
            presentations.push(data);
            broadcast(data);
        } else if (data.type === 'PRESENTATION_START') {
            presentations = [data.slide];
            broadcast(data);
        } else if (data.type === 'BIBLE_VERSE') {
            presentations = [data];
            broadcast(data);
        }
    });

    ws.on('close', function close() {
        clients = clients.filter(client => client !== ws);
        console.log('Cliente desconectado');
    });
});

function broadcast(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;
server.listen(PORT, function listening() {
    console.log(`Servidor rodando em ws://localhost:${PORT}`);
});
