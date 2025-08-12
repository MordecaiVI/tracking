const { CosmosClient } = require("@azure/cosmos");

const client = new CosmosClient(process.env.COSMOS_CONN_STRING);
const database = client.database("workoutsdb");
const container = database.container("workouts");

module.exports = async function (context, req) {
    try {
        // Require login (SWA passes user in this header)
        const p = req.headers["x-ms-client-principal"];
        const user = p ? JSON.parse(Buffer.from(p, "base64")) : null;
        if (!user) {
            context.res = { status: 401, body: "Not logged in" };
            return;
        }

        // Return only the fields your UI expects (no 'sets', include 'target')
        const query = {
            query:
                "SELECT c.id, c.date, c.exercise, c.reps, c.weight_kg, c.target " +
                "FROM c WHERE c.userId = @uid " +
                "ORDER BY c.date DESC, c.createdAt DESC",
            parameters: [{ name: "@uid", value: user.userId }]
        };

        // Provide partitionKey for efficiency
        const { resources } = await container.items
            .query(query, { partitionKey: user.userId })
            .fetchAll();

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: resources
        };
    } catch (err) {
        // Helpful error body during debugging
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: String(err.message || err) })
        };
    }
};
