import * as cc from "cc";
import { ToolMonitorTriggerEvent } from "../ToolMonitorTriggerEvent";
import mk from "mk";
import global_event from "global_event";
import tool_node from "../../../ToolNode";

const { ccclass, property } = cc._decorator;

export function checkType(data_: any): boolean {
	return Array.isArray(data_);
}

export namespace 默认 {
	/** 初始化数据 */
	class ArrayInitConfig {
		constructor(init_?: ArrayInitConfig) {
			Object.assign(this, init_);
		}

		root!: cc.Node;
		item!: cc.Node;
		/** item 更新函数 */
		itemUpdateFunc?: (
			/** item 节点 */
			node: cc.Node,
			/** item 对应数据 */
			data: any
		) => void;

		/** 回收 item */
		isRecycle? = true;
	}

	class ArrayExtend<CT> extends Array<CT> {
		private _initData!: ArrayInitConfig;
		/** 存在视图组件 */
		private _itemViewType: cc.Constructor<mk.ViewBase> | null = null;
		/** 节点池 */
		private _nodePool!: mk.ObjectPool<cc.Node>;
		/** 任务管线 */
		private _taskPipeline = new mk.Task.Pipeline();
		/** 注册目标 */
		private _uiRegisTarget: mk.LifeCycle = null!;
		/* ------------------------------- 功能 ------------------------------- */
		/** 初始化 */
		async init(init_: ArrayInitConfig): Promise<void> {
			this._initData = new ArrayInitConfig(init_);
			this._itemViewType = this._initData.item.getComponent(mk.ViewBase)?.constructor as any;

			// 模块
			if (this._itemViewType) {
				this._uiRegisTarget = tool_node
					.traverseParent(this._initData.root.parent, (node) => node.getComponent(mk.LifeCycle) !== null)!
					.getComponent(mk.LifeCycle)!;

				await mk.uiManage.regis(this._itemViewType, this._initData.item, this._uiRegisTarget, {
					isRepeat: true,
					poolInitFillNum: 8,
					parent: this._initData.root,
				});
			}
			// 节点
			else {
				this._nodePool = new mk.ObjectPool<cc.Node>({
					createFunc: () => {
						return cc.instantiate(this._initData.item);
					},
					clearFunc: (nodeList) => {
						nodeList.forEach((v) => {
							v.destroy();
							v.removeFromParent();
						});
					},
					initFillNum: 8,
				});
			}

			// 注册事件
			global_event.on(global_event.key.restart, this._onRestart, this);
		}

		/** 销毁 */
		async destroy(): Promise<void> {
			// 注销事件
			global_event.removeAll(this);

			await this._taskPipeline.add(async () => {
				if (!this._initData.root.children.length) {
					return;
				}

				// 模块
				if (this._itemViewType) {
					while (this._initData.root.children.length) {
						await mk.uiManage.close(this._initData.root.children[0]);
					}

					await mk.uiManage.unregis(this._itemViewType);
				}
				// 节点
				else {
					this._initData.root.destroyAllChildren();
					await this._nodePool.clear();
				}
			});
		}

		push(...argsList_: any[]): number {
			const resultNum: number = super.push(...argsList_);
			/** 备份数据 */
			const backupList: any[] = argsList_.slice();

			this._bind(resultNum - argsList_.length, resultNum);

			this._taskPipeline.add(async () => {
				for (const v of backupList) {
					await this._createItem(v);
				}
			});

			return resultNum;
		}

		pop(): CT | undefined {
			this._unbind(this.length - 1, this.length);
			this._taskPipeline.add(async () => {
				this._deleteItem(this._initData.root.children[this._initData.root.children.length - 1]);
			});

			return super.pop();
		}

		shift(): CT | undefined {
			this._unbind(0, 1);
			this._taskPipeline.add(async () => {
				this._deleteItem(this._initData.root.children[0]);
			});

			return super.shift();
		}

		unshift(...argsList_: any[]): number {
			const resultNum: number = super.unshift(...argsList_);

			this._bind(0, argsList_.length);
			/** 备份数据 */
			const backupList: any[] = argsList_.slice();

			this._taskPipeline.add(async () => {
				for (let kNum = backupList.length; kNum--; ) {
					const node = await this._createItem(backupList[kNum]);

					node?.setSiblingIndex(0);
				}
			});

			return resultNum;
		}

		sort(compareFunc_: (va: any, vb: any) => number): any {
			const tempList = (this as any[]).reduce((pre, curr, kNum) => {
				pre.push({ indexNum: kNum, data: curr });

				return pre;
			}, []);

			tempList.sort((va: typeof tempList[0], vb: typeof tempList[0]) => compareFunc_(va.data, vb.data));
			this._taskPipeline.add(() => {
				const oldChildrenList = this._initData.root.children.slice();

				tempList.forEach((v, kNum) => {
					oldChildrenList[v.index_n].setSiblingIndex(kNum);
				});
			});

			return super.sort(compareFunc_);
		}

