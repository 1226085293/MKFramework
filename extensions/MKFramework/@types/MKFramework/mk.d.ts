//@ts-nocheck
// 框架源码位于 项目根目录\extensions\MKFramework\assets\MKFramework 下，你也可以在资源管理器下方的 MKFramework 查看
import GlobalConfig from "../../assets/MKFramework/Config/GlobalConfig";
import * as cc_2 from "cc";

declare namespace mk {
	export declare const asset: MKAsset;

	export declare namespace Asset_ {
		/** 加载文件夹配置 */
		export interface GetDirConfig<T extends cc_2.Asset> extends Omit<GetConfig<T>, "completedFunc"> {
			/** 完成回调 */
			completedFunc?: (error: Error[] | null, asset: (T | null)[]) => void;
		}
		/** 加载配置 */
		export interface GetConfig<T extends cc_2.Asset = cc_2.Asset> {
			/**
			 * bundle 名
			 * @defaultValue
			 * 编辑器：resources，运行时：mk.bundle.bundle_s(当前场景所属 bundle)
			 */
			bundleStr?: string;
			/** 进度回调 */
			progressFunc?: (
				/** 当前进度 */
				currentNum: number,
				/** 总进度 */
				totalNum: number
			) => void;
			/** 完成回调 */
			completedFunc?: (error: Error | null, asset: T) => void;
			/** 远程配置，存在配置则为远程资源 */
			remoteOption?: _mk_asset.LoadRemoteOptionType;
			/**
			 * 失败重试次数
			 * @defaultValue global_config.asset.config.retry_count_on_load_failure_n
			 */
			retryNum?: number;
		}
		/** 跟随释放对象 */
		export type TypeFollowReleaseObject = Release_.TypeFollowReleaseObject<cc_2.Asset>;
	}

	/**
	 * 音频管理器
	 * @remarks
	 *
	 * - 音频分组，支持对不同类型的音频批量控制
	 *
	 * - 支持(动态/静态)音频
	 *
	 * - (通用/微信)版本
	 *
	 * - 增加对 playOnShot 接口的事件支持
	 *
	 * - 通用版本超出播放数量限制后停止当前音频而不是之前的
	 */
	export declare const audio: MKAudioBase;

	export declare namespace Audio_ {
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
			readonly event: EventTarget_2<EventProtocol>;
			/** 音频类型 */
			readonly type: number;
			/** 真实音量 */
			readonly realVolumeNum: number;
			/**
			 * 音频组件
			 * @remarks
			 * 通用音频系统使用
			 */
			readonly audioSource: cc_2.AudioSource | null;
			/** 音频资源 */
			clip: cc_2.AudioClip | null;
			/** 音量 */
			volumeNum: number;
			/** 循环 */
			isLoop: boolean;
			/** 当前时间（秒） */
			currTimeSNum: number;
			/** 等待播放开关 */
			isWaitPlay?: boolean;
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
			loadConfig?: Asset_.GetConfig<cc_2.AudioClip>;
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
		/* Excluded from this release type: PrivateUnit */
		/** 音频组 */
		export class Group {
			constructor(init_: MKAudioBase, priorityNum_: number);
			/**
			 * 优先级
			 * @remarks
			 * 值越小优先级越大
			 */
			readonly priorityNum: number;
			/** 音频列表 */
			audioUnitList: ReadonlyArray<PrivateUnit>;
			/** 播放状态 */
			get isPlay(): boolean;
			/** 停止状态 */
			get isStop(): boolean;
			/** 音量 */
			get volumeNum(): number;
			set volumeNum(valueNum_: number);
			/** 音频管理器 */
			private _audioManage;
			/** 音量 */
			private _volumeNum;
			/** 播放状态 */
			private _isPlay;
			/** 停止状态 */
			private _isStop;
			/**
			 * 播放
			 * @param containsStateNum_ 包含状态，处于这些状态中的音频将被播放，例：mk.audio_.state.pause | mk.audio_.state.stop
			 */
			play(containsStateNum_?: number): void;
			/** 暂停 */
			pause(): void;
			/**
			 * 停止
			 * @remarks
			 * - 停止后播放的音频将跳过
			 */
			stop(isStop_?: boolean): void;
			/** 添加音频 */
			addAudio(audio_: Unit | Unit[]): void;
			/** 删除音频 */
			delAudio(audio_: Unit | Unit[]): void;
			/** 清理所有音频 */
			clear(): Unit[];
			/**
			 * 更新音频停止组
			 * @param audio_ 音频单元
			 * @param isAddOrStop_ 添加或停止状态
			 */
			private _updateStopGroup;
		}
		const Unit: Omit<Unit, keyof Function> & (new (init_?: Partial<Unit>) => Omit<Unit, keyof Function>);
	}

	export declare const bundle: MKBundle;

	export declare namespace Bundle_ {
		/** bundle 信息 */
		export class BundleInfo {
			constructor(init_: BundleInfo);
			/**
			 * bundle名
			 * @remarks
			 * getBundle 时使用
			 */
			bundleStr: string;
			/** 版本 */
			versionStr?: string;
			/**
			 * 资源路径
			 * @defaultValue
			 * this.bundle_s
			 * @remarks
			 * loadBundle 时使用，不存在时将使用 bundle_s 进行 loadBundle
			 */
			originStr?: string;
		}
		/**
		 * bundle 数据
		 * @noInheritDoc
		 */
		export class BundleData extends BundleInfo {
			constructor(init_: BundleData);
			/** bundle 管理器 */
			manage?: BundleManageBase;
		}
		/** load 配置 */
		export class LoadConfig extends BundleInfo {
			constructor(init_: LoadConfig);
			/** 加载回调 */
			progressCallbackFunc?: (curr_n: number, total_n: number) => void;
		}
		/** 重载 bundle 信息 */
		export class ReloadBundleInfo extends LoadConfig {
			constructor(init_: Omit<ReloadBundleInfo, "versionStr" | "originStr"> & Required<Pick<ReloadBundleInfo, "versionStr" | "originStr">>);
			/** 匹配 ccclass 名称正则表达式 */
			ccclassRegexp?: RegExp;
		}
		/** switch_scene 配置 */
		export class SwitchSceneConfig {
			constructor(init_?: Partial<SwitchSceneConfig>);
			/**
			 * bundle名
			 * @remarks
			 * getBundle 时使用
			 */
			bundleStr: string;
			/** 预加载 */
			isPreload?: boolean;
			/**
			 * 加载进度回调
			 * @param finishNum 完成数量
			 * @param total 总数量
			 * @param item 当前项目
			 */
			progressCallbackFunc?(finishNum: number, total: number, item?: cc_2.AssetManager.RequestItem): void;
			/** 加载前调用的函数 */
			beforeLoadCallbackFunc?: cc_2.Director.OnBeforeLoadScene;
			/** 启动后调用的函数 */
			launchedCallbackFunc?: cc_2.Director.OnSceneLaunched;
			/** 场景卸载后回调 */
			unloadedCallbackFunc?: cc_2.Director.OnUnload;
		}
		/**
		 * bundle 管理器基类
		 * @noInheritDoc
		 * @remarks
		 * 注意生命周期函数 init、open、close 会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
		 */
		export abstract class BundleManageBase implements Release_.TypeFollowReleaseObject {
			constructor();
			/** bundle 名 */
			abstract nameStr: string;
			/** 管理器有效状态 */
			isValid: boolean;
			/** 节点池表 */
			nodePoolTab: Record<string, cc_2.NodePool>;
			/** 事件对象 */
			event?: EventTarget_2<any>;
			/** 网络对象 */
			network?: MKNetworkBase;
			/** 数据获取器 */
			data?: MKDataSharer_.Api<any>;
			/** 释放管理器 */
			protected _releaseManage: Release;
			/**
			 * 初始化
			 * @remarks
			 * 从其他 bundle 的场景切换到此 bundle 的场景之前调用
			 */
			init?(): void | Promise<void>;
			/**
			 * 打开回调
			 * @remarks
			 * 从其他 bundle 的场景切换到此 bundle 的场景时调用
			 */
			open(): void | Promise<void>;
			/**
			 * 关闭回调
			 * @remarks
			 * 从此 bundle 的场景切换到其他 bundle 的场景时调用
			 */
			close(): void | Promise<void>;
			followRelease<T = Release_.TypeReleaseParamType>(object_: T): T;
			cancelRelease<T = Release_.TypeReleaseParamType>(object_: T): void;
		}
	}

	/** 编解码器基类 */
	export declare abstract class CodecBase {
		constructor(option_?: CodecBase_.Config);
		/** 配置信息 */
		protected _config: CodecBase_.Config;
		/** 日志 */
		protected get _log(): Logger;
		/** 日志 */
		private _log2?;
		/** 编码 */
		encode(...argsList_: any[]): any;
		/** 解码 */
		decode(...argsList_: any[]): any;
	}

	export declare namespace CodecBase_ {
		/** 配置信息 */
		export class Config {
			/** 加密函数 */
			encryptionFunc?: (data: any) => any;
			/** 解密函数 */
			decryptFunc?: (data: any) => any;
		}
	}

	/**
	 * 返回一个增加 MKDataSharer_.api 接口的数据
	 * @param class_ 数据类型
	 * @returns 数据源为 new class_ 的 Proxy
	 * @remarks
	 * 如果需要监听数据修改，请使用 returns.source
	 */
	export declare function dataSharer<T extends Object, T2 = T & MKDataSharer_.Api<T>>(class_: cc_2.Constructor<T>): T2;

	export declare const dynamicModule: MKDynamicModule;

	export declare const error: (...argsList_: any[]) => void;

	/**
	 * 事件对象（类型安全）
	 * @noInheritDoc
	 * @remarks
	 * 获取事件键使用 EventTarget.key.xxx
	 */
	declare class EventTarget_2<CT> extends cc_2.EventTarget {
		/** 事件键 */
		key: {
			[k in keyof CT]: k;
		};
		/**
		 * 监听事件
		 * @param type_ 事件类型
		 * @param callback_ 触发回调
		 * @param target_ 事件目标对象
		 * @param isOnce_ 是否触发单次
		 * @returns 触发回调
		 */
		on<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(
			type_: T | T[],
			callback_: T2,
			target_?: any,
			isOnce_?: boolean
		): typeof callback_ | null;
		/**
		 * 监听单次事件
		 * @param type_ 事件类型
		 * @param callback_ 触发回调
		 * @param target_ 事件目标对象
		 * @returns 触发回调
		 */
		once<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(
			type_: T | T[],
			callback_: T2,
			target_?: any
		): typeof callback_ | null;
		/**
		 * 取消监听事件
		 * @param type_ 事件类型
		 * @param callback_ 触发回调
		 * @param target_ 事件目标对象
		 * @returns 触发回调
		 */
		off<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(type_: T | T[], callback_?: T2, target_?: any): void;
		/**
		 * 派发事件
		 * @param type_ 事件类型
		 * @param argsList_ 事件参数
		 */
		emit<T extends keyof CT, T2 extends Parameters<CT[T]>>(type_: T | T[], ...argsList_: T2): void;
		/**
		 * 是否存在事件
		 * @param type_ 事件类型
		 * @param callback_ 触发回调
		 * @param target_ 事件目标对象
		 * @returns
		 */
		has<T extends keyof CT, T2 extends (...argsList: Parameters<CT[T]>) => void>(type_: T, callback_?: T2, target_?: any): boolean;
		/** 清空所有事件 */
		clear: () => void;
		/**
		 * 请求事件
		 * @param type_ 事件类型
		 * @param args_ 事件参数
		 * @remarks
		 * 等待请求事件返回
		 */
		request<T extends keyof CT, T2 extends Parameters<CT[T]>, T3 extends ReturnType<CT[T]>>(type_: T | T[], ...args_: T2): Promise<T3>[];
		/**
		 * 请求单个事件
		 * @param type_ 事件类型
		 * @param argsList_ 事件参数
		 * @returns
		 */
		private _requestSingle;
	}
	export { EventTarget_2 as EventTarget };

