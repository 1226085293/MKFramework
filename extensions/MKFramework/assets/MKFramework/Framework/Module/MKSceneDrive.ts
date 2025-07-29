import * as cc from "cc";
import { MKLifeCycle } from "./MKLifeCycle";
import { EDITOR } from "cc/env";
import bundle from "../Resources/MKBundle";
import GlobalEvent from "../../Config/GlobalEvent";
import MKStatusTask from "../Task/MKStatusTask";

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
	private _closeTask = new MKStatusTask(false);
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
		bundle.event.key.beforeSceneSwitch,
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
