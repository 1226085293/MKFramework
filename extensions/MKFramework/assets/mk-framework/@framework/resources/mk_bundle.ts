import mk_instance_base from "../mk_instance_base";
import mk_logger, { mk_log } from "../mk_logger";
import mk_event_target from "../mk_event_target";
import mk_network_base from "../network/mk_network_base";
import { EDITOR, PREVIEW } from "cc/env";
import * as cc from "cc";
import mk_status_task from "../task/mk_status_task";
import { mk_data_sharer_ } from "../mk_data_sharer";
import mk_tool_func from "../@private/tool/mk_tool_func";
import mk_release, { mk_release_ } from "../mk_release";

namespace _mk_bundle {
	export interface event_protocol {
		/** bundle 切换前事件 */
		before_bundle_switch(event: {
			/** 当前 bundle  */
			curr_bundle_s: string;
			/** 下个 bundle  */
			next_bundle_s: string;
		}): void;
		/** bundle 切换后事件 */
		after_bundle_switch(event: {
			/** 当前 bundle  */
			curr_bundle_s: string;
			/** 上个 bundle  */
			pre_bundle_s: string;
		}): void;
		/** 场景切换前事件 */
		before_scene_switch(event: {
			/** 当前场景 */
			curr_scene_s: string;
			/** 下个场景 */
			next_scene_s: string;
		}): void;
		/** 场景切换后事件 */
		after_scene_switch(event: {
			/** 当前场景 */
			curr_scene_s: string;
			/** 上个场景 */
			pre_scene_s: string;
		}): void;
	}
}

/**
 * bundle 管理器
 * @noInheritDoc
 * @remarks
 *
 * - 封装(加载/预加载)场景为 load_scene
 *
 * - 支持(远程/本地) bundle
 *
 * - 支持 bundle 热更
 *
 * - 封装(bundle/scene)切换事件
 *
 * - 支持 bundle 管理器，用于子游戏管理
 */
export class mk_bundle extends mk_instance_base {
	constructor() {
		super();

		if (EDITOR) {
			this.bundle_s = "main";
			this._engine_init_task.finish(true);
			this._init_task.finish(true);

			return;
		}

		// 引擎初始化事件
		cc.game.once(cc.Game.EVENT_GAME_INITED, () => {
			this._engine_init_task.finish(true);
		});

		// 模块初始化事件
		cc.director.once(
			cc.Director.EVENT_BEFORE_SCENE_LAUNCH,
			(scene: cc.Scene) => {
				if (!scene.name) {
					this._log.warn("未选择启动场景");

					return;
				}

				this.bundle_s = "main";
				this._scene_s = scene.name;
				this._init_task.finish(true);
			},
			this
		);
	}

	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<_mk_bundle.event_protocol>();
	/** 上个场景bundle */
	pre_bundle_s?: string;
	/** 上个场景名 */
	pre_scene_s!: string;
	/** bundle列表 */
	bundle_map = new Map<string, mk_bundle_.bundle_data>();
	/** 切换场景状态 */
	switch_scene_b = false;

	/** 当前场景bundle */
	get bundle_s(): string {
		return this._bundle_s;
	}

	set bundle_s(value_s_) {
		this._set_bundle_s(value_s_);
	}

	/** 当前场景名 */
	get scene_s(): string {
		return this._scene_s;
	}

	set scene_s(value_s: string) {
		this._set_scene_s(value_s);
	}

	/* --------------- private --------------- */
	/** 初始化任务 */
	private _init_task = new mk_status_task(false);
	/** 引擎初始化任务 */
	private _engine_init_task = new mk_status_task(false);
	/** 日志 */
	private _log = new mk_logger("bundle");
	/** 当前场景bundle */
	private _bundle_s!: string;
	/** 当前场景名 */
	private _scene_s!: string;

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 设置 bundle 数据
	 * @param bundle_ bundle 信息
	 */
	set(bundle_: Omit<mk_bundle_.bundle_data, "manage">): void {
		let bundle_data = this.bundle_map.get(bundle_.bundle_s);

		// 更新旧数据
		if (bundle_data) {
			Object.assign(bundle_data, bundle_);
		}
		// 添加新数据
		else {
			this.bundle_map.set(bundle_.bundle_s, (bundle_data = new mk_bundle_.bundle_data(bundle_)));
		}
	}

