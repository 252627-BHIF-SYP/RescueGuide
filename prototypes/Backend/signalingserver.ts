const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

let waitingPeers = [];
let activePairs = {}; // Speichert Paare { id1: id2, id2: id1 }

io.on('connection', (socket) => {
    console.log(`Neuer Client verbunden: ${socket.id}`);

    socket.on('ready_for_call', (localId) => {
        if (waitingPeers.length > 0) {

            // Paaren
            const peerAId = waitingPeers.shift(); // Erster wird entnommen
            const peerBId = localId; // 2. Peer

            // Paarung in paarungen speichern
            activePairs[peerAId] = peerBId;
            activePairs[peerBId] = peerAId;

            console.log(`Paarung gefunden: ${peerAId} und ${peerBId}`);

            // Es werden beide Peers informiert über den jeweiligen partner
            io.to(peerAId).emit('peer_found', peerBId);
            io.to(peerBId).emit('peer_found', peerAId);

        } else {
            // Keiner wartet. Füge diesen Peer zur Warteliste hinzu.
            waitingPeers.push(localId);
            console.log(`Warte auf Partner für ${localId}.`);
        }
    });


    socket.on('signal', (data) => {

        if (data.to && data.signal) {
            io.to(data.to).emit('signal', {
                from: socket.id,
                signal: data.signal
            });
        }
    });


    socket.on('disconnect', () => {
        console.log(`Client getrennt: ${socket.id}`);

        // Peer aus Warteliste nehmen
        waitingPeers = waitingPeers.filter(id => id !== socket.id);

        // Partner benachrichtigen
        const partnerId = activePairs[socket.id];
        if (partnerId) {
            io.to(partnerId).emit('peer_disconnected');
            console.log(`Partner ${partnerId} über Trennung von ${socket.id} informiert.`);

            // Paarung löschen
            delete activePairs[socket.id];
            delete activePairs[partnerId];
        }
    });
});