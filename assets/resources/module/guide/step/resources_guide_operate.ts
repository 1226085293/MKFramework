import * as cc from "cc";

const tab = {
	隐藏所有按钮: {
		load() {
			cc.find("Canvas/resources_guide/按钮")!.children.forEach((v) => {
				v.active = false;
			});

			cc.find("Canvas/resources_guide/遮罩")!.children.forEach((v) => {
				v.active = false;
			});
		},
		reset() {
			this.load();
		},
	},
	按钮1: {
		load() {
			cc.find("Canvas/resources_guide/按钮")!.children[0].active = true;
			cc.find("Canvas/resources_guide/遮罩")!.children[0].active = true;

			return cc.find("Canvas/resources_guide/按钮")!.children[0];
		},
	},
	按钮2: {
		load() {
			cc.find("Canvas/resources_guide/按钮")!.children[1].active = true;
			cc.find("Canvas/resources_guide/遮罩")!.children[1].active = true;

			return cc.find("Canvas/resources_guide/按钮")!.children[1];
		},
	},
	按钮3: {
		load() {
			cc.find("Canvas/resources_guide/按钮")!.children[2].active = true;
			cc.find("Canvas/resources_guide/遮罩")!.children[2].active = true;

			return cc.find("Canvas/resources_guide/按钮")!.children[2];
		},
	},
};

const key: {
	[k in keyof typeof tab]: k;
} = new Proxy(Object.create(null), {
	get: (target, key) => key,
});

export default {
	tab,
	key,
};