		splice(startNum_: number, countNum_?: number, ...argsList_: any[]): CT[] {
			const countNum = countNum_ ?? 0;

			this._unbind(startNum_, startNum_ + countNum);
			/** 备份数据 */
			let backupList: any[];
			let resultList: any[];

			if (argsList_?.length) {
				resultList = super.splice(startNum_, countNum_!, ...argsList_);
				this._bind(startNum_, argsList_.length);
				backupList = argsList_.slice();
			}

			this._taskPipeline.add(async () => {
				const removeList = this._initData.root.children.slice(startNum_, startNum_ + countNum);

				// 删除
				for (const v of removeList) {
					this._deleteItem(v);
				}

				// 添加
				if (backupList) {
					for (let kNum = 0; kNum < backupList.length; ++kNum) {
						const node = await this._createItem(backupList[kNum]);

						node?.setSiblingIndex(startNum_ + kNum);
					}
				}
			});

			return resultList!;
		}

		/** 绑定 */
		private _bind(startNum_: number, endNum_: number): void {
			if (this.length < endNum_) {
				mk.error("参数错误");

				return;
			}

			for (let kNum = startNum_; kNum < endNum_; ++kNum) {
				// 下标监听修改
				mk.monitor.on(this, kNum, (value) => {
					this._taskPipeline.add(async () => {
						this._initData!.root.children[kNum].getComponent(mk.ViewBase)?.init?.(value);
						this._initData.itemUpdateFunc?.(this._initData.root.children[kNum], value);
					});
				});
			}
		}

		/** 解绑 */
		private _unbind(startNum_: number, endNum_: number): void {
			if (this.length < endNum_) {
				mk.error("参数错误");

				return;
			}

			for (let kNum = startNum_; kNum < endNum_; ++kNum) {
				mk.monitor.off(this, kNum);
			}
		}

		/** 创建新项目 */
		private async _createItem(initData_?: any): Promise<cc.Node | null> {
			let node!: cc.Node;

			// 模块
			if (this._itemViewType) {
				if (this._uiRegisTarget.valid) {
					const viewComp = await mk.uiManage.open(this._itemViewType, { init: initData_ });

					node = viewComp?.node;
				}
			}
			// 节点
			else {
				node = await this._nodePool.get();
				if (node) {
					this._initData.root.addChild(node);
				}
			}

			if (!node) {
				return null;
			}

			// 回调函数
			this._initData.itemUpdateFunc?.(node, initData_);

			return node;
		}

		/** 删除新项目 */
		private async _deleteItem(node_: cc.Node): Promise<void> {
			// 模块
			if (this._itemViewType) {
				await mk.uiManage.close(node_);
			}
			// 节点
			else {
				await this._nodePool.put(node_);
			}
		}

		/* ------------------------------- 全局事件 ------------------------------- */
		private async _onRestart(): Promise<void> {
			await this.destroy();
		}
	}

	@ccclass("DataMethodArrayCommon")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "回收 item" })
		isRecycle = true;

		@property({ displayName: "子节点更新事件", type: cc.EventHandler })
		eventChildUpdate = new cc.EventHandler();
	}

	export async function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): Promise<void> {
		/** 容器节点 */
		let layoutNode: cc.Node | null = node_;

		if (layoutNode.getComponent(cc.ScrollView)?.content) {
			layoutNode = layoutNode.getComponent(cc.ScrollView)!.content;
		}

		if (!layoutNode?.children.length) {
			mk.error("不存在子节点");

			return;
		}

		/** 原数组 */
		const oldArrayList = target_[key_];
		/** 当前数组 */
		const arrayList = new ArrayExtend<any>();
		/** item节点 */
		const itemNode = layoutNode.children[0]!;

		// 初始化
		{
			// 初始化数据
			target_[key_] = arrayList as any;
			await arrayList.init({
				root: layoutNode,
				item: itemNode,
				itemUpdateFunc: (node, data) => {
					params_.eventChildUpdate?.emit([node, data]);
				},
				isRecycle: params_.isRecycle,
			});

			// 初始化视图
			itemNode.removeFromParent();
		}

		// 监听
		mk.monitor
			.on(
				target_,
				key_,
				(value: any) => {
					arrayList.splice(0, arrayList.length, ...value);
				},
				async () => {
					// 还原数组
					target_[key_] = [...(target_[key_] as any)] as any;

					// 还原子节点
					await arrayList.destroy();

					if (layoutNode?.isValid) {
						layoutNode.addChild(itemNode);
					} else {
						await mk.uiManage.close(itemNode);
					}
				},
				target_
			)
			?.call(target_, oldArrayList);
	}
}
