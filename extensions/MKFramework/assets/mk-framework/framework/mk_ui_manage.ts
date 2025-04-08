import * as cc from "cc";
import global_event from "../config/global_event";
import mk_instance_base from "./mk_instance_base";
import mk_logger from "./mk_logger";
import mk_view_base from "./module/mk_view_base";
import mk_obj_pool from "./mk_obj_pool";
import mk_asset, { mk_asset_ } from "./resources/mk_asset";
import mk_status_task from "./task/mk_status_task";
import mk_tool from "./@private/tool/mk_tool";
import { mk_release_ } from "./mk_release";

namespace _mk_ui_manage {
	/** 模块类型 */
	// @ts-ignore
	export type type_module<T extends cc.Constructor<mk_view_base>> = T["prototype"]["type_s"] | "default";

	/** 注册资源类型 */
	export type type_regis_source<T extends cc.Constructor<mk_view_base>> =
		| cc.Prefab
		| string
		| cc.Node
		| (T extends cc.Constructor<mk_view_base> ? Record<type_module<T>, cc.Prefab | string | cc.Node> : never);
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
export class mk_ui_manage extends mk_instance_base {
	constructor() {
		super();

		// 事件监听
		global_event.on(global_event.key.restart, this._event_restart, this);
	}

	/* --------------- public --------------- */
	/**
	 * 获取模块注册数据
	 * @remarks
	 * open 未注册模块时会使用此函数获取注册数据自动注册
	 */
	get_regis_data_f?: <T extends cc.Constructor<mk_view_base>>(key: T) => mk_ui_manage_.regis_data<T>;
	/* --------------- private --------------- */
	/** 日志 */
	private _log = new mk_logger("ui_manage");
	/** 模块注册表 */
	private _ui_regis_map = new Map<any, mk_ui_manage_.regis_data<any>>();
	/**
	 * 模块注册任务表
	 * @remarks
	 * 用于 open 时等待注册
	 */
	private _ui_regis_task_map = new Map<any, mk_status_task>();
	/**
	 * 模块加载表
	 * @remarks
	 * 用于检测重复加载
	 */
	private _ui_load_map = new Map<any, mk_status_task>();
	/** 模块对象池 */
	private _ui_pool_map = new Map<any, Map<string, mk_obj_pool<cc.Node>>>();
	/** 隐藏模块列表长度 */
	private _ui_hidden_length_n = 0;
	/** 模块隐藏集合 */
	private _ui_hidden_set = new Set<mk_view_base>();
	/** 当前展示模块列表 */
	private _ui_show_as: mk_view_base[] = [];
	/** 当前模块表 */
	private _ui_map = new Map<any, mk_view_base[]>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册模块
	 * @param key_ 模块键
	 * @param source_ 模块来源
	 * @param target_ 跟随释放对象
	 * @param config_ 模块配置
	 * @returns
	 */
	async regis<T extends cc.Constructor<mk_view_base>>(
		key_: T,
		source_: _mk_ui_manage.type_regis_source<T>,
		target_: mk_release_.type_follow_release_object<mk_release_.type_release_call_back> | null,
		config_?: Partial<mk_ui_manage_.regis_config<T>>
	): Promise<void> {
		/** 模块注册任务 */
		const ui_regis_task = this._ui_regis_task_map.get(key_);

		// 等待模块注册
		if (ui_regis_task) {
			return ui_regis_task.task;
		}

		// 如果已经注册
		if (this._ui_regis_map.has(key_)) {
			return;
		}

		// 跟随对象释放
		target_?.follow_release(async () => {
			await this.unregis(key_);
		});

		/** 注册任务 */
		const regis_task = new mk_status_task(false);

		/** 注册数据 */
		const regis_data = new mk_ui_manage_.regis_data<T>({
			...config_,
			source: source_,
		});

		// 添加注册任务
		this._ui_regis_task_map.set(key_, regis_task);
		// 更新注册配置
		this._ui_regis_map.set(key_, regis_data);

		/** 节点池 */
		const obj_pool_map = new Map<string, mk_obj_pool<cc.Node>>();

		/** 退出回调 */
		const exit_callback_f = async (status_b: boolean): Promise<void> => {
			if (!status_b) {
				await this.unregis(key_);
			}

			// 删除注册任务
			this._ui_regis_task_map.delete(key_);
			// 完成注册任务
			regis_task!.finish(true);
		};

		/** 来源表 */
		const source_tab: Record<string, string | cc.Prefab | cc.Node | undefined> = Object.create(null);
		/** 来源失效计数 */
		let source_invalid_count = 0;

		// 初始化来源表
		{
			// 资源路径/节点
			if (typeof source_ !== "object" || source_ instanceof cc.Node) {
				source_tab["default"] = source_;
			}
			// 资源表
			else {
				Object.assign(source_tab, source_);
			}
		}

		// 初始化对象池
		for (const k_s in source_tab) {
			let source: cc.Prefab | cc.Node | null = null;
			const v = source_tab[k_s];

			if (!v) {
				continue;
			}

			// 资源路径
			if (typeof v === "string" && regis_data.pool_init_fill_n > 0) {
				source = await mk_asset.get(v, cc.Prefab, null, regis_data.load_config);
			}

			// 预制体/节点
			if (typeof v !== "string" && v?.isValid) {
				source = v;
			}

			if (!source?.isValid && !(typeof v === "string" && regis_data.pool_init_fill_n === 0)) {
				this._log.error(`${k_s} 类型资源失效`, v);
				source_invalid_count++;
				continue;
			}

			/** 对象池 */
			const obj_pool = new mk_obj_pool<cc.Node>({
				create_f: async () => {
					// 不存在预制体开始加载
					if (!source && typeof v === "string") {
						source = (await mk_asset.get(v, cc.Prefab, null, regis_data.load_config))!;
					}

					if (!source?.isValid) {
						this._log.error(`${k_s} 类型资源失效`, v);

						return null;
					}

					return cc.instantiate(source as any);
				},
				clear_f: async (obj_as) => {
					obj_as.forEach((v) => {
						v.destroy();
					});
				},
				destroy_f: () => {
					// 动态加载的资源手动销毁
					if (typeof v === "string" && source?.isValid) {
						(source as cc.Prefab).decRef();
					}
				},
				max_hold_n: regis_data.pool_max_hold_n,
				min_hold_n: regis_data.pool_min_hold_n,
				init_fill_n: regis_data.pool_init_fill_n,
			});

			// 初始化对象池
			await obj_pool.init_task.task;
			obj_pool_map.set(k_s, obj_pool);
		}

		// 如果全部类型资源都失效
		if (source_invalid_count !== 0 && source_invalid_count === Object.keys(source_tab).length) {
			return await exit_callback_f(false);
		}

		// 设置模块池
		this._ui_pool_map.set(key_, obj_pool_map);

		return await exit_callback_f(true);
	}

