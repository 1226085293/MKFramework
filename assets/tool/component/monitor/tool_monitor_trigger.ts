import { _decorator } from "cc";
import { EDITOR } from "cc/env";
import * as cc from "cc";
import tool from "../../tool";
import tool_monitor_data_method from "./data_method/tool_monitor_data_method";
// eslint-disable-next-line unused-imports/no-unused-imports
import { tool_monitor_trigger_event } from "./tool_monitor_trigger_event";
const { ccclass, property } = _decorator;

export namespace _tool_monitor_trigger {
	@ccclass("monitor_trigger/trigger")
	export class trigger {
		/* --------------- static --------------- */
		/** 事件名表 */
		static event_name_tab: Record<string, string[]>;
		/** 数据类型枚举 */
		static data_type_enum: any;
		/** 初始化状态 */
		private static _init_b = false;
		/** 数据类型列表 */
		private static _data_type_ss: string[];
		/* --------------- 属性 --------------- */
		/** 数据类型 */
		@property({ displayName: "数据类型", type: cc.Enum({}) })
		get type_n(): number {
			return trigger.data_type_enum?.[this.type_s] ?? -1;
		}

		set type_n(value_n_) {
			this._set_type_n(value_n_);
		}

		/** 事件名 */
		@property({ displayName: "事件名", type: cc.Enum({}) })
		get event_n(): number {
			return trigger.event_name_tab[this.type_s]?.indexOf(this.event_s) ?? -1;
		}

		set event_n(value_n_) {
			this._set_event_n(value_n_);
		}

		/** 事件 */
		@property({ displayName: "事件参数", type: [tool_monitor_trigger_event], readonly: true })
		event_param_as: any[] = [];

		/** 事件名 */
		@property({ visible: false })
		event_s = "";

		/** 数据类型 */
		@property({ visible: false })
		type_s = "";

		/* ------------------------------- 功能 ------------------------------- */
		/** 初始化编辑器 */
		init_editor(): void {
			if (trigger._init_b) {
				this._update_type_inspector();
				this._update_event_inspector();
				return;
			}
			trigger._init_b = true;

			trigger._data_type_ss = Object.keys(tool_monitor_data_method).filter((v_s) => tool_monitor_data_method[v_s]);
			trigger.data_type_enum = tool.enum.array_to_enum(trigger._data_type_ss);
			trigger.event_name_tab = Object.create(null);

			// 初始化事件名表
			trigger._data_type_ss.forEach((v_s) => {
				trigger.event_name_tab[v_s] = Object.keys(tool_monitor_data_method[v_s]).filter((v2_s) => v2_s !== "check_type");
			});

			// 初始化视图
			this._update_type_inspector();
			this._update_event_inspector();
		}

		/** 更新类型检查器 */
		private _update_type_inspector(): void {
			if (EDITOR) {
				if (!this.type_s) {
					this.type_s = trigger.data_type_enum[0];
				}
				cc.CCClass.Attr.setClassAttr(trigger, "type_n", "enumList", cc.Enum.getList(cc.Enum(trigger.data_type_enum)));
			}
		}

		/** 更新事件检查器 */
		private _update_event_inspector(): boolean {
			if (EDITOR) {
				if (!this.type_s) {
					return false;
				}

				// 更新事件名
				if (trigger.event_name_tab[this.type_s]?.length) {
					cc.CCClass.Attr.setClassAttr(trigger, "event_n", "enumList", tool.enum.array_to_cc_enum(trigger.event_name_tab[this.type_s]));
					return true;
				}
				this.event_param_as[0]?.type_check_b;
			}
			return false;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _set_type_n(value_n_: number): void {
			if (isNaN(value_n_)) {
				return;
			}
			this.type_s = trigger.data_type_enum[value_n_];
			// 重置事件名
			if (this._update_event_inspector()) {
				this.event_n = 0;
			}
		}

		private _set_event_n(value_n_: number): void {
			if (!this.type_s) {
				return;
			}
			this.event_s = trigger.event_name_tab[this.type_s][value_n_];

			// 更新事件参数
			if (EDITOR) {
				/** 参数类型 */
				const ccclass = tool_monitor_data_method[this.type_s][this.event_s]?.ccclass_params;

				// 更新参数
				this.event_param_as.splice(0, this.event_param_as.length);
				if (ccclass?.["__props__"].length) {
					this.event_param_as.push(new ccclass());
				}
			}
		}
	}
}

@ccclass("monitor_trigger")
export class tool_monitor_trigger extends cc.Component {
	/* --------------- 属性 --------------- */
	@property({ visible: false })
	get init_editor(): void {
		this._init_editor();
		return;
	}

