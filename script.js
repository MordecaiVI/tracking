// ---------- helpers ----------
function td(text) {
    const el = document.createElement('td');
    el.textContent = String(text ?? '');
    return el;
}

function actionCell(id) {
    const tdEl = document.createElement('td');
    tdEl.className = 'actions-cell';

    const edit = document.createElement('button');
    edit.className = 'icon-btn edit-btn';
    edit.innerHTML = '<i class="fas fa-pen"></i>';
    edit.addEventListener('click', () => editSet(id));

    const del = document.createElement('button');
    del.className = 'icon-btn remove-btn';
    del.innerHTML = '<i class="fas fa-trash"></i>';
    del.addEventListener('click', () => removeSet(id));

    tdEl.append(edit, del);
    return tdEl;
}

function maskEmail(e = '') {
    const [name, domain] = String(e).split('@');
    if (!name || !domain) return e;
    const head = name.slice(0, Math.min(4, name.length));
    return `${head}•••@${domain}`;
}

// ---------- table loader ----------
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

        const res = await fetch('/api/getTable', { credentials: 'include' });
        if (!res.ok) {
            console.error('getTable failed:', res.status, await res.text());
            return;
        }

        const rows = await res.json();
        const tbody = document.querySelector('#workouts tbody');
        tbody.innerHTML = '';

        for (const r of rows) {
            const tr = document.createElement('tr');
            tr.append(
                td(r.date),
                td(r.exercise),
                td(r.target),
                td(r.weight_kg),
                td(r.reps),
                actionCell(r.id)
            );
            tbody.append(tr);
        }
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

// ---------- actions ----------
async function editSet(id) {
    const newReps = prompt('Enter new reps:');
    const newKg = prompt('Enter new weight (kg):');
    if (newReps == null || newKg == null) return; // user cancelled

    try {
        const res = await fetch(`/api/updateWorkout?id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reps: parseInt(newReps, 10),
                weight_kg: parseFloat(newKg)
            })
        });

        if (!res.ok) {
            console.error('updateWorkout failed:', res.status, await res.text());
            alert('Could not update the set. Please try again.');
            return;
        }
        await loadTable();
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
}

async function removeSet(id) {
    if (!confirm('Are you sure you want to remove this set?')) return;
    try {
        const res = await fetch(`/api/deleteWorkout?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!res.ok) {
            console.error('deleteWorkout failed:', res.status, await res.text());
            alert('Could not remove the set. Please try again.');
            return;
        }
        await loadTable();
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
}

// ---------- form ----------
(function setToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const el = document.getElementById('date');
    if (el) el.value = `${yyyy}-${mm}-${dd}`;
})();

const form = document.getElementById('add-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('form-msg');

        const payload = {
            date: document.getElementById('date').value,
            exercise: document.getElementById('exercise').value.trim().slice(0, 60) || 'exercise',
            target: document.getElementById('target').value,
            reps: parseInt(document.getElementById('reps').value, 10),
            weight_kg: parseFloat(document.getElementById('kg').value)
        };

        if (!payload.date || !Number.isInteger(payload.reps) || !Number.isFinite(payload.weight_kg)) {
            msg.textContent = 'Please fill all fields correctly.';
            return;
        }

        try {
            const res = await fetch('/api/addWorkout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                console.error('addWorkout failed:', res.status, await res.text());
                msg.textContent = 'Could not save. Please try again.';
                return;
            }

            msg.textContent = 'Saved!';
            await loadTable();
            setTimeout(() => (msg.textContent = ''), 1200);
        } catch (err) {
            console.error(err);
            msg.textContent = 'Network error';
        }
    });
}

// ---------- auth / UI ----------
async function showUser() {
    const info = document.getElementById('user-info');
    const login = document.getElementById('loginBtn');
    const logout = document.getElementById('logoutBtn');

    const authedEls = [
        document.getElementById('add-form'),
        document.getElementById('workouts')
    ];

    const setUI = (loggedIn, user = '') => {
        info.textContent = loggedIn ? `Welcome back ${user}!` : 'Please login to start tracking';
        if (login) login.style.display = loggedIn ? 'none' : '';
        if (logout) logout.style.display = loggedIn ? '' : 'none';
        authedEls.forEach(el => el && (el.style.display = loggedIn ? '' : 'none'));
        if (loggedIn) loadTable();
    };

    try {
        const res = await fetch('/.auth/me', { credentials: 'include' });
        if (!res.ok) return setUI(false);
        const data = await res.json();
        const cp = data?.clientPrincipal;
        setUI(!!cp, cp?.userDetails || '');
    } catch (e) {
        console.error(e);
        setUI(false);
    }
}

// ---------- boot ----------
document.addEventListener('DOMContentLoaded', function () {
    flatpickr('#date', { dateFormat: 'Y-m-d' });
    showUser();
});