	/**
	 * 取消注册模块
	 * @remarks
	 * 注意如果你如果在注册时 target_ 参数不为 null，那么模块资源将跟随 target_ 对象释放，
	 * 除非你想提前释放，否则不用手动调用此接口
	 * @param key_ 模块键
	 * @returns
	 */
	async unregis<T extends cc.Constructor<mk_view_base>>(key_: T): Promise<void> {
		/** 模块注册任务 */
		const ui_regis_task = this._ui_regis_task_map.get(key_);

		// 等待模块注册
		if (ui_regis_task) {
			await ui_regis_task.task;
		}

		// 未注册
		if (!this._ui_regis_map.has(key_)) {
			return;
		}

		// 清理当前 UI
		await this.close(key_, {
			all_b: true,
			destroy_b: true,
		});

		// 清理当前模块表
		this._ui_map.delete(key_);
		// 清理模块加载表
		this._ui_load_map.delete(key_);
		// 清理注册表
		this._ui_regis_map.delete(key_);
		// 清理节点池
		{
			const pool = this._ui_pool_map.get(key_);

			if (pool) {
				for (const [k_s, v] of pool) {
					await v.destroy();
				}

				this._ui_pool_map.delete(key_);
			}
		}
	}

	/** 获取所有模块 */
	get(): ReadonlyArray<mk_view_base>;
	/**
	 * 获取指定模块
	 * @param key_ 模块键
	 * @param type_ 模块类型
	 */
	get<T extends mk_ui_manage_.type_open_key, T2 = _mk_ui_manage.type_module<T>, T3 = T["prototype"]>(key_: T, type_?: T2): T3 | null;
	/**
	 * 获取指定模块列表
	 * @param key_ 模块键列表 [type]
	 * @param type_ 模块类型
	 */
	get<T extends mk_ui_manage_.type_open_key, T2 = _mk_ui_manage.type_module<T>, T3 = T["prototype"]>(key_: T[], type_?: T2): ReadonlyArray<T3>;
	get<T extends mk_ui_manage_.type_open_key, T2 = _mk_ui_manage.type_module<T>, T3 = T["prototype"]>(
		key_?: T | T[],
		type_?: T2
	): mk_view_base[] | T3 | T3[] | null {
		// 获取所有模块
		if (!key_) {
			return this._ui_show_as.filter((v) => v.valid_b);
		}
		// 获取 指定模块 | 指定模块列表
		else {
			let ui_as = this._ui_map.get(Array.isArray(key_) ? key_[0] : key_)?.filter((v) => v.valid_b);

			// 筛选类型
			if (type_ && ui_as) {
				ui_as = ui_as.filter((v) => v.type_s === (type_ as any));
			}

			// 获取模块列表
			if (Array.isArray(key_)) {
				return ui_as ?? [];
			}
			// 获取模块
			else {
				return ui_as?.length ? (ui_as[ui_as.length - 1] as any) : null;
			}
		}
	}

