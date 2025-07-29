import * as cc from "cc";
import GlobalEvent from "../Config/GlobalEvent";
import MKInstanceBase from "./MKInstanceBase";

namespace _MKGame {
	/** 暂停数据 */
	export interface PauseData {
		/** 龙骨速率 */
		dragonBonesTimeScaleNum?: number;
		/** spine 速率 */
		spineTimeScaleNum?: number;
	}
}

/**
 * 游戏全局功能
 * @noInheritDoc
 */
export class MKGame extends MKInstanceBase {
	/* --------------- public --------------- */
	/** 重启中 */
	get isRestarting(): boolean {
		return this._isRestarting;
	}

	/* --------------- private --------------- */
	/** 重启中 */
	private _isRestarting = false;
	/** 暂停数据 */
	private _pauseDataMap = new Map<cc.Node, _MKGame.PauseData>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 重启游戏
	 * @remarks
	 * 请不要使用 cc.game.restart()，因为这会影响框架内的数据清理以及生命周期
	 */
	async restart(): Promise<void> {
		this._isRestarting = true;
		await Promise.all(GlobalEvent.request(GlobalEvent.key.restart));
		await Promise.all(GlobalEvent.request(GlobalEvent.key.waitCloseScene));
		cc.game.restart();
		this._isRestarting = false;
	}

	/**
	 * 暂停节点
	 * @param node_ 目标节点
	 * @param isRecursion_ 是否递归子节点
	 */
	pause(node_: cc.Node, isRecursion_ = false): void {
		/** 龙骨 */
		const dragonBones = !cc.dragonBones ? null : node_.getComponent(cc.dragonBones.ArmatureDisplay);
		/** spine */
		const spine = !cc.sp ? null : node_.getComponent(cc.sp.Skeleton);
		/** 暂停数据 */
		let pauseData = this._pauseDataMap.get(node_);

		if (!pauseData) {
			this._pauseDataMap.set(node_, (pauseData = {}));
		}

		// 定时器
		cc.director.getScheduler().pauseTarget(node_);
		// 动画
		node_.getComponent(cc.Animation)?.pause();
		// 缓动
		cc.TweenSystem.instance.ActionManager.pauseTarget(node_);

		// 龙骨
		if (dragonBones) {
			pauseData.dragonBonesTimeScaleNum = dragonBones.timeScale;
			dragonBones.timeScale = 0;
		}

		// spine
		if (spine) {
			pauseData.spineTimeScaleNum = spine.timeScale;
			spine.timeScale = 0;
		}

		// 递归
		if (isRecursion_) {
			node_.children.forEach((v) => {
				this.pause(v, isRecursion_);
			});
		}
	}

	/**
	 * 恢复节点
	 * @param node_ 目标节点
	 * @param isRecursion_ 是否递归子节点
	 */
	resume(node_: cc.Node, isRecursion_ = false): void {
		/** 龙骨 */
		const dragonBones = !cc.dragonBones ? null : node_.getComponent(cc.dragonBones.ArmatureDisplay);
		/** spine */
		const spine = !cc.sp ? null : node_.getComponent(cc.sp.Skeleton);
		/** 暂停数据 */
		const pauseData = this._pauseDataMap.get(node_);

		// 定时器
		cc.director.getScheduler().resumeTarget(node_);
		// 动画
		node_.getComponent(cc.Animation)?.resume();
		// 缓动
		cc.TweenSystem.instance.ActionManager.resumeTarget(node_);

		// 龙骨
		if (dragonBones) {
			dragonBones.timeScale = pauseData?.dragonBonesTimeScaleNum ?? 1;
		}

		// spine
		if (spine) {
			spine.timeScale = pauseData?.spineTimeScaleNum ?? 1;
		}

		// 递归
		if (isRecursion_) {
			node_.children.forEach((v) => {
				this.resume(v, isRecursion_);
			});
		}
	}
}

const mkGame = MKGame.instance();

export default mkGame;
