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

	/**
	 * 同步子节点数量
	 * @param node_ 父节点
	 * @param valueN_ 子节点数量
	 */
	synchronizedChildNodeNumber(node_: cc.Node, valueN_: number): void {
		if (valueN_ === 0) {
			node_.children[0].active = false;

			return;
		}

		// 移除多余的子节点
		for (let kN = 0, lenN = node_.children.length - valueN_; kN < lenN; ++kN) {
			const node = node_.children[node_.children.length - 1];

			node.destroy();
			node.removeFromParent();
		}

		// 增加缺失的子节点
		for (let kN = 0, lenN = valueN_ - node_.children.length; kN < lenN; ++kN) {
			const node = cc.instantiate(node_.children[node_.children.length - 1]);

			node.parent = node_;
			node.active = true;
		}
	}
}

export default ToolNode.instance();
