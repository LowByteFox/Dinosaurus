import { Dinosaurus } from "./dinosaurus.ts";

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
