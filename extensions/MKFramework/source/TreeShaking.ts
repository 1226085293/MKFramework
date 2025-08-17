import micromatch from "micromatch";
import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import { Project, SourceFile } from "ts-morph";

interface Params {
	rootDir: string;
	entryFile: string;
	exclude?: string[];
}

interface WeakImport {
	filePath: string;
	lineIndex: number;
	targetPath: string;
}

interface WeakBlock {
	filePath: string;
	startIndex: number;
	endIndex: number;
	targetPath: string;
}

interface WeakContentItem {
	targetPath: string;
	posCommentText: string;
	positionRegex: RegExp;
	importContent?: string;
	unimportContent?: string;
}

interface WeakContentBlock {
	filePath: string;
	startIndex: number;
	endIndex: number;
	items: WeakContentItem[];
}

let weakImports: WeakImport[] = [];
let weakBlocks: WeakBlock[] = [];
let weakContentBlocks: WeakContentBlock[] = [];

const COMMENT_TAG = "// UNUSED_FILE_COMMENTED";

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAllTSFiles(rootDir: string): Promise<string[]> {
	return await glob(path.join(rootDir, "**/*.ts").replace(/\\/g, "/"));
}

async function getAllUsedTSFiles(entryFile: string): Promise<Set<string>> {
	const project = new Project({ skipAddingFilesFromTsConfig: true });

	weakImports = [];
	weakBlocks = [];
	weakContentBlocks = [];

	const visited = new Set<string>();
	const queue: string[] = [path.resolve(entryFile)];

	while (queue.length > 0) {
		const currentPath = queue.pop()!;
		if (visited.has(currentPath)) continue;
		visited.add(currentPath);

		let sourceText: string;
		try {
			sourceText = await fs.readFile(currentPath, "utf-8");
		} catch {
			continue;
		}

		let relatedModules: string[] = [];

		try {
			const sourceFile: SourceFile = project.addSourceFileAtPathIfExists(currentPath) ?? project.addSourceFileAtPath(currentPath);

			const imports = sourceFile.getImportDeclarations();
			const exports = sourceFile.getExportDeclarations();

			for (const decl of [...imports, ...exports]) {
				const specifier = decl.getModuleSpecifierValue();
				if (!specifier || !specifier.startsWith(".")) continue;
				let filePath = path.resolve(path.dirname(currentPath), specifier);
				if (!filePath.endsWith(".ts")) filePath += ".ts";

				const lines = sourceText.split("\n");
				const prevLineIndex = decl.getStartLineNumber() - 2;
				const prevLine = lines[prevLineIndex]?.trim();
				if (prevLine === "/** @weak */") {
					weakImports.push({
						filePath: currentPath,
						lineIndex: decl.getStartLineNumber() - 1,
						targetPath: filePath,
					});
					continue;
				}

				if (!decl.getText().startsWith("import type")) {
					relatedModules.push(filePath);
				}
			}
		} catch {}

		const lines = sourceText.split("\n");

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === "/** @weak */") {
				const importLine = lines[i + 1]?.trim();
				const match = importLine?.match(/^\/\/\s*import\s+.*\s+from\s+["'](.+)["']/);
				if (match && match[1].startsWith(".")) {
					let filePath = path.resolve(path.dirname(currentPath), match[1]);
					if (!filePath.endsWith(".ts")) filePath += ".ts";
					weakImports.push({
						filePath: currentPath,
						lineIndex: i + 1,
						targetPath: filePath,
					});
				}
			}
		}

		for (let i = 0; i < lines.length; i++) {
			const startMatch = lines[i].match(/^\s*\/\/\s*@weak-start-include-([^-]+)\s*$/);
			if (!startMatch) continue;
			const fileBaseName = startMatch[1].trim();

			let importPath: string | undefined;
			for (const line of lines) {
				const m1 = line.match(new RegExp(`^\\s*import\\s+.*\\s+from\\s+["'](.+/${escapeRegExp(fileBaseName)})["']`));
				const m2 = line.match(new RegExp(`^\\s*//\\s*import\\s+.*\\s+from\\s+["'](.+/${escapeRegExp(fileBaseName)})["']`));
				const m3 = line.match(new RegExp(`import\\(["'](.+/${escapeRegExp(fileBaseName)})["']\\)`));
				const match = m1 || m2 || m3;
				if (match) {
					importPath = match[1];
					break;
				}
			}
			if (!importPath) {
				console.warn(`⚠️ 未找到弱引用 include 对应的 import: ${fileBaseName} in ${currentPath}`);
				continue;
			}
			const targetPath = path.resolve(path.dirname(currentPath), importPath.endsWith(".ts") ? importPath : `${importPath}.ts`);
			let j = i + 1;
			while (j < lines.length && !lines[j].trim().startsWith("// @weak-end")) j++;
			if (j < lines.length) {
				weakBlocks.push({ filePath: currentPath, startIndex: i, endIndex: j, targetPath });
				i = j;
			}
		}

		for (let i = 0; i < lines.length; i++) {
			const blockStartMatch = lines[i].match(/^\s*\/\/\s*@weak-start-content-[^\s]+\s*$/);
			if (!blockStartMatch) continue;

			const blockStartLine = i;
			let j = i;
			const items: WeakContentItem[] = [];

			while (j < lines.length && !lines[j].trim().startsWith("// @weak-end")) {
				const itemStart = lines[j].match(/^\s*\/\/\s*@weak-start-content-([^\s]+)\s*$/);
				if (!itemStart) {
					j++;
					continue;
				}
				const fileBaseName = itemStart[1].trim();

				let importPath: string | undefined;
				for (const line of lines) {
					const m1 = line.match(new RegExp(`^\\s*import\\s+.*\\s+from\\s+["'](.+/${escapeRegExp(fileBaseName)})["']`));
					const m2 = line.match(new RegExp(`^\\s*//\\s*import\\s+.*\\s+from\\s+["'](.+/${escapeRegExp(fileBaseName)})["']`));
					const match = m1 || m2;
					if (match) {
						importPath = match[1];
						break;
					}
				}
				if (!importPath) {
					console.warn(`⚠️ 未找到弱内容项对应的 import: ${fileBaseName} in ${currentPath}`);
					j++;
					continue;
				}
				const targetPath = path.resolve(path.dirname(currentPath), importPath.endsWith(".ts") ? importPath : `${importPath}.ts`);

				let k = j + 1;
				let posCommentText: string | undefined;
				let positionRegex: RegExp | undefined;
				let importContent: string | undefined;
				let unimportContent: string | undefined;

				while (k < lines.length) {
					if (lines[k].match(/^\s*\/\/\s*@weak-start-content-[^\s]+\s*$/) || lines[k].trim().startsWith("// @weak-end")) {
						break;
					}
					const posM = lines[k].match(/^\s*\/\/\s*@position\s*:\s*(.+)$/);
					const imM = lines[k].match(/^\s*\/\/\s*@import\s*:*(.*)$/);
					const uimM = lines[k].match(/^\s*\/\/\s*@unimport\s*:*(.*)$/);

					if (posM) {
						const after = posM[1].trim();
						if (after.startsWith("/")) {
							const lastSlash = after.lastIndexOf("/");
							if (lastSlash > 0) {
								const pattern = after.slice(1, lastSlash);
								const flags = after.slice(lastSlash + 1);
								try {
									positionRegex = new RegExp(pattern, flags);
									posCommentText = lines[k].trim();
								} catch {
									console.warn(`⚠️ 无效 position 正则: ${after} in ${currentPath}`);
								}
							}
						} else {
							try {
								positionRegex = new RegExp(after);
								posCommentText = lines[k].trim();
							} catch {
								console.warn(`⚠️ 无效 position 正则文本: ${after} in ${currentPath}`);
							}
						}
					}
					if (imM) importContent = imM[1];
					if (uimM) unimportContent = uimM[1];
					k++;
				}

				if (!positionRegex || !posCommentText) {
					console.warn(`⚠️ 弱内容项缺少 @position: ${fileBaseName} in ${currentPath}`);
					j = k;
					continue;
				}

				items.push({
					targetPath,
					posCommentText,
					positionRegex,
					importContent: importContent === undefined ? undefined : importContent,
					unimportContent: unimportContent === undefined ? undefined : unimportContent,
				});

				j = k;
			}

			let blockEnd = j;
			if (j < lines.length && lines[j].trim().startsWith("// @weak-end") && items.length > 0) {
				weakContentBlocks.push({
					filePath: currentPath,
					startIndex: blockStartLine,
					endIndex: blockEnd,
					items,
				});
			}
			i = j;
		}

		queue.push(...relatedModules);
	}

	return visited;
}

