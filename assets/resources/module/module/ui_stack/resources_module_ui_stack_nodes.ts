import * as cc from "cc";

class nodes {
	constructor(node: cc.Node) {
		this.layout = node.getChildByPath("+Layout@layout")!;
	}

	layout: cc.Node = null!;
}

export default nodes;
