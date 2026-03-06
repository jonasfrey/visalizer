import { f_o_logmsg } from "./constructors.js";

let s_db_create = 'c';
let s_db_read = 'r';
let s_db_update = 'u';
let s_db_delete = 'd';


let o_logmsg__basic_scan = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);
let o_logmsg__yolo_scan = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);
let o_logmsg__vitpose_scan = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);
let o_logmsg__blip_scan = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);
let o_logmsg__run_command = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);

export {
    s_db_create,
    s_db_read,
    s_db_update,
    s_db_delete,
    o_logmsg__basic_scan,
    o_logmsg__yolo_scan,
    o_logmsg__vitpose_scan,
    o_logmsg__blip_scan,
    o_logmsg__run_command
}

