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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRfZHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc291cmNlL2J1aWxkX2R0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4QixrRUFBMEM7QUFDMUMsd0RBQTBCO0FBQzFCLHdEQUFnQztBQUNoQyxrREFBMEI7QUFDMUIscUNBQW9DO0FBRXJCLEtBQUssVUFBVSxHQUFHO0lBQ2hDLFlBQVk7SUFDWixNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsRCx5QkFBeUI7SUFDekIsTUFBTSxhQUFhLEdBQUcsZUFBSyxDQUFDLElBQUksQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDakYsa0JBQWtCO0lBQ2xCLE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLGFBQWE7SUFDYixNQUFNLFVBQVUsR0FBSSxhQUFhLENBQUMsU0FBUyxDQUFDLHFCQUFnQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUV2SCxVQUFVO0lBQ1Ysa0JBQUUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFMUIsUUFBUTtJQUNSLE1BQU0sSUFBSSxPQUFPLENBQU8sQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDL0MsdUJBQWEsQ0FBQyxJQUFJLENBQ2pCLGNBQWMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxFQUNoRSxDQUFDLEtBQXlDLEVBQUUsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO1lBQzdFLElBQUksS0FBSyxFQUFFO2dCQUNWLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RCLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNqQjtpQkFBTTtnQkFDTixTQUFTLEVBQUUsQ0FBQzthQUNaO1FBQ0YsQ0FBQyxDQUNELENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILG9CQUFvQjtJQUNwQixrQkFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMxQixVQUFVO0lBQ1YsdUJBQWEsQ0FBQyxRQUFRLENBQUMsNkNBQTZDLEVBQUU7UUFDckUsR0FBRyxFQUFFLGFBQWE7S0FDbEIsQ0FBQyxDQUFDO0lBRUgsV0FBVztJQUNYLElBQUksVUFBVSxHQUFHLGtCQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUV0RCxXQUFXO0lBQ1g7UUFDQyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTdDLFVBQVU7WUFDVCxVQUFVO2lCQUNSLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDO2dCQUNsQixvQkFBb0I7aUJBQ25CLE9BQU8sQ0FBQyxrQ0FBa0MsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELDBCQUEwQjtnQkFDMUIsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ3pCLDBCQUEwQixDQUFDO0tBQzVCO0lBRUQsV0FBVztJQUNYLFVBQVUsR0FBRyxnRkFBZ0YsR0FBRyxVQUFVLENBQUM7SUFDM0csU0FBUztJQUNULFVBQVUsR0FBRyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7SUFDNUMsYUFBYTtJQUNiLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV4RCxNQUFNO0lBQ047UUFDQyxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFekUsSUFBSSxNQUFNLEdBQXFCO1lBQzlCLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLGdFQUFnRTtZQUNoRSxRQUFRLEVBQUUsQ0FBQztTQUNYLENBQUM7UUFFRixNQUFNLGFBQWEsR0FBRyxDQUFDLGtCQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGtCQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVyRyxJQUFJLGFBQWEsRUFBRTtZQUNsQixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsTUFBTSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7YUFDN0I7U0FDRDtRQUVELFVBQVUsR0FBRyxNQUFNLGtCQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN2RDtJQUVELE9BQU87SUFDUCxrQkFBRSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDekMsU0FBUztJQUNULGtCQUFFLENBQUMsTUFBTSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEYsQ0FBQztBQXZGRCxzQkF1RkM7QUFFRCxJQUFJLGNBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxFQUFFO0lBQ2hDLE1BQU0sQ0FBQyxNQUFjLEdBQUc7UUFDeEIsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLElBQUEsYUFBRyxHQUFFO1NBQ1g7S0FDRCxDQUFDO0lBQ0YsR0FBRyxFQUFFLENBQUM7Q0FDTiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgY2hpbGRfcHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IGZzIGZyb20gXCJmcy1leHRyYVwiO1xuaW1wb3J0IHByZXR0aWVyIGZyb20gXCJwcmV0dGllclwiO1xuaW1wb3J0IGNqc29uIGZyb20gXCJjanNvblwiO1xuaW1wb3J0IHsgYXJndiwgY3dkIH0gZnJvbSBcInByb2Nlc3NcIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gcnVuKCk6IFByb21pc2U8dm9pZD4ge1xuXHQvKiog5o+S5Lu25qC555uu5b2VICovXG5cdGNvbnN0IHBsdWdpbl9wYXRoX3MgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uL1wiKTtcblx0LyoqIGFwaS1leHRyYWN0b3IuanNvbiAqL1xuXHRjb25zdCBhcGlfZXh0cmFjdG9yID0gY2pzb24ubG9hZChwYXRoLmpvaW4ocGx1Z2luX3BhdGhfcywgXCJhcGktZXh0cmFjdG9yLmpzb25cIikpO1xuXHQvKiog57yW6K+RIHRzY29uZmlnICovXG5cdGNvbnN0IGJ1aWxkX3RzY29uZmlnID0gY2pzb24ubG9hZChwYXRoLmpvaW4ocGx1Z2luX3BhdGhfcywgXCJhc3NldHMvdHNjb25maWcuanNvblwiKSk7XG5cdC8qKiDlo7DmmI7mlofku7bot6/lvoQgKi9cblx0Y29uc3QgZHRzX3BhdGhfcyA9IChhcGlfZXh0cmFjdG9yLmR0c1JvbGx1cC5wdWJsaWNUcmltbWVkRmlsZVBhdGggYXMgc3RyaW5nKS5yZXBsYWNlKFwiPHByb2plY3RGb2xkZXI+XCIsIHBsdWdpbl9wYXRoX3MpO1xuXG5cdC8vIOWIoOmZpCBkLnRzXG5cdGZzLnJlbW92ZVN5bmMoZHRzX3BhdGhfcyk7XG5cblx0Ly8g57yW6K+RIHRzXG5cdGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlX2YsIHJlamVjdF9mKSA9PiB7XG5cdFx0Y2hpbGRfcHJvY2Vzcy5leGVjKFxuXHRcdFx0YG5weCB0c2MgLXAgJHtwYXRoLmpvaW4ocGx1Z2luX3BhdGhfcywgXCJhc3NldHMvdHNjb25maWcuanNvblwiKX1gLFxuXHRcdFx0KGVycm9yOiBjaGlsZF9wcm9jZXNzLkV4ZWNFeGNlcHRpb24gfCBudWxsLCBzdGRvdXQ6IHN0cmluZywgc3RkZXJyOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihzdGRvdXQpO1xuXHRcdFx0XHRcdHJlamVjdF9mKHN0ZG91dCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZV9mKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHQpO1xuXHR9KTtcblxuXHQvLyDliKDpmaTnlJ/miJDnmoTlo7DmmI7mlofku7bvvIzlkKbliJnkvJrlvbHlk43nlJ/miJBcblx0ZnMucmVtb3ZlU3luYyhkdHNfcGF0aF9zKTtcblx0Ly8g55Sf5oiQIGQudHNcblx0Y2hpbGRfcHJvY2Vzcy5leGVjU3luYyhgbnB4IGFwaS1leHRyYWN0b3IgcnVuIC0tbG9jYWwgLS1kaWFnbm9zdGljc2AsIHtcblx0XHRjd2Q6IHBsdWdpbl9wYXRoX3MsXG5cdH0pO1xuXG5cdC8qKiDlo7DmmI7mlofku7YgKi9cblx0bGV0IGR0c19maWxlX3MgPSBmcy5yZWFkRmlsZVN5bmMoZHRzX3BhdGhfcywgXCJ1dGYtOFwiKTtcblxuXHQvLyDmt7vliqDpobbpg6jlkb3lkI3nqbrpl7Rcblx0e1xuXHRcdGNvbnN0IGluZGV4X24gPSBkdHNfZmlsZV9zLmluZGV4T2YoXCJleHBvcnRcIik7XG5cblx0XHRkdHNfZmlsZV9zID1cblx0XHRcdGR0c19maWxlX3Ncblx0XHRcdFx0LnNsaWNlKDAsIGluZGV4X24pXG5cdFx0XHRcdC8vIOaOkumZpOW8leeUqOeahOe7neWvuei3r+W+hCBjYy5kLnRzXG5cdFx0XHRcdC5yZXBsYWNlKC8oXFwvXFwvXFwvIDxyZWZlcmVuY2UpKFteXSs/KFxcLz4pKS9nLCBcIlwiKSArXG5cdFx0XHRcImRlY2xhcmUgbmFtZXNwYWNlIG1rIHtcXG5cIiArXG5cdFx0XHRkdHNfZmlsZV9zLnNsaWNlKGluZGV4X24pICtcblx0XHRcdFwiXFxufVxcbiBleHBvcnQgZGVmYXVsdCBtaztcIjtcblx0fVxuXG5cdC8vIOa3u+WKoOWFqOWxgOmFjee9ruW8leeUqFxuXHRkdHNfZmlsZV9zID0gYGltcG9ydCBnbG9iYWxfY29uZmlnIGZyb20gXCIuLi8uLi9hc3NldHMvbWstZnJhbWV3b3JrL0Bjb25maWcvZ2xvYmFsX2NvbmZpZ1wiO1xcbmAgKyBkdHNfZmlsZV9zO1xuXHQvLyDnpoHmraLplJnor6/mo4Dmn6Vcblx0ZHRzX2ZpbGVfcyA9IFwiLy9AdHMtbm9jaGVja1xcblwiICsgZHRzX2ZpbGVfcztcblx0Ly8gQGxpbmsg6ZO+5o6l5aSE55CGXG5cdGR0c19maWxlX3MgPSBkdHNfZmlsZV9zLnJlcGxhY2UoL0BsaW5rIG1rXy9nLCBcIkBsaW5rIFwiKTtcblxuXHQvLyDmoLzlvI/ljJZcblx0e1xuXHRcdGNvbnN0IGNvbmZpZ19wYXRoX3MgPSBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgXCIucHJldHRpZXJyYy5qc29uXCIpO1xuXG5cdFx0bGV0IGNvbmZpZzogcHJldHRpZXIuT3B0aW9ucyA9IHtcblx0XHRcdGZpbGVwYXRoOiBcIioudHNcIixcblx0XHRcdHBhcnNlcjogXCJ0eXBlc2NyaXB0XCIsXG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG5cdFx0XHR0YWJXaWR0aDogNCxcblx0XHR9O1xuXG5cdFx0Y29uc3QgY29uZmlnX2ZpbGVfcyA9ICFmcy5leGlzdHNTeW5jKGNvbmZpZ19wYXRoX3MpID8gbnVsbCA6IGZzLnJlYWRGaWxlU3luYyhjb25maWdfcGF0aF9zLCBcInV0Zi04XCIpO1xuXG5cdFx0aWYgKGNvbmZpZ19maWxlX3MpIHtcblx0XHRcdGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnX2ZpbGVfcyk7XG5cblx0XHRcdGlmICghY29uZmlnLnBhcnNlcikge1xuXHRcdFx0XHRjb25maWcucGFyc2VyID0gXCJ0eXBlc2NyaXB0XCI7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZHRzX2ZpbGVfcyA9IGF3YWl0IHByZXR0aWVyLmZvcm1hdChkdHNfZmlsZV9zLCBjb25maWcpO1xuXHR9XG5cblx0Ly8g5L+d5a2Y5paH5Lu2XG5cdGZzLndyaXRlRmlsZVN5bmMoZHRzX3BhdGhfcywgZHRzX2ZpbGVfcyk7XG5cdC8vIOa4heeQhuS4tOaXtuaWh+S7tlxuXHRmcy5yZW1vdmUocGF0aC5qb2luKHBsdWdpbl9wYXRoX3MsIFwiYXNzZXRzXCIsIGJ1aWxkX3RzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5vdXREaXIpKTtcbn1cblxuaWYgKGFyZ3Yuc2xpY2UoMilbMF0gPT09IFwiYnVpbGRcIikge1xuXHQoZ2xvYmFsLkVkaXRvciBhcyBhbnkpID0ge1xuXHRcdFByb2plY3Q6IHtcblx0XHRcdHBhdGg6IGN3ZCgpLFxuXHRcdH0sXG5cdH07XG5cdHJ1bigpO1xufVxuIl19