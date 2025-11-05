import plugin_config from "../plugin_config";
import plugin_data from "../plugin_data";
import plugin_event from "../plugin_event";

class lib_node_tree {
	/** vue 根组件 */
	hierarchy_vue!: any;
	/** style 表 */
	style_tab!: Record<string, string>;
	/** 节点树元素（当前展示的节点 VueComponent） */
	get node_element_as(): any[] {
		return this.hierarchy_vue.$children;
	}
	/** 节点树数据（当前展示的节点） */
	get node_as(): any[] {
		return this.hierarchy_vue.nodes;
	}
	/** 当前资源 uuid */
	private _current_asset_uuid_s = "";
	/** 更新节点树定时器 */
	private _update_node_tree_timer: any;
	/** 头扩展 */
	private _head_extension_as: [string, (data: any) => boolean, (data: any) => HTMLElement, ((data: any, element: HTMLElement) => void)?][] = [];
	/** 尾左侧扩展 */
	private _tail_left_extension_as: [string, (data: any) => boolean, (data: any) => HTMLElement, ((data: any, element: HTMLElement) => void)?][] =
		[];
	/** 尾右侧扩展 */
	private _tail_right_extension_as: [string, (data: any) => boolean, (data: any) => HTMLElement, ((data: any, element: HTMLElement) => void)?][] =
		[];
	/* ------------------------------- segmentation ------------------------------- */
	/** 初始化 */
	init(): void {
		let panel_map = new Map<string, any>();

		// 获取面板元素
		{
			let panel_as: any[] = (globalThis as any).document.getElementsByTagName("dock-frame")[0].shadowRoot.querySelectorAll("panel-frame");

			panel_as.forEach((v) => {
				panel_map.set(v.name, v);
			});
		}

		this.hierarchy_vue = panel_map.get("hierarchy").shadowRoot.querySelectorAll("ui-drag-area")[0].__vue__;

		// 初始化节点树
		this._clear_node_tree();
		this._update_node_tree();

		// 取消监听
		(globalThis as any)["__node_tree_stop_watch_f"]?.();
		// 监听节点树变更
		(globalThis as any)["__node_tree_stop_watch_f"] = this.hierarchy_vue.$watch("nodes", (new_value: any[], old_value: any[]) => {
			// console.log("children 变化", new_value.length, old_value.length);
			if (this._update_node_tree_timer) {
				return;
			}

			this._update_node_tree();
			this._update_node_tree_timer = setTimeout(() => {
				this._update_node_tree_timer = null;
			}, 0);
		});

		this.style_tab = new Proxy(
			{},
			{
				get: (target, key) => (target as any)[key],
				set: (target, key, new_value, old_value) => {
					(target as any)[key] = new_value;
					let root = this.hierarchy_vue.$el as HTMLElement;
					let style = root.getElementsByClassName(key as any)[0];

					if (!style) {
						style = document.createElement("style");
						style.textContent = new_value;
						root.appendChild(style);
					} else {
						style.textContent = new_value;
					}
					return true;
				},
			}
		);
	}

	/** 添加扩展 */
	add(
		type_: lib_node_tree_.extension_type,
		class_name_s_: string,
		visible_f_: (data: any) => boolean,
		create_f_: (data: any) => HTMLElement,
		update_f_?: (data: any, element: HTMLElement) => void
	): void {
		let data_as: any = [class_name_s_, visible_f_, create_f_, update_f_];

		switch (type_) {
			case lib_node_tree_.extension_type.head: {
				this._head_extension_as.push(data_as);
				break;
			}
			case lib_node_tree_.extension_type.tail_left: {
				this._tail_left_extension_as.push(data_as);
				break;
			}
			case lib_node_tree_.extension_type.tail_right: {
				this._tail_right_extension_as.push(data_as);
				break;
			}
		}

		this._update_node_tree();
	}

	/** 删除扩展 */
	del(type_: lib_node_tree_.extension_type, class_name_s_: string): void {
		let list_as: any[];

		switch (type_) {
			case lib_node_tree_.extension_type.head: {
				list_as = this._head_extension_as;
				break;
			}
			case lib_node_tree_.extension_type.tail_left: {
				list_as = this._tail_left_extension_as;
				break;
			}
			case lib_node_tree_.extension_type.tail_right: {
				list_as = this._tail_right_extension_as;
				break;
			}
		}

		let index_n = list_as.findIndex((v_as) => v_as[0] === class_name_s_);

		if (index_n !== -1) {
			list_as.splice(index_n, 1);
		}
		this._update_node_tree();
	}

	/** 是否存在 */
	has(type_: lib_node_tree_.extension_type, class_name_s_: string): boolean {
		let list_as: any[];

		switch (type_) {
			case lib_node_tree_.extension_type.head: {
				list_as = this._head_extension_as;
				break;
			}
			case lib_node_tree_.extension_type.tail_left: {
				list_as = this._tail_left_extension_as;
				break;
			}
			case lib_node_tree_.extension_type.tail_right: {
				list_as = this._tail_right_extension_as;
				break;
			}
		}

		let index_n = list_as.findIndex((v_as) => v_as[0] === class_name_s_);

		return index_n !== -1;
	}

