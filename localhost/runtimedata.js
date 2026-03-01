import { f_o_logmsg } from "./constructors.js";

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

export {
    o_logmsg__basic_scan,
    o_logmsg__yolo_scan,
    o_logmsg__vitpose_scan,
    o_logmsg__blip_scan
}