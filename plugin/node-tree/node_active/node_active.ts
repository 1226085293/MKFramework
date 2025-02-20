import lib_node_tree, { lib_node_tree_ } from "../@lib/lib_node_tree";
import { MenuData } from "../types";

class node_active {
	/** 菜单触发器（渲染进程） */
	menu: MenuData[] = [
		{
			trigger_ss: ["node/关闭 active 勾选"],
			priority_n: 999,
			run_f: (node: { depth: number }) => {
				return (
					node.depth === 0 &&
					lib_node_tree.has(lib_node_tree_.extension_type.head, "node-active")
				);
			},
			callback_f: () => {
				lib_node_tree.del(lib_node_tree_.extension_type.head, "node-active");
			},
		},
		{
			trigger_ss: ["node/开启 active 勾选"],
			priority_n: 999,
			run_f: (node: { depth: number }) => {
				return (
					node.depth === 0 &&
					!lib_node_tree.has(lib_node_tree_.extension_type.head, "node-active")
				);
			},
			callback_f: () => {
				lib_node_tree.add(
					lib_node_tree_.extension_type.head,
					"node-active",
					(data) => {
						return lib_node_tree.node_as[0].uuid !== data.node.uuid;
					},
					(data) => {
						let class_name_div = document.createElement("ui-checkbox");

						class_name_div.innerHTML = "";
						class_name_div.addEventListener("confirm", (event) => {
							Editor.Message.send("scene", "set-property", {
								uuid: data.node.uuid,
								path: "active",
								dump: {
									type: "Boolean",
									value: !data.node.active,
								},
							});
						});
						return class_name_div;
					},
					(data, element) => {
						let active_b = data.node.active;
						if (active_b) {
							if (element.getAttribute("checked") === null) {
								element.setAttribute("checked", "");
							}
						} else if (!active_b) {
							element.removeAttribute("checked");
						}
					}
				);
			},
		},
	];
}

export default new node_active();
