import * as cc from "cc";

class nodes {
	constructor(node: cc.Node) {
		this.label = node.getChildByPath("+Label@label")!;
	}

	label: cc.Node = null!;
}

export default nodes;
