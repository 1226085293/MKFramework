import { EDITOR } from "cc/env";
import * as cc from "cc";
import mk_instance_base from "./mk_instance_base";
import mk_http from "./network/mk_http";
import global_config from "../@config/global_config";
// import mk_config from "./mk_config";

namespace _mk_logger {
	/** 计时日志 */
	export interface time_log {
		/** 开始时间 */
		start_time_ms_n: number;
		/** 上次毫秒 */
		last_time_ms_n: number;
	}
}

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
class mk_logger extends mk_instance_base {
	constructor(name_s_: string) {
		super();

		// 初始化数据
		this._name_s = name_s_;
		mk_logger._log_map.set(name_s_, this);

		if (EDITOR) {
			return;
		}

		// 错误监听
		if (!mk_logger._init_b) {
			mk_logger._init_b = true;

			const upload_f = (...args_as: any[]): void => {
				// 添加日志缓存
				mk_logger._add_log_cache(global_config.log.level.error, mk_log._get_log_head(global_config.log.level.error, true), args_as);

				// 上传错误日志
				if (mk_logger._config.error_upload_addr_s) {
					mk_http.post(mk_logger._config.error_upload_addr_s, {
						body: JSON.stringify(mk_logger._cache_ss),
					});

					// 清空日志缓存
					mk_logger._cache_ss.splice(0, mk_logger._cache_ss.length);
				}

				// 错误处理
				mk_logger._config.error_handling_f?.(...args_as);
			};

			if (cc.sys.isBrowser) {
				let old_handler: any;

				if (window.onerror) {
					old_handler = window.onerror;
				}

				window.onerror = function (...args_as: any[]) {
					upload_f(...args_as);
					if (old_handler) {
						old_handler(...args_as);
					}
				};
			} else if (cc.sys.isNative) {
				let old_handler: any;

				if (window["jsb"]) {
					jsb["onError"]((...args_as: any[]) => {
						upload_f(...args_as);
					});
				} else {
					if (window["__errorHandler"]) {
						old_handler = window["__errorHandler"];
					}

					window["__errorHandler"] = function (...args_as: any[]) {
						upload_f(...args_as);
						if (old_handler) {
							old_handler(...args_as);
						}
					};
				}
			}
		}
	}

	/* --------------- static --------------- */
	/** 全局配置 */
	private static _config = global_config.log.config;
	/** 初始化状态 */
	private static _init_b = false;
	/** 所有 log 对象 */
	private static _log_map = new Map<string, mk_logger>();
	/** 日志缓存 */
	private static _cache_ss: string[] = [];
	/** 唯一日志模块 */
	private static _log_only_module_ss: string[] = [];
	/** 限制日志模块 */
	private static _limit_log_module_ss: string[] = [];
	/* --------------- private --------------- */
	/** 日志模块名 */
	private _name_s!: string;
	/** 日志函数表 */
	private _log_func_tab = {
		[global_config.log.log_object_type.mk]: {
			target: this,
			debug: this.debug,
			log: this.log,
			warn: this.warn,
			error: this.error,
		},
		[global_config.log.log_object_type.console]: {
			target: console,
			debug: console.debug,
			log: console.log,
			warn: console.warn,
			error: console.error,
		},
		[global_config.log.log_object_type.cc]: {
			target: cc,
			debug: cc.debug,
			log: cc.log,
			warn: cc.warn,
			error: cc.error,
		},
	};

	/** 计时信息 */
	private _time_map = new Map<string, _mk_logger.time_log>();
	/* ------------------------------- static ------------------------------- */
	/**
	 * 只限模块打印
	 * @param module_ss_ 模块名列表
	 * @remarks
	 * 调用时会覆盖 {@link mk_logger.limit} 的规则
	 */
	static only(module_ss_: string[]): void {
		mk_logger._log_only_module_ss = module_ss_;
		mk_logger._limit_log_module_ss = [];
	}

	/**
	 * 限制模块打印
	 * @param module_ss_ 模块名列表
	 * @remarks
	 * 调用时会覆盖 {@link mk_logger.only} 的规则
	 */
	static limit(module_ss_: string[]): void {
		mk_logger._log_only_module_ss = [];
		mk_logger._limit_log_module_ss = module_ss_;
	}

