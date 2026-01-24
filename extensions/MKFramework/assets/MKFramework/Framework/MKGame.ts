import { Animation, director, dragonBones, game, Node, Scene, sp, TweenSystem } from "cc";
import globalEvent from "../Config/GlobalEvent";
import MKInstanceBase from "./MKInstanceBase";

namespace _MKGame {
	/** 暂停数据 */
	export interface PauseData {
		/** 龙骨速率 */
		dragonBonesTimeScaleNum?: number;
		/** spine 速率 */
		spineTimeScaleNum?: number;
		/** update 函数 */
		updateMap?: Map<any, (Function | undefined)[]>;
	}

	/** 暂停配置 */
	export interface PauseConfig {
		/** 是否递归执行 */
		isRecursion?: boolean;
		/** 排除列表 */
		excludeList?: Node[];
		/** 暂停 update */
		isPauseUpdate?: boolean;
	}

	/** 恢复配置 */
	export interface ResumeConfig {
		/** 是否递归执行 */
		isRecursion?: boolean;
		/** 排除列表 */
		excludeList?: Node[];
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
	private _pauseDataMap = new Map<Node, _MKGame.PauseData>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 重启游戏
	 * @remarks
	 * 请不要使用 game.restart()，因为这会影响框架内的数据清理以及生命周期
	 */
	async restart(): Promise<void> {
		this._isRestarting = true;
		await Promise.all(globalEvent.request(globalEvent.key.restart));
		await Promise.all(globalEvent.request(globalEvent.key.waitCloseScene));
		game.restart();
		this._isRestarting = false;
	}

	/**
	 * 暂停节点上的龙骨、spine、定时器、动画、缓动等，update 和 lateUpdate 可选暂停
	 * @param target_ 目标节点或者场景
	 * @param config_ 暂停配置
	 */
	pause(target_: Node | Scene, config_?: _MKGame.PauseConfig): void {
		if (!(target_ instanceof Scene)) {
			if (config_?.excludeList?.includes(target_)) {
				return;
			}

			/** 龙骨 */
			const dragonBonesComp = !dragonBones ? null : target_.getComponent(dragonBones.ArmatureDisplay);
			/** spine */
			const spineComp = !sp ? null : target_.getComponent(sp.Skeleton);
			/** 暂停数据 */
			let pauseData = this._pauseDataMap.get(target_);

			if (!pauseData) {
				this._pauseDataMap.set(target_, (pauseData = {}));
			}

			// 定时器
			target_.components.forEach((v) => {
				director.getScheduler().pauseTarget(v as any);
			});

			// 动画
			target_.getComponent(Animation)?.pause();
			// 缓动
			TweenSystem.instance.ActionManager.pauseTarget(target_);

			// 龙骨
			if (dragonBonesComp) {
				pauseData.dragonBonesTimeScaleNum = dragonBonesComp.timeScale;
				dragonBonesComp.timeScale = 0;
			}

			// spine
			if (spineComp) {
				pauseData.spineTimeScaleNum = spineComp.timeScale;
				spineComp.timeScale = 0;
			}

			if (config_?.isPauseUpdate) {
				pauseData.updateMap = new Map();
				target_.components.forEach((v) => {
					if (!v["update"] && !v["lateUpdate"]) {
						return;
					}

					pauseData!.updateMap!.set(v, [v["update"], v["lateUpdate"]]);

					// update
					if (v["update"]) {
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						v["update"] = () => {};
					}

					// lateUpdate
					if (v["lateUpdate"]) {
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						v["lateUpdate"] = () => {};
					}
				});
			}
		}

		// 递归
		if (config_?.isRecursion) {
			target_.children.forEach((v) => {
				this.pause(v, config_);
			});
		}
	}

	/**
	 * 恢复节点
	 * @param target_ 目标节点或者场景
	 * @param config_ 恢复配置
	 */
	resume(target_: Node | Scene, config_?: _MKGame.ResumeConfig): void {
		if (!(target_ instanceof Scene)) {
			if (config_?.excludeList?.includes(target_)) {
				return;
			}

			/** 龙骨 */
			const dragonBonesComp = !dragonBones ? null : target_.getComponent(dragonBones.ArmatureDisplay);
			/** spine */
			const spineComp = !sp ? null : target_.getComponent(sp.Skeleton);
			/** 暂停数据 */
			const pauseData = this._pauseDataMap.get(target_);

			// 定时器
			target_.components.forEach((v) => {
				director.getScheduler().resumeTarget(v as any);
			});

			// 动画
			target_.getComponent(Animation)?.resume();
			// 缓动
			TweenSystem.instance.ActionManager.resumeTarget(target_);

			// 龙骨
			if (dragonBonesComp) {
				dragonBonesComp.timeScale = pauseData?.dragonBonesTimeScaleNum ?? 1;
			}

			// spine
			if (spineComp) {
				spineComp.timeScale = pauseData?.spineTimeScaleNum ?? 1;
			}

			if (pauseData?.updateMap) {
				pauseData.updateMap.forEach((vList, comp) => {
					// update
					if (vList[0]) {
						comp["update"] = vList;
					}

					// lateUpdate
					if (vList[1]) {
						comp["lateUpdate"] = vList;
					}
				});
			}
		}

		// 递归
		if (config_?.isRecursion) {
			target_.children.forEach((v) => {
				this.resume(v, config_);
			});
		}
	}
}

const mkGame = MKGame.instance();

export default mkGame;
