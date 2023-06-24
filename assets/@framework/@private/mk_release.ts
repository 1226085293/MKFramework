import * as cc from "cc";

/**
 * 资源释放器
 */
class mk_release {
	/** 引用节点集合 */
	private _quote_node_set = new Set<cc.Node>();
	/** 引用资源集合 */
	private _quote_asset_set = new Set<cc.Asset>();
	/** 引用对象集合 */
	private _quote_object_set = new Set<mk_release_.release_object_type>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 添加释放对象
	 * @param args_ 要跟随模块释放的对象或列表
	 */
	add<T extends mk_release_.release_param_type, T2 = T | T[]>(args_: T2): T2 {
		if (!args_) {
			return args_;
		}

		let node_as: cc.Node[] | undefined;
		let asset_as: cc.Asset[] | undefined;
		let object_as: mk_release_.release_object_type[] | undefined;

		// 参数转换
		{
			if (Array.isArray(args_)) {
				if (!args_.length) {
					return args_;
				}

				if (args_[0] instanceof cc.Node) {
					node_as = args_ as any;
				} else if (args_[0] instanceof cc.Asset) {
					asset_as = args_ as any;
				} else {
					object_as = args_ as any;
				}
			} else {
				if (args_ instanceof cc.Node) {
					node_as = [args_];
				} else if (args_ instanceof cc.Asset) {
					asset_as = [args_];
				} else {
					object_as = [args_ as any];
				}
			}
		}

		// 添加引用数据
		{
			node_as?.forEach((v) => {
				if (v.isValid) {
					this._quote_node_set.add(v);
				}
			});

			asset_as?.forEach((v) => {
				if (v.isValid) {
					this._quote_asset_set.add(v);
				}
			});

			object_as?.forEach((v) => {
				this._quote_object_set.add(v);
			});
		}

		return args_;
	}

	/** 释放所有已添加对象 */
	release(): void {
		this._quote_asset_set.forEach((v) => {
			if (v.isValid) {
				v.decRef();
			}
		});

		this._quote_node_set.forEach((v) => {
			if (v.isValid) {
				v.removeFromParent();
				v.destroy();
			}
		});

		this._quote_object_set.forEach((v) => v.release());

		this._quote_asset_set.clear();
		this._quote_node_set.clear();
		this._quote_object_set.clear();
	}
}

export namespace mk_release_ {
	/** 释放对象类型 */
	export type release_object_type = { release(): void };
	/** 释放参数类型 */
	export type release_param_type = cc.Node | cc.Asset | release_object_type;
}

export default mk_release;
