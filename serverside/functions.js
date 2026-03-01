// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// backend utility functions
// add shared server-side helper functions here and import them where needed

import { s_ds } from './runtimedata.js';
import { a_o_wsmsg, f_o_model_instance, f_s_name_table__from_o_model, f_s_name_foreign_key__from_o_model, o_model__o_fsnode, o_model__o_scantarget, o_model__o_utterance, o_wsmsg__deno_copy_file, o_wsmsg__deno_mkdir, o_wsmsg__deno_stat, o_wsmsg__f_a_o_fsnode, o_wsmsg__f_delete_table_data, o_wsmsg__f_v_crud__indb, o_wsmsg__logmsg, o_wsmsg__set_state_data, o_wsmsg__scan_folder, o_wsmsg__cancel_scan, o_wsmsg__remove_scantarget, f_o_wsmsg } from '../localhost/constructors.js';
import { f_v_crud__indb, f_db_delete_table_data } from './database_functions.js';
import { f_o_uttdatainfo, f_o_scantarget__from_s_path } from './cli_functions.js';

let f_a_o_fsnode = async function(
    s_path,
    b_recursive = false,
    b_store_in_db = false
) {
    let a_o = [];

    if (!s_path) {
        console.error('Invalid path:', s_path);
        return a_o;
    }
    if (!s_path.startsWith(s_ds)) {
        console.error('Path is not absolute:', s_path);
        return a_o;
    }

    try {
        for await (let o_dir_entry of Deno.readDir(s_path)) {
            let s_path_absolute = `${s_path}${s_ds}${o_dir_entry.name}`;

            let o_fsnode = f_o_model_instance(
                o_model__o_fsnode,
                {
                    s_path_absolute,
                    s_name: s_path_absolute.split(s_ds).at(-1),
                    b_folder: o_dir_entry.isDirectory,
                }
            );
            if(b_store_in_db){
                let o_fsnode__fromdb = (f_v_crud__indb('read', f_s_name_table__from_o_model(o_model__o_fsnode), { s_path_absolute }))?.at(0);
                if (o_fsnode__fromdb) {
                    o_fsnode.n_id = o_fsnode__fromdb.n_id;
                } else {
                    let o_fsnode__created = f_v_crud__indb('create', f_s_name_table__from_o_model(o_model__o_fsnode), { s_path_absolute, b_folder: o_dir_entry.isDirectory });
                    o_fsnode.n_id = o_fsnode__created.n_id;
                }
                if (o_dir_entry.isDirectory && b_recursive) {
                    o_fsnode.a_o_fsnode = await f_a_o_fsnode(s_path_absolute, b_recursive);
                }
            }

            a_o.push(o_fsnode);
        }
    } catch (o_error) {
        console.error(`Error reading directory: ${s_path}`, o_error.message);
        console.error(o_error.stack);
    }

    a_o.sort(function(o_a, o_b) {
        if (o_a.b_folder === o_b.b_folder) return (o_a.s_name || '').localeCompare(o_b.s_name || '');
        return o_a.b_folder ? -1 : 1;
    });

    return a_o;
};



// WARNING: the following deno_copy_file, deno_stat, deno_mkdir handlers expose raw Deno APIs
// to any connected WebSocket client with arbitrary arguments. Fine for local dev use,
// but must be restricted or removed before any network-exposed deployment.
o_wsmsg__deno_copy_file.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.copyFile(...a_v_arg);
}
o_wsmsg__deno_stat.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.stat(...a_v_arg);
}
o_wsmsg__deno_mkdir.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.mkdir(...a_v_arg);
}
o_wsmsg__f_v_crud__indb.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_v_crud__indb(...a_v_arg);
}
o_wsmsg__f_delete_table_data.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_db_delete_table_data(...a_v_arg);
}
o_wsmsg__f_a_o_fsnode.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_a_o_fsnode(...a_v_arg);
}
o_wsmsg__logmsg.f_v_server_implementation = function(o_wsmsg){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    return null;
}
o_wsmsg__set_state_data.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    return null;
}
let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
let s_name_table__scantarget = f_s_name_table__from_o_model(o_model__o_scantarget);
let s_name_fk__fsnode = f_s_name_foreign_key__from_o_model(o_model__o_fsnode);

let f_send_state = function(o_socket, s_property, value) {
    o_socket.send(JSON.stringify(
        f_o_wsmsg(o_wsmsg__set_state_data.s_name, { s_property, value })
    ));
};

