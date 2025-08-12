const crypto = require("crypto");
const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const DB = "workoutsdb";
const CT = "workouts";
const ALLOWED = new Set(["L","R","LR","Core","Back","Legs"]);

module.exports = async function (context, req) {
    try {
        // read user from SWA auth header (preferred)
        const p = req.headers["x-ms-client-principal"];
        const claims = p ? JSON.parse(Buffer.from(p, "base64")) : null;
        const userId = claims?.userId || req.body?.userId; // fallback for console tests

        if (!userId) {
            return (context.res = { status: 401, headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ error: "Not logged in and no userId provided" }) });
        }

        const { date, target, weight_kg, reps, exercise = "ex_name" } = req.body || {};
        if (!date || !ALLOWED.has(target) || !Number.isFinite(weight_kg) || !Number.isInteger(reps)) {
            return (context.res = { status: 400, headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ error: "Invalid payload" }) });
        }

        const item = {
            id: crypto.randomUUID(),
            userId, date, target, weight_kg, reps, exercise,
            createdAt: new Date().toISOString()
        };

        // let SDK infer the partition key from item.userId
        const container = client.database(DB).container(CT);
        await container.items.upsert(item);

        context.res = { status: 201, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, id:item.id }) };
    } catch (e) {
        console.error(e);
        context.res = { status: 500, headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ error: e.message || String(e) }) };
    }
};
