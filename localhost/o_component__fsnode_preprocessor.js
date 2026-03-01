// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import {
    f_o_wsmsg,
    f_s_name_table__from_o_model,
    o_model__o_fsnode,
    o_model__o_fsnode_preprocessor,
    o_wsmsg__f_a_o_instance__with_relations,
    o_wsmsg__f_v_crud__indb,
    s_name_prop_id,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
} from './constructors.js';

let s_name_table = f_s_name_table__from_o_model(o_model__o_fsnode_preprocessor);
let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);

let a_s_filter = [s_name_prop_ts_created, s_name_prop_ts_updated, s_name_prop_id];
let f_b_skip = function(s) { return a_s_filter.some(function(sub) { return s.includes(sub); }); };
let f_a_s_comment_recursive = function(o, s_prefix, n_depth) {
    let a = [];
    let s_indent = '    //' + '  '.repeat(n_depth) + '   ';
    // collect own scalar property names first
    let a_s_own = [];
    for (let k in o) {
        if (f_b_skip(k)) continue;
        let v = o[k];
        if (!Array.isArray(v) && (typeof v !== 'object' || v === null)) {
            a_s_own.push(k);
        }
    }
    if (a_s_own.length > 0 && n_depth === 0) {
        a.push(s_indent + s_prefix + ' - { ' + a_s_own.join(', ') + ' }');
    }
    // then nested relations
    for (let k in o) {
        if (f_b_skip(k)) continue;
        let v = o[k];
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
            let a_s_keys = Object.keys(v[0]).filter(function(k2) { return !f_b_skip(k2); });
            a.push(s_indent + s_prefix + '.' + k + ' - [{ ' + a_s_keys.join(', ') + ' }]');
            a = a.concat(f_a_s_comment_recursive(v[0], k.replace(/^a_/, ''), n_depth + 1));
        } else if (Array.isArray(v)) {
            // circular reference (['...'] or '.'), skip
        } else if (typeof v === 'object' && v !== null) {
            let a_s_keys = Object.keys(v).filter(function(k2) { return !f_b_skip(k2); });
            a.push(s_indent + s_prefix + '.' + k + ' - { ' + a_s_keys.join(', ') + ' }');
            a = a.concat(f_a_s_comment_recursive(v, k, n_depth + 1));
        }
    }
    return a;
};
let f_s_default_function_from_o = function(o) {
    let a_s_comment = f_a_s_comment_recursive(o, 'o_fsnode', 0);
    return '(o_fsnode) => {\n'
        + '    // o_fsnode properties:\n'
        + a_s_comment.join('\n') + '\n'
        + '    // Return true to include, false to exclude\n'
        + '    return true;\n'
        + '}';
};
let s_default_function = '(o_fsnode) => {\n'
    + '    // Return true to include, false to exclude\n'
    + '    return true;\n'
    + '}';



let o_promise__monaco = null;
let f_init_monaco = function() {
    if (o_promise__monaco) return o_promise__monaco;
    o_promise__monaco = new Promise(function(resolve, reject) {
        if (window.monaco) {
            resolve(window.monaco);
            return;
        }
        let o_script = document.createElement('script');
        o_script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
        o_script.onload = function() {
            window.require.config({
                paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
            });
            window.require(['vs/editor/editor.main'], function() {
                window.monaco.editor.defineTheme('visalizer-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#0a0a12',
                        'editor.foreground': '#e2e8f0',
                        'editorLineNumber.foreground': '#4a5568',
                        'editorCursor.foreground': '#c4b5fd',
                        'editor.selectionBackground': '#8b74ea40',
                        'editor.lineHighlightBackground': '#ffffff08',
                        'editorWidget.background': '#0a0a12',
                        'editorWidget.border': '#ffffff12',
                    }
                });
                resolve(window.monaco);
            });
        };
        o_script.onerror = function() {
            o_promise__monaco = null;
            reject(new Error('Failed to load Monaco editor'));
        };
        document.head.appendChild(o_script);
    });
    return o_promise__monaco;
};

