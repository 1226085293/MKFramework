import * as cc from "cc";
import { DEBUG, PREVIEW } from "cc/env";

/**
 * 全局配置
 * @internal
 */
namespace global_config {
	/** 常量 */
	export namespace constant {
		/** 游戏版本 */
		export const version_s = "1.0.0";
		/** 显示左下角调试信息 */
		export const show_debug_info_b = false;
	}

	/** 音频 */
	export namespace audio {
		/** 音频类型（必须 < 0） */
		export enum type {
			/** 音效 */
			effect = -99,
			/** 音乐 */
			music,
		}
	}

	/** 资源 */
	export namespace asset {
		/** bundle 键 */
		interface bundle {
			internal: any;
			resources: any;
			main: any;
			config: any;
			framework: any;
			hot_update: any;
		}

		/** bundle 键 */
		export const bundle: { [k in keyof bundle]: k } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});

		export const config = new (class {
			/** 缓存生命时长 */
			cache_lifetime_ms_n = 1000;
		})();
	}

	/** 视图 */
	export namespace view {
		/** 视图层类型 */
		export enum layer_type {
			内容,
			窗口,
			提示,
			引导,
			警告,
			加载,
			错误,
		}

		/** 适配模式 */
		export enum adaptation_mode {
			/** 无 */
			none,
			/** 自适应（更宽定高，更高定宽） */
			adaptive,
			/** 固定尺寸（屏幕尺寸不同大小相同） */
			fixed_size,
		}

		/** 适配类型 */
		export const adaptation_type: adaptation_mode = adaptation_mode.adaptive;
		/** 初始设计尺寸 */
		export const original_design_size: Omit<Readonly<cc.Size>, "set"> = cc.size();
		/** 阻塞警告时间（毫秒，生命周期函数执行时间超出设定值时报错，0 为关闭） */
		export const blocking_warning_time_ms_n = 0;
		/** 默认遮罩 */
		export const mask_data_tab = {
			node_name_s: "遮罩",
			prefab_path_s: "db://assets/resources/module/@common/mask/resources_common_mask.prefab",
		};

		export const config = new (class {
			/** 层间隔 */
			layer_spacing_n = 100;
			/** 渲染层级刷新间隔 */
			layer_refresh_interval_ms_n = cc.game.frameTime;
			/** 窗口打开动画 */
			window_animation_tab: Readonly<{
				/** 打开动画 */
				open: Record<string, (value: cc.Node) => void | Promise<void>>;
				/** 关闭动画 */
				close: Record<string, (value: cc.Node) => void | Promise<void>>;
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
	export namespace language {
		/** 语种表 */
		const private_type_tab = {
			/** 中文(中华人民共和国) */
			zh_cn: {
				dire: cc.Layout.HorizontalDirection.LEFT_TO_RIGHT,
			},
			/** 英语(美国) */
			en_us: {
				dire: cc.Layout.HorizontalDirection.LEFT_TO_RIGHT,
			},
		};

		/** 语种信息 */
		export interface type_data {
			/** 方向（cc.Layout.HorizontalDirection） */
			dire: number;
		}

		/** 语种表 */
		export const type_tab: Record<keyof typeof private_type_tab, type_data> = private_type_tab;

		/** 语种 */
		export const type: { [k in keyof typeof type_tab]: k } = new Proxy(
			{},
			{
				get(target, key) {
					return key;
				},
			}
		) as any;

		/** 默认语言 */
		export const default_type_s: keyof typeof type_tab = type.zh_cn;
		/** 参数标识前缀 */
		export const args_head_s = "{";
		/** 参数标识后缀 */
		export const args_tail_s = "}";
	}

	/** 日志 */
	export namespace log {
		export enum level {
			/** 禁止所有日志输出 */
			none,
			/** 调试 */
			debug = 1,
			/** 打印 */
			log = 2,
			/** 警告 */
			warn = 4,
			/** 错误 */
			error = 8,
			/** debug 及以上 */
			debug_up = debug | log | warn | error,
			/** log 及以上 */
			log_up = log | warn | error,
			/** warn 及以上 */
			warn_up = warn | error,
		}

		/** 打印对象类型 */
		export enum log_object_type {
			/** 框架，等级限制，打印模块限制 */
			mk,
			/** 控制台，可以跳转打印位置 */
			console,
			/** cocos，等级限制 */
			cc,
		}

		export const config = new (class {
			/** 日志缓存行数 */
			cache_row_n = 100;
			/** 报错日志上传地址 */
			error_upload_addr_s = "";
			/** 日志等级 */
			level_n = PREVIEW ? level.debug_up : DEBUG ? level.log_up : level.error;
			/** 打印对象类型 */
			log_object_type = log_object_type.console;
			/** 错误处理函数 */
			error_handling_f?: (...args_as: any[]) => any;
		})();
	}

	/** 网络 */
	export namespace network {
		/** 消息头 */
		export interface proto_head {
			/** 消息 id */
			__id: number;
			/** 消息序列号 */
			__sequence?: number;
		}

		/** 消息头键 */
		export const proto_head_key_tab: { [key in keyof proto_head]: key } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});
	}
}

if (DEBUG) {
	window["global_config"] = global_config;
}

export default global_config;
