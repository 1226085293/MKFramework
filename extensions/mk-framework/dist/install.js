"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/naming-convention */
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cjson_1 = __importDefault(require("cjson"));
const prettier_1 = __importDefault(require("prettier"));
const fast_glob_1 = __importDefault(require("fast-glob"));
// 修改模块让其正常加载
[path_1.default.join(__dirname, "../node_modules/isomorphic-git/index"), path_1.default.join(__dirname, "../node_modules/isomorphic-git/http/node/index")].forEach((v_s) => {
    if (fs_extra_1.default.existsSync(v_s + ".js") && fs_extra_1.default.existsSync(v_s + ".cjs")) {
        fs_extra_1.default.renameSync(v_s + ".js", v_s + ".temp");
        fs_extra_1.default.renameSync(v_s + ".cjs", v_s + ".js");
    }
});
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const package_json = require("../package.json");
async function default_1() {
    /** 用户名 */
    const owner_s = "muzzik";
    /** 仓库路径 */
    const repo_s = "MKFramework";
    /** 临时路径 */
    const temp_path_s = Editor.Project.tmpDir;
    /** 插件路径 */
    const plugin_path_s = path_1.default.join(__dirname, "../../");
    /** 远程路径 */
    const remote_url_s = `https://gitee.com/${owner_s}/${repo_s}.git`;
    /** 下载路径 */
    const download_path_s = path_1.default.join(temp_path_s, "mk_framework");
    /** 框架代码路径 */
    const framework_path_s = "assets/mk-framework";
    /** 安装路径 */
    const install_path_s = path_1.default.join(__dirname, "..", framework_path_s);
    /** ts 配置 */
    const project_tsconfig = cjson_1.default.load(path_1.default.join(Editor.Project.path, "tsconfig.json"));
    /** 包配置 */
    const project_package = cjson_1.default.load(path_1.default.join(Editor.Project.path, "package.json"));
    /** 安装版本 */
    let version_s;
    Promise.resolve()
        .then(async () => {
        console.log("安全检查");
        // 覆盖安装确认
        if (fs_extra_1.default.existsSync(path_1.default.join(__dirname, "..", framework_path_s, "@framework"))) {
            const result = await Editor.Dialog.info(Editor.I18n.t("mk-framework.confirm_install"), {
                buttons: [Editor.I18n.t("mk-framework.confirm"), Editor.I18n.t("mk-framework.cancel")],
            });
            if (result.response !== 0) {
                return Promise.reject("取消安装");
            }
            fs_extra_1.default.emptyDirSync(install_path_s);
        }
    })
        .then(async () => {
        console.log("获取版本");
        // const remote_url_s = `https://gitee.com/${owner_s}/${repo_s}/tags`;
        // const html_s = (await axios.get(remote_url_s)).data as string;
        // const tag_ss = html_s.match(/(?<=(data-ref="))([^"]*)(?=")/g) as string[];
        // tag_ss.sort((va_s, vb_s) => {
        // 	const va_version_n = va_s[0] === "v" ? -Number(va_s.slice(1).replace(/\./g, "")) : 999;
        // 	const vb_version_n = vb_s[0] === "v" ? -Number(vb_s.slice(1).replace(/\./g, "")) : 999;
        // 	return va_version_n - vb_version_n;
        // });
        // version_s = tag_ss[0];
        version_s = "dev";
    })
        .then(async () => {
        console.log(`下载框架(${version_s})`);
        // if (true) {
        // 	return;
        // }
        try {
            fs_extra_1.default.removeSync(download_path_s);
            fs_extra_1.default.emptyDirSync(download_path_s);
        }
        catch (error) {
            return error;
        }
        await isomorphic_git_1.default.clone({
            fs: fs_extra_1.default,
            http: node_1.default,
            dir: download_path_s,
            url: remote_url_s,
            depth: 1,
            ref: version_s,
        });
    })
        // 3.8.0 及以上删除 userData.bundleConfigID
        .then(() => {
        var _a;
        console.log(`3.8.0 及以上删除 userData.bundleConfigID`);
        if (!((_a = project_package.creator) === null || _a === void 0 ? void 0 : _a.version) || Number(project_package.creator.version.replace(/\./g, "")) < 380) {
            return;
        }
        const file_ss = [
            `extensions/${package_json.name}/${framework_path_s}/@config.meta`,
            `extensions/${package_json.name}/${framework_path_s}/@framework.meta`,
        ];
        file_ss.forEach((v_s) => {
            const data = fs_extra_1.default.readJSONSync(path_1.default.join(download_path_s, v_s));
            delete data.userData.bundleConfigID;
            fs_extra_1.default.writeJSONSync(path_1.default.join(download_path_s, v_s), data);
        });
    })
        // 注入框架
        .then(async () => {
        console.log(`注入框架`);
        // 拷贝框架文件
        {
            fs_extra_1.default.copySync(path_1.default.join(download_path_s, `extensions/${package_json.name}/assets`), path_1.default.join(install_path_s, ".."));
            Editor.Message.send("asset-db", "refresh-asset", "db://mk-framework");
        }
        // 添加脚本模板
        {
            /** 脚本模板文件路径 */
            const script_template_path = path_1.default.join(download_path_s, ".creator/asset-template/typescript");
            if (fs_extra_1.default.pathExistsSync(script_template_path)) {
                const file_ss = await (0, fast_glob_1.default)(script_template_path.replace(/\\/g, "/") + "/*.ts");
                file_ss.forEach((v_s) => {
                    fs_extra_1.default.copySync(v_s, path_1.default.join(Editor.Project.path, ".creator/asset-template/typescript", path_1.default.basename(v_s)));
                });
            }
        }
    })
        // 注入声明文件
        .then(async () => {
        var _a;
        console.log(`注入声明文件`);
        /** 框架声明文件 */
        const framework_tsconfig = cjson_1.default.load(path_1.default.join(download_path_s, "tsconfig.json"));
        /** 声明文件路径 */
        const declare_path_s = `./extensions/${package_json.name}/@types/mk-framework/`;
        /** 修改 tsconfig */
        let modify_tsconfig_b = false;
        // 拷贝 d.ts
        fs_extra_1.default.copySync(path_1.default.join(download_path_s, declare_path_s), path_1.default.join(Editor.Project.path, declare_path_s));
        // 添加框架类型声明文件
        if ((_a = framework_tsconfig.types) === null || _a === void 0 ? void 0 : _a.length) {
            modify_tsconfig_b = true;
            if (!project_tsconfig.types) {
                project_tsconfig.types = [...framework_tsconfig.types];
            }
            else {
                for (const v_s of framework_tsconfig.types) {
                    if (!project_tsconfig.types.includes(v_s)) {
                        project_tsconfig.types.push(v_s);
                    }
                }
            }
        }
        // 添加 tsconfig 路径配置
        if (framework_tsconfig.compilerOptions.paths) {
            modify_tsconfig_b = true;
            if (!project_tsconfig.compilerOptions) {
                project_tsconfig.compilerOptions = {};
            }
            if (!project_tsconfig.compilerOptions.paths) {
                project_tsconfig.compilerOptions.paths = {};
            }
            for (const k_s in framework_tsconfig.compilerOptions.paths) {
                project_tsconfig.compilerOptions.paths[k_s] = framework_tsconfig.compilerOptions.paths[k_s];
            }
        }
        if (modify_tsconfig_b) {
            fs_extra_1.default.writeFileSync(path_1.default.join(Editor.Project.path, "tsconfig.json"), await prettier_1.default.format(JSON.stringify(project_tsconfig), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
    })
        // 添加导入映射
        .then(async () => {
        var _a;
        console.log(`添加导入映射`);
        const setting_path_s = path_1.default.join(Editor.Project.path, "settings/v2/packages/project.json");
        const setting_config_tab = !fs_extra_1.default.existsSync(setting_path_s) ? {} : fs_extra_1.default.readJSONSync(setting_path_s);
        const mk_import_map_tab = fs_extra_1.default.readJSONSync(path_1.default.join(download_path_s, "import-map.json"));
        // 防止 script 不存在
        if (!setting_config_tab.script) {
            setting_config_tab.script = {};
        }
        /** 导入映射路径 */
        let import_map_path_s = ((_a = setting_config_tab.script.importMap) !== null && _a !== void 0 ? _a : "").replace("project:/", Editor.Project.path);
        // 已存在导入映射
        if (fs_extra_1.default.existsSync(import_map_path_s) && fs_extra_1.default.statSync(import_map_path_s).isFile()) {
            const import_map_tab = fs_extra_1.default.readJSONSync(import_map_path_s);
            // 更新导入映射
            Object.assign(import_map_tab.imports, mk_import_map_tab.imports);
            // 写入导入映射
            fs_extra_1.default.writeFileSync(import_map_path_s, await prettier_1.default.format(JSON.stringify(import_map_tab), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
        // 不存在新建导入映射
        else {
            import_map_path_s = path_1.default.join(Editor.Project.path, "import-map.json");
            // 写入导入映射
            fs_extra_1.default.writeFileSync(import_map_path_s, await prettier_1.default.format(JSON.stringify(mk_import_map_tab), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
            // 更新项目设置
            setting_config_tab.script.importMap = import_map_path_s.replace(Editor.Project.path + "\\", "project://").replace(/\\/g, "/");
            // 写入项目设置
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(setting_path_s));
            fs_extra_1.default.writeFileSync(setting_path_s, await prettier_1.default.format(JSON.stringify(setting_config_tab), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
    })
        // 屏蔽 vscode 框架文件提示
        .then(() => {
        console.log(`屏蔽 vscode 框架文件提示`);
        const vscode_setting_path_s = path_1.default.join(Editor.Project.path, ".vscode/settings.json");
        let settings_json = {};
        // 项目 vscode settings 文件不存在则创建
        if (!fs_extra_1.default.existsSync(vscode_setting_path_s)) {
            fs_extra_1.default.mkdirSync(path_1.default.join(Editor.Project.path, ".vscode"));
        }
        // 存在则读取
        else {
            settings_json = cjson_1.default.load(vscode_setting_path_s);
        }
        settings_json["typescript.preferences.autoImportFileExcludePatterns"] = [
            `./extensions/${package_json.name}/${framework_path_s}/@framework/**`,
        ];
        fs_extra_1.default.writeJSONSync(vscode_setting_path_s, settings_json);
    })
        // 清理临时文件
        .then(() => {
        console.log("清理临时文件");
        fs_extra_1.default.remove(download_path_s);
    })
        .catch((error) => {
        if (!error) {
            return;
        }
        console.error(error);
    });
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9pbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEseURBQXlEO0FBQ3pELHdEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLHdEQUFnQztBQUVoQywwREFBNkI7QUFFN0IsYUFBYTtBQUNiLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsc0NBQXNDLENBQUMsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUM3SSxDQUFDLEdBQUcsRUFBRSxFQUFFO0lBQ1AsSUFBSSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxFQUFFO1FBQzlELGtCQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDO1FBQzFDLGtCQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxNQUFNLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDO0tBQ3pDO0FBQ0YsQ0FBQyxDQUNELENBQUM7QUFFRixvRUFBNEM7QUFDNUMsb0VBQTRDO0FBQzVDLDhEQUE4RDtBQUM5RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUVqQyxLQUFLO0lBQ25CLFVBQVU7SUFDVixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUM7SUFDekIsV0FBVztJQUNYLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQztJQUM3QixXQUFXO0lBQ1gsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFDMUMsV0FBVztJQUNYLE1BQU0sYUFBYSxHQUFHLGNBQUksQ0FBQyxJQUFJLENB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WSxDQUFDLElBQUksSUFBSSxnQkFBZ0IsZ0JBQWdCO1NBQ3JFLENBQUM7UUFFRixrQkFBRSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN4RCxDQUFDLENBQUM7UUFDRixTQUFTO1NBQ1IsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEIsa0JBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDaEIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNYLE9BQU87U0FDUDtRQUVELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBOVFELDRCQThRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBjanNvbiBmcm9tIFwiY2pzb25cIjtcbmltcG9ydCBwcmV0dGllciBmcm9tIFwicHJldHRpZXJcIjtcbmltcG9ydCBheGlvcyBmcm9tIFwiYXhpb3NcIjtcbmltcG9ydCBnbG9iIGZyb20gXCJmYXN0LWdsb2JcIjtcblxuLy8g5L+u5pS55qih5Z2X6K6p5YW25q2j5bi45Yqg6L29XG5bcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi9ub2RlX21vZHVsZXMvaXNvbW9ycGhpYy1naXQvaW5kZXhcIiksIHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vbm9kZV9tb2R1bGVzL2lzb21vcnBoaWMtZ2l0L2h0dHAvbm9kZS9pbmRleFwiKV0uZm9yRWFjaChcblx0KHZfcykgPT4ge1xuXHRcdGlmIChmcy5leGlzdHNTeW5jKHZfcyArIFwiLmpzXCIpICYmIGZzLmV4aXN0c1N5bmModl9zICsgXCIuY2pzXCIpKSB7XG5cdFx0XHRmcy5yZW5hbWVTeW5jKHZfcyArIFwiLmpzXCIsIHZfcyArIFwiLnRlbXBcIik7XG5cdFx0XHRmcy5yZW5hbWVTeW5jKHZfcyArIFwiLmNqc1wiLCB2X3MgKyBcIi5qc1wiKTtcblx0XHR9XG5cdH1cbik7XG5cbmltcG9ydCBpc29tb3JwaGljX2dpdCBmcm9tIFwiaXNvbW9ycGhpYy1naXRcIjtcbmltcG9ydCBodHRwIGZyb20gXCJpc29tb3JwaGljLWdpdC9odHRwL25vZGVcIjtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXG5jb25zdCBwYWNrYWdlX2pzb24gPSByZXF1aXJlKFwiLi4vcGFja2FnZS5qc29uXCIpO1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiAoKTogUHJvbWlzZTx2b2lkPiB7XG5cdC8qKiDnlKjmiLflkI0gKi9cblx0Y29uc3Qgb3duZXJfcyA9IFwibXV6emlrXCI7XG5cdC8qKiDku5PlupPot6/lvoQgKi9cblx0Y29uc3QgcmVwb19zID0gXCJNS0ZyYW1ld29ya1wiO1xuXHQvKiog5Li05pe26Lev5b6EICovXG5cdGNvbnN0IHRlbXBfcGF0aF9zID0gRWRpdG9yLlByb2plY3QudG1wRGlyO1xuXHQvKiog5o+S5Lu26Lev5b6EICovXG5cdGNvbnN0IHBsdWdpbl9wYXRoX3MgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uLy4uL1wiKTtcblx0LyoqIOi/nOeoi+i3r+W+hCAqL1xuXHRjb25zdCByZW1vdGVfdXJsX3MgPSBgaHR0cHM6Ly9naXRlZS5jb20vJHtvd25lcl9zfS8ke3JlcG9fc30uZ2l0YDtcblx0LyoqIOS4i+i9vei3r+W+hCAqL1xuXHRjb25zdCBkb3dubG9hZF9wYXRoX3MgPSBwYXRoLmpvaW4odGVtcF9wYXRoX3MsIFwibWtfZnJhbWV3b3JrXCIpO1xuXHQvKiog5qGG5p625Luj56CB6Lev5b6EICovXG5cdGNvbnN0IGZyYW1ld29ya19wYXRoX3MgPSBcImFzc2V0cy9tay1mcmFtZXdvcmtcIjtcblx0LyoqIOWuieijhei3r+W+hCAqL1xuXHRjb25zdCBpbnN0YWxsX3BhdGhfcyA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi5cIiwgZnJhbWV3b3JrX3BhdGhfcyk7XG5cdC8qKiB0cyDphY3nva4gKi9cblx0Y29uc3QgcHJvamVjdF90c2NvbmZpZyA9IGNqc29uLmxvYWQocGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwidHNjb25maWcuanNvblwiKSk7XG5cdC8qKiDljIXphY3nva4gKi9cblx0Y29uc3QgcHJvamVjdF9wYWNrYWdlID0gY2pzb24ubG9hZChwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJwYWNrYWdlLmpzb25cIikpO1xuXHQvKiog5a6J6KOF54mI5pysICovXG5cdGxldCB2ZXJzaW9uX3M6IHN0cmluZztcblxuXHRQcm9taXNlLnJlc29sdmUoKVxuXHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKFwi5a6J5YWo5qOA5p+lXCIpO1xuXG5cdFx0XHQvLyDopobnm5blronoo4Xnoa7orqRcblx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi5cIiwgZnJhbWV3b3JrX3BhdGhfcywgXCJAZnJhbWV3b3JrXCIpKSkge1xuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuRGlhbG9nLmluZm8oRWRpdG9yLkkxOG4udChcIm1rLWZyYW1ld29yay5jb25maXJtX2luc3RhbGxcIiksIHtcblx0XHRcdFx0XHRidXR0b25zOiBbRWRpdG9yLkkxOG4udChcIm1rLWZyYW1ld29yay5jb25maXJtXCIpLCBFZGl0b3IuSTE4bi50KFwibWstZnJhbWV3b3JrLmNhbmNlbFwiKV0sXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmIChyZXN1bHQucmVzcG9uc2UgIT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoXCLlj5bmtojlronoo4VcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmcy5lbXB0eURpclN5bmMoaW5zdGFsbF9wYXRoX3MpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCLojrflj5bniYjmnKxcIik7XG5cdFx0XHQvLyBjb25zdCByZW1vdGVfdXJsX3MgPSBgaHR0cHM6Ly9naXRlZS5jb20vJHtvd25lcl9zfS8ke3JlcG9fc30vdGFnc2A7XG5cdFx0XHQvLyBjb25zdCBodG1sX3MgPSAoYXdhaXQgYXhpb3MuZ2V0KHJlbW90ZV91cmxfcykpLmRhdGEgYXMgc3RyaW5nO1xuXHRcdFx0Ly8gY29uc3QgdGFnX3NzID0gaHRtbF9zLm1hdGNoKC8oPzw9KGRhdGEtcmVmPVwiKSkoW15cIl0qKSg/PVwiKS9nKSBhcyBzdHJpbmdbXTtcblxuXHRcdFx0Ly8gdGFnX3NzLnNvcnQoKHZhX3MsIHZiX3MpID0+IHtcblx0XHRcdC8vIFx0Y29uc3QgdmFfdmVyc2lvbl9uID0gdmFfc1swXSA9PT0gXCJ2XCIgPyAtTnVtYmVyKHZhX3Muc2xpY2UoMSkucmVwbGFjZSgvXFwuL2csIFwiXCIpKSA6IDk5OTtcblx0XHRcdC8vIFx0Y29uc3QgdmJfdmVyc2lvbl9uID0gdmJfc1swXSA9PT0gXCJ2XCIgPyAtTnVtYmVyKHZiX3Muc2xpY2UoMSkucmVwbGFjZSgvXFwuL2csIFwiXCIpKSA6IDk5OTtcblxuXHRcdFx0Ly8gXHRyZXR1cm4gdmFfdmVyc2lvbl9uIC0gdmJfdmVyc2lvbl9uO1xuXHRcdFx0Ly8gfSk7XG5cblx0XHRcdC8vIHZlcnNpb25fcyA9IHRhZ19zc1swXTtcblx0XHRcdHZlcnNpb25fcyA9IFwiZGV2XCI7XG5cdFx0fSlcblx0XHQudGhlbihhc3luYyAoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhg5LiL6L295qGG5p62KCR7dmVyc2lvbl9zfSlgKTtcblx0XHRcdC8vIGlmICh0cnVlKSB7XG5cdFx0XHQvLyBcdHJldHVybjtcblx0XHRcdC8vIH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZnMucmVtb3ZlU3luYyhkb3dubG9hZF9wYXRoX3MpO1xuXHRcdFx0XHRmcy5lbXB0eURpclN5bmMoZG93bmxvYWRfcGF0aF9zKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcblx0XHRcdFx0cmV0dXJuIGVycm9yO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCBpc29tb3JwaGljX2dpdC5jbG9uZSh7XG5cdFx0XHRcdGZzOiBmcyxcblx0XHRcdFx0aHR0cCxcblx0XHRcdFx0ZGlyOiBkb3dubG9hZF9wYXRoX3MsXG5cdFx0XHRcdHVybDogcmVtb3RlX3VybF9zLFxuXHRcdFx0XHRkZXB0aDogMSxcblx0XHRcdFx0cmVmOiB2ZXJzaW9uX3MsXG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdC8vIDMuOC4wIOWPiuS7peS4iuWIoOmZpCB1c2VyRGF0YS5idW5kbGVDb25maWdJRFxuXHRcdC50aGVuKCgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKGAzLjguMCDlj4rku6XkuIrliKDpmaQgdXNlckRhdGEuYnVuZGxlQ29uZmlnSURgKTtcblx0XHRcdGlmICghcHJvamVjdF9wYWNrYWdlLmNyZWF0b3I/LnZlcnNpb24gfHwgTnVtYmVyKHByb2plY3RfcGFja2FnZS5jcmVhdG9yLnZlcnNpb24ucmVwbGFjZSgvXFwuL2csIFwiXCIpKSA8IDM4MCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGZpbGVfc3MgPSBbXG5cdFx0XHRcdGBleHRlbnNpb25zLyR7cGFja2FnZV9qc29uLm5hbWV9LyR7ZnJhbWV3b3JrX3BhdGhfc30vQGNvbmZpZy5tZXRhYCxcblx0XHRcdFx0YGV4dGVuc2lvbnMvJHtwYWNrYWdlX2pzb24ubmFtZX0vJHtmcmFtZXdvcmtfcGF0aF9zfS9AZnJhbWV3b3JrLm1ldGFgLFxuXHRcdFx0XTtcblxuXHRcdFx0ZmlsZV9zcy5mb3JFYWNoKCh2X3MpID0+IHtcblx0XHRcdFx0Y29uc3QgZGF0YSA9IGZzLnJlYWRKU09OU3luYyhwYXRoLmpvaW4oZG93bmxvYWRfcGF0aF9zLCB2X3MpKTtcblxuXHRcdFx0XHRkZWxldGUgZGF0YS51c2VyRGF0YS5idW5kbGVDb25maWdJRDtcblx0XHRcdFx0ZnMud3JpdGVKU09OU3luYyhwYXRoLmpvaW4oZG93bmxvYWRfcGF0aF9zLCB2X3MpLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH0pXG5cdFx0Ly8g5rOo5YWl5qGG5p62XG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coYOazqOWFpeahhuaetmApO1xuXHRcdFx0Ly8g5ou36LSd5qGG5p625paH5Lu2XG5cdFx0XHR7XG5cdFx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihkb3dubG9hZF9wYXRoX3MsIGBleHRlbnNpb25zLyR7cGFja2FnZV9qc29uLm5hbWV9L2Fzc2V0c2ApLCBwYXRoLmpvaW4oaW5zdGFsbF9wYXRoX3MsIFwiLi5cIikpO1xuXG5cdFx0XHRcdEVkaXRvci5NZXNzYWdlLnNlbmQoXCJhc3NldC1kYlwiLCBcInJlZnJlc2gtYXNzZXRcIiwgXCJkYjovL21rLWZyYW1ld29ya1wiKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8g5re75Yqg6ISa5pys5qih5p2/XG5cdFx0XHR7XG5cdFx0XHRcdC8qKiDohJrmnKzmqKHmnb/mlofku7bot6/lvoQgKi9cblx0XHRcdFx0Y29uc3Qgc2NyaXB0X3RlbXBsYXRlX3BhdGggPSBwYXRoLmpvaW4oZG93bmxvYWRfcGF0aF9zLCBcIi5jcmVhdG9yL2Fzc2V0LXRlbXBsYXRlL3R5cGVzY3JpcHRcIik7XG5cblx0XHRcdFx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKHNjcmlwdF90ZW1wbGF0ZV9wYXRoKSkge1xuXHRcdFx0XHRcdGNvbnN0IGZpbGVfc3MgPSBhd2FpdCBnbG9iKHNjcmlwdF90ZW1wbGF0ZV9wYXRoLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpICsgXCIvKi50c1wiKTtcblxuXHRcdFx0XHRcdGZpbGVfc3MuZm9yRWFjaCgodl9zKSA9PiB7XG5cdFx0XHRcdFx0XHRmcy5jb3B5U3luYyh2X3MsIHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcIi5jcmVhdG9yL2Fzc2V0LXRlbXBsYXRlL3R5cGVzY3JpcHRcIiwgcGF0aC5iYXNlbmFtZSh2X3MpKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXHRcdC8vIOazqOWFpeWjsOaYjuaWh+S7tlxuXHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKGDms6jlhaXlo7DmmI7mlofku7ZgKTtcblx0XHRcdC8qKiDmoYbmnrblo7DmmI7mlofku7YgKi9cblx0XHRcdGNvbnN0IGZyYW1ld29ya190c2NvbmZpZyA9IGNqc29uLmxvYWQocGF0aC5qb2luKGRvd25sb2FkX3BhdGhfcywgXCJ0c2NvbmZpZy5qc29uXCIpKTtcblx0XHRcdC8qKiDlo7DmmI7mlofku7bot6/lvoQgKi9cblx0XHRcdGNvbnN0IGRlY2xhcmVfcGF0aF9zID0gYC4vZXh0ZW5zaW9ucy8ke3BhY2thZ2VfanNvbi5uYW1lfS9AdHlwZXMvbWstZnJhbWV3b3JrL2A7XG5cdFx0XHQvKiog5L+u5pS5IHRzY29uZmlnICovXG5cdFx0XHRsZXQgbW9kaWZ5X3RzY29uZmlnX2IgPSBmYWxzZTtcblxuXHRcdFx0Ly8g5ou36LSdIGQudHNcblx0XHRcdGZzLmNvcHlTeW5jKHBhdGguam9pbihkb3dubG9hZF9wYXRoX3MsIGRlY2xhcmVfcGF0aF9zKSwgcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIGRlY2xhcmVfcGF0aF9zKSk7XG5cblx0XHRcdC8vIOa3u+WKoOahhuaetuexu+Wei+WjsOaYjuaWh+S7tlxuXHRcdFx0aWYgKGZyYW1ld29ya190c2NvbmZpZy50eXBlcz8ubGVuZ3RoKSB7XG5cdFx0XHRcdG1vZGlmeV90c2NvbmZpZ19iID0gdHJ1ZTtcblx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLnR5cGVzKSB7XG5cdFx0XHRcdFx0cHJvamVjdF90c2NvbmZpZy50eXBlcyA9IFsuLi5mcmFtZXdvcmtfdHNjb25maWcudHlwZXNdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZvciAoY29uc3Qgdl9zIG9mIGZyYW1ld29ya190c2NvbmZpZy50eXBlcykge1xuXHRcdFx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLnR5cGVzLmluY2x1ZGVzKHZfcykpIHtcblx0XHRcdFx0XHRcdFx0cHJvamVjdF90c2NvbmZpZy50eXBlcy5wdXNoKHZfcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIOa3u+WKoCB0c2NvbmZpZyDot6/lvoTphY3nva5cblx0XHRcdGlmIChmcmFtZXdvcmtfdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG5cdFx0XHRcdG1vZGlmeV90c2NvbmZpZ19iID0gdHJ1ZTtcblx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucykge1xuXHRcdFx0XHRcdHByb2plY3RfdHNjb25maWcuY29tcGlsZXJPcHRpb25zID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXByb2plY3RfdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG5cdFx0XHRcdFx0cHJvamVjdF90c2NvbmZpZy5jb21waWxlck9wdGlvbnMucGF0aHMgPSB7fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAoY29uc3Qga19zIGluIGZyYW1ld29ya190c2NvbmZpZy5jb21waWxlck9wdGlvbnMucGF0aHMpIHtcblx0XHRcdFx0XHRwcm9qZWN0X3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRoc1trX3NdID0gZnJhbWV3b3JrX3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRoc1trX3NdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtb2RpZnlfdHNjb25maWdfYikge1xuXHRcdFx0XHRmcy53cml0ZUZpbGVTeW5jKFxuXHRcdFx0XHRcdHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInRzY29uZmlnLmpzb25cIiksXG5cdFx0XHRcdFx0YXdhaXQgcHJldHRpZXIuZm9ybWF0KEpTT04uc3RyaW5naWZ5KHByb2plY3RfdHNjb25maWcpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Ly8g5re75Yqg5a+85YWl5pig5bCEXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coYOa3u+WKoOWvvOWFpeaYoOWwhGApO1xuXHRcdFx0Y29uc3Qgc2V0dGluZ19wYXRoX3MgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJzZXR0aW5ncy92Mi9wYWNrYWdlcy9wcm9qZWN0Lmpzb25cIik7XG5cdFx0XHRjb25zdCBzZXR0aW5nX2NvbmZpZ190YWIgPSAhZnMuZXhpc3RzU3luYyhzZXR0aW5nX3BhdGhfcykgPyB7fSA6IGZzLnJlYWRKU09OU3luYyhzZXR0aW5nX3BhdGhfcyk7XG5cdFx0XHRjb25zdCBta19pbXBvcnRfbWFwX3RhYiA9IGZzLnJlYWRKU09OU3luYyhwYXRoLmpvaW4oZG93bmxvYWRfcGF0aF9zLCBcImltcG9ydC1tYXAuanNvblwiKSk7XG5cblx0XHRcdC8vIOmYsuatoiBzY3JpcHQg5LiN5a2Y5ZyoXG5cdFx0XHRpZiAoIXNldHRpbmdfY29uZmlnX3RhYi5zY3JpcHQpIHtcblx0XHRcdFx0c2V0dGluZ19jb25maWdfdGFiLnNjcmlwdCA9IHt9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiog5a+85YWl5pig5bCE6Lev5b6EICovXG5cdFx0XHRsZXQgaW1wb3J0X21hcF9wYXRoX3MgPSAoKHNldHRpbmdfY29uZmlnX3RhYi5zY3JpcHQuaW1wb3J0TWFwID8/IFwiXCIpIGFzIHN0cmluZykucmVwbGFjZShcInByb2plY3Q6L1wiLCBFZGl0b3IuUHJvamVjdC5wYXRoKTtcblxuXHRcdFx0Ly8g5bey5a2Y5Zyo5a+85YWl5pig5bCEXG5cdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhpbXBvcnRfbWFwX3BhdGhfcykgJiYgZnMuc3RhdFN5bmMoaW1wb3J0X21hcF9wYXRoX3MpLmlzRmlsZSgpKSB7XG5cdFx0XHRcdGNvbnN0IGltcG9ydF9tYXBfdGFiID0gZnMucmVhZEpTT05TeW5jKGltcG9ydF9tYXBfcGF0aF9zKTtcblxuXHRcdFx0XHQvLyDmm7TmlrDlr7zlhaXmmKDlsIRcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihpbXBvcnRfbWFwX3RhYi5pbXBvcnRzLCBta19pbXBvcnRfbWFwX3RhYi5pbXBvcnRzKTtcblxuXHRcdFx0XHQvLyDlhpnlhaXlr7zlhaXmmKDlsIRcblx0XHRcdFx0ZnMud3JpdGVGaWxlU3luYyhcblx0XHRcdFx0XHRpbXBvcnRfbWFwX3BhdGhfcyxcblx0XHRcdFx0XHRhd2FpdCBwcmV0dGllci5mb3JtYXQoSlNPTi5zdHJpbmdpZnkoaW1wb3J0X21hcF90YWIpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8g5LiN5a2Y5Zyo5paw5bu65a+85YWl5pig5bCEXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0aW1wb3J0X21hcF9wYXRoX3MgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJpbXBvcnQtbWFwLmpzb25cIik7XG5cblx0XHRcdFx0Ly8g5YaZ5YWl5a+85YWl5pig5bCEXG5cdFx0XHRcdGZzLndyaXRlRmlsZVN5bmMoXG5cdFx0XHRcdFx0aW1wb3J0X21hcF9wYXRoX3MsXG5cdFx0XHRcdFx0YXdhaXQgcHJldHRpZXIuZm9ybWF0KEpTT04uc3RyaW5naWZ5KG1rX2ltcG9ydF9tYXBfdGFiKSwge1xuXHRcdFx0XHRcdFx0ZmlsZXBhdGg6IFwiKi5qc29uXCIsXG5cdFx0XHRcdFx0XHR0YWJXaWR0aDogNCxcblx0XHRcdFx0XHRcdHVzZVRhYnM6IHRydWUsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0KTtcblxuXHRcdFx0XHQvLyDmm7TmlrDpobnnm67orr7nva5cblx0XHRcdFx0c2V0dGluZ19jb25maWdfdGFiLnNjcmlwdC5pbXBvcnRNYXAgPSBpbXBvcnRfbWFwX3BhdGhfcy5yZXBsYWNlKEVkaXRvci5Qcm9qZWN0LnBhdGggKyBcIlxcXFxcIiwgXCJwcm9qZWN0Oi8vXCIpLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuXG5cdFx0XHRcdC8vIOWGmeWFpemhueebruiuvue9rlxuXHRcdFx0XHRmcy5lbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShzZXR0aW5nX3BhdGhfcykpO1xuXHRcdFx0XHRmcy53cml0ZUZpbGVTeW5jKFxuXHRcdFx0XHRcdHNldHRpbmdfcGF0aF9zLFxuXHRcdFx0XHRcdGF3YWl0IHByZXR0aWVyLmZvcm1hdChKU09OLnN0cmluZ2lmeShzZXR0aW5nX2NvbmZpZ190YWIpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Ly8g5bGP6JS9IHZzY29kZSDmoYbmnrbmlofku7bmj5DnpLpcblx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhg5bGP6JS9IHZzY29kZSDmoYbmnrbmlofku7bmj5DnpLpgKTtcblx0XHRcdGNvbnN0IHZzY29kZV9zZXR0aW5nX3BhdGhfcyA9IHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcIi52c2NvZGUvc2V0dGluZ3MuanNvblwiKTtcblx0XHRcdGxldCBzZXR0aW5nc19qc29uOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG5cblx0XHRcdC8vIOmhueebriB2c2NvZGUgc2V0dGluZ3Mg5paH5Lu25LiN5a2Y5Zyo5YiZ5Yib5bu6XG5cdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmModnNjb2RlX3NldHRpbmdfcGF0aF9zKSkge1xuXHRcdFx0XHRmcy5ta2RpclN5bmMocGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiLnZzY29kZVwiKSk7XG5cdFx0XHR9XG5cdFx0XHQvLyDlrZjlnKjliJnor7vlj5Zcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzZXR0aW5nc19qc29uID0gY2pzb24ubG9hZCh2c2NvZGVfc2V0dGluZ19wYXRoX3MpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZXR0aW5nc19qc29uW1widHlwZXNjcmlwdC5wcmVmZXJlbmNlcy5hdXRvSW1wb3J0RmlsZUV4Y2x1ZGVQYXR0ZXJuc1wiXSA9IFtcblx0XHRcdFx0YC4vZXh0ZW5zaW9ucy8ke3BhY2thZ2VfanNvbi5uYW1lfS8ke2ZyYW1ld29ya19wYXRoX3N9L0BmcmFtZXdvcmsvKipgLFxuXHRcdFx0XTtcblxuXHRcdFx0ZnMud3JpdGVKU09OU3luYyh2c2NvZGVfc2V0dGluZ19wYXRoX3MsIHNldHRpbmdzX2pzb24pO1xuXHRcdH0pXG5cdFx0Ly8g5riF55CG5Li05pe25paH5Lu2XG5cdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCLmuIXnkIbkuLTml7bmlofku7ZcIik7XG5cdFx0XHRmcy5yZW1vdmUoZG93bmxvYWRfcGF0aF9zKTtcblx0XHR9KVxuXHRcdC5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdGlmICghZXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHR9KTtcbn1cbiJdfQ==