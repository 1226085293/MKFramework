import { _decorator } from "cc";
import mk from "mk";
import operate from "./step/resources_guide_operate";
import resources_guide_step1 from "./step/resources_guide_step1";
import resources_guide_step2 from "./step/resources_guide_step2";
import resources_guide_step3 from "./step/resources_guide_step3";
const { ccclass, property } = _decorator;

@ccclass("resources_guide")
export class resources_guide extends mk.module.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	create(): void {
		const guide_manage = new mk.guide_manage({
			operate_tab: operate.tab,
			end_step_n: 4,
			step_update_callback_f: () => true,
		});

		guide_manage.regis_step([new resources_guide_step1(), new resources_guide_step2(), new resources_guide_step3()]);

		guide_manage.event.once(guide_manage.event.key.finish, () => {
			this.close();
		});

		guide_manage.set_step(1);
	}

	// init(init_?: typeof this.init_data): void {}
	// open(): void {}

	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/* ------------------------------- 功能 ------------------------------- */
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
