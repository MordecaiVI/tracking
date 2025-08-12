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
            <td>${r.reps}</td>
            <td>${r.weight_kg}</td>
            <td>${r.target}</td>
         </tr>`
    ).join('');
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

// Prevent date picker from closing and immediately reopening
const dateInput = document.getElementById('date');
if (dateInput) {
    let suppressNextClick = false;

    dateInput.addEventListener('pointerdown', (e) => {
        // If it's already focused, the picker is open → close it and suppress the next click
        if (document.activeElement === dateInput) {
            suppressNextClick = true;
            e.preventDefault();            // stop Chrome from starting a new open
            dateInput.blur();              // closes the picker
            dateInput.classList.add('no-pointer');
            setTimeout(() => dateInput.classList.remove('no-pointer'), 200); // brief shield
        }
    });

    dateInput.addEventListener('click', (e) => {
        if (suppressNextClick) {
            e.preventDefault();
            e.stopImmediatePropagation();
            suppressNextClick = false;
        }
    });
}


// handle submit
const form = document.getElementById('add-form');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('form-msg');

        const payload = {
            date: document.getElementById('date').value,
            exercise: document.getElementById('exercise').value.trim().slice(0, 60) || "ex_name",
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
                headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/.auth/me');
    const info = document.getElementById('user-info');
    const login = document.getElementById('loginBtn');
    const logout = document.getElementById('logoutBtn');

    if (!res.ok) {
        info.textContent = 'Not logged in';
        login.style.display = '';
        logout.style.display = 'none';
        return;
    }

    const data = await res.json();
    const loggedIn = !!data.clientPrincipal;
    info.textContent = loggedIn
        ? `Logged in as: ${data.clientPrincipal.userDetails}`
        : 'Not logged in';
    login.style.display  = loggedIn ? 'none' : '';
    logout.style.display = loggedIn ? '' : 'none';
}

// Run showUser() when the page loads
showUser();