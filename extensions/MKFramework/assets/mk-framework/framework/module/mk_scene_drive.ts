import * as cc from "cc";
import { mk_life_cycle } from "./mk_life_cycle";
import { EDITOR } from "cc/env";
import bundle from "../resources/mk_bundle";
import global_event from "../../config/global_event";
import mk_status_task from "../task/mk_status_task";

const { ccclass, property } = cc._decorator;

/**
 * 场景驱动
 * @noInheritDoc
 * @remarks
 * 场景加载完成后自动执行生命周期函数，驱动模块系统
 */
@ccclass
class mk_scene_drive extends mk_life_cycle {
	/* --------------- private --------------- */
	private _close_task = new mk_status_task(false);
	/* ------------------------------- 生命周期 ------------------------------- */
	protected async onLoad() {
		// 递归 open
		this._open({ first_b: true });

		// 事件监听
		{
			// 全局事件
			{
				global_event.on(global_event.key.restart, this._event_restart, this);
				global_event.on(global_event.key.wait_close_scene, this._event_wait_close_scene, this);
			}
		}
	}

	protected onDestroy() {
		global_event.targetOff(this);
		bundle.event.targetOff(this);
	}
	/* ------------------------------- segmentation ------------------------------- */
	async event_before_scene_switch(): Promise<void> {
		// 常驻节点
		if (cc.director.isPersistRootNode(this.node)) {
			return;
		}

		await this._close({
			first_b: true,
			force_b: true,
		});

		this._close_task.finish(true);
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
		// 常驻节点
		if (cc.director.isPersistRootNode(this.node)) {
			return;
		}

		await this._close_task.task;
	}
}

// 自动添加至场景节点
if (!EDITOR) {
	cc.director.on(
		cc.Director.EVENT_AFTER_SCENE_LAUNCH,
		() => {
			const scene = cc.director.getScene()!;

			const update_child_comp_f = (): void => {
				scene.children.forEach((v) => {
					if (!v.getComponent(mk_scene_drive)) {
						v.addComponent(mk_scene_drive);
					}
				});
			};

			update_child_comp_f();
			scene.on(cc.Node.EventType.CHILD_ADDED, () => {
				update_child_comp_f();
			});
		},
		mk_scene_drive
	);

	bundle.event.on(
		bundle.event.key.before_scene_switch,
		() => {
			const scene = cc.director.getScene()!;

			scene.children.forEach(async (v) => {
				const scene_drive = v.getComponent(mk_scene_drive) ?? v.addComponent(mk_scene_drive);

				scene_drive.event_before_scene_switch();
			});
		},
		this
	);
}

export default mk_scene_drive;
