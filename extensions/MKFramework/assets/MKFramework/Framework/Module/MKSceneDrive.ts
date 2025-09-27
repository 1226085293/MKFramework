import { MKLifeCycle } from "./MKLifeCycle";
import { EDITOR } from "cc/env";
import bundle from "../Resources/MKBundle";
import globalEvent from "../../Config/GlobalEvent";
import MKStatusTask from "../Task/MKStatusTask";
import { _decorator, director, Director, Node } from "cc";

const { ccclass, property } = _decorator;

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
			globalEvent.on(globalEvent.key.restart, this._onRestart, this);
			globalEvent.on(globalEvent.key.waitCloseScene, this._onWaitCloseScene, this);
		}
	}

	protected onDestroy() {
		globalEvent.targetOff(this);
		bundle.event.targetOff(this);
	}
	/* ------------------------------- segmentation ------------------------------- */
	async onBeforeSceneSwitch(): Promise<void> {
		// 常驻节点
		if (director.isPersistRootNode(this.node)) {
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
		if (director.isPersistRootNode(this.node)) {
			return;
		}

		await this._closeTask.task;
	}
}

// 自动添加至场景节点
if (!(EDITOR && !window["cc"].GAME_VIEW)) {
	director.on(
		Director.EVENT_AFTER_SCENE_LAUNCH,
		() => {
			const scene = director.getScene()!;

			const updateChildCompFunc = (): void => {
				scene.children.forEach((v) => {
					if (!v.getComponent(MKSceneDrive)) {
						v.addComponent(MKSceneDrive);
					}
				});
			};

			updateChildCompFunc();
			scene.on(Node.EventType.CHILD_ADDED, () => {
				updateChildCompFunc();
			});
		},
		MKSceneDrive
	);

	bundle.event.on(
		bundle.event.key.beforeSceneSwitch,
		() => {
			const scene = director.getScene()!;

			scene.children.forEach(async (v) => {
				const sceneDrive = v.getComponent(MKSceneDrive) ?? v.addComponent(MKSceneDrive);

				sceneDrive.onBeforeSceneSwitch();
			});
		},
		this
	);
}

export default MKSceneDrive;
