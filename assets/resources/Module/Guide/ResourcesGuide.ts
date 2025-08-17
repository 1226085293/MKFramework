import { _decorator } from "cc";
import mk from "mk";
import operate from "./Step/ResourcesGuideOperate";
import ResourcesGuideStep1 from "./Step/ResourcesGuideStep1";
import ResourcesGuideStep2 from "./Step/ResourcesGuideStep2";
import ResourcesGuideStep3 from "./Step/ResourcesGuideStep3";
const { ccclass, property } = _decorator;

@ccclass("ResourcesGuide")
export class ResourcesGuide extends mk.ViewBase {
	create(): void {
		const guideManage = new mk.GuideManage({
			operateTab: operate.tab,
			endStepNum: 4,
			stepUpdateCallbackFunc: () => true,
		});

		guideManage.regis([new ResourcesGuideStep1(), new ResourcesGuideStep2(), new ResourcesGuideStep3()]);

		guideManage.event.once(guideManage.event.key.finish, () => {
			this.close();
		});

		guideManage.setStep(1);
	}

	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}
}
