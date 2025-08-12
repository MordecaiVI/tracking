async function loadTable() {
    const btn = document.getElementById('loadBtn');

    try {
        // Start loading state
        if (btn) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = 'Loading...';
            btn.classList.add('loading');
            btn.disabled = true;
        }

        const res = await fetch('/api/getTable', {credentials: 'include'});
        if (!res.ok) {
            console.error('Not authorized or error');
            return;
        }

        const rows = await res.json();
        const tbody = document.querySelector('#workouts tbody');
        tbody.innerHTML = rows.map(r =>
            `<tr>
            <td>${r.date}</td>
            <td>${r.exercise}</td>
            <td>${r.target}</td>
            <td>${r.weight_kg}</td>
            <td>${r.reps}</td>
            <td class="actions-cell">
                <button class="icon-btn edit-btn" onclick="editSet('${r.id}')">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="icon-btn remove-btn" onclick="removeSet('${r.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
            </tr>`
        ).join('');




    } catch (err) {
        console.error('Error loading table:', err);
    } finally {
        // End loading state
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.textContent = btn.dataset.originalText || 'Load My Workouts';
        }
    }
}

async function editSet(id) {
    const newReps = prompt("Enter new reps:");
    const newKg = prompt("Enter new weight (kg):");
    if (!newReps || !newKg) return;

    try {
        const res = await fetch(`/api/updateWorkout?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                reps: parseInt(newReps, 10),
                weight_kg: parseFloat(newKg)
            })
        });

        if (!res.ok) {
            alert(`Error updating set: ${await res.text()}`);
            return;
        }
        await loadTable(); // refresh table
    } catch (err) {
        console.error(err);
        alert("Network error");
    }
}


async function removeSet(id) {
    if (!confirm("Are you sure you want to remove this set?")) return;
    try {
        const res = await fetch(`/api/deleteWorkout?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) {
            alert(`Error removing set: ${await res.text()}`);
            return;
        }
        await loadTable(); // refresh
    } catch (err) {
        console.error(err);
        alert("Network error");
    }
}

// set default date to today
(function setToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const el = document.getElementById('date');
    if (el) el.value = `${yyyy}-${mm}-${dd}`;
})();

// handle submit
const form = document.getElementById('add-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('form-msg');

        const payload = {
            date: document.getElementById('date').value,
            exercise: document.getElementById('exercise').value.trim().slice(0, 60) || "exercise",
            target: document.getElementById('target').value,       // required by your API
            reps: parseInt(document.getElementById('reps').value, 10),
            weight_kg: parseFloat(document.getElementById('kg').value)
        };

        // basic client-side validation
        if (!payload.date || !Number.isInteger(payload.reps) || !Number.isFinite(payload.weight_kg)) {
            msg.textContent = "Please fill all fields correctly.";
            return;
        }

        try {
            const res = await fetch('/api/addWorkout', {
                method: 'POST',
                credentials: 'include', // send SWA auth cookie
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const text = await res.text();
            if (!res.ok) {
                msg.textContent = `Error: ${text || res.status}`;
                return;
            }

            msg.textContent = "Saved!";
            // refresh table
            await loadTable();
            setTimeout(() => (msg.textContent = ''), 1200);
        } catch (err) {
            msg.textContent = `Network error`;
            console.error(err);
        }
    });
}

async function showUser() {
    const info = document.getElementById('user-info');
    const login = document.getElementById('loginBtn');
    const logout = document.getElementById('logoutBtn');

    // parts only visible when authenticated
    const authedEls = [
        document.getElementById('add-form'),
        document.getElementById('workouts')
    ];

    const setUI = (loggedIn, user = '') => {
        info.textContent = loggedIn ? `Logged in as: ${user}` : 'login to start logging';
        if (login) login.style.display = loggedIn ? 'none' : '';
        if (logout) logout.style.display = loggedIn ? '' : 'none';
        authedEls.forEach(el => el && (el.style.display = loggedIn ? '' : 'none'));

        if (loggedIn) loadTable();   // <-- auto-load sets when logged in
    };

    try {
        const res = await fetch('/.auth/me', {credentials: 'include'});
        if (!res.ok) return setUI(false);
        const data = await res.json();
        const cp = data?.clientPrincipal;
        setUI(!!cp, cp?.userDetails || '');
    } catch (e) {
        console.error(e);
        setUI(false);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    flatpickr("#date", {
        dateFormat: "Y-m-d" // forces YYYY-MM-DD
    });
    showUser();
});