async function runOnePass(rootDir: string, entryFile: string, exclude: string[] = []): Promise<boolean> {
	const usedFiles = await getAllUsedTSFiles(entryFile);
	const allFiles = await getAllTSFiles(rootDir);

	const absoluteExcludes = exclude.map((p) => path.resolve(p));
	let changed = false;

	for (const file of allFiles) {
		const fullPath = path.resolve(file);
		if (micromatch.isMatch(fullPath, absoluteExcludes)) continue;

		const isUsed = usedFiles.has(fullPath);
		const content = await fs.readFile(fullPath, "utf-8");
		const isCommented = content.startsWith(COMMENT_TAG);

		if (!isUsed && !isCommented) {
			const commented =
				COMMENT_TAG +
				"\n" +
				content
					.split("\n")
					.map((line) => `// ${line}`)
					.join("\n");
			await fs.writeFile(fullPath, commented, "utf-8");
			console.log(`🗑️ Commented unused: ${file}`);
			changed = true;
		} else if (isUsed && isCommented) {
			const uncommented = content
				.split("\n")
				.slice(1)
				.map((line) => (line.startsWith("// ") ? line.slice(3) : line.startsWith("//") ? line.slice(2) : line))
				.join("\n");
			await fs.writeFile(fullPath, uncommented, "utf-8");
			console.log(`✅ Restored used: ${file}`);
			changed = true;
		}
	}

	for (const weak of weakImports) {
		const targetUsed = usedFiles.has(weak.targetPath);
		const lines = (await fs.readFile(weak.filePath, "utf-8")).split("\n");
		const importLine = lines[weak.lineIndex];

		if (!targetUsed && !importLine.trimStart().startsWith("//")) {
			lines[weak.lineIndex] = "// " + importLine;
			await fs.writeFile(weak.filePath, lines.join("\n"), "utf-8");
			console.log(`🪶 Commented weak import in: ${weak.filePath}`);
			changed = true;
		} else if (targetUsed && importLine.trimStart().startsWith("//")) {
			lines[weak.lineIndex] = importLine.replace(/^\/\/\s?/, "");
			await fs.writeFile(weak.filePath, lines.join("\n"), "utf-8");
			console.log(`🪶 Restored weak import in: ${weak.filePath}`);
			changed = true;
		}
	}

	for (const block of weakBlocks) {
		const targetUsed = usedFiles.has(block.targetPath);
		const lines = (await fs.readFile(block.filePath, "utf-8")).split("\n");
		const [start, end] = [block.startIndex + 1, block.endIndex - 1];
		let modified = false;

		if (!targetUsed) {
			for (let i = start; i <= end; i++) {
				if (!lines[i].trimStart().startsWith("// weak")) {
					lines[i] = "// weak" + lines[i];
					modified = true;
				}
			}
		} else {
			for (let i = start; i <= end; i++) {
				if (lines[i].trimStart().startsWith("// weak")) {
					lines[i] = lines[i].replace(/\/\/ weak?/, "");
					modified = true;
				}
			}
		}

		if (modified) {
			await fs.writeFile(block.filePath, lines.join("\n"), "utf-8");
			console.log(`${targetUsed ? "📄 Restored" : "📄 Commented"} weak block in: ${block.filePath}`);
			changed = true;
		}
	}

	for (const block of weakContentBlocks) {
		let fileText = await fs.readFile(block.filePath, "utf-8");
		let fileModified = false;

		const lines = fileText.split("\n");
		const blockStartLine = Math.max(0, Math.min(lines.length - 1, block.startIndex));
		const blockEndLine = Math.max(0, Math.min(lines.length - 1, block.endIndex));

		// 取该弱内容块文本范围
		const blockLines = lines.slice(blockStartLine, blockEndLine + 1);
		let blockText = blockLines.join("\n");

		for (const item of block.items) {
			// 找 @position 注释所在行相对于整个文件的索引
			let posLineIndex = lines.findIndex((l, idx) => idx >= blockStartLine && idx <= blockEndLine && l.trim() === item.posCommentText);
			if (posLineIndex === -1) {
				// 兜底找一次全文（不太建议）
				posLineIndex = lines.findIndex((l) => l.trim() === item.posCommentText);
			}
			if (posLineIndex === -1) continue;

			// 计算从块起点到 posLineIndex 的字符偏移
			const prefixLenInBlock = blockLines.slice(0, posLineIndex - blockStartLine + 1).reduce((acc, ln) => acc + ln.length + 1, 0);

			let searchStart = prefixLenInBlock;

			const positionHasGlobal = item.positionRegex.flags.includes("g");

			let modifiedThisItem = false;

			do {
				// 从块文本剩余部分匹配
				const afterText = blockText.slice(searchStart);
				const regex = new RegExp(item.positionRegex.source, item.positionRegex.flags.replace("g", ""));
				const m = regex.exec(afterText);
				if (!m) break;

				const insertPosInBlock = searchStart + m.index + m[0].length;

				const beforeBlock = blockText.slice(0, insertPosInBlock);
				const afterBlock = blockText.slice(insertPosInBlock);

				const importStr = item.importContent ?? "";
				const unimportStr = item.unimportContent ?? "";
				const targetUsed = usedFiles.has(item.targetPath);

				let modifiedThis = false;
				let newAfterBlock = afterBlock;

				if (targetUsed) {
					if (unimportStr && newAfterBlock.startsWith(unimportStr)) {
						newAfterBlock = newAfterBlock.slice(unimportStr.length);
						modifiedThis = true;
					}
					if (importStr && !newAfterBlock.startsWith(importStr)) {
						newAfterBlock = importStr + newAfterBlock;
						modifiedThis = true;
					}
				} else {
					if (importStr && newAfterBlock.startsWith(importStr)) {
						newAfterBlock = newAfterBlock.slice(importStr.length);
						modifiedThis = true;
					}
					if (unimportStr && !newAfterBlock.startsWith(unimportStr)) {
						newAfterBlock = unimportStr + newAfterBlock;
						modifiedThis = true;
					}
				}

				if (modifiedThis) {
					// 更新块文本
					const newBlockText = beforeBlock + newAfterBlock;

					// 替换 blockText 内容，继续搜索需要重新赋值
					blockText = newBlockText;
					fileModified = true;
					modifiedThisItem = true;
				}

				if (positionHasGlobal) {
					searchStart = insertPosInBlock + (targetUsed ? importStr.length : unimportStr.length);
				} else {
					break;
				}
			} while (positionHasGlobal);

			// 修改后，把 blockText 回写到 lines 中对应行
			if (modifiedThisItem) {
				const newBlockLines = blockText.split("\n");
				for (let idx = 0; idx < newBlockLines.length; idx++) {
					lines[blockStartLine + idx] = newBlockLines[idx];
				}
			}
		}

		if (fileModified) {
			const newFileText = lines.join("\n");
			await fs.writeFile(block.filePath, newFileText, "utf-8");
			console.log(`🧩 Processed weak content block in: ${block.filePath}`);
			changed = true;
		}
	}

	return changed;
}

export async function manageFiles(params: Params): Promise<boolean> {
	const { rootDir, entryFile, exclude = [] } = params;

	let round = 1;
	let isChanged = false;
	while (true) {
		console.log(`\n🔁 Pass ${round}`);
		const changed = await runOnePass(rootDir, entryFile, exclude);
		if (!changed) {
			console.log(`✅ No more changes. Done after ${round} pass(es).`);
			break;
		} else {
			isChanged = true;
		}
		round++;
	}

	return isChanged;
}

export default async function treeShaking(): Promise<boolean> {
	/** 插件根目录 */
	const pluginPathStr = path.join(__dirname, "../");
	const rootDir = path.join(pluginPathStr, "assets");
	const entryFile = path.join(rootDir, "MKFramework/Framework/MKExport.ts");

	return await manageFiles({
		rootDir,
		entryFile,
		exclude: [rootDir + "/MKFramework/Framework/MKInit.ts"],
	});
}
