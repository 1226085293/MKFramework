import * as cc from "cc";

class Nodes {
	constructor(node: cc.Node) {
		this.layout = node.getChildByPath("+Layout@layout")!;
	}

	layout: cc.Node = null!;
}

export default Nodes;
