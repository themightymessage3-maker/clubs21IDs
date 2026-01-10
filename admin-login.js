document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLoginStatus = document.getElementById('admin-login-status');
    const API_URL = 'https://id-cards-site-backend.onrender.com'; // Your backend URL

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        adminLoginStatus.textContent = 'Logging in...';
        adminLoginStatus.style.color = '#333';

        const username = adminLoginForm.username.value;
        const password = adminLoginForm.password.value;

        try {
            const response = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed.');
            }

            // Store admin user data in localStorage
            localStorage.setItem('admin_user', JSON.stringify(result.user));
            
            // Redirect to the admin panel
            window.location.href = 'admin.html';

        } catch (error) {
            console.error('Admin login error:', error);
            adminLoginStatus.textContent = `Error: ${error.message}`;
            adminLoginStatus.style.color = 'red';
        }
    });
});
