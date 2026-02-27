// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// This script initializes a new project by copying all files from the package.
// Files are discovered dynamically (via JSR API or local filesystem) so the
// initialized project always matches the published template exactly.
//
// Usage from JSR (initializes current directory):
//   deno eval "import { f_init_project } from 'jsr:@apn/websersocketgui/init'; await f_init_project();"
// Usage direct:
//   deno run -A init.js [target_directory]    (defaults to cwd if omitted)

let s_url__package = new URL('..', import.meta.url);

// ─── helpers ────────────────────────────────────────────────────────────────────

let f_s_read_package_file = async function(s_relative_path) {
    let o_url = new URL(s_relative_path, s_url__package);
    console.log(o_url.href);
    let o_response = await fetch(o_url);
    if (!o_response.ok) {
        throw new Error(`failed to read: ${s_relative_path} (${o_response.status})`);
    }
    return await o_response.text();
};

let f_write = async function(s_path, s_content) {
    let n_idx = Math.max(s_path.lastIndexOf('/'), s_path.lastIndexOf('\\'));
    if (n_idx > 0) {
        await Deno.mkdir(s_path.slice(0, n_idx), { recursive: true });
    }
    await Deno.writeTextFile(s_path, s_content);
};

// ─── file discovery ─────────────────────────────────────────────────────────────

