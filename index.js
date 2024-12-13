// const express = require('express');
// var cors = require('cors');
// const app = express();
// const webrtc = require("wrtc");

// let senderStream;

// app.use(express.static('public'));
// app.use(express.json());
// app.use(cors())
// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });
// app.post("/consumer", async (req, res) => {
//     try {
//         const sdp = req.body.offer;
//         console.log("CONSUMER\n::::::::::::::::::::::::::::::::\n");
//         const offer = {
//             sdp: sdp,
//             type: "offer",
//         }
//         const peer = new webrtc.RTCPeerConnection({
//             'iceServers': [
//                 {
//                     'urls': [
//                         'stun:stun1.l.google.com:19302',
//                         'stun:stun2.l.google.com:19302'
//                     ]
//                 },
//                 {
//                     'urls': [
//                         'turn:3.111.40.187:3478',  // TURN over UDP
//                         'turns:3.111.40.187:5349' // TURN over TLS
//                     ],
//                     'username': 'jiturn',
//                     'credential': 'jiturnpass',
//                 }

//             ],
//             iceTransportPolicy: "relay",
//         });
//         peer.onicecandidate = (event) => {
//             if (event.candidate) {
//                 console.log("New ICE Candidate:", event.candidate.candidate);
//             }
//         };
//         const desc = new webrtc.RTCSessionDescription(offer);
//         await peer.setRemoteDescription(desc);
//         senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
//         const answer = await peer.createAnswer();
//         await peer.setLocalDescription(answer);


//         res.json(peer.localDescription);

//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// });

// app.post('/broadcast', async (req, res) => {
//     try {

//         const sdp = req.body.offer;
//         console.log("ASTROLOGER\n::::::::::::::::::::::::::::::::\n",);
//         const offer = {
//             sdp: sdp,
//             type: "offer",
//         }

//         const peer = new webrtc.RTCPeerConnection({
//             'iceServers': [
//                 {
//                     'urls': [
//                         'stun:stun1.l.google.com:19302',
//                         'stun:stun2.l.google.com:19302'
//                     ]
//                 },
//                 {
//                     'urls': [
//                         'turn:3.111.40.187:3478',  // TURN over UDP
//                         'turns:3.111.40.187:5349' // TURN over TLS
//                     ],
//                     'username': 'jiturn',
//                     'credential': 'jiturnpass',
//                 }
//             ],
//             iceTransportPolicy: "relay",
//         });
//         peer.ontrack = (e) => handleTrackEvent(e, peer);
//         peer.onicecandidate = (event) => {
//             if (event.candidate) {
//                 console.log("New ICE Candidate:", event.candidate.candidate);
//             }
//         };
//         const desc = new webrtc.RTCSessionDescription(offer);
//         await peer.setRemoteDescription(desc);
//         const answer = await peer.createAnswer();
//         await peer.setLocalDescription(answer);
//         res.json(peer.localDescription);
//     } catch (error) {
//         console.log(error);
//         console.log("*******************************");
//         console.log(error.message);
//         res.status(500).json({ error: error.message });

//     }
// });

// function handleTrackEvent(e, peer) {
//     senderStream = e.streams[0];
// };


// app.listen(5000, () => console.log('server started on 5000'));


const express = require('express');
var cors = require('cors');
const app = express();
const webrtc = require("wrtc");

const broadcasters = new Map(); // Store broadcaster streams by broadcastId

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/consumer", async (req, res) => {
    try {
        const { offer, broadcastId } = req.body;

        if (!broadcasters.has(broadcastId)) {
            return res.status(404).json({ error: "Broadcast not found" });
        }

        console.log("CONSUMER\n::::::::::::::::::::::::::::::::\n");

        const senderStream = broadcasters.get(broadcastId);
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
                    username: 'jiturn',
                    credential: 'jiturnpass',
                }
            ],
            iceTransportPolicy: "relay",
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE Candidate:", event.candidate.candidate);
            }
        };

        const desc = new webrtc.RTCSessionDescription({ sdp: offer, type: "offer" });
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
        const { offer, broadcastId } = req.body;

        console.log("BROADCAST\n::::::::::::::::::::::::::::::::\n");

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
                    username: 'jiturn',
                    credential: 'jiturnpass',
                }
            ],
            iceTransportPolicy: "relay",
        });

        peer.ontrack = (e) => {
            broadcasters.set(broadcastId, e.streams[0]); // Save broadcaster's stream
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

        res.json(peer.localDescription);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log('Server started on 5000'));