	/**
	 * 打开模块
	 * @param key_ 模块键，必须经过 {@link regis} 接口注册过
	 * @param config_ 打开配置
	 * @returns
	 */
	async open<T extends mk_ui_manage_.type_open_key, T2 = T["prototype"]>(key_: T, config_?: mk_ui_manage_.open_config<T>): Promise<T2 | null> {
		if (!key_) {
			this._log.error("参数错误");

			return null;
		}

		/** 模块注册任务 */
		const ui_regis_task = this._ui_regis_task_map.get(key_);

		// 等待模块注册
		if (ui_regis_task) {
			await ui_regis_task.task;
		}

		/** 注册数据 */
		let regis_data = this._ui_regis_map.get(key_);

		// 自动注册
		if (!regis_data && this.get_regis_data_f) {
			regis_data = await this.get_regis_data_f(key_);

			if (regis_data) {
				await this.regis(key_, regis_data.source, regis_data.target, regis_data);
			}
		}

		// 安检
		if (!regis_data) {
			this._log.error(cc.js.getClassName(key_), "模块未注册");

			return null;
		}

		config_ = new mk_ui_manage_.open_config(config_);

		/** 父节点 */
		const parent = config_.parent !== undefined ? config_.parent : regis_data.parent;

		// 检测重复加载
		{
			let task = this._ui_load_map.get(key_);

			// 首次加载
			if (!task) {
				this._ui_load_map.set(key_, (task = new mk_status_task(false)));
			}
			// 再次加载
			else {
				if (
					// 禁止重复加载
					!regis_data.repeat_b &&
					// 存在打开的模块
					(this.get([key_]).length !== 0 ||
						// 正在打开中
						!task.finish_b)
				) {
					this._log.debug("模块重复加载");

					return null;
				}

				task.finish(false);
			}
		}

		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		/** 退出回调 */
		const exit_callback_f = (state_b: boolean): T2 => {
			// 更新加载状态
			this._ui_load_map.get(key_)?.finish(true);

			return view_comp as any;
		};

		/** 注册任务 */
		const regis_task = this._ui_regis_task_map.get(key_);
		/** 视图组件 */
		let view_comp: mk_view_base;

		// 等待模块注册
		if (regis_task && !regis_task.finish_b) {
			await regis_task.task;
		}

		// 加载模块
		{
			/** 模块池 */
			const ui_pool = this._ui_pool_map.get(key_)!;
			/** 节点池 */
			const node_pool = ui_pool.get(config_.type as any);

			if (!node_pool) {
				this._log.error("模块类型错误");

				return exit_callback_f(false);
			}

			const node = await node_pool.get();

			if (!node) {
				this._log.warn("对象池资源为空");

				return exit_callback_f(false);
			}

			const comp = node.getComponent(key_) ?? node.addComponent(key_);

			if (!comp) {
				this._log.error("节点未挂载视图组件");
				node.destroy();

				return exit_callback_f(false);
			}

			view_comp = comp;
		}

		// 更新单独展示
		if (view_comp.show_alone_b) {
			this._ui_show_as.slice(this._ui_hidden_length_n, this._ui_show_as.length).forEach((v) => {
				if (v.valid_b && v.node.active) {
					this._ui_hidden_set.add(v);
					v.node.active = false;
				}
			});

			this._ui_hidden_length_n = this._ui_show_as.length;
		}

		// 更新管理器数据
		{
			this._ui_show_as.push(view_comp);
			let ui_as = this._ui_map.get(key_);

			if (!ui_as) {
				this._ui_map.set(key_, (ui_as = []));
			}

			ui_as.push(view_comp);
		}

		// 启动模块
		{
			// 模块配置
			view_comp.config = {
				static_b: false,
				type_s: config_.type as string,
			};

			// 加入父节点
			if (parent) {
				parent.addChild(view_comp.node);
			}

			// 生命周期
			await view_comp._open({
				init: config_.init,
				first_b: true,
			});
		}

		// 模块已被关闭
		if (!view_comp.valid_b) {
			this._log.warn(`模块 ${cc.js.getClassName(view_comp)} 在 open 内被关闭`);

			return exit_callback_f(false);
		}

		return exit_callback_f(true);
	}

