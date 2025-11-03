import * as cc from "cc";
import resources_guide_operate from "./ResourcesGuideOperate";
import ResourcesGuideStepBase from "./ResourcesGuideStepBase";
const { ccclass, property } = cc._decorator;

@ccclass
class ResourcesGuideStep3 extends ResourcesGuideStepBase {
	stepNum = 3;
	nextStepNumList = [999];
	sceneStr = "main.Main";
	operateStrList = [resources_guide_operate.key.隐藏所有按钮, resources_guide_operate.key.按钮3];
	/* ------------------------------- 生命周期 ------------------------------- */
	load(): void | Promise<void> {
		console.log("ResourcesGuideStep3 - load");
		const button = this.operateTab[resources_guide_operate.key.按钮3];

		button?.once(cc.Button.EventType.CLICK, () => {
			this._next();
		});
	}

	unload(): void {
		console.log("ResourcesGuideStep3 - unload");
	}
}

export default ResourcesGuideStep3;
