import * as cc from "cc";
import mk from "mk";

class tool_node extends mk.instance_base {
	/**
	 * 遍历父节点
	 * @param parent_ 父节点
	 * @param callback_f_ 返回 true 则返回
	 * @returns
	 */
	traverse_parent(parent_: cc.Node | null, callback_f_: (node: cc.Node) => boolean): cc.Node | null {
		if (!parent_) {
			return null;
		}

		if (callback_f_(parent_)) {
			return parent_;
		}

		return this.traverse_parent(parent_.parent, callback_f_);
	}
}

export default tool_node.instance();
