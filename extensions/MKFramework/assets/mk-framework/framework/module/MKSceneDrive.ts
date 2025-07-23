import * as cc from "cc";
import { MKLifeCycle } from "./MKLifeCycle";
import { EDITOR } from "cc/env";
import bundle from "../resources/mk_bundle";
import GlobalEvent from "../../Config/GlobalEvent";
import mk_status_task from "../task/mk_status_task";

const { ccclass, property } = cc._decorator;

/**
 * 场景驱动
 * @noInheritDoc
 * @remarks
 * 场景加载完成后自动执行生命周期函数，驱动模块系统
 */
@ccclass
class MKSceneDrive extends MKLifeCycle {
	/* --------------- private --------------- */
	private _closeTask = new mk_status_task(false);
	/* ------------------------------- 生命周期 ------------------------------- */
	protected async onLoad() {
		// 递归 open
		this._open({ isFirst: true });

		// 事件监听
		{
			// 全局事件
			GlobalEvent.on(GlobalEvent.key.restart, this._onRestart, this);
			GlobalEvent.on(GlobalEvent.key.waitCloseScene, this._onWaitCloseScene, this);
		}
	}

	protected onDestroy() {
		GlobalEvent.targetOff(this);
		bundle.event.targetOff(this);
	}
	/* ------------------------------- segmentation ------------------------------- */
	async onBeforeSceneSwitch(): Promise<void> {
		// 常驻节点
		if (cc.director.isPersistRootNode(this.node)) {
			return;
		}

		await this._close({
			isFirst: true,
			isForce: true,
		});

		this._closeTask.finish(true);
	}
	/* ------------------------------- 全局事件 ------------------------------- */
	private async _onRestart(): Promise<void> {
		await this._close({
			isFirst: true,
			isDestroyChildren: true,
		});

		this._closeTask.finish(true);
	}

	private async _onWaitCloseScene(): Promise<void> {
		// 常驻节点
		if (cc.director.isPersistRootNode(this.node)) {
			return;
		}

		await this._closeTask.task;
	}
}

// 自动添加至场景节点
if (!EDITOR) {
	cc.director.on(
		cc.Director.EVENT_AFTER_SCENE_LAUNCH,
		() => {
			const scene = cc.director.getScene()!;

			const updateChildCompFunc = (): void => {
				scene.children.forEach((v) => {
					if (!v.getComponent(MKSceneDrive)) {
						v.addComponent(MKSceneDrive);
					}
				});
			};

			updateChildCompFunc();
			scene.on(cc.Node.EventType.CHILD_ADDED, () => {
				updateChildCompFunc();
			});
		},
		MKSceneDrive
	);

	bundle.event.on(
		bundle.event.key.before_scene_switch,
		() => {
			const scene = cc.director.getScene()!;

			scene.children.forEach(async (v) => {
				const sceneDrive = v.getComponent(MKSceneDrive) ?? v.addComponent(MKSceneDrive);

				sceneDrive.onBeforeSceneSwitch();
			});
		},
		this
	);
}

export default MKSceneDrive;
