import * as cc from "cc";
const { ccclass, property } = cc._decorator;

@ccclass("main_main_nodes")
class main_main_nodes {
	/** Camera-001 */
	@property({ displayName: "Camera-001", type: cc.Node })
	camera_rt: cc.Node = null!;

	/** 检测节点 */
	@property({ displayName: "检测节点", type: cc.Node })
	check_node: cc.Node = null!;

	/** SpriteSplash */
	@property({ displayName: "SpriteSplash", type: cc.Node })
	bg: cc.Node = null!;
}

export default main_main_nodes;
