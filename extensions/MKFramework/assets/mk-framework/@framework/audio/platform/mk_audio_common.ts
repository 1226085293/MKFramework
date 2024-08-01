import { EDITOR } from "cc/env";
import * as cc from "cc";
import mk_logger from "../../mk_logger";
import mk_audio_base, { mk_audio_base_ } from "../mk_audio_base";
import mk_obj_pool from "../../mk_obj_pool";

const { ccclass } = cc._decorator;

/**
 * 通用音频
 * @noInheritDoc
 * @remarks
 *
 * - 引擎 bug：3.7.2 以下版本不能同时播放两个以上的音频 -> https://github.com/cocos/cocos-engine/issues/14175
 *
 * - 引擎 bug：3.7.2 以下版本使用 @property 资源调用 play 只会有一个音频生效 -> https://github.com/cocos/cocos-engine/issues/14175
 */
class mk_audio_common extends mk_audio_base {
	constructor() {
		super();
		mk_audio_common._instance = this;
		this._constructor();
	}

	/* --------------- static --------------- */
	/** @internal */
	static _instance: mk_audio_common;
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new mk_logger("audio_common");
	/* --------------- private --------------- */
	/** 音频常驻节点 */
	private _audio_node!: cc.Node;
	/** 音频 uuid 索引表 */
	private _audio_unit_map = new Map<string, mk_audio_common_._unit>();
	/** 当前播放数量 */
	private _curr_play_n = 0;
	/** AudioSource 对象池 */
	private _audio_source_pool!: mk_obj_pool.sync<cc.AudioSource>;
	/** 倒计时集合 */
	private _timer_set = new Set<any>();
	/* ------------------------------- 功能 ------------------------------- */
	play(audio_: mk_audio_base_.unit, config_?: Partial<mk_audio_base_.play_config>): boolean {
		const audio = audio_ as mk_audio_common_._unit;

		// 安检
		if (!super.play(audio, config_)) {
			return false;
		}

		if (audio.state === mk_audio_base_.state.play) {
			// 等待播放
			if (audio.wait_play_n !== -1) {
				++audio.wait_play_n;

				return true;
			}

			// 正常播放
			this._play(audio);
		} else {
			this._play(audio);
		}

		return true;
	}

	pause(audio_: mk_audio_common_._unit): void {
		if (!audio_.init_b || audio_.state === mk_audio_base_.state.pause || audio_.state === mk_audio_base_.state.stop) {
			return;
		}

		audio_.audio_source!.pause();
		audio_.state = mk_audio_base_.state.pause;
		audio_._event?.emit(audio_._event?.key.pause);
	}

	stop(audio_: mk_audio_common_._unit): void {
		if (!audio_.init_b || audio_.state === mk_audio_base_.state.stop) {
			return;
		}

		--this._curr_play_n;
		this._log.debug("当前播放数量", this._curr_play_n, "结束");
		audio_.state = mk_audio_base_.state.stop;
		audio_.audio_source!.stop();
		audio_._event?.emit(audio_._event?.key.stop);
		// 回收 AudioSource
		this._audio_source_pool.put(audio_.audio_source!);
		audio_.audio_source = null;
		// 重置进度
		audio_.curr_time_s_n = 0;
	}

	_add(audio_: mk_audio_common_._unit, group_ns_?: number[]): boolean {
		if (!super._add(audio_, group_ns_)) {
			return false;
		}

		// 初始化完成
		audio_.init_b = true;

		return true;
	}

	protected _get_audio_unit<T extends mk_audio_base_._unit>(init_?: Partial<mk_audio_common_._unit>): T {
		return new mk_audio_common_._unit(init_) as any;
	}