	/**
	 * 加载 bundle
	 * @param args_ bundle 名 | 加载配置
	 * @returns
	 */
	async load(args_: string | mk_bundle_.load_config): Promise<cc.AssetManager.Bundle | null> {
		/** 加载配置 */
		const load_config =
			typeof args_ === "string"
				? new mk_bundle_.load_config({
						bundle_s: args_,
					})
				: args_;

		/** bundle 信息 */
		const bundle_info = this.bundle_map.get(load_config.bundle_s!) ?? new mk_bundle_.bundle_info(load_config);

		await this._engine_init_task.task;

		/** bundle 资源 */
		const bundle = cc.assetManager.getBundle(bundle_info.bundle_s);

		if (bundle) {
			load_config.progress_callback_f?.(1, 1);

			return bundle;
		}

		return new Promise<cc.AssetManager.Bundle | null>((resolve_f) => {
			if (!bundle_info) {
				return;
			}

			cc.assetManager.loadBundle(
				bundle_info.origin_s ?? bundle_info.bundle_s,
				{
					version: bundle_info.version_s,
					// eslint-disable-next-line @typescript-eslint/naming-convention
					onFileProgress: load_config.progress_callback_f,
				},
				(error, bundle) => {
					if (error) {
						this._log.error("bundle加载失败", error);
						resolve_f(null);

						return;
					}

					// 非远程 bundle 需要模拟进度回调
					if (!bundle_info.origin_s) {
						load_config.progress_callback_f?.(1, 1);
					}

					// 添加bundle信息
					if (!this.bundle_map.has(bundle_info.bundle_s)) {
						this.bundle_map.set(bundle_info.bundle_s, bundle_info);
					}

					resolve_f(bundle);
				}
			);
		});
	}

	/**
	 * 切换场景
	 * @param scene_s_ 场景名
	 * @param config_ 切换配置
	 * @returns
	 */
	async load_scene(scene_s_: string, config_?: Partial<mk_bundle_.switch_scene_config>): Promise<boolean> {
		if (!scene_s_) {
			this._log.error("场景名错误", scene_s_);

			return false;
		}

		await this._init_task.task;

		const config = new mk_bundle_.switch_scene_config(config_);

		const bundle_info =
			this.bundle_map.get(config.bundle_s) ??
			new mk_bundle_.bundle_info({
				bundle_s: config.bundle_s,
			});

		const bundle = await this.load(bundle_info);

		if (!bundle) {
			return false;
		}

		/** 预加载状态 */
		let preload_b = false;

		// 预加载
		if (config.progress_callback_f) {
			const progress_callback_f = config.progress_callback_f;

			preload_b = await new Promise<boolean>((resolve_f) => {
				bundle?.preloadScene(scene_s_, progress_callback_f, (error: Error | null | undefined) => {
					if (error) {
						this._log.error(error);
					}

					resolve_f(!error);
				});
			});
		} else {
			preload_b = await new Promise<boolean>((resolve_f) => {
				bundle?.preloadScene(scene_s_, (error: Error) => {
					if (error) {
						this._log.error(error);
					}

					resolve_f(!error);
				});
			});
		}

		if (config.preload_b || !preload_b) {
			return preload_b;
		}

		// 加载场景
		if (!config.preload_b) {
			this.switch_scene_b = true;
			// 切换 bundle 事件
			if (bundle.name !== this._bundle_s) {
				await this.event.request(this.event.key.before_bundle_switch, {
					curr_bundle_s: this._bundle_s,
					next_bundle_s: config.bundle_s,
				});
			}

			// 切换场景事件
			await Promise.all(
				this.event.request(this.event.key.before_scene_switch, {
					curr_scene_s: this._scene_s,
					next_scene_s: scene_s_,
				})
			);

			return new Promise<boolean>((resolve_f) => {
				bundle?.loadScene(scene_s_, async (error, scene_asset) => {
					if (error) {
						resolve_f(false);
						this._log.error(error);

						return;
					}

					/** 管理器 */
					const manage = this.bundle_map.get(bundle.name)?.manage;

					// 初始化
					if (manage) {
						await manage.init?.();
						manage.valid_b = true;
					}

					// 运行场景
					cc.director.runScene(scene_asset, config?.before_load_callback_f, (error, scene) => {
						// 更新数据
						if (!error) {
							this.bundle_s = bundle.name;
							this.pre_scene_s = this.scene_s;
							this.scene_s = scene_s_;
						} else if (manage) {
							manage.valid_b = false;
						}

						config.unloaded_callback_f?.();
						config.launched_callback_f?.(error, scene);
						resolve_f(!scene);
					});
				});
			}).then((result_b) => {
				this.switch_scene_b = false;

				return result_b;
			});
		}

		return false;
	}

