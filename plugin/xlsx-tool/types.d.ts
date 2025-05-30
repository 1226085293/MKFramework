import { MenuItem } from "electron";

export interface TreeNode {
	active: boolean;
	additional: { type: string; value: string }[];
	children: TreeNode[];
	components: {
		extends: string[];
		type: string;
		value: string;
	}[];
	depth: number;
	isScene: boolean;
	level: string;
	locked: boolean;
	name: string;
	parent: string;
	path: string;
	prefab: {
		assetUuid: string;
		isAddedChild: boolean;
		isApplicable: boolean;
		isRevertable: boolean;
		isUnwrappable: boolean;
		state: number;
	};
	readonly: boolean;
	type: string;
	uuid: string;
}

export type MenuData = Partial<Omit<MenuItem, "submenu" | "click">> & {
	/** 触发事件 */
	trigger_ss: string[];
	/** 菜单排序优先级，大 > 小（top 菜单无效） */
	priority_n?: number;
	/** 调式模式（可看到优先级，top 菜单无效） */
	debug_b?: boolean;
	/** 是否执行（top 菜单无效） */
	run_f?: (...args: any[]) => boolean;
	/** 触发回调 */
	callback_f?: (...args: any[]) => void;
};

export type InspectorInfo = {
	type_s: "component" | "asset";
	/** 目标名（type_s 为 component 填写组件名，type_s 为 asset 填写资源类型） */
	target_s: string;
};

export type Self = typeof info extends InspectorInfo
	? {
			dump: any;
			$refs: any;
	  }
	: any;

export type PanelInfo = {
	/** 面板标题 */
	title_s: string;
	/** 宽度 */
	width_n: number;
	/** 高度 */
	height_n: number;
	/** 最小宽度 */
	min_width_n?: number;
	/** 最小高度 */
	min_height_n?: number;
	/** 面板类型 */
	type_s?: "dockable" | "simple";
	/** 可改变大小 */
	resizable_b?: boolean;
	/** 顶层展示 */
	top_level_b?: boolean;
};

export type EventData = {
	/** 触发事件 */
	trigger_ss: string[];
	/** 触发回调 */
	callback_f: (...args_as: any[]) => any;
};
