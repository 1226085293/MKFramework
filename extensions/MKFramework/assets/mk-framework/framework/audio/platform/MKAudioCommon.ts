import { EDITOR } from "cc/env";
import * as cc from "cc";
import mk_logger from "../../MKLogger";
import MKAudioBase, { MKAudioBase_ } from "../MKAudioBase";
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
class MKAudioCommon extends MKAudioBase {
	constructor() {
		super();
		MKAudioCommon._instance = this;
		this._constructor();
	}

	/* --------------- static --------------- */
	/** @internal */
	static _instance: MKAudioCommon;
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new mk_logger("audio_common");
	/* --------------- private --------------- */
	/** 音频常驻节点 */
	private _audio_node!: cc.Node;
	/** 音频 uuid 索引表 */
	private _audio_unit_map = new Map<string, MKAudioCommon_.PrivateUnit>();
	/** 当前播放数量 */
	private _curr_play_n = 0;
	/** AudioSource 对象池 */
	private _audio_source_pool!: mk_obj_pool.sync<cc.AudioSource>;
	/** 倒计时集合 */
	private _timer_set = new Set<any>();
	/* ------------------------------- 功能 ------------------------------- */
	play(audio_: MKAudioBase_.Unit, config_?: Partial<MKAudioBase_.PlayConfig>): boolean {
		const audio = audio_ as MKAudioCommon_.PrivateUnit;

		// 安检
		if (!super.play(audio, config_)) {
			return false;
		}

		if (audio.state === MKAudioBase_.State.Play) {
			// 等待播放
			if (audio.waitPlayNum !== -1) {
				++audio.waitPlayNum;

				return true;
			}

			// 正常播放
			this._play(audio);
		} else {
			this._play(audio);
		}

		return true;
	}

	pause(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_.isInit || audio_.state === MKAudioBase_.State.Pause || audio_.state === MKAudioBase_.State.Stop) {
			return;
		}

