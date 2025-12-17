import mkAsset, { MKAsset_ } from "../Resources/MKAsset";
import { EDITOR } from "cc/env";
import MKLogger from "../MKLogger";
import GlobalConfig from "../../Config/GlobalConfig";
import MKRelease, { MKRelease_ } from "../Resources/MKRelease";
// eslint-disable-next-line unused-imports/no-unused-imports
import { _decorator, AudioClip, AudioSource, Director, director, Enum, find, Node } from "cc";
import mkToolObject from "../@Private/Tool/MKToolObject";
import MKObjectPool from "../MKObjectPool";
import globalEvent from "../../Config/GlobalEvent";
import MKAudioUnit, { MKAudioUnit_ } from "./MKAudioUnit";
import MKAudioGroup from "./MKAudioGroup";

/**
 * 音频管理器
 * @remarks
 *
 * - 音频分组，支持对不同类型的音频批量控制
 *
 * - 支持动态加载/编辑器挂载音频单元
 *
 * - 超出播放数量限制后停止当前音频而不是之前的
 *
 * - 支持音频播放间隔控制
 */
export class MKAudio {
	constructor() {
		this._constructor();
	}
	/* --------------- public --------------- */
	/**
	 * 音频间隔限制表
	 * @remarks
	 * - key: AudioClip 资源的 uuid
	 * - value: 限制间隔时间（毫秒）
	 */
	audioIntervalMsLimitTab: Record<string, number> = {};
	/** 音频组 */
	get groupMap(): ReadonlyMap<number, MKAudio_.Group> {
		return this._groupMap;
	}
	/* --------------- protected --------------- */
	/** 日志 */
	protected _log = new MKLogger("MKAudio");
	/** 音频组 */
	protected _groupMap = new Map<number, MKAudio_.Group>();
	/* --------------- private --------------- */
	/** 音频常驻节点 */
	private _audioNode!: Node;
	/** 音频 uuid 索引表 */
	private _audioUnitMap = new Map<string, MKAudioUnit>();
	/** 当前播放数量 */
	private _currentPlayNum = 0;
	/** AudioSource 对象池 */
	private _audioSourcePool!: MKObjectPool.Sync<AudioSource>;
	/** 倒计时集合 */
	private _timerSet = new Set<any>();
	/** 音频播放时间戳表 */
	private _audioPlayTimestampTab: Record<string, number> = {};
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取音频组
	 * @param groupNum_ 组类型
	 * @returns
	 */
	getGroup(groupNum_: number): MKAudio_.Group {
		let result = this._groupMap.get(groupNum_);

		if (!result) {
			this._groupMap.set(groupNum_, (result = new MKAudio_.Group(this, groupNum_)));
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
		target_: MKRelease_.TypeFollowReleaseSupport,
		config_?: MKAudio_.AddConfig<T2>
	): Promise<T2 extends true ? (MKAudio_.Unit | null)[] : T extends string ? MKAudio_.Unit | null : (MKAudio_.Unit | null)[]> {
		if (EDITOR && !window["cc"].GAME_VIEW) {
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

		const audioList: (MKAudioUnit | null)[] = [];
		let result: MKAudioUnit | (MKAudioUnit | null)[];

		if (config_?.isDir) {
			for (const vStr of urlStrList) {
				const assetList = await mkAsset.getDir(vStr, AudioClip, null, config_.loadConfig as any);

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
				const asset = await mkAsset.get(vStr, AudioClip, null, config_?.loadConfig);

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

			v._followReleaseTarget = target_;
			this._add(v, config_?.groupIdNumList);
		});

		MKRelease.followRelease(target_, () => {
			audioList.forEach((v) => {
				if (!v) {
					return;
				}

				v.release();
			});
		});

		return result as any;
	}

	/**
	 * 播放音频单元
	 * @param audio_ 音频单元
	 * @param config_ 播放配置
	 * @returns 返回 null 则代表当前音频单元无效，
	 * @remarks
	 * 使用通用音频系统时，当播放数量超过 AudioSource.maxAudioChannel 时会导致播放失败
	 */
	async play(audio_: MKAudio_.Unit | string, config_?: Partial<MKAudio_.PlayConfig>): Promise<MKAudio_.Unit | null> {
		let audio: MKAudioUnit | null;

		if (typeof audio_ === "string") {
			const node = find("音频跟随释放节点") || new Node("音频跟随释放节点");

			if (!node.parent) {
				node.parent = director.getScene();
			}

			audio = (await this.add(audio_, node, {
				type: GlobalConfig.Audio.Type.Effect,
			})) as MKAudioUnit;
		} else {
			audio = audio_ as MKAudioUnit;
		}

		// 参数安检
		if (!audio?.clip) {
			return null;
		}

		// 更新配置
		if (config_) {
			Object.assign(audio, config_);
		}

		// 添加音频
		this._add(audio as MKAudioUnit, audio.groupIdNumList);

		if (audio.groupIdNumList.some((vNum) => this.getGroup(vNum).isStop)) {
			return null;
		}

		// 间隔限制
		if (this.audioIntervalMsLimitTab[audio.clip.uuid]) {
			// 超过限制时间
			if (Date.now() - (this._audioPlayTimestampTab[audio.clip.uuid] ?? 0) < this.audioIntervalMsLimitTab[audio.clip.uuid]) {
				return null;
			}

			this._audioPlayTimestampTab[audio.clip.uuid] = Date.now();
		}

		if (audio.state === MKAudio_.State.Play) {
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

	/**
	 * 暂停音频单元
	 * @param audio_
	 * @returns
	 */
	pause(audio_: MKAudio_.Unit): void {
		const audio = audio_ as MKAudioUnit;

		if (!audio.isInit || audio.state === MKAudio_.State.Pause || audio.state === MKAudio_.State.Stop) {
			return;
		}

		audio.audioSource!.pause();
		audio.state = MKAudio_.State.Pause;
		audio._event?.emit(audio._event?.key.pause);
	}

	/**
	 * 停止音频单元
	 * @param audio_
	 * @returns
	 */
	stop(audio_: MKAudio_.Unit): void {
		const audio = audio_ as MKAudioUnit;

		if (!audio.isInit || audio.state === MKAudio_.State.Stop) {
			return;
		}

		--this._currentPlayNum;
		this._log.debug("当前播放数量", this._currentPlayNum, "结束");
		audio.state = MKAudio_.State.Stop;
		audio.audioSource!.stop();
		audio._event?.emit(audio._event?.key.stop);
		// 回收 AudioSource
		this._audioSourcePool.put(audio.audioSource!);
		audio.audioSource = null;
		// 重置进度
		audio.currentTimeSNum = 0;
	}

	/**
	 * 暂停所有音频
	 * @remarks
	 * 不会阻止后续音频播放
	 */
	pauseAll(): void {
		for (const kStr in GlobalConfig.Audio.Type) {
			if (!isNaN(Number(kStr))) {
				continue;
			}

			const v = GlobalConfig.Audio.Type[kStr] as unknown as GlobalConfig.Audio.Type;

			this._groupMap.get(v)?.pause();
		}
	}

	/** 恢复所有暂停的音频 */
	resumeAll(): void {
		for (const kStr in GlobalConfig.Audio.Type) {
			if (!isNaN(Number(kStr))) {
				continue;
			}

			const v = GlobalConfig.Audio.Type[kStr] as unknown as GlobalConfig.Audio.Type;

			this._groupMap.get(v)?.play(MKAudio_.State.Pause);
		}
	}

	/**
	 * 停止所有音频
	 * @param isPreventPlay_ 阻止后续播放，恢复后续播放则执行对应分组的 stop(false)；默认值 false
	 */
	stopAll(isPreventPlay_ = false): void {
		for (const kStr in GlobalConfig.Audio.Type) {
			if (!isNaN(Number(kStr))) {
				continue;
			}

			const v = GlobalConfig.Audio.Type[kStr] as unknown as GlobalConfig.Audio.Type;

			if (isPreventPlay_) {
				this._groupMap.get(v)?.stop();
			} else {
				this._groupMap.get(v)?.audioUnitList.forEach((v2) => {
					this.stop(v2);
				});
			}
		}
	}

	/**
	 * 添加音频单元
	 * @param audio_ 音频单元
	 * @param groupIdNumList_ 音频组
	 * @returns 成功状态
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_add(audio_: MKAudioUnit, groupIdNumList_?: ReadonlyArray<number>): boolean {
		// 参数安检
		if (!audio_ || audio_.isInit || !audio_.clip) {
			return false;
		}

		/** 包含类型数量 */
		const numTypesIncludedNum =
			groupIdNumList_?.reduce((pre, curr) => {
				return pre + (curr < 0 ? 1 : 0);
			}, 0) ?? 0;

		// 检查分组数据
		if (numTypesIncludedNum > 0) {
			this._log.error(`添加音频单元 ${audio_.clip.name} 失败，不能包含音频类型`);

			return false;
		}

		// 添加分组音频
		[audio_.type].concat(groupIdNumList_ ?? []).forEach((vNum) => {
			/** 组音频列表 */
			let audioGroup = this._groupMap.get(vNum);

			// 添加到音频列表
			if (!audioGroup) {
				this._groupMap.set(vNum, (audioGroup = new MKAudio_.Group(this, vNum)));
			}

			audioGroup.addAudio(audio_);
		});

		// 初始化完成
		audio_.isInit = true;

		return true;
	}

	/** 获取音频实例 */
	private _getAudioUnit(init_?: Partial<MKAudioUnit>): MKAudioUnit {
		return new MKAudioUnit(init_);
	}

	private _play(audio_: MKAudioUnit): void {
		/** 上次状态 */
		const lastState = audio_.state;

		// 恢复播放
		if (audio_.state === MKAudio_.State.Pause) {
			audio_._event?.emit(audio_._event?.key.resume);
		}

		// 更新状态
		audio_.state = MKAudio_.State.Play;

		// 更新播放计数
		if (lastState === MKAudio_.State.Stop) {
			++this._currentPlayNum;

			// 请求 AudioSource
			audio_.audioSource = this._audioSourcePool.get();
			audio_.audioSource.clip = audio_.clip;

			// 添加音频 uuid 索引表
			this._audioUnitMap.set(audio_.audioSource.uuid, audio_);
		}

		// 若超出 maxAudioChannel 继续播放则会停止之前播放的音频，故退出
		if (lastState === MKAudio_.State.Stop && this._currentPlayNum > AudioSource.maxAudioChannel) {
			this._log.warn("音频数量超出 maxAudioChannel, 停止当前音频播放");
			this.stop(audio_);

			return;
		}

		// 播放音频
		audio_.audioSource!.play();

		if (lastState === MKAudio_.State.Stop) {
			this._log.debug("当前播放数量", this._currentPlayNum, "播放", audio_.clip!.name);
		}
	}

	/** 构造 */
	private async _constructor(): Promise<void> {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			return;
		}

		globalEvent.on(globalEvent.key.restart, this._eventRestart, this);

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
	private _nodeAudioStarted(audio_: MKAudioUnit): void {
		if (!audio_) {
			return;
		}

		audio_._event?.emit(audio_._event?.key.play);
	}

	/** 播放结束回调 */
	private _nodeAudioEnded(audio_: MKAudioUnit): void {
		if (!audio_) {
			return;
		}

		// 若为 stop 状态则表明已经手动停止
		if (audio_.state !== MKAudio_.State.Stop) {
			--this._currentPlayNum;
			this._log.debug("当前播放数量", this._currentPlayNum, "结束");
			// 更新播放数据
			audio_.state = MKAudio_.State.Stop;
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
		// 停止所有音频
		this.stopAll();

		// 重置数据，音频资源释放应该由模块管理
		mkToolObject.reset(this, true);

		// 清理定时器
		this._timerSet.forEach((v) => clearTimeout(v));
		this._timerSet.clear();
	}
}

export namespace MKAudio_ {
	/** 音频状态 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const State = MKAudioUnit_.State;

	/** add 配置 */
	export interface AddConfig<T extends boolean> {
		/** 类型 */
		type?: GlobalConfig.Audio.Type;
		/** 分组 */
		groupIdNumList?: number[];
		/** 文件夹 */
		isDir?: T;
		/** 加载配置 */
		loadConfig?: MKAsset_.GetConfig<AudioClip>;
	}

	/** play 配置 */
	export interface PlayConfig {
		/** 音量 */
		volumeNum: number;
		/** 循环 */
		isLoop: boolean;
	}

	/** 音频组 */
	export class Group extends MKAudioGroup {}

	/** 安全音频单元 */
	export type Unit = MKAudioUnit_.MKAudioUnitSafe;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Unit = MKAudioUnit_.MKAudioUnitSafe;
}

export default new MKAudio();
