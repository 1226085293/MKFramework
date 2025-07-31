import * as cc from "cc";
import mk from "mk";

class ToolNode extends mk.InstanceBase {
	/**
	 * 遍历父节点
	 * @param node_ 节点
	 * @param callbackFunc_ 返回 true 则返回
	 * @returns
	 * @remarks
	 * 从当前节点开始
	 */
	traverseParent(node_: cc.Node | null, callbackFunc_: (node: cc.Node) => boolean): cc.Node | null {
		if (!node_) {
			return null;
		}

		if (callbackFunc_(node_)) {
			return node_;
		}

		return this.traverseParent(node_.parent, callbackFunc_);
	}
}

export default ToolNode.instance();
