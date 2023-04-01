import monitor from "../../../../@framework/mk_monitor";
import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";
import mk from "mk";
import global_event from "../../../../@config/global_event";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return Array.isArray(data_);
}

export namespace 默认 {
	/** 初始化数据 */
	class array_init_config {
		constructor(init_?: array_init_config) {
			Object.assign(this, init_);
		}

		root!: cc.Node;
		item!: cc.Node;
		/** item 更新函数 */
		item_update_f?: (
			/** item 节点 */
			node: cc.Node,
			/** item 对应数据 */
			data: any
		) => void;

		/** 回收 item */
		recycle_b? = true;
	}

	class array_extend<CT> extends Array<CT> {
		private _init_data!: array_init_config;
		/** 任务数组 */
		private _task_fs: (() => void)[] = [];
		/** 任务执行状态 */
		private _task_run_b = false;
		/* ------------------------------- 功能 ------------------------------- */

		/** 初始化 */
		init(init_: array_init_config): void {
			this._init_data = new array_init_config(init_);

			// 注册事件
			global_event.on(global_event.key.restart, this._event_restart, this);
		}

		/** 销毁 */
		async destroy(): Promise<void> {
			// 注销事件
			global_event.removeAll(this);

			this._task_fs = [];
			await this._add_task(() => {
				if (!this._init_data.root.children) {
					return;
				}
				for (const v of this._init_data.root.children) {
					const view_comp = v.getComponent(mk.module.view_base) as any as mk.module.view_base;

					view_comp?.["_close"]({
						first_b: true,
						destroy_children_b: true,
					});
				}
				this._init_data.root.destroyAllChildren();
				this._init_data.root.removeAllChildren();
			});
		}

		push(...args_as_: any[]): number {
			const result_n: number = super.push(...args_as_);

			this._bind(result_n - args_as_.length, result_n);
			/** 备份数据 */
			const backup_as: any[] = args_as_.slice();

			this._add_task(async () => {
				backup_as.forEach((v) => {
					this._create_item(v);
				});
			});
			return result_n;
		}

		pop(): CT | undefined {
			this._unbind(this.length - 1, this.length);
			this._add_task(async () => {
				const node = this._init_data.root.children[this._init_data.root.children.length - 1];

				node.destroy();
				node.removeFromParent();
			});
			return super.pop();
		}

		shift(): CT | undefined {
			this._unbind(0, 1);
			this._add_task(async () => {
				const node = this._init_data.root.children[0];

				node.destroy();
				node.removeFromParent();
			});
			return super.shift();
		}

		unshift(...args_as_: any[]): number {
			const result_n: number = super.unshift(...args_as_);

			this._bind(0, args_as_.length);
			/** 备份数据 */
			const backup_as: any[] = args_as_.slice();

			this._add_task(async () => {
				for (let k_n = backup_as.length; k_n--; ) {
					const node = this._create_item(backup_as[k_n]);

					node.setSiblingIndex(0);
				}
			});
			return result_n;
		}

		sort(compare_f_: (va: any, vb: any) => number): any {
			const temp_as = (this as any[]).reduce((pre, curr, k_n) => {
				pre.push({ index_n: k_n, data: curr });
				return pre;
			}, []);

			temp_as.sort((va: typeof temp_as[0], vb: typeof temp_as[0]) => compare_f_(va.data, vb.data));
			this._add_task(() => {
				const old_children_as = this._init_data.root.children.slice();

				temp_as.forEach((v, k_n) => {
					old_children_as[v.index_n].setSiblingIndex(k_n);
				});
			});
			return super.sort(compare_f_);
		}

		splice(start_n_: number, count_n_?: number, ...args_as_: any[]): CT[] {
			const count_n = count_n_ ?? 0;

			this._unbind(start_n_, start_n_ + count_n);
			/** 备份数据 */
			let backup_as: any[];
			let result_as: any[];

			if (args_as_?.length) {
				result_as = super.splice(start_n_, count_n_!, ...args_as_);
				this._bind(start_n_, args_as_.length);
				backup_as = args_as_.slice();
			}
			this._add_task(async () => {
				// 删除
				{
					const remove_as = this._init_data.root.children.slice(start_n_, start_n_ + count_n);

					for (const v of remove_as) {
						v.destroy();
						v.removeFromParent();
					}
				}

				// 添加
				if (backup_as) {
					for (let k_n = 0; k_n < backup_as.length; ++k_n) {
						const node = this._create_item(backup_as[k_n]);

						node.setSiblingIndex(start_n_ + k_n);
					}
				}
			});
			return result_as!;
		}

