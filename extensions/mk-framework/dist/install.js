"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cjson_1 = __importDefault(require("cjson"));
const prettier_1 = __importDefault(require("prettier"));
const axios_1 = __importDefault(require("axios"));
const fast_glob_1 = __importDefault(require("fast-glob"));
// 修改模块让其正常加载
[
    path_1.default.join(__dirname, "../node_modules/isomorphic-git/index"),
    path_1.default.join(__dirname, "../node_modules/isomorphic-git/http/node/index"),
].forEach((v_s) => {
    if (fs_extra_1.default.existsSync(v_s + ".js") && fs_extra_1.default.existsSync(v_s + ".cjs")) {
        fs_extra_1.default.renameSync(v_s + ".js", v_s + ".temp");
        fs_extra_1.default.renameSync(v_s + ".cjs", v_s + ".js");
    }
});
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
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
                buttons: [
                    Editor.I18n.t("mk-framework.confirm"),
                    Editor.I18n.t("mk-framework.cancel"),
                ],
            });
            if (result.response !== 0) {
                return Promise.reject("取消安装");
            }
            fs_extra_1.default.emptyDirSync(install_path_s);
        }
    })
        .then(async () => {
        console.log("获取版本");
        const remote_url_s = `https://gitee.com/${owner_s}/${repo_s}/tags`;
        const html_s = (await axios_1.default.get(remote_url_s)).data;
        const tag_ss = html_s.match(/(?<=(data-ref="))([^"]*)(?=")/g);
        tag_ss.sort((va_s, vb_s) => {
            const va_version_n = va_s[0] === "v" ? -Number(va_s.slice(1).replace(/\./g, "")) : 999;
            const vb_version_n = vb_s[0] === "v" ? -Number(vb_s.slice(1).replace(/\./g, "")) : 999;
            return va_version_n - vb_version_n;
        });
        // version_s = tag_ss[0];
        version_s = "plugin";
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
        if (!((_a = project_package.creator) === null || _a === void 0 ? void 0 : _a.version) ||
            Number(project_package.creator.version.replace(/\./g, "")) < 380) {
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
            let script_template_path = path_1.default.join(download_path_s, ".creator/asset-template/typescript");
            if (fs_extra_1.default.pathExistsSync(script_template_path)) {
                let file_ss = await (0, fast_glob_1.default)(script_template_path.replace(/\\/g, "/") + "/*.ts");
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
                for (let v_s of framework_tsconfig.types) {
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
            for (let k_s in framework_tsconfig.compilerOptions.paths) {
                project_tsconfig.compilerOptions.paths[k_s] =
                    framework_tsconfig.compilerOptions.paths[k_s];
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
        const setting_config_tab = !fs_extra_1.default.existsSync(setting_path_s)
            ? {}
            : fs_extra_1.default.readJSONSync(setting_path_s);
        const mk_import_map_tab = fs_extra_1.default.readJSONSync(path_1.default.join(download_path_s, "import-map.json"));
        // 防止 script 不存在
        if (!setting_config_tab.script) {
            setting_config_tab.script = {};
        }
        /** 导入映射路径 */
        let import_map_path_s = ((_a = setting_config_tab.script.importMap) !== null && _a !== void 0 ? _a : "").replace("project:/", Editor.Project.path);
        // 已存在导入映射
        if (fs_extra_1.default.existsSync(import_map_path_s) &&
            fs_extra_1.default.statSync(import_map_path_s).isFile()) {
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
            setting_config_tab.script.importMap = import_map_path_s
                .replace(Editor.Project.path + "\\", "project://")
                .replace(/\\/g, "/");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9pbnN0YWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsd0RBQTBCO0FBQzFCLGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsd0RBQWdDO0FBQ2hDLGtEQUEwQjtBQUMxQiwwREFBNkI7QUFFN0IsYUFBYTtBQUNiO0lBQ0MsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsc0NBQXNDLENBQUM7SUFDNUQsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsZ0RBQWdELENBQUM7Q0FDdEUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNqQixJQUFJLGtCQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEVBQUU7UUFDOUQsa0JBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDMUMsa0JBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDekM7QUFDRixDQUFDLENBQUMsQ0FBQztBQUVILG9FQUE0QztBQUM1QyxvRUFBNEM7QUFDNUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFFakMsS0FBSztJQUNuQixVQUFVO0lBQ1YsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDO0lBQ3pCLFdBQVc7SUFDWCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUM7SUFDN0IsV0FBVztJQUNYLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQzFDLFdBQVc7SUFDWCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFB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LENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQXBVRCw0QkFvVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSBcImZzLWV4dHJhXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGNqc29uIGZyb20gXCJjanNvblwiO1xuaW1wb3J0IHByZXR0aWVyIGZyb20gXCJwcmV0dGllclwiO1xuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xuaW1wb3J0IGdsb2IgZnJvbSBcImZhc3QtZ2xvYlwiO1xuXG4vLyDkv67mlLnmqKHlnZforqnlhbbmraPluLjliqDovb1cbltcblx0cGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi9ub2RlX21vZHVsZXMvaXNvbW9ycGhpYy1naXQvaW5kZXhcIiksXG5cdHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vbm9kZV9tb2R1bGVzL2lzb21vcnBoaWMtZ2l0L2h0dHAvbm9kZS9pbmRleFwiKSxcbl0uZm9yRWFjaCgodl9zKSA9PiB7XG5cdGlmIChmcy5leGlzdHNTeW5jKHZfcyArIFwiLmpzXCIpICYmIGZzLmV4aXN0c1N5bmModl9zICsgXCIuY2pzXCIpKSB7XG5cdFx0ZnMucmVuYW1lU3luYyh2X3MgKyBcIi5qc1wiLCB2X3MgKyBcIi50ZW1wXCIpO1xuXHRcdGZzLnJlbmFtZVN5bmModl9zICsgXCIuY2pzXCIsIHZfcyArIFwiLmpzXCIpO1xuXHR9XG59KTtcblxuaW1wb3J0IGlzb21vcnBoaWNfZ2l0IGZyb20gXCJpc29tb3JwaGljLWdpdFwiO1xuaW1wb3J0IGh0dHAgZnJvbSBcImlzb21vcnBoaWMtZ2l0L2h0dHAvbm9kZVwiO1xuY29uc3QgcGFja2FnZV9qc29uID0gcmVxdWlyZShcIi4uL3BhY2thZ2UuanNvblwiKTtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gKCk6IFByb21pc2U8dm9pZD4ge1xuXHQvKiog55So5oi35ZCNICovXG5cdGNvbnN0IG93bmVyX3MgPSBcIm11enppa1wiO1xuXHQvKiog5LuT5bqT6Lev5b6EICovXG5cdGNvbnN0IHJlcG9fcyA9IFwiTUtGcmFtZXdvcmtcIjtcblx0LyoqIOS4tOaXtui3r+W+hCAqL1xuXHRjb25zdCB0ZW1wX3BhdGhfcyA9IEVkaXRvci5Qcm9qZWN0LnRtcERpcjtcblx0LyoqIOaPkuS7tui3r+W+hCAqL1xuXHRjb25zdCBwbHVnaW5fcGF0aF9zID0gcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9cIik7XG5cdC8qKiDov5znqIvot6/lvoQgKi9cblx0Y29uc3QgcmVtb3RlX3VybF9zID0gYGh0dHBzOi8vZ2l0ZWUuY29tLyR7b3duZXJfc30vJHtyZXBvX3N9LmdpdGA7XG5cdC8qKiDkuIvovb3ot6/lvoQgKi9cblx0Y29uc3QgZG93bmxvYWRfcGF0aF9zID0gcGF0aC5qb2luKHRlbXBfcGF0aF9zLCBcIm1rX2ZyYW1ld29ya1wiKTtcblx0LyoqIOahhuaetuS7o+eggei3r+W+hCAqL1xuXHRjb25zdCBmcmFtZXdvcmtfcGF0aF9zID0gXCJhc3NldHMvbWstZnJhbWV3b3JrXCI7XG5cdC8qKiDlronoo4Xot6/lvoQgKi9cblx0Y29uc3QgaW5zdGFsbF9wYXRoX3MgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uXCIsIGZyYW1ld29ya19wYXRoX3MpO1xuXHQvKiogdHMg6YWN572uICovXG5cdGNvbnN0IHByb2plY3RfdHNjb25maWcgPSBjanNvbi5sb2FkKFxuXHRcdHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInRzY29uZmlnLmpzb25cIilcblx0KTtcblx0LyoqIOWMhemFjee9riAqL1xuXHRjb25zdCBwcm9qZWN0X3BhY2thZ2UgPSBjanNvbi5sb2FkKFxuXHRcdHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInBhY2thZ2UuanNvblwiKVxuXHQpO1xuXHQvKiog5a6J6KOF54mI5pysICovXG5cdGxldCB2ZXJzaW9uX3M6IHN0cmluZztcblxuXHRQcm9taXNlLnJlc29sdmUoKVxuXHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKFwi5a6J5YWo5qOA5p+lXCIpO1xuXG5cdFx0XHQvLyDopobnm5blronoo4Xnoa7orqRcblx0XHRcdGlmIChcblx0XHRcdFx0ZnMuZXhpc3RzU3luYyhcblx0XHRcdFx0XHRwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uXCIsIGZyYW1ld29ya19wYXRoX3MsIFwiQGZyYW1ld29ya1wiKVxuXHRcdFx0XHQpXG5cdFx0XHQpIHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgRWRpdG9yLkRpYWxvZy5pbmZvKFxuXHRcdFx0XHRcdEVkaXRvci5JMThuLnQoXCJtay1mcmFtZXdvcmsuY29uZmlybV9pbnN0YWxsXCIpLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGJ1dHRvbnM6IFtcblx0XHRcdFx0XHRcdFx0RWRpdG9yLkkxOG4udChcIm1rLWZyYW1ld29yay5jb25maXJtXCIpLFxuXHRcdFx0XHRcdFx0XHRFZGl0b3IuSTE4bi50KFwibWstZnJhbWV3b3JrLmNhbmNlbFwiKSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdGlmIChyZXN1bHQucmVzcG9uc2UgIT09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoXCLlj5bmtojlronoo4VcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmcy5lbXB0eURpclN5bmMoaW5zdGFsbF9wYXRoX3MpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCLojrflj5bniYjmnKxcIik7XG5cdFx0XHRjb25zdCByZW1vdGVfdXJsX3MgPSBgaHR0cHM6Ly9naXRlZS5jb20vJHtvd25lcl9zfS8ke3JlcG9fc30vdGFnc2A7XG5cdFx0XHRjb25zdCBodG1sX3MgPSAoYXdhaXQgYXhpb3MuZ2V0KHJlbW90ZV91cmxfcykpLmRhdGEgYXMgc3RyaW5nO1xuXHRcdFx0Y29uc3QgdGFnX3NzID0gaHRtbF9zLm1hdGNoKC8oPzw9KGRhdGEtcmVmPVwiKSkoW15cIl0qKSg/PVwiKS9nKSBhcyBzdHJpbmdbXTtcblxuXHRcdFx0dGFnX3NzLnNvcnQoKHZhX3MsIHZiX3MpID0+IHtcblx0XHRcdFx0Y29uc3QgdmFfdmVyc2lvbl9uID1cblx0XHRcdFx0XHR2YV9zWzBdID09PSBcInZcIiA/IC1OdW1iZXIodmFfcy5zbGljZSgxKS5yZXBsYWNlKC9cXC4vZywgXCJcIikpIDogOTk5O1xuXHRcdFx0XHRjb25zdCB2Yl92ZXJzaW9uX24gPVxuXHRcdFx0XHRcdHZiX3NbMF0gPT09IFwidlwiID8gLU51bWJlcih2Yl9zLnNsaWNlKDEpLnJlcGxhY2UoL1xcLi9nLCBcIlwiKSkgOiA5OTk7XG5cblx0XHRcdFx0cmV0dXJuIHZhX3ZlcnNpb25fbiAtIHZiX3ZlcnNpb25fbjtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyB2ZXJzaW9uX3MgPSB0YWdfc3NbMF07XG5cdFx0XHR2ZXJzaW9uX3MgPSBcInBsdWdpblwiO1xuXHRcdH0pXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coYOS4i+i9veahhuaetigke3ZlcnNpb25fc30pYCk7XG5cdFx0XHQvLyBpZiAodHJ1ZSkge1xuXHRcdFx0Ly8gXHRyZXR1cm47XG5cdFx0XHQvLyB9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGZzLnJlbW92ZVN5bmMoZG93bmxvYWRfcGF0aF9zKTtcblx0XHRcdFx0ZnMuZW1wdHlEaXJTeW5jKGRvd25sb2FkX3BhdGhfcyk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcjogYW55KSB7XG5cdFx0XHRcdHJldHVybiBlcnJvcjtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgaXNvbW9ycGhpY19naXQuY2xvbmUoe1xuXHRcdFx0XHRmczogZnMsXG5cdFx0XHRcdGh0dHAsXG5cdFx0XHRcdGRpcjogZG93bmxvYWRfcGF0aF9zLFxuXHRcdFx0XHR1cmw6IHJlbW90ZV91cmxfcyxcblx0XHRcdFx0ZGVwdGg6IDEsXG5cdFx0XHRcdHJlZjogdmVyc2lvbl9zLFxuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQvLyAzLjguMCDlj4rku6XkuIrliKDpmaQgdXNlckRhdGEuYnVuZGxlQ29uZmlnSURcblx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhgMy44LjAg5Y+K5Lul5LiK5Yig6ZmkIHVzZXJEYXRhLmJ1bmRsZUNvbmZpZ0lEYCk7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCFwcm9qZWN0X3BhY2thZ2UuY3JlYXRvcj8udmVyc2lvbiB8fFxuXHRcdFx0XHROdW1iZXIocHJvamVjdF9wYWNrYWdlLmNyZWF0b3IudmVyc2lvbi5yZXBsYWNlKC9cXC4vZywgXCJcIikpIDwgMzgwXG5cdFx0XHQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBmaWxlX3NzID0gW1xuXHRcdFx0XHRgZXh0ZW5zaW9ucy8ke3BhY2thZ2VfanNvbi5uYW1lfS8ke2ZyYW1ld29ya19wYXRoX3N9L0Bjb25maWcubWV0YWAsXG5cdFx0XHRcdGBleHRlbnNpb25zLyR7cGFja2FnZV9qc29uLm5hbWV9LyR7ZnJhbWV3b3JrX3BhdGhfc30vQGZyYW1ld29yay5tZXRhYCxcblx0XHRcdF07XG5cblx0XHRcdGZpbGVfc3MuZm9yRWFjaCgodl9zKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRhdGEgPSBmcy5yZWFkSlNPTlN5bmMocGF0aC5qb2luKGRvd25sb2FkX3BhdGhfcywgdl9zKSk7XG5cblx0XHRcdFx0ZGVsZXRlIGRhdGEudXNlckRhdGEuYnVuZGxlQ29uZmlnSUQ7XG5cdFx0XHRcdGZzLndyaXRlSlNPTlN5bmMocGF0aC5qb2luKGRvd25sb2FkX3BhdGhfcywgdl9zKSwgZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdC8vIOazqOWFpeahhuaetlxuXHRcdC50aGVuKGFzeW5jICgpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKGDms6jlhaXmoYbmnrZgKTtcblx0XHRcdC8vIOaLt+i0neahhuaetuaWh+S7tlxuXHRcdFx0e1xuXHRcdFx0XHRmcy5jb3B5U3luYyhcblx0XHRcdFx0XHRwYXRoLmpvaW4oZG93bmxvYWRfcGF0aF9zLCBgZXh0ZW5zaW9ucy8ke3BhY2thZ2VfanNvbi5uYW1lfS9hc3NldHNgKSxcblx0XHRcdFx0XHRwYXRoLmpvaW4oaW5zdGFsbF9wYXRoX3MsIFwiLi5cIilcblx0XHRcdFx0KTtcblx0XHRcdFx0RWRpdG9yLk1lc3NhZ2Uuc2VuZChcImFzc2V0LWRiXCIsIFwicmVmcmVzaC1hc3NldFwiLCBcImRiOi8vbWstZnJhbWV3b3JrXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyDmt7vliqDohJrmnKzmqKHmnb9cblx0XHRcdHtcblx0XHRcdFx0LyoqIOiEmuacrOaooeadv+aWh+S7tui3r+W+hCAqL1xuXHRcdFx0XHRsZXQgc2NyaXB0X3RlbXBsYXRlX3BhdGggPSBwYXRoLmpvaW4oXG5cdFx0XHRcdFx0ZG93bmxvYWRfcGF0aF9zLFxuXHRcdFx0XHRcdFwiLmNyZWF0b3IvYXNzZXQtdGVtcGxhdGUvdHlwZXNjcmlwdFwiXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKGZzLnBhdGhFeGlzdHNTeW5jKHNjcmlwdF90ZW1wbGF0ZV9wYXRoKSkge1xuXHRcdFx0XHRcdGxldCBmaWxlX3NzID0gYXdhaXQgZ2xvYihcblx0XHRcdFx0XHRcdHNjcmlwdF90ZW1wbGF0ZV9wYXRoLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpICsgXCIvKi50c1wiXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGZpbGVfc3MuZm9yRWFjaCgodl9zKSA9PiB7XG5cdFx0XHRcdFx0XHRmcy5jb3B5U3luYyhcblx0XHRcdFx0XHRcdFx0dl9zLFxuXHRcdFx0XHRcdFx0XHRwYXRoLmpvaW4oXG5cdFx0XHRcdFx0XHRcdFx0RWRpdG9yLlByb2plY3QucGF0aCxcblx0XHRcdFx0XHRcdFx0XHRcIi5jcmVhdG9yL2Fzc2V0LXRlbXBsYXRlL3R5cGVzY3JpcHRcIixcblx0XHRcdFx0XHRcdFx0XHRwYXRoLmJhc2VuYW1lKHZfcylcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Ly8g5rOo5YWl5aOw5piO5paH5Lu2XG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coYOazqOWFpeWjsOaYjuaWh+S7tmApO1xuXHRcdFx0LyoqIOahhuaetuWjsOaYjuaWh+S7tiAqL1xuXHRcdFx0Y29uc3QgZnJhbWV3b3JrX3RzY29uZmlnID0gY2pzb24ubG9hZChcblx0XHRcdFx0cGF0aC5qb2luKGRvd25sb2FkX3BhdGhfcywgXCJ0c2NvbmZpZy5qc29uXCIpXG5cdFx0XHQpO1xuXHRcdFx0LyoqIOWjsOaYjuaWh+S7tui3r+W+hCAqL1xuXHRcdFx0Y29uc3QgZGVjbGFyZV9wYXRoX3MgPSBgLi9leHRlbnNpb25zLyR7cGFja2FnZV9qc29uLm5hbWV9L0B0eXBlcy9tay1mcmFtZXdvcmsvYDtcblx0XHRcdC8qKiDkv67mlLkgdHNjb25maWcgKi9cblx0XHRcdGxldCBtb2RpZnlfdHNjb25maWdfYiA9IGZhbHNlO1xuXG5cdFx0XHQvLyDmi7fotJ0gZC50c1xuXHRcdFx0ZnMuY29weVN5bmMoXG5cdFx0XHRcdHBhdGguam9pbihkb3dubG9hZF9wYXRoX3MsIGRlY2xhcmVfcGF0aF9zKSxcblx0XHRcdFx0cGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIGRlY2xhcmVfcGF0aF9zKVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8g5re75Yqg5qGG5p6257G75Z6L5aOw5piO5paH5Lu2XG5cdFx0XHRpZiAoZnJhbWV3b3JrX3RzY29uZmlnLnR5cGVzPy5sZW5ndGgpIHtcblx0XHRcdFx0bW9kaWZ5X3RzY29uZmlnX2IgPSB0cnVlO1xuXHRcdFx0XHRpZiAoIXByb2plY3RfdHNjb25maWcudHlwZXMpIHtcblx0XHRcdFx0XHRwcm9qZWN0X3RzY29uZmlnLnR5cGVzID0gWy4uLmZyYW1ld29ya190c2NvbmZpZy50eXBlc107XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm9yIChsZXQgdl9zIG9mIGZyYW1ld29ya190c2NvbmZpZy50eXBlcykge1xuXHRcdFx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLnR5cGVzLmluY2x1ZGVzKHZfcykpIHtcblx0XHRcdFx0XHRcdFx0cHJvamVjdF90c2NvbmZpZy50eXBlcy5wdXNoKHZfcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIOa3u+WKoCB0c2NvbmZpZyDot6/lvoTphY3nva5cblx0XHRcdGlmIChmcmFtZXdvcmtfdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG5cdFx0XHRcdG1vZGlmeV90c2NvbmZpZ19iID0gdHJ1ZTtcblx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucykge1xuXHRcdFx0XHRcdHByb2plY3RfdHNjb25maWcuY29tcGlsZXJPcHRpb25zID0ge307XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFwcm9qZWN0X3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuXHRcdFx0XHRcdHByb2plY3RfdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzID0ge307XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKGxldCBrX3MgaW4gZnJhbWV3b3JrX3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuXHRcdFx0XHRcdHByb2plY3RfdHNjb25maWcuY29tcGlsZXJPcHRpb25zLnBhdGhzW2tfc10gPVxuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrX3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRoc1trX3NdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtb2RpZnlfdHNjb25maWdfYikge1xuXHRcdFx0XHRmcy53cml0ZUZpbGVTeW5jKFxuXHRcdFx0XHRcdHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCBcInRzY29uZmlnLmpzb25cIiksXG5cdFx0XHRcdFx0YXdhaXQgcHJldHRpZXIuZm9ybWF0KEpTT04uc3RyaW5naWZ5KHByb2plY3RfdHNjb25maWcpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Ly8g5re75Yqg5a+85YWl5pig5bCEXG5cdFx0LnRoZW4oYXN5bmMgKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coYOa3u+WKoOWvvOWFpeaYoOWwhGApO1xuXHRcdFx0Y29uc3Qgc2V0dGluZ19wYXRoX3MgPSBwYXRoLmpvaW4oXG5cdFx0XHRcdEVkaXRvci5Qcm9qZWN0LnBhdGgsXG5cdFx0XHRcdFwic2V0dGluZ3MvdjIvcGFja2FnZXMvcHJvamVjdC5qc29uXCJcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBzZXR0aW5nX2NvbmZpZ190YWIgPSAhZnMuZXhpc3RzU3luYyhzZXR0aW5nX3BhdGhfcylcblx0XHRcdFx0PyB7fVxuXHRcdFx0XHQ6IGZzLnJlYWRKU09OU3luYyhzZXR0aW5nX3BhdGhfcyk7XG5cdFx0XHRjb25zdCBta19pbXBvcnRfbWFwX3RhYiA9IGZzLnJlYWRKU09OU3luYyhcblx0XHRcdFx0cGF0aC5qb2luKGRvd25sb2FkX3BhdGhfcywgXCJpbXBvcnQtbWFwLmpzb25cIilcblx0XHRcdCk7XG5cblx0XHRcdC8vIOmYsuatoiBzY3JpcHQg5LiN5a2Y5ZyoXG5cdFx0XHRpZiAoIXNldHRpbmdfY29uZmlnX3RhYi5zY3JpcHQpIHtcblx0XHRcdFx0c2V0dGluZ19jb25maWdfdGFiLnNjcmlwdCA9IHt9O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiog5a+85YWl5pig5bCE6Lev5b6EICovXG5cdFx0XHRsZXQgaW1wb3J0X21hcF9wYXRoX3MgPSAoXG5cdFx0XHRcdChzZXR0aW5nX2NvbmZpZ190YWIuc2NyaXB0LmltcG9ydE1hcCA/PyBcIlwiKSBhcyBzdHJpbmdcblx0XHRcdCkucmVwbGFjZShcInByb2plY3Q6L1wiLCBFZGl0b3IuUHJvamVjdC5wYXRoKTtcblxuXHRcdFx0Ly8g5bey5a2Y5Zyo5a+85YWl5pig5bCEXG5cdFx0XHRpZiAoXG5cdFx0XHRcdGZzLmV4aXN0c1N5bmMoaW1wb3J0X21hcF9wYXRoX3MpICYmXG5cdFx0XHRcdGZzLnN0YXRTeW5jKGltcG9ydF9tYXBfcGF0aF9zKS5pc0ZpbGUoKVxuXHRcdFx0KSB7XG5cdFx0XHRcdGNvbnN0IGltcG9ydF9tYXBfdGFiID0gZnMucmVhZEpTT05TeW5jKGltcG9ydF9tYXBfcGF0aF9zKTtcblxuXHRcdFx0XHQvLyDmm7TmlrDlr7zlhaXmmKDlsIRcblx0XHRcdFx0T2JqZWN0LmFzc2lnbihpbXBvcnRfbWFwX3RhYi5pbXBvcnRzLCBta19pbXBvcnRfbWFwX3RhYi5pbXBvcnRzKTtcblxuXHRcdFx0XHQvLyDlhpnlhaXlr7zlhaXmmKDlsIRcblx0XHRcdFx0ZnMud3JpdGVGaWxlU3luYyhcblx0XHRcdFx0XHRpbXBvcnRfbWFwX3BhdGhfcyxcblx0XHRcdFx0XHRhd2FpdCBwcmV0dGllci5mb3JtYXQoSlNPTi5zdHJpbmdpZnkoaW1wb3J0X21hcF90YWIpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8g5LiN5a2Y5Zyo5paw5bu65a+85YWl5pig5bCEXG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0aW1wb3J0X21hcF9wYXRoX3MgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCJpbXBvcnQtbWFwLmpzb25cIik7XG5cblx0XHRcdFx0Ly8g5YaZ5YWl5a+85YWl5pig5bCEXG5cdFx0XHRcdGZzLndyaXRlRmlsZVN5bmMoXG5cdFx0XHRcdFx0aW1wb3J0X21hcF9wYXRoX3MsXG5cdFx0XHRcdFx0YXdhaXQgcHJldHRpZXIuZm9ybWF0KEpTT04uc3RyaW5naWZ5KG1rX2ltcG9ydF9tYXBfdGFiKSwge1xuXHRcdFx0XHRcdFx0ZmlsZXBhdGg6IFwiKi5qc29uXCIsXG5cdFx0XHRcdFx0XHR0YWJXaWR0aDogNCxcblx0XHRcdFx0XHRcdHVzZVRhYnM6IHRydWUsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0KTtcblxuXHRcdFx0XHQvLyDmm7TmlrDpobnnm67orr7nva5cblx0XHRcdFx0c2V0dGluZ19jb25maWdfdGFiLnNjcmlwdC5pbXBvcnRNYXAgPSBpbXBvcnRfbWFwX3BhdGhfc1xuXHRcdFx0XHRcdC5yZXBsYWNlKEVkaXRvci5Qcm9qZWN0LnBhdGggKyBcIlxcXFxcIiwgXCJwcm9qZWN0Oi8vXCIpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuXG5cdFx0XHRcdC8vIOWGmeWFpemhueebruiuvue9rlxuXHRcdFx0XHRmcy5lbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShzZXR0aW5nX3BhdGhfcykpO1xuXHRcdFx0XHRmcy53cml0ZUZpbGVTeW5jKFxuXHRcdFx0XHRcdHNldHRpbmdfcGF0aF9zLFxuXHRcdFx0XHRcdGF3YWl0IHByZXR0aWVyLmZvcm1hdChKU09OLnN0cmluZ2lmeShzZXR0aW5nX2NvbmZpZ190YWIpLCB7XG5cdFx0XHRcdFx0XHRmaWxlcGF0aDogXCIqLmpzb25cIixcblx0XHRcdFx0XHRcdHRhYldpZHRoOiA0LFxuXHRcdFx0XHRcdFx0dXNlVGFiczogdHJ1ZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Ly8g5bGP6JS9IHZzY29kZSDmoYbmnrbmlofku7bmj5DnpLpcblx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhg5bGP6JS9IHZzY29kZSDmoYbmnrbmlofku7bmj5DnpLpgKTtcblx0XHRcdGNvbnN0IHZzY29kZV9zZXR0aW5nX3BhdGhfcyA9IHBhdGguam9pbihcblx0XHRcdFx0RWRpdG9yLlByb2plY3QucGF0aCxcblx0XHRcdFx0XCIudnNjb2RlL3NldHRpbmdzLmpzb25cIlxuXHRcdFx0KTtcblx0XHRcdGxldCBzZXR0aW5nc19qc29uOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge307XG5cblx0XHRcdC8vIOmhueebriB2c2NvZGUgc2V0dGluZ3Mg5paH5Lu25LiN5a2Y5Zyo5YiZ5Yib5bu6XG5cdFx0XHRpZiAoIWZzLmV4aXN0c1N5bmModnNjb2RlX3NldHRpbmdfcGF0aF9zKSkge1xuXHRcdFx0XHRmcy5ta2RpclN5bmMocGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsIFwiLnZzY29kZVwiKSk7XG5cdFx0XHR9XG5cdFx0XHQvLyDlrZjlnKjliJnor7vlj5Zcblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRzZXR0aW5nc19qc29uID0gY2pzb24ubG9hZCh2c2NvZGVfc2V0dGluZ19wYXRoX3MpO1xuXHRcdFx0fVxuXG5cdFx0XHRzZXR0aW5nc19qc29uW1widHlwZXNjcmlwdC5wcmVmZXJlbmNlcy5hdXRvSW1wb3J0RmlsZUV4Y2x1ZGVQYXR0ZXJuc1wiXSA9IFtcblx0XHRcdFx0YC4vZXh0ZW5zaW9ucy8ke3BhY2thZ2VfanNvbi5uYW1lfS8ke2ZyYW1ld29ya19wYXRoX3N9L0BmcmFtZXdvcmsvKipgLFxuXHRcdFx0XTtcblxuXHRcdFx0ZnMud3JpdGVKU09OU3luYyh2c2NvZGVfc2V0dGluZ19wYXRoX3MsIHNldHRpbmdzX2pzb24pO1xuXHRcdH0pXG5cdFx0Ly8g5riF55CG5Li05pe25paH5Lu2XG5cdFx0LnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCLmuIXnkIbkuLTml7bmlofku7ZcIik7XG5cdFx0XHRmcy5yZW1vdmUoZG93bmxvYWRfcGF0aF9zKTtcblx0XHR9KVxuXHRcdC5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdGlmICghZXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0fSk7XG59XG4iXX0=