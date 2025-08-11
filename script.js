async function showUser() {
    const res = await fetch('/.auth/me');
    if (!res.ok) {
        document.getElementById('user-info').textContent = 'Not logged in';
        return;
    }

    const data = await res.json();
    if (data.clientPrincipal) {
        document.getElementById('user-info').textContent =
            `Logged in as: ${data.clientPrincipal.userDetails}`;
    } else {
        document.getElementById('user-info').textContent = 'Not logged in';
    }
}

async function loadTable() {
    const res = await fetch('/api/getTable');
    if (!res.ok) { console.error('Not authorized or error'); return; }
    const rows = await res.json();
    const tbody = document.querySelector('#workouts tbody');
    tbody.innerHTML = rows.map(r =>
        `<tr><td>${r.date}</td><td>${r.exercise}</td><td>${r.sets}</td><td>${r.reps}</td><td>${r.weight_kg}</td></tr>`
    ).join('');
}

// Run showUser() when the page loads
showUser();
