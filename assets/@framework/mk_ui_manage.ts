import * as cc from "cc";
import global_event from "../@config/global_event";
import mk_instance_base from "./mk_instance_base";
import mk_logger from "./mk_logger";
import mk_view_base from "./module/mk_view_base";
import mk_obj_pool from "./mk_obj_pool";
import cache, { mk_asset_ } from "./resources/mk_asset";
import mk_status_task from "./task/mk_status_task";
import mk_tool from "./@private/tool/mk_tool";

namespace _mk_ui_manage {
	export type source_type<T extends { type_s?: string } | {}> =
		| cc.Prefab
		| string
		| cc.Node
		| (T extends { type_s: string } ? Record<T["type_s"], cc.Prefab | string | cc.Node> & { default: cc.Prefab | string | cc.Node } : never);
}

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
	/** 模块注册任务表（用于 open 时等待注册） */
	private _ui_regis_task_map = new Map<any, mk_status_task>();
	/** 模块加载表（用于检测重复加载） */
	private _ui_load_map = new Map<any, mk_status_task>();
	/** 模块对象池 */
	private _ui_pool_map = new Map<any, Map<string, mk_obj_pool<cc.Node>>>();
	/** 隐藏模块列表长度 */
	private _ui_hidden_length_n = 0;
	/** 模块隐藏集合 */
	private _ui_hidden_set = new Set<mk_view_base>();
	/** 当前展示模块列表 */
	private _ui_show_as: mk_view_base[] = [];
	/** 当前模块列表表 */
	private _ui_map = new Map<any, mk_view_base[]>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 注册模块
	 * @param key_ 模块名
	 * @param source_ 模块来源
	 * @param config_ 模块配置
	 * @returns
	 */
	async regis<T extends cc.Constructor<mk_view_base>>(
		key_: T,
		source_: _mk_ui_manage.source_type<T>,
		config_?: Partial<mk_ui_manage_.regis_config<T>>
	): Promise<void> {
		// 等待模块注册
		await this._ui_regis_task_map.get(key_)?.task;

		// 如果已经注册
		if (this._ui_regis_map.has(key_)) {
			await this.unregis(key_);
		}

		/** 注册数据 */
		const regis_data = new mk_ui_manage_.regis_data<T>({
			...config_,
			source: source_,
		});
		/** 注册任务 */
		const regis_task = new mk_status_task(false);

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

			// 完成注册任务
			regis_task!.finish(true);
			// 删除注册任务
			this._ui_regis_task_map.delete(key_);
		};

		/** 来源表 */
		const source_tab: Record<string, string | cc.Prefab | cc.Node | undefined> = Object.create(null);
		/** 来源失效计数 */
		let source_invalid_count = 0;

		// 初始化来源表
		{
			// 资源路径/克隆节点
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
				source = await cache.get(v, regis_data.load_config ?? cc.Prefab);
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

			// 初始化对象池
			obj_pool_map.set(
				k_s,
				new mk_obj_pool<cc.Node>({
					create_f: async () => {
						// 不存在预制体开始加载
						if (!source && typeof v === "string") {
							source = (await cache.get(v, regis_data.load_config ?? cc.Prefab))!;
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

						// 动态加载的资源手动销毁
						if (typeof v === "string" && source?.isValid) {
							(source as cc.Prefab).decRef();
						}
					},
					max_hold_n: regis_data.pool_max_hold_n,
					init_fill_n: regis_data.pool_init_fill_n,
					fill_n: regis_data.pool_fill_n,
				})
			);
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
	 * @param key_ 模块键
	 * @returns
	 */
	async unregis<T extends cc.Constructor<mk_view_base>>(key_: T): Promise<void> {
		// 等待注册完成
		await this._ui_regis_task_map.get(key_)?.task;

		// 未注册
		if (!this._ui_regis_map.has(key_)) {
			return;
		}

		// 清理注册表
		this._ui_regis_map.delete(key_);

		// 清理节点池
		this._ui_pool_map.get(key_)?.forEach((v) => {
			v.clear();
		});
		this._ui_pool_map.delete(key_);
	}

	/** 获取所有模块 */
	get(): ReadonlyArray<mk_view_base>;
	/**
	 * 获取指定模块
	 * @param key_ 模块键
	 * @param type_ 模块类型
	 */
	// @ts-ignore
	get<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
		key_: T,
		// @ts-ignore
		type_?: T["type_s"]
	): T2 | null;
	/**
	 * 获取指定模块列表
	 * @param key_ 模块键列表 [type]
	 * @param type_ 模块类型
	 */
	// @ts-ignore
	get<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
		key_: T[],
		// @ts-ignore
		type_?: T["type_s"]
	): ReadonlyArray<T2>;
	// @ts-ignore
	get<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
		key_?: T | T[],
		// @ts-ignore
		type_?: T["type_s"]
	): mk_view_base[] | T2 | T2[] | null {
		// 获取所有模块
		if (!key_) {
			return this._ui_show_as;
		}
		// 获取 指定模块 | 指定模块列表
		else {
			let ui_as = this._ui_map.get(Array.isArray(key_) ? key_[0] : key_);

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
	 * @param key_ 模块类型，必须经过 {@inheritdoc mk_ui_manage.regis} 接口注册过
	 * @returns
	 */
	// @ts-ignore
	async open<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(key_: T, config_?: mk_ui_manage_.open_config<T>): Promise<T2 | null> {
		if (!key_) {
			this._log.error("参数错误");
			return null;
		}
		/** 注册数据 */
		let regis_data = this._ui_regis_map.get(key_);

		// 自动注册
		if (!regis_data && this.get_regis_data_f) {
			regis_data = await this.get_regis_data_f(key_);

			if (regis_data) {
				await this.regis(key_, regis_data.source, regis_data);
			}
		}

		// 安检
		if (!regis_data) {
			this._log.error(cc.js.getClassName(key_), "模块未注册");
			return null;
		}

		config_ = new mk_ui_manage_.open_config(config_);

		/** 父节点 */
		const parent = config_.parent ?? regis_data.parent;

		if (!parent?.isValid) {
			this._log.error("无效父节点");
			return null;
		}
		// 检测重复加载
		{
			let task = this._ui_load_map.get(key_);

			if (!task) {
				this._ui_load_map.set(key_, (task = new mk_status_task(false)));
			}
			// 重复加载
			else if (!regis_data.repeat_b && !task.finish_b) {
				return null;
			}
			// 加载中
			else {
				task.finish(false);
			}
		}

		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
		/** 退出回调 */
		const exit_callback_f = (state_b: boolean): T2 => {
			// 更新加载状态
			this._ui_load_map.get(key_)!.finish(true);

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
				if (v.node.active) {
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
				view_config: {
					prefab_tab: regis_data.source as any,
					type_s: config_.type as any,
				},
			};

			// 加入父节点
			parent.addChild(view_comp.node);

			// 生命周期
			{
				await view_comp.create?.();
				await view_comp._open({
					init: config_.init,
					first_b: true,
				});
			}
		}

		return exit_callback_f(true);
	}

	/**
	 * 关闭 ui
	 * @param args_ 节点/模块类型/模块实例
	 * @param config 配置
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

		// 动态模块(视图 & 数据)更新
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
				// 更新隐藏模块下标（关闭了隐藏的模块）
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
			await v._close({
				first_b: true,
				destroy_children_b: config.destroy_children_b,
			});

			// 节点已在生命周期内被销毁
			if (!v.node?.isValid) {
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
				v2.clear();
			});
		});

		// 重置数据
		mk_tool.object.reset(this, true);
	}
}

export namespace mk_ui_manage_ {
	/** 关闭ui配置 */
	export class close_config<CT extends cc.Constructor<mk_view_base>> {
		constructor(init_?: close_config<CT>) {
			Object.assign(this, init_);

			if (this.destroy_b && this.destroy_children_b === undefined) {
				this.destroy_children_b = true;
			}
		}

		/** 类型 */
		// @ts-ignore
		type?: CT["type_s"];
		/** 关闭全部指定类型的模块 */
		all_b?: boolean;
		/** 销毁节点 */
		destroy_b?: boolean;
		/** 销毁动态子节点
		 * @defaultValue
		 * destroy_b
		 */
		destroy_children_b?: boolean;
	}

	/** 打开ui配置 */
	export class open_config<CT extends cc.Constructor<mk_view_base>> {
		constructor(init_?: open_config<CT>) {
			Object.assign(this, init_);
		}

		/** 初始化数据 */
		// @ts-ignore
		init?: CT["init_data"];
		/** 类型 */
		// @ts-ignore
		type?: CT["type_s"] = "default";
		/** 父节点 */
		parent?: cc.Node;
	}

	/** 模块注册配置 */
	export class regis_config<CT extends cc.Constructor<mk_view_base>> {
		constructor(init_?: Partial<regis_config<CT>>) {
			if (!init_) {
				return;
			}
			Object.assign(this, init_);

			if (this.pool_fill_n === undefined) {
				this.pool_fill_n = this.repeat_b ? 8 : 1;
			}
		}

		/**
		 * 重复打开
		 * @defaultValue
		 * false
		 */
		repeat_b = false;
		/** 默认父节点（默认 canvas 节点） */
		/**
		 * 默认父节点
		 * @defaultValue
		 * Canvas 节点
		 */
		parent = cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node;
		/** 加载配置 */
		load_config?: mk_asset_.get_config<cc.Prefab>;
		/**
		 * 对象池数量不足时扩充数量
		 * @defaultValue
		 * this.repeat_b ? 8 : 1
		 */
		pool_fill_n!: number;
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

	/** 模块注册数据 */
	export class regis_data<CT extends cc.Constructor<mk_view_base>> extends regis_config<CT> {
		constructor(init_?: Partial<regis_data<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 来源 */
		source!: _mk_ui_manage.source_type<CT>;
	}
}

export default mk_ui_manage.instance();
