
const express = require('express');
var cors = require('cors');
const app = express();
const webrtc = require("wrtc");

// const broadcasters = new Map(); // Store broadcaster streams by broadcastId

let broadcasts = {}; //{broadcastId: stream}

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/consumer", async (req, res) => {
    try {
        const { offer, broadcastId } = req.body;

        if (!broadcasts[broadcastId]) {
            console.log("astrologer not live");
            return res.status(404).json({ error: "Broadcast not found" });
        }


        const senderStream = broadcasts[broadcastId].stream;

        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302'
                    ]
                },
                {
                    urls: [
                        'turn:3.111.40.187:3478', // TURN over UDP
                        'turns:3.111.40.187:5349' // TURN over TLS
                    ],
                    'username': 'jiturn',
                    'credential': 'jiturnpass',
                }
            ],
            iceTransportPolicy: "all",
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate.candidate);
            }
        };
        senderStream.getTracks().forEach((track) => peer.addTrack(track, senderStream));

        const desc = new webrtc.RTCSessionDescription({ sdp: offer, type: "offer" });
        await peer.setRemoteDescription(desc);
        // senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log("----------CONSUMER-----------------\n", broadcasts);

        res.json(peer.localDescription);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/broadcast', async (req, res) => {
    try {
        const { offer, broadcastId } = req.body;


        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302'
                    ]
                },
                {
                    urls: [
                        'turn:3.111.40.187:3478', // TURN over UDP
                        'turns:3.111.40.187:5349' // TURN over TLS
                    ],
                    'username': 'jiturn',
                    'credential': 'jiturnpass',
                }
            ],
            iceTransportPolicy: "all",
        });
        peer.ontrack = (event) => {
            broadcasts[broadcastId] = {
                peer,
                stream: event.streams[0]
            };
        };
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate.candidate);
            }
        };
        const desc = new webrtc.RTCSessionDescription({ sdp: offer, type: "offer" });
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        console.log("----------PRODUCER-----------------\n", broadcasts);


        res.json(peer.localDescription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log('Server started on 5000'));
