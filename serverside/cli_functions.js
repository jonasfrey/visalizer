// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details.

// functions that spawn CLI subprocesses (python, pip, etc.)

import { s_ds, s_root_dir, s_uuid, s_bin__python, s_path__venv, s_path_binary__identify, s_path_binary__ffprobe, a_s_ext__image, a_s_ext__video, s_path_binary__find } from './runtimedata.js';
import { f_s_name_table__from_o_model, o_model__o_fsnode, o_model__o_image, o_model__o_video, o_model__o_utterance, o_model__o_cococlass, o_model__o_image_o_cococlass, f_o_wsmsg, o_wsmsg__logmsg, f_o_logmsg, s_o_logmsg_s_type__info, o_wsmsg__set_state_data } from '../localhost/constructors.js';
import { f_v_crud__indb } from './database_functions.js';
import { o_logmsg__basic_scan, o_logmsg__yolo_scan } from "../localhost/runtimedata.js";

let f_init_python = async function(){
    let a_s_package = ['python-dotenv', 'pyttsx3', 'ultralytics'];

    // check if venv exists
    let b_venv_exists = true;
    try {
        await Deno.stat(s_path__venv);
    } catch {
        b_venv_exists = false;
    }

    if (!b_venv_exists) {
        console.log('[f_init_python] creating venv...');
        let o_proc__venv = new Deno.Command(s_bin__python, {
            args: ['-m', 'venv', s_path__venv],
            stdout: 'inherit',
            stderr: 'inherit',
        });
        let o_result__venv = await o_proc__venv.output();
        if (!o_result__venv.success) {
            console.error('[f_init_python] failed to create venv');
            return;
        }
        console.log('[f_init_python] venv created');
    }

    let s_path__pip = `${s_path__venv}${s_ds}bin${s_ds}pip`;
    if (Deno.build.os === 'windows') {
        s_path__pip = `${s_path__venv}${s_ds}Scripts${s_ds}pip.exe`;
    }

    // get list of already installed packages
    let o_proc__freeze = new Deno.Command(s_path__pip, {
        args: ['freeze'],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result__freeze = await o_proc__freeze.output();
    let s_installed = new TextDecoder().decode(o_result__freeze.stdout).toLowerCase();

    // filter to only packages not yet installed
    let a_s_package__missing = a_s_package.filter(function(s_pkg) {
        // pip freeze outputs "package-name==version", compare lowercased
        return !s_installed.includes(s_pkg.toLowerCase());
    });

    if (a_s_package__missing.length === 0) {
        console.log('[f_init_python] all packages already installed');
        return;
    }

    console.log(`[f_init_python] installing: ${a_s_package__missing.join(', ')}...`);
    let o_proc__install = new Deno.Command(s_path__pip, {
        args: ['install', ...a_s_package__missing],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__install = await o_proc__install.output();
    if (!o_result__install.success) {
        console.error('[f_init_python] pip install failed');
        return;
    }
    console.log('[f_init_python] packages installed');
}

let f_o_uttdatainfo = async function(s_text){
    let s_name_script = 'f_o_uttdatainfo.py';
    let s_path__script = `${s_root_dir}${s_ds}serverside${s_ds}${s_name_script}`;
    // prefer venv python if it exists, fall back to system python
    let s_path__python = `${s_path__venv}${s_ds}bin${s_ds}python3`;
    try { await Deno.stat(s_path__python); } catch { s_path__python = s_bin__python; }
    let a_s_cmd = [s_path__python, s_path__script, s_text, '--s-uuid', s_uuid];

    let o_process = new Deno.Command(a_s_cmd[0], {
        args: a_s_cmd.slice(1),
        cwd: s_root_dir,
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output = await o_process.output();
    let s_stdout = new TextDecoder().decode(o_output.stdout);
    let s_stderr = new TextDecoder().decode(o_output.stderr);

    if(o_output.code !== 0){
        console.error(`${s_name_script} python script failed:`, s_stderr);
        throw new Error(`${s_name_script} exited with code ${o_output.code}: ${s_stderr}`);
    }

    // parse IPC block from stdout
    let s_tag__start = `${s_uuid}_start_json`;
    let s_tag__end = `${s_uuid}_end_json`;
    let n_idx__start = s_stdout.indexOf(s_tag__start);
    let n_idx__end = s_stdout.indexOf(s_tag__end);

    if(n_idx__start === -1 || n_idx__end === -1){
        console.error(`${s_name_script}: no IPC block found in stdout:\n`, s_stdout);
        throw new Error(`${s_name_script} did not emit IPC json block`);
    }

    let s_json = s_stdout.slice(n_idx__start + s_tag__start.length, n_idx__end).trim();
    let o_ipc = JSON.parse(s_json);
    // o_ipc: { o_utterance: { s_text, ... }, o_fsnode: { s_path_absolute, s_name, n_bytes, ... } }

    // create o_fsnode in db for the audio file
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let o_fsnode = f_v_crud__indb('create', s_name_table__fsnode, {
        s_path_absolute: o_ipc.o_fsnode.s_path_absolute,
        s_name: o_ipc.o_fsnode.s_name,
        n_bytes: o_ipc.o_fsnode.n_bytes,
        b_folder: false,
    });

    // create o_utterance in db linked to o_fsnode
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let o_utterance = f_v_crud__indb('create', s_name_table__utterance, {
        s_text: o_ipc.o_utterance.s_text,
        n_o_fsnode_n_id: o_fsnode.n_id,
    });

    return {
        o_utterance,
        o_fsnode,
    };
};

let f_o_scantarget__from_s_path = async function(
    s_path_absolute,
) {
    let f_n_count = async function(s_type) {
        let o_cmd = new Deno.Command(s_path_binary__find, {
            args: [s_path_absolute, '-maxdepth', '1', '-type', s_type],
            stdout: 'piped',
            stderr: 'null',
        });
        let o_output = await o_cmd.output();
        let s_stdout = new TextDecoder().decode(o_output.stdout);
        return s_stdout.split('\n').filter(function(s) { return s !== ''; }).length;
    };

    let n_files = await f_n_count('f');
    // subtract 1 from dir count because find includes the root directory itself
    let n_folders = Math.max(0, (await f_n_count('d')) - 1);

    return {
        s_path_absolute,
        n_files,
        n_folders,
    };
}




let f_scan_from_o_scantarget = async function(
    o_scantarget, 
    o_socket
) {
    let s_path = o_scantarget.s_path_absolute;
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let s_name_table__image = f_s_name_table__from_o_model(o_model__o_image);
    let s_name_table__video = f_s_name_table__from_o_model(o_model__o_video);

    let n_files_scanned = 1;

    for await (let o_dir_entry of Deno.readDir(s_path)) {

        if (o_dir_entry.isDirectory) continue;

        let s_path_absolute = s_path + s_ds + o_dir_entry.name;
        let s_ext = (o_dir_entry.name.split('.').pop() || '').toLowerCase();
        let b_image = a_s_ext__image.includes(s_ext);
        let b_video = a_s_ext__video.includes(s_ext);

        // upsert fsnode
        let a_o_existing = f_v_crud__indb('read', s_name_table__fsnode, { s_path_absolute }) || [];
        let o_fsnode;
        if (a_o_existing.length > 0) {
            o_fsnode = f_v_crud__indb('update', s_name_table__fsnode,
                { n_id: a_o_existing[0].n_id },
                { b_folder: false, s_name: o_dir_entry.name }
            );
        } else {
            o_fsnode = f_v_crud__indb('create', s_name_table__fsnode,
                { s_path_absolute, s_name: o_dir_entry.name, b_folder: false }
            );
        }

        // console.log(o_tmp)
        o_socket.send(
            JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    { s_property: 'o_logmsg__basic_scan', value: (()=>{
                        o_logmsg__basic_scan.n_ts_ms_created = Date.now();
                        o_logmsg__basic_scan.s_message =`scanned ${n_files_scanned} / ${o_scantarget.n_files}`
                        return  o_logmsg__basic_scan;
                    })()}
                )
            )
        );

        try {
            if (b_image) {
                let o_image = await f_o_image__from_o_fsnode(o_fsnode);
                if (o_image) {
                    f_v_crud__indb('create', s_name_table__image, o_image);
                }
            }
            if (b_video) {
                let o_video = await f_o_video__from_o_fsnode(o_fsnode);
                if (o_video) {
                    f_v_crud__indb('create', s_name_table__video, {
                        n_o_fsnode_n_id: o_video.n_o_fsnode_n_id,
                        n_width: o_video.n_width,
                        n_duration_ms: o_video.n_duration_ms,
                    });
                    for (let o_frame of o_video.a_o_image) {
                        // create fsnode for the frame file
                        let o_fsnode__frame = f_v_crud__indb('create', s_name_table__fsnode, {
                            s_path_absolute: o_frame.s_path_absolute,
                            s_name: o_frame.s_path_absolute.split(s_ds).at(-1),
                            b_folder: false,
                        });
                        f_v_crud__indb('create', s_name_table__image, {
                            n_o_fsnode_n_id: o_fsnode__frame.n_id,
                            n_width: o_frame.n_width,
                            n_height: o_frame.n_height,
                        });
                    }
                }
            }
        } catch (o_error) {
            console.error('[f_scan_from_o_scantarget] error processing ' + s_path_absolute + ':', o_error.message);
        }
        n_files_scanned++;
    }
};

let f_o_image__from_o_fsnode = async function(o_fsnode) {
    let o_cmd = new Deno.Command(s_path_binary__identify, {
        args: ['-format', '%w %h', o_fsnode.s_path_absolute],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output = await o_cmd.output();
    if (!o_output.success) {
        console.error('[f_o_image__from_o_fsnode] identify failed for', o_fsnode.s_path_absolute);
        return null;
    }
    let s_stdout = new TextDecoder().decode(o_output.stdout).trim();
    let a_s_dim = s_stdout.split(' ');
    let n_width = parseInt(a_s_dim[0], 10) || 0;
    let n_height = parseInt(a_s_dim[1], 10) || 0;

    return {
        n_o_fsnode_n_id: o_fsnode.n_id,
        n_width,
        n_height,
    };
};

let f_o_video__from_o_fsnode = async function(o_fsnode) {
    let o_cmd_probe = new Deno.Command(s_path_binary__ffprobe, {
        args: [
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height:format=duration',
            '-of', 'json',
            o_fsnode.s_path_absolute,
        ],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output_probe = await o_cmd_probe.output();
    if (!o_output_probe.success) {
        console.error('[f_o_video__from_o_fsnode] ffprobe failed for', o_fsnode.s_path_absolute);
        return null;
    }
    let s_stdout = new TextDecoder().decode(o_output_probe.stdout);
    let o_probe = JSON.parse(s_stdout);

    let n_width = o_probe.streams?.[0]?.width || 0;
    let n_height = o_probe.streams?.[0]?.height || 0;
    let n_duration_s = parseFloat(o_probe.format?.duration) || 0;
    let n_duration_ms = Math.round(n_duration_s * 1000);

    let a_o_image = [];

    // extract 10 frames evenly spaced across the video
    if (n_duration_s > 0) {
        let s_dir__frames = s_root_dir + s_ds + '.gitignored' + s_ds + 'frames';
        try { await Deno.mkdir(s_dir__frames, { recursive: true }); } catch {}

        let n_frames = 10;

        for (let n_i = 0; n_i < n_frames; n_i++) {
            let n_ts = (n_duration_s / (n_frames + 1)) * (n_i + 1);
            let s_path_frame = s_dir__frames + s_ds + o_fsnode.n_id + '_' + n_i + '.jpg';

            let o_cmd_ff = new Deno.Command('ffmpeg', {
                args: [
                    '-y',
                    '-ss', String(n_ts),
                    '-i', o_fsnode.s_path_absolute,
                    '-frames:v', '1',
                    '-q:v', '2',
                    s_path_frame,
                ],
                stdout: 'piped',
                stderr: 'piped',
            });
            let o_output_ff = await o_cmd_ff.output();
            if (!o_output_ff.success) {
                console.error('[f_o_video__from_o_fsnode] ffmpeg frame', n_i, 'failed for', o_fsnode.s_path_absolute);
                continue;
            }

            a_o_image.push({
                s_path_absolute: s_path_frame,
                n_width,
                n_height,
            });
        }
    }

    return {
        n_o_fsnode_n_id: o_fsnode.n_id,
        n_width,
        n_duration_ms,
        a_o_image,
    };
};

let f_yolo_scan = async function(
    a_o_image,
    o_socket
){
    if (!a_o_image || a_o_image.length === 0) return;

    let n_files_scanned = 1;

    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let s_name_table__image = f_s_name_table__from_o_model(o_model__o_image);
    let s_name_table__cococlass = f_s_name_table__from_o_model(o_model__o_cococlass);
    let s_name_table__image_cococlass = f_s_name_table__from_o_model(o_model__o_image_o_cococlass);

    // resolve fsnode paths for each image
    let a_s_path = [];
    let o_map__path_to_image = {};
    for (let o_image of a_o_image) {
        let a_o_fsnode = f_v_crud__indb('read', s_name_table__fsnode, { n_id: o_image.n_o_fsnode_n_id }) || [];
        if (a_o_fsnode.length === 0) continue;
        let s_path = a_o_fsnode[0].s_path_absolute;
        a_s_path.push(s_path);
        o_map__path_to_image[s_path] = o_image;
    }

    if (a_s_path.length === 0) return;

    // call python script with all image paths
    let s_name_script = 'f_o_imageinfo_yolo.py';
    let s_path__script = `${s_root_dir}${s_ds}serverside${s_ds}${s_name_script}`;
    let s_path__python = `${s_path__venv}${s_ds}bin${s_ds}python3`;
    try { await Deno.stat(s_path__python); } catch { s_path__python = s_bin__python; }

    let a_s_cmd = [s_path__python, s_path__script, ...a_s_path, '--s-uuid', s_uuid];

    let f_send_yolo_logmsg = function(s_message) {
        if (!o_socket || !s_message) return;
        o_socket.send(
            JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    { s_property: 'o_logmsg__yolo_scan', value: (()=>{
                        o_logmsg__yolo_scan.n_ts_ms_created = Date.now();
                        o_logmsg__yolo_scan.s_message = s_message;
                        return o_logmsg__yolo_scan;
                    })()}
                )
            )
        );
    };

    f_send_yolo_logmsg(`yolo: starting ${a_s_path.length} image(s)...`);

    let o_cmd = new Deno.Command(a_s_cmd[0], {
        args: a_s_cmd.slice(1),
        cwd: s_root_dir,
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_child = o_cmd.spawn();

    let s_stdout = '';
    let s_stderr = '';

    let f_read_lines = async function(o_stream, f_on_line) {
        let o_reader = o_stream.getReader();
        let o_decoder = new TextDecoder();
        let s_buffer = '';
        while (true) {
            let { done, value } = await o_reader.read();
            if (done) break;
            s_buffer += o_decoder.decode(value, { stream: true });
            let a_s_line = s_buffer.split('\n');
            s_buffer = a_s_line.pop();
            for (let s_line of a_s_line) {
                f_on_line(s_line);
            }
        }
        if (s_buffer) f_on_line(s_buffer);
    };

    await Promise.all([
        f_read_lines(o_child.stdout, function(s_line) {
            s_stdout += s_line + '\n';
            if (s_line.trim()) {
                f_send_yolo_logmsg('yolo: ' + s_line.trim());
            }
        }),
        f_read_lines(o_child.stderr, function(s_line) {
            s_stderr += s_line + '\n';
            if (s_line.trim()) {
                f_send_yolo_logmsg('yolo: ' + s_line.trim());
            }
        }),
    ]);

    let o_status = await o_child.status;

    if (o_status.code !== 0) {
        f_send_yolo_logmsg('yolo: script failed');
        console.error(`${s_name_script} python script failed:`, s_stderr);
        throw new Error(`${s_name_script} exited with code ${o_status.code}: ${s_stderr}`);
    }

    // parse IPC block from stdout
    let s_tag__start = `${s_uuid}_start_json`;
    let s_tag__end = `${s_uuid}_end_json`;
    let n_idx__start = s_stdout.indexOf(s_tag__start);
    let n_idx__end = s_stdout.indexOf(s_tag__end);

    if (n_idx__start === -1 || n_idx__end === -1) {
        console.error(`${s_name_script}: no IPC block found in stdout:\n`, s_stdout);
        throw new Error(`${s_name_script} did not emit IPC json block`);
    }

    let s_json = s_stdout.slice(n_idx__start + s_tag__start.length, n_idx__end).trim();
    let a_o_result = JSON.parse(s_json);

    let n_total = a_o_result.length;

    // update database with detection results
    for (let o_result of a_o_result) {
        let o_image = o_map__path_to_image[o_result.s_path_absolute];
        if (!o_image) continue;

        f_send_yolo_logmsg(`yolo: saving results ${n_files_scanned} / ${n_total}`);

        // update image record with inference time
        f_v_crud__indb('update', s_name_table__image,
            { n_id: o_image.n_id },
            { n_inference_ms: o_result.n_inference_ms }
        );

        for (let o_detection of o_result.a_o_detection) {
            // find or create the cococlass record
            let a_o_existing_class = f_v_crud__indb('read', s_name_table__cococlass, {
                n_index: o_detection.n_index
            }) || [];

            let o_cococlass;
            if (a_o_existing_class.length > 0) {
                o_cococlass = a_o_existing_class[0];
            } else {
                o_cococlass = f_v_crud__indb('create', s_name_table__cococlass, {
                    n_index: o_detection.n_index,
                    s_name: o_detection.s_name,
                });
            }

            // create junction record with bounding box
            f_v_crud__indb('create', s_name_table__image_cococlass, {
                n_o_image_n_id: o_image.n_id,
                n_o_cococlass_n_id: o_cococlass.n_id,
                n_confidence: o_detection.n_confidence,
                n_x1: o_detection.n_x1,
                n_y1: o_detection.n_y1,
                n_x2: o_detection.n_x2,
                n_y2: o_detection.n_y2,
            });
        }
        n_files_scanned++;
    }
    f_send_yolo_logmsg(`yolo: done, ${n_total} image(s) processed`);
}
export {
    f_init_python,
    f_o_uttdatainfo,
    f_o_scantarget__from_s_path,
    f_scan_from_o_scantarget,
    f_yolo_scan,
};
