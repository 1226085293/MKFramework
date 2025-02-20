import lib_node_tree, { lib_node_tree_ } from "../@lib/lib_node_tree";
import { MenuData } from "../types";

class right_component {
	/** 菜单触发器（渲染进程） */
	menu: MenuData[] = [
		{
			trigger_ss: ["node/关闭脚本名展示"],
			priority_n: 999,
			run_f: (node: { depth: number }) => {
				return (
					node.depth === 0 &&
					lib_node_tree.has(
						lib_node_tree_.extension_type.tail_right,
						"class-name"
					)
				);
			},
			callback_f: () => {
				lib_node_tree.style_tab["class-name-style"] = "";
				lib_node_tree.del(
					lib_node_tree_.extension_type.tail_right,
					"class-name"
				);
			},
		},
		{
			trigger_ss: ["node/开启脚本名展示"],
			priority_n: 999,
			run_f: (node: { depth: number }) => {
				return (
					node.depth === 0 &&
					!lib_node_tree.has(
						lib_node_tree_.extension_type.tail_right,
						"class-name"
					)
				);
			},
			callback_f: () => {
				lib_node_tree.add(
					lib_node_tree_.extension_type.tail_right,
					"class-name",
					(data) => {
						/** 用户组件 */
						let user_component_as: { type: string }[] =
							data.node.components.filter((v: any) => !v.type.startsWith("cc"));

						return user_component_as.length > 0;
					},
					(data) => {
						let icon_div = document.createElement("ui-icon");
						let button_div = document.createElement("div");

						icon_div.setAttribute("color", "");
						icon_div.setAttribute("value", "typescript");
						button_div.appendChild(icon_div);

						return button_div;
					}
				);
			},
		},
	];
}
export default new right_component();
