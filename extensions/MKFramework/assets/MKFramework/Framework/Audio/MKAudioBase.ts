import mkAsset, { MKAsset_ } from "../Resources/MKAsset";
import { EDITOR } from "cc/env";
import MKEventTarget from "../MKEventTarget";
import MKLogger from "../MKLogger";
import * as cc from "cc";
import GlobalEvent from "../../Config/GlobalEvent";
import mkTool from "../@Private/Tool/MKTool";
import GlobalConfig from "../../Config/GlobalConfig";
import MKRelease, { MKRelease_ } from "../MKRelease";

const { ccclass, property } = cc._decorator;

/**
 * 音频基类
 * @noInheritDoc
 */
abstract class MKAudioBase {
	constructor() {
		GlobalEvent.on(GlobalEvent.key.restart, this._eventRestart, this);
	}

	/* --------------- protected --------------- */
	/** 日志 */
	protected abstract _log: MKLogger;
	/** 音频组 */
	protected _groupMap = new Map<number, MKAudioBase_.Group>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 暂停 */
	abstract pause(audio_: MKAudioBase_.Unit): void;
	/** 停止 */
	abstract stop(audio_: MKAudioBase_.Unit): void;
	/** 获取音频实例 */
	protected abstract _getAudioUnit<T extends MKAudioBase_.PrivateUnit>(init_?: Partial<MKAudioBase_.PrivateUnit>): T;

	/**
	 * 获取音频组
	 * @param groupNum_ 组类型
	 * @returns
	 */
	getGroup(groupNum_: number): MKAudioBase_.Group {
		let result = this._groupMap.get(groupNum_);

		if (!result) {
			this._groupMap.set(groupNum_, (result = new MKAudioBase_.Group(this, groupNum_)));
		}

		return result;
	}

	/**
	 * 添加音频单元
	 * @param url_ 音频资源路径 | 音频资源路径列表
	 * @param target_ 跟随释放对象
	 * @param config_ 添加配置
	 */
	async add<T extends string | string[], T2 extends true | false = false>(
		url_: T,
		target_: MKRelease_.TypeFollowReleaseObject,
		config_?: MKAudioBase_.AddConfig<T2>
	): Promise<T2 extends true ? (MKAudioBase_.Unit | null)[] : T extends string ? MKAudioBase_.Unit | null : (MKAudioBase_.Unit | null)[]> {
		if (EDITOR) {
			return null!;
		}

		/** 路径列表 */
		let urlStrList: string[];

		// 参数转换
		if (typeof url_ === "string") {
			urlStrList = [url_];
		} else {
			urlStrList = url_;
		}

		const audioList: (MKAudioBase_.PrivateUnit | null)[] = [];
		let result: MKAudioBase_.PrivateUnit | (MKAudioBase_.PrivateUnit | null)[];

		if (config_?.isDir) {
			for (const vStr of urlStrList) {
				const assetList = await mkAsset.getDir(vStr, cc.AudioClip, null, config_.loadConfig as any);

				assetList?.forEach((v2) => {
					const audio = this._getAudioUnit({
						clip: v2,
					});

					audio.type = config_.type ?? audio.type;
					audioList.push(audio);
				});
			}

			result = audioList;
		} else {
			for (const vStr of urlStrList) {
				const asset = await mkAsset.get(vStr, cc.AudioClip, null, config_?.loadConfig);

				if (!asset) {
					audioList.push(null!);
					continue;
				}

				const audio = this._getAudioUnit({
					clip: asset,
				});

				audio.type = config_?.type ?? audio.type;
				audioList.push(audio);
			}

			result = (!Array.isArray(url_) ? audioList[0] : audioList) as any;
		}

		// 添加音频
		audioList.forEach((v) => {
			if (!v) {
				return;
			}

			this._add(v, config_?.groupNumList);
		});

		if (target_?.followRelease) {
			target_.followRelease(() => {
				audioList.forEach((v) => {
					if (!v) {
						return;
					}

					// 删除音频组内的音频单元
					{
						this.getGroup(v.type).delAudio(v);
						v.groupNumList.forEach((v2Num) => {
							this.getGroup(v2Num).delAudio(v);
						});
					}

					// 清理音频资源
					if (v.clip) {
						MKRelease.release(v.clip);
					}
				});
			});
		}

		return result as any;
	}

