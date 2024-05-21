import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";
import mk from "mk";
import tool_node from "../../../tool_node";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return typeof data_ === "string" || typeof data_ === "number";
}

export namespace 默认 {
	@ccclass("data_method_string/默认")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "前缀" })
		head_s = "";

		@property({ displayName: "后缀" })
		tail_s = "";
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		const language_comp = node_.getComponent(mk.language.label);

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					if (language_comp?.isValid) {
						language_comp.mark_s = params_.head_s + String(value) + params_.tail_s;
					} else {
						mk.N(node_).label.string = params_.head_s + String(value) + params_.tail_s;
					}
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 多余省略 {
	@ccclass("data_method_string/多余省略")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "最大字符数量" })
		max_n = 5;

		@property({ displayName: "超出替换字符" })
		replace_s = "...";
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					const value_s = String(value);

					mk.N(node_).label.string = value_s.length <= params_.max_n ? value_s : value_s.slice(0, params_.max_n) + params_.replace_s;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 远程图片 {
	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node): void {
		mk.monitor
			.on(
				target_,
				key_,
				async (value) => {
					const value_s = String(value);

					if (!value_s) {
						return;
					}

					const assets = await mk.asset.get(value_s, cc.ImageAsset, null, {
						remote_option: {
							ext: ".png",
						},
					});

					if (!assets) {
						return;
					}

					mk.N(node_).sprite.spriteFrame = cc.SpriteFrame.createWithImage(assets);

					// 找到视图基类添加自动释放
					const view_comp = tool_node
						.traverse_parent(node_, (node) => Boolean(node.getComponent(mk.view_base)))
						?.getComponent(mk.view_base);

					if (!view_comp) {
						mk.error("未找到父模块，不能自动释放动态资源");

						return;
					}

					view_comp.follow_release(assets);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 编辑框 {
	@ccclass("data_method_string/编辑框")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "同步修改" })
		sync_modify_b = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		const type_s = typeof target_[key_];

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					const value_s = String(value);

					mk.N(node_).edit_box.string = value_s;
				},
				() => {
					mk.N(node_).edit_box.node.off(cc.EditBox.EventType.EDITING_DID_ENDED);
				},
				target_
			)
			?.call(target_, target_[key_]);

		// 同步修改
		if (params_.sync_modify_b) {
			mk.N(node_).edit_box.node.on(cc.EditBox.EventType.EDITING_DID_ENDED, () => {
				target_[key_] = (type_s === "string" ? mk.N(node_).edit_box.string : Number(mk.N(node_).edit_box.string)) as any;
			});
		}
	}
}