	/**
	 * 重新加载 bundle
	 * @param bundle_ bundle 信息
	 * @returns
	 */
	async reload(bundle_: mk_bundle_.bundle_info & Required<Pick<mk_bundle_.bundle_info, "origin_s">>): Promise<cc.AssetManager.Bundle | null> {
		if (PREVIEW) {
			this._log.error("不支持预览模式重载 bundle");

			return null;
		}

		await this._engine_init_task.task;

		if (this.bundle_s === bundle_.bundle_s) {
			this._log.error("不能在重载 bundle 的场景内进行重载");

			return null;
		}

		/** bundle 脚本表 */
		const bundle_script_tab: Record<string, any> = {};
		/** js 系统 */
		const system_js = window["System"];
		/** 脚本缓存表 */
		const script_cache_tab: Record<string, any> = system_js[Reflect.ownKeys(system_js).find((v) => typeof v === "symbol")!];

		// 更新 bundle 信息
		this.set(bundle_);

		// 初始化 bundle 脚本表
		Object.keys(script_cache_tab).forEach((v_s) => {
			const current = script_cache_tab[v_s] as { d: any[]; id: string };
			const parent = script_cache_tab[v_s].p;

			if (!parent?.d || current.id !== parent.id) {
				return;
			}

			const name_s = parent.id.slice((parent.id as string).lastIndexOf("/") + 1);

			bundle_script_tab[name_s] = parent;
		});

		// 清理脚本缓存
		{
			const bundle_root = bundle_script_tab[bundle_.bundle_s]?.d[0];

			if (bundle_root) {
				bundle_root.d.forEach((v: { id: string }) => {
					system_js.delete(v.id);
				});

				system_js.delete(bundle_root.id);
				system_js.delete(bundle_root.p.id);
			}
		}

		// 清理 ccclass
		{
			const reg = new RegExp(`${bundle_.bundle_s}(_|/)`);

			Object.keys(cc.js._nameToClass)
				.filter((v_s) => v_s.match(reg) !== null)
				.forEach((v_s) => {
					cc.js.unregisterClass(cc.js.getClassByName(v_s));
				});
		}

		// 清理 bundle 资源
		{
			const bundle = cc.assetManager.getBundle(bundle_.bundle_s);

			if (bundle) {
				bundle.releaseAll();
				cc.assetManager.removeBundle(bundle);
			}
		}

		// 加载 bundle
		return this.load(bundle_);
	}

	/* ------------------------------- get/set ------------------------------- */
	private async _set_bundle_s(value_s_: string): Promise<void> {
		this.pre_bundle_s = this._bundle_s;
		this._bundle_s = value_s_;

		// bundle 切换事件通知
		if (this._bundle_s !== this.pre_bundle_s) {
			// 执行 bundle 生命周期
			{
				/** 上个 bundle */
				const pre_bundle_info = this.bundle_map.get(this.pre_bundle_s);
				/** 当前 bundle */
				const bundle_info = this.bundle_map.get(this._bundle_s);

				// 销毁上个 bundle
				pre_bundle_info?.manage?.close();
				// 加载当前 bundle
				if (bundle_info?.manage) {
					await bundle_info.manage.open();
				}
			}

			this.event.emit(this.event.key.after_bundle_switch, {
				curr_bundle_s: this._bundle_s,
				pre_bundle_s: this.pre_bundle_s,
			});
		}
	}

	private _set_scene_s(value_s: string): void {
		this.pre_scene_s = this._scene_s;
		this._scene_s = value_s;

		// 场景切换事件通知
		if (this._scene_s !== this.pre_scene_s) {
			this.event.emit(this.event.key.after_scene_switch, {
				curr_scene_s: this._scene_s,
				pre_scene_s: this.pre_scene_s,
			});
		}
	}
}

export namespace mk_bundle_ {
	/** bundle 信息 */
	export class bundle_info {
		constructor(init_: bundle_info) {
			Object.assign(this, init_);
		}

		/**
		 * bundle名
		 * @remarks
		 * getBundle 时使用
		 */
		bundle_s!: string;
		/** 版本 */
		version_s?: string;
		/**
		 * 资源路径
		 * @defaultValue
		 * this.bundle_s
		 * @remarks
		 * loadBundle 时使用，不存在时将使用 bundle_s 进行 loadBundle
		 */
		origin_s?: string;
	}

	/**
	 * bundle 数据
	 * @noInheritDoc
	 */
	export class bundle_data extends bundle_info {
		constructor(init_: bundle_data) {
			super(init_);
			Object.assign(this, init_);
		}

		/** bundle 管理器 */
		manage?: bundle_manage_base;
	}

	/** load 配置 */
	export class load_config extends bundle_info {
		constructor(init_: load_config) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 加载回调 */
		progress_callback_f?: (curr_n: number, total_n: number) => void;
	}