	/**
	 * 播放音效
	 * @param audio_ 音频单元
	 * @param config_ 播放配置
	 * @returns
	 * @remarks
	 * 使用通用音频系统时，当播放数量超过 cc.AudioSource.maxAudioChannel 时会导致播放失败
	 */
	play(audio_: MKAudioBase_.Unit, config_?: Partial<MKAudioBase_.PlayConfig>): boolean {
		const audio = audio_ as MKAudioBase_.PrivateUnit;

		// 参数安检
		if (!audio_?.clip) {
			return false;
		}

		// 初始化音频
		{
			// 更新配置
			if (config_) {
				Object.assign(audio, config_);
			}

			// 添加音频
			this._add(audio, audio.groupNumList);
		}

		if (audio.stopGroupNum !== null) {
			return false;
		}

		return true;
	}

	/** 暂停所有音频 */
	pauseAll(): void {
		this._groupMap.forEach((v) => {
			v.audioUnitList.forEach((v2) => {
				this.pause(v2);
			});
		});
	}

	/** 恢复所有音频 */
	resumeAll(): void {
		this._groupMap.forEach((v) => {
			v.audioUnitList.forEach((v2) => {
				if (v2.state === MKAudioBase_.State.Pause) {
					this.play(v2);
				}
			});
		});
	}

	/** 停止所有音频 */
	stopAll(): void {
		this._groupMap.forEach((v) => {
			v.audioUnitList.forEach((v2) => {
				this.stop(v2);
			});
		});
	}

	/**
	 * 添加音频单元
	 * @param audio_ 音频单元
	 * @param groupNumList_ 音频组
	 * @returns 成功状态
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_add(audio_: MKAudioBase_.PrivateUnit, groupNumList_?: ReadonlyArray<number>): boolean {
		// 参数安检
		if (!audio_ || audio_.isInit || !audio_.clip) {
			return false;
		}

		/** 包含类型数量 */
		const numTypesIncludedNum =
			groupNumList_?.reduce((pre, curr) => {
				return pre + (curr < 0 ? 1 : 0);
			}, 0) ?? 0;

		// 检查分组数据
		if (numTypesIncludedNum > 0) {
			this._log.error(`添加音频单元 ${audio_.clip.name} 失败，不能包含音频类型`);

			return false;
		}

		// 添加分组音频
		[audio_.type].concat(groupNumList_ ?? []).forEach((vNum) => {
			/** 组音频列表 */
			let audioGroup = this._groupMap.get(vNum);

			// 添加到音频列表
			if (!audioGroup) {
				this._groupMap.set(vNum, (audioGroup = new MKAudioBase_.Group(this, vNum)));
			}

			audioGroup.addAudio(audio_);
		});

		return true;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	protected _eventRestart(): void {
		// 停止所有音频
		this.stopAll();

		// 重置数据，音频资源释放应该由模块管理
		mkTool.object.reset(this, true);
	}
}

export namespace MKAudioBase_ {
	/** 音频状态 */
	export enum State {
		/** 停止 */
		Stop = 1,
		/** 暂停 */
		Pause = 2,
		/** 播放 */
		Play = 4,
	}

	/** 安全音频单元 */
	export interface Unit {
		/** 分组 */
		readonly groupNumList: ReadonlyArray<number>;
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
		readonly audioSource: cc.AudioSource | null;
		/** 音频资源 */
		clip: cc.AudioClip | null;
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
	}

	/** add 配置 */
	export interface AddConfig<T extends boolean> {
		/** 类型 */
		type?: GlobalConfig.Audio.Type;
		/** 分组 */
		groupNumList?: number[];
		/** 文件夹 */
		isDir?: T;
		/** 加载配置 */
		loadConfig?: MKAsset_.GetConfig<cc.AudioClip>;
	}

	/** play 配置 */
	export interface PlayConfig {
		/** 音量 */
		volumeNum: number;
		/** 循环 */
		isLoop: boolean;
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

	/**
	 * 音频单元
	 * @internal
	 */
	@ccclass("MKAudioBase/Unit")
	export abstract class PrivateUnit {
		constructor(init_?: Partial<PrivateUnit>) {
			Object.assign(this, init_);
		}

		/* --------------- 属性 --------------- */
		/** 音频资源 */
		@property({ displayName: "音频资源", type: cc.AudioClip ?? null })
		clip: cc.AudioClip | null = null;

