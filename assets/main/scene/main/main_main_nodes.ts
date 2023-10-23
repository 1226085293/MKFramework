import * as cc from "cc";
const { ccclass, property } = cc._decorator;

@ccclass("main_main_nodes")
class main_main_nodes {
	@property({ displayName: "test", type: cc.Node })
	test: cc.Node = null!;
}

export default main_main_nodes;