// discover files via the JSR version metadata API
let f_a_s_path__from_jsr = async function() {
    // parse JSR URL: https://jsr.io/@scope/name/version/file.js
    let o_match = s_url__package.href.match(/jsr\.io\/(@[^/]+\/[^/]+)\/([^/]+)/);
    if (!o_match) {
        throw new Error(`cannot parse JSR package URL from: ${s_url__package.href}`);
    }
    let s_package = o_match[1];
    let s_version = o_match[2];
    let s_url__meta = `https://jsr.io/${s_package}/${s_version}_meta.json`;
    console.log(`  fetching package manifest from JSR...`);
    let o_response = await fetch(s_url__meta);
    if (!o_response.ok) {
        throw new Error(`failed to fetch JSR metadata from ${s_url__meta} (${o_response.status})`);
    }
    let o_meta = await o_response.json();
    // manifest keys are like "/init.js", "/localhost/index.js"
    return Object.keys(o_meta.manifest).map(s => s.replace(/^\//, ''));
};

// parse .gitignore into sets of ignored directory names and file names
let f_o_gitignore = async function(s_dir) {
    let o_set__dir = new Set();
    let o_set__file = new Set();
    try {
        let s_content = await Deno.readTextFile(`${s_dir}/.gitignore`);
        for (let s_line of s_content.split('\n')) {
            s_line = s_line.trim();
            if (!s_line || s_line.startsWith('#')) continue;
            if (s_line.endsWith('/')) {
                o_set__dir.add(s_line.slice(0, -1));
            } else {
                o_set__file.add(s_line);
            }
        }
    } catch (_) {
        // no .gitignore — nothing to ignore
    }
    return { o_set__dir, o_set__file };
};

// discover files by walking the local filesystem
let f_a_s_path__from_local = async function(s_dir, s_prefix, o_gitignore) {
    if (!o_gitignore) {
        o_gitignore = await f_o_gitignore(s_dir);
    }
    let a_s_path = [];
    for await (let o_entry of Deno.readDir(s_dir)) {
        let s_rel = s_prefix ? `${s_prefix}/${o_entry.name}` : o_entry.name;
        if (o_entry.isDirectory) {
            if (o_entry.name.startsWith('.')) continue;
            if (o_gitignore.o_set__dir.has(o_entry.name)) continue;
            a_s_path = a_s_path.concat(
                await f_a_s_path__from_local(`${s_dir}/${o_entry.name}`, s_rel, o_gitignore)
            );
        } else if (o_entry.isFile) {
            if (o_gitignore.o_set__file.has(o_entry.name)) continue;
            a_s_path.push(s_rel);
        }
    }
    return a_s_path;
};

// ─── skip logic ─────────────────────────────────────────────────────────────────

let o_set__skip = new Set([
    'init.js',
    'exports.js',
    'deno.json',
    'deno.lock',
    'LICENSE',
    'readme.md',
    'CLAUDE.md',
    'improvements.md',
    'AI_responses_summaries.md',
    'start.sh',
    'start.desktop',
]);

let f_b_should_skip = function(s_path) {
    if (o_set__skip.has(s_path)) return true;
    if (s_path.startsWith('.')) return true;
    return false;
};

// ─── file generators (fallback for files JSR cannot serve) ──────────────────────

let f_s_generate__deno_json = function(s_uuid) {
    return JSON.stringify({
        "imports": {
            "@apn/websersocketgui": "jsr:@apn/websersocketgui@^0.1.0"
        },
        "tasks": {
            "run": `B_DENO_TASK=1 deno run --allow-net --allow-read --allow-write --allow-env --allow-ffi --env websersocket_${s_uuid}.js`,
            "stop": `pkill -f 'deno run.*websersocket_${s_uuid}.js' || echo 'No running websersocket process found.'`,
            "restart": "deno task stop && deno task run",
            "test": "deno test --allow-net --allow-read --allow-write --allow-env --allow-ffi function_testings.js",
            "uninit": "deno run --allow-read --allow-write --allow-env --env uninit.js"
        }
    }, null, 4) + '\n';
};

let f_s_generate__env_example = function(s_uuid) {
    return 'PORT=8000\n' +
        'DB_PATH=./.gitignored/app.db\n' +
        'STATIC_DIR=./localhost\n' +
        `S_UUID=${s_uuid}\n`;
};

let f_s_generate__gitignore = function() {
    return '.env\n' +
        '.gitignored/\n' +
        'AI_responses_summaries.md\n' +
        'planning/\n' +
        'venv/\n' +
        '__pycache__/\n' +
        'node_modules/\n';
};

// JSR only serves .js/.ts — HTML and CSS need inline fallback generators

let f_s_generate__index_html = function() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App</title>
    <link rel="stylesheet" href="index.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="index.js"></script>
</body>
</html>
`;
};

let f_s_generate__index_css = function() {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

#background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #e2e8f0;
    background: transparent;
}

#app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Navigation Styles */
.nav {
    background: rgba(10, 10, 18, 0.6);
    backdrop-filter: blur(12px);
    padding: 1rem 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    display: flex;
    gap: 0.5rem;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.nav a {
    color: #cbd5e0;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-transform: capitalize;
}

.nav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    transform: translateY(-2px);
}

.nav a.router-link-active {
    background: rgba(139, 116, 234, 0.3);
    color: #c4b5fd;
    border-color: rgba(139, 116, 234, 0.4);
}

/* Main content area */
main, .content {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
}

/* Data table styles */
.a_o_model_data_table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.07);
    margin-top: 1.5rem;
}

.a_o_model_data_table th,
.a_o_model_data_table td {
    padding: 0.9rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.95rem;
}

.a_o_model_data_table th {
    background: rgba(255, 255, 255, 0.04);
    color: #a0aec0;
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.02em;
    position: sticky;
    top: 0;
    z-index: 1;
}

.a_o_model_data_table tr.o_instance:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
}

.a_o_model_data_table tr.o_instance:hover {
    background: rgba(139, 116, 234, 0.1);
}

.a_o_model_data_table td {
    color: #cbd5e0;
}

.a_o_model_data_table tr:last-child td {
    border-bottom: none;
}

/* Model selection styles */
.a_o_model {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.5rem 0 1rem;
}

.a_o_model .o_model {
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(8px);
    color: #a0aec0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    user-select: none;
    text-transform: capitalize;
}

.a_o_model .o_model:hover {
    transform: translateY(-1px);
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.2);
}

.a_o_model .o_model.active {
    background: rgba(139, 116, 234, 0.25);
    color: #c4b5fd;
    border-color: rgba(139, 116, 234, 0.5);
}

/* Create form styles */
.o_form__create {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    flex-wrap: wrap;
}

.o_form__create .s_label__create {
    font-weight: 600;
    color: #a0aec0;
    white-space: nowrap;
    text-transform: capitalize;
}

.o_form__create .a_o_input {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    flex: 1;
}

.o_form__create .o_input_group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 120px;
}

.o_form__create .o_input_group span {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 500;
}

.o_form__create .o_input_group input {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
}

.o_form__create .o_input_group input::placeholder {
    color: #4a5568;
}

.o_form__create .o_input_group input:focus {
    border-color: rgba(139, 116, 234, 0.6);
    box-shadow: 0 0 0 3px rgba(139, 116, 234, 0.15);
}

.o_form__create .btn__create {
    padding: 0.55rem 1.5rem;
    background: rgba(139, 116, 234, 0.25);
    color: #c4b5fd;
    border: 1px solid rgba(139, 116, 234, 0.4);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}

.o_form__create .btn__create:hover {
    transform: translateY(-1px);
    background: rgba(139, 116, 234, 0.4);
    box-shadow: 0 4px 12px rgba(139, 116, 234, 0.25);
}

/* Toast styles */
.a_o_toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.6rem;
    z-index: 9999;
    pointer-events: none;
    max-width: 360px;
}

.a_o_toast .o_toast {
    padding: 0.8rem 1.25rem;
    background: rgba(10, 10, 18, 0.85);
    backdrop-filter: blur(12px);
    color: #e2e8f0;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: auto;
    animation: toast_slide_in 0.3s ease forwards;
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.a_o_toast .o_toast.info {
    border-color: rgba(66, 153, 225, 0.4);
    background: rgba(43, 108, 176, 0.6);
}

.a_o_toast .o_toast.success {
    border-color: rgba(72, 187, 120, 0.4);
    background: rgba(39, 103, 73, 0.6);
}

.a_o_toast .o_toast.warning {
    border-color: rgba(237, 137, 54, 0.4);
    background: rgba(151, 90, 22, 0.6);
}

.a_o_toast .o_toast.error {
    border-color: rgba(252, 129, 129, 0.4);
    background: rgba(155, 44, 44, 0.6);
}

.a_o_toast .o_toast.expired {
    opacity: 0;
    display: none;
    transform: translateX(100%);
    pointer-events: none;
}

@keyframes toast_slide_in {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* File browser */
.o_filebrowser {
    padding: 1rem 2rem;
    max-width: 800px;
}

.o_filebrowser__path_bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    margin-bottom: 0.5rem;
}

.o_filebrowser__path_bar .btn__up {
    padding: 0.2rem 0.6rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 5px;
    color: #a0aec0;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.15s;
    flex-shrink: 0;
}

.o_filebrowser__path_bar .btn__up:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: #e2e8f0;
}

.o_filebrowser__path_bar .btn__up:disabled {
    opacity: 0.3;
    cursor: default;
}

.o_filebrowser__path {
    font-size: 0.85rem;
    color: #718096;
    word-break: break-all;
}

.o_filebrowser__list {
    background: rgba(10, 10, 18, 0.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    overflow: hidden;
}

.o_fsnode {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 0.85rem;
    transition: background 0.1s;
}

.o_fsnode:last-child {
    border-bottom: none;
}

.o_fsnode.folder {
    cursor: pointer;
    color: #cbd5e0;
}

.o_fsnode.folder:hover {
    background: rgba(139, 116, 234, 0.12);
    color: #e2e8f0;
}

.o_fsnode.file {
    color: #4a5568;
    cursor: default;
}

.o_fsnode__type {
    font-size: 0.72rem;
    color: #4a5568;
    min-width: 2.5rem;
    font-family: monospace;
}
`;
};

let f_s_generate__start_sh = function() {
    return `#!/bin/bash
# Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details

# Self-locate: cd to the directory containing this script
cd "$(dirname "$(readlink -f "$0")")"

# Read PORT from .env
n_port=$(grep -E '^PORT=' .env 2>/dev/null | cut -d'=' -f2)
n_port=\${n_port:-8000}

s_url="http://localhost:\${n_port}"

# Check if already running by testing the port
if curl -s --max-time 2 "\${s_url}" > /dev/null 2>&1; then
    # Already running, just open/focus browser
    xdg-open "\${s_url}" > /dev/null 2>&1
    exit 0
fi

# Ensure deno is on PATH (may not be when launched from .desktop file)
export PATH="$HOME/.deno/bin:$PATH"

if ! command -v deno > /dev/null 2>&1; then
    notify-send "Web App" "deno not found. Please install deno first." 2>/dev/null
    exit 1
fi

# Ensure log directory exists
mkdir -p .gitignored

# Start the server in the background, redirect output to a log file
deno task run > .gitignored/server.log 2>&1 &
n_pid=$!

# Wait for the server to become ready (up to 15 seconds)
for n_it in $(seq 1 15); do
    # Check if process is still alive
    if ! kill -0 "$n_pid" 2>/dev/null; then
        notify-send "Web App" "Server crashed on startup. Check .gitignored/server.log" 2>/dev/null
        exit 2
    fi
    if curl -s --max-time 1 "\${s_url}" > /dev/null 2>&1; then
        xdg-open "\${s_url}" > /dev/null 2>&1
        exit 0
    fi
    sleep 1
done

# If we get here, server didn't start in time
notify-send "Web App" "Server failed to start within 15s. Check .gitignored/server.log" 2>/dev/null
exit 2
`;
};

let f_s_generate__start_desktop = function(s_path__target) {
    return `[Desktop Entry]
Type=Application
Name=Web App
Comment=Start the web application and open browser
Exec=${s_path__target}/start.sh
Path=${s_path__target}
Icon=web-browser
Terminal=false
Categories=Development;
StartupNotify=true
`;
};

// ─── main init function ─────────────────────────────────────────────────────────

let f_init_project = async function(s_path__target) {
    if (!s_path__target) {
        s_path__target = Deno.cwd();
    }

    // guard: refuse to init inside the template source repo
    try {
        let s_deno_json = await Deno.readTextFile(`${s_path__target}/deno.json`);
        let o_deno_json = JSON.parse(s_deno_json);
        if (o_deno_json.name === '@apn/websersocketgui') {
            console.error('ERROR: refusing to initialize — this directory is the template source repo.');
            console.error('       run init in a new empty directory instead.');
            Deno.exit(1);
        }
    } catch (_) {
        // no deno.json or not parseable — that's fine, proceed
    }

    console.log(`initializing project in: ${s_path__target}`);

    let s_uuid = crypto.randomUUID();

    // ── 1. discover all files in the package ──

    let b_jsr = s_url__package.protocol === 'https:';
    let a_s_path__all;

    if (b_jsr) {
        console.log('  source: JSR package');
        a_s_path__all = await f_a_s_path__from_jsr();
    } else {
        console.log('  source: local filesystem');
        let s_dir = s_url__package.pathname;
        if (s_dir.endsWith('/')) s_dir = s_dir.slice(0, -1);
        a_s_path__all = await f_a_s_path__from_local(s_dir, '');
    }

    console.log(`  found ${a_s_path__all.length} files in package`);

    // ── 2. create base directories ──

    await Deno.mkdir(`${s_path__target}/.gitignored`, { recursive: true });

    // ── 3. copy all package files (with filtering and special handling) ──

    let o_set__copied = new Set();

    for (let s_path of a_s_path__all) {
        if (f_b_should_skip(s_path)) {
            continue;
        }

        // special: websersocket_*.js -> rename with new UUID
        if (s_path.match(/^websersocket.*\.js$/)) {
            try {
                let s_content = await f_s_read_package_file(s_path);
                await f_write(`${s_path__target}/websersocket_${s_uuid}.js`, s_content);
                console.log(`  copied:  websersocket_${s_uuid}.js`);
                o_set__copied.add('websersocket');
            } catch (o_error) {
                console.error(`  ERROR:   websersocket: ${o_error.message}`);
            }
            continue;
        }

        // regular copy
        try {
            let s_content = await f_s_read_package_file(s_path);
            await f_write(`${s_path__target}/${s_path}`, s_content);
            console.log(`  copied:  ${s_path}`);
            o_set__copied.add(s_path);
        } catch (o_error) {
            console.warn(`  skipped: ${s_path} (${o_error.message})`);
        }
    }

    // ── 4. generate files that were not copied (JSR cannot serve non-JS) ──

    if (!o_set__copied.has('localhost/index.html')) {
        await f_write(`${s_path__target}/localhost/index.html`, f_s_generate__index_html());
        console.log('  generated: localhost/index.html');
    }

    if (!o_set__copied.has('localhost/index.css')) {
        await f_write(`${s_path__target}/localhost/index.css`, f_s_generate__index_css());
        console.log('  generated: localhost/index.css');
    }

    if (!o_set__copied.has('localhost/lib/vue-devtools-api-stub.js')) {
        await f_write(
            `${s_path__target}/localhost/lib/vue-devtools-api-stub.js`,
            'export let setupDevtoolsPlugin = function() {};\n'
        );
        console.log('  generated: localhost/lib/vue-devtools-api-stub.js');
    }

    // ── 5. generate config files (always generated, need UUID) ──

    await f_write(`${s_path__target}/deno.json`, f_s_generate__deno_json(s_uuid));
    console.log('  created: deno.json');

    await f_write(`${s_path__target}/.env.example`, f_s_generate__env_example(s_uuid));
    console.log('  created: .env.example');

    await Deno.copyFile(
        `${s_path__target}/.env.example`,
        `${s_path__target}/.env`
    );
    console.log('  created: .env (from .env.example)');

    await f_write(`${s_path__target}/.gitignore`, f_s_generate__gitignore());
    console.log('  created: .gitignore');

    // ── 6. generate start shortcut files ──

    await f_write(`${s_path__target}/start.sh`, f_s_generate__start_sh());
    await Deno.chmod(`${s_path__target}/start.sh`, 0o755);
    console.log('  created: start.sh');

    await f_write(`${s_path__target}/start.desktop`, f_s_generate__start_desktop(s_path__target));
    await Deno.chmod(`${s_path__target}/start.desktop`, 0o755);
    console.log('  created: start.desktop');

    // ── done ──

    console.log('');
    console.log('project initialized successfully!');
    console.log('');
    console.log('next steps:');
    console.log(`  cd ${s_path__target}`);
    console.log('  deno task run');
    console.log('');
    console.log('to customize:');
    console.log('  edit localhost/constructors.js to add your own models');
    console.log('  edit default_data.js to seed initial data');
};

// CLI entry point
if (import.meta.main) {
    let s_path = Deno.args[0];
    if (s_path && !s_path.startsWith('/')) {
        s_path = `${Deno.cwd()}/${s_path}`;
    }
    await f_init_project(s_path);
}

export { f_init_project };
