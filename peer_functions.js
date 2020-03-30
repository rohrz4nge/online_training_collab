import {get_local_value} from "./persistency_functions.js";

let client_connections = {}, hostConnection, peer_id, peer, registered = false;

const randomDigits = function () {
    return Math.floor(100000 + Math.random() * 900000);
};

const set_peer_id = function (id) {
    peer_id = id;
};
export const set_up_server = async function () {
    set_peer_id(document.getElementById("server_name").value);
    peer = new Peer(peer_id, {
        host: 'kfwong-server.herokuapp.com',
        port: 443,
        path: '/myapp',
        secure: true,
    });
    console.log(peer);
    await configure_peerjs();
};

export const set_up_client = async function (data_callback, close_callback) {
    set_peer_id(document.getElementById("client_name").value + randomDigits());
    console.log("Peer ID", peer_id);
    peer = await new Peer(peer_id, {
        host: 'kfwong-server.herokuapp.com',
        port: 443,
        path: '/myapp',
        secure: true,
    });
    await configure_peerjs(data_callback, close_callback);
};


const configure_peerjs = (data_callback = null, error_callback = null) => new Promise(function (resolve, reject) {
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
            broadcast(data);
        });
        connection.on('data', (data) => {
            if (data_callback) data_callback();
            broadcast(data);
        });

        connection.on('close', () => {
            delete client_connections[connection.peer.toString()];

            const data = {
                sender: 'SYSTEM',
                message: `${connection.peer} left.`,
            };

            updatePeerList();

            if (error_callback) error_callback();
            broadcast(data);
        });
    });

    peer.on('disconnected', () => {
        peer.reconnect();
    });

    peer.on('error', (error) => {
        console.log(error);
        if (error_callback) error_callback();
        reject();
    });
});

export async function join(data_callback, close_callback) {
    await set_up_client(data_callback, close_callback);
    hostConnection = peer.connect(
        get_local_value('server_name'),
    );
    hostConnection.on('open', () => {
        console.log(`CONNECTED TO ${hostConnection.peer}.`);
    });

    hostConnection.on('data', (data) => {
        data_callback(data);
        updatePeerList(data.peers);
    });

    hostConnection.on('close', () => {
        peer.destroy();
        close_callback();
    });
}

function updatePeerList(peerList) {
    let peers = peerList ? peerList : generatePeerList();
    let peer_list = peers.split(", ");
    peer_list = peer_list.slice(0, peer_list.length - 1).map(x => x.substring(0, x.length - 6));
    peers = peer_list.join(", ");
    console.log(peers);
    if (document.getElementById("peer_list")) {
        document.getElementById("peer_list").innerText = peers;
    } else console.log("Peers:", peers);
}

function generatePeerList() {
    let peer_list = Object
        .keys(client_connections);
    peer_list.push(`${peer_id} (HOST)`);
    return peer_list.join(', ');
}

export function broadcast(data) {
    data.peers = generatePeerList();
    Object
        .values(client_connections)
        .forEach((connection) => connection.send(data))
}

export {peer, hostConnection};