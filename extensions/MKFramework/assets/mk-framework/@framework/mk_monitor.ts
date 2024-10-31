import mk_tool from "./@private/tool/mk_tool";
import mk_instance_base from "./mk_instance_base";
import mk_logger from "./mk_logger";
import mk_status_task from "./task/mk_status_task";

namespace _mk_monitor {
	/** 键类型 */
	export type type_key = PropertyKey;
	/** on 函数类型 */
	export type type_on_callback<T> = (
		/** 新值 */
		value: T,
		/** 旧值 */
		old_value?: T,
		/** 值路径（只会在监听无键的对象类型时传递） */
		path_s?: string
	) => any;
	/** off 函数类型 */
	export type type_off_callback = () => any;
	/** 监听数据类型 */
	export type type_monitor_data<T> = {
		/** 监听回调 */
		on_callback_f: type_on_callback<T>;
		/** 取消监听回调 */
		off_callback_f?: type_off_callback;
		/** 绑定对象 */
		target?: any;
		/** 单次监听状态 */
		once_b?: boolean;
		/**
		 * 禁用状态
		 * @remarks
		 * 仅用于 on_callback_f
		 */
		disabled_b?: boolean;
		/** 监听路径 */
		path_s?: string;
	};

	/** 对象绑定监听数据 */
	export interface target_bind_monitor_data {
		/** 绑定监听 */
		monitor?: type_monitor_data<any>;
		/** 绑定对象 */
		target: any;
		/** 绑定键 */
		key: type_key;
	}

	/**
	 * 对象绑定数据
	 * @remarks
	 * 用于 clear
	 */
	export interface target_bind_data {
		/** 绑定监听 */
		monitor_as?: target_bind_monitor_data[];
		/**
		 * 禁用状态
		 * @remarks
		 * 仅用于 on_callback_f
		 */
		disabled_b?: boolean;
	}

	/** 绑定数据 */
	export interface bind_data {
		/** 原始描述符 */
		descriptor: PropertyDescriptor;
		/** 绑定监听 */
		monitor_as?: type_monitor_data<any>[];
		/**
		 * 禁用状态
		 * @remarks
		 * 仅用于 on_callback_f
		 */
		disabled_b?: boolean;
		/** 任务 */
		task?: mk_status_task;
		/** 递归计数 */
		recursive_count_n: number;
	}

	/** off 参数 */
	export interface off_param {
		/** on 触发回调 */
		on_callback_f_?: type_on_callback<any>;
		/** 绑定目标 */
		target_?: any;
		/** 数据路径 */
		path_s_?: string;
	}
}

/**
 * 数据监听器（类型安全）
 * @noInheritDoc
 * @remarks
 * 可以用以 mvvm 搭建及使用，注意：监听回调仅在下一帧被调用
 */
export class mk_monitor extends mk_instance_base {
	/** 日志管理 */
	private _log = new mk_logger("monitor");
	/** 绑定数据图 */
	private _bind_data_map = new Map<any, Map<_mk_monitor.type_key, _mk_monitor.bind_data>>();
	/** 对象绑定数据图 */
	private _target_bind_data = new Map<any, _mk_monitor.target_bind_data>();

