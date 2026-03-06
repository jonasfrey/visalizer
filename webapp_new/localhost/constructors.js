// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import {
    f_o_property,
    f_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_a_s_error__invalid_model_instance,
    f_o_model__from_params,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_o_model_instance,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    f_o_logmsg,
    f_o_wsmsg_def,
    f_o_wsmsg,
} from "@apn/websersocketgui/constructors_framework"

let s_name_prop_ts_created = 'n_ts_ms_created';
let s_name_prop_ts_updated = 'n_ts_ms_updated';
let s_name_prop_id = 'n_id';



let o_model__o_wsclient = f_o_model({
    s_name: 'o_wsclient',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_ip', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})
let o_model__o_fsnode = f_o_model({
    s_name: 'o_fsnode',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id('n_o_fsnode_n_id'),
        f_o_property('n_bytes', 'number'),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),
        f_o_property('s_path_absolute', 'string', (s)=>{return s!==''}),
        f_o_property('b_folder', 'boolean', (b)=>{return typeof b === 'boolean'}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let o_model__o_video = f_o_model({
    s_name: 'o_video',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('n_width', 'number', (n) => { return n > 0 }),             
        f_o_property('n_duration_ms', 'number', (n) => { return n > 0 }),   
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode,s_name_prop_id)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let o_model__o_scantarget = f_o_model({
    s_name: 'o_scantarget',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_path_absolute', 'string', (s)=>{return s!==''}),
        f_o_property('n_files', 'number'),
        f_o_property('n_folders', 'number'),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode,s_name_prop_id)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});
let o_model__o_keyvalpair = f_o_model({
    // a generic key-value pair model that ca be used for
    // config data 
    // temporary data storage
    s_name: 'o_keyvalpair',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('s_key', 'string', (s)=>{return s!==''}),
        f_o_property('s_value', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

// -- a processed image
let o_model__o_image = f_o_model({
    s_name: 'o_image',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode,s_name_prop_id)),

        f_o_property('n_width', 'number', (n) => { return n > 0 }),
        f_o_property('n_height', 'number', (n) => { return n > 0 }),
        f_o_property('n_inference_ms', 'number'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

// -- a COCO class (yolov8m uses 80 COCO classes, not ImageNet)
let o_model__o_cococlass = f_o_model({
    s_name: 'o_cococlass',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('n_index', 'number', (n) => { return n >= 0 && n < 80 }),
        f_o_property('s_name', 'string', (s) => { return s !== '' }),  // e.g. "person", "bus"
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

// -- junction: one detected object (image <-> class with bbox + confidence)
let o_model__o_image_o_cococlass = f_o_model({
    s_name: 'o_image_o_cococlass',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_image,s_name_prop_id)),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_cococlass,s_name_prop_id)),
        f_o_property('n_confidence', 'number', (n) => { return n >= 0 && n <= 1 }),
        f_o_property('n_x1', 'number', (n) => { return n >= 0 }),  // bounding box top-left x
        f_o_property('n_y1', 'number', (n) => { return n >= 0 }),  // bounding box top-left y
        f_o_property('n_x2', 'number', (n) => { return n >= 0 }),  // bounding box bottom-right x
        f_o_property('n_y2', 'number', (n) => { return n >= 0 }),  // bounding box bottom-right y
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});


let o_model__o_fsnode_preprocessor = f_o_model({
    s_name: 'o_fsnode_preprocessor',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),

        // default value is a function (o_fsnode with nested data (o_image, o_video, o_image_o_cococlass...))=>{return true or false based on type of preprocessor}
        f_o_property('s_f_b_show', 'string', (s)=>{return typeof s === 'string'}),
        f_o_property('b_active', 'boolean'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let o_model__o_fsnode_preprocessor_o_fsnode = f_o_model({
    s_name: 'o_fsnode_preprocessor_o_fsnode',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('b_show_yolo', 'boolean'),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode,s_name_prop_id)),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode_preprocessor,s_name_prop_id)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let s_o_logmsg_s_type__log = 'log';
let s_o_logmsg_s_type__error = 'error';
let s_o_logmsg_s_type__warn = 'warn';
let s_o_logmsg_s_type__info = 'info';
let s_o_logmsg_s_type__debug = 'debug';
let s_o_logmsg_s_type__table = 'table';

let a_o_model = [
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_image,
    o_model__o_video,
    o_model__o_scantarget,
    o_model__o_keyvalpair,
    o_model__o_cococlass,
    o_model__o_image_o_cococlass,
    o_model__o_fsnode_preprocessor,
    o_model__o_fsnode_preprocessor_o_fsnode
];

let a_o_data_default = [
    {
        o_keyvalpair: {
            s_key: 's_path_absolute__filebrowser',
            s_value: (typeof Deno !== 'undefined') ? Deno.cwd() + '/.gitignored/testdata' : '/home'
        }
    },
    {
        o_fsnode_preprocessor: {
            s_name: 'at_least_one_person_in_image',
            s_f_b_show: `(o_fsnode) => {
    // o_fsnode properties:
    //   o_fsnode - { n_bytes, s_name, s_path_absolute, b_folder }
    //   o_fsnode.a_o_image - [{ n_width, n_height, n_inference_ms, a_o_cococlass }]
    //     o_image.a_o_cococlass - [{ n_index, s_name, a_o_image }]
    //   o_fsnode.a_o_video - [{ n_width, n_duration_ms }]
    //   o_fsnode.a_o_scantarget - [{ s_path_absolute, n_files, n_folders }]
    //   o_fsnode.a_o_fsnode_preprocessor - [{ s_name, s_f_b_show, b_active, b_filter, a_o_fsnode }]
    // Return true to include, false to exclude
    let o_img = o_fsnode.a_o_image?.at(0);
    let a_o_person = o_img.a_o_cococlass.find(o=>{
        return o.s_name == 'person'
    });
    return a_o_person?.length > 0;
    return true;
}`, // only show files, not folders
        },
        o_fsnode_preprocessor: {
            s_name: 'so_many_cats',
            s_f_b_show: `(o_fsnode) => {
    let o_img = o_fsnode.a_o_image?.at(0);
    let a_o__cat = o_img.a_o_cococlass.find(o=>{
        return o.s_name == 'cat'
    });
    return a_o__cat?.length > 3;
    return true;
}`, // only show files, not folders
        }
    }
]

// message type definitions
let o_wsmsg__deno_copy_file = f_o_wsmsg_def('deno_copy_file', false);
let o_wsmsg__deno_stat = f_o_wsmsg_def('deno_stat', false);
let o_wsmsg__deno_mkdir = f_o_wsmsg_def('deno_mkdir', false);
let o_wsmsg__f_v_crud__indb = f_o_wsmsg_def('f_v_crud__indb', true);
let o_wsmsg__f_delete_table_data = f_o_wsmsg_def('f_delete_table_data', true);
let o_wsmsg__f_a_o_fsnode = f_o_wsmsg_def('f_a_o_fsnode', true);
let o_wsmsg__logmsg = f_o_wsmsg_def('logmsg', false);
let o_wsmsg__set_state_data = f_o_wsmsg_def('set_state_data', false);
let o_wsmsg__syncdata = f_o_wsmsg_def('syncdata', true);

let o_wsmsg__o_scantarget__create = f_o_wsmsg_def('o_scantarget__create', false);
let o_wsmsg__o_scantarget__delete = f_o_wsmsg_def('o_scantarget__delete', false);




// client implementations
o_wsmsg__logmsg.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    if(o_logmsg.b_guilog){
        o_logmsg.n_ts_ms_created = o_logmsg.n_ts_ms_created || Date.now();
        o_logmsg.n_ttl_ms = o_logmsg.n_ttl_ms || 5000;
        o_state.a_o_logmsg.push(o_logmsg);
    }
}
o_wsmsg__set_state_data.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
}




let a_o_wsmsg = [
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    o_wsmsg__syncdata,
    o_wsmsg__o_scantarget__create,
    o_wsmsg__o_scantarget__delete,
]

export {
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
    a_o_model,
    f_o_property,
    f_o_model,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_o_model_instance,
    f_o_model__from_params,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    f_a_s_error__invalid_model_instance,
    s_name_prop_id,
    f_o_logmsg,
    a_o_wsmsg,
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__set_state_data,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__syncdata,
    f_o_wsmsg,
    f_o_wsmsg_def,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__error,
    s_o_logmsg_s_type__warn,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__debug,
    s_o_logmsg_s_type__table,
    a_o_data_default,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    o_wsmsg__o_scantarget__create,
    o_wsmsg__o_scantarget__delete
}
