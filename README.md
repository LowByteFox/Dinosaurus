# Dinosaurus
### HTTP framework for Deno ported from [Buchta](https://github.com/Fire-The-Fox/buchta)

![Dinosaurus logo](./dinosaurus_logo.png "Dinosaurus Logo")

## Get Started
Create empty directory
Enter the directory
create dinosaurus.config.json or grab one from the repository
```json
{
    "webRootPath"   : "./public",
    "cacheRootPath" : "./.cache",
    "imports": {
    },
    "vue-head": [
    ],
    "rollup-globals": {
    }
}
```
create public directory

Now you have everything set up 

## Example
```ts
import { Dinosaurus } from "https://deno.land/x/dinosaurus/mod.ts";

const app = new Dinosaurus();

app.get("/", (_req, res) => {
    res.send("hi");
});

app.get("/id/:id/", (req, res) => {
    res.send(`${req.params.get("id")} ${req.query.get("name")}`);
})

app.post("/json/", async (req, res) => {
    res.send(JSON.stringify(await req.originalReq.json()));
});

app.run(3000);
```
How to run it
```bash
deno run --allow-read --allow-write --allow-net <file>
```

## Still not implemented
* Working Transpilation for JSX, TSX
* Docs