	/* ------------------------------- 功能 ------------------------------- */
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
	): _mk_monitor.type_on_callback<T[T2]> | null {
		const callback_f = (value: any): void => {
			value2_[key2_] = value;
		};

		value2_[key2_] = value_[key_] as any;

		return this.on(value_, key_, callback_f, target_);
	}

	/**
	 * 等待监听回调执行完成
	 * @param value_ 对象
	 * @param key_ 键
	 * @returns
	 */
	async wait<T, T2 extends keyof T>(value_: T, key_: T2): Promise<void> {
		const bind_data = this._get_bind_data(value_, key_, false);

		if (!bind_data?.task) {
			return;
		}

		if (bind_data.recursive_count_n > 1) {
			this._log.error("递归，不能在当前对象回调内等待当前对象回调执行完成");

			return;
		}

		await bind_data.task.task;
	}

	/**
	 * 递归监听数据更新
	 * @param value_ 监听对象
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定对象
	 */
	on_recursion(value_: any, on_callback_f_: _mk_monitor.type_on_callback<any>, target_?: any): void;
	/**
	 * 递归监听数据更新
	 * @param value_ 监听对象
	 * @param on_callback_f_ on 触发回调
	 * @param off_callback_f_ off 触发回调
	 * @param target_ 绑定对象
	 */
	on_recursion(value_: any, on_callback_f_: _mk_monitor.type_on_callback<any>, off_callback_f_: _mk_monitor.type_off_callback, target_?: any): void;
	on_recursion(value_: any, on_callback_f_: _mk_monitor.type_on_callback<any>, args3_: any, target_?: any): void {
		const target: any = target_ ?? (typeof args3_ === "object" ? args3_ : undefined);
		const off_callback_f: _mk_monitor.type_off_callback | undefined = typeof args3_ === "function" ? args3_ : undefined;

		mk_tool.object.traverse(value_, (value: any, key_s: string, path_s: string) => {
			if (!["string", "number", "boolean", "symbol"].includes(typeof value)) {
				return;
			}

			let parent = value_;

			// 更新父级对象
			if (path_s.length !== 0) {
				path_s.split("/").forEach((v_s) => {
					parent = parent[v_s];
				});
			}

			this._on(parent, key_s as any, {
				path_s: `${path_s ? path_s + "/" : ""}${key_s}`,
				on_callback_f: on_callback_f_,
				off_callback_f: off_callback_f,
				target: target,
			});
		});
	}

	/**
	 * 监听数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定对象
	 */
	on<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null;
	/**
	 * 监听数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param on_callback_f_ on 触发回调
	 * @param off_callback_f_ off 触发回调
	 * @param target_ 绑定对象
	 */
	on<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		off_callback_f_: _mk_monitor.type_off_callback,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null;
	on<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		args4_: any,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null {
		const off_callback_f: _mk_monitor.type_off_callback | undefined = typeof args4_ === "function" ? args4_ : undefined;
		const target: any = target_ ?? (typeof args4_ === "object" ? args4_ : undefined);

		return this._on(value_, key_, {
			on_callback_f: on_callback_f_,
			off_callback_f: off_callback_f,
			target: target,
		});
	}

	/**
	 * 监听单次数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定对象
	 */
	once<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null;
	/**
	 * 监听单次数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param on_callback_f_ on 触发回调
	 * @param off_callback_f_ off 触发回调
	 * @param target_ 绑定对象
	 */
	once<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		off_callback_f_: _mk_monitor.type_off_callback,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null;
	once<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		on_callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		off_callback_f_?: _mk_monitor.type_off_callback,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null {
		const off_callback_f = typeof off_callback_f_ === "function" ? off_callback_f_ : undefined;
		const target = target_ || (off_callback_f ? null : off_callback_f_);

		return this._on(value_, key_, {
			on_callback_f: on_callback_f_,
			off_callback_f: off_callback_f,
			target: target,
			once_b: true,
		});
	}

	/**
	 * 递归取消监听数据更新
	 * @param value_ 监听对象
	 * @param target_ 绑定目标
	 */
	off_recursion(value_: any, target_?: any): Promise<any>;
	/**
	 * 递归取消监听数据更新
	 * @param value_ 监听对象
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定目标
	 */
	off_recursion(value_: any, on_callback_f_: _mk_monitor.type_on_callback<any>, target_?: any): Promise<any>;
	off_recursion(value_: any, args2_: any, target_?: any): Promise<any> {
		const on_callback_f: _mk_monitor.type_on_callback<any> | undefined = typeof args2_ === "function" ? args2_ : undefined;
		const target = target_ ?? (typeof args2_ === "object" ? args2_ : undefined);
		const task_as: Promise<any>[] = [];

		mk_tool.object.traverse(value_, (value: any, key_s: string, path_s: string) => {
			const type_s = typeof value;

			if (!["string", "number", "boolean", "symbol"].includes(type_s)) {
				return;
			}

			let parent = value_;

			// 更新父级对象
			if (path_s.length !== 0) {
				path_s.split("/").forEach((v_s) => {
					parent = parent[v_s];
				});
			}

			task_as.push(
				...this._off(parent, key_s, {
					path_s_: `${path_s ? path_s + "/" : ""}${key_s}`,
					on_callback_f_: on_callback_f,
					target_: target,
				})
			);
		});

		return Promise.all(task_as);
	}

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
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定目标
	 */
	off<T, T2 extends keyof T>(value_: T, key_: T2, on_callback_f_: _mk_monitor.type_on_callback<T[T2]>, target_?: any): Promise<void>;
	off<T, T2 extends keyof T>(value_: T, key_: T2, args3_?: any, target_?: any): Promise<any> {
		const on_callback_f: _mk_monitor.type_on_callback<any> | undefined = typeof args3_ === "function" ? args3_ : undefined;
		const target = target_ ?? (typeof args3_ === "object" ? args3_ : undefined);

		return Promise.all(
			this._off(value_, key_, {
				on_callback_f_: on_callback_f,
				target_: target,
			})
		);
	}

	/**
	 * 清理对象绑定的数据
	 * @param target_ 绑定对象
	 * @returns
	 */
	clear(target_: any): null | Promise<any[]> {
		/** 对象绑定数据 */
		const target_bind_data = this._target_bind_data.get(target_);

		// 安检
		if (!target_ || !target_bind_data) {
			return null;
		}

		const task_as: Promise<any>[] = [];

		// 清理监听数据
		if (target_bind_data.monitor_as) {
			/** 清理当前监听的所有事件 */
			const monitor_as = target_bind_data.monitor_as.slice(0);

			for (const v of monitor_as) {
				task_as.push(
					...this._off(v.target, v.key, {
						on_callback_f_: v.monitor!.on_callback_f,
						target_: v.monitor!.target,
						path_s_: v.monitor!.path_s,
					})
				);
			}
		}

		return Promise.all(task_as);
	}

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
	 * @param callback_f_ on 触发回调
	 * @param target_ 绑定对象
	 */
	enable<T, T2 extends keyof T>(value_: T, key_: T2, callback_f_: _mk_monitor.type_on_callback<T[T2]>, target_?: any): void;
	enable<T, T2 extends keyof T>(args_: T, key_?: T2, args3_?: any, target_?: any): void {
		this._set_listener_state(true, args_, key_!, args3_, target_);
	}

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
	 * @param callback_f_ on 触发回调
	 * @param target_ 绑定对象
	 */
	disable<T, T2 extends keyof T>(value_: T, key_: T2, callback_f_: _mk_monitor.type_on_callback<T[T2]>, target_?: any): void;
	disable<T, T2 extends keyof T>(args_: T, key_?: T2, args3_?: any, target_?: any): void {
		this._set_listener_state(false, args_, key_!, args3_, target_);
	}

	/**
	 * 获取绑定数据
	 * @param value_ 数据
	 * @param key_ 键
	 * @param create_b_ 不存在则创建
	 * @returns
	 */
	private _get_bind_data<T, T2 extends keyof T>(value_: T, key_: T2, create_b_: boolean): _mk_monitor.bind_data | null {
		/** 绑定数据表 */
		let bind_data_map = this._bind_data_map.get(value_);

		if (!bind_data_map) {
			this._bind_data_map.set(value_, (bind_data_map = new Map()));
		}

		/** 绑定数据 */
		let bind_data = bind_data_map.get(key_)!;

		if (bind_data) {
			return bind_data;
		}

		if (!create_b_) {
			return null;
		}

		// 添加数据
		{
			const descriptor = Object.getOwnPropertyDescriptor(value_, key_);

			if (!descriptor) {
				return null;
			}

			bind_data_map.set(
				key_,
				(bind_data = Object.create({
					descriptor: descriptor,
					recursive_count_n: 0,
				} as any)!)
			);
		}

		/** 值 */
		let value = value_[key_];
		/** 可更新 */
		let can_update_b = false;
		/** 更新定时器 */
		let update_timer: any;
		/** 更新前的值 */
		let value_before_update: any;

		// 监听数据
		Object.defineProperty(value_, key_, {
			get: () => (bind_data!.descriptor.get ? bind_data!.descriptor.get.call(value_) : value),
			set: (new_value) => {
				// 安检
				{
					if (!bind_data) {
						return;
					}

					// 更新数据
					if (bind_data.descriptor.get) {
						value = bind_data.descriptor.get.call(value_);
					}

					// 数据相同
					if (!can_update_b && value === new_value && typeof value !== "object" && typeof value !== "function") {
						this._log.debug("更新值，数据相同跳过", key_, new_value, value_);

						return;
					}
				}

				/** 旧数据 */
				const old_value = value;

				// 更新值
				{
					this._log.debug("更新值", key_, new_value, value_);

					bind_data.descriptor.set?.call(value_, new_value);
					value = new_value;
				}

				// 如果禁用状态或者无监听则退出
				if (bind_data.disabled_b || !bind_data.monitor_as) {
					// 更新可更新状态
					if (bind_data.disabled_b) {
						can_update_b = true;
					}

					return;
				}

				if (update_timer) {
					// 更新后的值和更新前一致则还原
					if (typeof value !== "object" && typeof value !== "function" && value === value_before_update) {
						// 清理定时器
						clearTimeout(update_timer);
						update_timer = null;

						// 更新 set 计数
						--bind_data.recursive_count_n;
						// 更新任务状态
						bind_data.task!.finish(true);
					}

					return;
				}

				if (!bind_data.task) {
					bind_data.task = new mk_status_task(false);
				}
				// 防止回调内赋值导致任务状态被覆盖
				else if (bind_data.recursive_count_n === 0) {
					bind_data.task.finish(false);
				}

				// 更新 set 计数
				++bind_data.recursive_count_n;
				// 记录更新前的值
				value_before_update = old_value;

				// 下一帧回调
				update_timer = setTimeout(() => {
					update_timer = null;

					if (!bind_data?.monitor_as) {
						return;
					}

					/** 任务返回 */
					const on_result_as: any[] = [];

					// 更新可更新状态
					can_update_b = false;

					// 执行监听事件
					for (let k_n = 0, v: _mk_monitor.type_monitor_data<any>; k_n < bind_data.monitor_as.length; ++k_n) {
						v = bind_data.monitor_as[k_n];

						const target_bind_data = !v.target ? undefined : this._target_bind_data.get(v.target);

						// 安检，禁用状态
						if (v.disabled_b || target_bind_data?.disabled_b) {
							continue;
						}

						on_result_as.push(v.on_callback_f.call(v.target, value, old_value, v.path_s));

						// 单次执行
						if (v.once_b) {
							bind_data!.monitor_as!.splice(k_n--, 1);
							// 删除对象绑定数据
							if (v.target) {
								this._del_target_bind_data(v.target, {
									monitor: v,
									target: value_,
									key: key_,
								});
							}
						}
					}

					// 等待任务完成
					Promise.all(on_result_as).then(() => {
						// 更新 set 计数，更新任务状态
						if (--bind_data.recursive_count_n === 0) {
							bind_data!.task!.finish(true);
						}
					});
				}, 0);
			},
		});

		return bind_data;
	}

	private _off(value_: any, key_: any, { on_callback_f_, target_, path_s_ }: _mk_monitor.off_param): Promise<any>[] {
		/** 绑定数据 */
		const bind_data = this._get_bind_data(value_, key_, false);
		/** 任务列表 */
		const task_as: Promise<any>[] = [];

		if (!bind_data?.monitor_as) {
			return task_as;
		}

		// 取消监听
		{
			let index_n: number;
			let del_as: _mk_monitor.type_monitor_data<any>[];
			let find_f: ((value: _mk_monitor.type_monitor_data<any>) => boolean) | undefined;

			if (target_ && on_callback_f_) {
				find_f = (v) => v.on_callback_f === on_callback_f_ && v.target === target_ && v.path_s === path_s_;
			} else if (target_) {
				find_f = (v) => v.target === target_ && v.path_s === path_s_;
			} else if (on_callback_f_) {
				find_f = (v) => v.on_callback_f === on_callback_f_ && v.path_s === path_s_;
			} else {
				find_f = (v) => v.path_s === path_s_;
			}

			if (find_f) {
				/** 当前的监听数据 */
				const monitor_as = bind_data.monitor_as.splice(0, bind_data.monitor_as.length);

				// eslint-disable-next-line no-constant-condition
				while (true) {
					index_n = monitor_as.findIndex(find_f);

					if (index_n === -1) {
						break;
					}

					del_as = monitor_as.splice(index_n, 1);

					// 删除对象绑定数据
					const call_back_f = this._del_target_bind_data(target_, {
						monitor: del_as[0],
						target: value_,
						key: key_,
					});

					if (call_back_f) {
						task_as.push(call_back_f);
					}
				}

				bind_data.monitor_as.unshift(...monitor_as);
			}
		}

		// 数据还原
		if (!bind_data.monitor_as.length) {
			task_as.push(...this._del_bind_data(value_, key_));
		}

		return task_as;
	}

	/** 删除绑定数据 */
	private _del_bind_data<T, T2 extends keyof T>(value_: T, key_: T2): Promise<any>[] {
		/** 绑定数据表 */
		const bind_data_map = this._bind_data_map.get(value_);
		/** 任务列表 */
		const task_as: Promise<any>[] = [];

		if (!bind_data_map) {
			return task_as;
		}

		/** 绑定数据 */
		const bind_data = bind_data_map.get(key_);

		if (bind_data) {
			// 删除对象绑定数据列表
			if (bind_data.monitor_as) {
				while (bind_data.monitor_as.length) {
					const monitor = bind_data.monitor_as.pop()!;

					// 删除对象绑定数据
					const call_back_f = this._del_target_bind_data(monitor.target, {
						monitor: monitor,
						target: value_,
						key: key_,
					});

					if (call_back_f) {
						task_as.push(call_back_f);
					}
				}
			}

			// 还原值
			if (!bind_data.descriptor.set) {
				bind_data.descriptor.value = value_[key_];
			}

			// 重置描述符
			Object.defineProperty(value_, key_, bind_data.descriptor);
			// 删除 bind_data
			bind_data_map.delete(key_);
		}

		// 删除 bind_data_map
		if (!bind_data_map.size) {
			this._bind_data_map.delete(value_);
		}

		return task_as;
	}

	/** 添加对象绑定数据 */
	private _add_target_bind_data(target_: any, bind_data_: _mk_monitor.target_bind_monitor_data): void {
		// 安检
		if (!target_ || !bind_data_) {
			return;
		}

		/** 对象绑定数据 */
		let target_bind_data = this._target_bind_data.get(target_);

		if (!target_bind_data) {
			this._target_bind_data.set(target_, (target_bind_data = Object.create(null) as _mk_monitor.target_bind_data));
		}

		// 添加绑定监听
		if (bind_data_.monitor) {
			if (!target_bind_data.monitor_as) {
				target_bind_data.monitor_as = [bind_data_];
			} else {
				target_bind_data.monitor_as.push(bind_data_);
			}
		}
	}

	/** 删除对象绑定数据 */
	private _del_target_bind_data(target_: any, bind_data_: _mk_monitor.target_bind_monitor_data): null | Promise<any> {
		// 安检
		if (!target_ || !bind_data_) {
			return null;
		}

		/** 对象绑定数据 */
		const target_bind_data = this._target_bind_data.get(target_);

		if (!target_bind_data) {
			return null;
		}

		// 删除绑定监听
		if (bind_data_.monitor && target_bind_data.monitor_as) {
			const index_n = target_bind_data!.monitor_as!.findIndex((v) => {
				return v.target === bind_data_.target && v.key === bind_data_.key && v.monitor === bind_data_.monitor;
			});

			if (index_n !== -1) {
				return target_bind_data!.monitor_as!.splice(index_n, 1)[0].monitor?.off_callback_f?.();
			}
		}

		return null;
	}

	/** 监听数据更新 */
	private _on<T, T2 extends keyof T>(value_: T, key_: T2, data_: _mk_monitor.type_monitor_data<T[T2]>): _mk_monitor.type_on_callback<T[T2]> | null {
		/** 绑定数据 */
		const bind_data = this._get_bind_data(value_, key_, true);

		if (!bind_data) {
			this._log.error("获取绑定数据错误");

			return null;
		}

		// 添加回调
		{
			if (!bind_data.monitor_as) {
				bind_data.monitor_as = [];
			}

			bind_data.monitor_as?.push(data_);
		}

		// 添加对象绑定数据
		if (data_.target) {
			this._add_target_bind_data(data_.target, {
				monitor: data_,
				target: value_,
				key: key_,
			});
		}

		return data_.on_callback_f;
	}

	/** 启用监听事件 */
	private _set_listener_state(state_b_: boolean, target_: any): void;
	private _set_listener_state<T, T2 extends keyof T>(state_b_: boolean, value_: T, key_: T2, target_?: any): void;
	private _set_listener_state<T, T2 extends keyof T>(
		state_b_: boolean,
		value_: T,
		key_: T2,
		callback_f_: _mk_monitor.type_on_callback<T[T2]>,
		target_?: any
	): void;
	private _set_listener_state<T, T2 extends keyof T>(state_b_: boolean, args_: T, key_?: T2, args3_?: any, target_?: any): void {
		let target = target_;
		let value: T | undefined;
		let callback_f: _mk_monitor.type_on_callback<T[T2]> | undefined;

		// 参数转换
		{
			// target
			if (target === undefined) {
				if (key_ === undefined) {
					target = args_;
				} else if (typeof args3_ !== "function") {
					target = args3_;
				}
			}

			// value
			if (key_ !== undefined) {
				value = args_;
			}

			// callback_f_
			if (typeof args3_ === "function") {
				callback_f = args3_;
			}
		}

		if (value) {
			const bind_data = this._get_bind_data(value, key_!, false);

			if (!bind_data) {
				return;
			}

			// 更新指定回调
			if (callback_f) {
				if (!bind_data.monitor_as) {
					return;
				}

				let index_n: number;

				if (target) {
					index_n = bind_data.monitor_as.findIndex((v) => v.target === target && v.on_callback_f === callback_f);
				} else {
					index_n = bind_data.monitor_as.findIndex((v) => v.on_callback_f === callback_f);
				}

				if (index_n !== -1) {
					bind_data.monitor_as[index_n].disabled_b = !state_b_;
				}
			}
			// 更新指定对象
			else if (target) {
				if (!bind_data.monitor_as) {
					return;
				}

				bind_data.monitor_as.forEach((v) => {
					if (v.target === target) {
						v.disabled_b = !state_b_;
					}
				});
			}
			// 更新所有回调
			else {
				bind_data.disabled_b = !state_b_;
			}
		} else if (target_) {
			const target_bind_data = this._target_bind_data.get(target_);

			if (!target_bind_data) {
				return;
			}

			target_bind_data.disabled_b = !state_b_;
		}
	}
}

export default mk_monitor.instance();
