const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

const socket = io();
let localId;
let remotePeerId = null;
let localStream;
let peerConnection;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callButton = document.getElementById('callPeer');
const hangupButton = document.getElementById('hangup');
const startButton = document.getElementById('startLocalStream');

// Verbindung hergestellt
socket.on('connect', () => {
    localId = socket.id;
    console.log(`Verbunden als Peer mit ID: ${localId}`);
    startButton.disabled = false;

    // Melde den Peer als bereit beim Server
    socket.emit('ready_for_call', localId);
});

// Peer gefunden
socket.on('peer_found', (peerId) => {
    if (peerId !== localId) {
        remotePeerId = peerId;
        console.log(`Partner gefunden: ${remotePeerId}`);

        // Der Peer mit der kleineren ID startet den Anruf
        if (localId < remotePeerId) {
            callButton.disabled = false;
        }
    }
});

// Eingehende Signale (Offer, Answer, Candidate) verarbeiten
socket.on('signal', async (data) => {
    console.log(`Signal von Peer ${data.from} empfangen:`, data.signal);

    // Initialisierung, wenn das erste Signal ankommt (Peer B / Angerufener)
    if (!peerConnection) {
        if (!localStream) {
            await startLocalStream();
        }
        await createPeerConnection();
    }

    // Offer empfangen (Peer B)
    if (data.signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        await sendAnswer();
    }
    // Answer empfangen (Peer A)
    else if (data.signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    }
    // ICE Candidate empfangen (Beide Peers)
    else if (data.signal.candidate) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        } catch (e) {
            console.error('Fehler beim Hinzufügen des ICE Candidate:', e);
        }
    }
});

startButton.addEventListener('click', startLocalStream);
callButton.addEventListener('click', callPeer);
hangupButton.addEventListener('click', hangup);

// Lokalen Stream starten, Browser wird "aufgefordert" um Erlaubnis für Kamera zu bitten
async function startLocalStream() {
    const constraints = { video: true, audio: true };
    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = localStream;

        startButton.disabled = true;
        callButton.disabled = false;

        console.log("Stream erfolgreich gestartet.");
    } catch (error) {
        console.error("Fehler beim Zugriff auf Medien:", error);
    }
}

// Peer Connection initialisieren
async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // ICE (Interactive Connectivity Establishment) Candidates sammeln und senden
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', {
                to: remotePeerId,
                signal: {
                    candidate: event.candidate
                }
            });
        }
    };

    // Remote Stream empfangen
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
        console.log("Remote Stream empfangen.");
        hangupButton.disabled = false;
    };

    // Verbindungsstatus prüfen
    peerConnection.onconnectionstatechange = () => {
        console.log(`Verbindungsstatus: ${peerConnection.connectionState}`);
    };

    // Lokalen Stream hinzufügen
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}


// Anruf starten
async function callPeer() {
    if (!remotePeerId) {
        console.warn("Warte auf Partner-ID...");
        return;
    }

    await createPeerConnection();

    // SDP Offer erstellen (Session Description Protocol): darin stehn technische Vorschläge für die Verbindung usw
    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer); // Hier wird das offer in die peerconnection "gespeichert"

    socket.emit('signal', {
        to: remotePeerId,
        signal: peerConnection.localDescription
    });

    console.log("SDP Offer gesendet.");
    callButton.disabled = true;
    hangupButton.disabled = false;
}

// Anruf empfangen bzw Antwort senden
async function sendAnswer() {

    // Antwort des angerufenen Peers wird auf der Basis des offers (in peerConnection gespeichert) erstellt (gemeinsame Nenner gesucht)
    const answer = await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    socket.emit('signal', {
        to: remotePeerId,
        signal: peerConnection.localDescription
    });

    console.log("SDP Answer gesendet.");
    callButton.disabled = true;
    hangupButton.disabled = false;
}

function hangup() {
    if (peerConnection) {
        peerConnection.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remotePeerId = null;

    console.log("Verbindung und Streams beendet.");

    startButton.disabled = false;
    callButton.disabled = true;
    hangupButton.disabled = true;
}