module.exports = async function (context, req) {
    // Optional: read logged-in user info
    const principalHeader = req.headers['x-ms-client-principal'];
    const user = principalHeader ? JSON.parse(Buffer.from(principalHeader, 'base64')) : null;

    const rows = [
        { date: "2025-08-11", exercise: "Squat", sets: 5, reps: 5, weight_kg: 80 },
        { date: "2025-08-12", exercise: "Bench", sets: 5, reps: 5, weight_kg: 60 },
    ];

    context.res = { status: 200, body: rows };
};
