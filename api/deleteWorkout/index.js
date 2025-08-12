const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const database = client.database("workoutsdb");
const container = database.container("workouts");

module.exports = async function (context, req) {
    const p = req.headers["x-ms-client-principal"];
    const user = p ? JSON.parse(Buffer.from(p, "base64")) : null;
    if (!user) { context.res = { status: 401, body: "Not logged in" }; return; }

    const id = req.query.id;
    if (!id) { context.res = { status: 400, body: "Missing id" }; return; }

    try {
        await container.item(id, user.userId).delete();
        context.res = { status: 200, body: "Deleted" };
    } catch (err) {
        console.error(err);
        context.res = { status: 500, body: "Error deleting item" };
    }
};
