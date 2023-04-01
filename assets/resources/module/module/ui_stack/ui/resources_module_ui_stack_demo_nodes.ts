import * as cc from "cc";

class nodes {
	constructor(node: cc.Node) {
		this.number = node.getChildByPath("SpriteSplash/+Label@number")!;
	}

	number: cc.Node = null!;
}

export default nodes;
