import { serve } from "../deps.ts";

import { DinosaurusRouter } from "./dinosaurus-router.ts";
import { DinosaurusRequest } from "./dinosaurus-request.ts";
import { DinosaurusResponse } from "./dinosaurus-response.ts";
import { DinosaurusCache } from "./dinosaurus-cache.ts";
import { DinosaurusTranspiler } from "./dinosaurus-transpiler.ts";

interface Config {
    webRootPath: string;
    cacheRootPath: string;
    imports: Map<string, string>;
    "rollup-globals": Map<string, string>;
    "vue-head": Array<string>;
}

export class Dinosaurus {
    private router = new DinosaurusRouter();
    // not needed private logger = new BuchtaLogger();
    private config: Config;
    private transpiler: DinosaurusTranspiler;
    private fileExtensionDb: Map<string, string>;
    private cacheHandler: DinosaurusCache;

    get = (route: string, func: (req: DinosaurusRequest, res: DinosaurusResponse) => void) => {
        this.router.GET(route, func);
    }

    post = (route: string, func: (req: DinosaurusRequest, res: DinosaurusResponse) => void) => {
        this.router.POST(route, func);
    }

    patch = (route: string, func: (req: DinosaurusRequest, res: DinosaurusResponse) => void) => {
        this.router.PATCH(route, func);
    }

    delete = (route: string, func: (req: DinosaurusRequest, res: DinosaurusResponse) => void) => {
        this.router.DELETE(route, func);
    }

    put = (route: string, func: (req: DinosaurusRequest, res: DinosaurusResponse) => void) => {
        this.router.PUT(route, func);
    }

    /*
    every = (route: string, data: {methods: Array<string>, funcs: Array<(req: DinosaurusRequest, res: DinosaurusResponse) => void>}) => {
        let i = 0;
        for (const element of data.methods) {
            if (data.funcs[i] == undefined) {
                break;
            }
            this[element.toLowerCase()](route, data.funcs[i]);
            i++;
        }
    }
    */

    constructor(configPath?: string) {

        this.fileExtensionDb = new Map<string, string>();

        this.registerMIME(
            ["html", "css", "js", "json", "png", "apng", "avif", "gif", "jpeg", "jpg", "svg", "webp", "ico", "mp4", "webm", "mov",
             "mp3", "flac", "ogg", "wav", "wasm", "ts", "mjs", "mts", "jsx", "tsx", "svelte", "vue", "md"],
            ["text/html; charset=UTF-8", "text/css", "text/javascript", "application/json",
             "image/png", "image/apng", "image/avif", "image/gif", "image/jpeg", "image/jpeg",
             "image/svg+xml", "image/webp", "image/x-icon", "video/mp4", "video/webm", "video/mov",
             "audio/mp3", "audio/flac", "audio/ogg", "audio/wav", "application/wasm", "text/javascript",
             "text/javascript", "text/javascript", "text/javascript", "text/javascript", "text/javascript", "text/javascript", "text/html; charset=UTF-8"]
        );

        try {
            this.config = JSON.parse(Deno.readTextFileSync("./dinosaurus.config.json").toString())
        } catch {
            if (configPath != undefined) {
                try {
                    this.config = JSON.parse(Deno.readTextFileSync(configPath).toString())
                } catch {
                    Deno.exit(1);
                }
            } else {
                console.log("dinosaurus.config.json doesn't exist or it's broken");
                Deno.exit(1);
            }
        }

        this.cacheHandler = new DinosaurusCache(this.config.cacheRootPath);

        this.transpiler = new DinosaurusTranspiler(this.config.imports, this.cacheHandler, this.config.webRootPath);

        this.config.webRootPath ? this.setWebRoot(this.config.webRootPath) : this.setWebRoot("./");
        this.config.cacheRootPath ? this.setCacheRoot(this.config.cacheRootPath) : this.setCacheRoot("./.cache/");

        this.autoRoute(this.config.webRootPath);

        if (this.config["rollup-globals"]) {
            for (const element in this.config["rollup-globals"]) {
                this.transpiler.rollup.externalOptions.push(element);
                // @ts-ignore Something is broken here lol
                const temp = this.config["rollup-globals"][element];
                if (temp) {
                    this.transpiler.rollup.outputGlobals.set(element, temp);
                }
            }
        }

        if (this.config.imports) {
            for (const element in this.config.imports) {
                this.transpiler.rollup.externalOptions.push(element);
                if (element) {
                    this.transpiler.rollup.outputGlobals.set(element, element.replaceAll("/", ""));
                }
            }
        }
    }

