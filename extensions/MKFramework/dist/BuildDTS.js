"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-restricted-imports */
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const prettier_1 = __importDefault(require("prettier"));
const cjson_1 = __importDefault(require("cjson"));
async function buildDTS() {
    /** 插件根目录 */
    const pluginPath = path_1.default.join(__dirname, "../");
    /** api-extractor.json */
    const apiExtractor = cjson_1.default.load(path_1.default.join(pluginPath, "api-extractor.json"));
    /** 编译 tsconfig */
    const buildTsconfig = cjson_1.default.load(path_1.default.join(pluginPath, "assets/tsconfig.json"));
    /** 声明文件路径 */
    const dtsPath = apiExtractor.dtsRollup.publicTrimmedFilePath.replace("<projectFolder>", pluginPath);
    // 删除 d.ts
    fs_extra_1.default.removeSync(dtsPath);
    // 编译 ts
    await new Promise((resolve, reject) => {
        child_process_1.default.exec(`npx tsc -p ${path_1.default.join(pluginPath, "assets/tsconfig.json")}`, {
            cwd: pluginPath,
        }, (error, stdout) => {
            if (error) {
                console.error(stdout);
                reject(stdout);
            }
            else {
                resolve();
            }
        });
    });
    // 删除生成的声明文件，否则会影响生成
    fs_extra_1.default.removeSync(dtsPath);
    // 生成 d.ts
    child_process_1.default.execSync(`npx api-extractor run --local --diagnostics`, {
        cwd: pluginPath,
    });
    /** 声明文件 */
    let dtsFile = fs_extra_1.default.readFileSync(dtsPath, "utf-8");
    // 添加顶部命名空间
    {
        const index = dtsFile.indexOf("export");
        dtsFile =
            dtsFile
                .slice(0, index)
                // 排除引用的绝对路径 cc.d.ts
                .replace(/(\/\/\/ <reference)([^]+?(\/>))/g, "") +
                "declare namespace mk {\n" +
                dtsFile.slice(index) +
                "\n}\n export default mk;";
    }
    // 添加全局配置引用
    dtsFile = `import GlobalConfig from "../../assets/MKFramework/Config/GlobalConfig";\n` + dtsFile;
    // 增加提示语
    dtsFile =
        `// 框架源码位于 ${path_1.default.normalize("项目根目录/" + pluginPath.slice(pluginPath.indexOf("extensions")) + "assets/MKFramework")} 下，你也可以在资源管理器下方的 MKFramework 查看\n` + dtsFile;
    // 禁止错误检查
    dtsFile = "//@ts-nocheck\n" + dtsFile;
    // @link 链接处理
    dtsFile = dtsFile.replace(/@link mk_/g, "@link ");
    // 格式化
    {
        const configPath = path_1.default.join(Editor.Project.path, ".prettierrc.json");
        let config = {
            filepath: "*.ts",
            parser: "typescript",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            tabWidth: 4,
        };
        const configFile = !fs_extra_1.default.existsSync(configPath) ? null : fs_extra_1.default.readFileSync(configPath, "utf-8");
        if (configFile) {
            config = JSON.parse(configFile);
            if (!config.parser) {
                config.parser = "typescript";
            }
        }
        dtsFile = await prettier_1.default.format(dtsFile, config);
    }
    // 保存文件
    fs_extra_1.default.writeFileSync(dtsPath, dtsFile);
    // 清理临时文件
    fs_extra_1.default.remove(path_1.default.join(pluginPath, "assets", buildTsconfig.compilerOptions.outDir));
}
exports.default = buildDTS;
