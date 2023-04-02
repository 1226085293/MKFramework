import { DEBUG, EDITOR } from "cc/env";
import global_config from "../@config/global_config";
import * as cc from "cc";
import mk_instance_base from "./mk_instance_base";
import http from "./network/mk_http";

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
}

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
		if (global_config.log.debug_use_browser_b) {
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
	}

	/* --------------- static --------------- */
	/** 日志等级 */
	static level_n = DEBUG ? _mk_logger.level.debug_up : _mk_logger.level.log_up;

	/** 所有 log 对象 */
	private static _log_map = new Map<string, mk_logger>();
	/** 日志缓存 */
	private static _cache_ss: string[] = [];
	/** 唯一日志模块 */
	private static _log_only_module_ss: string[] = [];
	/** 限制日志模块 */
	private static _limit_log_module_ss: string[] = global_config.log.limit_log_module_ss;
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
	/* --------------- public --------------- */
	/* ------------------------------- static ------------------------------- */
	/**
	 * 初始化
	 * @param error_handling_f_ 错误处理函数
	 */
	static init(error_handling_f_?: (...args_as: any[]) => any): void {
		const logger_a = mk_logger.instance("default");

		// 错误监听
		{
			const upload_f = (...args_as: any[]): void => {
				// 添加日志缓存
				mk_logger._add_log_cache(_mk_logger.level.error, logger_a._get_log_head(_mk_logger.level.error, true), args_as);

				// 上传错误日志
				if (global_config.log.error_upload_addr_s) {
					http.post(global_config.log.error_upload_addr_s, {
						body: JSON.stringify(this._cache_ss),
					});

					// 清空日志缓存
					mk_logger._cache_ss.splice(0, mk_logger._cache_ss.length);
				}

				// 错误处理
				error_handling_f_?.(...args_as);
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

	/** 只日志模块 */
	static log_only_module(module_ss_: string[]): void {
		mk_logger._log_only_module_ss = module_ss_;
		mk_logger._limit_log_module_ss = [];
	}

	/** 限制日志模块 */
	static limit_log_module(module_ss_: string[]): void {
		mk_logger._log_only_module_ss = [];
		mk_logger._limit_log_module_ss = module_ss_;
	}

	/** 调试打印 */
	static debug(...args_as_: any[]): void {
		mk_logger.instance("").debug(...args_as_);
	}

	/** 日志打印 */
	static log(...args_as_: any[]): void {
		mk_logger.instance("").log(...args_as_);
	}

	/** 警告打印 */
	static warn(...args_as_: any[]): void {
		mk_logger.instance("").warn(...args_as_);
	}

	/** 错误打印 */
	static error(...args_as_: any[]): void {
		mk_logger.instance("").error(...args_as_);
	}

	/** 堆栈打印 */
	static stack(): void {
		console.log(new Error());
	}

	/**
	 * 添加日志缓存
	 * @param level_ 等级
	 * @param head_s_ 日志头
	 * @param args_as_ 参数
	 * @returns
	 */
	private static _add_log_cache(level_: mk_logger_.level, head_s_: string, ...args_as_: any[]): void {
		if (!args_as_?.length || global_config.log.cache_row_n <= 0) {
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
		if (mk_logger._cache_ss.length > global_config.log.cache_row_n) {
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
		if (!(mk_logger.level_n & level_)) {
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

		// // 错误日志打印堆栈
		// if (level_ === mk_logger_.level.error) {
		// 	console.error(new Error());
		// }
	}
}

export namespace mk_logger_ {
	export const level = _mk_logger.level;
	export type level = _mk_logger.level;
}

export default mk_logger;
