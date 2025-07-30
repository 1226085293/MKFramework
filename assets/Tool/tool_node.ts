import * as cc from "cc";
import mk from "mk";

class tool_node extends mk.instance_base {
	/**
	 * 遍历父节点
	 * @param node_ 节点
	 * @param callback_f_ 返回 true 则返回
	 * @returns
	 * @remarks
	 * 从当前节点开始
	 */
	traverse_parent(node_: cc.Node | null, callback_f_: (node: cc.Node) => boolean): cc.Node | null {
		if (!node_) {
			return null;
		}

		if (callback_f_(node_)) {
			return node_;
		}

		return this.traverse_parent(node_.parent, callback_f_);
	}
}

export default tool_node.instance();
