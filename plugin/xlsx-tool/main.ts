import tool from "./tool";
import { MenuData, TreeNode } from "./types";

/** 菜单触发器（渲染进程） */
export const menu: MenuData[] = [
	{
		trigger_ss: ["top/MKFramework/配置表"],
		priority_n: -1,
		callback_f: () => {
			tool.open_panel("panel");
		},
	},
	{
		trigger_ss: ["asset/打开"],
		run_f(asset) {
			return asset.url === `db://quick-plugin/导表工具 - xlsx-tool`;
		},
		callback_f: () => {
			tool.open_panel("panel");
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
export const event = [
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
export const scene = [
	// {
	// 	trigger_ss: ["scene_test"],
	// 	callback_f: (args: number) => {
	// 		let cc = require("cc");
	// 		console.log("场景脚本", args, `cc(${Boolean(cc)})`);
	// 	},
	// },
];

export const m_global = globalThis;
