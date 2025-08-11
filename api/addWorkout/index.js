const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const container = client.database("workoutsdb").container("workouts");

const ALLOWED = new Set(["L","R","LR","Core","Back","Legs"]);

module.exports = async function (context, req) {
    const p = req.headers["x-ms-client-principal"];
    const user = p ? JSON.parse(Buffer.from(p, "base64")) : null;
    if (!user) return (context.res = { status: 401, body: "Not logged in" });

    const { date, target, weight_kg, reps, exercise = "ex_name" } = req.body || {};
    if (!date || !ALLOWED.has(target) || !Number.isFinite(weight_kg) || !Number.isInteger(reps))
        return (context.res = { status: 400, body: "Invalid payload" });

    const item = {
        id: crypto.randomUUID(),
        userId: user.userId,
        date, target, weight_kg, reps, exercise,
        createdAt: new Date().toISOString()
    };

    await container.items.upsert(item, { partitionKey: user.userId });
    context.res = { status: 201, body: { ok: true, id: item.id } };
};
