import { EDITOR } from "cc/env";
import MKLogger from "../../MKLogger";
import MKAudioBase, { MKAudioBase_ } from "../MKAudioBase";
import MKObjectPool from "../../MKObjectPool";
import { _decorator, AudioSource, director, Director, Node } from "cc";
import MKRelease from "../../Resources/MKRelease";

const { ccclass } = _decorator;

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
	// eslint-disable-next-line @typescript-eslint/naming-convention
	static _instance: MKAudioCommon;
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new MKLogger("MKAudioCommon");
	/* --------------- private --------------- */
	/** 音频常驻节点 */
	private _audioNode!: Node;
	/** 音频 uuid 索引表 */
	private _audioUnitMap = new Map<string, MKAudioCommon_.PrivateUnit>();
	/** 当前播放数量 */
	private _currentPlayNum = 0;
	/** AudioSource 对象池 */
	private _audioSourcePool!: MKObjectPool.Sync<AudioSource>;
	/** 倒计时集合 */
	private _timerSet = new Set<any>();
	/* ------------------------------- 功能 ------------------------------- */
	async play(audio_: MKAudioBase_.Unit | string, config_?: Partial<MKAudioBase_.PlayConfig>): Promise<MKAudioCommon_.PrivateUnit | null> {
		const audio = (await super.play(audio_, config_)) as MKAudioCommon_.PrivateUnit;

		// 安检
		if (!audio) {
			return null;
		}

		if (audio.state === MKAudioBase_.State.Play) {
			// 等待播放
			if (audio.waitPlayNum !== -1) {
				++audio.waitPlayNum;

				return audio;
			}

			// 正常播放
			this._play(audio);
		} else {
			this._play(audio);
		}

		return audio;
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

		--this._currentPlayNum;
		this._log.debug("当前播放数量", this._currentPlayNum, "结束");
		audio_.state = MKAudioBase_.State.Stop;
		audio_.audioSource!.stop();
		audio_._event?.emit(audio_._event?.key.stop);
		// 回收 AudioSource
		this._audioSourcePool.put(audio_.audioSource!);
		audio_.audioSource = null;
		// 重置进度
		audio_.currentTimeSNum = 0;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	_add(audio_: MKAudioCommon_.PrivateUnit, groupIdNumList_?: number[]): boolean {
		if (!super._add(audio_, groupIdNumList_)) {
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
		const lastState = audio_.state;

		// 恢复播放
		if (audio_.state === MKAudioBase_.State.Pause) {
			audio_._event?.emit(audio_._event?.key.resume);
		}

		// 更新状态
		audio_.state = MKAudioBase_.State.Play;

		// 更新播放计数
		if (lastState === MKAudioBase_.State.Stop) {
			++this._currentPlayNum;

			// 请求 AudioSource
			audio_.audioSource = this._audioSourcePool.get();
			audio_.audioSource.clip = audio_.clip;

			// 添加音频 uuid 索引表
			this._audioUnitMap.set(audio_.audioSource.uuid, audio_);
		}

		// 若超出 maxAudioChannel 继续播放则会停止之前播放的音频，故退出
		if (lastState === MKAudioBase_.State.Stop && this._currentPlayNum > AudioSource.maxAudioChannel) {
			this._log.warn("音频数量超出 maxAudioChannel, 停止当前音频播放");
			this.stop(audio_);

			return;
		}

		// 播放音频
		audio_.audioSource!.play();

		if (lastState === MKAudioBase_.State.Stop) {
			this._log.debug("当前播放数量", this._currentPlayNum, "播放", audio_.clip!.name);
		}
	}

	/** 构造 */
	private async _constructor(): Promise<void> {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			return;
		}

		// 添加常驻节点
		{
			let scene = director.getScene();

			if (!scene) {
				await new Promise<void>((resolveFunc) => {
					director.once(Director.EVENT_AFTER_SCENE_LAUNCH, resolveFunc);
				});

				scene = director.getScene()!;
			}

			this._audioNode?.destroy();
			this._audioNode = new Node("audio");
			scene.addChild(this._audioNode);
			director.addPersistRootNode(this._audioNode);
		}

		// 节点池
		this._audioSourcePool?.clear();
		this._audioSourcePool = new MKObjectPool.Sync({
			clearFunc: (value) => {
				value.forEach((v) => {
					v.destroy();
				});
			},
			createFunc: () => {
				const audioSource = new AudioSource();

				audioSource.node = this._audioNode;

				return audioSource;
			},
			resetFunc: (value) => {
				// 自动播放
				value.playOnAwake = false;
				// 更新音频 uuid 索引表
				this._audioUnitMap.delete(value.uuid);

				return value;
			},
			initFillNum: Math.floor(AudioSource.maxAudioChannel * 0.5),
			maxHoldNum: AudioSource.maxAudioChannel,
		});

		// 添加回调
		{
			this._audioNode.on(
				AudioSource.EventType.STARTED,
				(audioComp: AudioSource) => {
					const audio = this._audioUnitMap.get(audioComp.uuid);

					if (audio) {
						this._nodeAudioStarted(audio);
					}
				},
				this
			);

			this._audioNode.on(
				AudioSource.EventType.ENDED,
				(audioComp: AudioSource) => {
					const audio = this._audioUnitMap.get(audioComp.uuid);

					if (audio) {
						this._nodeAudioEnded(audio);
					}
				},
				this
			);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	/** 播放开始回调 */
	private _nodeAudioStarted(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_) {
			return;
		}

		audio_._event?.emit(audio_._event?.key.play);
	}

	/** 播放结束回调 */
	private _nodeAudioEnded(audio_: MKAudioCommon_.PrivateUnit): void {
		if (!audio_) {
			return;
		}

		// 若为 stop 状态则表明已经手动停止
		if (audio_.state !== MKAudioBase_.State.Stop) {
			--this._currentPlayNum;
			this._log.debug("当前播放数量", this._currentPlayNum, "结束");
			// 更新播放数据
			audio_.state = MKAudioBase_.State.Stop;
			audio_._event?.emit(audio_._event?.key.end);
			// 回收 AudioSource
			this._audioSourcePool.put(audio_.audioSource!);
			audio_.audioSource = null;
			// 重置进度
			audio_.currentTimeSNum = 0;
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
		this._timerSet.forEach((v) => clearTimeout(v));
		this._timerSet.clear();
	}
}

export namespace MKAudioCommon_ {
	@ccclass("MKAudioCommon/Unit")
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

		get currentTimeSNum(): number {
			return this._getCurrTimeSNum();
		}

		set currentTimeSNum(value_) {
			this._setCurrTimeSNum(value_);
		}

		get audioSource(): AudioSource | null {
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
		private _currentTimeSNum = 0;
		/** 音频组件 */
		private _audioSource: AudioSource | null = null;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		updateVolume(): void {
			// 更新音量
			this.volumeNum = this._volumeNum;
		}

		release(): void {
			// 删除音频组内的音频单元
			{
				MKAudioCommon._instance.getGroup(this.type).delAudio(this);
				this.groupIdNumList.forEach((v2Num) => {
					MKAudioCommon._instance.getGroup(v2Num).delAudio(this);
				});
			}

			// 清理音频资源
			if (this.clip) {
				MKRelease.release(this.clip);
			}
		}

		/** 克隆 */
		protected _clone(): MKAudioCommon_.PrivateUnit {
			const newAudio = new PrivateUnit();

			newAudio.clip = this.clip;
			newAudio.type = this.type;
			newAudio._volumeNum = this._volumeNum;
			newAudio._isLoop = this._isLoop;
			newAudio._isInit = this._isInit;
			this.groupIdNumList.forEach((vNum) => {
				MKAudioCommon._instance.getGroup(vNum).addAudio(newAudio);
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
			this.realVolumeNum = this.groupIdNumList.reduce(
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
				this._currentTimeSNum = this.audioSource.currentTime;
			}

			return this._currentTimeSNum;
		}

		private _setCurrTimeSNum(valueNum_: number): void {
			this._currentTimeSNum = valueNum_;

			if (!this.audioSource) {
				return;
			}

			this.audioSource.currentTime = this._currentTimeSNum;
		}

		private _setAudioSource(value_: AudioSource | null): void {
			this._audioSource = value_;

			// 更新组件数据
			if (value_) {
				this.volumeNum = this._volumeNum;
				this.isLoop = this._isLoop;
				this.currentTimeSNum = this._currentTimeSNum;
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Unit = PrivateUnit;
}

export default MKAudioCommon;
