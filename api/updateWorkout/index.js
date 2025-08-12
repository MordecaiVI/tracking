const { CosmosClient } = require("@azure/cosmos");
const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const database = client.database("workoutsdb");
const container = database.container("workouts");

module.exports = async function (context, req) {
    if (req.method === "OPTIONS") {
        // Handle CORS preflight
        context.res = {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "PUT, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        };
        return;
    }

    const p = req.headers["x-ms-client-principal"];
    const user = p ? JSON.parse(Buffer.from(p, "base64")) : null;
    if (!user) {
        context.res = { status: 401, body: "Not logged in" };
        return;
    }

    const id = req.query.id;
    if (!id) {
        context.res = { status: 400, body: "Missing workout id" };
        return;
    }

    const { reps, weight_kg } = req.body || {};
    if (!Number.isInteger(reps) || !Number.isFinite(weight_kg)) {
        context.res = { status: 400, body: "Invalid data" };
        return;
    }

    try {
        // Fetch the existing item
        const { resource } = await container.item(id, user.userId).read();
        if (!resource) {
            context.res = { status: 404, body: "Workout not found" };
            return;
        }

        // Update fields
        resource.reps = reps;
        resource.weight_kg = weight_kg;

        // Replace item
        await container.item(id, user.userId).replace(resource);

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: resource
        };
    } catch (err) {
        console.error(err);
        context.res = { status: 500, body: "Server error" };
    }
};
