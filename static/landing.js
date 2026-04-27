document.addEventListener('DOMContentLoaded', () => {
    
    let csrfToken = '';
    
    // Fetch and store CSRF token on page load
    fetch(window.API_URL + '/api/csrf-token')
        .then(res => res.json())
        .then(data => {
            csrfToken = data.csrf_token;
        })
        .catch(err => console.log('Warning: CSRF token fetch failed', err));
    
    // Tab Switching
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    function switchTab(tab) {
        // Reset styles and hide errors
        tabLogin.classList.remove('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('active');
        formRegister.classList.remove('active');
        loginError.innerText = '';
        registerError.innerText = '';

        if (tab === 'login') {
            tabLogin.classList.add('active');
            formLogin.classList.add('active');
        } else {
            tabRegister.classList.add('active');
            formRegister.classList.add('active');
        }
    }

    tabLogin.addEventListener('click', () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));

    // Form Submissions
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.innerText = '';
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = formLogin.querySelector('button');
        const origHtml = btn.innerHTML;
        
        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            const res = await fetch(window.API_URL + '/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                loginError.innerText = data.error;
                return;
            }

            // Success, store user ID for fallback and go to main app
            localStorage.setItem('skillsnap_user_id', data.user_id);
            window.location.href = 'index.html';

        } catch (error) {
            loginError.innerText = 'Network error. Please try again.';
        } finally {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    });

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.innerText = '';
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const btn = formRegister.querySelector('button');
        const origHtml = btn.innerHTML;

        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            const res = await fetch(window.API_URL + '/api/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                registerError.innerText = data.error;
                return;
            }

            // Success, store user ID for fallback and go to main app
            localStorage.setItem('skillsnap_user_id', data.user_id);
            window.location.href = 'index.html';

        } catch (error) {
            registerError.innerText = 'Network error. Please try again.';
        } finally {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    });

    // Auth Check: If already logged in, go to app
    async function checkExistingSession() {
        try {
            const resp = await fetch(window.API_URL + '/api/dashboard', {
                credentials: 'include'
            });
            const data = await resp.json();
            if (data.logged_in) {
                window.location.href = 'index.html';
            }
        } catch (e) {
            console.log('No active session or server down');
        }
    }
    
    checkExistingSession();
});
