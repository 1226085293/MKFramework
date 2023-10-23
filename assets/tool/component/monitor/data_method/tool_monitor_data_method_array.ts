import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";
import mk from "mk";
import global_event from "../../../../@config/global_event";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return Array.isArray(data_);
}

// 注意：在任务列表未完成时重置数据再解绑会报错，需解决
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
		/** 存在视图组件 */
		private _item_view_type: cc.Constructor<mk.view_base> | null = null;
		/** 节点池 */
		private _node_pool!: mk.obj_pool<cc.Node>;
		/** 任务管线 */
		private _task_pipeline = new mk.task.pipeline();
		/* ------------------------------- 功能 ------------------------------- */
		/** 初始化 */
		async init(init_: array_init_config): Promise<void> {
			this._init_data = new array_init_config(init_);
			this._item_view_type = this._init_data.item.getComponent(mk.view_base)?.constructor as any;

			// 模块
			if (this._item_view_type) {
				await mk.ui_manage.regis(this._item_view_type, this._init_data.item, cc.director.getScene()!.getComponentInChildren(mk.life_cycle)!, {
					repeat_b: true,
					pool_init_fill_n: 8,
					parent: this._init_data.root,
				});
			}
			// 节点
			else {
				this._node_pool = new mk.obj_pool<cc.Node>({
					create_f: () => {
						return cc.instantiate(this._init_data.item);
					},
					clear_f: (node_as) => {
						node_as.forEach((v) => {
							v.destroy();
							v.removeFromParent();
						});
					},
					init_fill_n: 8,
				});
			}

			// 注册事件
			global_event.on(global_event.key.restart, this._event_restart, this);
		}

		/** 销毁 */
		async destroy(): Promise<void> {
			// 注销事件
			global_event.removeAll(this);

			await this._task_pipeline.add(async () => {
				if (!this._init_data.root.children.length) {
					return;
				}

				// 模块
				if (this._item_view_type) {
					while (this._init_data.root.children.length) {
						await mk.ui_manage.close(this._init_data.root.children[0]);
					}

					await mk.ui_manage.unregis(this._item_view_type);
				}
				// 节点
				else {
					this._init_data.root.destroyAllChildren();
					await this._node_pool.clear();
				}
			});
		}

		push(...args_as_: any[]): number {
			const result_n: number = super.push(...args_as_);
			/** 备份数据 */
			const backup_as: any[] = args_as_.slice();

			this._bind(result_n - args_as_.length, result_n);

			this._task_pipeline.add(async () => {
				for (const v of backup_as) {
					await this._create_item(v);
				}
			});

			return result_n;
		}

		pop(): CT | undefined {
			this._unbind(this.length - 1, this.length);
			this._task_pipeline.add(async () => {
				this._delete_item(this._init_data.root.children[this._init_data.root.children.length - 1]);
			});

			return super.pop();
		}

		shift(): CT | undefined {
			this._unbind(0, 1);
			this._task_pipeline.add(async () => {
				this._delete_item(this._init_data.root.children[0]);
			});

			return super.shift();
		}

		unshift(...args_as_: any[]): number {
			const result_n: number = super.unshift(...args_as_);

			this._bind(0, args_as_.length);
			/** 备份数据 */
			const backup_as: any[] = args_as_.slice();

			this._task_pipeline.add(async () => {
				for (let k_n = backup_as.length; k_n--; ) {
					const node = await this._create_item(backup_as[k_n]);

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
			this._task_pipeline.add(() => {
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

			this._task_pipeline.add(async () => {
				const remove_as = this._init_data.root.children.slice(start_n_, start_n_ + count_n);

				// 删除
				for (const v of remove_as) {
					this._delete_item(v);
				}

				// 添加
				if (backup_as) {
					for (let k_n = 0; k_n < backup_as.length; ++k_n) {
						const node = await this._create_item(backup_as[k_n]);

						node.setSiblingIndex(start_n_ + k_n);
					}
				}
			});

			return result_as!;
		}

		/** 绑定 */
		private _bind(start_n_: number, end_n_: number): void {
			if (this.length < end_n_) {
				mk.error("参数错误");

				return;
			}

			for (let k_n = start_n_; k_n < end_n_; ++k_n) {
				// 下标监听修改
				mk.monitor.on(this, k_n, (value) => {
					this._task_pipeline.add(async () => {
						this._init_data!.root.children[k_n].getComponent(mk.view_base)?.init?.(value);
						this._init_data.item_update_f?.(this._init_data.root.children[k_n], value);
					});
				});
			}
		}

		/** 解绑 */
		private _unbind(start_n_: number, end_n_: number): void {
			if (this.length < end_n_) {
				mk.error("参数错误");

				return;
			}

			for (let k_n = start_n_; k_n < end_n_; ++k_n) {
				mk.monitor.off(this, k_n);
			}
		}

		/** 创建新项目 */
		private async _create_item(init_data_?: any): Promise<cc.Node> {
			let node!: cc.Node;

			// 模块
			if (this._item_view_type) {
				const view_comp = await mk.ui_manage.open(this._item_view_type, { init: init_data_ });

				node = view_comp.node;
			}
			// 节点
			else {
				node = await this._node_pool.get();

				this._init_data.root.addChild(node);
			}

			// 回调函数
			this._init_data.item_update_f?.(node, init_data_);

			return node;
		}

		/** 删除新项目 */
		private async _delete_item(node_: cc.Node): Promise<void> {
			// 模块
			if (this._item_view_type) {
				await mk.ui_manage.close(node_);
			}
			// 节点
			else {
				await this._node_pool.put(node_);
			}
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

	export async function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): Promise<void> {
		/** 容器节点 */
		let layout_node: cc.Node | null = node_;

		if (layout_node.getComponent(cc.ScrollView)?.content) {
			layout_node = layout_node.getComponent(cc.ScrollView)!.content;
		}

		if (!layout_node?.children.length) {
			mk.error("不存在子节点");

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
			await array_as.init({
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
		mk.monitor
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
					await array_as.destroy();

					if (layout_node?.isValid) {
						layout_node.addChild(item_node);
					} else {
						await mk.ui_manage.close(item_node);
					}
				},
				target_
			)
			?.call(target_, old_array_as);
	}
}
