// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

let f_o_property = function(
    s_name,
    s_type,
    f_b_val_valid = function(){return true},
){
    return {
        s_name,
        s_type,
        f_b_val_valid
    }
}
let f_o_model = function({
    s_name,
    a_o_property
}){
    return {
        s_name,
        a_o_property
    }
}


let f_s_name_table__from_o_model = function(o_model) {
    return 'a_' + o_model.s_name;
}
let f_s_name_foreign_key__params = function(o_model, s_name_prop_id) {
    return 'n_' + o_model.s_name + '_' + s_name_prop_id;
}


let f_a_s_error__invalid_model_instance = function(
    o_model,
    o_instance
){
    let a_s_error = [];
    for(let o_model_prop of o_model.a_o_property){
        let value = o_instance[o_model_prop.s_name];
        let b_valid = true;
        if(o_model_prop.f_b_val_valid){
            b_valid = o_model_prop.f_b_val_valid(value);
            if(!b_valid){
                let s_error = `Invalid value for property ${o_model_prop.s_name}: ${value}
                validator function is: ${o_model_prop.f_b_val_valid.toString()}
                got value : ${value} of type ${typeof value}`;
                a_s_error.push(s_error);
            }
        }
    }
    // check if instance has property that is not in model
    for(let s_prop in o_instance){
        let o_model_prop = o_model.a_o_property.find(function(o_prop){
            return o_prop.s_name === s_prop;
        });
        if(!o_model_prop){
            let s_error = `Instance has property ${s_prop} that is not defined in model ${o_model.s_name}`;
            a_s_error.push(s_error);
        }
    }

    return a_s_error;
}
let f_o_model__from_params = function(s_name_table, a_o_model) {
    return a_o_model.find(function(o_model) {
        return f_s_name_table__from_o_model(o_model) === s_name_table;
    });
};




let f_o_model_prop__default_id = function(s_name){
    return f_o_property(s_name, 'number', (n_id)=>{
        if (n_id === undefined || n_id === null) return true;
        return Number.isInteger(n_id);
    });
}
let f_o_model_prop__timestamp_default = function(s_name){
    return f_o_property(s_name, 'number', (n_timestamp)=>{
        if (n_timestamp === undefined || n_timestamp === null) return true;
        return Number.isInteger(n_timestamp);
    });
}


let f_o_model_instance = function(
    o_model,
    o_data
){
    let a_s_error = f_a_s_error__invalid_model_instance(o_model, o_data);
    if(a_s_error.length > 0){
        throw new Error('Invalid model instance: ' + a_s_error.join('; '));
    }
    return o_data;
}

let f_o_example_instance_connected_cricular_from_o_model = function(o_model, a_s_name__visited = [], a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated){
    let o = {};
    for(let o_property of o_model.a_o_property){
        if(o_property.s_type === 'string'){
            o[o_property.s_name] = 'string';
        } else if(o_property.s_type === 'number'){
            let b_timestamp = (
                o_property.s_name === s_name_prop_ts_created
                || o_property.s_name === s_name_prop_ts_updated
            );
            o[o_property.s_name] = b_timestamp ? Date.now() : 1;
        } else if(o_property.s_type === 'boolean'){
            o[o_property.s_name] = true;
        }
    }

    a_s_name__visited = [...a_s_name__visited, o_model.s_name];

    let s_fk__self = f_s_name_foreign_key__params(o_model, s_name_prop_id);

    for(let o_model__candidate of a_o_model){
        let a_o_prop__fk = o_model__candidate.a_o_property.filter(function(o_prop){
            return o_prop.s_name !== s_name_prop_id
                && o_prop.s_name.startsWith('n_')
                && o_prop.s_name.endsWith(`_${s_name_prop_id}`);
        });

        let b_references_self = a_o_prop__fk.some(function(o_prop){
            return o_prop.s_name === s_fk__self;
        });

        if(!b_references_self) continue;

        let b_junction = a_o_prop__fk.length >= 2;

        if(b_junction){
            for(let o_prop__fk of a_o_prop__fk){
                if(o_prop__fk.s_name === s_fk__self) continue;

                let o_model__connected = a_o_model.find(function(o_m){
                    return f_s_name_foreign_key__params(o_m, s_name_prop_id) === o_prop__fk.s_name;
                });

                if(!o_model__connected) continue;

                let s_key = f_s_name_table__from_o_model(o_model__connected)

                if(a_s_name__visited.includes(o_model__connected.s_name)){
                    o[s_key] = ['...'];
                } else {
                    o[s_key] = [
                        f_o_example_instance_connected_cricular_from_o_model(
                            o_model__connected, a_s_name__visited, a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated
                        )
                    ];
                }
            }
        } else {
            let s_key = f_s_name_table__from_o_model(o_model__candidate);

            if(a_s_name__visited.includes(o_model__candidate.s_name)){
                o[s_key] = ['...'];
            } else {
                o[s_key] = [
                    f_o_example_instance_connected_cricular_from_o_model(
                        o_model__candidate, a_s_name__visited, a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated
                    )
                ];
            }
        }
    }

    return o;
}

// shared state array mutation — used by both client and server o_wsmsg__syncdata.f_v_sync
let f_apply_crud_to_a_o = function(a_o, s_operation, o_data, s_name_prop_id){
    if(!a_o || !o_data) return;
    if(s_operation === 'create'){
        a_o.push(o_data);
    }
    if(s_operation === 'update'){
        let n_idx = a_o.findIndex(function(o){ return o[s_name_prop_id] === o_data[s_name_prop_id]; });
        if(n_idx !== -1) Object.assign(a_o[n_idx], o_data);
    }
    if(s_operation === 'delete'){
        let n_idx = a_o.findIndex(function(o){ return o[s_name_prop_id] === o_data[s_name_prop_id]; });
        if(n_idx !== -1) a_o.splice(n_idx, 1);
    }
};


let f_o_logmsg = function(
    s_message,
    b_consolelog = true,
    b_guilog = false,
    s_type,
    n_ts_ms_created,
    n_ttl_ms
){
    return {
        s_message,
        b_consolelog,
        b_guilog,
        s_type,
        n_ts_ms_created,
        n_ttl_ms
    }
}

// definition factory — creates message type templates for the a_o_wsmsg registry
let f_o_wsmsg_def = function(
    s_name,
    b_expecting_response = false
){
    return {
        s_name,
        b_expecting_response,
        f_v_client_implementation: null,
        f_v_server_implementation: null
    }
}

// instance factory — creates actual messages to send over the wire
let f_o_wsmsg = function(
    s_name,
    v_data
){
    return {
        s_name,
        v_data,
        s_uuid: crypto.randomUUID()
    }
}


export{
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
    f_o_wsmsg
}
