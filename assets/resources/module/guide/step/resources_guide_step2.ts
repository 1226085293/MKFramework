import * as cc from "cc";
import resources_guide_operate from "./resources_guide_operate";
import resources_guide_step_base from "./resources_guide_step_base";
const { ccclass, property } = cc._decorator;

@ccclass
class resources_guide_step2 extends resources_guide_step_base {
	step_n = 2;
	next_step_ns = [3];
	scene_s = "main.main";
	operate_ss = [resources_guide_operate.key.隐藏所有按钮, resources_guide_operate.key.按钮2];
	/* ------------------------------- 生命周期 ------------------------------- */
	load(): void | Promise<void> {
		const button = this.operate_tab[resources_guide_operate.key.按钮2];

		button?.once(cc.Button.EventType.CLICK, () => {
			this._next();
		});
	}
}

export default resources_guide_step2;