	private _play(audio_: mk_audio_common_._unit): void {
		/** 上次状态 */
		const last_state = audio_.state;

		// 恢复播放
		if (audio_.state === mk_audio_base_.state.pause) {
			audio_._event?.emit(audio_._event?.key.resume);
		}

		// 更新状态
		audio_.state = mk_audio_base_.state.play;

		// 更新播放计数
		if (last_state === mk_audio_base_.state.stop) {
			++this._curr_play_n;

			// 请求 AudioSource
			audio_.audio_source = this._audio_source_pool.get();
			audio_.audio_source.clip = audio_.clip;

			// 添加音频 uuid 索引表
			this._audio_unit_map.set(audio_.audio_source.uuid, audio_);
		}

		// 播放音频
		if (audio_.use_play_b) {
			// play 接口计数，若超出 maxAudioChannel 继续播放则会停止之前播放的音频，故退出
			if (last_state === mk_audio_base_.state.stop && this._curr_play_n > cc.AudioSource.maxAudioChannel) {
				this._log.warn("音频数量超出 maxAudioChannel, 停止当前音频播放");
				this.stop(audio_);

				return;
			}

			audio_.audio_source!.play();
		} else {
			audio_.audio_source!.playOneShot(audio_.clip!);
			// 播放开始
			this._node_audio_started(audio_);

			const timer = setTimeout(() => {
				// 删除倒计时
				this._timer_set.delete(timer);
				// 播放结束
				this._node_audio_ended(audio_);
				// loop
				if (audio_.loop_b && audio_.state === mk_audio_base_.state.play) {
					this.play(audio_);
				}
			}, audio_.total_time_s_n * 1000);

			this._timer_set.add(timer);
		}

		if (last_state === mk_audio_base_.state.stop) {
			this._log.debug("当前播放数量", this._curr_play_n, "播放", audio_.clip!.name);
		}
	}

	/** 构造 */
	private async _constructor(): Promise<void> {
		if (EDITOR) {
			return;
		}

		// 添加常驻节点
		{
			let scene = cc.director.getScene();

			if (!scene) {
				await new Promise<void>((resolve_f) => {
					cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, resolve_f);
				});

				scene = cc.director.getScene()!;
			}

			this._audio_node?.destroy();
			this._audio_node = new cc.Node("audio");
			scene.addChild(this._audio_node);
			cc.director.addPersistRootNode(this._audio_node);
		}

		// 节点池
		this._audio_source_pool?.clear();
		this._audio_source_pool = new mk_obj_pool.sync({
			clear_f: (value) => {
				value.forEach((v) => {
					v.destroy();
				});
			},
			create_f: () => {
				const audio_source = new cc.AudioSource();

				audio_source.node = this._audio_node;

				return audio_source;
			},
			reset_f: (value) => {
				// 自动播放
				value.playOnAwake = false;
				// 更新音频 uuid 索引表
				this._audio_unit_map.delete(value.uuid);

				return value;
			},
			init_fill_n: Math.floor(cc.AudioSource.maxAudioChannel * 0.5),
			max_hold_n: cc.AudioSource.maxAudioChannel,
		});

