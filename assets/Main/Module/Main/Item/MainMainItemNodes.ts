import * as cc from "cc";
const { ccclass, property } = cc._decorator;

@ccclass("MainMainItemNodes")
class MainMainItemNodes {
	/** Label */
	@property({ displayName: "Label", type: cc.Node })
	label: cc.Node = null!;
}

export default MainMainItemNodes;
