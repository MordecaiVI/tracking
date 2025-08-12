const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const DB = "workoutsdb";
const CT = "workouts";

module.exports = async function (context, req) {
    // require login
    const p = req.headers["x-ms-client-principal"];
    const claims = p ? JSON.parse(Buffer.from(p, "base64")) : null;
    const userId = claims?.userId;
    if (!userId) {
        context.res = { status: 401, body: "Not logged in" };
        return;
    }

    const container = client.database(DB).container(CT);

    // Return the fields your table expects, including `target`
    const querySpec = {
        query:
            "SELECT c.date, c.exercise, c.reps, c.weight_kg, c.target " +
            "FROM c WHERE c.userId = @userId " +
            "ORDER BY c.date DESC, c.createdAt DESC",
        parameters: [{ name: "@userId", value: userId }]
    };

    const { resources } = await container.items.query(querySpec, {
        partitionKey: userId
    }).fetchAll();

    context.res = { status: 200, headers: { "Content-Type": "application/json" }, body: resources };
};