let f_scan_folder = async function(s_path_absolute, b_recursive, o_state, o_socket) {
    // pre-count files and folders using fast CLI (find + wc)
    let o_precount = await f_o_scantarget__from_s_path(s_path_absolute, b_recursive);
    let n_total = o_precount.n_total;
    console.log(`scan pre-count: ${o_precount.n_files} files, ${o_precount.n_folders} folders in ${s_path_absolute}`);

    // create/find root fsnode for this folder
    let a_o_existing_root = f_v_crud__indb('read', s_name_table__fsnode, { s_path_absolute }) || [];
    let o_fsnode__root = null;
    if (a_o_existing_root.length > 0) {
        o_fsnode__root = a_o_existing_root[0];
    } else {
        o_fsnode__root = f_v_crud__indb('create', s_name_table__fsnode, {
            s_path_absolute,
            s_name: s_path_absolute.split(s_ds).at(-1),
            b_folder: true,
        });
    }

    // create scantarget record
    let o_scantarget = f_v_crud__indb('create', s_name_table__scantarget, {
        s_path_absolute,
        n_files_recursive: 0,
        n_folders_recursive: 0,
        [s_name_fk__fsnode]: o_fsnode__root.n_id,
        b_recursive: b_recursive ? 1 : 0,
    });

    // init scan state
    o_state.b_cancel_scan = false;
    let n_files = 0;
    let n_folders = 0;
    let n_entries_since_progress = 0;

    let f_push_progress = function() {
        f_send_state(o_socket, 'o_scan_progress', {
            b_running: true,
            s_path_absolute,
            n_files,
            n_folders,
            n_total,
            n_o_scantarget_n_id: o_scantarget.n_id,
        });
    };

    // recursive directory walker
    let f_walk = async function(s_dir_path) {
        if (o_state.b_cancel_scan) return;
        try {
            for await (let o_dir_entry of Deno.readDir(s_dir_path)) {
                if (o_state.b_cancel_scan) return;

                let s_entry_path = `${s_dir_path}${s_ds}${o_dir_entry.name}`;

                // create or find fsnode in db
                let a_o_existing = f_v_crud__indb('read', s_name_table__fsnode, { s_path_absolute: s_entry_path }) || [];
                if (a_o_existing.length === 0) {
                    f_v_crud__indb('create', s_name_table__fsnode, {
                        s_path_absolute: s_entry_path,
                        s_name: o_dir_entry.name,
                        b_folder: o_dir_entry.isDirectory,
                    });
                }

                if (o_dir_entry.isDirectory) {
                    n_folders++;
                    if (b_recursive) {
                        await f_walk(s_entry_path);
                    }
                } else {
                    n_files++;
                }

                n_entries_since_progress++;
                if (n_entries_since_progress >= 50) {
                    n_entries_since_progress = 0;
                    f_push_progress();
                }
            }
        } catch (o_error) {
            console.error(`scan error reading: ${s_dir_path}`, o_error.message);
        }
    };

    // run the scan
    f_push_progress();
    await f_walk(s_path_absolute);

    // update scantarget with final counts
    f_v_crud__indb('update', s_name_table__scantarget, { n_id: o_scantarget.n_id }, {
        n_files_recursive: n_files,
        n_folders_recursive: n_folders,
    });

    // push final state
    f_send_state(o_socket, 'o_scan_progress', {
        b_running: false,
        s_path_absolute,
        n_files,
        n_folders,
        n_total,
        n_o_scantarget_n_id: o_scantarget.n_id,
    });
    // refresh scantarget list on client
    f_send_state(o_socket, s_name_table__scantarget,
        f_v_crud__indb('read', s_name_table__scantarget) || []
    );

    console.log(`scan complete: ${n_files} files, ${n_folders} folders in ${s_path_absolute}`);
};

o_wsmsg__scan_folder.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state, o_socket) {
    let v_data = o_wsmsg.v_data;
    let s_path_absolute = v_data.s_path_absolute;
    let b_recursive = v_data.b_recursive;

    // start scan in background, don't await — response goes out immediately
    f_scan_folder(s_path_absolute, b_recursive, o_state, o_socket);

    return { s_path_absolute, b_recursive, b_started: true };
};

o_wsmsg__cancel_scan.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state) {
    o_state.b_cancel_scan = true;
    console.log('scan cancellation requested');
    return null;
};

o_wsmsg__remove_scantarget.f_v_server_implementation = function(o_wsmsg) {
    let n_id = o_wsmsg.v_data.n_id;
    // read the scantarget to get its path
    let a_o = f_v_crud__indb('read', s_name_table__scantarget, { n_id }) || [];
    if (a_o.length === 0) {
        throw new Error('Scantarget not found: ' + n_id);
    }
    let o_scantarget = a_o[0];

    // delete all fsnodes under this path (including the root folder itself)
    let a_o_fsnode = f_v_crud__indb('read', s_name_table__fsnode) || [];
    for (let o_fsnode of a_o_fsnode) {
        if (o_fsnode.s_path_absolute && o_fsnode.s_path_absolute.startsWith(o_scantarget.s_path_absolute)) {
            f_v_crud__indb('delete', s_name_table__fsnode, { n_id: o_fsnode.n_id });
        }
    }

    // delete the scantarget
    f_v_crud__indb('delete', s_name_table__scantarget, { n_id });
    console.log('removed scantarget:', o_scantarget.s_path_absolute);
    return true;
};

let f_o_uttdatainfo__read_or_create = async function(s_text){
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let a_o_existing = f_v_crud__indb('read', s_name_table__utterance, { s_text }) || [];
    if(a_o_existing.length > 0){
        let o_utterance = a_o_existing[0];
        let o_fsnode = o_utterance.n_o_fsnode_n_id
            ? (f_v_crud__indb('read', s_name_table__fsnode, { n_id: o_utterance.n_o_fsnode_n_id }) || []).at(0)
            : null;
        return { o_utterance, o_fsnode };
    }
    // not found in db, generate new utterance audio
    return await f_o_uttdatainfo(s_text);
};

let f_v_result_from_o_wsmsg = async function(
    o_wsmsg,
    o_state,
    o_socket
){
    let o_wsmsg__existing = a_o_wsmsg.find(o=>o.s_name === o_wsmsg.s_name);
    if(!o_wsmsg__existing){
        console.error('No such wsmsg:', o_wsmsg.s_name);
        return null;
    }
    if(!o_wsmsg__existing.f_v_server_implementation) {
        console.error('No server implementation for wsmsg:', o_wsmsg.s_name);
        return null;
    }
    return o_wsmsg__existing.f_v_server_implementation(
        o_wsmsg,
        o_wsmsg__existing,
        o_state,
        o_socket
    );

}

export {
    f_a_o_fsnode,
    f_o_uttdatainfo__read_or_create,
    f_v_result_from_o_wsmsg
};
