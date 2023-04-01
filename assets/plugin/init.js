/** 原函数 */
let old_load_f = self.cc.assetManager.loadBundle;
/** 初始化任务 */
let init_task = null;

// 拦截首次加载
self.cc.assetManager.loadBundle = async function (...args_as) {
	if (init_task) {
		await init_task;
	}
	// 加载框架
	else {
		init_task = ["extend", "config", "framework", "decorator", "tool"]
			.reduce((pre, name) => {
				return pre.then(() => {
					return new Promise((resolve, reject) => {
						old_load_f.call(self.cc.assetManager, name, (err, bundle) => {
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
				self.cc.assetManager.loadBundle = old_load_f;
			});
	}

	// 恢复加载步骤
	self.cc.assetManager.loadBundle(...args_as);
};