		/** 音频类型 */
		@property({
			displayName: "音频类型",
			type: cc.Enum(GlobalConfig.Audio.Type),
		})
		type = GlobalConfig.Audio.Type.Effect;

		/* --------------- public --------------- */
		/** 事件对象 */
		// eslint-disable-next-line @typescript-eslint/naming-convention
		_event?: MKEventTarget<EventProtocol>;
		/** 分组 */
		groupNumList: number[] = [];
		/**
		 * 当前停止分组
		 * @remarks
		 * 停止时优先级最大的分组
		 */
		stopGroupNum: number | null = null;
		/** 播放状态 */
		state = State.Stop;
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
			this._isInit = value_;
		}

		/** 音量 */
		get volumeNum(): number {
			return 0;
		}

		set volumeNum(valueNum_) {
			throw "未实现";
		}

		/** 循环 */
		get isLoop(): boolean {
			return false;
		}

		set isLoop(value_) {
			throw "未实现";
		}

		/** 总时长（秒） */
		get totalTimeSNum(): number {
			return 0;
		}

		/** 当前时间（秒） */
		get currentTimeSNum(): number {
			return 0;
		}

		set currentTimeSNum(valueNum_) {
			throw "未实现";
		}

		/** 事件对象 */
		get event(): MKEventTarget<EventProtocol> {
			return this._event ?? (this._event = new MKEventTarget<EventProtocol>());
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
		get audioSource(): cc.AudioSource | null {
			return null;
		}

		set audioSource(value_) {
			throw "未实现";
		}

		/* --------------- protected --------------- */
		/** 初始化状态 */
		protected _isInit = false;
		/* ------------------------------- 功能 ------------------------------- */
		/** 更新音量 */
		abstract updateVolume(): void;
		/** 克隆 */
		protected abstract _clone(): PrivateUnit;

		/** 克隆 */
		clone(): PrivateUnit;
		/**
		 * 克隆
		 * @param valueNum_ 克隆数量
		 */
		clone(valueNum_: number): PrivateUnit[];
		clone(valueNum_?: number): PrivateUnit | PrivateUnit[] {
			if (valueNum_ === undefined) {
				return this._clone();
			}

			const audioList: PrivateUnit[] = [];

			// 克隆数组
			for (let kNum = 0, lenNum = valueNum_; kNum < lenNum; ++kNum) {
				audioList.push(this._clone());
			}

			return audioList;
		}
	}

	/** 音频组 */
	export class Group {
		constructor(init_: MKAudioBase, priorityNum_: number) {
			this._audioManage = init_;
			this.priorityNum = priorityNum_;
		}

		/* --------------- public --------------- */
		/**
		 * 优先级
		 * @remarks
		 * 值越小优先级越大
		 */
		readonly priorityNum: number;
		/** 音频列表 */
		audioUnitList: ReadonlyArray<PrivateUnit> = [];

		/** 播放状态 */
		get isPlay(): boolean {
			return this._isPlay;
		}

		/** 停止状态 */
		get isStop(): boolean {
			return this._isStop;
		}

		/** 音量 */
		get volumeNum(): number {
			return this._volumeNum;
		}

		set volumeNum(valueNum_: number) {
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
				this.audioUnitList.forEach((v) => {
					// eslint-disable-next-line no-self-assign
					v.updateVolume();
				});
			}
		}

		/* --------------- private --------------- */
		/** 音频管理器 */
		private _audioManage!: MKAudioBase;
		/** 音量 */
		private _volumeNum = 1;
		/** 播放状态 */
		private _isPlay = true;
		/** 停止状态 */
		private _isStop = false;
		/* ------------------------------- 功能 ------------------------------- */
		/**
		 * 播放
		 * @param containsStateNum_ 包含状态，处于这些状态中的音频将被播放，例：`mk.Audio_.State.Pause | mk.Audio_.State.Stop`
		 * @defaultValue `State.Pause | State.Stop`
		 */
		play(containsStateNum_ = State.Pause | State.Stop): void {
			// 停止状态没有暂停的音乐
			if (this._isStop) {
				containsStateNum_ &= ~State.Pause;
			}

			// 没有包含状态
			if (!containsStateNum_) {
				return;
			}

			this._isPlay = true;
			this._isStop = false;
			this.audioUnitList.forEach((v) => {
				if (!(v.state & containsStateNum_)) {
					return;
				}

				// 更新音频停止组
				this._updateStopGroup(v, false);
				// 播放音频
				this._audioManage.play(v);
			});
		}

