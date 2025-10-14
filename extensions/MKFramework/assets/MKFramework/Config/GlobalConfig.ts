import { game, Layout, Node, Size, size } from "cc";
import { DEBUG } from "cc/env";

/**
 * 全局配置
 * @internal
 */
namespace GlobalConfig {
	/** 常量 */
	export namespace Constant {
		/** 游戏版本 */
		export const versionStr = "1.0.0";
		/** 显示左下角调试信息 */
		export const isShowDebugInfo = false;
	}

	/** 音频 */
	export namespace Audio {
		/** 音频类型（小于 0 防止和其他位置定义的音频组冲突） */
		export enum Type {
			/** 音效 */
			Effect = -99,
			/** 音乐 */
			Music,
		}
	}

	/** 资源 */
	export namespace Asset {
		/** bundle 键 */
		interface Bundle {
			internal: any;
			resources: any;
			main: any;
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Config: any;
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Framework: any;
		}

		/** bundle 键 */
		export const bundle: { [k in keyof Bundle]: k } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});

		export const config = new (class {
			/** 缓存生命时长（毫秒，资源未使用时经过多久释放） */
			cacheLifetimeMsNum = 1000;
			/** 加载失败重试次数 */
			retryCountOnLoadFailureNum = 0;
		})();
	}

	/** 视图 */
	export namespace View {
		/** 视图层类型 */
		export enum LayerType {
			内容,
			窗口,
			提示,
			引导,
			警告,
			加载,
			错误,
		}

		/** 适配模式 */
		export enum AdaptationMode {
			/** 无 */
			None,
			/** 自适应（更宽定高，更高定宽） */
			Adaptive,
			/** 固定尺寸（屏幕尺寸不同大小相同） */
			FixedSize,
		}

		/** 适配类型 */
		export const adaptationType: AdaptationMode = AdaptationMode.Adaptive;
		/** 初始设计尺寸 */
		export const originalDesignSize: Omit<Readonly<Size>, "set"> = size();
		/** 阻塞警告时间（毫秒，生命周期函数执行时间超出设定值时警告，0 为关闭）
		 * @remarks
		 * 可用来排除生命周期阻塞位置，但如果节点 active 为 false 也将阻塞生命周期执行
		 */
		export const blockingWarningTimeMsNum = 0;
		/** 默认遮罩 */
		export const maskDataTab = {
			nodeNameStr: "遮罩",
			prefabPathStr: "db://assets/resources/Module/@Common/Mask/ResourcesCommonMask.prefab",
		};

		export const config = new (class {
			/** 层间隔 */
			layerSpacingNum = 100;
			/** 渲染层级刷新间隔 */
			layerRefreshIntervalMsNum = game.frameTime;
			/** 窗口打开动画 */
			windowAnimationTab: Readonly<{
				/** 打开动画 */
				open: Record<string, (value: Node) => void | Promise<void>>;
				/** 关闭动画 */
				close: Record<string, (value: Node) => void | Promise<void>>;
			}> = {
				open: {
					无: null!,
				},
				close: {
					无: null!,
				},
			};
		})();
	}

	/** 多语言配置 */
	export namespace Language {
		/** 语种表 */
		const privateTypeTab = {
			/** 中文(中华人民共和国) */
			zhCn: {
				dire: Layout.HorizontalDirection.LEFT_TO_RIGHT,
				supportStrList: ["zh", "zh-tw"],
			},
			/** 英语(美国) */
			enUs: {
				dire: Layout.HorizontalDirection.LEFT_TO_RIGHT,
				supportStrList: ["en"],
			},
		};

		/** 语种信息 */
		export interface TypeData {
			/** 文字方向（Layout.HorizontalDirection） */
			dire: number;
			/** 支持语种（sys.languageCode 的值） */
			supportStrList?: string[];
			/** 展示名称 */
			displayNameStr?: string;
		}

		/** 语种表 */
		export const typeTab: Record<keyof typeof privateTypeTab, TypeData> = privateTypeTab;

		/** 语种 */
		export const types: { [k in keyof typeof typeTab]: k } = new Proxy(
			{},
			{
				get(target, key) {
					return key;
				},
			}
		) as any;

		/** 默认语言
		 * @remarks
		 * 指定默认语言：types.xxx
		 * 自动匹配默认语言：auto，框架内根据 sys.languageCode 和 TypeData.supportStrList 匹配对应的语种
		 */
		export const defaultTypeStr: keyof typeof types | "auto" = "auto";
		/** 参数标识前缀 */
		export const argsHeadStr = "{";
		/** 参数标识后缀 */
		export const argsTailStr = "}";
	}

	/** 日志 */
	export namespace Log {
		export enum Level {
			/** 禁止所有日志输出 */
			None,
			/** 调试 */
			Debug = 1,
			/** 打印 */
			Log = 2,
			/** 警告 */
			Warn = 4,
			/** 错误 */
			Error = 8,
			/** debug 及以上 */
			DebugUp = Debug | Log | Warn | Error,
			/** log 及以上 */
			LogUp = Log | Warn | Error,
			/** warn 及以上 */
			WarnUp = Warn | Error,
		}

		/** 打印对象类型 */
		export enum LogObjectType {
			/** 框架，等级限制，打印模块限制 */
			MK,
			/** 控制台，可以跳转打印位置 */
			Console,
			/** cocos，等级限制 */
			CC,
		}

		export const config = new (class {
			/** 日志缓存行数 */
			cacheRowNum = 100;
			/** 报错日志上传地址 */
			errorUploadAddrStr = "";
			/** 日志等级 */
			levelNum = DEBUG ? Level.LogUp : Level.Error;
			/** 打印对象类型 */
			logObjectType = LogObjectType.Console;
			/** 错误处理函数 */
			errorHandlingFunc?: (...argsList: any[]) => any;
		})();
	}

	/** 网络 */
	export namespace Network {
		/** 消息头
		 * @remarks
		 * 收/发时网络消息类型时，必须包含的属性
		 */
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		export interface ProtoHead {}

		/** 消息头键 */
		export const protoHeadKeyTab: { [key in keyof ProtoHead]: key } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});
	}
}

if (DEBUG) {
	window["GlobalConfig"] = GlobalConfig;
}

export default GlobalConfig;
