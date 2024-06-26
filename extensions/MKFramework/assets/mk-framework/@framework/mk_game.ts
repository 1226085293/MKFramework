import * as cc from "cc";
import global_event from "../@config/global_event";
import mk_instance_base from "./mk_instance_base";

namespace _mk_game {
	/** 暂停数据 */
	export interface pause_data {
		/** 龙骨速率 */
		dragon_bones_time_scale_n?: number;
		/** spine 速率 */
		spine_time_scale_n?: number;
	}
}

/**
 * 游戏全局功能
 * @noInheritDoc
 */
export class mk_game extends mk_instance_base {
	/* --------------- public --------------- */
	/** 重启中 */
	get restarting_b(): boolean {
		return this._restarting_b;
	}

	/* --------------- private --------------- */
	/** 重启中 */
	private _restarting_b = false;
	/** 暂停数据 */
	private _pause_data_map = new Map<cc.Node, _mk_game.pause_data>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 重启游戏
	 * @remarks
	 * 请不要使用 cc.game.restart()，因为这会影响框架内的数据清理以及生命周期
	 */
	async restart(): Promise<void> {
		this._restarting_b = true;
		await Promise.all(global_event.request(global_event.key.wait_close_scene));
		await Promise.all(global_event.request(global_event.key.restart));
		cc.game.restart();
		this._restarting_b = false;
	}

	/**
	 * 暂停节点
	 * @param node_ 目标节点
	 * @param recursion_b_ 是否递归子节点
	 */
	pause(node_: cc.Node, recursion_b_ = false): void {
		/** 龙骨 */
		const dragon_bones = !cc.dragonBones ? null : node_.getComponent(cc.dragonBones.ArmatureDisplay);
		/** spine */
		const spine = !cc.sp ? null : node_.getComponent(cc.sp.Skeleton);
		/** 暂停数据 */
		let pause_data = this._pause_data_map.get(node_);

		if (!pause_data) {
			this._pause_data_map.set(node_, (pause_data = {}));
		}

		// 定时器
		cc.director.getScheduler().pauseTarget(node_);
		// 动画
		node_.getComponent(cc.Animation)?.pause();
		// 缓动
		cc.TweenSystem.instance.ActionManager.pauseTarget(node_);

		// 龙骨
		if (dragon_bones) {
			pause_data.dragon_bones_time_scale_n = dragon_bones.timeScale;
			dragon_bones.timeScale = 0;
		}

		// spine
		if (spine) {
			pause_data.spine_time_scale_n = spine.timeScale;
			spine.timeScale = 0;
		}

		// 递归
		if (recursion_b_) {
			node_.children.forEach((v) => {
				this.pause(v, recursion_b_);
			});
		}
	}

	/**
	 * 恢复节点
	 * @param node_ 目标节点
	 * @param recursion_b_ 是否递归子节点
	 */
	resume(node_: cc.Node, recursion_b_ = false): void {
		/** 龙骨 */
		const dragon_bones = !cc.dragonBones ? null : node_.getComponent(cc.dragonBones.ArmatureDisplay);
		/** spine */
		const spine = !cc.sp ? null : node_.getComponent(cc.sp.Skeleton);
		/** 暂停数据 */
		const pause_data = this._pause_data_map.get(node_);

		// 定时器
		cc.director.getScheduler().resumeTarget(node_);
		// 动画
		node_.getComponent(cc.Animation)?.resume();
		// 缓动
		cc.TweenSystem.instance.ActionManager.resumeTarget(node_);

		// 龙骨
		if (dragon_bones) {
			dragon_bones.timeScale = pause_data?.dragon_bones_time_scale_n ?? 1;
		}

		// spine
		if (spine) {
			spine.timeScale = pause_data?.spine_time_scale_n ?? 1;
		}

		// 递归
		if (recursion_b_) {
			node_.children.forEach((v) => {
				this.resume(v, recursion_b_);
			});
		}
	}
}

export default mk_game.instance();
