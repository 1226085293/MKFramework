import lib_node_tree, { lib_node_tree_ } from "./@lib/lib_node_tree";
import plugin_config from "./plugin_config";
import { EventData, MenuData, TreeNode } from "./types";
import path from "path";
import plugin_data from "./plugin_data";
import tool from "./tool";
import variable_name from "./node_reference/variable_name";
import reference_data from "./node_reference/reference_data";
import plugin_event from "./plugin_event";
import right_component from "./right_component/right_component";
import node_active from "./node_active/node_active";
import node_reference from "./node_reference/node_reference";

/** 菜单触发器（渲染进程） */
export const menu: MenuData[] = [
	{
		trigger_ss: ["load"],
		callback_f: () => {
			plugin_data.reset();
			lib_node_tree.init();
			super_menu.debug_b = false;
		},
	},
	// 节点引用
	...node_reference.menu,
	// 脚本名展示
	...right_component.menu,
	// 节点勾选功能
	...node_active.menu,
];

/**
 * 事件触发器（主进程）
 * @备注
 * 事件列表：顶部菜单/开发者/消息列表
 * @额外扩展
 * - load: 主进程加载
 * - unload: 主进程卸载
 */
export const event: EventData[] = [
	{
		trigger_ss: ["log"],
		callback_f: (method_s_: string, ...args_as_: any[]) => {
			(console as any)[method_s_](...args_as_);
		},
	},
	// 节点引用
	...node_reference.event,
];

/**
 * 事件触发器（场景脚本）
 * @额外扩展
 * - load: 场景脚本加载
 * - unload: 场景脚本卸载
 */
export const scene: EventData[] = [
	// 节点引用
	...node_reference.scene,
];

export const m_global = globalThis;
