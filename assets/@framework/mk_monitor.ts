import mk_instance_base from "./mk_instance_base";
import mk_logger from "./mk_logger";

namespace _mk_monitor {
	/** 键类型 */
	export type type_key = string | number | symbol;
	/** on 函数类型 */
	export type type_on_callback<T> = (value_: T, old_value_?: T) => void;
	/** off 函数类型 */
	export type type_off_callback = () => void;
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
		/** 禁用状态 （仅用于 on_callback_f） */
		disabled_b?: boolean;
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
	/** 对象绑定数据 */
	export interface target_bind_data {
		/** 绑定监听 */
		monitor_as?: target_bind_monitor_data[];
		/** 禁用状态 （仅用于 on_callback_f） */
		disabled_b?: boolean;
	}
	/** 绑定数据 */
	export interface bind_data {
		/** 原始描述符 */
		desc: PropertyDescriptor;
		/** 绑定监听 */
		monitor_as?: type_monitor_data<any>[];
		/** 修改计数 */
		modify_count_n: number;
		/** 禁用状态 （仅用于 on_callback_f） */
		disabled_b?: boolean;
	}
}

/** 数据监听器 */
class mk_monitor extends mk_instance_base {
	/** 日志管理 */
	private _log = new mk_logger("monitor");
	/** 绑定数据图 */
	private _bind_data_map = new Map<any, Map<_mk_monitor.type_key, _mk_monitor.bind_data>>();
	/** 对象绑定数据图 */
	private _target_bind_data = new Map<any, _mk_monitor.target_bind_data>();

