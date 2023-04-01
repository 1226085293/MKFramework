import * as cc from "cc";

class nodes {
	constructor(node: cc.Node) {
		this.bg = node.getChildByPath("+背景@bg")!;
		this.cube = node.getChildByPath("+音量方块@cube")!;
	}

	bg: cc.Node = null!;
	cube: cc.Node = null!;
}

export default nodes;
