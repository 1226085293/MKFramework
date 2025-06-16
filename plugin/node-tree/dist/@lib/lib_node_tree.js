"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lib_node_tree_ = void 0;
const plugin_event_1 = __importDefault(require("../plugin_event"));
class lib_node_tree {
    /** vue 根组件 */
    hierarchy_vue;
    /** style 表 */
    style_tab;
    /** 节点树元素（当前展示的节点 VueComponent） */
    get node_element_as() {
        return this.hierarchy_vue.$children;
    }
    /** 节点树数据（当前展示的节点） */
    get node_as() {
        return this.hierarchy_vue.nodes;
    }
    /** 当前资源 uuid */
    _current_asset_uuid_s = "";
    /** 更新节点树定时器 */
    _update_node_tree_timer;
    /** 头扩展 */
    _head_extension_as = [];
    /** 尾左侧扩展 */
    _tail_left_extension_as = [];
    /** 尾右侧扩展 */
    _tail_right_extension_as = [];
    /* ------------------------------- segmentation ------------------------------- */
    /** 初始化 */
    init() {
        let panel_map = new Map();
        // 获取面板元素
        {
            let panel_as = globalThis.document.getElementsByTagName("dock-frame")[0].shadowRoot.querySelectorAll("panel-frame");
            panel_as.forEach((v) => {
                panel_map.set(v.name, v);
            });
        }
        this.hierarchy_vue = panel_map.get("hierarchy").shadowRoot.querySelectorAll("ui-drag-area")[0].__vue__;
        // 初始化节点树
        this._clear_node_tree();
        this._update_node_tree();
        // 取消监听
        globalThis["__node_tree_stop_watch_f"]?.();
        // 监听节点树变更
        globalThis["__node_tree_stop_watch_f"] = this.hierarchy_vue.$watch("nodes", (new_value, old_value) => {
            // console.log("children 变化", new_value.length, old_value.length);
            if (this._update_node_tree_timer) {
                return;
            }
            this._update_node_tree();
            this._update_node_tree_timer = setTimeout(() => {
                this._update_node_tree_timer = null;
            }, 0);
        });
        this.style_tab = new Proxy({}, {
            get: (target, key) => target[key],
            set: (target, key, new_value, old_value) => {
                target[key] = new_value;
                let root = this.hierarchy_vue.$el;
                let style = root.getElementsByClassName(key)[0];
                if (!style) {
                    style = document.createElement("style");
                    style.textContent = new_value;
                    root.appendChild(style);
                }
                else {
                    style.textContent = new_value;
                }
                return true;
            },
        });
    }
    /** 添加扩展 */
    add(type_, class_name_s_, visible_f_, create_f_, update_f_) {
        let data_as = [class_name_s_, visible_f_, create_f_, update_f_];
        switch (type_) {
            case lib_node_tree_.extension_type.head: {
                this._head_extension_as.push(data_as);
                break;
            }
            case lib_node_tree_.extension_type.tail_left: {
                this._tail_left_extension_as.push(data_as);
                break;
            }
            case lib_node_tree_.extension_type.tail_right: {
                this._tail_right_extension_as.push(data_as);
                break;
            }
        }
        this._update_node_tree();
    }
    /** 删除扩展 */
    del(type_, class_name_s_) {
        let list_as;
        switch (type_) {
            case lib_node_tree_.extension_type.head: {
                list_as = this._head_extension_as;
                break;
            }
            case lib_node_tree_.extension_type.tail_left: {
                list_as = this._tail_left_extension_as;
                break;
            }
            case lib_node_tree_.extension_type.tail_right: {
                list_as = this._tail_right_extension_as;
                break;
            }
        }
        let index_n = list_as.findIndex((v_as) => v_as[0] === class_name_s_);
        if (index_n !== -1) {
            list_as.splice(index_n, 1);
        }
        this._update_node_tree();
    }
    /** 是否存在 */
    has(type_, class_name_s_) {
        let list_as;
        switch (type_) {
            case lib_node_tree_.extension_type.head: {
                list_as = this._head_extension_as;
                break;
            }
            case lib_node_tree_.extension_type.tail_left: {
                list_as = this._tail_left_extension_as;
                break;
            }
            case lib_node_tree_.extension_type.tail_right: {
                list_as = this._tail_right_extension_as;
                break;
            }
        }
        let index_n = list_as.findIndex((v_as) => v_as[0] === class_name_s_);
        return index_n !== -1;
    }
    /** 清理节点树 */
    _clear_node_tree() {
        this.node_element_as.forEach((v) => {
            let element = v.$el;
            // 横向布局
            element.style.display = "flex";
            // 删除节点扩展容器
            element.children[1]?.remove();
        });
    }
    /** 更新节点树 */
    _update_node_tree() {
        // 更新事件
        {
            let last_asset_uuid_s = this._current_asset_uuid_s;
            this._current_asset_uuid_s = !this.node_as.length
                ? ""
                : this.node_as[0].type === "cc.Scene"
                    ? this.node_as[0].uuid
                    : this.node_as[0].prefab.assetUuid;
            // 节点树更新
            if (last_asset_uuid_s !== this._current_asset_uuid_s) {
                plugin_event_1.default.emit(plugin_event_1.default.key.node_tree_update);
            }
        }
        if (!this.node_as.length) {
            return;
        }
        this.node_element_as.forEach((v) => {
            let element = v.$el;
            /** 节点 div */
            let node_div = element.children[0];
            /** 扩展头 div */
            let head_extend_div = element.getElementsByClassName("head-extend")?.[0];
            /** 扩展左 div */
            let tail_extend_left_div = node_div.getElementsByClassName("tail-extend-left")?.[0];
            /** 扩展右 div */
            let tail_extend_right_div = node_div.getElementsByClassName("tail-extend-right")?.[0];
            if (element.getAttribute("state") === "add") {
                return;
            }
            // 更新内容
            {
                let name = node_div.getElementsByTagName("ui-rename-input")[0];
                element.style.display = "flex";
                node_div.style.width = "-webkit-fill-available";
                if (name) {
                    name.style.flex = "none";
                }
            }
            // 头扩展
            if (!head_extend_div && this._head_extension_as.length) {
                head_extend_div = document.createElement("div");
                head_extend_div.className = "head-extend";
                head_extend_div.style.display = "inline-flex";
                head_extend_div.style.paddingLeft = "5px";
                head_extend_div.style.paddingRight = "-3px";
                head_extend_div.style.flexDirection = "row";
                head_extend_div.style.float = "left";
                head_extend_div.style.gap = "4px";
                head_extend_div.style.position = "absolute";
                head_extend_div.style.left = "0px";
                element.appendChild(head_extend_div);
            }
            // 尾左侧扩展
            if (!tail_extend_left_div && this._tail_left_extension_as.length) {
                tail_extend_left_div = document.createElement("div");
                tail_extend_left_div.className = "tail-extend-left";
                tail_extend_left_div.style.display = "inline-flex";
                tail_extend_left_div.style.paddingLeft = "5px";
                tail_extend_left_div.style.flexDirection = "row";
                tail_extend_left_div.style.float = "left";
                tail_extend_left_div.style.gap = "4px";
                node_div.appendChild(tail_extend_left_div);
            }
            // 尾右侧扩展
            if (!tail_extend_right_div && this._tail_right_extension_as.length) {
                tail_extend_right_div = document.createElement("div");
                tail_extend_right_div.className = "tail-extend-right";
                tail_extend_right_div.style.display = "inline-flex";
                tail_extend_right_div.style.paddingRight = "5px";
                tail_extend_right_div.style.flexDirection = "row-reverse";
                tail_extend_right_div.style.gap = "4px";
                tail_extend_right_div.style.position = "absolute";
                tail_extend_right_div.style.right = "0px";
                node_div.appendChild(tail_extend_right_div);
            }
            [this._head_extension_as, this._tail_left_extension_as, this._tail_right_extension_as].forEach((v2_as, k2_n) => {
                /** 父标签 */
                let parent_div = [head_extend_div, tail_extend_left_div, tail_extend_right_div][k2_n];
                /** 扩展标签 */
                let extend_div_as = [];
                v2_as.forEach((v3) => {
                    let [class_s, visible_f, create_f, update_f] = v3;
                    /** 扩展标签 */
                    let extension_div = parent_div.getElementsByClassName(class_s)?.[0];
                    /** 是否展示 */
                    let visible_b = visible_f(v);
                    // 不展示标签
                    if (!visible_b) {
                        if (extension_div) {
                            extension_div.remove();
                        }
                        return;
                    }
                    // 展示标签
                    if (visible_b && !extension_div) {
                        extension_div = create_f(v);
                        extension_div.classList.add(class_s);
                        parent_div.appendChild(extension_div);
                    }
                    // 更新扩展列表
                    extend_div_as.push(extension_div);
                    // 更新标签
                    update_f?.(v, extension_div);
                });
                // 删除多余标签
                parent_div?.childNodes.forEach((v3) => {
                    if (!extend_div_as.includes(v3)) {
                        v3.remove();
                    }
                });
            });
            node_div.style.marginLeft = !head_extend_div ? "0px" : `${head_extend_div.clientWidth - 5}px`;
        });
    }
}
var lib_node_tree_;
(function (lib_node_tree_) {
    let extension_type;
    (function (extension_type) {
        /** 头 */
        extension_type[extension_type["head"] = 0] = "head";
        /** 尾左侧 */
        extension_type[extension_type["tail_left"] = 1] = "tail_left";
        /** 尾右侧 */
        extension_type[extension_type["tail_right"] = 2] = "tail_right";
    })(extension_type = lib_node_tree_.extension_type || (lib_node_tree_.extension_type = {}));
})(lib_node_tree_ || (exports.lib_node_tree_ = lib_node_tree_ = {}));
exports.default = new lib_node_tree();
