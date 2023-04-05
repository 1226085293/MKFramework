import monitor from "../../../../@framework/mk_monitor";
import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";
import mk from "mk";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return typeof data_ === "number";
}

export namespace 进度更新 {
	@ccclass("data_method_number/进度更新")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "同步修改" })
		sync_modify_b = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		const progress = node_.getComponent(cc.ProgressBar);
		const slider = node_.getComponent(cc.Slider);

		if (!(progress ?? slider)) {
			mk.log.error("不存在组件");
			return;
		}

		if (params_.sync_modify_b && slider) {
			slider.node.on("slide", () => {
				target_[key_] = slider.progress as any;
			});
		}

		monitor
			.on(
				target_,
				key_,
				(value) => {
					(progress ?? slider)!.progress = value as any;
				},
				() => {
					slider?.node.off("slide");
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 字符变更 {
	@ccclass("data_method_number/字符变更/值")
	export class ccclass_params_value extends tool_monitor_trigger_event {
		@property({ displayName: "键" })
		key_n = 0;

		@property({ displayName: "值" })
		value_s = "";
	}

	@ccclass("data_method_number/字符变更")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "对应字符", type: [ccclass_params_value] })
		value_as: ccclass_params_value[] = [];
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.label.string = params_.value_as.find((v) => v.key_n === value)?.value_s ?? "";
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