let o_component__fsnode_preprocessor = {
    name: 'component-fsnode-preprocessor',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_preprocessor_page',
        a_o: [
            // Sidebar: list of preprocessors
            {
                s_tag: 'div',
                class: 'o_preprocessor_page__sidebar',
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__header',
                        a_o: [
                            {
                                s_tag: 'span',
                                class: 'o_preprocessor_page__count',
                                innerText: '{{ a_o_preprocessor.length }} preprocessors',
                            },
                            {
                                s_tag: 'button',
                                class: 'clickable',
                                'v-on:click': 'f_create',
                                innerText: '+ new',
                            },
                            {
                                s_tag: 'button',
                                class: 'clickable',
                                'v-on:click': 'f_reload',
                                innerText: 'reload',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__list',
                        a_o: [
                            {
                                s_tag: 'div',
                                'v-for': 'o_pp of a_o_preprocessor',
                                ':class': "f_s_class__item(o_pp)",
                                'v-on:click': 'f_select(o_pp)',
                                a_o: [
                                    {
                                        s_tag: 'span',
                                        ':class': "o_pp.b_active ? 'o_preprocessor__status active' : 'o_preprocessor__status inactive'",
                                        innerText: "{{ o_pp.b_active ? 'on' : 'off' }}",
                                    },
                                    {
                                        s_tag: 'span',
                                        class: 'o_preprocessor__name',
                                        innerText: '{{ o_pp.s_name }}',
                                    },
                                    {
                                        s_tag: 'span',
                                        'v-if': 'o_pp.b_filter',
                                        class: 'o_preprocessor__badge',
                                        innerText: 'filter',
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                'v-if': 'a_o_preprocessor.length === 0',
                                class: 'o_preprocessor_page__empty_list',
                                innerText: 'No preprocessors yet. Click "+ new" to create one.',
                            },
                        ],
                    },
                ],
            },
            // Detail / editor panel
            {
                s_tag: 'div',
                class: 'o_preprocessor_page__detail',
                'v-if': 'o_pp__active',
                a_o: [
                    // Top bar: name + controls
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__topbar',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_preprocessor_page__name_group',
                                a_o: [
                                    {
                                        s_tag: 'span',
                                        class: 'o_preprocessor_page__label',
                                        innerText: 'name',
                                    },
                                    {
                                        s_tag: 'input',
                                        class: 'o_preprocessor_page__name_input',
                                        'v-model': 'o_pp__active.s_name',
                                        placeholder: 'preprocessor name',
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_preprocessor_page__toggle_group',
                                a_o: [
                                    {
                                        s_tag: 'button',
                                        ':class': "o_pp__active.b_active ? 'clickable clickable--active' : 'clickable'",
                                        'v-on:click': 'o_pp__active.b_active = !o_pp__active.b_active',
                                        innerText: "{{ o_pp__active.b_active ? 'active' : 'inactive' }}",
                                    },
                                    {
                                        s_tag: 'button',
                                        ':class': "o_pp__active.b_filter ? 'clickable clickable--active' : 'clickable'",
                                        'v-on:click': 'o_pp__active.b_filter = !o_pp__active.b_filter',
                                        innerText: "{{ o_pp__active.b_filter ? 'filter: on' : 'filter: off' }}",
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                class: 'o_preprocessor_page__action_group',
                                a_o: [
                                    {
                                        s_tag: 'button',
                                        class: 'clickable o_preprocessor_page__btn_save',
                                        'v-on:click': 'f_save',
                                        innerText: 'save',
                                    },
                                    {
                                        s_tag: 'button',
                                        class: 'clickable o_preprocessor_page__btn_delete',
                                        'v-on:click': 'f_delete',
                                        innerText: 'delete',
                                    },
                                ],
                            },
                        ],
                    },
                    // Monaco editor container
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__editor_label',
                        innerText: 's_f_b_show — filter function (receives o_fsnode with nested data, returns boolean)',
                    },
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__editor_wrap',
                        a_o: [
                            {
                                s_tag: 'div',
                                id: 'monaco_editor__preprocessor',
                                class: 'o_preprocessor_page__editor',
                            },
                        ],
                    },
                    // Status bar
                    {
                        s_tag: 'div',
                        class: 'o_preprocessor_page__statusbar',
                        a_o: [
                            {
                                s_tag: 'span',
                                class: 'o_preprocessor_page__status_id',
                                innerText: 'id: {{ o_pp__active.n_id }}',
                            },
                            {
                                s_tag: 'span',
                                'v-if': 's_status',
                                ':class': "'o_preprocessor_page__status_msg ' + s_status_type",
                                innerText: '{{ s_status }}',
                            },
                        ],
                    },
                ],
            },
            // Empty state
            {
                s_tag: 'div',
                class: 'o_preprocessor_page__empty',
                'v-if': '!o_pp__active',
                innerText: 'Select a preprocessor to edit, or create a new one.',
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_pp__active: null,
            s_status: '',
            s_status_type: '',
        };
    },
    computed: {
        a_o_preprocessor: function() {
            return this.o_state[s_name_table] || [];
        },
    },
    watch: {
        o_pp__active: function(o_new, o_old) {
            let o_self = this;
            if (o_new && o_self._o_editor) {
                o_self._o_editor.setValue(o_new.s_f_b_show || s_default_function);
            }
        },
    },
    methods: {
        f_s_class__item: function(o_pp) {
            let s = 'o_preprocessor_page__item clickable';
            if (this.o_pp__active && this.o_pp__active.n_id === o_pp.n_id) s += ' active';
            return s;
        },
        f_select: function(o_pp) {
            let o_self = this;
            // work on a copy so edits don't mutate the list until save
            o_self.o_pp__active = Object.assign({}, o_pp);
            o_self.s_status = '';
            o_self.$nextTick(function() {
                o_self.f_ensure_editor();
            });
        },
        f_ensure_editor: async function() {
            let o_self = this;
            let o_el = document.getElementById('monaco_editor__preprocessor');
            if (!o_el) return;
            if (o_self._o_editor) {
                // editor already exists, just update value
                o_self._o_editor.setValue(o_self.o_pp__active.s_f_b_show || s_default_function);
                return;
            }
            let monaco = await f_init_monaco();
            o_self._o_editor = monaco.editor.create(o_el, {
                value: o_self.o_pp__active.s_f_b_show || s_default_function,
                language: 'javascript',
                theme: 'visalizer-dark',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'line',
                bracketPairColorization: { enabled: true },
                suggest: {
                    showKeywords: true,
                    showSnippets: true,
                },
            });
        },
        f_create: async function() {
            let o_self = this;
            let o_data = {
                s_name: 'new preprocessor',
                s_f_b_show: s_default_function,
                b_active: false,
                b_filter: false,
            };
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['create', s_name_table, o_data])
            );
            if (o_resp.v_result) {
                if (!o_state[s_name_table]) o_state[s_name_table] = [];
                o_state[s_name_table].push(o_resp.v_result);
                o_self.f_select(o_resp.v_result);
                o_self.f_set_status('created', 'success');
            }
        },
        f_save: async function() {
            let o_self = this;
            if (!o_self.o_pp__active) return;
            // sync editor content back to the active object
            if (o_self._o_editor) {
                o_self.o_pp__active.s_f_b_show = o_self._o_editor.getValue();
            }
            let o_data__id = { n_id: o_self.o_pp__active.n_id };
            let o_data__update = {
                s_name: o_self.o_pp__active.s_name,
                s_f_b_show: o_self.o_pp__active.s_f_b_show,
                b_active: o_self.o_pp__active.b_active,
                b_filter: o_self.o_pp__active.b_filter,
            };
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['update', s_name_table, o_data__id, o_data__update])
            );
            if (o_resp.v_result) {
                let n_idx = o_state[s_name_table].findIndex(function(o) { return o.n_id === o_resp.v_result.n_id; });
                if (n_idx !== -1) o_state[s_name_table][n_idx] = o_resp.v_result;
                o_self.o_pp__active = Object.assign({}, o_resp.v_result);
                o_self.f_set_status('saved', 'success');
            }
        },
        f_delete: async function() {
            let o_self = this;
            if (!o_self.o_pp__active) return;
            if (!confirm('Delete preprocessor "' + o_self.o_pp__active.s_name + '"?')) return;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['delete', s_name_table, { n_id: o_self.o_pp__active.n_id }])
            );
            if (o_resp.v_result) {
                let n_idx = o_state[s_name_table].findIndex(function(o) { return o.n_id === o_self.o_pp__active.n_id; });
                if (n_idx !== -1) o_state[s_name_table].splice(n_idx, 1);
                o_self.o_pp__active = null;
                if (o_self._o_editor) {
                    o_self._o_editor.dispose();
                    o_self._o_editor = null;
                }
                o_self.f_set_status('deleted', 'info');
            }
        },
        f_reload: async function() {
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', s_name_table])
            );
            o_state[s_name_table] = o_resp.v_result || [];
        },
        f_set_status: function(s_msg, s_type) {
            let o_self = this;
            o_self.s_status = s_msg;
            o_self.s_status_type = s_type || '';
            setTimeout(function() {
                if (o_self.s_status === s_msg) o_self.s_status = '';
            }, 3000);
        },
    },
    created: async function() {
        await this.f_reload();
        // fetch one real fsnode with relations to generate default function comment
        let o_resp__fsnodes = await f_send_wsmsg_with_response(
            f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', s_name_table__fsnode])
        );
        let a_o = o_resp__fsnodes.v_result || [];
        if (a_o.length > 0) {
            let o_resp__enriched = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_a_o_instance__with_relations.s_name, [s_name_table__fsnode, [a_o[0].n_id]])
            );
            let a_o_enriched = o_resp__enriched.v_result || [];
            if (a_o_enriched.length > 0) {
                s_default_function = f_s_default_function_from_o(a_o_enriched[0]);
            }
        }
    },
    beforeUnmount: function() {
        if (this.o_editor) {
            this.o_editor.dispose();
            this.o_editor = null;
        }
    },
};

export { o_component__fsnode_preprocessor };
