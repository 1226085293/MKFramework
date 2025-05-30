"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.m_global = exports.scene = exports.event = exports.menu = void 0;
const tool_1 = __importDefault(require("./tool"));
/** 菜单触发器（渲染进程） */
exports.menu = [
    {
        trigger_ss: ["top/MKFramework/配置表"],
        priority_n: -1,
        callback_f: () => {
            tool_1.default.open_panel("panel");
        },
    },
    {
        trigger_ss: ["asset/打开"],
        run_f(asset) {
            return asset.url === `db://quick-plugin/导表工具 - xlsx-tool`;
        },
        callback_f: () => {
            tool_1.default.open_panel("panel");
        },
    },
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
// {
// 	trigger_ss: ["load"],
// 	callback_f: (data: any) => {
// 		tool.open_panel("panel");
// 	},
// },
];
/**
 * 事件触发器（场景脚本）
 * @额外扩展
 * - load: 场景脚本加载
 * - unload: 场景脚本卸载
 */
exports.scene = [
// {
// 	trigger_ss: ["scene_test"],
// 	callback_f: (args: number) => {
// 		let cc = require("cc");
// 		console.log("场景脚本", args, `cc(${Boolean(cc)})`);
// 	},
// },
];
exports.m_global = globalThis;
