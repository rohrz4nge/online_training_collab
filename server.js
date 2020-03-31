import {set_local_value, get_local_json} from "./persistency_functions.js";
import {start_interval, interval} from "./interval_functions.js";
import {set_up_server, broadcast} from "./peer_functions.js";

const get_all_timers = () => {
    let all_timers = get_local_json("all_timers");
    if (!all_timers) all_timers = {};
    return all_timers
};

const get_timer = (name) => {
    let all_timers = get_all_timers();
    return all_timers[name]
};

const start = async () => {
    await set_up_server()
};

const start_timer = (timer_name) => {
    console.log(get_timer(timer_name));
    set_local_value("selected_interval", JSON.stringify(get_timer(timer_name)));
    start_interval();
    document.getElementById("timer").classList.add("visible");
    //document.getElementById("config").classList.remove("visible");
    set_local_value("play_client_sound", document.getElementById("play_client_sound").checked);
    set_local_value("server_name", document.getElementById("server_name").value);
};

const reset = () => {
    interval.stop();
    broadcast({stop: true});
    document.getElementById("timer").classList.remove("visible");
    //document.getElementById("config").classList.add("visible");
};

const add_timer = () => document.getElementById("new_timer").classList.replace("slideDown", "slideUp");
const exit_timer = () => document.getElementById("new_timer").classList.replace("slideUp", "slideDown");
const save_timer = () => {
    let all_timers = get_all_timers(), new_timer_name = document.getElementById("timer_name").value;
    all_timers[new_timer_name] = {
        reps: document.getElementById("reps").value,
        sets: document.getElementById("sets").value,
        seconds_on: document.getElementById("seconds_on").value,
        seconds_off: document.getElementById("seconds_off").value,
        seconds_set_pause: document.getElementById("seconds_set_pause").value,
        exercises: JSON.parse(`["${document.getElementById("exercises").value.split(",").join('", "')}"]`)
    };
    console.log(all_timers, new_timer_name);
    set_local_value("all_timers", JSON.stringify(all_timers));
    update_timers_shown();
    exit_timer();
};

const clear_timers_shown = () => {
    document.getElementById("timers").innerHTML = "";
};

const append_timer = (timer_name) => {
    let new_a = document.createElement("a"), new_heading = document.createElement("h2"),
        new_timer_div = document.createElement("div");
    new_heading.innerText = timer_name;
    new_a.appendChild(new_heading);
    new_a.name = timer_name;
    new_timer_div.classList.add("timer");
    new_timer_div.appendChild(new_a);
    document.getElementById("timers").appendChild(new_timer_div);
    document.addEventListener('click',function(e){
        if(e.target && (e.target.name === timer_name || e.target.parentElement.name === timer_name)){
            start_timer(timer_name);
        }
    });
};

const update_timers_shown = () => {
    clear_timers_shown();
    let all_timers = get_all_timers();
    if (Object.keys(all_timers).length <= 0) {
        let no_timers_div = document.createElement("div"), new_heading = document.createElement("h3");
        new_heading.innerText = `It looks like you haven't configured any timers yet. Click on the orange "+" icon below to get started!`;
        no_timers_div.appendChild(new_heading);
        no_timers_div.classList.add("no-timers");
        document.getElementById("timers").appendChild(no_timers_div);
    }
    for (let timer_name of Object.keys(all_timers)) {
        append_timer(timer_name)
    }
};
update_timers_shown();

document.getElementById("add_timer").addEventListener("click", add_timer);
document.getElementById("open_button").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", reset);
document.getElementById("close_new_timer").addEventListener("click", exit_timer);
document.getElementById("save_new_timer").addEventListener("click", save_timer);