	/* ------------------------------- 功能 ------------------------------- */
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
		off_callback_f_?: _mk_monitor.type_off_callback,
		target_?: any
	): _mk_monitor.type_on_callback<T[T2]> | null {
		const off_callback_f = typeof off_callback_f_ === "function" ? off_callback_f_ : undefined;
		const target = target_ || (off_callback_f ? null : off_callback_f_);

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
	 * 取消监听数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param target_ 绑定目标
	 */
	async off<T, T2 extends keyof T>(value_: T, key_: T2, target_?: any): Promise<void>;
	/**
	 * 取消监听数据更新
	 * @param value_ 监听对象
	 * @param key_ 监听键
	 * @param on_callback_f_ on 触发回调
	 * @param target_ 绑定目标
	 */
	async off<T, T2 extends keyof T>(value_: T, key_: T2, on_callback_f_: _mk_monitor.type_on_callback<T[T2]>, target_?: any): Promise<void>;
	async off<T, T2 extends keyof T>(value_: T, key_: T2, args_?: any, target_?: any): Promise<void> {
		let target = target_;
		let callback_f: _mk_monitor.type_on_callback<T[T2]> | undefined;

		// 参数转换
		if (typeof args_ === "function") {
			callback_f = args_;
		} else if (!target) {
			target = args_;
		}

		// 参数安检
		if (!target && !callback_f) {
			return;
		}

		/** 绑定数据 */
		const bind_data = this._get_bind_data(value_, key_);

		if (!bind_data?.monitor_as) {
			return;
		}

		/** 任务列表 */
		const task_as: Promise<any>[] = [];

		// 取消监听
		{
			let index_n: number;
			let del_as: _mk_monitor.type_monitor_data<any>[];

			if (target && callback_f) {
				// eslint-disable-next-line no-constant-condition
				while (true) {
					index_n = bind_data.monitor_as.findIndex((v2) => v2.on_callback_f === callback_f && v2.target === target);

					if (index_n === -1) {
						break;
					}

					del_as = bind_data.monitor_as.splice(index_n, 1);

					// 删除对象绑定数据
					task_as.push(
						this._del_target_bind_data(target, {
							monitor: del_as[0],
							target: value_,
							key: key_,
						})
					);
				}
			} else if (target) {
				// eslint-disable-next-line no-constant-condition
				while (true) {
					index_n = bind_data.monitor_as.findIndex((v2) => v2.target === target);

					if (index_n === -1) {
						break;
					}
					del_as = bind_data.monitor_as.splice(index_n, 1);

					// 删除对象绑定数据
					task_as.push(
						this._del_target_bind_data(target, {
							monitor: del_as[0],
							target: value_,
							key: key_,
						})
					);
				}
			} else if (callback_f) {
				// eslint-disable-next-line no-constant-condition
				while (true) {
					index_n = bind_data.monitor_as.findIndex((v2) => v2.on_callback_f === callback_f);

					if (index_n === -1) {
						break;
					}

					del_as = bind_data.monitor_as.splice(index_n, 1);

					// 删除对象绑定数据
					task_as.push(
						this._del_target_bind_data(target, {
							monitor: del_as[0],
							target: value_,
							key: key_,
						})
					);
				}
			}
		}

		// 数据还原
		if (!bind_data.monitor_as.length) {
			await this._del_bind_data(value_, key_);
		}

		await Promise.all(task_as);
	}

	/**
	 * 清理对象绑定的数据
	 * @param target_ 绑定对象
	 * @returns
	 */
	clear(target_: any): void {
		const target_bind_data = this._target_bind_data.get(target_);

		// 安检
		if (!target_ || !target_bind_data) {
			return;
		}
		// 清理监听数据
		if (target_bind_data.monitor_as) {
			let v: _mk_monitor.target_bind_monitor_data;

			while (target_bind_data.monitor_as.length) {
				v = target_bind_data.monitor_as[0];
				this.off(v.target, v.key, v.monitor!.on_callback_f, v.monitor!.target);
			}
		}
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
		this._set_listener_state(true, args_, key_!, args3_, target_);
	}

	/** 获取绑定数据（没有则创建） */
	private _get_bind_data<T, T2 extends keyof T>(value_: T, key_: T2): _mk_monitor.bind_data | null {
		/** 绑定数据表 */
		let bind_data_map = this._bind_data_map.get(value_);

		if (!bind_data_map) {
			this._bind_data_map.set(value_, (bind_data_map = new Map()));
		}

		/** 绑定数据 */
		let bind_data = bind_data_map.get(key_);

		if (bind_data) {
			return bind_data;
		}

		// 添加数据
		{
			const desc = Object.getOwnPropertyDescriptor(value_, key_);

			if (!desc) {
				return null;
			}
			bind_data_map.set(key_, (bind_data = Object.create(null) as _mk_monitor.bind_data));
			bind_data.desc = desc;
		}

		/** 值 */
		let value = value_[key_];

		// 监听数据
		Object.defineProperty(value_, key_, {
			get: () => (bind_data!.desc.get ? bind_data!.desc.get.call(value_) : value),
			set: (new_value) => {
				// 安检
				{
					if (!bind_data) {
						return;
					}

					// 更新数据
					if (bind_data.desc.get) {
						value = bind_data.desc.get.call(value_);
					}

					// 数据相同
					if (value === new_value) {
						return;
					}

					// 递归修改大于 2 次
					if (bind_data.modify_count_n > 1) {
						this._log.error("递归修改不允许大于两次", key_, new_value, value_);
						return;
					}
				}

				/** 旧数据 */
				const old_value = value;

				// 更新修改计数
				bind_data.modify_count_n = (bind_data.modify_count_n ?? 0) + 1;

				// 更新值
				{
					this._log.debug("更新值", key_, new_value, value_);
					bind_data.desc.set?.call(value_, new_value);
					value = new_value;
				}

				// 如果禁用状态或者无监听则退出
				if (bind_data.disabled_b || !bind_data.monitor_as) {
					// 更新修改计数
					--bind_data.modify_count_n;
					return;
				}

				// 执行监听事件
				for (let k_n = 0, v: _mk_monitor.type_monitor_data<any>; k_n < bind_data.monitor_as.length; ++k_n) {
					v = bind_data.monitor_as[k_n];

					const target_bind_data = !v.target ? undefined : this._target_bind_data.get(v.target);

					// 安检（禁用状态）
					if (v.disabled_b || target_bind_data?.disabled_b) {
						continue;
					}
					v.on_callback_f.call(v.target, value, old_value);

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

				// 更新修改计数
				--bind_data.modify_count_n;
			},
		});

		return bind_data;
	}

	/** 删除绑定数据 */
	private async _del_bind_data<T, T2 extends keyof T>(value_: T, key_: T2): Promise<void> {
		/** 绑定数据表 */
		const bind_data_map = this._bind_data_map.get(value_);

		if (!bind_data_map) {
			return;
		}

		/** 绑定数据 */
		const bind_data = bind_data_map.get(key_);
		/** 任务列表 */
		const task_as: Promise<any>[] = [];

		if (bind_data) {
			// 删除对象绑定数据列表
			if (bind_data.monitor_as) {
				while (bind_data.monitor_as.length) {
					const monitor = bind_data.monitor_as.pop()!;

					// 删除对象绑定数据
					task_as.push(
						this._del_target_bind_data(monitor.target, {
							monitor: monitor,
							target: value_,
							key: key_,
						})
					);
				}
			}

			// 还原值
			if (!bind_data.desc.set) {
				bind_data.desc.value = value_[key_];
			}

			// 重置描述符
			Object.defineProperty(value_, key_, bind_data.desc);
			// 删除 bind_data
			bind_data_map.delete(key_);
		}

		// 删除 bind_data_map
		if (!bind_data_map.size) {
			this._bind_data_map.delete(value_);
		}

		await Promise.all(task_as);
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
	private async _del_target_bind_data(target_: any, bind_data_: _mk_monitor.target_bind_monitor_data): Promise<void> {
		// 安检
		if (!target_ || !bind_data_) {
			return;
		}
		/** 对象绑定数据 */
		const target_bind_data = this._target_bind_data.get(target_);

		if (!target_bind_data) {
			return;
		}
		// 删除绑定监听
		if (bind_data_.monitor && target_bind_data.monitor_as) {
			const index_n = target_bind_data!.monitor_as!.findIndex((v) => {
				return v.target === bind_data_.target && v.key === bind_data_.key && v.monitor === bind_data_.monitor;
			});

			if (index_n !== -1) {
				await target_bind_data!.monitor_as!.splice(index_n, 1)[0].monitor?.off_callback_f?.();
			}
		}
	}

	/** 监听数据更新 */
	private _on<T, T2 extends keyof T>(value_: T, key_: T2, data_: _mk_monitor.type_monitor_data<T[T2]>): _mk_monitor.type_on_callback<T[T2]> | null {
		/** 绑定数据 */
		const bind_data = this._get_bind_data(value_, key_);

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
			const bind_data = this._get_bind_data(value, key_!);

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

					// 更新回调
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
