self.cc.game.onPreProjectInitDelegate.add(() => {
	["config", "framework"].reduce((pre, curr) => {
		return pre.then(() => {
			return new Promise((resolve, reject) => {
				self.cc.assetManager.loadBundle(curr, (err, bundle) => {
					if (err) {
						return reject(err);
					}
					resolve();
				});
			});
		});
	}, Promise.resolve());
});
