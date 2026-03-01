// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import { f_s_path_parent } from './functions.js';
import {
    f_o_wsmsg,
    f_s_name_table__from_o_model,
    o_model__o_scantarget,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__o_scantarget__create,
    o_wsmsg__o_scantarget__delete,
    o_wsmsg__yolo_scan,
} from './constructors.js';

let o_component__filebrowser = {
    name: 'component-filebrowser',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_filebrowser',
        a_o: [
            {
                s_tag: 'div',
                ':class': "b_is_scantarget ? 'o_filebrowser__path_bar scantarget' : 'o_filebrowser__path_bar'",
                a_o: [
                    {
                        s_tag: 'button',
                        class: 'clickable btn__up',
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
                        s_tag: 'button',
                        class: 'clickable',
                        'v-on:click': 'f_scan',
                        innerText: "{{ b_is_scantarget ? 're-scan' : 'scan' }}",
                    },
                    {
                        s_tag: 'button',
                        class: 'clickable',
                        'v-if': 'b_is_scantarget',
                        'v-on:click': 'f_unscan',
                        innerText: 'un-scan',
                    },
                    {
                        s_tag: 'span',
                        'v-if': 'b_is_scantarget',
                        class: 'o_filebrowser__scantarget_info',
                        innerText: '{{ s_scantarget_info }}',
                    },
                    {
                        s_tag: 'button',
                        class: 'clickable',
                        ':disabled': '!b_is_scantarget',
                        'v-on:click': 'f_yolo_scan',
                        innerText: 'yolo image classification',
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
                            {
                                s_tag: 'span',
                                'v-if': 'o_fsnode.s_info',
                                class: 'o_fsnode__info',
                                innerText: '{{ o_fsnode.s_info }}',
                            },
                            {
                                s_tag: 'span',
                                'v-if': 'f_o_scantarget__for_fsnode(o_fsnode)',
                                class: 'o_fsnode__scantarget_info',
                                innerText: "{{ f_s_scantarget_info(o_fsnode) }}",
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
        };
    },
    computed: {
        b_is_scantarget: function() {
            let o_self = this;
            return (o_self.o_state.a_o_scantarget || []).some(function(o) {
                return o.s_path_absolute === o_self.s_path_absolute;
            });
        },
        s_scantarget_info: function() {
            let o_self = this;
            let o = (o_self.o_state.a_o_scantarget || []).find(function(o) {
                return o.s_path_absolute === o_self.s_path_absolute;
            });
            if (!o) return '';
            return o.n_files + ' files, ' + o.n_folders + ' folders';
        },
    },
    methods: {
        f_o_scantarget__for_fsnode: function(o_fsnode) {
            if (!o_fsnode.b_folder) return null;
            return (this.o_state.a_o_scantarget || []).find(function(o) {
                return o.s_path_absolute === o_fsnode.s_path_absolute;
            }) || null;
        },
        f_s_scantarget_info: function(o_fsnode) {
            let o = this.f_o_scantarget__for_fsnode(o_fsnode);
            if (!o) return '';
            return o.n_files + ' files, ' + o.n_folders + ' folders';
        },
        f_s_class__fsnode: function(o_fsnode) {
            let s = 'o_fsnode ' + (o_fsnode.b_folder ? 'folder' : 'file');
            if (o_fsnode.b_folder && this.f_o_scantarget__for_fsnode(o_fsnode)) s += ' scantarget';
            return s;
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
        f_scan: async function() {
            let o_self = this;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__o_scantarget__create.s_name, {
                    s_path_absolute: o_self.s_path_absolute,
                })
            );
            if (o_resp.v_result) {
                if (!o_self.o_state.a_o_scantarget) o_self.o_state.a_o_scantarget = [];
                let n_idx = o_self.o_state.a_o_scantarget.findIndex(function(o) {
                    return o.s_path_absolute === o_self.s_path_absolute;
                });
                if (n_idx !== -1) {
                    o_self.o_state.a_o_scantarget[n_idx] = o_resp.v_result;
                } else {
                    o_self.o_state.a_o_scantarget.push(o_resp.v_result);
                }
            }
        },
        f_unscan: async function() {
            let o_self = this;
            let a_o_scantarget = o_self.o_state.a_o_scantarget || [];
            let o_existing = a_o_scantarget.find(function(o) { return o.s_path_absolute === o_self.s_path_absolute; });
            if (!o_existing) return;
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__o_scantarget__delete.s_name, { n_id: o_existing.n_id })
            );
            let n_idx = o_self.o_state.a_o_scantarget.indexOf(o_existing);
            if (n_idx !== -1) o_self.o_state.a_o_scantarget.splice(n_idx, 1);
        },
        f_yolo_scan: async function() {
            let o_self = this;
            let o_resp = await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__yolo_scan.s_name, {
                    s_path_absolute: o_self.s_path_absolute,
                }),
                120000
            );
            console.log('yolo scan result:', o_resp.v_result);
        },
        f_navigate_up: async function() {
            let s_path_parent = f_s_path_parent(this.s_path_absolute, this.s_ds);
            if (s_path_parent === this.s_path_absolute) return;
            this.s_path_absolute = s_path_parent;
            await this.f_save_path(this.s_path_absolute);
            await this.f_load_a_o_fsnode();
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
        // load scantargets from DB so folder markers show on page load
        let s_name_table__scantarget = f_s_name_table__from_o_model(o_model__o_scantarget);
        let o_resp_scantargets = await f_send_wsmsg_with_response(
            f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', s_name_table__scantarget])
        );
        o_state.a_o_scantarget = o_resp_scantargets.v_result || [];

        await o_self.f_load_a_o_fsnode();
    },
};

export { o_component__filebrowser };
