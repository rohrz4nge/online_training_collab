import {set_local_value} from "./persistency_functions.js";
import {join} from "./peer_functions.js";
import {start_interval, interval} from "./interval_functions.js";


const on_data_handler = function (data) {
    if (data.selected_interval) {
        console.log("timer received:", data);
        set_local_value("selected_interval", JSON.stringify(data.selected_interval));
        start_interval();
    } else if (data.stop === true) {
        interval.stop();
    } else {
        console.log("status msg by sender:", data);
    }
};

const start = async () => {
    console.log("starting");
    //save_values();
    document.getElementById("timer").classList.add("visible");
    document.getElementById("config").classList.remove("visible");
    set_local_value("client_name", document.getElementById("client_name").value);
    set_local_value("server_name", document.getElementById("server_name").value);
    try {
        await join(on_data_handler, reset);
    } catch (e) {
        reset();
    }
};

const reset = () => {
    interval.stop();
    document.getElementById("timer").classList.remove("visible");
    document.getElementById("config").classList.add("visible");
};

document.getElementById("start_button").addEventListener("click", start);