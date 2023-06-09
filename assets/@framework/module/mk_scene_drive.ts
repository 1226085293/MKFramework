import * as cc from "cc";
import { mk_life_cycle } from "./mk_life_cycle";
import { EDITOR } from "cc/env";
import bundle from "../resources/mk_bundle";
import global_event from "../../@config/global_event";
import mk_status_task from "../task/mk_status_task";

const { ccclass, property } = cc._decorator;

/** 场景驱动 */
@ccclass
class mk_scene_drive extends mk_life_cycle {
	/* --------------- private --------------- */
	private _close_task = new mk_status_task(false);
	/* ------------------------------- 生命周期 ------------------------------- */
	async onLoad() {
		// 递归 open
		this._open({ first_b: true });

		// 事件监听
		{
			// 全局事件
			{
				global_event.on(global_event.key.restart, this._event_restart, this);
				global_event.on(global_event.key.wait_close_scene, this._event_wait_close_scene, this);
			}

			// 框架事件
			bundle.event.on(bundle.event.key.before_scene_switch, this._event_before_scene_switch, this);
		}
	}

	onDestroy() {
		global_event.targetOff(this);
		bundle.event.targetOff(this);
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private async _event_restart(): Promise<void> {
		await this._close({
			first_b: true,
			destroy_children_b: true,
		});

		this._close_task.finish(true);
	}

	private async _event_wait_close_scene(): Promise<void> {
		await this._close_task.task;
	}

	/* ------------------------------- 框架事件 ------------------------------- */
	private async _event_before_scene_switch(): Promise<void> {
		await this._close({
			first_b: true,
		});

		this._close_task.finish(true);
	}
}

// 自动添加至场景节点
if (!EDITOR) {
	cc.director.on(
		cc.Director.EVENT_AFTER_SCENE_LAUNCH,
		() => {
			cc.director.getScene()?.children.forEach((v) => {
				if (!v.getComponent(mk_scene_drive)) {
					v.addComponent(mk_scene_drive);
				}
			});
		},
		mk_scene_drive
	);
}

export default mk_scene_drive;