		audio_.audioSource!.pause();
		audio_.state = MKAudioBase_.State.Pause;
		audio_._event?.emit(audio_._event?.key.pause);
	}

	stop(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_.isInit || audio_.state === MKAudioBase_.State.Stop) {
			return;
		}

		--this._curr_play_n;
		this._log.debug("当前播放数量", this._curr_play_n, "结束");
		audio_.state = MKAudioBase_.State.Stop;
		audio_.audioSource!.stop();
		audio_._event?.emit(audio_._event?.key.stop);
		// 回收 AudioSource
		this._audio_source_pool.put(audio_.audioSource!);
		audio_.audioSource = null;
		// 重置进度
		audio_.currTimeSNum = 0;
	}

	_add(audio_: MKAudioCommon_.PrivateUnit, group_ns_?: number[]): boolean {
		if (!super._add(audio_, group_ns_)) {
			return false;
		}

		// 初始化完成
		audio_.isInit = true;

		return true;
	}

	protected _getAudioUnit<T extends MKAudioBase_.PrivateUnit>(init_?: Partial<MKAudioCommon_.PrivateUnit>): T {
		return new MKAudioCommon_.PrivateUnit(init_) as any;
	}

	private _play(audio_: MKAudioCommon_.PrivateUnit): void {
		/** 上次状态 */
		const last_state = audio_.state;

		// 恢复播放
		if (audio_.state === MKAudioBase_.State.Pause) {
			audio_._event?.emit(audio_._event?.key.resume);
		}

		// 更新状态
		audio_.state = MKAudioBase_.State.Play;

		// 更新播放计数
		if (last_state === MKAudioBase_.State.Stop) {
			++this._curr_play_n;

			// 请求 AudioSource
			audio_.audioSource = this._audio_source_pool.get();
			audio_.audioSource.clip = audio_.clip;

			// 添加音频 uuid 索引表
			this._audio_unit_map.set(audio_.audioSource.uuid, audio_);
		}

		// 若超出 maxAudioChannel 继续播放则会停止之前播放的音频，故退出
		if (last_state === MKAudioBase_.State.Stop && this._curr_play_n > cc.AudioSource.maxAudioChannel) {
			this._log.warn("音频数量超出 maxAudioChannel, 停止当前音频播放");
			this.stop(audio_);

			return;
		}

		// 播放音频
		audio_.audioSource!.play();

		if (last_state === MKAudioBase_.State.Stop) {
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
	private _node_audio_started(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_) {
			return;
		}

		audio_._event?.emit(audio_._event?.key.play);
	}

	/** 播放结束回调 */
	private _node_audio_ended(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_) {
			return;
		}

		// 若为 stop 状态则表明已经手动停止
		if (audio_.state !== MKAudioBase_.State.Stop) {
			--this._curr_play_n;
			this._log.debug("当前播放数量", this._curr_play_n, "结束");
			// 更新播放数据
			audio_.state = MKAudioBase_.State.Stop;
			audio_._event?.emit(audio_._event?.key.end);
			// 回收 AudioSource
			this._audio_source_pool.put(audio_.audioSource!);
			audio_.audioSource = null;
			// 重置进度
			audio_.currTimeSNum = 0;
		}

		// 继续播放
		if (audio_.waitPlayNum > 0) {
			this.play(audio_);
			--audio_.waitPlayNum;
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	protected _eventRestart(): void {
		super._eventRestart();
		this._timer_set.forEach((v) => clearTimeout(v));
		this._timer_set.clear();
	}
}

export namespace MKAudioCommon_ {
	@ccclass("mk_audio_common/unit")
	export class PrivateUnit extends MKAudioBase_.PrivateUnit {
		constructor(init_?: Partial<PrivateUnit>) {
			super(init_);
			Object.assign(this, init_);
		}

		/* --------------- public --------------- */
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

		set volumeNum(valueNum_) {
			this._setVolumeNum(valueNum_);
		}

		get isLoop(): boolean {
			return this._isLoop;
		}

		set isLoop(value_) {
			this._setIsLoop(value_);
		}

		get totalTimeSNum(): number {
			return this._getTotalTimeSNum();
		}

		get currTimeSNum(): number {
			return this._getCurrTimeSNum();
		}

		set currTimeSNum(value_) {
			this._setCurrTimeSNum(value_);
		}

		get audioSource(): cc.AudioSource | null {
			return this._audioSource;
		}

		set audioSource(value_) {
			this._setAudioSource(value_);
		}

		/* --------------- private --------------- */
		/** 音量 */
		private _volumeNum = 1;
		/** 循环 */
		private _isLoop = false;
		/** 当前时间 */
		private _currTimeSNum = 0;
		/** 音频组件 */
		private _audioSource: cc.AudioSource | null = null;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		updateVolume(): void {
			// 更新音量
			this.volumeNum = this._volumeNum;
		}

		/** 克隆 */
		protected _clone(): MKAudioCommon_.PrivateUnit {
			const newAudio = new PrivateUnit();

			newAudio.clip = this.clip;
			newAudio.type = this.type;
			newAudio._volumeNum = this._volumeNum;
			newAudio._isLoop = this._isLoop;
			newAudio._isInit = this._isInit;
			this.groupNumList.forEach((vNum) => {
				MKAudioCommon._instance.getGroup(vNum).add_audio(newAudio);
			});

			return newAudio;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _setIsInit(value_: boolean): void {
			this._isInit = value_;

			// 初始化完成
			if (value_) {
				this._event?.emit(this._event.key.init);
			}
		}

		private _setVolumeNum(value_: number): void {
			// 参数安检
			if (value_ < 0) {
				value_ = 0;
			}

			this._volumeNum = value_;

			// 初始化检查
			if (!this.isInit) {
				return;
			}

			// 更新真实音量
			this.realVolumeNum = this.groupNumList.reduce(
				(preNum, currNum) => preNum * MKAudioCommon._instance.getGroup(currNum).volumeNum,
				this._volumeNum
			);

			// 设置音量
			if (this.audioSource) {
				this.audioSource.volume = this.realVolumeNum;
			}
		}

		private _setIsLoop(value_: boolean): void {
			this._isLoop = value_;
			if (!this.audioSource) {
				return;
			}

			this.audioSource.loop = value_;
		}

		private _getTotalTimeSNum(): number {
			if (!this.audioSource) {
				return 0;
			}

			return this.audioSource.duration;
		}

		private _getCurrTimeSNum(): number {
			if (this.audioSource) {
				this._currTimeSNum = this.audioSource.currentTime;
			}

			return this._currTimeSNum;
		}

		private _setCurrTimeSNum(valueNum_: number): void {
			this._currTimeSNum = valueNum_;

			if (!this.audioSource) {
				return;
			}

			this.audioSource.currentTime = this._currTimeSNum;
		}

		private _setAudioSource(value_: cc.AudioSource | null): void {
			this._audioSource = value_;

			// 更新组件数据
			if (value_) {
				this.volumeNum = this._volumeNum;
				this.isLoop = this._isLoop;
				this.currTimeSNum = this._currTimeSNum;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Unit = PrivateUnit;
}

export default MKAudioCommon;
