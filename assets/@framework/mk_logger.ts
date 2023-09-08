import { DEBUG, EDITOR } from "cc/env";
import * as cc from "cc";
import mk_instance_base from "./mk_instance_base";
import mk_http from "./network/mk_http";
import global_config from "../@config/global_config";

namespace _mk_logger {
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

	/** 计时日志 */
	export interface time_log {
		/** 开始时间 */
		start_time_ms_n: number;
		/** 上次毫秒 */
		last_time_ms_n: number;
	}

	/** 全局配置 */
	export interface global_config {
		/** 日志等级 */
		level_n: _mk_logger.level;
		/** 日志缓存行数 */
		cache_row_n: number;
		/** 错误处理函数 */
		error_handling_f?: (...args_as: any[]) => any;
		/** 错误上次地址 */
		error_upload_addr_s?: string;
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

		// 输出定位
		if (global_config.log.output_position_b) {
			this.debug = this._log_func_tab["debug"][mk_logger_.level[mk_logger_.level.debug]].bind(
				this._log_func_tab["debug"]["target"],
				this._get_log_head(mk_logger_.level.debug, true)
			);

			this.log = this._log_func_tab["debug"][mk_logger_.level[mk_logger_.level.log]].bind(
				this._log_func_tab["debug"]["target"],
				this._get_log_head(mk_logger_.level.log, true)
			);

			this.warn = this._log_func_tab["debug"][mk_logger_.level[mk_logger_.level.warn]].bind(
				this._log_func_tab["debug"]["target"],
				this._get_log_head(mk_logger_.level.warn, true)
			);

			this.error = this._log_func_tab["debug"][mk_logger_.level[mk_logger_.level.error]].bind(
				this._log_func_tab["debug"]["target"],
				this._get_log_head(mk_logger_.level.error, true)
			);
		}

		// 错误监听
		if (!mk_logger._init_b) {
			mk_logger._init_b = true;

			const upload_f = (...args_as: any[]): void => {
				// 添加日志缓存
				mk_logger._add_log_cache(_mk_logger.level.error, mk_log._get_log_head(_mk_logger.level.error, true), args_as);

				// 上传错误日志
				if (mk_logger.config.error_upload_addr_s) {
					mk_http.post(mk_logger.config.error_upload_addr_s, {
						body: JSON.stringify(mk_logger._cache_ss),
					});

					// 清空日志缓存
					mk_logger._cache_ss.splice(0, mk_logger._cache_ss.length);
				}

				// 错误处理
				mk_logger.config.error_handling_f?.(...args_as);
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

	/* --------------- static --------------- */
	/** 全局配置 */
	static config: _mk_logger.global_config = {
		level_n: _mk_logger.level.debug_up,
		cache_row_n: global_config.log.cache_row_n,
		error_upload_addr_s: global_config.log.error_upload_addr_s,
	};

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
		debug: {
			target: console,
			debug: console.debug,
			log: console.log,
			warn: console.warn,
			error: console.error,
		},
		release: {
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
	private static _add_log_cache(level_: mk_logger_.level, head_s_: string, ...args_as_: any[]): void {
		if (!args_as_?.length || mk_logger.config.cache_row_n <= 0) {
			return;
		}

		/** 缓存内容 */
		let content_s = head_s_;

		// 填充参数内容
		{
			if (level_ === mk_logger_.level.error) {
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
		if (mk_logger._cache_ss.length > mk_logger.config.cache_row_n) {
			mk_logger._cache_ss.splice(0, 1);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	debug(...args_as_: any[]): void {
		this._log(mk_logger_.level.debug, ...args_as_);
	}

	log(...args_as_: any[]): void {
		this._log(mk_logger_.level.log, ...args_as_);
	}

	warn(...args_as_: any[]): void {
		this._log(mk_logger_.level.warn, ...args_as_);
	}

	error(...args_as_: any[]): void {
		this._log(mk_logger_.level.error, ...args_as_);
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
			this._log(mk_logger_.level.log, name_s_, ...args_as_);
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
			this._log(mk_logger_.level.log, name_s_, ...args_as_, `耗时：${(curr_time_ms_n - time_log.last_time_ms_n) / 1000}s`);
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

		this._log(mk_logger_.level.log, name_s_, ...args_as_, `总耗时：${(Date.now() - time_log.start_time_ms_n) / 1000}s`);
		this._time_map.delete(name_s_);
	}

	/** 日志头 */
	private _get_log_head(level_: mk_logger_.level, time_b_ = true): string {
		const date = new Date();

		if (time_b_) {
			/** 当前日期时间 */
			const time_s = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;

			return `${this._name_s} <${mk_logger_.level[level_]}> [${time_s}]：`;
		} else {
			return `${this._name_s} <${mk_logger_.level[level_]}>：`;
		}
	}

	private _log(level_: mk_logger_.level, ...args_as_: any[]): void {
		let log_f: (...args_as: any) => void;

		// 打印等级限制
		if (!(mk_logger.config.level_n & level_)) {
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

		// 获取打印函数
		{
			if (DEBUG) {
				log_f = this._log_func_tab["debug"][mk_logger_.level[level_]];
			} else {
				log_f = this._log_func_tab["release"][mk_logger_.level[level_]];
			}
		}

		const head_s = this._get_log_head(level_);

		// 更新缓存
		mk_logger._add_log_cache(level_, head_s, ...args_as_);
		// 打印日志
		log_f(head_s, ...args_as_);
	}
}

export namespace mk_logger_ {
	export const level = _mk_logger.level;
	export type level = _mk_logger.level;
}

export const mk_log = mk_logger.instance("default");

export default mk_logger;
