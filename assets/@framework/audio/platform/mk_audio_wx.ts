import * as cc from "cc";
import mk_logger from "../../mk_logger";
import mk_audio_base, { mk_audio_base_ } from "../mk_audio_base";

const { ccclass } = cc._decorator;

/** 微信音频 */
class mk_audio_wx extends mk_audio_base {
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new mk_logger("audio_wx");
	/* ------------------------------- 功能 ------------------------------- */
	play(audio_: mk_audio_wx_._unit, config_?: Partial<mk_audio_base_.play_config>): boolean {
		// 安检
		if (!super.play(audio_, config_) || !audio_.clip) {
			return false;
		}

		if (audio_.state === mk_audio_base_.state.play) {
			// 等待播放
			if (audio_.wait_play_n !== -1) {
				++audio_.wait_play_n;

				return true;
			}

			audio_.context.play();
		}
		// 恢复播放
		else if (audio_.state === mk_audio_base_.state.pause) {
			audio_.context.play();
			audio_._event?.emit(audio_._event?.key.resume);
		}
		// 播放
		else {
			audio_.context.src = audio_.clip.nativeUrl;
			audio_.play_finish_f = this._event_audio_ended.bind(this, audio_);
			audio_.context.onEnded(audio_.play_finish_f);
			audio_.context.play();
			audio_._event?.emit(audio_._event?.key.play);
		}

		// 更新状态
		audio_.state = mk_audio_base_.state.play;

		return true;
	}

	pause(audio_: mk_audio_wx_._unit): void {
		if (audio_.state === mk_audio_base_.state.pause || audio_.state === mk_audio_base_.state.stop) {
			return;
		}

		const pause_time_n = audio_.context.currentTime;

		audio_.context.pause();
		audio_.context.seek(pause_time_n);
		audio_.state = mk_audio_base_.state.pause;
		audio_._event?.emit(audio_._event?.key.pause);
	}

	stop(audio_: mk_audio_wx_._unit): void {
		if (audio_.state === mk_audio_base_.state.stop) {
			return;
		}

		audio_.context.pause();
		audio_.state = mk_audio_base_.state.stop;
		audio_._event?.emit(audio_._event?.key.stop);
	}

	_add(audio_: mk_audio_wx_._unit, group_ns_?: number[]): boolean {
		const result_b = super._add(audio_, group_ns_);

		// 初始化完成
		audio_.init_b = true;

		return result_b;
	}

	protected _get_audio_unit<T extends mk_audio_base_._unit>(init_?: Partial<mk_audio_wx_._unit>): T {
		return new mk_audio_wx_._unit(init_) as any;
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	/** 播放完成 */
	private _event_audio_ended(audio_: mk_audio_wx_._unit): void {
		// 更新状态
		{
			audio_.state = mk_audio_base_.state.stop;
			audio_.play_finish_f = null;
		}

		// 事件通知
		audio_._event?.emit(audio_._event?.key.end);

		// 继续播放
		if (audio_.wait_play_n > 0) {
			this.play(audio_);
			--audio_.wait_play_n;
		}
	}
}

export namespace mk_audio_wx_ {
	@ccclass("mk_audio_wx/unit")
	export class _unit extends mk_audio_base_._unit {
		constructor(init_?: Partial<_unit>) {
			super(init_);
			Object.assign(this, init_);
		}

		/* --------------- public --------------- */
		/** 音频上下文 */
		context = wx.createInnerAudioContext();
		/** 播放完成回调 */
		play_finish_f?: (() => void) | null;

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

		set volume_n(value_n_: number) {
			this._set_volume_n(value_n_);
		}

		get loop_b(): boolean {
			return this._loop_b;
		}

		set loop_b(value_b_) {
			this.context.loop = this._loop_b = value_b_;
		}

		get total_time_s_n(): number {
			return this.context.duration;
		}

		get curr_time_s_n(): number {
			return this.context.currentTime;
		}

		set curr_time_s_n(value_n_) {
			this.context.currentTime = value_n_;
		}

		/* --------------- private --------------- */
		/** 音量 */
		private _volume_n = 1;
		/** 循环 */
		private _loop_b = false;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		update_volume(): void {
			// 更新音量
			this.volume_n = this._volume_n;
		}

		/** 克隆 */
		protected _clone(): mk_audio_wx_._unit {
			const new_audio = new _unit();

			new_audio.clip = this.clip;
			new_audio.type = this.type;
			new_audio._volume_n = this._volume_n;
			new_audio._loop_b = this._loop_b;
			new_audio._init_b = this._init_b;
			this.group_ns.forEach((v_n) => {
				mk_audio_wx.instance().get_group(v_n).add_audio(new_audio);
			});

			return new_audio;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _set_init_b(value_b_: boolean): void {
			this._init_b = value_b_;
			this.volume_n = this._volume_n;
			this.loop_b = this._loop_b;
			// 初始化完成
			if (value_b_) {
				this._event?.emit(this._event.key.init);
			}
		}

		private _set_volume_n(value_n_: number): void {
			// 参数安检
			{
				if (value_n_ > 1) {
					value_n_ = 1;
				}

				if (value_n_ < 0) {
					value_n_ = 0;
				}
			}

			// 设置音量
			{
				this._volume_n = value_n_;

				// 初始化检查
				if (!this.init_b) {
					return;
				}

				// 更新真实音量
				this.real_volume_n = this.group_ns.reduce(
					(pre_n, curr_n) => pre_n * mk_audio_wx.instance().get_group(curr_n).volume_n,
					this._volume_n
				);

				// 更新音量
				this.context.volume = this.real_volume_n;
			}
		}
	}

	export const unit = _unit;
}

export default mk_audio_wx.instance();
