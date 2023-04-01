import * as cc from "cc";
import global_event from "../@config/global_event";
import mk_instance_base from "./mk_instance_base";
import mk_logger from "./mk_logger";
import mk_view_base from "./module/mk_view_base";
import mk_obj_pool from "./mk_obj_pool";
import cache, { mk_asset_ } from "./resources/mk_asset";
import mk_status_task from "./task/mk_status_task";
import mk_tool from "./@private/tool/mk_tool";

export class mk_ui_manage extends mk_instance_base {
	constructor() {
		super();

		if (!mk_ui_manage._init_b) {
			mk_ui_manage._init_b = true;

			// 事件监听
			global_event.on(global_event.key.restart, this._event_restart, this);
		}
	}

	/* --------------- static --------------- */
	/** 初始化状态 */
	private static _init_b = false;
	/* --------------- public --------------- */
	/** 资源路径解析（在未注册模块时获取注册配置会使用此函数自动注册） */
	prefab_path_resolution_f?: <T extends cc.Constructor<mk_view_base>>(target: T) => null | Partial<mk_ui_manage_.regis_config<T>>;
	/* --------------- private --------------- */
	/** 日志 */
	private _log = new mk_logger("ui_manage");
	/** 模块注册表 */
	private _ui_regis_map = new Map<any, mk_ui_manage_.regis_config<any>>();
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
	 * 模块注册
	 * @param key_ 模块名
	 * @param config_ 模块配置，prefab | prefab_all 必存其一
	 * @returns
	 */
	regis<T extends cc.Constructor<mk_view_base>>(key_: T, config_: Partial<mk_ui_manage_.regis_config<T>>): Promise<void> | null {
		const config = new mk_ui_manage_.regis_config<T>(config_);

		if (!config.prefab) {
			this._log.log("预制体资源丢失");
			return null;
		}
		/** 注册任务 */
		const regis_task = new mk_status_task(false);

		// 添加注册任务
		this._ui_regis_task_map.set(key_, regis_task);

		// 更新注册配置
		this._ui_regis_map.set(key_, config);
		return new Promise<void>(async (resolve_f, reject_f) => {
			/** 节点池 */
			const obj_pool_map = new Map<string, mk_obj_pool<cc.Node>>();
			/** 退出回调 */
			const exit_callback_f = (status_b: boolean): void => {
				if (!status_b) {
					obj_pool_map.forEach((v) => v.clear());
					resolve_f();
					return;
				}
				regis_task.finish(true);
				resolve_f();
			};

			// 获取资源
			{
				/** 预制体信息 */
				const prefab_tab: Record<string, string | cc.Prefab | undefined> = Object.create(null);

				// 初始化预制体信息
				{
					if (typeof config.prefab !== "object") {
						prefab_tab["default"] = config.prefab;
					} else {
						Object.assign(prefab_tab, config.prefab);
					}
					config.prefab = prefab_tab as any;
				}

				// 加载资源
				{
					for (const k_s in prefab_tab) {
						let prefab: cc.Prefab;
						const v = prefab_tab[k_s];

						if (!v) {
							continue;
						}

						// 提前加载资源
						if (config_.load_prefab_b) {
							// 加载 prefab
							if (typeof v === "string") {
								const asset = await cache.get(v, config_.load_config ?? cc.Prefab);

								// 资源加载失败
								if (!asset) {
									exit_callback_f(false);
									return;
								}
								prefab = asset;
							}
							// 直接引用
							else {
								prefab = v;
							}
							if (!prefab?.isValid) {
								this._log.error(`资源失效`, v);
								continue;
							}
						}
						// 不加载
						else if (typeof v !== "string") {
							prefab = v;
							if (!prefab?.isValid) {
								this._log.error(`资源失效`, v);
								continue;
							}
						}

						// 初始化对象池
						obj_pool_map.set(
							k_s,
							new mk_obj_pool({
								create_f: async () => {
									// 不存在预制体开始加载
									if (!prefab && typeof v === "string") {
										prefab = (await cache.get(v, config_.load_config ?? cc.Prefab))!;

										if (!prefab) {
											return null!;
										}
									}
									return cc.instantiate(prefab);
								},
								clear_f: (obj_as) => {
									if (typeof v === "string" && prefab.isValid) {
										prefab.decRef();
									}
								},
								max_hold_n: config.pool_max_hold_n,
								init_fill_n: config.pool_init_fill_n,
								fill_n: config.pool_fill_n,
							})
						);
					}
				}
			}

			// 释放上个资源
			this._ui_pool_map.get(key_)?.forEach((v) => {
				v.clear();
			});
			// 设置新资源
			this._ui_pool_map.set(key_, obj_pool_map);
			exit_callback_f(true);
		});
	}

