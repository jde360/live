
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
      'iceServers': [
        {
          'urls': ['turn:64.227.166.7:3478', 'turns:64.227.166.7:5349'],
          'username': 'JIUser',
          'credential': 'JIPassword',
        }
      ],
      'iceTransportPolicy': 'all',
    });


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
      'iceServers': [
        {
          'urls': ['turn:64.227.166.7:3478', 'turns:64.227.166.7:5349'],
          'username': 'JIUser',
          'credential': 'JIPassword',
        }
      ],
      'iceTransportPolicy': 'all',
    });
        peer.ontrack = (event) => {
            broadcasts[broadcastId] = {
                peer,
                stream: event.streams[0]
            };
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
app.delete("/broadcast/:id", (req, res) => {
    const broadcastId = req.params.id;
    console.log("broadcastId::::::::::", broadcastId);
    console.log("broadcasts::::::::::", broadcasts);
    console.log("data::::::::::", broadcasts[broadcastId]);

    if (broadcasts[broadcastId]) {
        broadcasts[broadcastId].peer.close();
        delete broadcasts[broadcastId];
        res.status(200).send("Broadcast deleted");
    } else {
        res.status(400).send("Broadcast not found");
    }
});

app.listen(5000, () => console.log('Server started on 5000'));