	export declare const game: MKGame;

	/* Excluded from this release type: GlobalConfig */

	/**
	 * 引导管理器
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 支持多实例
	 *
	 * - 支持任意步骤的(插入/删除)
	 *
	 * - 支持(暂停/完成)引导
	 *
	 * - 支持任意步骤跳转后的状态还原(操作单元)
	 *
	 * - 引导步骤脚本分离，支持组件式挂载
	 */
	export declare class GuideManage {
		constructor(init_: GuideManage_.InitConfig);
		/** 事件 */
		event: EventTarget_2<GuideManage_.EventProtocol>;
		/** 步骤表 */
		stepMap: Map<number, GuideStepBase<any>>;
		/** 暂停状态 */
		get isPause(): boolean;
		set isPause(value_: boolean);
		/** 完成状态 */
		get isFinish(): boolean;
		/** 结束步骤 */
		get endStepNum(): number;
		/** 日志 */
		private _log;
		/** 初始化配置 */
		private _initConfig;
		/** 暂停状态 */
		private _isPause;
		/** 上次步骤序号 */
		private _preStepNum?;
		/** 当前步骤序号 */
		private _stepNum;
		/** 任务管线 */
		private _taskPipeline;
		/** 步骤预加载任务表 */
		private _stepPreloadMap;
		/**
		 * 注册步骤
		 * @param step_ 步骤实例
		 */
		regis(step_: GuideStepBase | GuideStepBase[]): void;
		/**
		 * 运行引导
		 * @remarks
		 * 自动取消暂停状态，且更新当前步骤视图
		 */
		run(): Promise<void>;
		/**
		 * 设置当前步骤
		 * @param stepNum_ 步骤
		 * @param initData_ 初始化数据
		 * @remarks
		 *
		 * - 暂停状态：更新步骤数据
		 *
		 * - 正常状态：更新步骤数据，执行步骤生命周期
		 */
		setStep(stepNum_: number, initData_?: any): Promise<void>;
		/** 获取步骤 */
		getStep(): number;
		/** 完成引导 */
		finish(): void;
		/** 更新步骤数据 */
		private _updateStepData;
		private _setIsPause;
	}

	export declare namespace GuideManage_ {
		/** 事件协议 */
		export interface EventProtocol {
			/** 暂停 */
			pause(): void;
			/** 恢复 */
			resume(): void;
			/**
			 * 切换步骤前
			 * @param nextStepNum 下个步骤
			 * @remarks
			 * set_step 时执行
			 */
			beforeSwitch(nextStepNum: number): void;
			/**
			 * 加载步骤
			 * @remarks
			 * 加载步骤(场景/操作)前调用
			 */
			loadingStep(): void;
			/**
			 * 卸载步骤后
			 * @param step 卸载的步骤
			 */
			afterUnloadStep(step: GuideStepBase): void;
			/**
			 * 加载步骤完成
			 * @remarks
			 * 步骤 load 执行后调用
			 */
			loadingStepComplete(): void;
			/** 中断 */
			break(): void;
			/** 完成 */
			finish(): void;
		}
		/** 操作单元 */
		export interface OperateCell {
			/** 加载 */
			load: () => any;
			/** 卸载 */
			unload?: () => any;
			/**
			 * 重置
			 * @remarks
			 * 上下步骤都存在当前操作时调用
			 */
			reset?: () => any;
		}
		/** 初始化配置 */
		export interface InitConfig {
			/** 当前步骤 */
			currentStepNum?: number;
			/** 结束步骤 */
			endStepNum?: number;
			/** 操作表 */
			operateTab?: Record<string, OperateCell>;
			/**
			 * 引导名
			 * @remarks
			 * 用于日志输出
			 */
			nameStr?: string;
			/**
			 * 步骤更新回调
			 * @param stepNum
			 * @returns null/undefined：更新失败，中断引导
			 * @remarks
			 * - 默认返回 true
			 *
			 * - 可在此内更新服务端数据并请求奖励
			 *
			 * - 步骤可使用 this.step_update_data 获取返回数据
			 */
			stepUpdateCallbackFunc?(stepNum: number): any;
		}
	}

	/**
	 * 引导步骤基类
	 * @noInheritDoc
	 */
	export declare abstract class GuideStepBase<CT extends Record<string, GuideManage_.OperateCell> = any> extends cc_2.Component {
		/** 步骤序号 */
		abstract stepNum: number;
		/**
		 * 所属场景
		 * @remarks
		 * 格式：bundle.scene
		 */
		sceneStr?: string;
		/** 引导管理器 */
		guideManage: GuideManage;
		/** 操作键列表 */
		operateStrList: Exclude<keyof CT, symbol>[];
		/** 操作表返回值 */
		operateTab: {
			[k in keyof CT]: ReturnType<Awaited<CT[k]["load"]>> | undefined;
		};
		/** 初始化数据 */
		initData: any;
		/** 步骤更新返回数据 */
		stepUpdateData: any;
		/**
		 * 步骤描述
		 * @remarks
		 * 用于日志打印
		 */
		describeStr?: string;
		/**
		 * 下个步骤
		 * @remarks
		 *
		 * - length == 1：预加载及 this._next 跳转
		 *
		 * - length > 1：预加载
		 */
		nextStepNumList?: number[];
		/**
		 * 预加载
		 * @remarks
		 * 上个步骤 load 后执行
		 */
		preLoad?(): void | Promise<void>;
		/**
		 * 加载
		 * @param isJump_ 跳转状态
		 * @remarks
		 * 进入当前步骤
		 */
		abstract load(isJump_: boolean): void | Promise<void>;
		/**
		 * 卸载
		 * @remarks
		 * 退出当前步骤
		 */
		unload?(): void | Promise<void>;
		/**
		 * 跳转到下个步骤
		 * @param initData_ 下个步骤初始化数据
		 * @returns
		 */
		protected _next(initData_?: any): void;
	}

