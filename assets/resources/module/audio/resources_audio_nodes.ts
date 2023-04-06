import * as cc from "cc";
const { ccclass, property } = cc._decorator;

@ccclass("resources_audio_nodes")
class resources_audio_nodes {
	/** 背景 */
	@property({ displayName: "背景", type: cc.Node })
	bg: cc.Node = null!;

	/** 音量方块 */
	@property({ displayName: "音量方块", type: cc.Node })
	cube: cc.Node = null!;
}

export default resources_audio_nodes;
