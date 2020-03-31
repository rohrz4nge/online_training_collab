import {get_local_value} from "./persistency_functions.js";
import {broadcast} from "./peer_functions.js";

let timer = 0, timer_end = 0, timer_interval = null;

const get_val = function (key) {
    return JSON.parse(get_local_value("selected_interval"))[key];
};

const get_exercises = function () {
    return JSON.parse(localStorage.getItem("selected_interval")).exercises;
};

const set_interval = function () {
    localStorage.setItem("selected_interval", JSON.stringify({
        reps: 3,
        sets: 2,
        seconds_on: 2,
        seconds_off: 2,
        seconds_set_pause: 5,
        exercises: ["a", "b", "c"]
    }))
};
set_interval();

const change_play_pause = function (show_id = "play", hide_id = "stop") {
    if (document.getElementById(show_id) && document.getElementById(hide_id)) {
        document.getElementById(show_id).style.display = "inline-block";
        document.getElementById(hide_id).style.display = "none";
    }
};
change_play_pause();

//const show_timer_name = (name) => document.getElementById("current_timer_name").innerText = name;

const show_time = () => {
    timer = Date.now();
    if (timer < timer_end) document.getElementById("current_time").innerText = new Date((timer_end - timer)).toTimeString().slice(3, 9);
    else {
        clearInterval(timer_interval);
        document.getElementById("current_time").innerText = "00:00"
    }
};

const update_time = function (duration) {
    if (timer_interval) clearInterval(timer_interval);
    timer = Date.now();
    timer_end = timer + duration * 1000;
    timer_interval = setInterval(show_time, 100);
};

const show_reps = (current_reps, current_set) => document.getElementById("current_reps").innerText = `Rep ${current_reps} - Set ${current_set}`;

const show_exercise = (exercise_name) => document.getElementById("exercise_name").innerText = "Next: " + exercise_name;
show_exercise(get_exercises()[0]);
const working_exercise = () => {
    let elem = document.getElementById("exercise_name");
    elem.innerText = elem.innerText.slice("Next: ".length);
};

export const start_interval = () => {
    console.log("interval started");
    interval.countdown(3);
    change_play_pause("stop", "play");
};

const change_color = function (color) {
    document.getElementById("timer").classList.replace(document.getElementById("timer").classList.item(1), color);
};

export const interval = {
    start_time: Date.now(),
    timeouts: [],
    intervals: [],
    stopped: true,
    current_exercise: "",
    exercises: [""],
    update_exercise() {
        interval.current_exercise = interval.exercises[interval.current_reps % interval.exercises.length];
        show_exercise(interval.current_exercise);
        console.log(interval.current_exercise, interval.exercises);
    },
    countdown(n) {
        if (!interval.stopped) {
        } else if (n <= 1) {
            interval.start();
            interval.stopped = false;
        } else {
            if (n === 3) {
                interval.setup();
                //if (server) send_start(Date.now());
                update_time(2);
            }
            play_sound("countdown");
            interval.timeouts.push(setTimeout(interval.countdown, 1000, n - 1))
        }
    },
    setup() {
        interval.reps = get_val("reps");
        interval.current_reps = 0;
        interval.sets = get_val("sets");
        interval.current_sets = 0;
        interval.seconds_on = get_val("seconds_on");
        interval.seconds_off = get_val("seconds_off");
        interval.seconds_set_pause = get_val("seconds_set_pause");
        interval.exercises = get_exercises();
        interval.exercise = interval.exercises[0];
        let sets = interval.sets, reps = interval.reps,
            seconds_on = interval.seconds_on, seconds_off = interval.seconds_off,
            seconds_set_pause = interval.seconds_set_pause;
        interval.combined_time = sets * (reps * seconds_on + (reps - 1) * seconds_off) + (sets - 1) * seconds_set_pause;
        interval.update_exercise();
        if (get_val("start_time")) {
            interval.start_time = get_val("start_time")
        } else {
            interval.start_time = Date.now();
            broadcast({selected_interval: {
                    start_time: interval.start_time,
                    reps: interval.reps,
                    sets: interval.sets,
                    seconds_on: interval.seconds_on,
                    seconds_off: interval.seconds_off,
                    seconds_set_pause: interval.seconds_set_pause,
                    exercises: interval.exercises,
                    sound: get_local_value("play_client_sound") === "true",
                }});
        }
    },
    start() {
        if (!interval.stopped) return;
        interval.timeout = setTimeout(interval.countdown, 0, 3);
        interval.work(true);
    },
    work(new_set = false) {
        working_exercise();
        interval.current_reps++;
        if (new_set) {
            interval.current_sets++;
            interval.current_reps = interval.current_reps % interval.reps;
        }
        show_reps(interval.current_reps, interval.current_sets);
        change_color("green");
        play_sound("work");
        if (interval.current_reps >= interval.reps && interval.current_sets >= interval.sets) {
            console.log("stooping");
            interval.timeouts.push(setTimeout(interval.stop, interval.seconds_on * 1000));
            interval.timeouts.push(setTimeout(play_sound, interval.seconds_on * 1000, "stop"));
        } else if (interval.current_reps >= interval.reps) interval.timeouts.push(setTimeout(interval.set_pause, interval.seconds_on * 1000));
        else interval.timeouts.push(setTimeout(interval.pause, interval.seconds_on * 1000));
        update_time(interval.seconds_on);
    },
    pause() {
        interval.update_exercise();
        change_color("red");
        play_sound("pause");
        interval.timeouts.push(setTimeout(interval.work, interval.seconds_off * 1000));
        update_time(interval.seconds_off);
    },
    set_pause() {
        change_color("yellow");
        interval.update_exercise(interval.current_exercise);
        play_sound("set_pause");
        interval.timeouts.push(setTimeout(interval.work, interval.seconds_set_pause * 1000, true));
        update_time(interval.seconds_set_pause);
    },

    stop() {
        change_color("white");
        if (interval.stopped) return;
        interval.stopped = true;
        interval.timeouts.map(x => clearTimeout(x));
        interval.timeouts = [];
        clearInterval(timer_interval);
        timer_interval = null;
        change_play_pause("play", "stop");
        document.getElementById("current_time").innerText = "00:02";
        show_exercise(get_exercises()[0]);
        show_reps(1, 1);
    }
};

const play_sound = function (type) {
    const types = {
        countdown: [300, 1, 0.25],
        work: [600, 1, 0.15],
        pause: [300, 1, 0.25],
        set_pause: [300, 1, 0.5],
        stop: [300, 2, 0.5]
    };
    if (get_val("sound") || typeof get_val("start_time") !== "number") sound_generator.play(...types[type]);
};

const sound_generator = {
    init() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillator = audioContext.createOscillator();
        this.gainNode = audioContext.createGain();

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(audioContext.destination);
        this.oscillator.type = 'triangle';
        return audioContext;
    },
    play(freq, numPulses, pulseLen) {
        const audioContext = this.init();
        this.oscillator.frequency.value = freq;

        const imax = 2 * numPulses;
        const startTime = audioContext.currentTime;
        for (let i = 0; i < imax; i++) {
            let gain = Number(i % 2 === 0);
            let time = startTime + i * pulseLen;
            this.gainNode.gain.setValueAtTime(gain, time);
        }
        this.oscillator.start(startTime);
        const duration = 2 * numPulses * pulseLen;
        this.oscillator.stop(startTime + duration);
    }
};
