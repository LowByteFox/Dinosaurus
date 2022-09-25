import { rollup } from "../deps.ts";
import vue from 'npm:rollup-plugin-vue';
import svelte from 'npm:rollup-plugin-svelte';
import { randomStr } from "./dinosaurus-utils.ts";

import "npm:vue";
import "npm:svelte";

export class DinosaurusRollup {
    externalOptions = new Array<string>();
    outputGlobals = new Map<string, string>();

    constructor() {
        this.externalOptions.push("vue");
        this.outputGlobals.set("vue", "Vue");
    }

    build = async (fileName: string, webRootPath: string): Promise<string> => {
        const inOpts = {
            input: fileName,
            external: [...this.externalOptions],
            plugins: [
                vue(),
                svelte()
            ]
        }

        const outOpts = {
            format: 'iife',
            name: "app",
            file: `${webRootPath}/${randomStr(7)}.js`,
            globals: Object.fromEntries(this.outputGlobals)
        }

        let bundle;
        try {
            bundle = await rollup(inOpts);
        } catch (error) {
            console.error(error);
        }

        if (bundle) {
            // @ts-ignore Ts doesn't like something
            const temp = await bundle.write(outOpts);
            await Deno.remove(`${webRootPath}/${temp.output[0].fileName}`)
            await bundle.close();
            return new Promise(function(Resolve, Reject) {
                Resolve(temp.output[0].code);
                Reject("");
            });
        }
        return new Promise(function(Resolve, Reject) {
            Resolve("");
            Reject("");
        });
    }
}