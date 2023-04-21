self.cc.game.onPreProjectInitDelegate.add(() => {
	["extend", "decorator", "tool"].reduce((pre, curr) => {
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
