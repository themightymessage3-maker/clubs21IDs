document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://id-cards-site-backend.onrender.com'; // Your backend URL
    const allOrdersContainer = document.getElementById('all-orders-container');
    const currentBtcAddressSpan = document.getElementById('current-btc-address');
    const updateBtcForm = document.getElementById('update-btc-form');
    const newBtcAddressInput = document.getElementById('new-btc-address');
    const settingsUpdateStatus = document.getElementById('settings-update-status');
    const updateAdminCredsForm = document.getElementById('update-admin-creds-form');
    const newAdminUsernameInput = document.getElementById('new-admin-username');
    const newAdminPasswordInput = document.getElementById('new-admin-password');
    const newAdminPasswordConfirmInput = document.getElementById('new-admin-password-confirm');
    const adminCredsStatus = document.getElementById('admin-creds-status');

    let userData = null;

    // Function to check if user is logged in and an admin
    const checkAdminStatus = () => {
        const adminUser = localStorage.getItem('admin_user');
        if (!adminUser) {
            // If no admin user data, redirect to admin login
            window.location.href = 'admin-login.html';
            return;
        }
        
        userData = JSON.parse(adminUser);

        // The user is authenticated as an admin via the admin-login page.
        // We can proceed to load the data.
        loadAllOrders();
        loadBitcoinAddress();
    };

    // Function to fetch and display all orders
    const loadAllOrders = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/orders`, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userData.id // Send user ID for admin verification
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.statusText}`);
            }

            const orders = await response.json();
            renderAllOrders(orders);
        } catch (error) {
            console.error('Error loading all orders:', error);
            allOrdersContainer.innerHTML = '<p>Error loading orders. Please try again later.</p>';
        }
    };

    // Function to render all orders
    const renderAllOrders = (orders) => {
        if (orders.length === 0) {
            allOrdersContainer.innerHTML = '<p>No orders have been placed yet.</p>';
            return;
        }

        const ordersHtml = orders.map(order => `
            <div class="admin-order-card">
                <h4>Order #${order.orderNumber}</h4>
                <p><strong>User:</strong> ${order.user ? `${order.user.username} (${order.user.email})` : 'N/A'}</p>
                <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <div class="admin-order-details">
                    <h5>Items:</h5>
                    <ul>
                        ${order.items.map(item => `<li>${item.cardName} - $${item.price.toFixed(2)}</li>`).join('')}
                    </ul>
                    <h5>Billing Address:</h5>
                    <p>${formatAddress(order.billingAddress)}</p>
                    <h5>Shipping Address:</h5>
                    <p>${formatAddress(order.shippingAddress)}</p>
                </div>
            </div>
        `).join('');

        allOrdersContainer.innerHTML = ordersHtml;
    };

    // Function to format address object into a string
    const formatAddress = (addr) => {
        if (!addr) return 'Not provided';
        return `${addr.firstName || ''} ${addr.lastName || ''}<br>
                ${addr.address1 || ''}<br>
                ${addr.address2 ? addr.address2 + '<br>' : ''}
                ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}<br>
                ${addr.country || ''}`;
    };

    // Function to load the current Bitcoin address
    const loadBitcoinAddress = async () => {
        try {
            const response = await fetch(`${API_URL}/api/settings/bitcoin-address`);
            const data = await response.json();
            currentBtcAddressSpan.textContent = data.bitcoin_address;
        } catch (error) {
            console.error('Error loading Bitcoin address:', error);
            currentBtcAddressSpan.textContent = 'Could not load address.';
        }
    };

    // Event listener for the Bitcoin address update form
    updateBtcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newAddress = newBtcAddressInput.value.trim();
        if (!newAddress) {
            settingsUpdateStatus.textContent = 'Please enter an address.';
            return;
        }

        settingsUpdateStatus.textContent = 'Updating...';

        try {
            const response = await fetch(`${API_URL}/api/admin/settings/bitcoin-address`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userData.id // Admin verification
                },
                body: JSON.stringify({ bitcoin_address: newAddress })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update address.');
            }

            settingsUpdateStatus.textContent = 'Address updated successfully!';
            settingsUpdateStatus.style.color = 'green';
            currentBtcAddressSpan.textContent = result.bitcoin_address;
            newBtcAddressInput.value = '';

        } catch (error) {
            console.error('Error updating Bitcoin address:', error);
            settingsUpdateStatus.textContent = `Error: ${error.message}`;
            settingsUpdateStatus.style.color = 'red';
        }
    });

    // Event listener for updating admin credentials
    if (updateAdminCredsForm) {
        updateAdminCredsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = newAdminUsernameInput.value.trim();
            const newPassword = newAdminPasswordInput.value;
            const confirm = newAdminPasswordConfirmInput.value;

            if (newPassword && newPassword !== confirm) {
                adminCredsStatus.textContent = 'Passwords do not match.';
                adminCredsStatus.style.color = 'red';
                return;
            }

            // Must provide at least one field
            if (!newUsername && !newPassword) {
                adminCredsStatus.textContent = 'Provide a new username and/or password.';
                adminCredsStatus.style.color = 'red';
                return;
            }

            adminCredsStatus.textContent = 'Updating...';
            adminCredsStatus.style.color = '#333';

            try {
                const payload = {};
                if (newUsername) payload.username = newUsername;
                if (newPassword) payload.newPassword = newPassword;

                const response = await fetch(`${API_URL}/api/admin/settings/admin-credentials`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userData.id
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to update admin credentials.');

                adminCredsStatus.textContent = 'Admin credentials updated successfully.';
                adminCredsStatus.style.color = 'green';

                // Update localStorage admin_user to reflect new username/email
                if (result.user) {
                    localStorage.setItem('admin_user', JSON.stringify(result.user));
                    userData = result.user;
                }

                // Clear inputs
                newAdminUsernameInput.value = '';
                newAdminPasswordInput.value = '';
                newAdminPasswordConfirmInput.value = '';

            } catch (err) {
                console.error('Error updating admin credentials:', err);
                adminCredsStatus.textContent = `Error: ${err.message}`;
                adminCredsStatus.style.color = 'red';
            }
        });
    }

    // Initial check
    checkAdminStatus();

    // Logout button: clear admin_user and redirect to admin login
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            try { localStorage.removeItem('admin_user'); } catch (err) { /* ignore */ }
            // Write a small storage flag so other tabs can react if open
            try { window.localStorage.setItem('admin_logout_ts', Date.now().toString()); } catch(e){}
            window.location.href = 'admin-login.html';
        });
    }
});