	/**
	 * 添加日志缓存
	 * @param level_ 等级
	 * @param head_s_ 日志头
	 * @param args_as_ 参数
	 * @returns
	 */
	private static _add_log_cache(level_: global_config.log.level, head_s_: string, ...args_as_: any[]): void {
		if (!args_as_?.length || mk_logger._config.cache_row_n <= 0) {
			return;
		}

		/** 缓存内容 */
		let content_s = head_s_;

		// 填充参数内容
		{
			if (level_ === global_config.log.level.error) {
				args_as_.forEach((v) => {
					let json_s = "";

					try {
						json_s = JSON.stringify(v);
					} catch (e) {
						// ...
					}

					content_s += ", " + json_s;
				});
			}
			// 非错误日志跳过对象和函数类型的打印
			else {
				args_as_.forEach((v) => {
					if (!["object", "function"].includes(typeof v)) {
						content_s += ", " + v;
					}
				});
			}
		}

		// 更新缓存数据
		mk_logger._cache_ss.push(content_s);

		// 超出缓存删除顶部日志
		if (mk_logger._cache_ss.length > mk_logger._config.cache_row_n) {
			mk_logger._cache_ss.splice(0, 1);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	debug(...args_as_: any[]): void {
		this._log(global_config.log.level.debug, ...args_as_);
	}

	log(...args_as_: any[]): void {
		this._log(global_config.log.level.log, ...args_as_);
	}

	warn(...args_as_: any[]): void {
		this._log(global_config.log.level.warn, ...args_as_);
	}

	error(...args_as_: any[]): void {
		this._log(global_config.log.level.error, ...args_as_);
	}

	/** 计时开始 */
	time_start(name_s_: string, ...args_as_: any[]): void {
		if (!name_s_) {
			this.error("参数错误");

			return;
		}

		const time_log: _mk_logger.time_log = Object.create(null);

		time_log.start_time_ms_n = time_log.last_time_ms_n = Date.now();
		this._time_map.set(name_s_, time_log);
		if (args_as_?.length) {
			this._log(global_config.log.level.log, name_s_, ...args_as_);
		}
	}

	/** 打印耗时 */
	time_log(name_s_: string, ...args_as_: any[]): void {
		const time_log = this._time_map.get(name_s_);

		if (!time_log) {
			this.error("参数错误");

			return;
		}

		const curr_time_ms_n = Date.now();

		if (args_as_?.length) {
			this._log(global_config.log.level.log, name_s_, ...args_as_, `耗时：${(curr_time_ms_n - time_log.last_time_ms_n) / 1000}s`);
		}

		time_log.last_time_ms_n = curr_time_ms_n;
	}

	/** 总耗时 */
	time_end(name_s_: string, ...args_as_: any[]): void {
		const time_log = this._time_map.get(name_s_);

		if (!time_log) {
			this.error("参数错误");

			return;
		}

		this._log(global_config.log.level.log, name_s_, ...args_as_, `总耗时：${(Date.now() - time_log.start_time_ms_n) / 1000}s`);
		this._time_map.delete(name_s_);
	}

	/** 日志头 */
	private _get_log_head(level_: global_config.log.level, time_b_ = true): string {
		const date = new Date();

		if (time_b_) {
			/** 当前日期时间 */
			const time_s = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;

			return `${this._name_s} <${global_config.log.level[level_]}> [${time_s}]：`;
		} else {
			return `${this._name_s} <${global_config.log.level[level_]}>：`;
		}
	}

	private _log(level_: global_config.log.level, ...args_as_: any[]): void {
		// 打印等级限制
		if (!(mk_logger._config.level_n & level_)) {
			return;
		}

		// 打印模块限制
		if (mk_logger._log_only_module_ss.length) {
			if (!mk_logger._log_only_module_ss.includes(this._name_s)) {
				return;
			}
		} else {
			if (mk_logger._limit_log_module_ss.includes(this._name_s)) {
				return;
			}
		}

		/** 日志头 */
		const head_s = this._get_log_head(level_);

		// 更新缓存
		mk_logger._add_log_cache(level_, head_s, ...args_as_);
		// 打印日志
		this._log_func_tab[mk_logger._config.log_object_type][global_config.log.level[level_]](head_s, ...args_as_);
	}
}

export const mk_log = mk_logger.instance("default");

export default mk_logger;