		// 添加回调
		{
			this._audio_node.on(
				cc.AudioSource.EventType.STARTED,
				(audio_comp: cc.AudioSource) => {
					const audio = this._audio_unit_map.get(audio_comp.uuid);

					if (audio) {
						this._node_audio_started(audio);
					}
				},
				this
			);

			this._audio_node.on(
				cc.AudioSource.EventType.ENDED,
				(audio_comp: cc.AudioSource) => {
					const audio = this._audio_unit_map.get(audio_comp.uuid);

					if (audio) {
						this._node_audio_ended(audio);
					}
				},
				this
			);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	/** 播放开始回调 */
	private _node_audio_started(audio_: mk_audio_common_._unit): void {
		if (!audio_) {
			return;
		}

		audio_._event?.emit(audio_._event?.key.play);
	}

	/** 播放结束回调 */
	private _node_audio_ended(audio_: mk_audio_common_._unit): void {
		if (!audio_) {
			return;
		}

		// 若为 stop 状态则表明已经手动停止
		if (audio_.state !== mk_audio_base_.state.stop) {
			--this._curr_play_n;
			this._log.debug("当前播放数量", this._curr_play_n, "结束");
			// 更新播放数据
			audio_.state = mk_audio_base_.state.stop;
			audio_._event?.emit(audio_._event?.key.end);
			// 回收 AudioSource
			this._audio_source_pool.put(audio_.audio_source!);
			audio_.audio_source = null;
			// 重置进度
			audio_.curr_time_s_n = 0;
		}

		// 继续播放
		if (audio_.wait_play_n > 0) {
			this.play(audio_);
			--audio_.wait_play_n;
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	protected _event_restart(): void {
		super._event_restart();
		this._timer_set.forEach((v) => clearTimeout(v));
		this._timer_set.clear();
	}
}

export namespace mk_audio_common_ {
	@ccclass("mk_audio_common/unit")
	export class _unit extends mk_audio_base_._unit {
		constructor(init_?: Partial<_unit>) {
			super(init_);
			Object.assign(this, init_);
		}

		/* --------------- public --------------- */
		/** 初始化状态 */
		get init_b(): boolean {
			return this._init_b;
		}

		set init_b(value_b_: boolean) {
			this._set_init_b(value_b_);
		}

		get volume_n(): number {
			return this._volume_n;
		}

		set volume_n(value_n_) {
			this._set_volume_n(value_n_);
		}

		get loop_b(): boolean {
			return this._loop_b;
		}

		set loop_b(value_b_) {
			this._set_loop_b(value_b_);
		}

		get total_time_s_n(): number {
			return this._get_total_time_s_n();
		}

		get curr_time_s_n(): number {
			return this._get_curr_time_s_n();
		}

		set curr_time_s_n(value_n_) {
			this._set_curr_time_s_n(value_n_);
		}

		get audio_source(): cc.AudioSource | null {
			return this._audio_source;
		}

		set audio_source(value_) {
			this._set_audio_source(value_);
		}

		/* --------------- private --------------- */
		/** 音量 */
		private _volume_n = 1;
		/** 循环 */
		private _loop_b = false;
		/** 当前时间 */
		private _curr_time_s_n = 0;
		/** 音频组件 */
		private _audio_source: cc.AudioSource | null = null;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		update_volume(): void {
			// 更新音量
			this.volume_n = this._volume_n;
		}

		/** 克隆 */
		protected _clone(): mk_audio_common_._unit {
			const new_audio = new _unit();

			new_audio.clip = this.clip;
			new_audio.type = this.type;
			new_audio.use_play_b = this.use_play_b;
			new_audio._volume_n = this._volume_n;
			new_audio._loop_b = this._loop_b;
			new_audio._init_b = this._init_b;
			this.group_ns.forEach((v_n) => {
				mk_audio_common._instance.get_group(v_n).add_audio(new_audio);
			});

			return new_audio;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _set_init_b(value_b_: boolean): void {
			this._init_b = value_b_;

			// 初始化完成
			if (value_b_) {
				this._event?.emit(this._event.key.init);
			}
		}

		private _set_volume_n(value_n_: number): void {
			// 参数安检
			if (value_n_ < 0) {
				value_n_ = 0;
			}

			this._volume_n = value_n_;

			// 初始化检查
			if (!this.init_b) {
				return;
			}

			// 更新真实音量
			this.real_volume_n = this.group_ns.reduce(
				(pre_n, curr_n) => pre_n * mk_audio_common._instance.get_group(curr_n).volume_n,
				this._volume_n
			);

			// 设置音量
			if (this.audio_source) {
				this.audio_source.volume = this.real_volume_n;
			}
		}

		private _set_loop_b(value_b_: boolean): void {
			this._loop_b = value_b_;
			if (!this.audio_source) {
				return;
			}

			this.audio_source.loop = value_b_;
		}

		private _get_total_time_s_n(): number {
			if (!this.audio_source) {
				return 0;
			}

			return this.audio_source.duration;
		}

		private _get_curr_time_s_n(): number {
			if (this.audio_source) {
				this._curr_time_s_n = this.audio_source.currentTime;
			}

			return this._curr_time_s_n;
		}

		private _set_curr_time_s_n(value_n_: number): void {
			this._curr_time_s_n = value_n_;

			if (!this.audio_source) {
				return;
			}

			this.audio_source.currentTime = this._curr_time_s_n;
		}

		private _set_audio_source(value_: cc.AudioSource | null): void {
			this._audio_source = value_;

			// 更新组件数据
			if (value_) {
				this.volume_n = this._volume_n;
				this.loop_b = this._loop_b;
				this.curr_time_s_n = this._curr_time_s_n;
			}
		}
	}

	export const unit = _unit;
}

export default mk_audio_common;
