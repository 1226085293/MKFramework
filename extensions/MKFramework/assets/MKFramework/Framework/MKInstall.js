window.loadBundleStrList = window.loadBundleStrList ?? (window.loadBundleStrList = []);
{
	/** 原函数 */
	let oldLoadFunc = window.cc.assetManager.loadBundle;
	/** 初始化任务 */
	let initTask = null;

	// 拦截首次加载
	if (window.cc.assetManager.loadBundle) {
		window.cc.assetManager.loadBundle = async function (...argsList) {
			if (initTask) {
				await initTask;
			}
			// 加载框架
			else {
				/** 加载 bundle */
				let loadBundleStrList = ["config", "framework"];

				// 添加其他需要加载的 bundle
				loadBundleStrList.push(...window.loadBundleStrList);
				window.loadBundleStrList = undefined;

				initTask = loadBundleStrList
					.reduce((pre, name) => {
						return pre.then(() => {
							return new Promise((resolve, reject) => {
								oldLoadFunc.call(window.cc.assetManager, name, (err, bundle) => {
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
						window.cc.assetManager.loadBundle = oldLoadFunc;
					});
			}

			// 恢复加载步骤
			window.cc.assetManager.loadBundle(...argsList);
		};
	}
}