	/** 数据目标 */
	@property({ displayName: "数据目标", type: cc.Node })
	get data_target(): any {
		return this._data_target;
	}

	set data_target(value_) {
		this._set_data_target(value_);
	}

	/** 数据键 */
	@property({ displayName: "数据键" })
	get data_key_s(): string {
		return this._data_key_s;
	}

	set data_key_s(value_s_) {
		this._set_data_key_s(value_s_);
	}

	/** 数据键列表 */
	@property({ displayName: "数据键列表", type: cc.Enum({}) })
	get data_key_enum(): number {
		return -1;
	}

	set data_key_enum(value_) {
		if (value_ === -1) {
			return;
		}
		this.data_key_s += (this._data_key_s.length ? "." : "") + this._data_key_enum[value_];
	}

	/** 数据类型检查 */
	@property({ displayName: "数据类型检查", readonly: true })
	get type_check_b(): boolean {
		return this._get_type_check_b();
	}

	/** 触发事件 */
	@property({ displayName: "触发事件", type: _tool_monitor_trigger.trigger })
	event = new _tool_monitor_trigger.trigger();

	/** 数据键 */
	@property
	private _data_key_s = "";

	/** 数据目标 */
	@property(cc.Node)
	private _data_target: cc.Node = null!;

	/* --------------- private --------------- */
	/** 调用时间表 */
	private _call_time_tab: Record<string, number> = Object.create(null);
	/** 用户组件 */
	private _user_comp?: cc.Component;
	/** 上个数据键 */
	private _pre_data_key_s = "";
	/** 填充字符 */
	private _filler_character_ss: string[] = [];
	/** 数据键列表枚举 */
	private _data_key_enum: any;
	/** 父数据 */
	private _data_parent: any;
	/** 监听数据 */
	private _monitor_data: {
		data: any;
		key_s: string;
	} | null = null;

	/* ------------------------------- 生命周期 ------------------------------- */
	onEnable() {
		this.monitor(this._data_target, this._data_key_s);
	}

