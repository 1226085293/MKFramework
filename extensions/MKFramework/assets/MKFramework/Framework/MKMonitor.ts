import MKTool from "./@Private/Tool/MKTool";
import MKInstanceBase from "./MKInstanceBase";
import MKLogger from "./MKLogger";
import MKStatusTask from "./Task/MKStatusTask";

namespace _MKMonitor {
	/** 键类型 */
	export type TypeKey = PropertyKey;
	/** on 函数类型 */
	export type TypeOnCallback<T> = (
		/** 新值 */
		value: T,
		/** 旧值 */
		oldValue?: T,
		/** 值路径（只会在监听无键的对象类型时传递） */
		pathStr?: string
	) => any;
	/** off 函数类型 */
	export type TypeOffCallback = () => any;
	/** 监听数据类型 */
	export type TypeMonitorData<T> = {
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
	export interface TargetBindMonitorData {
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
	export interface TargetBindData {
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
	export interface BindData {
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
	export interface OffParam {
		/** on 触发回调 */
		onCallbackFunc?: TypeOnCallback<any>;
		/** 绑定目标 */
		target?: any;
		/** 数据路径 */
		pathStr?: string;
	}
}

/**
 * 数据监听器（类型安全）
 * @noInheritDoc
 * @remarks
 * 可以用以 mvvm 搭建及使用，注意：监听回调仅在下一帧被调用
 */
export class MKMonitor extends MKInstanceBase {
	/** 日志管理 */
	private _log = new MKLogger("MKMonitor");
	/** 绑定数据图 */
	private _bindDataMap = new Map<any, Map<_MKMonitor.TypeKey, _MKMonitor.BindData>>();
	/** 对象绑定数据图 */
	private _targetBindData = new Map<any, _MKMonitor.TargetBindData>();

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
	): _MKMonitor.TypeOnCallback<T[T2]> | null {
		const callbackFunc = (value: any): void => {
			value2_[key2_] = value;
		};

		value2_[key2_] = value_[key_] as any;

		return this.on(value_, key_, callbackFunc, target_);
	}

	/**
	 * 等待监听回调执行完成
	 * @param value_ 对象
	 * @param key_ 键
	 * @returns
	 */
	async wait<T, T2 extends keyof T>(value_: T, key_: T2): Promise<void> {
		const bindData = this._getBindData(value_, key_, false);

		if (!bindData?.task) {
			return;
		}

		if (bindData.recursiveCountNum > 1) {
			this._log.error("递归，不能在当前对象回调内等待当前对象回调执行完成");

			return;
		}

		await bindData.task.task;
	}

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
	onRecursion(value_: any, onCallbackFunc_: _MKMonitor.TypeOnCallback<any>, args3_: any, target_?: any): void {
		const target: any = target_ ?? (typeof args3_ === "object" ? args3_ : undefined);
		const offCallbackFunc: _MKMonitor.TypeOffCallback | undefined = typeof args3_ === "function" ? args3_ : undefined;

		MKTool.object.traverse(value_, (value: any, keyStr: string, pathStr: string) => {
			if (!["string", "number", "boolean", "symbol"].includes(typeof value)) {
				return;
			}

			let parent = value_;

			// 更新父级对象
			if (pathStr.length !== 0) {
				pathStr.split("/").forEach((vStr) => {
					parent = parent[vStr];
				});
			}

			this._on(parent, keyStr as any, {
				pathStr: `${pathStr ? pathStr + "/" : ""}${keyStr}`,
				onCallbackFunc: onCallbackFunc_,
				offCallbackFunc: offCallbackFunc,
				target: target,
			});
		});
	}

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
	on<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
		args4_: any,
		target_?: any
	): _MKMonitor.TypeOnCallback<T[T2]> | null {
		const offCallbackFunc: _MKMonitor.TypeOffCallback | undefined = typeof args4_ === "function" ? args4_ : undefined;
		const target: any = target_ ?? (typeof args4_ === "object" ? args4_ : undefined);

		return this._on(value_, key_, {
			onCallbackFunc: onCallbackFunc_,
			offCallbackFunc: offCallbackFunc,
			target: target,
		});
	}

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
	once<T, T2 extends keyof T>(
		value_: T,
		key_: T2,
		onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
		offCallbackFunc_?: _MKMonitor.TypeOffCallback,
		target_?: any
	): _MKMonitor.TypeOnCallback<T[T2]> | null {
		const offCallbackFunc = typeof offCallbackFunc_ === "function" ? offCallbackFunc_ : undefined;
		const target = target_ || (offCallbackFunc ? null : offCallbackFunc_);

		return this._on(value_, key_, {
			onCallbackFunc: onCallbackFunc_,
			offCallbackFunc: offCallbackFunc,
			target: target,
			isOnce: true,
		});
	}

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
	offRecursion(value_: any, args2_: any, target_?: any): Promise<any> {
		const onCallbackFunc: _MKMonitor.TypeOnCallback<any> | undefined = typeof args2_ === "function" ? args2_ : undefined;
		const target = target_ ?? (typeof args2_ === "object" ? args2_ : undefined);
		const taskList: Promise<any>[] = [];

		MKTool.object.traverse(value_, (value: any, keyStr: string, pathStr: string) => {
			const typeStr = typeof value;

			if (!["string", "number", "boolean", "symbol"].includes(typeStr)) {
				return;
			}

			let parent = value_;

			// 更新父级对象
			if (pathStr.length !== 0) {
				pathStr.split("/").forEach((vStr) => {
					parent = parent[vStr];
				});
			}

			taskList.push(
				...this._off(parent, keyStr, {
					pathStr: `${pathStr ? pathStr + "/" : ""}${keyStr}`,
					onCallbackFunc: onCallbackFunc,
					target: target,
				})
			);
		});

		return Promise.all(taskList);
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
	 * @param onCallbackFunc_ on 触发回调
	 * @param target_ 绑定目标
	 */
	off<T, T2 extends keyof T>(value_: T, key_: T2, onCallbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): Promise<void>;
	off<T, T2 extends keyof T>(value_: T, key_: T2, args3_?: any, target_?: any): Promise<any> {
		const onCallbackFunc: _MKMonitor.TypeOnCallback<any> | undefined = typeof args3_ === "function" ? args3_ : undefined;
		const target = target_ ?? (typeof args3_ === "object" ? args3_ : undefined);

		return Promise.all(
			this._off(value_, key_, {
				onCallbackFunc: onCallbackFunc,
				target: target,
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
		const targetBindData = this._targetBindData.get(target_);

		// 安检
		if (!target_ || !targetBindData) {
			return null;
		}

		const taskList: Promise<any>[] = [];

		// 清理监听数据
		if (targetBindData.monitorList) {
			/** 清理当前监听的所有事件 */
			const monitorList = targetBindData.monitorList.slice(0);

			for (const v of monitorList) {
				taskList.push(
					...this._off(v.target, v.key, {
						onCallbackFunc: v.monitor!.onCallbackFunc,
						target: v.monitor!.target,
						pathStr: v.monitor!.pathStr,
					})
				);
			}
		}

		return Promise.all(taskList);
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
	 * @param callbackFunc_ on 触发回调
	 * @param target_ 绑定对象
	 */
	enable<T, T2 extends keyof T>(value_: T, key_: T2, callbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): void;
	enable<T, T2 extends keyof T>(args_: T, key_?: T2, args3_?: any, target_?: any): void {
		this._setListenerState(true, args_, key_!, args3_, target_);
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
	 * @param callbackFunc_ on 触发回调
	 * @param target_ 绑定对象
	 */
	disable<T, T2 extends keyof T>(value_: T, key_: T2, callbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>, target_?: any): void;
	disable<T, T2 extends keyof T>(args_: T, key_?: T2, args3_?: any, target_?: any): void {
		this._setListenerState(false, args_, key_!, args3_, target_);
	}

	/**
	 * 获取绑定数据
	 * @param value_ 数据
	 * @param key_ 键
	 * @param isCreate_ 不存在则创建
	 * @returns
	 */
	private _getBindData<T, T2 extends keyof T>(value_: T, key_: T2, isCreate_: boolean): _MKMonitor.BindData | null {
		/** 绑定数据表 */
		let bindDataMap = this._bindDataMap.get(value_);

		if (!bindDataMap) {
			this._bindDataMap.set(value_, (bindDataMap = new Map()));
		}

		/** 绑定数据 */
		let bindData = bindDataMap.get(key_)!;

		if (bindData) {
			return bindData;
		}

		if (!isCreate_) {
			return null;
		}

		// 添加数据
		{
			const descriptor = Object.getOwnPropertyDescriptor(value_, key_);

			if (!descriptor) {
				return null;
			}

			bindDataMap.set(
				key_,
				(bindData = Object.create({
					descriptor: descriptor,
					recursiveCountNum: 0,
				} as any)!)
			);
		}

		/** 值 */
		let value = value_[key_];
		/** 可更新 */
		let isCanUpdate = false;
		/** 更新定时器 */
		let updateTimer: any;
		/** 更新前的值 */
		let valueBeforeUpdate: any;

		// 监听数据
		Object.defineProperty(value_, key_, {
			get: () => (bindData!.descriptor.get ? bindData!.descriptor.get.call(value_) : value),
			set: (newValue) => {
				// 安检
				{
					if (!bindData) {
						return;
					}

					// 更新数据
					if (bindData.descriptor.get) {
						value = bindData.descriptor.get.call(value_);
					}

					// 数据相同
					if (!isCanUpdate && value === newValue && typeof value !== "object" && typeof value !== "function") {
						// this._log.debug("更新值，数据相同跳过", key_, newValue, value_);

						return;
					}
				}

				/** 旧数据 */
				const oldValue = value;

				// 更新值
				{
					this._log.debug("更新值", key_, newValue, value_);

					bindData.descriptor.set?.call(value_, newValue);
					value = newValue;
				}

				// 如果禁用状态或者无监听则退出
				if (bindData.isDisabled || !bindData.monitorList) {
					// 更新可更新状态
					if (bindData.isDisabled) {
						isCanUpdate = true;
					}

					return;
				}

				if (updateTimer) {
					// 更新后的值和更新前一致则还原
					if (typeof value !== "object" && typeof value !== "function" && value === valueBeforeUpdate) {
						// 清理定时器
						// clearTimeout(updateTimer);
						// cc.director.off(cc.Director.EVENT_END_FRAME, updateTimer, this);
						updateTimer = null;

						// 更新 set 计数
						--bindData.recursiveCountNum;
						// 更新任务状态
						bindData.task!.finish(true);
					}

					return;
				}

				if (!bindData.task) {
					bindData.task = new MKStatusTask(false);
				}
				// 防止回调内赋值导致任务状态被覆盖
				else if (bindData.recursiveCountNum === 0) {
					bindData.task.finish(false);
				}

				// 更新 set 计数
				++bindData.recursiveCountNum;
				// 记录更新前的值
				valueBeforeUpdate = oldValue;

				// 下一帧回调
				const updateFunc = (): void => {
					updateTimer = null;

					if (!bindData?.monitorList) {
						return;
					}

					/** 任务返回 */
					const onResultList: any[] = [];

					// 更新可更新状态
					isCanUpdate = false;

					// 执行监听事件
					for (let kNum = 0, v: _MKMonitor.TypeMonitorData<any>; kNum < bindData.monitorList.length; ++kNum) {
						v = bindData.monitorList[kNum];

						const targetBindData = !v.target ? undefined : this._targetBindData.get(v.target);

						// 安检，禁用状态
						if (v.isDisabled || targetBindData?.isDisabled) {
							continue;
						}

						onResultList.push(v.onCallbackFunc.call(v.target, value, oldValue, v.pathStr));

						// 单次执行
						if (v.isOnce) {
							bindData!.monitorList!.splice(kNum--, 1);
							// 删除对象绑定数据
							if (v.target) {
								this._delTargetBindData(v.target, {
									monitor: v,
									target: value_,
									key: key_,
								});
							}
						}
					}

					// 等待任务完成
					Promise.all(onResultList).then(() => {
						// 更新 set 计数，更新任务状态
						if (--bindData.recursiveCountNum === 0) {
							bindData!.task!.finish(true);
						}
					});
				};

				updateFunc();
				// cc.director.once(cc.Director.EVENT_END_FRAME, (updateTimer = updateFunc), this);
				// updateTimer = setTimeout(updateFunc, 0);
			},
		});

		return bindData;
	}

	private _off(
		value_: any,
		key_: any,
		{ onCallbackFunc: onCallbackFunc_, target: target_, pathStr: pathStr_ }: _MKMonitor.OffParam
	): Promise<any>[] {
		/** 绑定数据 */
		const bindData = this._getBindData(value_, key_, false);
		/** 任务列表 */
		const taskList: Promise<any>[] = [];

		if (!bindData?.monitorList) {
			return taskList;
		}

		// 取消监听
		{
			let indexNum: number;
			let deleteList: _MKMonitor.TypeMonitorData<any>[];
			let findFunc: ((value: _MKMonitor.TypeMonitorData<any>) => boolean) | undefined;

			if (target_ && onCallbackFunc_) {
				findFunc = (v) => v.onCallbackFunc === onCallbackFunc_ && v.target === target_ && v.pathStr === pathStr_;
			} else if (target_) {
				findFunc = (v) => v.target === target_ && v.pathStr === pathStr_;
			} else if (onCallbackFunc_) {
				findFunc = (v) => v.onCallbackFunc === onCallbackFunc_ && v.pathStr === pathStr_;
			} else {
				findFunc = (v) => v.pathStr === pathStr_;
			}

			if (findFunc) {
				/** 当前的监听数据 */
				const monitorList = bindData.monitorList.splice(0, bindData.monitorList.length);

				// eslint-disable-next-line no-constant-condition
				while (true) {
					indexNum = monitorList.findIndex(findFunc);

					if (indexNum === -1) {
						break;
					}

					deleteList = monitorList.splice(indexNum, 1);

					// 删除对象绑定数据
					const callBackFunc = this._delTargetBindData(target_, {
						monitor: deleteList[0],
						target: value_,
						key: key_,
					});

					if (callBackFunc) {
						taskList.push(callBackFunc);
					}
				}

				bindData.monitorList.unshift(...monitorList);
			}
		}

		// 数据还原
		if (!bindData.monitorList.length) {
			taskList.push(...this._delBindData(value_, key_));
		}

		return taskList;
	}

	/** 删除绑定数据 */
	private _delBindData<T, T2 extends keyof T>(value_: T, key_: T2): Promise<any>[] {
		/** 绑定数据表 */
		const bindDataMap = this._bindDataMap.get(value_);
		/** 任务列表 */
		const taskList: Promise<any>[] = [];

		if (!bindDataMap) {
			return taskList;
		}

		/** 绑定数据 */
		const bindData = bindDataMap.get(key_);

		if (bindData) {
			// 删除对象绑定数据列表
			if (bindData.monitorList) {
				while (bindData.monitorList.length) {
					const monitor = bindData.monitorList.pop()!;

					// 删除对象绑定数据
					const callBackFunc = this._delTargetBindData(monitor.target, {
						monitor: monitor,
						target: value_,
						key: key_,
					});

					if (callBackFunc) {
						taskList.push(callBackFunc);
					}
				}
			}

			// 还原值
			if (!bindData.descriptor.set) {
				bindData.descriptor.value = value_[key_];
			}

			// 重置描述符
			Object.defineProperty(value_, key_, bindData.descriptor);
			// 删除 bindData
			bindDataMap.delete(key_);
		}

		// 删除 bindDataMap
		if (!bindDataMap.size) {
			this._bindDataMap.delete(value_);
		}

		return taskList;
	}

	/** 添加对象绑定数据 */
	private _addTargetBindData(target_: any, bindData_: _MKMonitor.TargetBindMonitorData): void {
		// 安检
		if (!target_ || !bindData_) {
			return;
		}

		/** 对象绑定数据 */
		let targetBindData = this._targetBindData.get(target_);

		if (!targetBindData) {
			this._targetBindData.set(target_, (targetBindData = Object.create(null) as _MKMonitor.TargetBindData));
		}

		// 添加绑定监听
		if (bindData_.monitor) {
			if (!targetBindData.monitorList) {
				targetBindData.monitorList = [bindData_];
			} else {
				targetBindData.monitorList.push(bindData_);
			}
		}
	}

	/** 删除对象绑定数据 */
	private _delTargetBindData(target_: any, bindData_: _MKMonitor.TargetBindMonitorData): null | Promise<any> {
		// 安检
		if (!target_ || !bindData_) {
			return null;
		}

		/** 对象绑定数据 */
		const targetBindData = this._targetBindData.get(target_);

		if (!targetBindData) {
			return null;
		}

		// 删除绑定监听
		if (bindData_.monitor && targetBindData.monitorList) {
			const indexNum = targetBindData!.monitorList!.findIndex((v) => {
				return v.target === bindData_.target && v.key === bindData_.key && v.monitor === bindData_.monitor;
			});

			if (indexNum !== -1) {
				return targetBindData!.monitorList!.splice(indexNum, 1)[0].monitor?.offCallbackFunc?.();
			}
		}

		return null;
	}

	/** 监听数据更新 */
	private _on<T, T2 extends keyof T>(value_: T, key_: T2, data_: _MKMonitor.TypeMonitorData<T[T2]>): _MKMonitor.TypeOnCallback<T[T2]> | null {
		/** 绑定数据 */
		const bindData = this._getBindData(value_, key_, true);

		if (!bindData) {
			this._log.error("获取绑定数据错误");

			return null;
		}

		// 添加回调
		{
			if (!bindData.monitorList) {
				bindData.monitorList = [];
			}

			bindData.monitorList?.push(data_);
		}

		// 添加对象绑定数据
		if (data_.target) {
			this._addTargetBindData(data_.target, {
				monitor: data_,
				target: value_,
				key: key_,
			});
		}

		return data_.onCallbackFunc;
	}

	/** 启用监听事件 */
	private _setListenerState(isListener_: boolean, target_: any): void;
	private _setListenerState<T, T2 extends keyof T>(isListener_: boolean, value_: T, key_: T2, target_?: any): void;
	private _setListenerState<T, T2 extends keyof T>(
		isListener_: boolean,
		value_: T,
		key_: T2,
		callbackFunc_: _MKMonitor.TypeOnCallback<T[T2]>,
		target_?: any
	): void;
	private _setListenerState<T, T2 extends keyof T>(isListener_: boolean, args_: T, key_?: T2, args3_?: any, target_?: any): void {
		let target = target_;
		let value: T | undefined;
		let callbackFunc: _MKMonitor.TypeOnCallback<T[T2]> | undefined;

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

			// callbackFunc_
			if (typeof args3_ === "function") {
				callbackFunc = args3_;
			}
		}

		if (value) {
			const bindData = this._getBindData(value, key_!, false);

			if (!bindData) {
				return;
			}

			// 更新指定回调
			if (callbackFunc) {
				if (!bindData.monitorList) {
					return;
				}

				let indexNum: number;

				if (target) {
					indexNum = bindData.monitorList.findIndex((v) => v.target === target && v.onCallbackFunc === callbackFunc);
				} else {
					indexNum = bindData.monitorList.findIndex((v) => v.onCallbackFunc === callbackFunc);
				}

				if (indexNum !== -1) {
					bindData.monitorList[indexNum].isDisabled = !isListener_;
				}
			}
			// 更新指定对象
			else if (target) {
				if (!bindData.monitorList) {
					return;
				}

				bindData.monitorList.forEach((v) => {
					if (v.target === target) {
						v.isDisabled = !isListener_;
					}
				});
			}
			// 更新所有回调
			else {
				bindData.isDisabled = !isListener_;
			}
		} else if (target_) {
			const targetBindData = this._targetBindData.get(target_);

			if (!targetBindData) {
				return;
			}

			targetBindData.isDisabled = !isListener_;
		}
	}
}

const mkMonitor = MKMonitor.instance();

export default mkMonitor;
