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

    //download cats
    console.log('');
    console.log('=== download additional test data (cats) ===');
    await f_download_cats();

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
let f_download_testdata__video = async function(){
    let s_url = 'https://www.w3schools.com/html/mov_bbb.mp4';
    let s_path__video = `${s_dir__testdata}/mov_bbb.mp4`;

    // ceck if file exists
    if (await f_b_path_exists(s_path__video)) {
        console.log(`  skipped: ${s_path__video} already exists`);
        return;
    }
    // download video
    console.log(`  downloading: ${s_url}`);
    console.log(`  destination: ${s_path__video}`);
    let o_response = await fetch(s_url);
    if (!o_response.ok) {
        throw new Error(`download failed: HTTP ${o_response.status}`);
    }
    let n_content_length = parseInt(o_response.headers.get('content-length') ?? '0');
    let o_file = await Deno.open(s_path__video, { write: true, create: true, truncate: true });
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
}

let f_download_cats = async function(){
    let a_s_url = [
        'https://images.unsplash.com/photo-1570824104453-508955ab713e?q=80&w=1422&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1595511890410-3b8dc237a537?q=80&w=1560&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1727419522509-2c2b393ee16b?q=80&w=1192&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1526674183561-4bfb419ab4e5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1597237154674-1a0d2274cef4?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1598474775663-c7bc102114dc?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ]
    for(let s_url of a_s_url){
        let s_filename = s_url.split('/').pop().split('?')[0];
        let s_path = `${s_dir__testdata}/${s_filename}.avif`;
        if (await f_b_path_exists(s_path)) {
            console.log(`  skipped: ${s_path} already exists`);
            continue;
        }
        console.log(`  downloading: ${s_url}`);
        console.log(`  destination: ${s_path}`);
        let o_response = await fetch(s_url);
        if (!o_response.ok) {
            throw new Error(`download failed: HTTP ${o_response.status}`);
        }
        let n_content_length = parseInt(o_response.headers.get('content-length') ?? '0');
        let o_file = await Deno.open(s_path, { write: true, create: true, truncate: true });
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
    }   
}
if (import.meta.main) {
    console.log('');
    console.log('=== download test data (COCO val2017) ===');
    console.log('');
    await f_download_testdata();
    await f_download_testdata__video();
    console.log('');
    console.log('done.');
}

export { f_download_testdata,f_download_testdata__video };
