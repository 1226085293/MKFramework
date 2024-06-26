"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const prettier_1 = __importDefault(require("prettier"));
const cjson_1 = __importDefault(require("cjson"));
const process_1 = require("process");
async function run() {
    /** 插件根目录 */
    const plugin_path_s = path_1.default.join(__dirname, "../");
    /** api-extractor.json */
    const api_extractor = cjson_1.default.load(path_1.default.join(plugin_path_s, "api-extractor.json"));
    /** 编译 tsconfig */
    const build_tsconfig = cjson_1.default.load(path_1.default.join(plugin_path_s, "assets/tsconfig.json"));
    /** 声明文件路径 */
    const dts_path_s = api_extractor.dtsRollup.publicTrimmedFilePath.replace("<projectFolder>", plugin_path_s);
    // 删除 d.ts
    fs_extra_1.default.removeSync(dts_path_s);
    // 编译 ts
    await new Promise((resolve_f, reject_f) => {
        child_process_1.default.exec(`npx tsc -p ${path_1.default.join(plugin_path_s, "assets/tsconfig.json")}`, (error, stdout, stderr) => {
            if (error) {
                console.error(stdout);
                reject_f(stdout);
            }
            else {
                resolve_f();
            }
        });
    });
    // 删除生成的声明文件，否则会影响生成
    fs_extra_1.default.removeSync(dts_path_s);
    // 生成 d.ts
    child_process_1.default.execSync(`npx api-extractor run --local --diagnostics`, {
        cwd: plugin_path_s,
    });
    /** 声明文件 */
    let dts_file_s = fs_extra_1.default.readFileSync(dts_path_s, "utf-8");
    // 添加顶部命名空间
    {
        const index_n = dts_file_s.indexOf("export");
        dts_file_s =
            dts_file_s
                .slice(0, index_n)
                // 排除引用的绝对路径 cc.d.ts
                .replace(/(\/\/\/ <reference)([^]+?(\/>))/g, "") +
                "declare namespace mk {\n" +
                dts_file_s.slice(index_n) +
                "\n}\n export default mk;";
    }
    // 添加全局配置引用
    dts_file_s = `import global_config from "../../assets/mk-framework/@config/global_config";\n` + dts_file_s;
    // 禁止错误检查
    dts_file_s = "//@ts-nocheck\n" + dts_file_s;
    // @link 链接处理
    dts_file_s = dts_file_s.replace(/@link mk_/g, "@link ");
    // 格式化
    {
        const config_path_s = path_1.default.join(Editor.Project.path, ".prettierrc.json");
        let config = {
            filepath: "*.ts",
            parser: "typescript",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            tabWidth: 4,
        };
        const config_file_s = !fs_extra_1.default.existsSync(config_path_s) ? null : fs_extra_1.default.readFileSync(config_path_s, "utf-8");
        if (config_file_s) {
            config = JSON.parse(config_file_s);
            if (!config.parser) {
                config.parser = "typescript";
            }
        }
        dts_file_s = await prettier_1.default.format(dts_file_s, config);
    }
    // 保存文件
    fs_extra_1.default.writeFileSync(dts_path_s, dts_file_s);
    // 清理临时文件
    fs_extra_1.default.remove(path_1.default.join(plugin_path_s, "assets", build_tsconfig.compilerOptions.outDir));
}
exports.default = run;
if (process_1.argv.slice(2)[0] === "build") {
    global.Editor = {
        Project: {
            path: (0, process_1.cwd)(),
        },
    };
    run();
}
