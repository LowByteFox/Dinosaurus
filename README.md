# Dinosaurus
### HTTP framework for Deno ported from ![Buchta](https://github.com/Fire-The-Fox/buchta)

## Get Started
Create empty directory
Enter the directory
create dinosaurus.config.json
```json
{
    "webRootPath"   : "./public",
    "cacheRootPath" : "./.cache"
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
* Working Transpilation
