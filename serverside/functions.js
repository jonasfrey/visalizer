// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// backend utility functions
// add shared server-side helper functions here and import them where needed

import { s_ds, s_root_dir } from './runtimedata.js';
import { a_o_wsmsg, f_o_model_instance, f_o_model__from_s_name_table, f_s_name_table__from_o_model, o_model__o_fsnode, o_model__o_image, o_model__o_video, o_model__o_scantarget, o_model__o_utterance, o_wsmsg__deno_copy_file, o_wsmsg__deno_mkdir, o_wsmsg__deno_stat, o_wsmsg__f_a_o_fsnode, o_wsmsg__f_a_o_instance__with_relations, o_wsmsg__f_delete_table_data, o_wsmsg__f_v_crud__indb, o_wsmsg__logmsg, o_wsmsg__o_scantarget__create, o_wsmsg__o_scantarget__delete, o_wsmsg__set_state_data, o_wsmsg__yolo_scan } from '../localhost/constructors.js';
import { f_v_crud__indb, f_db_delete_table_data, f_a_o_instance__with_relations } from './database_functions.js';
import { f_o_uttdatainfo, f_o_scantarget__from_s_path, f_scan_from_o_scantarget, f_yolo_scan } from './cli_functions.js';

let f_s_duration__from_n_ms = function(n_ms) {
    let n_total_s = Math.floor(n_ms / 1000);
    let n_h = Math.floor(n_total_s / 3600);
    let n_m = Math.floor((n_total_s % 3600) / 60);
    let n_s = n_total_s % 60;
    if (n_h > 0) {
        return String(n_h) + ':' + String(n_m).padStart(2, '0') + ':' + String(n_s).padStart(2, '0');
    }
    return String(n_m).padStart(2, '0') + ':' + String(n_s).padStart(2, '0');
};

let f_a_o_fsnode = async function(
    s_path,
    b_recursive = false,
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

    let s_name_table = f_s_name_table__from_o_model(o_model__o_fsnode);
    let s_name_table__image = f_s_name_table__from_o_model(o_model__o_image);
    let s_name_table__video = f_s_name_table__from_o_model(o_model__o_video);

    // pre-fetch all records for in-memory lookup
    let a_o_fsnode__db = f_v_crud__indb('read', s_name_table) || [];
    let a_o_image__all = f_v_crud__indb('read', s_name_table__image) || [];
    let a_o_video__all = f_v_crud__indb('read', s_name_table__video) || [];

    // build fsnode map by n_id for frame image counting
    let o_map__fsnode_by_id = {};
    for (let o of a_o_fsnode__db) {
        o_map__fsnode_by_id[o.n_id] = o;
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

            // check if fsnode already exists in db, if so, use that one
            let o_fsnode__existing = a_o_fsnode__db.find(function(o) { return o.s_path_absolute === s_path_absolute; }) ?? null;
            if (o_fsnode__existing) {
                o_fsnode = o_fsnode__existing;
            }

            // build info string for files with known media data
            if (!o_fsnode.b_folder && o_fsnode.n_id) {
                let o_video = a_o_video__all.find(function(o) { return o.n_o_fsnode_n_id === o_fsnode.n_id; });
                let o_image = a_o_image__all.find(function(o) { return o.n_o_fsnode_n_id === o_fsnode.n_id; });

                if (o_video) {
                    let s_info = f_s_duration__from_n_ms(o_video.n_duration_ms);
                    // count linked frame images extracted from this video
                    let s_prefix = s_root_dir + s_ds + '.gitignored' + s_ds + 'frames' + s_ds + o_fsnode.n_id + '_';
                    let n_linked = a_o_image__all.filter(function(o_img) {
                        let o_img_fsnode = o_map__fsnode_by_id[o_img.n_o_fsnode_n_id];
                        return o_img_fsnode && o_img_fsnode.s_path_absolute.startsWith(s_prefix);
                    }).length;
                    if (n_linked > 0) s_info += ' ' + n_linked + ' linked images';
                    o_fsnode.s_info = s_info;
                } else if (o_image) {
                    o_fsnode.s_info = o_image.n_width + 'x' + o_image.n_height;
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
o_wsmsg__f_a_o_instance__with_relations.f_v_server_implementation = function(o_wsmsg){
    // v_data = [s_name_table, a_n_id]
    let [s_name_table, a_n_id] = o_wsmsg.v_data;
    let o_model = f_o_model__from_s_name_table(s_name_table);
    return f_a_o_instance__with_relations(o_model, a_n_id);
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
o_wsmsg__o_scantarget__create.f_v_server_implementation = async function(
        o_wsmsg,
        o_wsmsg__existing,
        o_state,
        o_socket

) {
    let { s_path_absolute } = o_wsmsg.v_data;
    let s_name_table = f_s_name_table__from_o_model(o_model__o_scantarget);
    let o_counts = await f_o_scantarget__from_s_path(s_path_absolute);
    let o_data = {
        s_path_absolute,
        n_files: o_counts.n_files,
        n_folders: o_counts.n_folders,
    };
    let a_o_existing = f_v_crud__indb('read', s_name_table, { s_path_absolute }) || [];
    let o_scantarget;
    if (a_o_existing.length > 0) {
        o_scantarget = f_v_crud__indb('update', s_name_table, { n_id: a_o_existing[0].n_id }, o_data);
    } else {
        o_scantarget = f_v_crud__indb('create', s_name_table, o_data);
    }
    // fire-and-forget: scan files in the background
    f_scan_from_o_scantarget(o_scantarget, o_socket).catch(function(o_error) {
        console.error('[o_scantarget__create] scan failed:', o_error.message);
    });
    return o_scantarget;
};
o_wsmsg__o_scantarget__delete.f_v_server_implementation = function(o_wsmsg) {
    let { n_id } = o_wsmsg.v_data;
    let s_name_table = f_s_name_table__from_o_model(o_model__o_scantarget);
    return f_v_crud__indb('delete', s_name_table, { n_id });
};
o_wsmsg__yolo_scan.f_v_server_implementation = async function(o_wsmsg, o_wsmsg__existing, o_state, o_socket) {
    let { s_path_absolute } = o_wsmsg.v_data;
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let s_name_table__image = f_s_name_table__from_o_model(o_model__o_image);

    // get all fsnodes in the scantarget directory
    let a_o_fsnode = (f_v_crud__indb('read', s_name_table__fsnode) || []).filter(function(o) {
        if (o.b_folder) return false;
        // check if fsnode is a direct child of the scantarget path
        let s_parent = o.s_path_absolute.slice(0, o.s_path_absolute.lastIndexOf('/'));
        return s_parent === s_path_absolute;
    });

    // get images that are linked to those fsnodes
    let a_o_image = [];
    let a_o_image__all = f_v_crud__indb('read', s_name_table__image) || [];
    for (let o_fsnode of a_o_fsnode) {
        let o_image = a_o_image__all.find(function(o) { return o.n_o_fsnode_n_id === o_fsnode.n_id; });
        if (o_image) a_o_image.push(o_image);
    }

    if (a_o_image.length === 0) return { n_images: 0 };

    await f_yolo_scan(a_o_image, o_socket);
    return { n_images: a_o_image.length };
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
