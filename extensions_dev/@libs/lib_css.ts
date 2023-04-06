class lib_css_extend {
	/** 动态加载 css */
	load(info_as_: lib_css_extend_.css_info[]): void {
		info_as_.forEach((v) => {
			const css = document.createElement("link");

			css.rel = "stylesheet";
			css.href = v.url_s;
			for (let k2_n = 0, len_n = v.parent.children.length; k2_n < len_n; ++k2_n) {
				if (v.parent.children.item(k2_n)?.outerHTML === css.outerHTML) {
					return;
				}
			}
			console.log("css", v.url_s);
			v.parent.appendChild.call(v.parent, css);
		});
	}
}

export namespace lib_css_extend_ {
	export interface css_info {
		/** css 路径 */
		url_s: string;
		/** 挂载节点 */
		parent: ParentNode;
	}
}

export default new lib_css_extend();
