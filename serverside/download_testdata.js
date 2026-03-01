// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { s_dir__testdata } from './runtimedata.js';

let s_url__zip = 'http://images.cocodataset.org/zips/val2017.zip';
let s_path__zip = `${s_dir__testdata}/val2017.zip`;
let s_path__images = `${s_dir__testdata}/val2017`;

let f_b_path_exists = async function(s_path) {
    try {
        await Deno.stat(s_path);
        return true;
    } catch {
        return false;
    }
};

let f_download_testdata = async function() {
    // skip if already extracted
    if (await f_b_path_exists(s_path__images)) {
        let n_count = 0;
        for await (let _o_entry of Deno.readDir(s_path__images)) { n_count++; }
        if (n_count > 0) {
            console.log(`  skipped: ${s_path__images} already exists (${n_count} files)`);
            return;
        }
    }

    // ensure target directory exists
    await Deno.mkdir(s_dir__testdata, { recursive: true });

    // download zip (streamed to disk)
    console.log(`  downloading: ${s_url__zip}`);
    console.log(`  destination: ${s_path__zip}`);
    let o_response = await fetch(s_url__zip);
    if (!o_response.ok) {
        throw new Error(`download failed: HTTP ${o_response.status}`);
    }
    let n_content_length = parseInt(o_response.headers.get('content-length') ?? '0');
    let o_file = await Deno.open(s_path__zip, { write: true, create: true, truncate: true });
    let n_bytes_written = 0;
    let n_last_percent = -1;
    for await (let a_n_chunk of o_response.body) {
        await o_file.write(a_n_chunk);
        n_bytes_written += a_n_chunk.length;
        if (n_content_length > 0) {
            let n_percent = Math.floor((n_bytes_written / n_content_length) * 100);
            if (n_percent !== n_last_percent && n_percent % 10 === 0) {
                console.log(`  progress: ${n_percent}% (${(n_bytes_written / 1024 / 1024).toFixed(0)} MB)`);
                n_last_percent = n_percent;
            }
        }
    }
    o_file.close();
    console.log(`  download complete: ${(n_bytes_written / 1024 / 1024).toFixed(1)} MB`);

    // extract using unzip binary
    console.log(`  extracting: ${s_path__zip}`);
    let o_command = new Deno.Command('unzip', {
        args: ['-o', '-q', s_path__zip, '-d', s_dir__testdata],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result = await o_command.output();
    if (!o_result.success) {
        throw new Error(`unzip failed with exit code ${o_result.code}`);
    }
    console.log('  extraction complete');

    // verify
    let n_count = 0;
    for await (let _o_entry of Deno.readDir(s_path__images)) { n_count++; }
    console.log(`  verified: ${n_count} files in ${s_path__images}`);

    // clean up zip
    await Deno.remove(s_path__zip);
    console.log(`  cleaned up: deleted ${s_path__zip}`);
};

if (import.meta.main) {
    console.log('');
    console.log('=== download test data (COCO val2017) ===');
    console.log('');
    await f_download_testdata();
    console.log('');
    console.log('done.');
}

export { f_download_testdata };