	/** switch_scene 配置 */
	export class switch_scene_config {
		constructor(init_?: Partial<switch_scene_config>) {
			Object.assign(this, init_);
		}

		/**
		 * bundle名
		 * @remarks
		 * getBundle 时使用
		 */
		bundle_s!: string;
		/** 预加载 */
		preload_b?: boolean;
		/**
		 * 加载进度回调
		 * @param finish_n 完成数量
		 * @param total_n 总数量
		 * @param item 当前项目
		 */
		progress_callback_f?(finish_n: number, total_n: number, item?: cc.AssetManager.RequestItem): void;
		/** 加载前调用的函数 */
		before_load_callback_f?: cc.Director.OnBeforeLoadScene;
		/** 启动后调用的函数 */
		launched_callback_f?: cc.Director.OnSceneLaunched;
		/** 场景卸载后回调 */
		unloaded_callback_f?: cc.Director.OnUnload;
	}

	/**
	 * bundle 管理器基类
	 * @noInheritDoc
	 * @remarks
	 * 注意生命周期函数 init、open、close 会自动执行父类函数再执行子类函数，不必手动 super.xxx 调用
	 */
	export abstract class bundle_manage_base implements mk_release_.type_follow_release_object {
		constructor() {
			// 添加至 bundle 数据
			setTimeout(async () => {
				if (EDITOR && this.name_s === mk_bundle.instance().bundle_s) {
					await this.init?.();
					this.open();
				}

				mk_bundle.instance().set({
					bundle_s: this.name_s,
					manage: this,
				} as mk_bundle_.bundle_data);
			}, 0);

			if (EDITOR) {
				return;
			}

			// 对象池
			this.node_pool_tab = new Proxy(cc.js.createMap(true), {
				get: (target_, key_) => {
					if (!target_[key_]) {
						target_[key_] = new cc.NodePool(key_ as string);
					}

					return target_[key_];
				},
			}) as any;

			// 自动执行生命周期
			mk_tool_func.run_parent_func(this, ["init", "open", "close"]);
		}

		/* --------------- public --------------- */
		/** bundle 名 */
		abstract name_s: string;
		/** 事件对象 */
		abstract event: mk_event_target<any>;
		/** 管理器有效状态 */
		valid_b = false;
		/** 节点池表 */
		node_pool_tab!: Record<string, cc.NodePool>;
		/** 网络对象 */
		network?: mk_network_base;
		/** 数据获取器 */
		data?: mk_data_sharer_.api<any>;
		/* --------------- protected --------------- */
		/** 释放管理器 */
		protected _release_manage = new mk_release();
		/* ------------------------------- 生命周期 ------------------------------- */
		/**
		 * 初始化
		 * @remarks
		 * 从其他 bundle 的场景切换到此 bundle 的场景之前调用
		 */
		init?(): void | Promise<void>;

		/**
		 * 打开回调
		 * @remarks
		 * 从其他 bundle 的场景切换到此 bundle 的场景时调用
		 */
		open(): void | Promise<void> {
			if (EDITOR && this.name_s !== "main") {
				throw "中断";
			}

			if (this.valid_b) {
				mk_log.error("bundle 已经加载");
				throw "中断";
			}

			this.valid_b = true;
		}

		/**
		 * 关闭回调
		 * @remarks
		 * 从此 bundle 的场景切换到其他 bundle 的场景时调用
		 */
		close(): void | Promise<void> {
			if (!this.valid_b) {
				mk_log.error("bundle 已经卸载");
				throw "中断";
			}

			this.valid_b = false;

			// 清理事件
			this.event.clear();
			// 清理网络事件
			this.network?.event.clear();
			// 清理数据
			this.data?.reset();

			// 清理对象池
			for (const k_s in this.node_pool_tab) {
				if (Object.prototype.hasOwnProperty.call(this.node_pool_tab, k_s)) {
					this.node_pool_tab[k_s].clear();
					delete this.node_pool_tab[k_s];
				}
			}

			// 释放对象
			this._release_manage.release_all();
		}

		/* ------------------------------- 功能 ------------------------------- */
		follow_release<T = mk_release_.type_release_param_type>(object_: T): T {
			if (!object_) {
				return object_;
			}

			// 添加释放对象
			this._release_manage.add(object_ as any);

			// 如果管理器已经关闭则直接释放
			if (!this.valid_b) {
				this._release_manage.release_all();
			}

			return object_;
		}

		cancel_release<T = mk_release_.type_release_param_type>(object_: T): T {
			if (!object_) {
				return object_;
			}

			// 添加释放对象
			this._release_manage.release(object_ as any);

			return object_;
		}
	}
}

export default mk_bundle.instance();
