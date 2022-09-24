import { fileExist } from "./dinosaurus-utils.ts";

export class DinosaurusCache {
    private cacheDir: string;
    private cacheFiles: Map<string, string>;

    constructor(cacheDirPath: string) {
        this.cacheDir = cacheDirPath;
        this.cacheFiles = new Map<string, string>();
    }

    private recursiveCacheCreate = async (rootBase: string, extra="") => {
        const dirs = rootBase.split("/");
        dirs.shift();
        dirs.pop();

        let baseDir = this.cacheDir;
        if (!await fileExist(baseDir)) {
            Deno.mkdirSync(baseDir);
        }

        baseDir += extra;
        if (!await fileExist(baseDir)) {
            Deno.mkdirSync(baseDir);
        }

        for (const dir of dirs) {
            baseDir += `/${dir}/`;
            if (!await fileExist(baseDir)) {
                Deno.mkdirSync(baseDir);
            }
        }
    }

    handleCache = async (fileName: string, code: string | null, outputExt: string) => {
        if (Deno.env.get("DEBUG")) return null;
        const newFilePath = fileName.replace(new RegExp(`.${fileName.split(".").pop()}$`), "." + outputExt);
        this.recursiveCacheCreate(newFilePath);
        if (code != null) {
            if (!this.cacheFiles.has(fileName)) this.registerFile(fileName, code);
            if (!await fileExist(`${this.cacheDir}/${newFilePath}`)) {
                this.dumpFile(newFilePath, code);
            }
        } else {
            if (this.cacheFiles.has(fileName)) {
                return this.cacheFiles.get(fileName);
            }
            if (await fileExist(`${this.cacheDir}/${newFilePath}`)) {
                const loadedData = Deno.readTextFileSync(`${this.cacheDir}/${newFilePath}`);
                if (!this.cacheFiles.has(fileName)) this.registerFile(fileName, loadedData);
            }
            return null;
        }
    }

    private registerFile = (fileName: string, code: string) => {
        this.cacheFiles.set(fileName, code);
    }

    private dumpFile = (fileName: string, code: string) => {
        Deno.writeTextFileSync(`${this.cacheDir}/${fileName}`, code);
    }
}