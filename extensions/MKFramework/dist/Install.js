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
const axios_1 = __importDefault(require("axios"));
const fast_glob_1 = __importDefault(require("fast-glob"));
// 修改模块让其正常加载
[path_1.default.join(__dirname, "../node_modules/isomorphic-git/index"), path_1.default.join(__dirname, "../node_modules/isomorphic-git/http/node/index")].forEach((p) => {
    if (fs_extra_1.default.existsSync(p + ".js") && fs_extra_1.default.existsSync(p + ".cjs")) {
        fs_extra_1.default.renameSync(p + ".js", p + "-old.js");
        fs_extra_1.default.copyFileSync(p + ".cjs", p + ".js");
    }
});
const isomorphic_git_1 = __importDefault(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
async function install(versionStr_) {
    /** 用户名 */
    const giteeOwner = "muzzik";
    /** 用户名 */
    const githubOwner = "1226085293";
    /** 仓库路径 */
    const repo = "MKFramework";
    /** 临时路径 */
    const tempPath = Editor.Project.tmpDir;
    /** 插件路径 */
    const pluginPath = path_1.default.join(__dirname, "../").replace(/\\/g, "/");
    /** 插件项目路径 */
    const pluginProjectPath = pluginPath.slice(pluginPath.indexOf("/extensions/")).slice(1);
    /** gitee 远程路径 */
    const giteeRemoteUrl = `https://gitee.com/${giteeOwner}/${repo}.git`;
    /** github 远程路径 */
    const githubRemoteUrl = `https://github.com/${githubOwner}/${repo}.git`;
    /** 下载路径 */
    const downloadPath = path_1.default.join(tempPath, "MKFramework");
    /** 框架代码路径 */
    const frameworkPath = "assets/MKFramework";
    /** 安装路径 */
    const installPath = path_1.default.join(__dirname, "..", frameworkPath);
    /** ts 配置 */
    const projectTsconfig = cjson_1.default.load(path_1.default.join(Editor.Project.path, "tsconfig.json"));
    /** 包配置 */
    const projectPackage = cjson_1.default.load(path_1.default.join(Editor.Project.path, "package.json"));
    /** 安装版本 */
    let version;
    /** 最新的稳定版本 */
    let latestStableVersionStr;
    /** 下个版本 */
    let nextVersionStr;
    await Promise.resolve()
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.安全检查"));
        let pathToCheck = path_1.default.join(__dirname, "..", frameworkPath);
        // 覆盖安装确认
        if (fs_extra_1.default.existsSync(pathToCheck) && fs_extra_1.default.readdirSync(pathToCheck).length !== 0) {
            const result = await Editor.Dialog.info(Editor.I18n.t("mk-framework.确认安装"), {
                buttons: [Editor.I18n.t("mk-framework.确认"), Editor.I18n.t("mk-framework.取消")],
            });
            if (result.response !== 0) {
                return Promise.reject("取消安装");
            }
            fs_extra_1.default.emptyDirSync(installPath);
        }
    })
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.获取版本"));
        const tagsUrl = `https://gitee.com/${giteeOwner}/${repo}/tags`;
        const html = (await axios_1.default.get(tagsUrl)).data;
        const tags = html.match(/(?<=(data-ref="))([^"]*)(?=")/g);
        tags.sort((a, b) => {
            const aVersion = a[0] === "v" ? -Number(a.slice(1).replace(/\./g, "")) : 999;
            const bVersion = b[0] === "v" ? -Number(b.slice(1).replace(/\./g, "")) : 999;
            return aVersion - bVersion;
        });
        latestStableVersionStr = tags[0];
        nextVersionStr = "v" + (Number(latestStableVersionStr.match(/\d+/g).join("")) + 1).toString().replace(/(\d)(?=\d)/g, "$1.");
        version = versionStr_ || tags[0];
    })
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.下载框架") + `(${version})`);
        try {
            fs_extra_1.default.removeSync(downloadPath);
            fs_extra_1.default.emptyDirSync(downloadPath);
        }
        catch (error) {
            return error;
        }
        try {
            await isomorphic_git_1.default.clone({
                fs: fs_extra_1.default,
                http: node_1.default,
                dir: downloadPath,
                url: giteeRemoteUrl,
                depth: 1,
                ref: version,
            });
        }
        catch (error) {
            console.error("gitee 下载失败，使用 github 进行下载", error);
            await isomorphic_git_1.default.clone({
                fs: fs_extra_1.default,
                http: node_1.default,
                dir: downloadPath,
                url: githubRemoteUrl,
                depth: 1,
                ref: version,
            });
        }
    })
        // 注入框架
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.注入框架"));
        // 拷贝框架文件
        {
            fs_extra_1.default.copySync(path_1.default.join(downloadPath, pluginProjectPath, `assets`), path_1.default.join(installPath, ".."));
            Editor.Message.send("asset-db", "refresh-asset", "db://MKFramework");
        }
        // 添加脚本模板
        {
            /** 脚本模板文件路径 */
            const scriptTemplatePath = path_1.default.join(downloadPath, ".creator/asset-template/typescript");
            if (fs_extra_1.default.pathExistsSync(scriptTemplatePath)) {
                const files = await (0, fast_glob_1.default)(scriptTemplatePath.replace(/\\/g, "/") + "/*.ts");
                files.forEach((f) => {
                    fs_extra_1.default.copySync(f, path_1.default.join(Editor.Project.path, ".creator/asset-template/typescript", path_1.default.basename(f)));
                });
            }
        }
    })
        // 注入声明文件
        .then(async () => {
        var _a;
        console.log(Editor.I18n.t("mk-framework.注入声明文件"));
        /** 框架声明文件 */
        const frameworkTsconfig = cjson_1.default.load(path_1.default.join(downloadPath, "tsconfig.json"));
        /** 声明文件路径 */
        const declarePath = path_1.default.join(pluginProjectPath, "/@types/MKFramework/");
        /** 修改 tsconfig */
        let shouldModifyTsconfig = false;
        // 拷贝 d.ts
        fs_extra_1.default.copySync(path_1.default.join(downloadPath, declarePath), path_1.default.join(Editor.Project.path, declarePath));
        // 添加框架类型声明文件
        if ((_a = frameworkTsconfig.types) === null || _a === void 0 ? void 0 : _a.length) {
            shouldModifyTsconfig = true;
            if (!projectTsconfig.types) {
                projectTsconfig.types = [...frameworkTsconfig.types];
            }
            else {
                for (const t of frameworkTsconfig.types) {
                    if (!projectTsconfig.types.includes(t)) {
                        projectTsconfig.types.push(t);
                    }
                }
            }
        }
        // 添加 tsconfig 路径配置
        if (frameworkTsconfig.compilerOptions.paths) {
            shouldModifyTsconfig = true;
            if (!projectTsconfig.compilerOptions) {
                projectTsconfig.compilerOptions = {};
            }
            if (!projectTsconfig.compilerOptions.paths) {
                projectTsconfig.compilerOptions.paths = {};
            }
            for (const k in frameworkTsconfig.compilerOptions.paths) {
                projectTsconfig.compilerOptions.paths[k] = frameworkTsconfig.compilerOptions.paths[k];
            }
        }
        if (shouldModifyTsconfig) {
            fs_extra_1.default.writeFileSync(path_1.default.join(Editor.Project.path, "tsconfig.json"), await prettier_1.default.format(JSON.stringify(projectTsconfig), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
    })
        // 添加导入映射
        .then(async () => {
        var _a, _b, _c;
        console.log(Editor.I18n.t("mk-framework.添加导入映射"));
        const settingPath = path_1.default.join(Editor.Project.path, "settings/v2/packages/project.json");
        const settingConfig = !fs_extra_1.default.existsSync(settingPath) ? {} : fs_extra_1.default.readJSONSync(settingPath);
        const importMap = fs_extra_1.default.readJSONSync(path_1.default.join(downloadPath, "import-map.json"));
        // 防止 script 不存在
        if (!settingConfig.script) {
            settingConfig.script = {};
        }
        /** 导入映射路径 */
        let importMapPath = ((_a = settingConfig.script.importMap) !== null && _a !== void 0 ? _a : "").replace("project:/", Editor.Project.path);
        // 已存在导入映射
        if (fs_extra_1.default.existsSync(importMapPath) && fs_extra_1.default.statSync(importMapPath).isFile()) {
            const importMapContent = (_b = fs_extra_1.default.readJSONSync(importMapPath)) !== null && _b !== void 0 ? _b : {};
            // 更新导入映射
            importMapContent.imports = (_c = importMapContent.imports) !== null && _c !== void 0 ? _c : {};
            Object.assign(importMapContent.imports, importMap.imports);
            // 写入导入映射
            fs_extra_1.default.writeFileSync(importMapPath, await prettier_1.default.format(JSON.stringify(importMapContent), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
        // 不存在新建导入映射
        else {
            importMapPath = path_1.default.join(Editor.Project.path, "import-map.json");
            // 写入导入映射
            fs_extra_1.default.writeFileSync(importMapPath, await prettier_1.default.format(JSON.stringify(importMap), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
            // 更新项目设置
            settingConfig.script.importMap = importMapPath.replace(Editor.Project.path + "\\", "project://").replace(/\\/g, "/");
            // 写入项目设置
            fs_extra_1.default.ensureDirSync(path_1.default.dirname(settingPath));
            fs_extra_1.default.writeFileSync(settingPath, await prettier_1.default.format(JSON.stringify(settingConfig), {
                filepath: "*.json",
                tabWidth: 4,
                useTabs: true,
            }));
        }
    })
        // 屏蔽 vscode 框架文件提示
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.屏蔽vscode框架文件提示"));
        const oldVscodeSettings = cjson_1.default.load(path_1.default.join(downloadPath, ".vscode/settings.json"));
        const vscodeSettingPath = path_1.default.join(Editor.Project.path, ".vscode/settings.json");
        let vscodeSettings = {};
        // 保证项目 vscode settings 目录存在
        fs_extra_1.default.ensureDirSync(path_1.default.join(Editor.Project.path, ".vscode"));
        // 读取 settings 文件
        if (fs_extra_1.default.existsSync(vscodeSettingPath)) {
            vscodeSettings = cjson_1.default.load(vscodeSettingPath);
        }
        vscodeSettings["typescript.preferences.autoImportFileExcludePatterns"] =
            oldVscodeSettings["typescript.preferences.autoImportFileExcludePatterns"];
        fs_extra_1.default.writeFileSync(vscodeSettingPath, await prettier_1.default.format(JSON.stringify(vscodeSettings), {
            filepath: "*.json",
            tabWidth: 4,
            useTabs: true,
        }));
    })
        // 更新框架版本信息
        .then(async () => {
        console.log(Editor.I18n.t("mk-framework.更新框架版本信息"));
        if (!projectPackage["MKFramework"]) {
            projectPackage["MKFramework"] = {};
        }
        projectPackage["MKFramework"].version = versionStr_ ? `${nextVersionStr}(开发版)` : version;
        fs_extra_1.default.writeFileSync(path_1.default.join(Editor.Project.path, "package.json"), await prettier_1.default.format(JSON.stringify(projectPackage), {
            filepath: "*.json",
            tabWidth: 4,
            useTabs: true,
        }));
    })
        // 清理临时文件
        .then(() => {
        console.log(Editor.I18n.t("mk-framework.清理临时文件"));
        fs_extra_1.default.remove(downloadPath);
    })
        // 安装成功
        .then(() => {
        console.log(Editor.I18n.t("mk-framework.安装成功"));
    })
        .catch((error) => {
        if (!error) {
            return;
        }
        console.error(error);
        console.error(Editor.I18n.t("mk-framework.安装失败"));
    });
}
exports.default = install;
