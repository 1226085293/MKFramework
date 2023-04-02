import mk_instance_base from "../mk_instance_base";
import mk_logger from "../mk_logger";
import mk_event_target from "../mk_event_target";
import mk_network_base from "../network/mk_network_base";
import { EDITOR, PREVIEW } from "cc/env";
import * as cc from "cc";
import mk_status_task from "../task/mk_status_task";
import mk_data_sharer from "../mk_data_sharer";

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

/** bundle 管理 */
class mk_bundle extends mk_instance_base {
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
	bundle_map = new Map<string, mk_bundle_.bundle_info>();
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
	 * 添加bundle数据
	 * @param info_ bundle 信息
	 */
	add(info_: Partial<mk_bundle_.bundle_info>): void {
		const info = info_ as mk_bundle_.bundle_info;
		/** bundle 信息 */
		const bundle = Object.assign(this.bundle_map.get(info.bundle_s) ?? new mk_bundle_.bundle_info(), info);

		// 加入 bundle 表
		this.bundle_map.set(bundle.bundle_s, bundle);
	}

	/**
	 * 加载 bundle
	 * @param args_ bundle 名 | 加载配置
	 * @returns
	 */
	async load(args_: string | Partial<mk_bundle_.load_config>): Promise<cc.AssetManager.Bundle | null> {
		/** 加载配置 */
		const load_config =
			typeof args_ === "string"
				? new mk_bundle_.load_config({
						bundle_s: args_,
				  })
				: args_;
		/** bundle 信息 */
		const bundle_info =
			this.bundle_map.get(load_config.bundle_s!) ??
			new mk_bundle_.bundle_info({
				bundle_s: load_config.bundle_s,
			});

		await this._engine_init_task;

		/** bundle 资源 */
		const bundle = cc.assetManager.getBundle(bundle_info.bundle_s);

		if (bundle) {
			return bundle;
		}

		return new Promise<cc.AssetManager.Bundle | null>((resolve_f) => {
			if (!bundle_info) {
				return;
			}
			cc.assetManager.loadBundle(
				bundle_info.origin_s!,
				{
					version: bundle_info.version_s,
					onFileProgress: load_config.progress_callback_f,
				},
				(error, bundle) => {
					if (error) {
						this._log.error("bundle加载失败", error);
						resolve_f(null);
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
		await this._init_task;

		const config = new mk_bundle_.switch_scene_config(config_);
		const bundle_info = this.bundle_map.get(config.bundle_s);

		if (!bundle_info) {
			this._log.error("bundle 信息不存在", config.bundle_s);
			return false;
		}

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
				bundle?.loadScene(scene_s_, (error, scene_asset) => {
					if (error) {
						resolve_f(false);
						this._log.error(error);
						return;
					}
					// 更新数据
					this.bundle_s = bundle.name;
					this.pre_scene_s = this.scene_s;
					this.scene_s = scene_s_;
					// 运行场景
					cc.director.runScene(scene_asset, config?.before_load_callback_f, (error, scene) => {
						if (!config) {
							resolve_f(false);
							return;
						}
						resolve_f(true);
						config.unloaded_callback_f?.();
						config.launched_callback_f?.(error, scene);
					});
				});
			}).then((result_b) => {
				this.switch_scene_b = false;

				return result_b;
			});
		}
		return false;
	}

	/** 重新加载 bundle */
	async reload(info_: Partial<mk_bundle_.bundle_info>): Promise<cc.AssetManager.Bundle | null> {
		if (PREVIEW) {
			return null;
		}

		if (this.bundle_s === info_.bundle_s) {
			this._log.error("不能在重载 bundle 的场景内进行重载");
			return null;
		}

		await this._engine_init_task;

		/** bundle 信息 */
		const bundle_info: mk_bundle_.bundle_info = new mk_bundle_.bundle_info(info_)!;
		/** bundle 脚本表 */
		const bundle_script_tab: Record<string, any> = {};
		/** js 系统 */
		const system_js = self["System"];
		/** 脚本缓存表 */
		const script_cache_tab: Record<string, any> = system_js[Reflect.ownKeys(system_js).find((v) => typeof v === "symbol")];

		// 更新 bundle 信息
		this.add(bundle_info);

		// 初始化 bundle 脚本表
		Object.keys(script_cache_tab).forEach((v_s) => {
			const current = script_cache_tab[v_s];
			const parent = script_cache_tab[v_s].p;
			const child = parent.d;

			if (!parent || !child || current.id !== parent.id) {
				return;
			}

			const name_s = parent.id.slice((parent.id as string).lastIndexOf("/") + 1);

			bundle_script_tab[name_s] = parent;
		});

		// 清理脚本缓存
		{
			const bundle_root = bundle_script_tab[bundle_info.bundle_s];

			if (bundle_root) {
				bundle_root.d.forEach((v: { id: string }) => {
					delete script_cache_tab[v.id];
					delete system_js["registerRegistry"][v.id];
				});
				delete script_cache_tab[bundle_root.id];
				delete system_js["registerRegistry"][bundle_root.id];
			}
		}

		// 清理 ccclass
		{
			const reg = new RegExp(`${bundle_info.bundle_s}(_|/)`);

			Object.keys(cc.js._nameToClass)
				.filter((v_s) => v_s.match(reg) !== null)
				.forEach((v_s) => {
					cc.js.unregisterClass(cc.js.getClassByName(v_s));
				});
		}

		// 清理 bundle 资源
		{
			const bundle = cc.assetManager.getBundle(bundle_info.bundle_s);

			if (bundle) {
				bundle.releaseAll();
				cc.assetManager.removeBundle(bundle);
			}
		}

		// 加载 bundle
		return this.load(bundle_info);
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
		constructor(init_?: Partial<bundle_info>) {
			Object.assign(this, init_);

			if (!this.origin_s) {
				this.origin_s = this.bundle_s;
			}
		}

		/** bundle名（getBundle 时使用） */
		bundle_s = "resources";
		/** 版本 */
		version_s?: string;
		/** 资源路径（loadBundle 使用，默认为 bundle_s） */
		origin_s!: string;
		/** 管理器 */
		manage?: bundle_manage_base;
	}

	/** load 配置 */
	export class load_config {
		constructor(init_?: Partial<load_config>) {
			Object.assign(this, init_);
		}

		/** bundle名（getBundle 时使用） */
		bundle_s = "resources";
		/** 加载回调 */
		progress_callback_f?: (curr_n: number, total_n: number) => void;
	}

	/** switch_scene 配置 */
	export class switch_scene_config {
		constructor(init_?: Partial<switch_scene_config>) {
			Object.assign(this, init_);
		}

		/** bundle名（getBundle 时使用） */
		bundle_s = "resources";
		/** 预加载 */
		preload_b?: boolean;
		/** 加载回调 */
		progress_callback_f?: (finish_n: number, total_n: number, item?: cc.AssetManager.RequestItem) => void;
		/** 加载前调用的函数 */
		before_load_callback_f?: cc.Director.OnBeforeLoadScene;
		/** 启动后调用的函数 */
		launched_callback_f?: cc.Director.OnSceneLaunched;
		/** 场景卸载后回调 */
		unloaded_callback_f?: cc.Director.OnUnload;
	}

	/** bundle 管理器基类 */
	export abstract class bundle_manage_base {
		constructor() {
			if (EDITOR) {
				this.open();
				return;
			}

			// 添加至 bundle 数据
			setTimeout(() => {
				mk_bundle.instance().add({
					bundle_s: this.name_s,
					manage: this,
				});
			}, 0);

			// 对象池
			this.node_pool_tab = new Proxy(
				{},
				{
					get: (target_, key_) => {
						if (!target_[key_]) {
							target_[key_] = new cc.NodePool(key_ as string);
						}
						return target_[key_];
					},
				}
			) as any;

			// 初始化状态
			this._init_b = true;
		}

		/* --------------- public --------------- */
		/** bundle 名 */
		abstract name_s: string;
		/** 事件对象 */
		abstract event: mk_event_target<any>;
		/** bundle 是否有效 */
		valid_b = false;
		/** 节点池表 */
		node_pool_tab!: Record<string, cc.NodePool>;
		/** 网络对象 */
		network?: mk_network_base;
		/** 数据获取器 */
		data?: mk_data_sharer;
		/* --------------- private --------------- */
		/** 初始化状态 */
		private _init_b = false;
		/* ------------------------------- 生命周期 ------------------------------- */
		/** bundle 加载回调 */
		open(): boolean | null | Promise<boolean | null> {
			if (!EDITOR && (!this._init_b || this.valid_b)) {
				return false;
			}
			this.valid_b = true;
			return true;
		}

		/** bundle 销毁回调 */
		close(): boolean | null | Promise<boolean | null> {
			if (!this._init_b || !this.valid_b) {
				return false;
			}
			this.valid_b = false;

			// 清理事件
			this.event.clear();
			this.network?.event.clear();
			// 清理数据
			this.data?.clear();

			// 销毁对象池
			for (const k_s in this.node_pool_tab) {
				if (Object.prototype.hasOwnProperty.call(this.node_pool_tab, k_s)) {
					this.node_pool_tab[k_s].clear();
				}
			}
			this.node_pool_tab = cc.js.createMap();
			return true;
		}
	}
}

export default mk_bundle.instance();
