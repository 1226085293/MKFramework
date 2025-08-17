import * as cc from "cc";

class Nodes {
	constructor(node: cc.Node) {
		this.number = node.getChildByPath("SpriteSplash/+Label@number")!;
	}

	number: cc.Node = null!;
}

export default Nodes;
