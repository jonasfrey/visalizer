// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import { f_s_path_parent } from './functions.js';
import {
    f_o_wsmsg,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__scan_folder,
    o_wsmsg__cancel_scan,
    o_wsmsg__remove_scantarget,
    f_s_name_table__from_o_model,
    o_model__o_scantarget,
} from './constructors.js';

let s_name_table__scantarget = f_s_name_table__from_o_model(o_model__o_scantarget);

let o_component__filebrowser = {
    name: 'component-filebrowser',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_filebrowser',
        a_o: [
            {
                s_tag: 'div',
                class: 'o_filebrowser__path_bar',
                a_o: [
                    {
                        s_tag: 'button',
                        class: 'btn__up',
                        'v-on:click': 'f_navigate_up',
                        ':disabled': 's_path_absolute === s_ds',
                        innerText: '..',
                    },
                    {
                        s_tag: 'span',
                        class: 'o_filebrowser__path',
                        innerText: '{{ s_path_absolute }}',
                    },
                    {
                        s_tag: 'span',
                        class: 'o_filebrowser__scantarget_info',
                        'v-if': 'f_b_is_scantarget_path(s_path_absolute)',
                        innerText: "{{ f_o_scantarget__from_path(s_path_absolute).n_files_recursive }} files, {{ f_o_scantarget__from_path(s_path_absolute).n_folders_recursive }} folders{{ f_o_scantarget__from_path(s_path_absolute).b_recursive ? ' (recursive)' : '' }}",
                    },
                    {
                        s_tag: 'span',
                        class: 'o_filebrowser__scan_progress',
                        'v-if': 'f_b_is_scan_running_for(s_path_absolute)',
                        innerText: "{{ (o_state.o_scan_progress?.n_files || 0) + (o_state.o_scan_progress?.n_folders || 0) }}/{{ o_state.o_scan_progress?.n_total || '?' }}",
                    },
                    {
                        s_tag: 'button',
                        class: 'btn__scan',
                        'v-on:click': 'f_scan_folder(s_path_absolute)',
                        'v-if': '!f_b_is_scan_running_for(s_path_absolute)',
                        innerText: "{{ f_b_is_scantarget_path(s_path_absolute) ? 'Re-scan' : 'Scan' }}",
                    },
                    {
                        s_tag: 'button',
                        class: 'btn__cancel_scan',
                        'v-if': 'f_b_is_scan_running_for(s_path_absolute)',
                        'v-on:click': 'f_cancel_scan',
                        innerText: 'Cancel',
                    },
                    {
                        s_tag: 'button',
                        class: 'btn__remove_scan',
                        'v-if': 'f_b_is_scantarget_path(s_path_absolute) && !f_b_is_scan_running_for(s_path_absolute)',
                        'v-on:click': 'f_remove_scantarget(s_path_absolute)',
                        innerText: 'Unscan',
                    },
                    {
                        s_tag: 'label',
                        class: 'o_filebrowser__checkbox',
                        a_o: [
                            {
                                s_tag: 'input',
                                type: 'checkbox',
                                'v-model': 'b_recursive',
                            },
                            {
                                s_tag: 'span',
                                innerText: 'recursive',
                            },
                        ],
                    },
                ],
            },
            {
                s_tag: 'div',
                class: 'o_filebrowser__list',
                a_o: [
                    {
                        s_tag: 'div',
                        'v-for': 'o_fsnode of a_o_fsnode',
                        ':class': "f_s_class__fsnode(o_fsnode)",
                        'v-on:click': 'f_click_fsnode(o_fsnode)',
                        a_o: [
                            {
                                s_tag: 'span',
                                class: 'o_fsnode__type',
                                innerText: "{{ o_fsnode.b_folder ? 'dir' : 'file' }}",
                            },
                            {
                                s_tag: 'span',
                                class: 'o_fsnode__name',
                                innerText: '{{ o_fsnode.s_name }}',
                            },
                        ],
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            s_path_absolute: '/',
            s_ds: '/',
            n_id__keyvalpair: null,
            a_o_fsnode: [],
            b_recursive: true,
        };
    },
    computed: {},
    methods: {
        f_b_is_scantarget_path: function(s_path) {
            return (o_state[s_name_table__scantarget] || []).some(function(o) {
                return o.s_path_absolute === s_path;
            });
        },
        f_o_scantarget__from_path: function(s_path) {
            return (o_state[s_name_table__scantarget] || []).find(function(o) {
                return o.s_path_absolute === s_path;
            }) || null;
        },
        f_b_is_scan_running_for: function(s_path) {
            return o_state.o_scan_progress?.b_running === true
                && o_state.o_scan_progress?.s_path_absolute === s_path;
        },
        f_s_class__fsnode: function(o_fsnode) {
            let s_class = 'o_fsnode ' + (o_fsnode.b_folder ? 'folder' : 'file');
            if (o_fsnode.b_folder && this.f_b_is_scantarget_path(o_fsnode.s_path_absolute)) {
                s_class += ' scantarget';
            }
            return s_class;
        },
        f_load_a_o_fsnode: async function() {
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_a_o_fsnode.s_name, [
                    this.s_path_absolute,
                    false,
                    false
                ])
            );
            this.a_o_fsnode = o_resp.v_result || [];
        },
        f_save_path: async function(s_path_absolute) {
            let o_self = this;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    ['update', 'a_o_keyvalpair', { n_id: o_self.n_id__keyvalpair }, { s_key: 's_path_absolute__filebrowser', s_value: s_path_absolute }]
                )
            );
            let n_idx = (o_state.a_o_keyvalpair || []).findIndex(function(o) { return o.n_id === o_self.n_id__keyvalpair; });
            if (n_idx !== -1) o_state.a_o_keyvalpair[n_idx].s_value = s_path_absolute;
        },
        f_click_fsnode: async function(o_fsnode) {
            if (!o_fsnode.b_folder) return;
            this.s_path_absolute = o_fsnode.s_path_absolute;
            await this.f_save_path(this.s_path_absolute);
            await this.f_load_a_o_fsnode();
        },
        f_navigate_up: async function() {
            let s_path_parent = f_s_path_parent(this.s_path_absolute, this.s_ds);
            if (s_path_parent === this.s_path_absolute) return;
            this.s_path_absolute = s_path_parent;
            await this.f_save_path(this.s_path_absolute);
            await this.f_load_a_o_fsnode();
        },
        f_scan_folder: async function(s_path) {
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__scan_folder.s_name, {
                    s_path_absolute: s_path,
                    b_recursive: this.b_recursive,
                })
            );
        },
        f_cancel_scan: function() {
            f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__cancel_scan.s_name, {})
            );
        },
        f_remove_scantarget: async function(s_path) {
            let o_scantarget = this.f_o_scantarget__from_path(s_path);
            if (!o_scantarget) return;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__remove_scantarget.s_name, { n_id: o_scantarget.n_id })
            );
            // refresh scantarget list from DB
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', s_name_table__scantarget])
            );
            o_state[s_name_table__scantarget] = o_resp.v_result || [];
        },
    },
    created: async function() {
        let o_self = this;
        o_self.s_ds = o_state.s_ds || '/';
        let o_resp = await f_send_wsmsg_with_response(
            f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', 'a_o_keyvalpair', { s_key: 's_path_absolute__filebrowser' }])
        );
        let a_o_result = o_resp.v_result || [];
        if (a_o_result.length > 0) {
            o_self.s_path_absolute = a_o_result[0].s_value;
            o_self.n_id__keyvalpair = a_o_result[0].n_id;
        } else {
            let o_resp_create = await f_send_wsmsg_with_response(
                f_o_wsmsg(
                    o_wsmsg__f_v_crud__indb.s_name,
                    ['create', 'a_o_keyvalpair', { s_key: 's_path_absolute__filebrowser', s_value: o_self.s_path_absolute }]
                )
            );
            o_self.n_id__keyvalpair = o_resp_create.v_result?.n_id;
            if (!o_state.a_o_keyvalpair) o_state.a_o_keyvalpair = [];
            o_state.a_o_keyvalpair.push(o_resp_create.v_result);
        }
        await o_self.f_load_a_o_fsnode();
    },
};

export { o_component__filebrowser };