	onDisable() {
		if (this._monitor_data) {
			mk.monitor.off(this._monitor_data.data, this._monitor_data.key_s, this._monitor_data.data);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 绑定数据
	 * @param target_ 数据对象
	 * @param data_key_s_ 数据键
	 * @param event_ 触发事件
	 * @returns
	 */
	async monitor(target_: cc.Node, data_key_s_: string): Promise<void> {
		/** 触发事件 */
		const event = tool_monitor_data_method[this.event.type_s]?.[this.event.event_s];

		if (!event) {
			console.error("触发事件错误", this.event.type_s, this.event.event_s);
			return;
		}

		// 清理事件
		if (this._monitor_data) {
			await mk.monitor.off(this._monitor_data.data, this._monitor_data.key_s, this._monitor_data.data);
			this._monitor_data = null;
		}

		// 更新组件数据
		{
			this._data_target = target_;
			this._data_key_s = data_key_s_;
		}

		/** 自定义组件 */
		const data = this._update_user_comp();
		/** 数据键 */
		let data_key_s: string;

		if (!data) {
			console.error("不存在用户组件");
			return;
		}
		// 获取数据和数据键
		{
			/** 末尾点下标 */
			const last_point_n = this._data_key_s.lastIndexOf(".");
			/** 键头 */
			const key_head_s = last_point_n === -1 ? this._data_key_s : this._data_key_s.slice(0, last_point_n);
			/** 数据路径 */
			const data_path_ss = last_point_n === -1 ? [] : key_head_s.split(".");

			data_key_s = last_point_n === -1 ? this._data_key_s : this._data_key_s.slice(last_point_n + 1);
			this._data_parent = this._get_data_from_path(data, data_path_ss)!;
			if (!this._data_parent) {
				console.error("数据获取错误", key_head_s);
				return;
			}
		}

		if (!data_key_s) {
			return;
		}

		// 监听数据
		event.on(this._data_parent, data_key_s, this.node, this.event.event_param_as[0]);

		// 更新监听数据
		this._monitor_data = {
			data: this._data_parent,
			key_s: data_key_s,
		};
	}

	/** 初始化编辑器 */
	private _init_editor(): void {
		this._update_user_comp();
		this._update_data_key_enum();
		this.event.init_editor();
	}

	/** 更新用户组件 */
	private _update_user_comp(): cc.Component | undefined {
		this._user_comp = !this._data_target ? undefined : this._data_target.components.find((v) => !cc.js.getClassName(v).startsWith("cc."));
		return this._user_comp;
	}

	/** 根据路径获取数据 */
	private _get_data_from_path(data_: any, path_ss_: string[]): any {
		for (let k_n = 0, len_n = path_ss_.length; k_n < len_n; ++k_n) {
			data_ = data_[path_ss_[k_n]];
			if (typeof data_ !== "object" || data_ === null) {
				break;
			}
		}
		return data_;
	}

	/** 更新数据键枚举 */
	private _update_data_key_enum(): void {
		if (!this._user_comp) {
			return;
		}

		/** 数据路径 */
		const data_path_ss = !this._data_key_s ? [] : this._data_key_s.split(".");
		/** 数据目标 */
		const data_target = this._get_data_from_path(this._user_comp, data_path_ss);

		// 更新数据键枚举
		this._data_key_enum = tool.enum.obj_to_enum(data_target || {});

		// 更新编辑器数据键枚举
		if (EDITOR) {
			const cc_enum = cc.Enum.getList<Record<string, number>>(cc.Enum(this._data_key_enum));

			// 添加类型
			cc_enum.forEach((v) => {
				v.name += " - " + typeof data_target[v.name];
			});
			cc.CCClass.Attr.setClassAttr(tool_monitor_trigger, "data_key_enum", "enumList", cc_enum);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _get_type_check_b(): boolean {
		if (!_tool_monitor_trigger.trigger.data_type_enum || !this._user_comp || !this.event) {
			return false;
		}
		/** 数据类型 */
		const data_type_s = _tool_monitor_trigger.trigger.data_type_enum[this.event.type_n];
		/** 检查类型函数 */
		const check_type_f: (data: any) => boolean = tool_monitor_data_method[data_type_s]?.check_type;
		/** 实际数据 */
		const data = this._get_data_from_path(this._user_comp, this._data_key_s.split("."));

		return !check_type_f || check_type_f(data);
	}

	private _set_data_key_s(value_s_: string): void {
		if (this._call_time_tab["data_key_s"] && Date.now() - this._call_time_tab["data_key_s"] < 500) {
			return;
		}
		this._call_time_tab["data_key_s"] = Date.now();
		this._data_key_s = value_s_;
		if (!this._user_comp) {
			return;
		}
		/** 当前数据键头 */
		let key_head_s: string;

		// 初始化数据键头 | 尾
		{
			const last_point_n = this._data_key_s.lastIndexOf(".");

			key_head_s = this._data_key_s.slice(0, last_point_n !== -1 ? last_point_n : this._data_key_s.length);
		}

		// 更新提示文本
		if (key_head_s !== this._pre_data_key_s) {
			this._pre_data_key_s = key_head_s;
			/** 数据路径 */
			const data_path_ss = key_head_s.split(".");
			/** 数据目标 */
			let data_target = this._user_comp;

			// 通过路径获取数据
			{
				let temp: any;

				for (let k_n = 0, len_n = data_path_ss.length; k_n < len_n; ++k_n) {
					temp = data_target[data_path_ss[k_n]];
					if (typeof temp !== "object" || temp === null) {
						this._pre_data_key_s = data_path_ss.slice(0, k_n).join(".");
						break;
					}
					data_target = temp;
				}
			}

			// 更新文本提示
			this._filler_character_ss = Object.keys(data_target).map((v_s) => (this._pre_data_key_s ? `${this._pre_data_key_s}.` : "") + v_s);
			// 避免一级键自动补全二级键
			if (this._user_comp[this._pre_data_key_s] !== undefined) {
				this._filler_character_ss.push(this._pre_data_key_s);
			}
		}

		// 更新文本
		this._data_key_s = tool.string.fuzzy_match(this._filler_character_ss, this._data_key_s) ?? this._pre_data_key_s;

		// 更新文本提示
		this._update_data_key_enum();
	}

	private _set_data_target(value_: cc.Node): void {
		this._data_target = value_;
		this._update_user_comp();
		this.data_key_s = "";
	}
}
