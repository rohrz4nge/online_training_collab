let set_local_storage_values = function (values) {
    // dict -> null
    for (let index in values) {
        //console.log("set local: ", index, values[index], values);
        localStorage.setItem(index, values[index]);
    }
};

let get_local_values = function (keys) {
    // array[str] -> array[str]
    let values = [];
    for (let index of keys) {
        values.push(localStorage.getItem(index));
    }
    //console.log("get_local_values: ", values, keys);
    return values;
};

let get_local_value = function (key) {
    // str -> str
    return localStorage.getItem(key);
};

export const get_local_json = function (key) {
    try {
        return JSON.parse(get_local_value(key));
    } catch (e) {
        return null
    }
};

let set_local_value = function (key, val) {
    // str, str -> null
    localStorage.setItem(key, val);
};

let get_int_values = function (keys) {
    // array[str] -> array[int]
    let values = get_local_values(keys), i = 0, vals = [];
    for (let index of values) {
        vals.push(parseInt(index));
    }
    //console.log("int vals", values);
    return vals;
};

let get_int_value = function (key) {
    // str -> int
    let value = get_local_value(key);
    //console.log("single int: ", parseInt(value));
    return parseInt(value)
};

let get_bool_value = function (key) {
    // str -> bool
    return get_local_value(key) === "true"
};

let get_float_value = function (key) {
    // str -> float
    let value = get_local_value(key);
    //console.log("single int: ", parseInt(value));
    return parseFloat(value)
};

let get_checked_elems = function (classname) {
    // str -> array[str]
    // given a classname, returns the saved values of the elems with given classname as a list
    //console.log(classname, "checked getter");
    let list = get_local_value(classname);
    //console.log(classname, list);
    return JSON.parse(list);
};

window.set_local_storage_values = set_local_storage_values;
export {
    set_local_storage_values,
    get_local_values,
    get_local_value,
    set_local_value,
    get_bool_value,
    get_int_values,
    get_int_value,
    get_float_value,
    get_checked_elems
}
