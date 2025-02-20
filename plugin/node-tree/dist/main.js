"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.m_global = exports.scene = exports.event = exports.menu = void 0;
const lib_node_tree_1 = __importDefault(require("./@lib/lib_node_tree"));
const plugin_data_1 = __importDefault(require("./plugin_data"));
const right_component_1 = __importDefault(require("./right_component/right_component"));
const node_active_1 = __importDefault(require("./node_active/node_active"));
const node_reference_1 = __importDefault(require("./node_reference/node_reference"));
/** 菜单触发器（渲染进程） */
exports.menu = [
    {
        trigger_ss: ["load"],
        callback_f: () => {
            plugin_data_1.default.reset();
            lib_node_tree_1.default.init();
            super_menu.debug_b = false;
        },
    },
    // 节点引用
    ...node_reference_1.default.menu,
    // 脚本名展示
    ...right_component_1.default.menu,
    // 节点勾选功能
    ...node_active_1.default.menu,
];
/**
 * 事件触发器（主进程）
 * @备注
 * 事件列表：顶部菜单/开发者/消息列表
 * @额外扩展
 * - load: 主进程加载
 * - unload: 主进程卸载
 */
exports.event = [
    {
        trigger_ss: ["log"],
        callback_f: (method_s_, ...args_as_) => {
            console[method_s_](...args_as_);
        },
    },
    // 节点引用
    ...node_reference_1.default.event,
];
/**
 * 事件触发器（场景脚本）
 * @额外扩展
 * - load: 场景脚本加载
 * - unload: 场景脚本卸载
 */
exports.scene = [
    // 节点引用
    ...node_reference_1.default.scene,
];
exports.m_global = globalThis;
