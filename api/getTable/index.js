const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const database = client.database("workoutsdb");
const container = database.container("workouts");

module.exports = async function (context, req) {
    const p = req.headers["x-ms-client-principal"];
    const user = p ? JSON.parse(Buffer.from(p, "base64")) : null;
    if (!user) { context.res = { status: 401, body: "Not logged in" }; return; }

    const query = {
        query: "SELECT c.id, c.date, c.exercise, c.reps, c.weight_kg, c.target FROM c WHERE c.userId = @uid ORDER BY c.date DESC",
        parameters: [{ name: "@uid", value: user.userId }]
    };

    const { resources } = await container.items.query(query).fetchAll();
    context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: resources };
};
