window.loadBundleStrList = window.loadBundleStrList ?? (window.loadBundleStrList = []);
{
	/** 原函数 */
	let oldLoadFunc = window.cc.game._loadProjectBundles;

	window.cc.game._loadProjectBundles = async function (...argsList) {
		let bundleList = window.cc.settings.querySettings("assets", 'preloadBundles') ?? [];
		let loadBundleList = ["Config", "Framework", ...window.loadBundleStrList].map(vStr => {
			return {
				bundle: vStr
			}
		});

		bundleList.unshift(...loadBundleList);
		bundleList.forEach(v => {
			let bundleStr = v.bundle;
			let data = null;
			let keyStr = "";

			cc.assetManager.cacheManager.cachedFiles.forEach((v2, k2Str) => {
				if (k2Str.includes(`/${bundleStr}/index.`) && (!data || data.lastTime < v2.lastTime)) {
					keyStr = k2Str;
					data = v2;
				}
			})

			let versionStr = !data ? "" : keyStr.split(".").slice(-2)[0];
			let urlStr = !data ? bundleStr : keyStr.slice(0, keyStr.indexOf("/index."));

			v.bundle = urlStr;
			if (versionStr) {
				v.version = versionStr;
				window.cc.assetManager.downloader.bundleVers[bundleStr] = versionStr;
			}
		})



		window.cc.settings.overrideSettings("assets", "bundleVers", window.cc.assetManager.downloader.bundleVers);
		window.cc.settings.overrideSettings("assets", "preloadBundles", bundleList);

		window.cc.game._loadProjectBundles = oldLoadFunc;
		return oldLoadFunc.call(window.cc.game, ...argsList);
	}
}
