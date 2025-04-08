window.load_bundle_ss = window.load_bundle_ss ?? (window.load_bundle_ss = []);
{
	/** 原函数 */
	let old_load_f = window.cc.assetManager.loadBundle;
	/** 初始化任务 */
	let init_task = null;

	// 拦截首次加载
	if (window.cc.assetManager.loadBundle) {
		window.cc.assetManager.loadBundle = async function (...args_as) {
			if (init_task) {
				await init_task;
			}
			// 加载框架
			else {
				/** 加载 bundle */
				let load_bundle_ss = ["config", "framework"];

				// 添加其他需要加载的 bundle
				load_bundle_ss.push(...window.load_bundle_ss);
				window.load_bundle_ss = undefined;

				init_task = load_bundle_ss
					.reduce((pre, name) => {
						return pre.then(() => {
							return new Promise((resolve, reject) => {
								old_load_f.call(window.cc.assetManager, name, (err, bundle) => {
									if (err) {
										return reject(err);
									}

									resolve(bundle);
								});
							});
						});
					}, Promise.resolve())
					.then((pre) => {
						// 还原 loadBundle
						window.cc.assetManager.loadBundle = old_load_f;
					});
			}

			// 恢复加载步骤
			window.cc.assetManager.loadBundle(...args_as);
		};
	}
}
