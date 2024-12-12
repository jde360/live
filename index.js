const express = require('express');
var cors = require('cors');
const app = express();
const webrtc = require("wrtc");

let senderStream;

app.use(express.static('public'));
app.use(express.json());
app.use(cors())
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
app.post("/consumer", async (req, res) => {
    try {
        const sdp = req.body.offer;
        console.log("CONSUMER\n::::::::::::::::::::::::::::::::\n", sdp);
        const offer = {
            sdp: sdp,
            type: "offer",
        }
        const peer = new webrtc.RTCPeerConnection({
            'iceServers': [
                {
                    'urls': [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302'
                    ]
                },
                {
                    'urls': [
                        'turn:3.111.40.187:3478',  // TURN over UDP
                        'turns:3.111.40.187:5349' // TURN over TLS
                    ],
                    'username': 'jiturn',
                    'credential': 'jiturnpass',
                }
            ],
        });
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate.candidate);
            }
        };
        const desc = new webrtc.RTCSessionDescription(offer);
        await peer.setRemoteDescription(desc);
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);


        res.json(peer.localDescription);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/broadcast', async (req, res) => {
    try {

        const sdp = req.body.offer;
        console.log("ASTROLOGER\n::::::::::::::::::::::::::::::::\n", sdp);
        const offer = {
            sdp: sdp,
            type: "offer",
        }

        const peer = new webrtc.RTCPeerConnection({
            'iceServers': [
                {
                    'urls': [
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302'
                    ]
                },
                {
                    'urls': [
                        'turn:3.111.40.187:3478',  // TURN over UDP
                        'turns:3.111.40.187:5349' // TURN over TLS
                    ],
                    'username': 'jiturn',
                    'credential': 'jiturnpass',
                }
            ],
        });
        peer.ontrack = (e) => handleTrackEvent(e, peer);
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate.candidate);
            }
        };
        const desc = new webrtc.RTCSessionDescription(offer);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        res.json(peer.localDescription);
    } catch (error) {
        console.log(error);
        console.log("*******************************");
        console.log(error.message);
        res.status(500).json({ error: error.message });

    }
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
};


app.listen(5000, () => console.log('server started on 5000'));