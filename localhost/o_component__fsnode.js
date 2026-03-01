// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import { f_send_wsmsg_with_response, o_state } from './index.js';
import {
    f_o_wsmsg,
    f_s_name_table__from_o_model,
    o_model__o_fsnode,
    o_model__o_image,
    o_model__o_video,
    o_model__o_cococlass,
    o_model__o_image_o_cococlass,
    o_model__o_fsnode_preprocessor,
    o_wsmsg__f_a_o_instance__with_relations,
    o_wsmsg__f_v_crud__indb,
} from './constructors.js';

let s_name_table = f_s_name_table__from_o_model(o_model__o_fsnode);
let s_name_table__image = f_s_name_table__from_o_model(o_model__o_image);
let s_name_table__video = f_s_name_table__from_o_model(o_model__o_video);
let s_name_table__cococlass = f_s_name_table__from_o_model(o_model__o_cococlass);
let s_name_table__image_cococlass = f_s_name_table__from_o_model(o_model__o_image_o_cococlass);
let s_name_table__preprocessor = f_s_name_table__from_o_model(o_model__o_fsnode_preprocessor);

let o_component__fsnode = {
    name: 'component-fsnode',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_fsnode_page',
        a_o: [
            // Sidebar: fsnode list
            {
                s_tag: 'div',
                class: 'o_fsnode_page__sidebar',
                a_o: [
                    // Preprocessor filters
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__pp_section',
                        'v-if': 'a_o_preprocessor.length > 0',
                        a_o: [
                            {
                                s_tag: 'div',
                                'v-for': 'o_pp of a_o_preprocessor',
                                class: 'o_fsnode_page__pp_item',
                                a_o: [
                                    {
                                        s_tag: 'button',
                                        ':class': "o_pp.b_active ? 'o_fsnode_page__pp_toggle active' : 'o_fsnode_page__pp_toggle'",
                                        'v-on:click': 'f_toggle_preprocessor(o_pp)',
                                        innerText: "{{ o_pp.b_active ? 'on' : 'off' }}",
                                    },
                                    {
                                        s_tag: 'span',
                                        class: 'o_fsnode_page__pp_name',
                                        innerText: '{{ o_pp.s_name }}',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__header',
                        a_o: [
                            {
                                s_tag: 'span',
                                'v-if': '!b_loading && !b_filtering',
                                class: 'o_fsnode_page__count',
                                innerText: '{{ b_has_active_filters ? "filtered " + a_o_fsnode__with_relations__filtered.length + " / " + a_o_fsnode__with_relations.length : a_o_fsnode__with_relations__filtered.length }} fsnodes',
                            },
                            {
                                s_tag: 'span',
                                'v-if': 'b_loading',
                                class: 'o_fsnode_page__count',
                                innerText: '{{ s_spinner }} loading...',
                            },
                            {
                                s_tag: 'span',
                                'v-if': 'b_filtering',
                                class: 'o_fsnode_page__count',
                                innerText: '{{ s_spinner }} filtering...',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__list',
                        a_o: [
                            {
                                s_tag: 'div',
                                'v-for': 'o_fsnode of a_o_fsnode__with_relations__filtered',
                                ':class': 'f_s_class__item(o_fsnode)',
                                'v-on:click': 'f_select_fsnode(o_fsnode)',
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
            },
            // Detail panel
            {
                s_tag: 'div',
                class: 'o_fsnode_page__detail',
                'v-if': 'o_fsnode__active',
                a_o: [
                    // Properties
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__props',
                        a_o: [
                            { s_tag: 'div', class: 'o_fsnode_page__prop', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'id' },
                                { s_tag: 'span', innerText: '{{ o_fsnode__active.n_id }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'name' },
                                { s_tag: 'span', innerText: '{{ o_fsnode__active.s_name }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'path' },
                                { s_tag: 'span', class: 'o_fsnode_page__path', innerText: '{{ o_fsnode__active.s_path_absolute }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'type' },
                                { s_tag: 'span', innerText: "{{ o_fsnode__active.b_folder ? 'folder' : 'file' }}" },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'size' },
                                { s_tag: 'span', innerText: '{{ f_s_bytes(o_fsnode__active.n_bytes) }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', 'v-if': 'o_image__active', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'dimensions' },
                                { s_tag: 'span', innerText: '{{ o_image__active.n_width }}x{{ o_image__active.n_height }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', 'v-if': 'o_video__active', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'duration' },
                                { s_tag: 'span', innerText: '{{ f_s_duration(o_video__active.n_duration_ms) }}' },
                            ]},
                            { s_tag: 'div', class: 'o_fsnode_page__prop', 'v-if': 'o_video__active', a_o: [
                                { s_tag: 'span', class: 'o_fsnode_page__prop_label', innerText: 'video width' },
                                { s_tag: 'span', innerText: '{{ o_video__active.n_width }}' },
                            ]},
                        ],
                    },
                    // Prev / Next navigation
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__nav',
                        a_o: [
                            {
                                s_tag: 'button',
                                class: 'clickable',
                                'v-on:click': 'f_prev',
                                ':disabled': 'n_idx__active <= 0',
                                innerText: "prev 'j'",
                            },
                            {
                                s_tag: 'span',
                                class: 'o_fsnode_page__nav_pos',
                                innerText: '{{ n_idx__active + 1 }} / {{ a_o_fsnode__with_relations__filtered.length }}',
                            },
                            {
                                s_tag: 'button',
                                class: 'clickable',
                                'v-on:click': 'f_next',
                                ':disabled': 'n_idx__active >= a_o_fsnode__with_relations__filtered.length - 1',
                                innerText: "next 'l'",
                            },
                            {
                                s_tag: 'button',
                                ':class': "b_show_yolo ? 'clickable clickable--active' : 'clickable'",
                                'v-on:click': 'f_toggle_yolo',
                                innerText: "yolo 'y'",
                            },
                        ],
                    },
                    // Image preview in canvas
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__image_preview',
                        'v-if': 'o_image__active && !o_video__active',
                        a_o: [
                            { s_tag: 'canvas', id: 'canvas__fsnode_image' },
                        ],
                    },
                    // Video preview with frame overlay
                    {
                        s_tag: 'div',
                        class: 'o_fsnode_page__video_preview',
                        'v-if': 'o_video__active',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_fsnode_page__video_container',
                                a_o: [
                                    {
                                        s_tag: 'video',
                                        ':src': 's_url__video',
                                        controls: '',
                                        class: 'o_fsnode_page__video',
                                    },
                                    {
                                        s_tag: 'div',
                                        class: 'o_fsnode_page__frame_grid',
                                        'v-if': 'a_o_frame__video.length > 0',
                                        a_o: [
                                            {
                                                s_tag: 'img',
                                                'v-for': 'o_frame of a_o_frame__video',
                                                ':src': 'f_s_url__file(o_frame.s_path_absolute)',
                                                ':title': 'o_frame.s_name',
                                                class: 'o_fsnode_page__frame_thumb',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            // Empty state
            {
                s_tag: 'div',
                class: 'o_fsnode_page__empty',
                'v-if': '!o_fsnode__active',
                innerText: 'Select a fsnode to preview.',
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_fsnode__active: null,
            b_show_yolo: true,
            b_loading: false,
            b_filtering: false,
            s_spinner: '|',
            a_o_fsnode__with_relations: [],
            a_o_fsnode__with_relations__filtered: [],
        };
    },
    computed: {
        a_o_preprocessor: function() {
            return this.o_state[s_name_table__preprocessor] || [];
        },
        b_has_active_filters: function() {
            return this.a_o_preprocessor.some(function(o_pp) { return o_pp.b_active && o_pp.s_f_b_show; });
        },
        o_image__active: function() {
            let o_self = this;
            if (!o_self.o_fsnode__active || !o_self.o_fsnode__active.n_id) return null;
            return (o_self.o_state.a_o_image || []).find(function(o) {
                return o.n_o_fsnode_n_id === o_self.o_fsnode__active.n_id;
            }) || null;
        },
        o_video__active: function() {
            let o_self = this;
            if (!o_self.o_fsnode__active || !o_self.o_fsnode__active.n_id) return null;
            return (o_self.o_state.a_o_video || []).find(function(o) {
                return o.n_o_fsnode_n_id === o_self.o_fsnode__active.n_id;
            }) || null;
        },
        s_url__video: function() {
            if (!this.o_fsnode__active) return '';
            return '/api/file?path=' + encodeURIComponent(this.o_fsnode__active.s_path_absolute);
        },
        n_idx__active: function() {
            let o_self = this;
            if (!o_self.o_fsnode__active) return -1;
            return o_self.a_o_fsnode__with_relations__filtered.findIndex(function(o) { return o.n_id === o_self.o_fsnode__active.n_id; });
        },
        a_o_frame__video: function() {
            let o_self = this;
            if (!o_self.o_video__active || !o_self.o_fsnode__active) return [];
            let s_ds = o_self.o_state.s_ds || '/';
            let s_root = o_self.o_state.s_root_dir || '';
            let s_prefix = s_root + s_ds + '.gitignored' + s_ds + 'frames' + s_ds + o_self.o_fsnode__active.n_id + '_';
            let a_o_fsnode = o_self.o_state.a_o_fsnode || [];
            let a_o_image = o_self.o_state.a_o_image || [];
            let a_o = [];
            for (let o_img of a_o_image) {
                let o_img_fsnode = a_o_fsnode.find(function(o) { return o.n_id === o_img.n_o_fsnode_n_id; });
                if (o_img_fsnode && o_img_fsnode.s_path_absolute.startsWith(s_prefix)) {
                    a_o.push(o_img_fsnode);
                }
            }
            return a_o;
        },
        a_o_detection__active: function() {
            let o_self = this;
            if (!o_self.o_image__active) return [];
            let n_image_id = o_self.o_image__active.n_id;
            let a_o_junction = o_self.o_state.a_o_image_o_cococlass || [];
            let a_o_cococlass = o_self.o_state.a_o_cococlass || [];
            let a_o = [];
            for (let o_j of a_o_junction) {
                if (o_j.n_o_image_n_id !== n_image_id) continue;
                let o_cls = a_o_cococlass.find(function(o) { return o.n_id === o_j.n_o_cococlass_n_id; });
                a_o.push({
                    s_name: o_cls ? o_cls.s_name : '?',
                    n_cococlass_n_id: o_j.n_o_cococlass_n_id,
                    n_confidence: o_j.n_confidence,
                    n_x1: o_j.n_x1,
                    n_y1: o_j.n_y1,
                    n_x2: o_j.n_x2,
                    n_y2: o_j.n_y2,
                });
            }
            return a_o;
        },
    },
    methods: {
        f_s_class__item: function(o_fsnode) {
            let s = 'o_fsnode_page__item clickable';
            if (this.o_fsnode__active && this.o_fsnode__active.n_id === o_fsnode.n_id) s += ' active';
            return s;
        },
        f_select_fsnode: function(o_fsnode) {
            let o_self = this;
            o_self.o_fsnode__active = o_fsnode;
            o_self.$nextTick(function() { o_self.f_draw_canvas(); });
        },
        f_s_color__from_id: function(n_id) {
            // deterministic color per cococlass id using golden-angle hue spread
            let n_hue = (n_id * 137.508) % 360;
            return 'hsl(' + n_hue + ', 90%, 55%)';
        },
        f_draw_canvas: function() {
            let o_self = this;
            if (!o_self.o_image__active || o_self.o_video__active) return;
            let o_canvas = document.getElementById('canvas__fsnode_image');
            if (!o_canvas) return;
            let o_ctx = o_canvas.getContext('2d');
            let o_img = new Image();
            o_img.onload = function() {
                o_canvas.width = o_img.width;
                o_canvas.height = o_img.height;
                // scale canvas display to fill container
                let o_container = o_canvas.parentElement;
                let n_cw = o_container.clientWidth - 16;
                let n_ch = o_container.clientHeight - 16;
                let n_scale = Math.min(n_cw / o_img.width, n_ch / o_img.height);
                o_canvas.style.width = Math.floor(o_img.width * n_scale) + 'px';
                o_canvas.style.height = Math.floor(o_img.height * n_scale) + 'px';
                o_ctx.drawImage(o_img, 0, 0);
                // draw detection overlays
                if (!o_self.b_show_yolo) return;
                let a_o_det = o_self.a_o_detection__active;
                for (let o_det of a_o_det) {
                    let s_color = o_self.f_s_color__from_id(o_det.n_cococlass_n_id);
                    let n_x = o_det.n_x1;
                    let n_y = o_det.n_y1;
                    let n_w = o_det.n_x2 - o_det.n_x1;
                    let n_h = o_det.n_y2 - o_det.n_y1;
                    // rectangle
                    o_ctx.strokeStyle = s_color;
                    o_ctx.lineWidth = 3;
                    o_ctx.strokeRect(n_x, n_y, n_w, n_h);
                    // semi-transparent fill
                    o_ctx.fillStyle = s_color;
                    o_ctx.globalAlpha = 0.15;
                    o_ctx.fillRect(n_x, n_y, n_w, n_h);
                    o_ctx.globalAlpha = 1.0;
                    // label background
                    let s_label = o_det.s_name + ' ' + (o_det.n_confidence * 100).toFixed(0) + '%';
                    let n_font_size = Math.max(14, Math.min(o_img.width, o_img.height) * 0.025);
                    o_ctx.font = 'bold ' + n_font_size + 'px sans-serif';
                    let n_text_w = o_ctx.measureText(s_label).width;
                    let n_pad = 4;
                    o_ctx.fillStyle = s_color;
                    o_ctx.fillRect(n_x, n_y - n_font_size - n_pad * 2, n_text_w + n_pad * 2, n_font_size + n_pad * 2);
                    // label text
                    o_ctx.fillStyle = '#000';
                    o_ctx.fillText(s_label, n_x + n_pad, n_y - n_pad);
                }
            };
            o_img.src = '/api/file?path=' + encodeURIComponent(o_self.o_fsnode__active.s_path_absolute);
        },
        f_s_url__file: function(s_path) {
            return '/api/file?path=' + encodeURIComponent(s_path);
        },
        f_s_bytes: function(n_bytes) {
            if (n_bytes == null) return '-';
            if (n_bytes < 1024) return n_bytes + ' B';
            if (n_bytes < 1024 * 1024) return (n_bytes / 1024).toFixed(1) + ' KB';
            if (n_bytes < 1024 * 1024 * 1024) return (n_bytes / (1024 * 1024)).toFixed(1) + ' MB';
            return (n_bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        },
        f_s_duration: function(n_ms) {
            if (!n_ms) return '-';
            let n_total_s = Math.floor(n_ms / 1000);
            let n_h = Math.floor(n_total_s / 3600);
            let n_m = Math.floor((n_total_s % 3600) / 60);
            let n_s = n_total_s % 60;
            if (n_h > 0) return String(n_h) + ':' + String(n_m).padStart(2, '0') + ':' + String(n_s).padStart(2, '0');
            return String(n_m).padStart(2, '0') + ':' + String(n_s).padStart(2, '0');
        },
        f_prev: function() {
            let a = this.a_o_fsnode__with_relations__filtered;
            if (this.n_idx__active > 0) {
                this.f_select_fsnode(a[this.n_idx__active - 1]);
            }
        },
        f_next: function() {
            let a = this.a_o_fsnode__with_relations__filtered;
            if (this.n_idx__active < a.length - 1) {
                this.f_select_fsnode(a[this.n_idx__active + 1]);
            }
        },
        f_toggle_yolo: function() {
            this.b_show_yolo = !this.b_show_yolo;
            this.$nextTick(this.f_draw_canvas);
        },
        f_toggle_preprocessor: async function(o_pp) {
            o_pp.b_active = !o_pp.b_active;
            let o_data__id = { n_id: o_pp.n_id };
            let o_data__update = { b_active: o_pp.b_active };
            await f_send_wsmsg_with_response(
                f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['update', s_name_table__preprocessor, o_data__id, o_data__update])
            );
            this.f_apply_filters();
        },
        f_apply_filters: function() {
            let o_self = this;
            o_self.b_filtering = true;
            let a_s_spinner = ['|', '/', '-', '\\'];
            let n_spinner = 0;
            let n_id__spinner = setInterval(function() {
                n_spinner = (n_spinner + 1) % a_s_spinner.length;
                o_self.s_spinner = a_s_spinner[n_spinner];
            }, 150);
            // yield to let the UI render the filtering state, then filter
            setTimeout(function() {
                let a_o = o_self.a_o_fsnode__with_relations.slice();
                let a_o_pp = o_self.a_o_preprocessor;
                for (let o_pp of a_o_pp) {
                    if (!o_pp.b_active || !o_pp.s_f_b_show) continue;
                    try {
                        let f_filter = new Function('return ' + o_pp.s_f_b_show)();
                        a_o = a_o.filter(function(o_fsnode) {
                            return f_filter(o_fsnode);
                        });
                    } catch (e) {
                        console.warn('preprocessor "' + o_pp.s_name + '" error:', e);
                    }
                }
                o_self.a_o_fsnode__with_relations__filtered = a_o;
                clearInterval(n_id__spinner);
                o_self.b_filtering = false;
            }, 0);
        },
        f_on_keydown: function(o_evt) {
            if (o_evt.key === 'j') this.f_prev();
            if (o_evt.key === 'l') this.f_next();
            if (o_evt.key === 'y') this.f_toggle_yolo();
        },
        f_reload: async function() {
            let o_self = this;
            o_self.b_loading = true;
            let a_s_spinner = ['|', '/', '-', '\\'];
            let n_spinner = 0;
            let n_id__spinner = setInterval(function() {
                n_spinner = (n_spinner + 1) % a_s_spinner.length;
                o_self.s_spinner = a_s_spinner[n_spinner];
            }, 150);
            let a_s_table = [s_name_table, s_name_table__image, s_name_table__video, s_name_table__cococlass, s_name_table__image_cococlass, s_name_table__preprocessor];
            for (let s_t of a_s_table) {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__f_v_crud__indb.s_name, ['read', s_t])
                );
                o_state[s_t] = o_resp.v_result || [];
            }
            // load fsnodes with nested relations for preprocessor filters
            let a_o_fsnode = o_state[s_name_table] || [];
            let a_n_id = a_o_fsnode.map(function(o) { return o.n_id; });
            if (a_n_id.length > 0) {
                let o_resp__enriched = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__f_a_o_instance__with_relations.s_name, [s_name_table, a_n_id])
                );
                o_self.a_o_fsnode__with_relations = o_resp__enriched.v_result || [];
            } else {
                o_self.a_o_fsnode__with_relations = [];
            }
            clearInterval(n_id__spinner);
            o_self.b_loading = false;
            console.log('a_o_fsnode__with_relations', o_self.a_o_fsnode__with_relations);
            o_self.f_apply_filters();
        },
    },
    created: async function() {
        document.addEventListener('keydown', this.f_on_keydown);
        await this.f_reload();
    },
    beforeUnmount: function() {
        document.removeEventListener('keydown', this.f_on_keydown);
    },
};

export { o_component__fsnode };