	/**
	 * 关闭模块
	 * @param args_ 节点/模块键/模块实例
	 * @param config_ 关闭配置
	 * @returns
	 */
	async close<T extends cc.Constructor<mk_view_base>, T2 extends mk_view_base>(
		args_: cc.Node | T | T2,
		config_?: mk_ui_manage_.close_config<T>
	): Promise<boolean> {
		if (!args_) {
			this._log.error("参数错误");

			return false;
		}

		const config = new mk_ui_manage_.close_config(config_);
		let key_: T | undefined;
		let node_: cc.Node | undefined;
		let view_: T2 | undefined;

		// 参数转换
		{
			if (args_ instanceof cc.Node) {
				node_ = args_;
			} else if (args_ instanceof mk_view_base) {
				view_ = args_ as any;
			} else {
				key_ = args_ as T;
			}
		}

		/** 关闭的模块列表 */
		let close_ui_as: mk_view_base[];

		// 初始化关闭模块数据
		if (node_) {
			close_ui_as = [node_.getComponent(mk_view_base)!].filter((v) => v);
		} else if (view_) {
			close_ui_as = [view_];
		} else {
			// 查找模块
			{
				const ui_as = this._ui_map.get(key_);

				if (!ui_as?.length) {
					return false;
				}

				close_ui_as = ui_as.slice(0);
			}

			// 筛选关闭的模块
			{
				// 筛选类型
				if (config.type) {
					if (config.all_b) {
						close_ui_as = close_ui_as.filter((v) => v.type_s === (config!.type as any));
					} else {
						for (let k_n = close_ui_as.length; k_n--; ) {
							if (close_ui_as[k_n].type_s === (config.type as any)) {
								close_ui_as = [close_ui_as[k_n]];
								break;
							}
						}
					}

					if (!close_ui_as.length) {
						return false;
					}
				}

				// 非关闭所有则关闭最后模块
				if (close_ui_as.length > 1 && !config.all_b) {
					close_ui_as = [close_ui_as[close_ui_as.length - 1]];
				}
			}
		}

		// 无关闭模块返回
		if (!close_ui_as.length) {
			// 关闭节点直接销毁
			if (node_?.isValid && !node_.getComponent(mk_view_base)) {
				node_.removeFromParent();
				node_.destroy();
			}

			return false;
		}

		// 动态模块(视图/数据)更新
		close_ui_as.forEach((v) => {
			if (v.static_b) {
				return;
			}

			// 更新单独展示
			{
				/** 模块列表下标 */
				const ui_index_n = this._ui_show_as.lastIndexOf(v);

				// 恢复隐藏的模块
				if (ui_index_n === this._ui_hidden_length_n) {
					/** 模块隐藏列表 */
					const ui_hidden_as = this._ui_show_as.slice(0, this._ui_hidden_length_n);
					/** 新的隐藏模块下标 */
					let new_hidden_index_n = 0;

					// 查找新的隐藏模块下标
					for (let k_n = ui_hidden_as.length; k_n--; ) {
						if (ui_hidden_as[k_n].show_alone_b) {
							new_hidden_index_n = k_n;
							break;
						}
					}

					// 重新展示已经隐藏的模块
					{
						// 激活模块
						this._ui_show_as.slice(new_hidden_index_n, this._ui_hidden_length_n).forEach((v) => {
							// 避免原本 active 为 false 的模块被激活
							if (this._ui_hidden_set.has(v)) {
								v.node.active = true;
								this._ui_hidden_set.delete(v);
							}
						});

						// 更新隐藏模块列表长度
						this._ui_hidden_length_n = new_hidden_index_n;
					}
				}
				// 关闭了隐藏的模块，更新隐藏模块下标
				else if (ui_index_n !== -1 && ui_index_n < this._ui_hidden_length_n) {
					--this._ui_hidden_length_n;
				}
			}

			// 删除模块数据
			{
				// 删除模块列表数据
				{
					const index_n = this._ui_show_as.indexOf(v);

					if (index_n !== -1) {
						// 从模块列表移除
						this._ui_show_as.splice(index_n, 1);
					}
				}

				// 删除模块表数据
				{
					const ui_as = this._ui_map.get(v.constructor)!;

					// 未纳入管理的模块
					if (!ui_as) {
						return;
					}

					const index_n = ui_as.indexOf(v);

					if (index_n !== -1) {
						// 从模块列表移除
						ui_as.splice(index_n, 1);
					}
				}
			}
		});

		// 生命周期
		for (const v of close_ui_as) {
			// 组件已经被销毁
			if (!v.isValid) {
				continue;
			}

			await v._close?.({
				first_b: true,
				destroy_children_b: config.destroy_children_b,
			});

			// 节点已在生命周期内被销毁
			if (!cc.isValid(v.node, true)) {
				continue;
			}

			// 移除父节点
			v.node.removeFromParent();

			// 销毁
			if (config.destroy_b || v.static_b) {
				v.node.destroy();
			}
			// 回收模块
			else if (v.constructor) {
				/** 模块池 */
				const ui_pool = this._ui_pool_map.get(v.constructor);

				if (!ui_pool) {
					continue;
				}

				/** 节点池 */
				const node_pool = ui_pool?.get(v.type_s);

				if (!node_pool) {
					this._log.error("回收模块错误，未找到指定节点池类型", v.type_s);
					continue;
				}

				node_pool.put(v.node);
			}
		}

		return true;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private async _event_restart(): Promise<void> {
		// 等待场景关闭
		await Promise.all(global_event.request(global_event.key.wait_close_scene));

		// 释放对象池
		this._ui_pool_map.forEach((v) => {
			v.forEach((v2) => {
				v2.destroy();
			});
		});

		// 重置数据
		mk_tool.object.reset(this, true);
	}
}

export namespace mk_ui_manage_ {
	/** 模块打开键类型 */
	export type type_open_key = cc.Constructor<mk_view_base> & Function;