    private autoRoute = (path: string) => {
        for (const dirEntry of Deno.readDirSync(path)) {
            let val = dirEntry.name;
            if (!val.startsWith("_")) {
                if (!val.includes(".")) {
                    val = this.patchRoute(path + val);
                    this.autoRoute(val);
                }
                if (val.includes(this.config.webRootPath)) {
                    val = val.replace(this.config.webRootPath, "");
                }
                if (val.startsWith("App") && val.match("html|jsx|tsx|svelte|vue|md")) {
                    const filePath = "/" + (path + val).replace(this.config.webRootPath, "");
                    const fileRoute = filePath.split("/");
                    fileRoute.pop();
                    const temp = fileRoute.join("/").split(".").pop();
                    if (typeof temp == "string") {
                        this.get(fileRoute.join("/") + "/", async (_req, res) => {
                            await this.handleMIME(res, filePath + "/", temp, true);
                        });
                    }
                } else if (val.includes(".")) {
                    const filePath = "/" + (path + val).replace(this.config.webRootPath, "");
                    const temp = filePath.split(".").pop();
                    if (typeof temp == "string") {
                        this.get(filePath.replace(this.config.webRootPath, "/"), async (_req, res) => {
                            await this.handleMIME(res, filePath + "/", temp);
                        })
                    }
                }
            }
          }          
    }

    private patchRoute = (route: string) => {
        let copy = route.replaceAll("//", "/");
        if (copy[copy.length-1] != "/") {
            copy += "/";
        }
        return copy;
    }

    setWebRoot = (path: string) => {
        this.config.webRootPath = path;
        if (this.config.webRootPath[path.length-1] != '/') {
            this.config.webRootPath += "/"
        }
        this.config.webRootPath = this.config.webRootPath.replaceAll("//", "/");
    }

    setCacheRoot = (path: string) => {
        this.config.cacheRootPath = path;
        if (this.config.cacheRootPath[path.length-1] != '/') {
            this.config.cacheRootPath += "/"
        }
        this.config.cacheRootPath = this.config.cacheRootPath.replaceAll("//", "/");
    }

    registerMIME = (fileExtensions: Array<string>, contentTypes: Array<string>) => {
        fileExtensions.forEach((val, index) => {
            this.fileExtensionDb.set(val, contentTypes[index]);
        });
    }

    handleMIME = async (res: DinosaurusResponse, path: string, fileExtension: string, isApp=false) => {
        const filePath = path.slice(0, path.length-1);
        const contentType = this.fileExtensionDb.get(fileExtension);
        if (filePath.endsWith("mts") || filePath.endsWith("mjs")) {
            const cacheData = this.cacheHandler.handleCache(filePath, null, "js");
            if (typeof cacheData == "string") {
                res.send(cacheData);
                return;
            }
            res.send(await Deno.readTextFile(this.config.webRootPath + filePath));
            // res.send(await this.transpiler.transpileTs(await readFile(this.config.webRootPath + filePath, {encoding: "utf-8"}), filePath));
        } else if (filePath.endsWith("jsx") || filePath.endsWith("tsx")) {
            let cacheData: string | null | undefined;

            if (filePath.match("App.jsx|App.tsx")) {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "html");
            } else {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "js");
            }

