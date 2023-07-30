import * as cc from "cc";
const { ccclass, property } = cc._decorator;

@ccclass("main_main_item_nodes")
class main_main_item_nodes {
	/** Label */
	@property({ displayName: "Label", type: cc.Node })
	label: cc.Node = null!;
}

export default main_main_item_nodes;
