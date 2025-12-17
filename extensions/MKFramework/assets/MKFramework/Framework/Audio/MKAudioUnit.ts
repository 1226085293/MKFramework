// eslint-disable-next-line unused-imports/no-unused-imports
import { AudioSource, AudioClip, Enum, _decorator } from "cc";
import GlobalConfig from "../../Config/GlobalConfig";
import MKEventTarget from "../MKEventTarget";
import MKRelease, { MKRelease_ } from "../Resources/MKRelease";
import mkDynamicModule from "../MKDynamicModule";
const mkAudio = mkDynamicModule.default(import("./MKAudio"));
const { ccclass, property } = _decorator;

/**
 * 音频单元
 * @internal
 */
@ccclass("MKAudioCommon/Unit")
class MKAudioUnit implements MKRelease_.TypeReleaseObject {
	constructor(init_?: Partial<MKAudioUnit>) {
		Object.assign(this, init_);
	}
	/* --------------- 属性 --------------- */
	/** 音频资源 */
	@property({ displayName: "音频资源", type: AudioClip ?? null })
	clip: AudioClip | null = null;

	/** 音频类型 */
	@property({
		displayName: "音频类型",
		type: Enum(GlobalConfig.Audio.Type),
	})
	type = GlobalConfig.Audio.Type.Effect;

	/* --------------- public --------------- */
	/** 事件对象 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_event?: MKEventTarget<MKAudioUnit_.EventProtocol>;
	/**
	 * 跟随释放对象
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_followReleaseTarget: MKRelease_.TypeFollowReleaseSupport = null!;
	/** 分组 */
	groupIdNumList: number[] = [];
	/** 播放状态 */
	state = MKAudioUnit_.State.Stop;
	/**
	 * 等待播放次数
	 * @remarks
	 * -1：关闭，0-n：等待播放次数
	 */
	waitPlayNum = -1;
	/** 真实音量 */
	realVolumeNum = 0;

	/** 初始化状态 */
	get isInit(): boolean {
		return this._isInit;
	}

	set isInit(value_) {
		this._setIsInit(value_);
	}

	/** 音量 */
	get volumeNum(): number {
		return this._volumeNum;
	}

	set volumeNum(valueNum_) {
		this._setVolumeNum(valueNum_);
	}

	/** 循环 */
	get isLoop(): boolean {
		return this._isLoop;
	}

	set isLoop(value_) {
		this._setIsLoop(value_);
	}

	/** 总时长（秒） */
	get totalTimeSNum(): number {
		return this._getTotalTimeSNum();
	}

	/** 当前时间（秒） */
	get currentTimeSNum(): number {
		return this._getCurrTimeSNum();
	}

	set currentTimeSNum(valueNum_) {
		this._setCurrTimeSNum(valueNum_);
	}

	/** 事件对象 */
	get event(): MKEventTarget<MKAudioUnit_.EventProtocol> {
		return this._event ?? (this._event = new MKEventTarget<MKAudioUnit_.EventProtocol>());
	}

	/** 等待播放开关 */
	get isWaitPlay(): boolean {
		return this.waitPlayNum !== -1;
	}

	set isWaitPlay(value_) {
		this.waitPlayNum = value_ ? 0 : -1;
	}

	/**
	 * 音频组件
	 * @remarks
	 * 通用音频系统使用
	 */
	get audioSource(): AudioSource | null {
		return this._audioSource;
	}

	set audioSource(value_) {
		this._setAudioSource(value_);
	}

	/* --------------- protected --------------- */
	/** 初始化状态 */
	protected _isInit = false;
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

	/** 克隆 */
	clone(): MKAudioUnit;
	/**
	 * 克隆
	 * @param valueNum_ 克隆数量
	 */
	clone(valueNum_: number): MKAudioUnit[];
	clone(valueNum_?: number): MKAudioUnit | MKAudioUnit[] {
		if (valueNum_ === undefined) {
			return this._clone();
		}

		const audioList: MKAudioUnit[] = [];

		// 克隆数组
		for (let kNum = 0, lenNum = valueNum_; kNum < lenNum; ++kNum) {
			audioList.push(this._clone());
		}

		return audioList;
	}

	release(): void {
		// 删除音频组内的音频单元
		{
			mkAudio.getGroup(this.type).delAudio(this);
			this.groupIdNumList.forEach((v2Num) => {
				mkAudio.getGroup(v2Num).delAudio(this);
			});
		}

		// 清理音频资源
		if (this.clip) {
			MKRelease.release(this.clip);
		}
	}

	/** 克隆 */
	private _clone(): MKAudioUnit {
		const newAudio = new MKAudioUnit();

		newAudio.clip = this.clip;
		newAudio.type = this.type;
		newAudio._volumeNum = this._volumeNum;
		newAudio._isLoop = this._isLoop;
		newAudio._isInit = this._isInit;
		this.groupIdNumList.forEach((vNum) => {
			mkAudio.getGroup(vNum).addAudio(newAudio);
		});

		// 更新引用和跟随释放
		newAudio.clip!.addRef();
		newAudio._followReleaseTarget = this._followReleaseTarget;
		MKRelease.followRelease(newAudio._followReleaseTarget, newAudio);

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
		this.realVolumeNum = this.groupIdNumList.reduce((preNum, currNum) => preNum * mkAudio.getGroup(currNum).volumeNum, this._volumeNum);

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

export namespace MKAudioUnit_ {
	/** 音频状态 */
	export enum State {
		/** 停止 */
		Stop = 1,
		/** 暂停 */
		Pause = 2,
		/** 播放 */
		Play = 4,
	}

	/** 事件协议 */
	export interface EventProtocol {
		/** 初始化 */
		init(): void;
		/** 播放 */
		play(): void;
		/** 暂停 */
		pause(): void;
		/** 恢复 */
		resume(): void;
		/** 中止 */
		stop(): void;
		/** 结束 */
		end(): void;
	}

	/** 安全音频单元 */
	export interface MKAudioUnitSafe extends MKRelease_.TypeReleaseObject {
		/** 分组 */
		readonly groupIdNumList: ReadonlyArray<number>;
		/** 播放状态 */
		readonly state: State;
		/**
		 * 等待播放次数
		 * @remarks
		 * 0-n：等待播放次数
		 */
		readonly waitPlayNum: number;
		/** 总时长（秒） */
		readonly totalTimeSNum: number;
		/** 事件对象 */
		readonly event: MKEventTarget<EventProtocol>;
		/** 音频类型 */
		readonly type: number;
		/** 真实音量 */
		readonly realVolumeNum: number;
		/**
		 * 音频组件
		 * @remarks
		 * 通用音频系统使用
		 */
		readonly audioSource: AudioSource | null;
		/** 音频资源 */
		clip: AudioClip | null;
		/** 音量 */
		volumeNum: number;
		/** 循环 */
		isLoop: boolean;
		/** 当前时间（秒） */
		currentTimeSNum: number;
		/** 等待播放开关 */
		isWaitPlay?: boolean;
		/* ------------------------------- 功能 ------------------------------- */
		/** 克隆 */
		clone<T extends this>(): T;
		/**
		 * 克隆
		 * @param valueNum_ 克隆数量
		 */
		clone<T extends this>(valueNum_: number): T[];

		/**
		 * 更新音量
		 * @internal
		 */
		updateVolume(): void;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const MKAudioUnitSafe = MKAudioUnit as any as Omit<MKAudioUnitSafe, keyof Function> & {
		new (init_?: Partial<MKAudioUnitSafe>): Omit<MKAudioUnitSafe, keyof Function>;
	};
}

export default MKAudioUnit;
