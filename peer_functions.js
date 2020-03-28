let client_connections = {}, hostConnection, peer_id, peer, registered = false;

const randomDigits = function (n) {
    return Math.floor(100000 + Math.random() * 900000);
};

const set_peer_id = function (id) {
    peer_id = id;
};
const set_up_server = async function () {
    set_peer_id(document.getElementById("server_id").value);
    peer = new Peer(peer_id, {
        host: 'kfwong-server.herokuapp.com',
        port: 443,
        path: '/myapp',
        secure: true,
    });
    await configure_peerjs();
};

const set_up_client = async function () {
    set_peer_id(document.getElementById("client_name").value + randomDigits(2));
    peer = await new Peer(peer_id, {
        host: 'kfwong-server.herokuapp.com',
        port: 443,
        path: '/myapp',
        secure: true,
    });
    await configure_peerjs();
};


const configure_peerjs = () => new Promise(function (resolve, reject) {
    peer.on('open', (id) => {
        resolve(true);
        registered = true;
    });

    peer.on('connection', (connection) => {
        connection.on('open', () => {
            client_connections[connection.peer] = connection;
            updatePeerList();
            const data = {
                sender: 'SYSTEM',
                message: `${connection.peer} joined.`
            };
            updateMessageBoard(data.sender, data.message);
            broadcast(data);
        });
        connection.on('data', (data) => {
            updateMessageBoard(data.sender, data.message);
            broadcast(data);
        });

        connection.on('close', () => {
            delete client_connections[connection.peer.toString()];

            const data = {
                sender: 'SYSTEM',
                message: `${connection.peer} left.`,
            };

            updatePeerList();
            updateMessageBoard(data.sender, data.message);

            broadcast(data);

            document.getElementById('hostId').innerText =
                'NOT CONNECTED TO ANYONE';
        });
    });

    peer.on('disconnected', () => {
        peer.reconnect();
    });

    peer.on('error', (error) => {
        console.log(error);
        reject();
    });
});

async function join() {
    await set_up_client();
    hostConnection = peer.connect(
        document.getElementById('server_id').value,
    );
    hostConnection.on('open', () => {
        document.getElementById(
            'hostId',
        ).innerText = `CONNECTED TO ${hostConnection.peer}.`;
    });

    hostConnection.on('data', (data) => {
        updateMessageBoard(data.sender, data.message);
        updatePeerList(data.peers);
    });

    hostConnection.on('close', () => {
        peer.destroy();
        location.reload();
    });
}

function updateMessageBoard(id, message) {
    document.getElementById(
        'messageBoard',
    ).innerText += `[${id}]: ${message}\n`;
}

function updatePeerList(peerList) {
    document.getElementById('peerList').innerText = peerList
        ? peerList
        : generatePeerList();
}

function generatePeerList() {
    let peer_list = Object
        .keys(client_connections);
    peer_list.push(`${peer_id} (HOST)`);
    return peer_list.join(', ');
}

function broadcast(data) {
    data.peers = generatePeerList();
    Object
        .values(client_connections)
        .forEach((connection) => connection.send(data))
}

function send() {
    const data = {
        sender: peer_id,
        message: document.getElementById('message').value,
    };

    if (hostConnection) {
        hostConnection.send(data);
    }
    if (Object.keys(client_connections).length > 0) {
        broadcast(data);
        updateMessageBoard(data.sender, data.message);
    }

    document.getElementById('message').innerText = '';
}