		/** 添加任务 */
		private async _add_task(task_f_: () => void): Promise<void | Promise<void>> {
			if (!this._init_data) {
				mk.logger.error("初始化未完成");
				return;
			}
			this._task_fs.push(task_f_);
			if (!this._task_run_b) {
				this._task_run_b = true;
				while (this._task_fs.length) {
					await this._task_fs.shift()!();
				}
				this._task_run_b = false;
			}
		}

		/** 绑定 */
		private _bind(start_n_: number, end_n_: number): void {
			if (this.length < end_n_) {
				mk.logger.error("参数错误");
				return;
			}
			for (let k_n = start_n_; k_n < end_n_; ++k_n) {
				// 下标监听修改
				monitor.on(this, k_n, (value) => {
					this._add_task(async () => {
						this._init_data!.root.children[k_n].getComponent(mk.module.view_base)?.init?.(value);
						this._init_data.item_update_f?.(this._init_data.root.children[k_n], value);
					});
				});
			}
		}

		/** 解绑 */
		private _unbind(start_n_: number, end_n_: number): void {
			if (this.length < end_n_) {
				mk.logger.error("参数错误");
				return;
			}
			for (let k_n = start_n_; k_n < end_n_; ++k_n) {
				monitor.off(this, k_n);
			}
		}

		/** 创建新节点 */
		private _create_item(init_data_?: any): cc.Node {
			const node = cc.instantiate(this._init_data.item);
			const view_comp = node.getComponent(mk.module.view_base) as any as mk.module.view_base;

			// 初始化视图
			this._init_data.root.addChild(node);

			// 初始化视图组件
			if (view_comp) {
				view_comp.config = {
					static_b: false,
					view_config: null!,
				};

				view_comp?.["_open"]({
					first_b: true,
					init: init_data_,
				});
			}

			// 回调函数
			this._init_data.item_update_f?.(node, init_data_);
			return node;
		}

		/* ------------------------------- 全局事件 ------------------------------- */
		private async _event_restart(): Promise<void> {
			await this.destroy();
		}
	}

	@ccclass("data_method_array_common")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "回收 item" })
		recycle_b = true;

		@property({ displayName: "子节点更新事件", type: cc.EventHandler })
		event_child_update = new cc.EventHandler();
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		/** 容器节点 */
		let layout_node: cc.Node | null = node_;

		if (layout_node.scroll_view) {
			layout_node = layout_node.scroll_view.content;
		}

		if (!layout_node?.children.length) {
			mk.logger.error("不存在子节点");
			return;
		}
		/** 原数组 */
		const old_array_as = target_[key_];
		/** 当前数组 */
		const array_as = new array_extend<any>();
		/** item节点 */
		const item_node = layout_node.children[0]!;

		// 初始化
		{
			// 初始化数据
			target_[key_] = array_as as any;
			array_as.init({
				root: layout_node,
				item: item_node,
				item_update_f: (node, data) => {
					params_.event_child_update?.emit([node, data]);
				},
				recycle_b: params_.recycle_b,
			});
			// 初始化视图
			item_node.removeFromParent();
		}

		// 监听
		monitor
			.on(
				target_,
				key_,
				(value: any) => {
					array_as.splice(0, array_as.length, ...value);
				},
				async () => {
					// 还原数组
					target_[key_] = [...(target_[key_] as any)] as any;

					// 还原子节点
					array_as.destroy();

					if (layout_node?.isValid) {
						layout_node.addChild(item_node);
					} else {
						const view_comp = item_node.getComponent(mk.module.view_base) as any as mk.module.view_base;

						if (view_comp) {
							await view_comp?.["_close"]({
								first_b: true,
								destroy_children_b: true,
							});
						}
						item_node.destroy();
					}
				},
				target_
			)
			?.call(target_, old_array_as);
	}
}