	/** 继承单例（类型安全） */
	export declare abstract class InstanceBase {
		/** 单例方法 */
		static instance<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): InstanceType<T>;
	}

	declare namespace Language {
		export { MKLanguageLabel as Label, MKLanguageTexture as Texture, MKLanguageNode as Node };
	}
	export { Language };

	export declare namespace Language_ {
		/** 多语言数据结构 */
		export type TypeDataStruct<T extends _MKLanguageManage.TypeType = any> = Record<
			T,
			{
				[k in keyof typeof GlobalConfig.Language.typeTab]: string;
			}
		>;
		/** 获取文本配置 */
		export class LabelConfig {
			constructor(init_?: Partial<LabelConfig>);
			/** 语言类型 */
			language: keyof typeof GlobalConfig.Language.typeTab;
			/** 参数 */
			argsStrList?: string[];
		}
		/** 多语言数据 */
		export abstract class BaseData<CT extends TypeDataStruct> {
			constructor(init_: CT);
			/** 多语言键 */
			key: {
				[k in keyof CT]: k;
			};
			/** 多语言数据 */
			data: TypeDataStruct<Exclude<keyof CT, symbol>>;
		}
		/** 多语言纹理数据 */
		export class TextureData<CT extends TypeDataStruct> extends BaseData<CT> {
			constructor(type_: string, init_: CT);
		}
		/** 多语言文本数据 */
		export class LabelData<CT extends TypeDataStruct> extends BaseData<CT> {
			constructor(type_: string, init_: CT);
		}
	}

	export declare const languageManage: MKLanguageManage;

	/**
	 * 层级管理
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 动态多类型层级划分
	 *
	 * - 支持类型层级细粒度划分
	 */
	export declare class Layer extends cc_2.Component {
		protected static _config: {
			layerSpacingNum: number;
			layerRefreshIntervalMsNum: number;
			windowAnimationTab: Readonly<{
				open: Record<string, (value: cc_2.Node) => void | Promise<void>>;
				close: Record<string, (value: cc_2.Node) => void | Promise<void>>;
			}>;
		};
		/** 初始化编辑器 */
		get initEditor(): void;
		/** 层类型 */
		layerTypeNum: number;
		/** 层级 */
		get childLayerNum(): number;
		set childLayerNum(valueNum_: number);
		/**
		 * 使用 layer
		 * @defaultValue
		 * true
		 * @remarks
		 * false：关闭 layer 功能
		 */
		protected _isUseLayer: boolean;
		/** 层级 */
		private _childLayerNum;
		protected onEnable(): void;
		/** 初始化编辑器 */
		protected _initEditor(): void;
		/** 更新渲染顺序 */
		private _updateLayer;
	}

	/**
	 * 生命周期
	 * @noInheritDoc
	 * @remarks
	 * 用于模块生命周期控制，注意所有生命周期函数 onLoad、open ... 等都会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
	 */
	export declare class LifeCycle extends Layer implements Asset_.TypeFollowReleaseObject {
		constructor(...argsList: any[]);
		/** 初始化数据 */
		initData?: any;
		/**
		 * 视图数据
		 * @remarks
		 * 如果是 class 类型数据会在 close 后自动重置，根据 this._reset_data_b 控制
		 */
		data?: any;
		/**
		 * 事件对象列表
		 * @readonly
		 * @remarks
		 * 模块关闭后自动清理事件
		 */
		eventTargetList: {
			targetOff?(target: any): any;
		}[];
		/**
		 * 有效状态
		 * @remarks
		 * 表示模块未在(关闭/关闭中)状态
		 */
		get valid(): boolean;
		/** 静态模块 */
		get isStatic(): boolean;
		/** 设置模块配置 */
		set config(config_: _MKLifeCycle.CreateConfig);
		/** 静态模块 */
		protected _isStatic: boolean;
		/** onLoad 任务 */
		protected _onLoadTask: MKStatusTask<void>;
		/** create 任务 */
		protected _createTask: MKStatusTask<void>;
		/** open 任务 */
		protected _openTask: MKStatusTask<void>;
		/** 运行状态 */
		protected _state: _MKLifeCycle.RunState;
		/* Excluded from this release type: _releaseManage */
		/**
		 * 重置 data
		 * @remarks
		 * close 后重置 this.data，data 必须为 class 类型
		 */
		protected _isResetData: boolean;
		/** 日志 */
		protected get _log(): Logger;
		/** 日志 */
		private _log2;
		/** 初始化计数（防止 onLoad 前多次初始化调用多次 init） */
		private _waitInitNum;
		protected onLoad(): void;
		/**
		 * 创建
		 * @param config_ 创建配置
		 * @remarks
		 * 可在此处初始化视图状态
		 *
		 * - 静态模块：onLoad 时调用
		 *
		 * - 动态模块：addChild 后调用
		 */
		protected create?(): void;
		/**
		 * 初始化
		 * @param data_ 初始化数据
		 * @remarks
		 * 所有依赖 init_data 初始化的逻辑都应在此进行
		 *
		 * - 静态模块：onLoad 后调用，外部自行调用，常用于更新 item 或者静态模块
		 *
		 * - 动态模块：onLoad 后，open 前且存在初始化数据时被调用
		 */
		init(data_?: this["initData"]): void;
		/**
		 * 打开
		 * @protected
		 * @remarks
		 * onLoad，init 后执行，在此处执行无需 init_data 支持的模块初始化操作
		 *
		 * open 顺序: 子 -> 父
		 */
		protected open?(): void;
		/**
		 * 关闭
		 * @remarks
		 * 模块关闭前调用，可被外部调用（回收模块）
		 *
		 *  close 顺序: 父 -> 子
		 */
		close?(): void;
		/**
		 * 关闭后
		 * @protected
		 * @remarks
		 * 在子模块 close 和 late_close 后执行
		 */
		protected lateClose?(): void;
		/** 驱动生命周期运行（用于动态添加的组件） */
		drive(initData_?: this["initData"]): Promise<void>;
		followRelease<T = Release_.TypeReleaseParamType & Audio_.PrivateUnit>(object_: T): T;
		cancelRelease<T = Release_.TypeReleaseParamType & Audio_.PrivateUnit>(object_: T): void;
		/* Excluded from this release type: _open */
		/* Excluded from this release type: _close */
		/** 递归 open */
		private _recursiveOpen;
		/** 递归 close */
		private _recursiveClose;
	}

	export declare const log: (...argsList_: any[]) => void;

	/**
	 * 日志打印器
	 * @noInheritDoc
	 * @remarks
	 * 单例对象打印名为 default
	 *
	 * - 支持多实例
	 *
	 * - 打印等级控制
	 *
	 * - 打印屏蔽控制
	 *
	 * - 报错日志 http 上传
	 */
	export declare class Logger extends InstanceBase {
		constructor(nameStr_: string);
		/** 全局配置 */
		private static _config;
		/** 初始化状态 */
		private static _isInit;
		/** 所有 log 对象 */
		private static _logMap;
		/** 日志缓存 */
		private static _cacheStrList;
		/** 唯一日志模块 */
		private static _logOnlyModuleStrList;
		/** 限制日志模块 */
		private static _limitLogModuleStrList;
		/** 日志模块名 */
		private _nameStr;
		/** 日志函数表 */
		private _logFuncTab;
		/** 计时信息 */
		private _timeMap;
		/**
		 * 只限模块打印
		 * @param moduleStrList_ 模块名列表
		 * @remarks
		 * 调用时会覆盖 {@link MKLogger.limit} 的规则
		 */
		static only(moduleStrList_: string[]): void;
		/**
		 * 限制模块打印
		 * @param moduleStrList_ 模块名列表
		 * @remarks
		 * 调用时会覆盖 {@link MKLogger.only} 的规则
		 */
		static limit(moduleStrList_: string[]): void;
		/**
		 * 添加日志缓存
		 * @param level_ 等级
		 * @param headStr_ 日志头
		 * @param argsList_ 参数
		 * @returns
		 */
		private static _addLogCache;
		debug(...argsList_: any[]): void;
		log(...argsList_: any[]): void;
		warn(...argsList_: any[]): void;
		error(...argsList_: any[]): void;
		/** 计时开始 */
		timeStart(nameStr_: string, ...argsList_: any[]): void;
		/** 打印耗时 */
		timeLog(nameStr_: string, ...argsList_: any[]): void;
		/** 总耗时 */
		timeEnd(nameStr_: string, ...argsList_: any[]): void;
		/** 日志头 */
		private _getLogHead;
		private _log;
	}

	declare namespace _mk_asset {
		/** loadRemote 配置类型 */
		interface LoadRemoteOptionType extends Record<string, any> {
			uuid?: string;
			url?: string;
			path?: string;
			dir?: string;
			scene?: string;
			ext?: string;
		}
		/** loadAny 配置类型 */
		interface LoadAnyRequestType extends Record<string, any> {
			uuid?: string;
			url?: string;
			path?: string;
			dir?: string;
			scene?: string;
		}
		/** 释放信息 */
		class ReleaseInfo {
			constructor(init_?: Partial<ReleaseInfo>);
			/** 添加时间 */
			joinTimeMsNum: number;
			/** 资源 */
			asset: cc_2.Asset;
		}
	}

	declare namespace mk_websocket_wx_ {
		class InitConfig<CT extends CodecBase = CodecBase> extends MKNetworkBase_.InitConfig<CT> {
			constructor(init_?: Partial<InitConfig<CT>>);
			/** 协议 */
			protocolStrList: string[];
		}
	}

	/**
	 * 资源管理器
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 统一加载接口为 get、get_dir
	 *
	 * - 支持 EDITOR 环境加载资源
	 *
	 * - 加载图片无需后缀，通过类型自动添加
	 *
	 * - 加载路径扩展，例：db://xxx.prefab
	 *
	 * - 资源默认引用为 2，引用为 1 时将在 global_config.resources.cache_lifetime_ms_n 时间后自动释放
	 *
	 * - 修复了释放后立即加载同一资源导致加载的资源是已释放后的问题
	 *
	 * - 解决同时加载同一资源多次导致返回的资源对象不一致（对象不一致会导致引用计数不一致）
	 *
	 * - 增加强制性资源跟随释放对象
	 */
	declare class MKAsset extends InstanceBase {
		constructor();
		/** 全局配置 */
		private static _config;
		/** 日志 */
		private _log;
		/** 管理表 */
		private _joinTimeMsN;
		/** 释放表 */
		private _assetReleaseMap;
		/** 释放定时器 */
		private _releaseTimer;
		/**
		 * 获取资源
		 * @param pathStr_ 资源路径
		 * @param type_ 资源类型
		 * @param target_ 跟随释放对象
		 * @param config_ 获取配置
		 * @returns
		 */
		get<T extends cc_2.Asset>(
			pathStr_: string,
			type_: cc_2.Constructor<T>,
			target_: Asset_.TypeFollowReleaseObject | null,
			config_?: Asset_.GetConfig<T>
		): Promise<T | null>;
		/**
		 * 获取文件夹资源
		 * @param pathStr_ 资源路径
		 * @param type_ 资源类型
		 * @param target_ 跟随释放对象
		 * @param config_ 获取配置
		 * @returns
		 */
		getDir<T extends cc_2.Asset>(
			pathStr_: string,
			type_: cc_2.Constructor<T>,
			target_: Asset_.TypeFollowReleaseObject | null,
			config_?: Asset_.GetDirConfig<T>
		): Promise<T[] | null>;
		/**
		 * 释放资源
		 * @param asset_ 释放的资源
		 */
		release(asset_: cc_2.Asset | cc_2.Asset[]): void;
		/** 资源初始化 */
		private _assetInit;
		/**
		 * 自动释放资源
		 * @param isForce_ 强制
		 * @returns
		 */
		private _autoReleaseAsset;
		private _onRestart;
	}

	/**
	 * 音频基类
	 * @noInheritDoc
	 */
	declare abstract class MKAudioBase {
		constructor();
		/** 日志 */
		protected abstract _log: Logger;
		/** 音频组 */
		protected _groupMap: Map<number, Audio_.Group>;
		/** 暂停 */
		abstract pause(audio_: Audio_.Unit): void;
		/** 停止 */
		abstract stop(audio_: Audio_.Unit): void;
		/** 获取音频实例 */
		protected abstract _getAudioUnit<T extends Audio_.PrivateUnit>(init_?: Partial<Audio_.PrivateUnit>): T;
		/**
		 * 获取音频组
		 * @param groupNum_ 组类型
		 * @returns
		 */
		getGroup(groupNum_: number): Audio_.Group;
		/**
		 * 添加音频单元
		 * @param url_ 音频资源路径 | 音频资源路径列表
		 * @param target_ 跟随释放对象
		 * @param config_ 添加配置
		 */
		add<T extends string | string[], T2 extends true | false = false>(
			url_: T,
			target_: Asset_.TypeFollowReleaseObject,
			config_?: Audio_.AddConfig<T2>
		): Promise<T2 extends true ? (Audio_.Unit | null)[] : T extends string ? Audio_.Unit | null : (Audio_.Unit | null)[]>;
		/**
		 * 播放音效
		 * @param audio_ 音频单元
		 * @param config_ 播放配置
		 * @returns
		 * @remarks
		 * 使用通用音频系统时，当播放数量超过 cc.AudioSource.maxAudioChannel 时会导致播放失败
		 */
		play(audio_: Audio_.Unit, config_?: Partial<Audio_.PlayConfig>): boolean;
		/** 暂停所有音频 */
		pauseAll(): void;
		/** 恢复所有音频 */
		resumeAll(): void;
		/** 停止所有音频 */
		stopAll(): void;
		/* Excluded from this release type: _add */
		protected _eventRestart(): void;
	}

	/**
	 * Bundle 管理器
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 封装(加载/预加载)场景为 load_scene
	 *
	 * - 支持(远程/本地) bundle
	 *
	 * - 支持 bundle 热更
	 *
	 * - 封装(bundle/scene)切换事件
	 *
	 * - 支持 bundle 管理器，用于子游戏管理
	 */
	declare class MKBundle extends InstanceBase {
		constructor();
		/** 事件 */
		event: EventTarget_2<_MKBundle.EventProtocol>;
		/** 上个场景bundle */
		preBundleStr?: string;
		/** 上个场景名 */
		preSceneStr: string;
		/** bundle列表 */
		bundleMap: Map<string, Bundle_.BundleData>;
		/** 切换场景状态 */
		isSwitchScene: boolean;
		/** 当前场景bundle */
		get bundleStr(): string;
		set bundleStr(valueStr_: string);
		/** 当前场景名 */
		get sceneStr(): string;
		set sceneStr(valueStr_: string);
		/** 初始化任务 */
		private _initTask;
		/** 引擎初始化任务 */
		private _engineInitTask;
		/** 日志 */
		private _log;
		/** 当前场景bundle */
		private _bundleStr;
		/** 当前场景名 */
		private _sceneStr;
		/**
		 * 设置 bundle 数据
		 * @param bundleInfo_ bundle 信息
		 */
		set(bundleInfo_: Omit<Bundle_.BundleData, "manage">): void;
		/**
		 * 加载 bundle
		 * @param args_ bundle 名 | 加载配置
		 * @returns
		 */
		load(args_: string | Bundle_.LoadConfig): Promise<cc_2.AssetManager.Bundle | null>;
		/**
		 * 切换场景
		 * @param sceneStr_ 场景名
		 * @param config_ 切换配置
		 * @returns
		 */
		loadScene(sceneStr_: string, config_: Bundle_.SwitchSceneConfig): Promise<boolean>;
		/**
		 * 重新加载 bundle
		 * @param bundleInfo_ bundle 信息
		 * @returns
		 */
		reload(bundleInfo_: ConstructorParameters<typeof Bundle_.ReloadBundleInfo>[0]): Promise<cc_2.AssetManager.Bundle | null>;
		private _setBundleStr;
		private _setSceneStr;
	}

	declare namespace _MKBundle {
		interface EventProtocol {
			/** bundle 切换前事件 */
			beforeBundleSwitch(event: {
				/** 当前 bundle  */
				currBundleStr: string;
				/** 下个 bundle  */
				nextBundleStr: string;
			}): void;
			/** bundle 切换后事件 */
			afterBundleSwitch(event: {
				/** 当前 bundle  */
				currBundleStr: string;
				/** 上个 bundle  */
				preBundleStr: string;
			}): void;
			/** 场景切换前事件 */
			beforeSceneSwitch(event: {
				/** 当前场景 */
				currSceneStr: string;
				/** 下个场景 */
				nextSceneStr: string;
			}): void;
			/** 场景切换后事件 */
			afterSceneSwitch(event: {
				/** 当前场景 */
				currSceneStr: string;
				/** 上个场景 */
				preSceneStr: string;
			}): void;
		}
	}

	declare namespace MKDataSharer_ {
		interface Api<T extends Object, T2 = keyof T> {
			/**
			 * 原始数据
			 * @remarks
			 * 可用于数据监听
			 */
			source: T;
			/** 数据键 */
			key: {
				[k in keyof T]: k;
			};
			/**
			 * 请求数据
			 * @param key_ 数据键
			 * @remarks
			 * 用于等待指定数据 set
			 */
			request(key_: T2): Promise<T[T2]>;
			/**
			 * 重置数据
			 */
			reset(): void;
		}
	}

	/**
	 * 动态模块
	 * @noInheritDoc
	 * @remarks
	 * 更优雅的使用动态模块，不必每次 await import(...)
	 */
	declare class MKDynamicModule extends InstanceBase {
		/**
		 * 获取模块默认导出
		 * @param module_ 动态模块
		 * @returns
		 */
		default<T extends Promise<any>>(module_: T): Awaited<T>["default"];
		/**
		 * 获取模块所有导出
		 * @param module_ 动态模块
		 * @returns
		 */
		all<T extends Promise<any>>(module_: T): Awaited<T>;
	}

	/**
	 * 游戏全局功能
	 * @noInheritDoc
	 */
	declare class MKGame extends InstanceBase {
		/** 重启中 */
		get isRestarting(): boolean;
		/** 重启中 */
		private _isRestarting;
		/** 暂停数据 */
		private _pauseDataMap;
		/**
		 * 重启游戏
		 * @remarks
		 * 请不要使用 cc.game.restart()，因为这会影响框架内的数据清理以及生命周期
		 */
		restart(): Promise<void>;
		/**
		 * 暂停节点
		 * @param node_ 目标节点
		 * @param isRecursion_ 是否递归子节点
		 */
		pause(node_: cc_2.Node, isRecursion_?: boolean): void;
		/**
		 * 恢复节点
		 * @param node_ 目标节点
		 * @param isRecursion_ 是否递归子节点
		 */
		resume(node_: cc_2.Node, isRecursion_?: boolean): void;
	}

	/**
	 * http 模块
	 * @noInheritDoc
	 * @remarks
	 *
	 * - post/get 支持
	 *
	 * - 支持任意类型的返回数据解析
	 *
	 * - 支持自定义编解码器
	 */
	declare class MKHttp extends InstanceBase {
		/** GET */
		get(urlStr_: string, config_: Partial<MKHttp_.Config>): Promise<any>;
		/** POST */
		post(urlStr_: string, config_: Partial<MKHttp_.Config>): Promise<any>;
		/** 通用方法 */
		private _open;
	}

	declare const mkHttp: MKHttp;

	declare namespace MKHttp_ {
		/** 配置信息 */
		class Config {
			constructor(init_?: Partial<Config>);
			/** 超时时间(ms) */
			timeoutNum: number;
			/** 返回数据类型 */
			returnType?: XMLHttpRequestResponseType;
			/** 编解码器 */
			codec?: CodecBase;
			/** 内容 */
			body?: Document | Blob | BufferSource | FormData | URLSearchParams | string;
			/** 标头 */
			header?: Record<string, string>;
			/**
			 * open 后回调
			 * @remarks
			 * 可在函数内注册回调，设置请求数据
			 */
			openCallbackFunc?: (http: XMLHttpRequest) => void;
		}
	}

	/**
	 * 多语言组件基类
	 * @noInheritDoc
	 */
	declare abstract class MKLanguageBase extends LifeCycle {
		/** 模糊匹配类型 */
		isFuzzyMatchType: boolean;
		/** 类型 */
		get typeStr(): string;
		set typeStr(valueStr_: string);
		/** 类型 */
		get type(): number;
		set type(value_: number);
		/** 模糊匹配语言标识 */
		isFuzzyMatchMark: boolean;
		/** 语言标识 */
		get markStr(): string;
		set markStr(valueStr_: string);
		/** 语言标识枚举 */
		get markEnum(): number;
		set markEnum(value_: number);
		/** 类型 */
		protected _typeStr: string;
		/** 语言标识 */
		protected _markStr: string;
		protected _isUseLayer: boolean;
		/** 当前类型数据 */
		protected _data?: Language_.TypeDataStruct;
		/** 标记枚举数据 */
		protected _markEnum?: any;
		/** 更新内容 */
		protected abstract _updateContent(): void;
		/** 更新标记 */
		protected abstract _updateMark(): void;
		/** 设置类型 */
		protected abstract _setType(valueNum_: number): void;
		/** 设置类型字符串 */
		protected abstract _setTypeStr(valueStr_: string): void;
		/** 重置数据 */
		protected abstract _resetData(): void;
		protected create(): void | Promise<void>;
		protected open(): void | Promise<void>;
		close(): void | Promise<void>;
		/** 初始化数据 */
		protected _initData(): void;
		/** 初始化事件 */
		protected _initEvent(isInit_: boolean): void;
		/** 设置标识 */
		protected _setMark(valueStr_: string): void;
		protected _setMarkStr(valueStr_: string): void;
		protected _onSwitchLanguage(): void;
	}

	/**
	 * 多语言文本
	 * @noInheritDoc
	 */
	declare class MKLanguageLabel extends MKLanguageBase {
		/** 类型数组 */
		private static _typeStrList;
		/** 注册类型 */
		private static _typeEnum;
		/** label 适配 */
		isDirectionAdaptation: boolean;
		get type(): number;
		set type(value_: number);
		/** 参数 */
		get argsStrList(): string[];
		set argsStrList(valueStrList_: string[]);
		protected _typeStr: string;
		private _argsStrList;
		/** label组件 */
		private _label;
		protected onEnable(): void;
		protected onDisable(): void;
		/** 重置数据 */
		protected _resetData(): void;
		protected _updateContent(): void;
		protected _updateMark(): void;
		protected _setType(value_: number): void;
		protected _setTypeStr(valueStr_: string): void;
		protected _initData(): void;
		/** 方向适配 */
		private _directionAdaptation;
		/** 初始化组件 */
		private _initComponent;
		/** 更新编辑器 */
		private _updateEditor;
		private _setArgsStrList;
		protected _onSwitchLanguage(): void;
		private _onLabelDataChange;
	}

	/**
	 * 多语言管理器
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 多语言资源单位为模块，防止无用多语言资源堆积
	 *
	 * - 支持多语言(文本/图片/节点)，三种方式满足任何需求
	 *
	 * - 支持编辑器预览
	 */
	declare class MKLanguageManage extends InstanceBase {
		/** 事件 */
		event: EventTarget_2<_MKLanguageManage.EventProtocol>;
		/** 文本数据 */
		labelDataTab: Record<_MKLanguageManage.TypeType, Language_.TypeDataStruct>;
		/** 纹理数据 */
		textureDataTab: Record<_MKLanguageManage.TypeType, Language_.TypeDataStruct>;
		/** 当前语言类型 */
		get typeStr(): keyof typeof GlobalConfig.Language.typeTab;
		set typeStr(value_: keyof typeof GlobalConfig.Language.typeTab);
		/** 获取语言数据 */
		get data(): GlobalConfig.Language.TypeData;
		/** 日志 */
		private _log;
		/** 当前语言类型 */
		private _languageStr;
		/**
		 * 获取文本
		 * @param type_ 类型
		 * @param markStr_ 标识
		 * @param config_ 配置
		 * @returns
		 */
		getLabel(type_: _MKLanguageManage.TypeType, markStr_: string, config_?: Partial<Language_.LabelConfig>): string;
		/**
		 * 获取纹理
		 * @param type_ 类型
		 * @param markStr_ 标记
		 * @param target_ 跟随释放对象
		 * @param language_ 语言
		 * @returns
		 */
		getTexture(
			type_: _MKLanguageManage.TypeType,
			markStr_: string,
			target_: Asset_.TypeFollowReleaseObject,
			language_?: keyof typeof GlobalConfig.Language.typeTab
		): Promise<cc_2.SpriteFrame | null>;
		/**
		 * 添加文本数据
		 * @param type_ 类型
		 * @param data_ 数据
		 */
		addLabel(type_: _MKLanguageManage.TypeType, data_: Language_.TypeDataStruct): void;
		/**
		 * 添加纹理数据
		 * @param type_ 类型
		 * @param data_ 数据
		 */
		addTexture(type_: _MKLanguageManage.TypeType, data_: Language_.TypeDataStruct): void;
		private _setTypeStr;
	}

	declare namespace _MKLanguageManage {
		/** 多语言类型类型 */
		type TypeType = string | number;
		/** 事件协议 */
		interface EventProtocol {
			/** 切换语言 */
			switchLanguage(): void;
			/** 文本数据变更 */
			labelDataChange(): void;
			/** 纹理数据变更 */
			textureDataChange(): void;
		}
	}

	/**
	 * 多语言节点
	 * @noInheritDoc
	 */
	declare class MKLanguageNode extends LifeCycle {
		/** 语言 */
		languageStr: keyof typeof GlobalConfig.Language.typeTab;
		/** 语言 */
		get language(): number;
		set language(valueNum_: number);
		/** 当前语言节点 */
		private get _node();
		private set _node(value);
		/** 语言节点列表 */
		nodeList: _MKLanguageNode.Node[];
		/** layout 适配 */
		isLayoutAdaptation: boolean;
		/** 当前语言节点 */
		get currentNode(): cc_2.Node | null;
		protected _isUseLayer: boolean;
		private _layout;
		protected create(): void | Promise<void>;
		protected open(): void | Promise<void>;
		/** 更新节点展示 */
		private _updateView;
		private _onSwitchLanguage;
	}

	declare namespace _MKLanguageNode {
		const languageTypeEnum: any;
		class Node {
			constructor(init_?: Partial<Node>);
			/** 语言 */
			get language(): number;
			set language(valueNum_: number);
			/** 语言 */
			languageStr: keyof typeof GlobalConfig.Language.typeTab;
			/** 节点 */
			node: cc_2.Node;
		}
	}

	/**
	 * 多语言图片
	 * @noInheritDoc
	 */
	declare class MKLanguageTexture extends MKLanguageBase {
		/** 类型数组 */
		private static _typeStrList;
		/** 注册类型 */
		private static _typeEnum;
		get type(): number;
		set type(valueNum_: number);
		protected _typeStr: string;
		/** sprite组件 */
		private _sprite;
		/** 初始纹理 */
		private _initialSpriteFrame;
		protected onEnable(): void;
		protected onDisable(): void;
		/** 重置数据 */
		protected _resetData(): void;
		protected _updateContent(): Promise<void>;
		protected _updateMark(): void;
		protected _setType(value_: number): void;
		protected _setTypeStr(valueStr_: string): void;
		protected _initData(): void;
		/** 初始化组件 */
		private _initComponent;
		private _onTextureDataChange;
	}

	declare namespace _MKLifeCycle {
		/** 运行状态 */
		enum RunState {
			/** 等待打开 */
			WaitOpen = 1,
			/** 打开中 */
			Opening = 2,
			/** 打开 */
			Open = 4,
			/** 关闭中 */
			Closing = 8,
			/** 关闭 */
			Close = 16,
		}
		/** 递归 open 配置 */
		interface RecursiveOpenConfig {
			/** 递归目标节点 */
			target: cc_2.Node;
			/** 激活状态 */
			isActive: boolean;
		}
		/** 递归 close 配置 */
		interface RecursiveCloseConfig {
			/** 递归目标节点 */
			target: cc_2.Node;
			/** 激活状态 */
			isActive: boolean;
			/** 父模块配置 */
			parentConfig: CloseConfig;
		}
		/** create 配置 */
		interface CreateConfig {
			/** 静态模块 */
			isStatic: boolean;
		}
		/** open 配置 */
		interface OpenConfig {
			/** 首次 */
			isFirst?: boolean;
			/** 初始化数据 */
			init?: any;
		}
		/** close 配置 */
		interface CloseConfig {
			/** 首次调用 */
			isFirst?: boolean;
			/** 销毁动态子节点 */
			isDestroyChildren?: boolean;
			/** 强制关闭（无需等待模块 open 完成） */
			isForce?: boolean;
		}
	}

	/**
	 * 数据监听器（类型安全）
	 * @noInheritDoc
	 * @remarks
	 * 可以用以 mvvm 搭建及使用，注意：监听回调仅在下一帧被调用
	 */
	declare class MKMonitor extends InstanceBase {
		/** 日志管理 */
		private _log;
		/** 绑定数据图 */
		private _bindDataMap;
		/** 对象绑定数据图 */
		private _targetBindData;
		/**
		 * 监听 value_ 数据修改同步到 value2_
		 * @param value_ 对象
		 * @param key_ 键
		 * @param value2_ 对象2
		 * @param key2_ 键2
		 * @param target_ 绑定对象
		 * @returns 监听回调
		 */
		sync<T, T2 extends keyof T, T3, T4 extends keyof T3>(
			value_: T,
			key_: T2,
			value2_: T3,
			key2_: T4,
			target_?: any
		): _MKMonitor.TypeOnCallback<T[T2]> | null;
		/**
		 * 等待监听回调执行完成
		 * @param value_ 对象
		 * @param key_ 键
		 * @returns
		 */
		wait<T, T2 extends keyof T>(value_: T, key_: T2): Promise<void>;
		/**
		 * 递归监听数据更新
		 * @param value_ 监听对象
		 * @param onCallbackFunc_ on 触发回调
		 * @param target_ 绑定对象
		 */
		onRecursion(value_: any, onCallbackFunc_: _MKMonitor.TypeOnCallback<any>, target_?: any): void;
		/**
		 * 递归监听数据更新
		 * @param value_ 监听对象
		 * @param onCallbackFunc_ on 触发回调
		 * @param offCallbackFunc_ off 触发回调
		 * @param target_ 绑定对象
		 */
		onRecursion(value_: any, onCallbackFunc_: _MKMonitor.TypeOnCallback<any>, offCallbackFunc_: _MKMonitor.TypeOffCallback, target_?: any): void;
		/**
		 * 监听数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param onCallbackFunc_ on 触发回调
		 * @param target_ 绑定对象
		 */
		on<T, T2 extends keyof T>(
			value_: T,
			key_: T2,
			onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
			target_?: any
		): _MKMonitor.TypeOnCallback<T[T2]> | null;
		/**
		 * 监听数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param onCallbackFunc_ on 触发回调
		 * @param offCallbackFunc_ off 触发回调
		 * @param target_ 绑定对象
		 */
		on<T, T2 extends keyof T>(
			value_: T,
			key_: T2,
			onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
			offCallbackFunc_: _MKMonitor.TypeOffCallback,
			target_?: any
		): _MKMonitor.TypeOnCallback<T[T2]> | null;
		/**
		 * 监听单次数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param onCallbackFunc_ on 触发回调
		 * @param target_ 绑定对象
		 */
		once<T, T2 extends keyof T>(
			value_: T,
			key_: T2,
			onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
			target_?: any
		): _MKMonitor.TypeOnCallback<T[T2]> | null;
		/**
		 * 监听单次数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param onCallbackFunc_ on 触发回调
		 * @param offCallbackFunc_ off 触发回调
		 * @param target_ 绑定对象
		 */
		once<T, T2 extends keyof T>(
			value_: T,
			key_: T2,
			onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
			offCallbackFunc_: _MKMonitor.TypeOffCallback,
			target_?: any
		): _MKMonitor.TypeOnCallback<T[T2]> | null;
		/**
		 * 递归取消监听数据更新
		 * @param value_ 监听对象
		 * @param target_ 绑定目标
		 */
		offRecursion(value_: any, target_?: any): Promise<any>;
		/**
		 * 递归取消监听数据更新
		 * @param value_ 监听对象
		 * @param onCallbackFunc_ on 触发回调
		 * @param target_ 绑定目标
		 */
		offRecursion(value_: any, onCallbackFunc_: _MKMonitor.TypeOnCallback<any>, target_?: any): Promise<any>;
		/**
		 * 取消监听数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param target_ 绑定目标
		 */
		off<T, T2 extends keyof T>(value_: T, key_: T2, target_?: any): Promise<void>;
		/**
		 * 取消监听数据更新
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param onCallbackFunc_ on 触发回调
		 * @param target_ 绑定目标
		 */
		off<T, T2 extends keyof T>(value_: T, key_: T2, onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): Promise<void>;
		/**
		 * 清理对象绑定的数据
		 * @param target_ 绑定对象
		 * @returns
		 */
		clear(target_: any): null | Promise<any[]>;
		/**
		 * 启用 on 事件
		 * @param target_ 绑定对象
		 */
		enable(target_: any): void;
		/**
		 * 启用 on 事件
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param target_ 绑定对象
		 */
		enable<T, T2 extends keyof T>(value_: T, key_: T2, target_?: any): void;
		/**
		 * 启用 on 事件
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param callbackFunc_ on 触发回调
		 * @param target_ 绑定对象
		 */
		enable<T, T2 extends keyof T>(value_: T, key_: T2, callbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): void;
		/**
		 * 禁用 on 事件
		 * @param target_ 绑定对象
		 */
		disable(target_: any): void;
		/**
		 * 禁用 on 事件
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param target_ 绑定对象
		 */
		disable<T, T2 extends keyof T>(value_: T, key_: T2, target_?: any): void;
		/**
		 * 禁用 on 事件
		 * @param value_ 监听对象
		 * @param key_ 监听键
		 * @param callbackFunc_ on 触发回调
		 * @param target_ 绑定对象
		 */
		disable<T, T2 extends keyof T>(value_: T, key_: T2, callbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): void;
		/**
		 * 获取绑定数据
		 * @param value_ 数据
		 * @param key_ 键
		 * @param isCreate_ 不存在则创建
		 * @returns
		 */
		private _getBindData;
		private _off;
		/** 删除绑定数据 */
		private _delBindData;
		/** 添加对象绑定数据 */
		private _addTargetBindData;
		/** 删除对象绑定数据 */
		private _delTargetBindData;
		/** 监听数据更新 */
		private _on;
		/** 启用监听事件 */
		private _setListenerState;
	}

	declare namespace _MKMonitor {
		/** 键类型 */
		type TypeKey = PropertyKey;
		/** on 函数类型 */
		type TypeOnCallback<T> = (
			/** 新值 */
			value: T,
			/** 旧值 */
			old_value?: T,
			/** 值路径（只会在监听无键的对象类型时传递） */
			pathStr?: string
		) => any;
		/** off 函数类型 */
		type TypeOffCallback = () => any;
		/** 监听数据类型 */
		type TypeMonitorData<T> = {
			/** 监听回调 */
			onCallbackFunc: TypeOnCallback<T>;
			/** 取消监听回调 */
			offCallbackFunc?: TypeOffCallback;
			/** 绑定对象 */
			target?: any;
			/** 单次监听状态 */
			isOnce?: boolean;
			/**
			 * 禁用状态
			 * @remarks
			 * 仅用于 onCallbackFunc
			 */
			isDisabled?: boolean;
			/** 监听路径 */
			pathStr?: string;
		};
		/** 对象绑定监听数据 */
		interface TargetBindMonitorData {
			/** 绑定监听 */
			monitor?: TypeMonitorData<any>;
			/** 绑定对象 */
			target: any;
			/** 绑定键 */
			key: TypeKey;
		}
		/**
		 * 对象绑定数据
		 * @remarks
		 * 用于 clear
		 */
		interface TargetBindData {
			/** 绑定监听 */
			monitorList?: TargetBindMonitorData[];
			/**
			 * 禁用状态
			 * @remarks
			 * 仅用于 onCallbackFunc
			 */
			isDisabled?: boolean;
		}
		/** 绑定数据 */
		interface BindData {
			/** 原始描述符 */
			descriptor: PropertyDescriptor;
			/** 绑定监听 */
			monitorList?: TypeMonitorData<any>[];
			/**
			 * 禁用状态
			 * @remarks
			 * 仅用于 onCallbackFunc
			 */
			isDisabled?: boolean;
			/** 任务 */
			task?: MKStatusTask;
			/** 递归计数 */
			recursiveCountNum: number;
		}
		/** off 参数 */
		interface OffParam {
			/** on 触发回调 */
			onCallbackFunc?: TypeOnCallback<any>;
			/** 绑定目标 */
			target?: any;
			/** 数据路径 */
			pathStr?: string;
		}
	}

	/**
	 * 网络系统基类
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 支持多实例
	 *
	 * - (心跳/断线重连)支持
	 *
	 * - 网络消息接口事件化
	 *
	 * - 支持消息潮
	 *
	 * - 网络消息模拟
	 */
	declare abstract class MKNetworkBase<CT extends CodecBase = CodecBase> extends InstanceBase {
		constructor(init_?: Partial<MKNetworkBase_.InitConfig<CT>>);
		/** 网络事件 */
		event: EventTarget_2<_MKNetworkBase.EventProtocol<CT>>;
		/** 消息事件 */
		message: _MKNetworkBase.MessageEvent<CT>;
		/** 配置信息 */
		config: Readonly<MKNetworkBase_.InitConfig<CT>>;
		/** socket 状态 */
		get state(): MKNetworkBase_.Status;
		/** 编解码器 */
		get codec(): CT | undefined;
		set codec(value_: CT | undefined);
		/** socket */
		protected abstract _socket: any;
		/** 日志 */
		protected _log: Logger;
		/** socket 状态 */
		protected _state: MKNetworkBase_.Status;
		/** 地址 */
		protected _addrStr: string;
		/* Excluded from this release type: _isWriteSleep2 */
		/** 写入队列 */
		protected _writeList: any[];
		/** 重连计数 */
		private _reconnectCountNum;
		/** 重连定时器 */
		private _reconnectTimer;
		/** 发送定时器 */
		private _sendTimer;
		/** 等待任务表 */
		private _waitTaskMap;
		/** 写睡眠状态 */
		private get _isWriteSleep();
		private set _isWriteSleep(value);
		/** 重置 socket */
		protected abstract _resetSocket(): void;
		/** 连接 */
		connect(addrStr_: string): Promise<void>;
		/** 断开 */
		close(): void;
		/* Excluded from this release type: _send */
		/* Excluded from this release type: _wait */
		/** socket 准备完成 */
		protected _open(event_: any): void;
		/** socket 消息 */
		protected _message(event_: any): Promise<void>;
		/** socket 错误 */
		protected _error(event_: any): void;
		/** socket 关闭 */
		protected _close(event_: any): void;
		/** 定时发送 */
		protected _timerSend(): Promise<void>;
		/** 定时重连 */
		protected _timerReconnect(): void;
		/**
		 * 取消重连
		 * @param isStatus_ 成功 | 失败
		 * @returns
		 */
		protected _cancelReconnect(isStatus_: boolean): void;
		/**
		 * 触发等待任务
		 * @param data_ 收到的消息
		 * @returns
		 */
		protected _triggerWaitTask(data_: any): void;
		/** 初始化心跳 */
		protected _startHeartbeat(): void;
		protected _setIsWriteSleep(value_: boolean): void;
		protected _onRestart(): void;
	}

	declare namespace _MKNetworkBase {
		/** 从 T 中排除 null, undefined, void */
		type TypeNonVoid<T> = T extends null | undefined | void ? never : T;
		/** 消息协议 */
		interface EventProtocol<T extends CodecBase = CodecBase> {
			/** 网络连接 */
			open(): void;
			/**
			 * 网络断开
			 * @param event socket 事件
			 */
			close(event: any): void;
			/** 重连成功 */
			reconnectSuccess(): void;
			/** 重连失败 */
			reconnectFail(): void;
			/**
			 * 心跳超时
			 * @remarks
			 * 在接收心跳超时时通知
			 */
			heartbeatTimeout(): void;
			/**
			 * 收到任意消息
			 * @param data 收到的消息
			 */
			recv(data: TypeNonVoid<ReturnType<T["decode"]>>): void;
		}
		/** 消息事件 */
		class MessageEvent<CT extends CodecBase = CodecBase> extends cc_2.EventTarget {
			constructor(network_: MKNetworkBase);
			/** 网络实例 */
			private _network;
			/** 日志 */
			private _log;
			on<T extends cc_2.Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
				type_: T,
				callback_: T2,
				this_?: any,
				isOnce_?: boolean
			): typeof callback_ | null;
			once<T extends cc_2.Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
				type_: T,
				callback_: T2,
				this_?: any
			): typeof callback_ | null;
			off<T extends cc_2.Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
				type_: T,
				callback_?: T2,
				this_?: any
			): void;
			/**
			 * 派发事件
			 * @param data_ 消息数据
			 * @remarks
			 * 接收消息后派发，可用此接口模拟数据
			 */
			emit<T extends GlobalConfig.Network.ProtoHead>(data_: T): void;
			/**
			 * 派发事件
			 * @param type_ 消息号
			 * @param data_  消息数据
			 * @remarks
			 * 接收消息后派发，可用此接口模拟数据
			 */
			emit<T extends string | number>(type_: T, data_: any): void;
			/**
			 * 发送
			 * @param data_ 发送数据
			 * @returns
			 */
			send<T = Parameters<CT["encode"]>[0]>(data_: T): void;
			/**
			 * 请求
			 * @param data_ 发送数据
			 * @param timeoutMsNum_ 超时时间，-1：不设置，0-n：不填则为初始化配置中的 wait_timeout_ms_n
			 * @returns
			 * @remarks
			 * 等待事件回调返回
			 */
			request<T extends Parameters<CT["encode"]>[0]>(data_: T, timeoutMsNum_?: number): Promise<any> | null;
			has<T extends cc_2.Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
				type_: T,
				callback_?: T2,
				target_?: any
			): boolean;
			clear(): void;
		}
		{
		}
	}

	declare namespace MKNetworkBase_ {
		/** 状态类型 */
		enum Status {
			/** 连接中 */
			Connecting = 0,
			/** 已连接 */
			Open = 1,
			/** 关闭中 */
			Closing = 2,
			/** 已关闭 */
			Closed = 3,
		}
		/** 初始化配置 */
		class InitConfig<CT extends CodecBase = CodecBase> {
			constructor(init_?: Partial<InitConfig<CT>>);
			/** 编解码器 */
			codec?: CT;
			/**
			 * 发送间隔
			 * @remarks
			 * 单位：毫秒
			 */
			sendIntervalMsNum: number;
			/**
			 * 重连间隔
			 * @remarks
			 * 单位：毫秒
			 */
			reconnectIntervalMsNum: number;
			/** 最大重连次数 */
			maxReconnectNum: number;
			/**
			 * 等待消息超时时间
			 * @remarks
			 * 单位：毫秒
			 */
			waitTimeoutMsNum: number;
			/** 心跳配置 */
			heartbeatConfig?: {
				/**
				 * 发送间隔
				 * @remarks
				 * 单位：毫秒
				 */
				intervalMsN?: number;
				/**
				 * 超时时间
				 * @remarks
				 * 单位：毫秒
				 */
				timeoutMsN: number;
				/**
				 * 初始化
				 * @param doneFunc 接收到心跳后手动调用，server -> client，用于心跳超时检测
				 * @returns 返回心跳数据的函数，client -> server，不为空则向服务器定时发送
				 */
				initFunc(doneFunc: () => void): null | (() => any);
			};
			/**
			 * 解析消息 id
			 * @param data 接收的消息
			 * @returns 消息号
			 */
			parseMessageIdFunc(data: any): string | number;
			/**
			 * 解析消息序列号
			 * @param data 接收的消息
			 * @returns 消息序列号
			 */
			parseMessageSequenceFunc(data: any): string | number | undefined;
		}
		/** 发送潮 */
		class SendTide<CT extends CodecBase = CodecBase> {
			/**
			 * @param network_ 网络实例
			 * @param intervalMsN_ 发送间隔
			 *
			 * - -1：手动触发
			 *
			 * - 0-n：自动发送间隔毫秒
			 */
			constructor(network_: MKNetworkBase, intervalMsN_: number);
			/** 网络节点 */
			private _network;
			/**
			 * 发送间隔
			 * @remarks
			 *
			 * - -1：手动触发
			 *
			 * - \>0：自动发送间隔毫秒
			 */
			private _sendIntervalMsNum;
			/** 消息列表 */
			private _messList;
			/** 发送倒计时 */
			private _sendTimer;
			/** 发送 */
			send(data_: Parameters<CT["encode"]>[0]): void;
			/** 触发发送 */
			trigger(): void;
			/** 清理所有未发送消息 */
			clear(): void;
			private _onRestart;
		}
	}

	declare namespace _MKObjectPool {
		/** 配置 */
		class Config<CT> {
			constructor(init_?: Config<CT>);
			/** 返回新对象 */
			createFunc: () => CT | Promise<CT>;
			/**
			 * 重置对象
			 * @remarks
			 * 在 create_f 后以及 put 时调用
			 */
			resetFunc?: (object: CT, create_b: boolean) => CT | Promise<CT>;
			/** 释放回调 */
			clearFunc?: (objectList: CT[]) => void | Promise<void>;
			/** 销毁回调 */
			destroyFunc?: () => void | Promise<void>;
			/**
			 * 最小保留数量
			 * @remarks
			 * 池内对象小于此数量时扩充
			 */
			minHoldNum?: number | undefined;
			/**
			 * 最大保留数量
			 * @remarks
			 * 可节省内存占用，-1为不启用
			 * @defaultValue
			 * -1
			 */
			maxHoldNum?: number | undefined;
			/**
			 * 初始化扩充数量
			 * @defaultValue
			 * 0
			 */
			initFillNum?: number | undefined;
		}
		/** 同步模块 */
		namespace Sync {
			/** 配置 */
			class Config<CT> {
				constructor(init_?: Config<CT>);
				/** 返回新对象 */
				createFunc: () => CT;
				/**
				 * 重置对象
				 * @remarks
				 * 在 create_f 后以及 put 时调用
				 */
				resetFunc?: (object: CT, create_b: boolean) => CT;
				/** 释放回调 */
				clearFunc?: (objectList: CT[]) => void;
				/** 销毁回调 */
				destroyFunc?: () => void;
				/**
				 * 最小保留数量
				 * @remarks
				 * 池内对象小于此数量时扩充
				 */
				minHoldNum?: number | undefined;
				/**
				 * 最大保留数量
				 * @remarks
				 * 可节省内存占用，-1为不启用
				 * @defaultValue
				 * -1
				 */
				maxHoldNum?: number | undefined;
				/**
				 * 初始化扩充数量
				 * @defaultValue
				 * 0
				 */
				initFillNum?: number | undefined;
			}
		}
	}

	/**
	 * 状态任务（类型安全）
	 * @remarks
	 * 封装 promise，防止重复调用 resolve 函数报错以及添加超时功能，可重复使用
	 */
	declare class MKStatusTask<CT = void> {
		/**
		 * @param isFinish_ 完成状态
		 * @param initConfig_ 初始化配置
		 */
		constructor(isFinish_: boolean, initConfig_?: MKStatusTask_.InitConfig<CT>);
		/** 异步任务 */
		task: Promise<CT>;
		/**
		 * 完成状态
		 * @remarks
		 *
		 * - true：任务结束
		 *
		 * - false：任务进行中
		 */
		get isFinish(): boolean;
		/** 完成状态 */
		private _isFinish;
		/** 完成回调 */
		private _finishFunc;
		/** 初始化配置 */
		private _initConfig?;
		/** 超时倒计时 */
		private _timeoutTimer;
		/**
		 * 完成任务
		 * @param isFinish_ 完成状态
		 */
		finish<T extends false>(isFinish_: T): void;
		/**
		 * 完成任务
		 * @param isFinish_ 完成状态
		 * @param data_ 完成数据
		 */
		finish<T extends true>(isFinish_: T, data_: CT): void;
		/** 重置 */
		private _reset;
	}

	declare namespace MKStatusTask_ {
		/** 初始化配置 */
		interface InitConfig<T> {
			/** 超时时间 */
			timeoutMsNum?: number;
			/** 超时返回数据 */
			timeoutReturn?: T;
		}
	}

	declare namespace MKStorage_ {
		interface InitConfig<CT extends Object> {
			/** 存储器名 */
			nameStr?: string;
			/** 存储数据 */
			data: CT;
			/** 编解码器 */
			codec?: CodecBase;
			/** 写入间隔（毫秒） */
			writeIntervalMsNum?: number;
		}
	}

	/**
	 * 任务管线
	 * @remarks
	 * 顺序执行任务
	 */
	declare class MKTaskPipeline {
		/** 事件 */
		event: EventTarget_2<_MKTaskPipeline.EventProtocol>;
		/** 执行间隔（毫秒） */
		intervalMsNum: number;
		/** 暂停状态 */
		get isPause(): boolean;
		set isPause(value_: boolean);
		/** 执行状态 */
		private _isRun;
		/** 暂停状态 */
		private _isPause;
		/** 任务列表 */
		private _taskList;
		/**
		 * 添加任务
		 * @param taskFunc_ 任务函数
		 * @returns 当前任务 Promise
		 */
		add(taskFunc_: Function): Promise<void>;
		/**
		 * 清空任务
		 * @param isFinish_ 完成所清空的任务
		 */
		clear(isFinish_: boolean): void;
		/** 执行任务 */
		private _run;
	}

	declare namespace _MKTaskPipeline {
		/** 事件协议 */
		interface EventProtocol {
			/** 执行完成 */
			completed(): void;
		}
		/** 任务数据 */
		interface TaskData {
			/** 执行函数 */
			taskFunc: Function;
			/** 状态任务 */
			task: MKStatusTask;
		}
	}

	/**
	 * 模块管理器
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 支持模块(注册/打开/获取/关闭/取消注册)
	 *
	 * - 内置模块对象池
	 *
	 * - 模块栈
	 *
	 * - 全屏 UI 展示优化
	 */
	declare class MKUIManage extends InstanceBase {
		constructor();
		/** 事件 */
		event: EventTarget_2<_MKUIManage.EventProtocol>;
		/**
		 * 获取模块注册数据
		 * @remarks
		 * open 未注册模块时会使用此函数获取注册数据自动注册
		 */
		getRegisDataFunc?: <T extends cc_2.Constructor<ViewBase>>(key: T) => UIManage_.RegisData<T>;
		/** 日志 */
		private _log;
		/** 模块注册表 */
		private _uiRegisMap;
		/**
		 * 模块注册任务表
		 * @remarks
		 * 用于 open 时等待注册
		 */
		private _uiRegisTaskMap;
		/**
		 * 模块加载表
		 * @remarks
		 * 用于检测重复加载
		 */
		private _uiLoadMap;
		/** 模块对象池 */
		private _uiPoolMap;
		/** 隐藏模块列表长度 */
		private _uiHiddenLengthN;
		/** 模块隐藏集合 */
		private _uiHiddenSet;
		/** 当前展示模块列表 */
		private _uiShowList;
		/** 当前模块表 */
		private _uiMap;
		/**
		 * 注册模块
		 * @param key_ 模块键
		 * @param source_ 模块来源
		 * @param target_ 跟随释放对象
		 * @param config_ 模块配置
		 * @returns
		 */
		regis<T extends cc_2.Constructor<ViewBase>>(
			key_: T,
			source_: _MKUIManage.TypeRegisSource<T>,
			target_: Release_.TypeFollowReleaseObject<Release_.TypeReleaseCallBack> | null,
			config_?: Partial<UIManage_.RegisConfig<T>>
		): Promise<void>;
		/**
		 * 取消注册模块
		 * @remarks
		 * 注意如果你如果在注册时 target_ 参数不为 null，那么模块资源将跟随 target_ 对象释放，
		 * 除非你想提前释放，否则不用手动调用此接口
		 * @param key_ 模块键
		 * @returns
		 */
		unregis<T extends cc_2.Constructor<ViewBase>>(key_: T): Promise<void>;
		/** 获取所有模块 */
		get(): ReadonlyArray<ViewBase>;
		/**
		 * 获取指定模块
		 * @param key_ 模块键
		 * @param type_ 模块类型
		 */
		get<T extends UIManage_.TypeOpenKey, T2 = _MKUIManage.TypeModule<T>, T3 = T["prototype"]>(key_: T, type_?: T2): T3 | null;
		/**
		 * 获取指定模块列表
		 * @param key_ 模块键列表 [type]
		 * @param type_ 模块类型
		 */
		get<T extends UIManage_.TypeOpenKey, T2 = _MKUIManage.TypeModule<T>, T3 = T["prototype"]>(key_: T[], type_?: T2): ReadonlyArray<T3>;
		/**
		 * 打开模块
		 * @param key_ 模块键，必须经过 {@link regis} 接口注册过
		 * @param config_ 打开配置
		 * @returns
		 */
		open<T extends UIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, config_?: UIManage_.OpenConfig<T>): Promise<T2 | null>;
		/**
		 * 关闭模块
		 * @param args_ 节点/模块键/模块实例
		 * @param config_ 关闭配置
		 * @returns
		 */
		close<T extends cc_2.Constructor<ViewBase>, T2 extends ViewBase>(
			args_: cc_2.Node | T | T2,
			config_?: UIManage_.CloseConfig<T>
		): Promise<boolean>;
		private _eventRestart;
	}

	declare namespace _MKUIManage {
		/** 模块类型 */
		type TypeModule<T extends cc_2.Constructor<ViewBase>> = T["prototype"]["type_s"] | "default";
		/** 注册资源类型 */
		type TypeRegisSource<T extends cc_2.Constructor<ViewBase>> =
			| cc_2.Prefab
			| string
			| cc_2.Node
			| (T extends cc_2.Constructor<ViewBase> ? Record<TypeModule<T>, cc_2.Prefab | string | cc_2.Node> : never);
		interface EventProtocol {
			/** open 模块成功后 */
			open<T extends UIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, module_: T2): void;
			/** close 模块成功后 */
			close<T extends UIManage_.TypeOpenKey, T2 = T["prototype"]>(key_: T, module_: T2): void;
		}
	}

	declare namespace _MKViewBase {
		/** create 配置 */
		interface CreateConfig extends _MKLifeCycle.CreateConfig {
			/** 模块类型 */
			typeStr: string;
		}
		/** 动画配置 */
		class AnimationConfig {
			/** 动画枚举表 */
			static animationEnumTab: {
				/** 打开动画 */
				open: Record<string | number, string | number>;
				/** 关闭动画 */
				close: Record<string | number, string | number>;
			};
			/* Excluded from this release type: openAnimationNum */
			/* Excluded from this release type: openAnimationNum */
			/* Excluded from this release type: closeAnimationNum */
			/* Excluded from this release type: closeAnimationNum */
			/** 打开动画 */
			openAnimationStr: string;
			/** 关闭动画 */
			closeAnimationStr: string;
		}
	}

	/**
	 * 通用 websocket
	 * @noInheritDoc
	 */
	declare class MKWebsocket<CT extends CodecBase = CodecBase> extends MKNetworkBase<CT> {
		constructor(config_?: Partial<MKWebsocket_.InitConfig<CT>>);
		config: Readonly<MKWebsocket_.InitConfig<CT>>;
		protected _socket: WebSocket;
		/** 重置socket */
		protected _resetSocket(): void;
	}

	declare namespace MKWebsocket_ {
		class InitConfig<CT extends CodecBase = CodecBase> extends MKNetworkBase_.InitConfig<CT> {
			constructor(init_?: Partial<InitConfig<CT>>);
			/** 通信类型 */
			binaryType: "blob" | "arraybuffer";
			/** 协议 */
			protocolStrList: string[];
		}
	}

	/**
	 * 微信 websocket
	 * @noInheritDoc
	 */
	declare class MKWebsocketWX<CT extends CodecBase = CodecBase> extends MKNetworkBase<CT> {
		constructor(config_?: Partial<mk_websocket_wx_.InitConfig<CT>>);
		config: Readonly<mk_websocket_wx_.InitConfig<CT>>;
		protected _socket: wx.SocketTask;
		/** 重置socket */
		protected _resetSocket(): void;
	}

	export declare const monitor: MKMonitor;

	export declare abstract class MVCControlBase<CT extends MVCModelBase = MVCModelBase, CT2 extends MVCViewBase<CT> = MVCViewBase<CT>> {
		constructor();
		get model(): _MVCControlBase.TypeRecursiveReadonly<Omit<CT, "open" | "close">>;
		protected _model: CT;
		protected _view: _MVCControlBase.TypeView<CT2>;
		private _openTask;
		private _closeTask;
		/**  */
		close(isExternalCall_?: boolean): void;
		protected open?(): void;
		private _lastClose;
	}

	declare namespace _MVCControlBase {
		/** 递归只读 */
		type TypeRecursiveReadonly<T> = {
			readonly [P in keyof T]: T[P] extends Function ? T[P] : TypeRecursiveReadonly<T[P]>;
		};
		/** 函数属性的键 */
		type TypeFunctionKeys<T> = {
			[P in keyof T]: T[P] extends Function | void ? P : P extends "event" ? P : never;
		}[keyof T];
		/** 视图类型（防止直接操作视图对象属性） */
		type TypeView<T> = Omit<Pick<T, TypeFunctionKeys<T>>, Exclude<keyof MVCViewBase, "event">>;
		{
		}
	}

	export declare abstract class MVCModelBase {
		constructor();
		/**
		 * 重置 data
		 * @remarks
		 * close 后重置 this.data，data 必须为 class 类型
		 */
		protected _isResetData: boolean;
		/** 创建模型实例 */
		static new<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): Promise<InstanceType<T>>;
		open?(): void;
		close(): void;
	}

	export declare abstract class MVCViewBase<CT extends MVCModelBase = MVCModelBase> extends ViewBase {
		/** 视图事件 */
		event: EventTarget_2<any>;
		/** 数据访问器 */
		protected _model: _MVCViewBase.TypeRecursiveReadonlyAndNonFunctionKeys<CT>;
		/** 视图构造函数，由继承类型实现并被 control 访问 */
		static new?<T extends new (...argsList: any[]) => any>(this: T): Promise<InstanceType<T> | null>;
	}

	declare namespace _MVCViewBase {
		/** 递归只读 */
		type TypeRecursiveReadonly<T> = {
			readonly [P in keyof T]: T[P] extends Function ? T[P] : TypeRecursiveReadonly<T[P]>;
		};
		/** 排除函数属性的对象键 */
		type TypeNonFunctionKeys<T> = {
			[P in keyof T]: T[P] extends Function | void ? never : P;
		}[keyof T];
		/** 递归只读且无函数 */
		type TypeRecursiveReadonlyAndNonFunctionKeys<T> = TypeRecursiveReadonly<Pick<T, TypeNonFunctionKeys<T>>>;
		{
		}
	}

	export declare function N(node_: cc_2.Node, isForce_?: boolean): NodeExtends;

	export declare namespace N {
		/** 清理节点数据 */
		export function clear(): void;
	}

	declare namespace Network {
		export {
			MKWebsocket as Websocket,
			MKWebsocket_ as Websocket_,
			MKWebsocketWX as WebsocketWX,
			mkHttp as http,
			MKHttp_ as Http_,
			MKNetworkBase as Base,
			MKNetworkBase_ as Base_,
		};
	}
	export { Network };

	declare class NodeExtends {
		constructor(node_: cc_2.Node);
		/** 节点扩展数据 */
		static nodeExtendsMap: Map<cc_2.Node, NodeExtends>;
		/** 渲染顺序更新倒计时 */
		static orderUpdateTimer: any;
		/** 全局配置 */
		private static _config;
		/** 渲染顺序更新时间 */
		private static _orderUpdateTimeNum;
		/** 更新任务 */
		private static _orderUpdateTaskFuncList;
		label: cc_2.Label;
		sprite: cc_2.Sprite;
		transform: cc_2.UITransform;
		animation: cc_2.Animation;
		editBox: cc_2.EditBox;
		richText: cc_2.RichText;
		layout: cc_2.Layout;
		progressBar: cc_2.ProgressBar;
		slider: cc_2.Slider;
		toggle: cc_2.Toggle;
		/** 节点渲染次序 */
		get orderNum(): number;
		set orderNum(valueNum_: number);
		/** 宽 */
		get width(): number;
		set width(valueNum_: number);
		/** 高 */
		get height(): number;
		set height(valueNum_: number);
		/** 透明度 */
		get opacity(): number;
		set opacity(valueNum_: number);
		/** 锚点 */
		get anchor(): Readonly<cc_2.Vec2>;
		set anchor(valueV2_: cc_2.Vec2);
		/** 持有节点 */
		private _node;
		/** 节点渲染次序 */
		private _orderNum;
		/** 节点渲染次序更新时间 */
		private _orderTimestampNum;
		/** 透明度组件 */
		private _uiOpacity;
		private _onNodeParentChanged;
		private _setOrderNum;
	}

	/** 异步对象池 */
	export declare class ObjectPool<CT> {
		constructor(init_: _MKObjectPool.Config<CT>);
		/** 初始化数据 */
		config: _MKObjectPool.Config<CT>;
		/** 初始化任务 */
		initTask: MKStatusTask<void>;
		/** 有效状态 */
		get isValid(): boolean;
		/** 有效状态 */
		private _isValid;
		/** 对象存储列表 */
		private _objectList;
		/**
		 * 导入对象
		 * @param object_ 添加对象
		 * @returns
		 */
		put(object_: any): Promise<void>;
		/** 同步获取对象 */
		getSync(): CT | null;
		/** 获取对象 */
		get(): Promise<CT>;
		/** 清空数据 */
		clear(): Promise<void>;
		/**
		 * 销毁对象池
		 * @remarks
		 * 销毁后将无法 get/put
		 */
		destroy(): Promise<void>;
		/** 添加对象 */
		private _add;
		/** 删除对象 */
		private _del;
	}

	export declare namespace ObjectPool {
		/** 同步对象池 */
		export class Sync<CT> {
			constructor(init_?: _MKObjectPool.Sync.Config<CT>);
			/** 初始化数据 */
			config: _MKObjectPool.Sync.Config<CT>;
			/** 有效状态 */
			get isValid(): boolean;
			/** 有效状态 */
			private _isValid;
			/** 对象存储列表 */
			private _objectList;
			/** 导入对象 */
			put(object_: CT): void;
			/** 获取对象 */
			get(): CT;
			/** 清空数据 */
			clear(): void;
			/**
			 * 销毁对象池
			 * @remarks
			 * 销毁后将无法 get/put
			 */
			destroy(): void;
			/** 添加对象 */
			private _add;
			/** 删除对象 */
			private _del;
		}
	}

	/**
	 * 多边形遮罩
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 多边形图片遮罩
	 *
	 * - 多边形触摸屏蔽
	 */
	export declare class PolygonMask extends cc_2.Component {
		/** 遮罩组件 */
		mask: cc_2.Mask | null;
		/** 屏蔽触摸 */
		isShieldTouch: boolean;
		/** 跟踪节点 */
		get trackNode(): cc_2.Node;
		set trackNode(value_: cc_2.Node);
		/** 偏移坐标 */
		get offsetV3(): cc_2.Vec3;
		set offsetV3(valueV3_: cc_2.Vec3);
		/** 调式模式 */
		get isDebug(): boolean;
		set isDebug(value_: boolean);
		/** 跟踪节点 */
		private _trackNode;
		/** 跟踪节点初始坐标 */
		private _trackNodeStartPosV3;
		/** 调试模式 */
		private _isDebug;
		/** 调试绘图组件 */
		private _graphics?;
		/** 初始设计尺寸 */
		private _initialDesignSize;
		/** 偏移坐标 */
		private _offsetV3;
		/** 多边形本地点 */
		private _polygonLocalPointV2List;
		/** 当前多边形本地点 */
		private _currentPolygonLocalPointV2List;
		/** 多边形世界点 */
		private _polygonWorldPointV2List;
		/** 当前多边形世界点 */
		private _currentPolygonWorldPointV2List;
		/** 跟踪节点世界坐标 */
		private _trackNodeWorldPosV3;
		/** 输入事件 */
		private _inputEventList;
		/** 临时变量 */
		private _tempTab;
		protected onLoad(): void;
		protected start(): void;
		protected onEnable(): void;
		protected onDisable(): void;
		protected update(dtNum_: number): void;
		protected onDestroy(): void;
		/** 更新遮罩 */
		updateMask(): void;
		/** 更新遮罩 */
		private _updateMask;
		/** 更新调试绘制 */
		private _updateGraphics;
		/**
		 * @en Test whether the point is in the polygon
		 * @zh 测试一个点是否在一个多边形中
		 */
		private _pointInPolygon;
		private _setIsDebug;
		private _setOffsetV3;
		private _setTrackNode;
		private _onNodeInput;
		private _onGlobalResize;
	}

	/**
	 * 对象释放器
	 * @remarks
	 *
	 * - 统一 (cc.Node/cc.Asset) 资源的释放逻辑
	 *
	 * - 可以通过 function 或继承添加自定义释放逻辑
	 */
	export declare class Release {
		/** 节点集合 */
		private _nodeSet;
		/** 资源集合 */
		private _assetSet;
		/** 对象集合 */
		private _objectSet;
		/** 回调集合 */
		private _callbackSet;
		/**
		 * 释放对象
		 * @param object_ 指定对象
		 */
		static release(object_?: Release_.TypeReleaseParamType): Promise<void>;
		/**
		 * 添加释放对象
		 * @param object_ 要跟随模块释放的对象或列表
		 */
		add<T extends Release_.TypeReleaseParamType>(object_: T): T;
		/**
		 * 删除释放对象
		 * @param object_ 删除跟随模块释放的对象或列表
		 */
		delete<T extends Release_.TypeReleaseParamType>(object_: T): void;
		/**
		 * 释放对象
		 * @param object_ 指定对象
		 */
		release(object_?: Release_.TypeReleaseParamType): Promise<void>;
		/** 释放所有对象 */
		releaseAll(): Promise<void>;
	}

	export declare namespace Release_ {
		/** 释放对象类型 */
		export type TypeReleaseObject = {
			release(): any | Promise<any>;
		};
		/** 释放回调类型 */
		export type TypeReleaseCallBack = () => any | Promise<any>;
		/** 释放参数类型 */
		export type TypeReleaseParamType = cc_2.Node | cc_2.Asset | TypeReleaseObject | TypeReleaseCallBack;
		/** 跟随释放类型 */
		export type TypeFollowReleaseObject<CT = TypeReleaseParamType> = {
			/**
			 * 跟随释放
			 * @param object_ 释放对象/释放对象数组
			 */
			followRelease<T extends CT>(object_: T): T;
			/**
			 * 取消释放
			 * @param object_ 取消释放对象/取消释放对象数组
			 */
			cancelRelease<T extends CT>(object_: T): void;
		};
	}

	/**
	 * 场景驱动
	 * @noInheritDoc
	 * @remarks
	 * 场景加载完成后自动执行生命周期函数，驱动模块系统
	 */
	export declare class SceneDrive extends LifeCycle {
		private _closeTask;
		protected onLoad(): Promise<void>;
		protected onDestroy(): void;
		onBeforeSceneSwitch(): Promise<void>;
		private _onRestart;
		private _onWaitCloseScene;
	}

	/**
	 * 场景基类
	 * @remarks
	 * 继承于 mk_life_cycle，屏蔽了多余 inspector 展示
	 */
	export declare class StaticViewBase extends LifeCycle {
		protected _isUseLayer: boolean;
	}

	/**
	 * 存储器（类型安全）
	 * @noInheritDoc
	 * @remarks
	 * 注意：在未设置 name_s(存储器名) 之前，存储数据将不会被存储在硬盘，而是在内存中
	 */
	declare class Storage_2<CT extends Object> {
		constructor(init_: MKStorage_.InitConfig<CT>);
		/** 存储数据键 */
		key: {
			[k in keyof CT]: k;
		};
		/** 存储器名 */
		get nameStr(): string;
		set nameStr(valueStr_: string);
		/** 写入间隔（毫秒） */
		get writeIntervalMsNum(): number;
		set writeIntervalMsNum(valueNum_: number);
		/** 初始化配置 */
		private _initConfig;
		/** 缓存数据 */
		private _cache;
		/** 写入任务 */
		private _writePipeline;
		/** 清空所有存储器数据 */
		static clear(): void;
		/**
		 * 设置存储数据
		 * @param key_ 存储键
		 * @param data_ 存储数据
		 * @returns 成功状态
		 */
		set<T extends keyof CT, T2 extends CT[T]>(key_: T, data_: T2): boolean;
		/**
		 * 获取数据
		 * @param key_ 存储键
		 * @returns
		 */
		get<T extends keyof CT, T2 extends CT[T]>(key_: T): T2 | null;
		/**
		 * 删除数据
		 * @param key_ 存储键
		 */
		del<T extends keyof CT>(key_: T): void;
		/** 清空当前存储器数据 */
		clear(): void;
		/**
		 * 写入数据到磁盘
		 * @param keyStr_ 数据键
		 * @param dataStr_ 写入数据
		 * @returns
		 */
		private _write;
		private _setNameStr;
	}
	export { Storage_2 as Storage };

	declare namespace Task {
		export { MKStatusTask as Status, MKTaskPipeline as Pipeline };
	}
	export { Task };

	export declare const uiManage: MKUIManage;

	export declare namespace UIManage_ {
		/** 模块打开键类型 */
		export type TypeOpenKey = cc_2.Constructor<ViewBase> & Function;
		/** 关闭ui配置 */
		export class CloseConfig<CT extends cc_2.Constructor<ViewBase>> {
			constructor(init_?: CloseConfig<CT>);
			/** 类型 */
			type?: _MKUIManage.TypeModule<CT>;
			/** 关闭全部指定类型的模块 */
			isAll?: boolean;
			/** 销毁节点 */
			isDestroy?: boolean;
			/**
			 * 销毁动态子节点
			 * @defaultValue
			 * destroy_b
			 */
			isDestroyChildren?: boolean;
		}
		/** 打开ui配置 */
		export class OpenConfig<CT extends UIManage_.TypeOpenKey> {
			constructor(init_?: OpenConfig<CT>);
			/** 初始化数据 */
			init?: CT["prototype"]["initData"];
			/** 类型 */
			type?: _MKUIManage.TypeModule<CT>;
			/** 父节点 */
			parent?: cc_2.Node | null;
		}
		/** 模块注册配置 */
		export class RegisConfig<CT extends cc_2.Constructor<ViewBase>> {
			constructor(init_?: Partial<RegisConfig<CT>>);
			/**
			 * 可重复打开状态
			 * @defaultValue
			 * false
			 */
			isRepeat: boolean;
			/**
			 * 默认父节点
			 * @defaultValue
			 * Canvas 节点
			 */
			parent: cc_2.Scene | cc_2.Node | (() => cc_2.Node | null) | undefined;
			/** 加载配置 */
			loadConfig?: Asset_.GetConfig<cc_2.Prefab>;
			/**
			 * 对象池数量不足时扩充数量
			 * @defaultValue
			 * this.isRepeat ? 8 : 1
			 */
			poolMinHoldNum: number;
			/**
			 * 对象池最大保留数量
			 * @defaultValue
			 * -1: 不启用
			 */
			poolMaxHoldNum: number;
			/**
			 * 对象池初始化扩充数量
			 * @defaultValue
			 * 1
			 */
			poolInitFillNum: number;
		}
		/**
		 * 模块注册数据
		 * @noInheritDoc
		 */
		export class RegisData<CT extends cc_2.Constructor<ViewBase>> extends RegisConfig<CT> {
			constructor(init_?: Partial<RegisData<CT>>);
			/** 来源 */
			source: _MKUIManage.TypeRegisSource<CT>;
			/** 跟随释放对象 */
			target: Release_.TypeFollowReleaseObject<Release_.TypeReleaseCallBack>;
		}
	}

	/**
	 * 视图基类
	 * @noInheritDoc
	 * @remarks
	 *
	 * - 添加编辑器快捷操作
	 *
	 * - 添加弹窗动画配置
	 *
	 * - 独立展示配置
	 */
	export declare class ViewBase extends LifeCycle {
		isShowAlone: boolean;
		animationConfig: _MKViewBase.AnimationConfig;
		/* Excluded from this release type: isAutoMask */
		/* Excluded from this release type: isAutoMask */
		/* Excluded from this release type: isAutoWidget */
		/* Excluded from this release type: isAutoWidget */
		/* Excluded from this release type: isAutoBlockInput */
		/* Excluded from this release type: isAutoBlockInput */
		/**
		 * 模块类型
		 * @readonly
		 */
		typeStr: string;
		/** 模块配置 */
		set config(config_: _MKViewBase.CreateConfig);
		protected open(): void | Promise<void>;
		/**
		 * 关闭
		 * @param config_ 关闭配置
		 */
		close(config_?: Omit<UIManage_.CloseConfig<any>, "type" | "isAll">): void | Promise<void>;
		protected lateClose?(): void | Promise<void>;
		/** 初始化编辑器 */
		protected _initEditor(): void;
		private _getIsAutoMask;
		private _setIsAutoMask;
		private _setIsAutoWidget;
		private _setIsAutoBlockInput;
	}

	export declare const warn: (...argsList_: any[]) => void;

	export {};
}
export default mk;
