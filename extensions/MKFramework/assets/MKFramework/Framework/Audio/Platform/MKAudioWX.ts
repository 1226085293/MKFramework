import * as cc from "cc";
import MKLogger from "../../MKLogger";
import MKAudioBase, { MKAudioBase_ } from "../MKAudioBase";

const { ccclass } = cc._decorator;

/**
 * 微信音频
 * @noInheritDoc
 */
class MKAudioWX extends MKAudioBase {
	constructor() {
		super();
		MKAudioWX._instance = this;
	}

	/* --------------- static --------------- */
	/** @internal */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static _instance: MKAudioWX;
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new MKLogger("MKAudioWX");
	/* ------------------------------- 功能 ------------------------------- */
	play(audio_: MKAudioWX_.PrivateUnit, config_?: Partial<MKAudioBase_.PlayConfig>): boolean {
		// 安检
		if (!super.play(audio_, config_) || !audio_.clip) {
			return false;
		}

		if (audio_.state === MKAudioBase_.State.Play) {
			// 等待播放
			if (audio_.waitPlayNum !== -1) {
				++audio_.waitPlayNum;

				return true;
			}

			audio_.context.play();
		}
		// 恢复播放
		else if (audio_.state === MKAudioBase_.State.Pause) {
			audio_.context.play();
			audio_._event?.emit(audio_._event?.key.resume);
		}
		// 播放
		else {
			audio_.context.src = audio_.clip.nativeUrl;
			audio_.playFinishFunc = this._onAudioEnded.bind(this, audio_);
			audio_.context.onEnded(audio_.playFinishFunc);
			audio_.context.play();
			audio_._event?.emit(audio_._event?.key.play);
		}

		// 更新状态
		audio_.state = MKAudioBase_.State.Play;

		return true;
	}

	pause(audio_: MKAudioWX_.PrivateUnit): void {
		if (audio_.state === MKAudioBase_.State.Pause || audio_.state === MKAudioBase_.State.Stop) {
			return;
		}

		const pauseTimeNum = audio_.context.currentTime;

		audio_.context.pause();
		audio_.context.seek(pauseTimeNum);
		audio_.state = MKAudioBase_.State.Pause;
		audio_._event?.emit(audio_._event?.key.pause);
	}

	stop(audio_: MKAudioWX_.PrivateUnit): void {
		if (audio_.state === MKAudioBase_.State.Stop) {
			return;
		}

		audio_.context.pause();
		audio_.state = MKAudioBase_.State.Stop;
		audio_._event?.emit(audio_._event?.key.stop);
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	_add(audio_: MKAudioWX_.PrivateUnit, groupNumList_?: number[]): boolean {
		const isResult = super._add(audio_, groupNumList_);

		// 初始化完成
		audio_.isInit = true;

		return isResult;
	}

	protected _getAudioUnit<T extends MKAudioBase_.PrivateUnit>(init_?: Partial<MKAudioWX_.PrivateUnit>): T {
		return new MKAudioWX_.PrivateUnit(init_) as any;
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	/** 播放完成 */
	private _onAudioEnded(audio_: MKAudioWX_.PrivateUnit): void {
		// 更新状态
		audio_.state = MKAudioBase_.State.Stop;
		audio_.playFinishFunc = null;

		// 事件通知
		audio_._event?.emit(audio_._event?.key.end);

		// 继续播放
		if (audio_.waitPlayNum > 0) {
			this.play(audio_);
			--audio_.waitPlayNum;
		}
	}
}

export namespace MKAudioWX_ {
	@ccclass("MKAudioWX/Unit")
	export class PrivateUnit extends MKAudioBase_.PrivateUnit {
		constructor(init_?: Partial<PrivateUnit>) {
			super(init_);
			Object.assign(this, init_);
		}

		/* --------------- public --------------- */
		/** 音频上下文 */
		context = wx.createInnerAudioContext();
		/** 播放完成回调 */
		playFinishFunc?: (() => void) | null;

		/** 初始化状态 */
		get isInit(): boolean {
			return this._isInit;
		}

		set isInit(value_: boolean) {
			this._setIsInit(value_);
		}

		get volumeNum(): number {
			return this._volumeNum;
		}

		set volumeNum(valueNum_: number) {
			this._setVolumeNum(valueNum_);
		}

		get isLoop(): boolean {
			return this._isLoop;
		}

		set isLoop(value_) {
			this.context.loop = this._isLoop = value_;
		}

		get totalTimeSNum(): number {
			return this.context.duration;
		}

		get currTimeSNum(): number {
			return this.context.currentTime;
		}

		set currTimeSNum(valueNum_) {
			this.context.currentTime = valueNum_;
		}

		/* --------------- private --------------- */
		/** 音量 */
		private _volumeNum = 1;
		/** 循环 */
		private _isLoop = false;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		updateVolume(): void {
			// 更新音量
			this.volumeNum = this._volumeNum;
		}

		/** 克隆 */
		protected _clone(): MKAudioWX_.PrivateUnit {
			const newAudio = new PrivateUnit();

			newAudio.clip = this.clip;
			newAudio.type = this.type;
			newAudio._volumeNum = this._volumeNum;
			newAudio._isLoop = this._isLoop;
			newAudio._isInit = this._isInit;
			this.groupNumList.forEach((vNum) => {
				MKAudioWX._instance.getGroup(vNum).addAudio(newAudio);
			});

			return newAudio;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _setIsInit(value_: boolean): void {
			this._isInit = value_;
			this.volumeNum = this._volumeNum;
			this.isLoop = this._isLoop;
			// 初始化完成
			if (value_) {
				this._event?.emit(this._event.key.init);
			}
		}

		private _setVolumeNum(valueNum_: number): void {
			// 参数安检
			{
				if (valueNum_ > 1) {
					valueNum_ = 1;
				}

				if (valueNum_ < 0) {
					valueNum_ = 0;
				}
			}

			// 设置音量
			{
				this._volumeNum = valueNum_;

				// 初始化检查
				if (!this.isInit) {
					return;
				}

				// 更新真实音量
				this.realVolumeNum = this.groupNumList.reduce(
					(preNum, currNum) => preNum * MKAudioWX._instance.getGroup(currNum).volumeNum,
					this._volumeNum
				);

				// 更新音量
				this.context.volume = this.realVolumeNum;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Unit = PrivateUnit;
}

export default MKAudioWX;