// Function to switch tabs in the admin panel
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Password visibility toggles for admin password fields
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.toggle-password-btn');
    if (!btn) return;

    const targetId = btn.getAttribute('data-target');
    if (!targetId) return;

    const input = document.getElementById(targetId);
    if (!input) return;

    const isHidden = input.type === 'password';
    if (isHidden) {
        input.type = 'text';
        btn.textContent = 'Hide';
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        btn.textContent = 'Show';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Show password');
    }

    // Keep focus on the input after toggling for accessibility
    input.focus();
});

// --- Manage Catalog (localStorage-backed) ---
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const productListEl = document.getElementById('product-list');
    const productForm = document.getElementById('product-editor-form');
    const prodIndex = document.getElementById('prod-index');
    const prodName = document.getElementById('prod-name');
    const prodPrice = document.getElementById('prod-price');
    const prodImg = document.getElementById('prod-img');
    const prodImgFile = document.getElementById('prod-img-file');
    const prodImgPreview = document.getElementById('prod-img-preview');
    const prodCategory = document.getElementById('prod-category');
    const prodReset = document.getElementById('prod-reset');

    if (!productListEl || !productForm) return; // not on this page
    const API_URL = 'https://id-cards-site-backend.onrender.com';

    // Load catalog from backend (preferred). Falls back to the previous local static merge if backend is unreachable.
    async function loadCatalog() {
        // Fetch catalog from backend only
        try {
            const resp = await fetch(`${API_URL}/api/catalog`);
            if (resp.ok) {
                const items = await resp.json();
                if (Array.isArray(items)) {
                    return items.map(it => ({
                        id: it._id || it.id || '',
                        name: it.name || '',
                        price: typeof it.price !== 'undefined' ? parseFloat(it.price) : 0,
                        img: it.img || '',
                        category: it.category || '',
                        description: it.description || ''
                    }));
                }
            }
            throw new Error('Backend /api/catalog returned non-ok status or invalid data');
        } catch (err) {
            console.error('Could not fetch backend catalog:', err);
            alert('Error loading catalog from server. Please try again later.');
            return [];
        }
    }

    // Build category list from existing items (and fallback defaults)
    async function buildCategoryOptions() {
        const items = await loadCatalog();
        const set = new Set();
        items.forEach(it => { if (it && it.category) set.add(it.category); });
        if (set.size === 0) ['USA','Novelty','Scannable'].forEach(d => set.add(d));
        prodCategory.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select category';
        prodCategory.appendChild(placeholder);
        Array.from(set).forEach(cat => {
            const o = document.createElement('option');
            o.value = cat;
            o.textContent = cat;
            prodCategory.appendChild(o);
        });
        const newOpt = document.createElement('option');
        newOpt.value = '__new__';
        newOpt.textContent = 'Add new...';
        prodCategory.appendChild(newOpt);
    }

    // Create or update a catalog item via backend. Uses admin_user.id for auth header.
    async function addOrUpdateCatalogItem(item, idx) {
        const adminUser = (() => { try { return JSON.parse(localStorage.getItem('admin_user')); } catch(e){return null;} })();
        const headers = { 'Content-Type': 'application/json' };
        if (adminUser && adminUser.id) headers['x-user-id'] = adminUser.id;
        try {
            if (idx) {
                // update by id
                const resp = await fetch(`${API_URL}/api/admin/catalog/${idx}`, {
                    method: 'PUT', headers, body: JSON.stringify(item)
                });
                if (!resp.ok) throw new Error('Update failed');
            } else {
                const resp = await fetch(`${API_URL}/api/admin/catalog`, {
                    method: 'POST', headers, body: JSON.stringify(item)
                });
                if (!resp.ok) throw new Error('Create failed');
            }
            // refresh UI
            await renderCatalog();
            try { window.dispatchEvent(new Event('orderItemsUpdated')); } catch(e){}
        } catch (err) {
            console.error('Error saving catalog item:', err);
            alert('Error saving catalog item: ' + (err.message || ''));
        }
    }

    async function renderCatalog() {
        const items = await loadCatalog();
        if (!Array.isArray(items) || items.length === 0) {
            productListEl.innerHTML = '<p>No items. Use the form above to add items.</p>';
            return;
        }
        productListEl.innerHTML = items.map((it, idx) => `
            <div class="product-card" data-idx="${idx}">
                <img src="${it.img}" alt="${it.name}" onerror="this.onerror=null;this.src='assets/IDCard.png';">
                <div class="product-info">
                    <div class="product-name">${it.name}</div>
                    <div class="product-meta">${it.category || ''} — $${parseFloat(it.price).toFixed(2)}</div>
                </div>
                <div class="product-actions">
                    <button class="admin-item-edit btn btn-secondary" data-idx="${idx}">Edit</button>
                    <button class="admin-item-delete btn btn-secondary" data-idx="${idx}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Image file input -> upload to backend and preview
    if (prodImgFile) {
        prodImgFile.addEventListener('change', async function(e) {
            const f = this.files && this.files[0];
            if (!f) return;
            // build FormData
            const fd = new FormData();
            fd.append('image', f);
            // include admin id header if available
            let adminUser = null;
            try { adminUser = JSON.parse(localStorage.getItem('admin_user')); } catch (err) { adminUser = null; }
            try {
                const resp = await fetch(`${API_URL}/api/admin/upload-image`, {
                    method: 'POST',
                    headers: adminUser && adminUser.id ? { 'x-user-id': adminUser.id } : {},
                    body: fd
                });
                const result = await resp.json();
                if (!resp.ok) throw new Error(result.message || 'Upload failed');
                // set hidden input to returned URL and show preview
                console.log('Upload result:', result);
                prodImg.value = result.url || '';
                if (prodImgPreview) {
                    prodImgPreview.src = result.url || '';
                    prodImgPreview.style.display = result.url ? 'block' : 'none';
                }
            } catch (err) {
                console.error('Image upload failed', err);
                alert('Image upload failed. Please try again.');
            }
        });
    }

    // Provide a placeholder when image fails to load
    if (prodImgPreview) {
        prodImgPreview.onerror = function() {
            // show a subtle placeholder color / blank image
            prodImgPreview.style.display = 'block';
            prodImgPreview.src = 'assets/IDCard.png';
        };
    }

    // Handle selecting 'Add new...' category
    if (prodCategory) {
        prodCategory.addEventListener('change', function() {
            if (this.value === '__new__') {
                const val = prompt('Enter new category name:');
                if (val) {
                    // add to options and select it
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    // insert before the 'Add new...' option
                    this.insertBefore(opt, this.querySelector('option[value="__new__"]'));
                    this.value = val;
                } else {
                    this.value = '';
                }
            }
        });
    }

    // Add / Edit submit
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const item = {
            name: prodName.value.trim(),
            price: parseFloat(prodPrice.value) || 0,
            img: prodImg.value.trim(),
            category: prodCategory.value ? prodCategory.value.trim() : ''
        };

        const idx = prodIndex.value;
        await addOrUpdateCatalogItem(item, idx);

        // Clear only the form controls (keep the catalog intact)
        prodName.value = '';
        prodPrice.value = '';
        prodImg.value = '';
        if (prodImgFile) prodImgFile.value = '';
        if (prodImgPreview) { prodImgPreview.style.display = 'none'; prodImgPreview.src = ''; }
        prodCategory.value = '';
        prodIndex.value = '';

        // Rebuild categories to include any newly added category
        buildCategoryOptions();
    });

    prodReset.addEventListener('click', function() {
        productForm.reset();
        prodIndex.value = '';
    });

    // Delegate edit/delete
    productListEl.addEventListener('click', async function(e) {
        const editBtn = e.target.closest('.admin-item-edit');
        const delBtn = e.target.closest('.admin-item-delete');
        if (editBtn) {
            const idx = parseInt(editBtn.getAttribute('data-idx'));
            const items = await loadCatalog();
            const it = items[idx];
            if (!it) return;
            prodIndex.value = it.id || '';
            prodName.value = it.name || '';
            prodPrice.value = it.price || '';
            prodImg.value = it.img || '';
            if (prodImgPreview && it.img) {
                prodImgPreview.src = it.img;
                prodImgPreview.style.display = 'block';
            }
            // ensure category exists in select
            buildCategoryOptions();
            if (it.category) prodCategory.value = it.category;
            // switch to the Manage tab if necessary
            const tabLinks = document.querySelectorAll('.tab-link');
            tabLinks.forEach(t => t.classList.remove('active'));
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(tc => tc.style.display = 'none');
            const manageTab = document.getElementById('manageProducts');
            if (manageTab) manageTab.style.display = 'block';
            const btn = Array.from(tabLinks).find(b => b.textContent.trim() === 'Manage Catalog');
            if (btn) btn.classList.add('active');
        }
        if (delBtn) {
            const idx = parseInt(delBtn.getAttribute('data-idx'));
            if (!confirm('Delete this item?')) return;
            const items = await loadCatalog();
            const item = items[idx];
            if (!item || !item.id) {
                alert('Cannot delete item: missing ID.');
                return;
            }
            // Use backend API to delete
            const adminUser = (() => { try { return JSON.parse(localStorage.getItem('admin_user')); } catch(e){return null;} })();
            const headers = { 'Content-Type': 'application/json' };
            if (adminUser && adminUser.id) headers['x-user-id'] = adminUser.id;
            try {
                const resp = await fetch(`${API_URL}/api/admin/catalog/${item.id}`, {
                    method: 'DELETE', headers
                });
                if (!resp.ok) throw new Error('Delete failed');
                await renderCatalog();
                try { window.dispatchEvent(new Event('orderItemsUpdated')); } catch(e){}
            } catch (err) {
                console.error('Error deleting catalog item:', err);
                alert('Error deleting catalog item: ' + (err.message || ''));
            }
        }
    });

    // Initial setup
    buildCategoryOptions();
    // Initial render
    renderCatalog();
});