	/** 关闭ui配置 */
	export class close_config<CT extends cc.Constructor<mk_view_base>> {
		constructor(init_?: close_config<CT>) {
			Object.assign(this, init_);

			if (this.destroy_b && this.destroy_children_b === undefined) {
				this.destroy_children_b = true;
			}
		}

		/** 类型 */
		type?: _mk_ui_manage.type_module<CT>;
		/** 关闭全部指定类型的模块 */
		all_b?: boolean;
		/** 销毁节点 */
		destroy_b?: boolean;
		/**
		 * 销毁动态子节点
		 * @defaultValue
		 * destroy_b
		 */
		destroy_children_b?: boolean;
	}

	/** 打开ui配置 */
	export class open_config<CT extends mk_ui_manage_.type_open_key> {
		constructor(init_?: open_config<CT>) {
			Object.assign(this, init_);
		}

		/** 初始化数据 */
		init?: CT["prototype"]["init_data"];
		/** 类型 */
		type?: _mk_ui_manage.type_module<CT> = "default";
		/** 父节点 */
		parent?: cc.Node | null;
	}

	/** 模块注册配置 */
	export class regis_config<CT extends cc.Constructor<mk_view_base>> {
		constructor(init_?: Partial<regis_config<CT>>) {
			if (!init_) {
				return;
			}

			Object.assign(this, init_);

			if (this.pool_min_hold_n === undefined) {
				this.pool_min_hold_n = this.repeat_b ? 8 : 1;
			}
		}

		/**
		 * 可重复打开状态
		 * @defaultValue
		 * false
		 */
		repeat_b = false;
		/**
		 * 默认父节点
		 * @defaultValue
		 * Canvas 节点
		 */
		parent: cc.Scene | cc.Node | undefined = cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node;
		/** 加载配置 */
		load_config?: mk_asset_.get_config<cc.Prefab>;
		/**
		 * 对象池数量不足时扩充数量
		 * @defaultValue
		 * this.repeat_b ? 8 : 1
		 */
		pool_min_hold_n!: number;
		/**
		 * 对象池最大保留数量
		 * @defaultValue
		 * -1: 不启用
		 */
		pool_max_hold_n = -1;
		/**
		 * 对象池初始化扩充数量
		 * @defaultValue
		 * 1
		 */
		pool_init_fill_n = 1;
	}

	/**
	 * 模块注册数据
	 * @noInheritDoc
	 */
	export class regis_data<CT extends cc.Constructor<mk_view_base>> extends regis_config<CT> {
		constructor(init_?: Partial<regis_data<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 来源 */
		source!: _mk_ui_manage.type_regis_source<CT>;
		/** 跟随释放对象 */
		target!: mk_release_.type_follow_release_object<mk_release_.type_release_call_back>;
	}
}

export default mk_ui_manage.instance();
