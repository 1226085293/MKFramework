import * as cc from "cc";
import main_main_nodes from "./main_main_nodes";
import { _decorator } from "cc";
import mk from "mk";
import { resources_audio } from "../../../resources/module/audio/resources_audio";
import { resources_guide } from "../../../resources/module/guide/resources_guide";
import { resources_language } from "../../../resources/module/language/resources_language";
import { resources_module } from "../../../resources/module/module/resources_module";
import { resources_network } from "../../../resources/module/network/resources_network";
import main_bundle from "../../bundle/main_bundle";
import { main_main_item } from "../../module/main/item/main_main_item";
import global_config from "../../../@config/global_config";
const { ccclass, property } = _decorator;

@ccclass("main_main")
export class main_main extends mk.view_base {
	@property(main_main_nodes)
	nodes = new main_main_nodes();

	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		version_s = global_config.constant.version_s;
		view_list_as: typeof main_main_item.prototype.data[] = [
			{
				label_s: "音频",
				view: resources_audio,
			},
			{
				label_s: "多语言(language)",
				view: resources_language,
			},
			{
				label_s: "模块(UI)",
				view: resources_module,
			},
			{
				label_s: "网络",
				view: resources_network,
			},
			{
				label_s: "引导",
				view: resources_guide,
			},
			{
				label_s: "热更",
				view: () => {
					mk.bundle.load_scene("default", { bundle_s: global_config.asset.bundle.hot_update });
				},
			},
		];

		camera_rt: cc.Camera = null!;
		touch_pos_v2!: cc.Vec2;
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	async onLoad() {
		mk.ui_manage.regis(resources_audio, "db://assets/resources/module/audio/resources_audio.prefab", main_bundle);
		mk.ui_manage.regis(resources_language, "db://assets/resources/module/language/resources_language.prefab", main_bundle);
		mk.ui_manage.regis(resources_module, "db://assets/resources/module/module/resources_module.prefab", main_bundle);
		mk.ui_manage.regis(resources_network, "db://assets/resources/module/network/resources_network.prefab", main_bundle);
		mk.ui_manage.regis(resources_guide, "db://assets/resources/module/guide/resources_guide.prefab", main_bundle);
	}

	open(): void {
		this.data.camera_rt = this.nodes.camera_rt.getComponent(cc.Camera)!;
		this.data.camera_rt.targetTexture!.resize(cc.view.getDesignResolutionSize().width, cc.view.getDesignResolutionSize().height);

		this.node.on(
			cc.Node.EventType.TOUCH_END,
			(event: cc.EventTouch) => {
				this.data.touch_pos_v2 = event.getUILocation();

				const node = this.traverse_nodes_f();

				if (node) {
					node.sprite.color = cc.Color.RED;
					this.scheduleOnce(() => {
						node.sprite.color = cc.Color.WHITE;
					}, 1);
				}
			},
			this
		);
	}

	traverse_nodes_f(node_ = this.nodes.check_node, parent_: cc.Node = null!): cc.Node {
		for (const v of node_.children) {
			const node = this.traverse_nodes_f(v, node_);

			if (node) {
				return node;
			}
		}

		// 检查碰撞
		if (parent_) {
			const old_layer = node_.layer;

			node_.layer = 1;
			this.data.camera_rt.camera.update();

			const color_as = this.data.camera_rt.targetTexture!.readPixels(this.data.touch_pos_v2.x, this.data.touch_pos_v2.y, 1, 1)!;

			if (color_as.slice(0, 3).find((v) => v !== 0)) {
				return node_;
			}

			node_.layer = old_layer;
		}

		return null!;
	}
}