            if (cacheData) {
                res.send(cacheData);
                return;
            }
            res.send(await Deno.readTextFile(this.config.webRootPath + filePath));
            // res.send(await this.transpiler.transpileJsx(await readFile(this.config.webRootPath + filePath, {encoding: "utf-8"}), filePath));
        } else if (filePath.endsWith("ts")) {
            const cacheData = await this.cacheHandler.handleCache(filePath, null, "js");
            if (typeof cacheData == "string") { 
                res.send(cacheData);
                if (contentType) {
                    res.headers.set("content-type", contentType);
                }
                return;
            }
            res.send(await this.transpiler.transpileTs(this.config.webRootPath + filePath, filePath));
            // res.send(await this.transpiler.transpileTs(await readFile(this.config.webRootPath + filePath, {encoding: "utf-8"}), filePath));
        } else if (filePath.endsWith("svelte")) {
            let cacheData: string | null | undefined;

            if (filePath.match("App.svelte")) {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "html");
            } else {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "js");
            }

            if (cacheData) {
                res.send(cacheData);
                return;
            }
            res.send(await this.transpiler.transpileSvelte(await Deno.readTextFile(this.config.webRootPath + filePath),
                                                        this.config.webRootPath + filePath));
            // res.send(await this.transpiler.transpileSvelte(await readFile(this.config.webRootPath + filePath, {encoding: "utf-8"}), filePath));
        } else if (filePath.endsWith("md")) {
            const cacheData = this.cacheHandler.handleCache(filePath, null, "html");
            if (typeof cacheData == "string") {
                res.send(cacheData);
                return;
            }
            res.send(await Deno.readTextFile(this.config.webRootPath + filePath));
            // res.send(await this.transpiler.transpileMarkdown(await readFile(this.config.webRootPath + filePath, {encoding: "utf-8"}), filePath));
        } else if (filePath.endsWith("vue")) {
            let cacheData: string | null | undefined;
            const temp = this.fileExtensionDb.get("html");

            if (filePath.match("App.vue")) {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "html");
                if (temp) {
                    res.headers.set("content-type", temp);
                }
            } else {
                cacheData = await this.cacheHandler.handleCache(filePath, null, "js");
            }

            if (typeof cacheData == "string") {
                res.send(cacheData);
                return;
            }

            res.send(await this.transpiler.transpileVue(await Deno.readTextFile(this.config.webRootPath + filePath),
                                                        this.config.webRootPath + filePath, this.config["vue-head"]));
        } else {
            res.sendFile(filePath);
        }
        
        if (isApp) {
            const temp = this.fileExtensionDb.get("html");
            if (temp) {
                res.headers.set("content-type", temp);
            }
        } else {
            if (contentType) {
                res.headers.set("content-type", contentType);
            }
        }
    }

    private handler = async (req: Request): Promise<Response> => {
        this.router.setRoute(req.url);
        const func = this.router.parseRoute(req.method);
        const dinosaurusRes = new DinosaurusResponse(this.config.webRootPath);
        if (func) {
            const dinosaurusReq = new DinosaurusRequest(req.clone(), this.router.routeQuery, this.router.routeParams);
            await func(dinosaurusReq, dinosaurusRes);
            return dinosaurusRes.constructResponse();
        } else {
            if (this.router.fileExtension) {
                if (typeof this.router.route == "string") {
                    this.handleMIME(dinosaurusRes, this.router.route, this.router.fileExtension);
                }

                return dinosaurusRes.constructResponse();
                }
            }
        return new Response("¯\\_(ツ)_/¯ unknown route", {headers: {"content-type": "text/html; charset=UTF-8"}});
    }

    run = (serverPort = 3000, func?: () => void) => {
        serve(this.handler, { port: serverPort });
        func?.();
        Deno.addSignalListener("SIGINT", () => {
            this.transpiler.purgeBundles();
            Deno.exit();
        });
    }
}