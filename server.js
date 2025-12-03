// servidor.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = new Set();
let lastPresentation = null; // guarda último estado para novos clientes

// Servir arquivos estáticos (tablet.html, projetor.html, etc.)
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => res.send('ok'));

wss.on('connection', (ws, req) => {
    clients.add(ws);
    console.log('📡 Cliente conectado. Total:', clients.size);

    // Ao conectar, enviar o último slide (se existir)
    if (lastPresentation) {
        try { ws.send(JSON.stringify(lastPresentation)); } catch (e) {}
    }

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message.toString());
        } catch (err) {
            console.warn('JSON inválido recebido:', message.toString());
            return;
        }

        console.log('Mensagem recebida:', data.type || 'unknown');

        // Tratar tipos
        switch (data.type) {
            case 'SLIDE':
                lastPresentation = data;
                broadcast(data);
                break;

            case 'PRESENTATION_START':
                // data.slide é o slide inicial
                lastPresentation = { type: 'PRESENTATION_START', slide: data.slide };
                broadcast({ type: 'PRESENTATION_START', slide: data.slide });
                break;

            case 'BIBLE_VERSE':
                lastPresentation = data;
                broadcast(data);
                break;

            default:
                console.log('Tipo não tratado:', data.type);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('❌ Cliente desconectado. Total:', clients.size);
    });

    ws.on('error', (err) => {
        console.log('WS error:', err && err.message);
        clients.delete(ws);
    });
});

function broadcast(data) {
    const msg = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(msg);
            } catch (e) {
                console.warn('Erro ao enviar para cliente:', e && e.message);
            }
        }
    });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP/WebSocket rodando na porta ${PORT}`);
    console.log(`👉 Abra http://localhost:${PORT}/tablet.html (local) ou use sua URL do Render`);
});
