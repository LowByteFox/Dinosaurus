import { bundle, emit } from "../deps.ts";
import { DinosaurusCache } from "./dinosaurus-cache.ts";
import { DinosaurusRollup } from "./dinosaurus-rollup.ts";
import { randomStr } from "./dinosaurus-utils.ts";

const svelteHtmlTemplate = (code: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    
</body>
<script type="module">
${code}
new app({target: document.body});
</script>
</html>
`;
}

const vueHtmlTemplate = (code: string, head: Array<string>) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://unpkg.com/vue@3"></script>
    ${head.join("\n")}
</head>
<body>
</body>
<script>
    ${code}
    Vue.createApp(app).mount(document.body);
</script>
</html>
`;
}

export class DinosaurusTranspiler {
    private imports: Map<string, string>;
    private bundleFolder = `_${randomStr(10)}`;
    private cacheManager: DinosaurusCache;
    rollup: DinosaurusRollup;
    private webRootPath: string;

    constructor(imports: Map<string, string>, cache: DinosaurusCache, webRoot: string) {
        this.cacheManager = cache;
        this.imports = imports;
        this.rollup = new DinosaurusRollup();
        this.webRootPath = webRoot;
        Deno.mkdirSync(`${this.webRootPath}/${this.bundleFolder}`);
    }

    transpileTs = async (filePath: string, fileName: string): Promise<string> => {
        const url = new URL(await Deno.realPath(filePath), "file://");
        const result = await emit(url);

        const transpiled = result[url.href];
        this.cacheManager.handleCache(fileName, transpiled, "js");
        return new Promise(function(Resolve, Reject) {
            Resolve(transpiled);
            Reject("");
        });
    }

    transpileSvelte = async (code: string, filePath: string): Promise<string> => {
        let transpiled = code;
        transpiled = await this.rollup.build(filePath, this.webRootPath);
        transpiled = await this.patchScript(transpiled);
        if (filePath.match("App.svelte")) {
            transpiled = svelteHtmlTemplate(transpiled);
            this.cacheManager.handleCache(filePath.replace(this.webRootPath, ""), transpiled, "html");
        } else {
            this.cacheManager.handleCache(filePath.replace(this.webRootPath, ""), transpiled, "js");
        }
        return new Promise(function(Resolve, Reject) {
            Resolve(transpiled);
            Reject("");
        });
    }

    transpileVue = async (code: string, filePath: string, head: Array<string>): Promise<string> => {
        let transpiled = code;
        // transpiled = await this.patchScript(transpiled);
        transpiled = await this.rollup.build(filePath, this.webRootPath);
        if (filePath.match("App.vue")) {
            transpiled = vueHtmlTemplate(transpiled, head);
            this.cacheManager.handleCache(filePath.replace(this.webRootPath, ""), transpiled, "html");
        } else {
            this.cacheManager.handleCache(filePath.replace(this.webRootPath, ""), transpiled, "js");
        }
        return new Promise(function(Resolve, Reject) {
            Resolve(transpiled);
            Reject("");
        });
    }

    patchScript = async (code: string): Promise<string> => {
        let start = "";
        for (const element in this.imports) {
            // @ts-ignore Ne
            const result = await bundle(new URL(this.imports[element] as string));
            const bundleCode = result.code;
            await Deno.writeTextFile(`${this.webRootPath}/${this.bundleFolder}/${element.replaceAll("/", "")}.bundle.js`, bundleCode);
            start += `import * as ${element.replaceAll("/", "")} from \"/${this.bundleFolder}/${element.replaceAll("/", "")}.bundle.js\"\n`;
        }

        start += code;

        return new Promise(function(Resolve, Reject) {
            Resolve(start);
            Reject("");
        });
    }

    purgeBundles = () => {
        Deno.removeSync(`${this.webRootPath}/${this.bundleFolder}/`, {recursive: true});
    }
}