		/** 暂停 */
		pause(): void {
			this._isPlay = false;
			this.audioUnitList.forEach((v) => {
				this._audioManage.pause(v);
			});
		}

		/**
		 * 停止
		 * @param isStop_ 停止状态
		 * @remarks
		 * - 停止后续播放音频将不会执行播放逻辑
		 */
		stop(isStop_ = true): void {
			this._isPlay = !isStop_;
			this._isStop = isStop_;

			if (isStop_) {
				this.audioUnitList.forEach((v) => {
					this._audioManage.stop(v);
					// 更新音频停止组
					this._updateStopGroup(v, true);
				});
			} else {
				this.audioUnitList.forEach((v) => {
					// 更新音频停止组
					this._updateStopGroup(v, false);
				});
			}
		}

		/** 添加音频 */
		addAudio(audio_: Unit | Unit[]): void {
			let audioUnitList: PrivateUnit[];

			// 参数转换
			if (Array.isArray(audio_)) {
				audioUnitList = audio_ as any;
			} else {
				audioUnitList = [audio_ as any];
			}

			audioUnitList.forEach((v) => {
				if (
					// 不能重复添加
					this.audioUnitList.includes(v) ||
					// 已存在当前分组
					v.groupNumList.includes(this.priorityNum)
				) {
					return;
				}

				// 添加到音频列表
				(this.audioUnitList as PrivateUnit[]).push(v);
				// 添加到音频分组
				v.groupNumList.push(this.priorityNum);
				// 升序排列
				v.groupNumList.sort((vaNum, vbNum) => vaNum - vbNum);
				// 更新音频停止组
				this._updateStopGroup(v, true);
			});
		}

		/** 删除音频 */
		delAudio(audio_: Unit | Unit[]): void {
			const selfAudioUnitList = this.audioUnitList as PrivateUnit[];
			let audioUnitList: PrivateUnit[];

			// 参数转换
			if (Array.isArray(audio_)) {
				audioUnitList = audio_ as any;
			} else {
				audioUnitList = [audio_ as any];
			}

			audioUnitList.forEach((v) => {
				// 从音频列表移除
				{
					const indexNum = selfAudioUnitList.indexOf(v);

					if (indexNum !== -1) {
						selfAudioUnitList.splice(indexNum, 1);
					}
				}

				// 更新音频停止组
				this._updateStopGroup(v, false);

				// 删除分组
				{
					const indexNum = v.groupNumList.indexOf(this.priorityNum);

					if (indexNum !== -1) {
						v.groupNumList.splice(indexNum, 1);
					}
				}
			});
		}

		/** 清理所有音频 */
		clear(): Unit[] {
			const selfAudioUnitList = this.audioUnitList as PrivateUnit[];

			selfAudioUnitList.forEach((v) => {
				// 更新音频停止组
				this._updateStopGroup(v, false);

				// 删除分组
				{
					const indexNum = v.groupNumList.indexOf(this.priorityNum);

					if (indexNum !== -1) {
						v.groupNumList.splice(indexNum, 1);
					}
				}
			});

			return selfAudioUnitList.splice(0, selfAudioUnitList.length);
		}

		/**
		 * 更新音频停止组
		 * @param audio_ 音频单元
		 * @param isAddOrStop_ 添加或停止状态
		 */
		private _updateStopGroup(audio_: PrivateUnit, isAddOrStop_: boolean): void {
			// 添加 | 停止
			if (isAddOrStop_) {
				if (this.isStop && (audio_.stopGroupNum === null || this.priorityNum < audio_.stopGroupNum)) {
					audio_.stopGroupNum = this.priorityNum;
				}
			}
			// 移除 | 播放
			else {
				if (audio_.stopGroupNum === this.priorityNum) {
					const stopGroupNum = audio_.groupNumList.find((vNum) => this._audioManage.getGroup(vNum).isStop);

					audio_.stopGroupNum = stopGroupNum !== undefined ? stopGroupNum : null;
				}
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Unit = PrivateUnit as any as Omit<Unit, keyof Function> & {
		new (init_?: Partial<Unit>): Omit<Unit, keyof Function>;
	};
}

export default MKAudioBase;
