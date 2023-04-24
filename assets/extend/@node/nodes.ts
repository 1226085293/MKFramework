import * as cc from "cc";
import { EDITOR } from "cc/env";

declare module "cc" {
	// 节点扩展
	interface Node {
		/** 节点渲染次序 */
		zIndex: number;
		/** 宽 */
		width: number;
		/** 高 */
		height: number;
		/** 透明度 */
		opacity: number;
		/** 锚点 */
		anchor: cc.Vec2;
	}

	// 节点组件扩展
	interface Node {
		label: Label;
		mask: Mask;
		rich_text: RichText;
		sprite: Sprite;
		animation: Animation;
		edit_box: EditBox;
		layout: Layout;
		page_view: PageView;
		progress_bar: ProgressBar;
		safe_area: SafeArea;
		scroll_view: ScrollView;
		slider: Slider;
		toggle: Toggle;
		ui_opacity: UIOpacity;
		ui_transform: UITransform;
		widget: Widget;
		graphics: cc.Graphics;
	}
}

if (!EDITOR) {
	const component_ss = {
		label: "cc.Label",
		mask: "cc.Mask",
		rich_text: "cc.RichText",
		sprite: "cc.Sprite",
		animation: "cc.Animation",
		edit_box: "cc.EditBox",
		layout: "cc.Layout",
		page_view: "cc.PageView",
		progress_bar: "cc.ProgressBar",
		safe_area: "cc.SafeArea",
		scroll_view: "cc.ScrollView",
		slider: "cc.Slider",
		toggle: "cc.Toggle",
		ui_opacity: "cc.UIOpacity",
		ui_transform: "cc.UITransform",
		widget: "cc.Widget",
		graphics: "cc.Graphics",
	};

	// 节点组件扩展
	for (const k_s in component_ss) {
		const component_tab: Record<string, cc.Component | null> = cc.js.createMap();

		Object.defineProperty(cc.Node.prototype, k_s, {
			get: function (this: cc.Node) {
				if (component_tab[this.uuid]?.isValid) {
					return component_tab[this.uuid];
				}
				return (component_tab[this.uuid] = this.getComponent(component_ss[k_s]) ?? this.addComponent(component_ss[k_s]));
			},
			configurable: true,
		});
	}

	// zIndex
	Object.defineProperty(cc.Node.prototype, "zIndex", {
		get: function (this: cc.Node) {
			return (this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).priority;
		},
		set: function (this: cc.Node, value_n_: number) {
			(this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).priority = value_n_;
		},
		configurable: true,
	});

	// width
	{
		const desc = Object.getOwnPropertyDescriptor(cc.Node.prototype, "width")!;

		desc.get = function (this: cc.Node) {
			return (this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).contentSize.width;
		};
		desc.set = function (this: cc.Node, value_n_: number) {
			const comp = this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform);

			comp.setContentSize(cc.size(value_n_, comp.height));
		};
	}

	// height
	{
		const desc = Object.getOwnPropertyDescriptor(cc.Node.prototype, "height")!;

		desc.get = function (this: cc.Node) {
			return (this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).contentSize.height;
		};
		desc.set = function (this: cc.Node, value_n_: number) {
			const comp = this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform);

			comp.setContentSize(cc.size(comp.width, value_n_));
		};
	}

	// opacity
	Object.defineProperty(cc.Node.prototype, "opacity", {
		get: function (this: cc.Node) {
			return (this.getComponent(cc.UIOpacity) ?? this.addComponent(cc.UIOpacity)).opacity;
		},
		set: function (this: cc.Node, value_n_: number) {
			(this.getComponent(cc.UIOpacity) ?? this.addComponent(cc.UIOpacity)).opacity = value_n_;
		},
		configurable: true,
	});

	/** 锚点 */
	Object.defineProperty(cc.Node.prototype, "anchor", {
		get: function (this: cc.Node) {
			return (this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).anchorPoint;
		},
		set: function (this: cc.Node, value_v2_: cc.Vec2) {
			(this.getComponent(cc.UITransform) ?? this.addComponent(cc.UITransform)).setAnchorPoint(value_v2_);
		},
		configurable: true,
	});
}

export {};