	/** 清理节点树 */
	private _clear_node_tree(): void {
		this.node_element_as.forEach((v) => {
			let element = v.$el as HTMLElement;

			// 横向布局
			element.style.display = "flex";
			// 删除节点扩展容器
			element.children[1]?.remove();
		});
	}

	/** 更新节点树 */
	private _update_node_tree(): void {
		// 更新事件
		{
			let last_asset_uuid_s = this._current_asset_uuid_s;
			this._current_asset_uuid_s = !this.node_as.length
				? ""
				: this.node_as[0].type === "cc.Scene"
				? this.node_as[0].uuid
				: this.node_as[0].prefab.assetUuid;

			// 节点树更新
			if (last_asset_uuid_s !== this._current_asset_uuid_s) {
				plugin_event.emit(plugin_event.key.node_tree_update);
			}
		}

		if (!this.node_as.length) {
			return;
		}

		this.node_element_as.forEach((v) => {
			let element = v.$el as HTMLElement;
			/** 节点 div */
			let node_div: HTMLElement = element.children[0] as any;
			/** 扩展头 div */
			let head_extend_div: HTMLElement = element.getElementsByClassName("head-extend")?.[0] as any;
			/** 扩展左 div */
			let tail_extend_left_div: HTMLElement = node_div.getElementsByClassName("tail-extend-left")?.[0] as any;
			/** 扩展右 div */
			let tail_extend_right_div: HTMLElement = node_div.getElementsByClassName("tail-extend-right")?.[0] as any;

			if (element.getAttribute("state") === "add") {
				return;
			}

			let ui_rename_div = node_div.getElementsByTagName("ui-rename-input")[0] as HTMLElement;

			// 更新内容
			{
				element.style.display = "flex";
				node_div.style.width = "-webkit-fill-available";
				if (ui_rename_div && this._tail_left_extension_as.length) {
					ui_rename_div.style.flex = "none";
				}
			}

			// 头扩展
			if (!head_extend_div && this._head_extension_as.length) {
				head_extend_div = document.createElement("div");
				head_extend_div.className = "head-extend";
				head_extend_div.style.display = "inline-flex";
				head_extend_div.style.paddingLeft = "5px";
				head_extend_div.style.paddingRight = "-3px";
				head_extend_div.style.flexDirection = "row";
				head_extend_div.style.float = "left";
				head_extend_div.style.gap = "4px";
				head_extend_div.style.position = "absolute";
				head_extend_div.style.left = "0px";

				element.appendChild(head_extend_div);
			}

			// 尾左侧扩展
			if (!tail_extend_left_div && this._tail_left_extension_as.length) {
				tail_extend_left_div = document.createElement("div");
				tail_extend_left_div.className = "tail-extend-left";
				tail_extend_left_div.style.display = "inline-flex";
				tail_extend_left_div.style.paddingLeft = "5px";
				tail_extend_left_div.style.flexDirection = "row";
				tail_extend_left_div.style.float = "left";
				tail_extend_left_div.style.gap = "4px";
				tail_extend_left_div.style.flex = "1";

				ui_rename_div.insertAdjacentElement("afterend", tail_extend_left_div);
			}

			// 尾右侧扩展
			if (!tail_extend_right_div && this._tail_right_extension_as.length) {
				tail_extend_right_div = document.createElement("div");
				tail_extend_right_div.className = "tail-extend-right";
				tail_extend_right_div.style.display = "inline-flex";
				tail_extend_right_div.style.paddingRight = "5px";
				tail_extend_right_div.style.flexDirection = "row-reverse";
				tail_extend_right_div.style.gap = "4px";

				node_div.appendChild(tail_extend_right_div);
			}

			[this._head_extension_as, this._tail_left_extension_as, this._tail_right_extension_as].forEach((v2_as, k2_n) => {
				/** 父标签 */
				let parent_div = [head_extend_div, tail_extend_left_div, tail_extend_right_div][k2_n];
				/** 扩展标签 */
				let extend_div_as: HTMLElement[] = [];

				v2_as.forEach((v3) => {
					let [class_s, visible_f, create_f, update_f] = v3;

					/** 扩展标签 */
					let extension_div = parent_div.getElementsByClassName(class_s)?.[0] as HTMLElement;
					/** 是否展示 */
					let visible_b = visible_f(v);

					// 不展示标签
					if (!visible_b) {
						if (extension_div) {
							extension_div.remove();
						}
						return;
					}

					// 展示标签
					if (visible_b && !extension_div) {
						extension_div = create_f(v);
						extension_div.classList.add(class_s);
						parent_div.appendChild(extension_div);
					}

					// 更新扩展列表
					extend_div_as.push(extension_div);
					// 更新标签
					update_f?.(v, extension_div);
				});

				// 删除多余标签
				parent_div?.childNodes.forEach((v3) => {
					if (!extend_div_as.includes(v3 as any)) {
						v3.remove();
					}
				});
			});

			node_div.style.marginLeft = !head_extend_div ? "0px" : `${head_extend_div.clientWidth - 5}px`;
		});
	}
}

export namespace lib_node_tree_ {
	export enum extension_type {
		/** 头 */
		head,
		/** 尾左侧 */
		tail_left,
		/** 尾右侧 */
		tail_right,
	}
}

export default new lib_node_tree();