	/** 获取所有模块 */
	get(): ReadonlyArray<mk_view_base>;
	/** 获取指定模块 */
	// @ts-ignore
	get<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
		key_: T,
		// @ts-ignore
		type_?: T["type_s"]
	): T2 | null;
	/** 获取指定模块列表 */
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
	): ReadonlyArray<mk_view_base> | T2 | ReadonlyArray<T2> | null {
		return this._get(key_ as any, type_) as any;
	}

	/**
	 * 打开模块
	 * @param key_ 模块名
	 * @returns
	 */
	// @ts-ignore
	open<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(key_: T, config_?: mk_ui_manage_.open_config<T>): Promise<T2 | null> {
		return this._open(key_ as any, config_);
	}

	/**
	 * 关闭 ui
	 * @param args_ ui
	 * @param config_ 配置
	 * @returns
	 */
	close<T extends cc.Constructor<mk_view_base>, T2 extends mk_view_base>(
		args_: cc.Node | T | T2,
		config_?: mk_ui_manage_.close_config<T>
	): Promise<boolean> {
		return this._close(args_ as any, config_ as any);
	}

	// @ts-ignore
	private _get<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
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

	private async _close<T extends cc.Constructor<mk_view_base>, T2 extends mk_view_base>(
		args_: cc.Node | T | T2,
		config_: mk_ui_manage_.close_config<T> = {}
	): Promise<boolean> {
		if (!args_) {
			this._log.error("参数错误");
			return false;
		}
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
				if (config_.type) {
					if (config_.all_b) {
						close_ui_as = close_ui_as.filter((v) => v.type_s === (config_!.type as any));
					} else {
						for (let k_n = close_ui_as.length; k_n--; ) {
							if (close_ui_as[k_n].type_s === (config_.type as any)) {
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
				if (close_ui_as.length > 1 && !config_.all_b) {
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
			await v["_close"]({
				first_b: true,
				destroy_children_b: config_.destroy_children_b,
			});

			// 移除父节点
			v.node.removeFromParent();

			// 销毁
			if (config_.destroy_b || v.static_b) {
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

	// @ts-ignore
	private async _open<T extends cc.Constructor<mk_view_base>, T2 = T["prototype"]>(
		key_: T,
		config_?: mk_ui_manage_.open_config<T>
	): Promise<T2 | null> {
		if (!key_) {
			this._log.error("参数错误");
			return null;
		}
		/** 注册配置 */
		let regis_config = this._ui_regis_map.get(key_);

		// 自动注册
		if (!regis_config && this.prefab_path_resolution_f) {
			const config = await this.prefab_path_resolution_f(key_ as any);

			if (config) {
				await this.regis(key_ as any, config);
				regis_config = this._ui_regis_map.get(key_);
			}
		}

		// 安检
		if (!regis_config) {
			this._log.error(cc.js.getClassName(key_), "模块未注册");
			return null;
		}

		config_ = new mk_ui_manage_.open_config(config_);

		/** 父节点 */
		const parent = config_.parent ?? regis_config.parent;

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
			else if (!regis_config.repeat_b && !task.finish_b) {
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
		// 启动模块
		{
			// 模块配置
			view_comp.config = {
				static_b: false,
				view_config: {
					prefab_tab: regis_config.prefab as any,
					type_s: config_.type as any,
				},
			};

			// 加入父节点
			parent.addChild(view_comp.node);

			// 生命周期
			{
				await view_comp.create?.();
				await view_comp["_open"]({
					init: config_.init,
					first_b: true,
				});
			}
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

		return exit_callback_f(true);
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
		mk_tool.object.reset(this);
	}
}

export namespace mk_ui_manage_ {
	/** 关闭ui配置 */
	export interface close_config<CT extends cc.Constructor<mk_view_base>> {
		/** 类型 */
		// @ts-ignore
		type?: CT["type_s"];
		/** 关闭全部指定类型的模块 */
		all_b?: boolean;
		/** 销毁节点 */
		destroy_b?: boolean;
		/** 销毁动态子节点（默认回收） */
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
			Object.assign(this, init_);
			if (this.pool_fill_n === undefined) {
				this.pool_fill_n = this.repeat_b ? 32 : 1;
			}
		}

		/** 默认预制体路径|资源 */
		prefab?:
			| cc.Prefab
			| string
			// @ts-ignore
			| ({ [k in CT["type_s"]]: cc.Prefab | string } & { default: cc.Prefab | string });

		/** 重复打开 */
		repeat_b = false;
		/** 默认父节点（默认 canvas 节点） */
		parent = cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node;
		/** 加载资源 */
		load_prefab_b = true;
		/** 加载配置 */
		load_config?: mk_asset_.get_config<cc.Prefab>;
		/** 对象池：剩余对象池数量不足时扩充数量，默认值 = repeat_b ? 32 : 1 */
		pool_fill_n!: number;
		/** 对象池：最大保留数量（不足时添加，-1为不启用） */
		pool_max_hold_n = -1;
		/** 对象池：初始化扩充数量 */
		pool_init_fill_n = 1;
	}
}

export default mk_ui_manage.instance();
