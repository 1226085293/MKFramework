import * as cc from "cc";
import resources_guide_operate from "./ResourcesGuideOperate";
import ResourcesGuideStepBase from "./ResourcesGuideStepBase";
const { ccclass, property } = cc._decorator;

@ccclass
class ResourcesGuideStep2 extends ResourcesGuideStepBase {
	stepNum = 2;
	nextStepNumList = [3];
	sceneStr = "main.Main";
	operateStrList = [resources_guide_operate.key.隐藏所有按钮, resources_guide_operate.key.按钮2];
	/* ------------------------------- 生命周期 ------------------------------- */
	load(): void {
		console.log("ResourcesGuideStep2 - load");
		const button = this.operateTab[resources_guide_operate.key.按钮2];

		button?.once(cc.Button.EventType.CLICK, () => {
			this._next();
		});
	}

	unload(): void {
		console.log("ResourcesGuideStep2 - unload");
	}
}

export default ResourcesGuideStep2;
