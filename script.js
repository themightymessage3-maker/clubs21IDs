const API_URL = 'https://id-cards-site-backend.onrender.com/api';

// --- Product Details Page Logic (SPA) ---
// Password visibility toggle for dashboard account form
// Render addresses in dashboard from user object
function renderDashboardAddresses(user) {
	var billingBox = document.getElementById('billingAddressBox');
	var shippingBox = document.getElementById('shippingAddressBox');
	if (!billingBox || !shippingBox) return;

	const addresses = {
        billing: user.billingAddress,
        shipping: user.shippingAddress
    };

	function formatAddress(addr) {
		if (!addr || Object.keys(addr).length === 0) return '<span style="color:#bbb;">No address set.</span>';
		const addressParts = [
			addr.name,
			addr.street,
			`${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim(),
			addr.country,
			addr.phone,
			addr.email
		].filter(Boolean).filter(part => part !== ',');

		if (addressParts.length === 0) return '<span style="color:#bbb;">No address set.</span>';
		return addressParts.join('<br>');
	}
	billingBox.innerHTML = formatAddress(addresses.billing);
	shippingBox.innerHTML = formatAddress(addresses.shipping);
}

// Call when dashboard addresses tab is shown
document.addEventListener('DOMContentLoaded', function() {
	// Show addresses if tab is visible on load
	if (document.getElementById('dashboardTabAddresses') && document.getElementById('dashboardTabAddresses').style.display !== 'none') {
		populateDashboard();
	}
	// Also update on hash change to dashboard-addresses
	window.addEventListener('hashchange', function() {
		if (window.location.hash.replace(/^#/, '') === 'dashboard-addresses') {
			populateDashboard();
		}
	});
});
document.addEventListener('DOMContentLoaded', function() {
	var accountForm = document.getElementById('dashboardAccountForm');
	if (accountForm) {
        accountForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser || !currentUser.id) {
                alert('You must be logged in to update your account.');
                return;
            }

            const formData = {
                firstName: accountForm.firstName.value,
                lastName: accountForm.lastName.value,
                displayName: accountForm.displayName.value,
                email: accountForm.email.value,
            };

            try {
                const response = await fetch(`${API_URL}/user/account/${currentUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to update account.');

                alert('Account details updated successfully!');

                // Also handle password change if fields are filled
                const currentPassword = accountForm.password_current.value;
                const newPassword = accountForm.password_1.value;
                const confirmPassword = accountForm.password_2.value;

                if (currentPassword && newPassword && newPassword === confirmPassword) {
                    const passResponse = await fetch(`${API_URL}/user/password/${currentUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const passResult = await passResponse.json();
                    if (!passResponse.ok) throw new Error(passResult.message || 'Failed to update password.');
                    
                    alert('Password updated successfully!');
                    accountForm.password_current.value = '';
                    accountForm.password_1.value = '';
                    accountForm.password_2.value = '';
                } else if (newPassword && newPassword !== confirmPassword) {
                    alert('New passwords do not match.');
                }

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });

		var passwordFields = accountForm.querySelectorAll('input[type="password"]');
		var eyeButtons = accountForm.querySelectorAll('button[type="button"]');
		eyeButtons.forEach(function(btn, idx) {
			btn.addEventListener('click', function(e) {
				e.preventDefault();
				var input = passwordFields[idx];
				if (input) {
					if (input.type === 'password') {
						input.type = 'text';
						btn.querySelector('svg').style.stroke = '#03a9f4';
					} else {
						input.type = 'password';
						btn.querySelector('svg').style.stroke = '#888';
					}
				}
			});
		});
	}
});
function showProductDetailsPage(idx) {
    // Hide all articles
    document.querySelectorAll('.spa-article').forEach(function(article) {
        article.style.display = 'none';
    });
    // Remove existing product details page if any
    let prodPage = document.getElementById('productDetailsPage');
    if (prodPage) prodPage.remove();
    // Get product from backend-driven catalog
    const cards = getOrderCards();
    const card = cards && cards[idx];
    if (!card) return;
    // Create page
    prodPage = document.createElement('article');
    prodPage.id = 'productDetailsPage';
    prodPage.className = 'spa-article product-details-page';
    prodPage.style.display = '';
    // Responsive, professional layout
    prodPage.innerHTML = `
        <div class="product-details-container">
            <div class="product-details-header" style="display:flex;flex-direction:column;align-items:center;position:relative;width:100%;">
                <div id="productDetailsArrowsRow" style="display:flex;justify-content:space-between;align-items:center;width:100%;max-width:410px;">
                    <button class="product-details-arrow" id="productDetailsPrev" aria-label="Previous" style="position:static;left:auto;top:auto;transform:none;z-index:2;min-width:44px;min-height:44px;">&#8592;</button>
                    <button class="product-details-arrow" id="productDetailsNext" aria-label="Next" style="position:static;left:auto;top:auto;transform:none;z-index:2;min-width:44px;min-height:44px;">&#8594;</button>
                </div>
                <img src="${card.img}" alt="${card.name}" class="product-details-img" style="max-width:320px;width:100%;height:auto;display:block;margin:0.7rem 0;" onerror="this.onerror=null;this.src='assets/IDCard.png';">
            </div>
            <div class="product-details-info">
                <div class="product-details-title">${card.name}</div>
                <div class="product-details-price-row">
                    <span class="product-details-old-price">${card.price < 150 ? '' : '$' + (card.price * 1.2).toFixed(2)}</span>
                    <span class="product-details-price">$${card.price.toFixed(2)}</span>
                </div>
            </div>
            <form id="productDetailsForm" class="product-details-form" enctype="multipart/form-data">
                <div style="font-size:1.3rem;font-weight:700;margin-bottom:1.2rem;">Order Details</div>
                <div class="product-details-form-row"><span style="font-weight:600;">Upload Photo*</span></div>
                <div class="product-details-form-row">
                    <input type="file" name="photo" accept="image/*" required style="padding:0.4rem 0;">
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">First Name*</span></div>
                <div class="product-details-form-row">
                    <input name="firstName" placeholder="First Name" required>
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">Middle Name*</span></div>
                <div class="product-details-form-row">
                    <input name="middleName" placeholder="Middle Name" required>
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">Last Name*</span></div>
                <div class="product-details-form-row">
                    <input name="lastName" placeholder="Last Name" required>
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">Gender*</span></div>
                <div class="product-details-form-row">
                    <select name="gender" required>
                        <option value="">Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">Eye Color*</span></div>
                <div class="product-details-form-row">
                    <select name="eyeColor" required>
                        <option value="">Eye Color</option>
                        <option value="BRN">BRN-Brown</option>
                        <option value="GRN">GRN-Green</option>
                        <option value="HAZ">HAZ-Hazel</option>
                        <option value="BLU">BLU-Blue</option>
                        <option value="BLK">BLK-Black</option>
                        <option value="GRT">GRT-Gray</option>
                        <option value="SDT">SDT-Sandy</option>
                        <option value="MUL">MUL-Multicolor</option>
                    </select>
                </div>
                <div class="product-details-form-row"><span style="font-weight:600;">Hair Color*</span></div>
                <div class="product-details-form-row">
                    <select name="hairColor" required>
                        <option value="">Hair Color</option>
                        <option value="BRN">BRN-Brown</option>
						   <option value="BLK">BLK-Black</option>
						   <option value="GRT">GRT-Gray</option>
						   <option value="RED">RED-Red</option>
						   <option value="BAL">BAL-Bald</option>
						   <option value="BLN">BLN-Blonde</option>
					   </select>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Height*</span></div>
				   <div class="product-details-form-row">
					   <input name="height" placeholder="5-05 (for example)" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Weight*</span></div>
				   <div class="product-details-form-row">
					   <input name="weight" placeholder="Weight" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Birthday*</span></div>
				   <div class="product-details-form-row">
					   <input name="birthday" type="date" placeholder="mm/dd/yyyy" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Street Address*</span></div>
				   <div class="product-details-form-row">
					   <input name="streetAddress" placeholder="Address for your fake id" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">City*</span></div>
				   <div class="product-details-form-row">
					   <input name="city" placeholder="City" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Zip Code*</span></div>
				   <div class="product-details-form-row">
					   <input name="zipCode" placeholder="Zip Code" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Issue Date*</span></div>
				   <div class="product-details-form-row">
					   <input name="issueDate" type="date" placeholder="mm/dd/yyyy" required>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Driver License</span></div>
				   <div class="product-details-form-row">
					   <input name="driverLicense" placeholder="Leave blank for us to format">
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Restrictions (Corrective Lenses)*</span></div>
				   <div class="product-details-form-row">
					   <select name="restrictions" required>
						   <option value="">select</option>
						   <option value="yes">yes</option>
						   <option value="no">no</option>
					   </select>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Organ Donor (Corrective Lenses)*</span></div>
				   <div class="product-details-form-row">
					   <select name="organDonor" required>
						   <option value="">select</option>
						   <option value="Yes">Yes</option>
						   <option value="no">no</option>
					   </select>
				   </div>
				   <div class="product-details-form-row"><span style="font-weight:600;">Duplicate Quantity*</span></div>
				   <div class="product-details-form-row">
					   <select name="duplicateQty" required>
						   <option value="">select</option>
						   <option value="1">1-0$</option>
						   <option value="2">2-20$</option>
						   <option value="3">3-30$</option>
					   </select>
				   </div>
				   <input type="hidden" name="cardName" value="${card.name}">
				   <input type="hidden" name="price" value="${card.price}">
				   <input type="hidden" name="img" value="${card.img}">
				   <input type="hidden" name="category" value="${card.category}">
				   <div class="product-details-qty-row" style="display:flex;align-items:center;gap:0.7rem;margin-bottom:1rem;flex-wrap:nowrap;">
					   <button type="button" id="productDetailsMinus" style="background:#fff;border:1.5px solid #d0d7de;color:#1976d2;font-size:1.25rem;font-weight:700;line-height:1;width:32px;height:32px;border-radius:50%;cursor:pointer;transition:box-shadow 0.15s, border-color 0.15s;box-shadow:0 1px 2px rgba(25,118,210,0.06);display:flex;align-items:center;justify-content:center;outline:none;">
						   -
					   </button>
					   <input type="number" id="productDetailsQty" name="quantity" value="1" min="1" max="100" class="product-details-qty-input" required style="width:44px;text-align:center;font-size:1.08rem;padding:4px 0;border:1.5px solid #d0d7de;border-radius:7px;box-shadow:0 1px 2px rgba(25,118,210,0.04);margin:0 2px;outline:none;">
					   <button type="button" id="productDetailsPlus" style="background:#fff;border:1.5px solid #d0d7de;color:#1976d2;font-size:1.25rem;font-weight:700;line-height:1;width:32px;height:32px;border-radius:50%;cursor:pointer;transition:box-shadow 0.15s, border-color 0.15s;box-shadow:0 1px 2px rgba(25,118,210,0.06);display:flex;align-items:center;justify-content:center;outline:none;">
						   +
					   </button>
					   <button type="submit" class="product-details-add-btn" style="background:#2196f3;color:#fff;font-size:1.01rem;padding:7px 22px 7px 22px;border:none;border-radius:7px;min-width:0;width:auto;line-height:1.2;box-shadow:0 2px 8px rgba(33,150,243,0.08);font-weight:700;letter-spacing:0.01em;margin-left:18px;transition:background 0.18s,box-shadow 0.18s;outline:none;">
						   <span style="display:inline-block;vertical-align:middle;">Add to Cart</span>
					   </button>
					   <button type="button" id="viewCartBtn" style="background:#43a047;color:#fff;font-size:1.01rem;padding:7px 22px 7px 22px;border:none;border-radius:7px;min-width:0;width:auto;line-height:1.2;box-shadow:0 2px 8px rgba(67,160,71,0.12);font-weight:700;letter-spacing:0.01em;margin-left:10px;transition:background 0.18s,box-shadow 0.18s;outline:none;display:none;">View Cart</button>
				   </div>
			   </form>
			   <div class="bulk-deal-section" style="margin-top:2rem;">
				   <div style="font-size:1.1rem;font-weight:500;margin-bottom:0.5rem;">Bulk deal</div>
				   <table class="bulk-deal-table" style="width:100%;max-width:400px;background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;">
					   <thead>
						   <tr style="background:#f5f5f5;">
							   <th style="padding:8px 10px;text-align:left;">Quantity</th>
							   <th style="padding:8px 10px;text-align:left;">Discount</th>
							   <th style="padding:8px 10px;text-align:left;">Discounted price</th>
						   </tr>
					   </thead>
					   <tbody>
						   <tr><td>1</td><td>-</td><td id="bulkDealPrice1" style="color:#43a047;font-weight:600;">$${card.price.toFixed(2)}</td></tr>
						   <tr><td>2 - 5</td><td>30%</td><td id="bulkDealPrice2" style="color:#43a047;font-weight:600;">$${(card.price*0.7).toFixed(2)}</td></tr>
						   <tr><td>6 - 9</td><td>40%</td><td id="bulkDealPrice3" style="color:#43a047;font-weight:600;">$${(card.price*0.6).toFixed(2)}</td></tr>
						   <tr><td>10 - 100</td><td>50%</td><td id="bulkDealPrice4" style="color:#43a047;font-weight:600;">$${(card.price*0.5).toFixed(2)}</td></tr>
					   </tbody>
				   </table>
				   <div style="margin-top:1.2rem;font-size:1.08rem;line-height:1.7;">
					   <span style="font-weight:600;color:#222;">Category:</span> <span style="color:#1976d2;font-weight:500;">${card.category || ''}</span><br>
					   <span style="font-weight:600;color:#222;">Tags:</span> <span style="color:#444;">${orderCardTags.join(', ')}</span>
				   </div>
			   </div>
			   <div class="product-details-social-share" style="margin:2.5rem 0 1.5rem 0;display:flex;justify-content:center;gap:2.5rem;flex-wrap:wrap;">
				   <a href="https://twitter.com/intent/tweet?url=" target="_blank" class="social-share-btn" id="shareTweet" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#222;min-width:90px;">
					   <span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:2.1rem;">
						   <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#1DA1F2"/><path d="M25 11.54a6.6 6.6 0 0 1-1.89.52 3.3 3.3 0 0 0 1.44-1.82 6.56 6.56 0 0 1-2.08.8A3.28 3.28 0 0 0 16 13.03c0 .26.03.52.08.76A9.32 9.32 0 0 1 9.1 10.6a3.28 3.28 0 0 0 1.01 4.37 3.28 3.28 0 0 1-1.48-.41v.04a3.28 3.28 0 0 0 2.63 3.22 3.3 3.3 0 0 1-.86.12c-.21 0-.42-.02-.62-.06a3.28 3.28 0 0 0 3.06 2.28A6.58 6.58 0 0 1 8 22.07c-.21 0-.41-.01-.61-.04A9.29 9.29 0 0 0 13.29 24c6.04 0 9.35-5 9.35-9.34 0-.14 0-.28-.01-.42A6.7 6.7 0 0 0 25 11.54z" fill="#fff"/></svg>
					   </span>
					   <span style="margin-top:0.5rem;font-size:1.01rem;">Tweet This Product</span>
				   </a>
				   <a href="https://www.facebook.com/sharer/sharer.php?u=" target="_blank" class="social-share-btn" id="shareFacebook" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#222;min-width:90px;">
					   <span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:2.1rem;">
						   <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#1877F3"/><path d="M21.5 16h-3v8h-3v-8h-2v-3h2v-2c0-2.2 1.3-3.5 3.3-3.5.7 0 1.4.1 1.7.2v2.8h-1.2c-.7 0-.8.3-.8.8v1.7h3l-.4 3z" fill="#fff"/></svg>
					   </span>
					   <span style="margin-top:0.5rem;font-size:1.01rem;">Share on Facebook</span>
				   </a>
				   <a href="https://pinterest.com/pin/create/button/?url=" target="_blank" class="social-share-btn" id="sharePinterest" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#222;min-width:90px;">
					   <span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:2.1rem;">
						   <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#E60023"/><path d="M16 8.5c-4.14 0-6.5 2.97-6.5 5.45 0 1.5.57 2.83 1.8 3.33.2.08.38.01.44-.21.04-.15.13-.53.17-.68.06-.21.04-.28-.13-.46-.36-.41-.59-.94-.59-1.7 0-2.2 1.66-4.18 4.48-4.18 2.44 0 3.78 1.5 3.78 3.5 0 2.62-1.16 4.83-2.88 4.83-.95 0-1.66-.79-1.43-1.76.27-1.13.8-2.36.8-3.18 0-.73-.39-1.34-1.2-1.34-.95 0-1.72.98-1.72 2.3 0 .84.29 1.41.29 1.41s-1 4.23-1.18 5c-.35 1.47-.05 3.27-.03 3.45.01.09.13.12.18.05.07-.09.97-1.28 1.28-2.46.09-.33.52-2.04.52-2.04.26.5 1.01.94 1.81.94 2.38 0 3.99-2.17 3.99-5.08 0-2.2-1.86-4.27-5.23-4.27z" fill="#fff"/></svg>
					   </span>
					   <span style="margin-top:0.5rem;font-size:1.01rem;">Pin This Product</span>
				   </a>
				   <a href="mailto:?subject=Check%20out%20this%20product&body=" target="_blank" class="social-share-btn" id="shareMail" style="display:flex;flex-direction:column;align-items:center;text-decoration:none;color:#222;min-width:90px;">
					   <span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:2.1rem;">
						   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="16" fill="#333"/><path d="M8 12.5l8 6 8-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="12.5" width="16" height="7" rx="2" stroke="#fff" stroke-width="2"/></svg>
					   </span>
					   <span style="margin-top:0.5rem;font-size:1.01rem;">Mail This Product</span>
				   </a>
			   </div>

			   <div class="related-products-section" style="margin:2.5rem 0 1.5rem 0;">
				   <div style="font-size:1.45rem;font-weight:600;margin-bottom:1.2rem;">Related products</div>
				   <div class="related-products-grid" style="display:flex;gap:2.2rem;flex-wrap:nowrap;justify-content:flex-start;min-height:320px;flex-direction:row;width:100%;">
				   </div>
			   </div>
		   </div>
	   `;
   
   // Related products logic (after social icons)
   setTimeout(function() {
       var relatedGrid = document.querySelector('.related-products-grid');
       if (relatedGrid) {
           var cards = getOrderCards();
           var related = cards.filter((c, i) => i !== idx && c.category === card.category);
           if (related.length < 3) {
               var others = cards.filter((c, i) => i !== idx && !related.includes(c));
               while (related.length < 3 && others.length > 0) {
                   var pick = others.splice(Math.floor(Math.random() * others.length), 1)[0];
                   if (pick) related.push(pick);
               }
           }
           related = related.slice(0, 3);
           // Add placeholders if less than 3
           while (related.length < 3) {
               related.push(null);
           }
           // Responsive: stack vertically on small screens
           var isMobile = window.innerWidth <= 600;
           relatedGrid.style.flexDirection = isMobile ? 'column' : 'row';
           relatedGrid.style.gap = isMobile ? '1.2rem' : '2.2rem';
           relatedGrid.innerHTML = related.map((prod, i) => {
               if (prod) {
                   return `
                   <div class="related-product-card" style="width:210px;max-width:95vw;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:0.7rem 0.7rem 1.1rem 0.7rem;display:flex;flex-direction:column;align-items:center;margin:0 auto;">
                       <div style="position:relative;width:100%;height:120px;overflow:hidden;border-radius:6px;">
                           <img src="${prod.img}" alt="${prod.name}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.onerror=null;this.src='assets/IDCard.png';">
                       </div>
                       <div style="margin:0.7rem 0 0.2rem 0;font-size:0.98rem;color:#888;text-align:center;">${prod.category || ''}</div>
                       <div style="font-weight:600;font-size:1.08rem;text-align:center;">${prod.name}</div>
                       <div style="margin:0.3rem 0 0.7rem 0;text-align:center;">
                           <span style="color:#888;text-decoration:line-through;font-size:0.98rem;">${prod.price < 150 ? '' : '$' + (prod.price * 1.2).toFixed(2)}</span>
                           <span style="color:#43a047;font-size:1.08rem;font-weight:700;margin-left:0.4rem;">$${prod.price.toFixed(2)}</span>
                       </div>
                       <button class="order-card-btn" data-idx="${cards.indexOf(prod)}" style="padding:0.4rem 1.2rem;font-size:0.98rem;background:#fff;border:1px solid #bbb;border-radius:4px;cursor:pointer;transition:background 0.2s;">Select options</button>
                   </div>
                   `;
               } else {
                   return `<div class="related-product-card" style="width:210px;max-width:95vw;background:transparent;box-shadow:none;margin:0 auto;"></div>`;
               }
           }).join('');
       }
   }, 0);
   // Set social share links to current product page
   setTimeout(function() {
	   var url = window.location.origin + window.location.pathname + window.location.hash;
	   var tweet = document.getElementById('shareTweet');
	   var fb = document.getElementById('shareFacebook');
	   var pin = document.getElementById('sharePinterest');
	   var mail = document.getElementById('shareMail');
	   var title = encodeURIComponent(card.name + ' | ' + document.title);
	   var shareUrl = encodeURIComponent(url);
	   if (tweet) tweet.href = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${title}`;
	   if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
	   if (pin) pin.href = `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${title}`;
	   if (mail) mail.href = `mailto:?subject=${title}&body=Check%20out%20this%20product%20here:%20${shareUrl}`;
   }, 0);

		// Quantity increment/decrement logic for product details page
		setTimeout(function() {
			const minusBtn = document.getElementById('productDetailsMinus');
			const plusBtn = document.getElementById('productDetailsPlus');
			const qtyInput = document.getElementById('productDetailsQty');
			if (minusBtn && qtyInput) {
				minusBtn.onclick = function() {
					let val = parseInt(qtyInput.value) || 1;
					if (val > 1) qtyInput.value = val - 1;
				};
			}
			if (plusBtn && qtyInput) {
				plusBtn.onclick = function() {
					let val = parseInt(qtyInput.value) || 1;
					if (val < 100) qtyInput.value = val + 1;
				};
			}
			// Update bulk deal highlight based on quantity
			qtyInput && qtyInput.addEventListener('input', function() {
				const q = parseInt(qtyInput.value) || 1;
				document.querySelectorAll('.bulk-deal-table tbody tr').forEach(tr => tr.style.background = '');
				if (q === 1) document.querySelector('.bulk-deal-table tbody tr:nth-child(1)').style.background = '#e8f5e9';
				else if (q >= 2 && q <= 5) document.querySelector('.bulk-deal-table tbody tr:nth-child(2)').style.background = '#e8f5e9';
				else if (q >= 6 && q <= 9) document.querySelector('.bulk-deal-table tbody tr:nth-child(3)').style.background = '#e8f5e9';
				else if (q >= 10) document.querySelector('.bulk-deal-table tbody tr:nth-child(4)').style.background = '#e8f5e9';
			});
		}, 0);
	// Insert before footer if possible
	const footer = document.querySelector('footer');
	if (footer && footer.parentNode) {
		footer.parentNode.insertBefore(prodPage, footer);
	} else {
		document.body.appendChild(prodPage);
	}
	// Scroll to top
	window.scrollTo({top:0, behavior:'smooth'});
}

// SPA navigation for product details page
function goToProductDetails(idx) {
	window.location.hash = '#product/' + idx;
}

// Listen for hash changes to show the correct page/article
window.addEventListener('hashchange', function() {
	const hash = window.location.hash;
	showArticleByHash(hash);
});

// Open product details page from Select options button
document.addEventListener('click', function(e) {
	if (e.target.classList.contains('order-card-btn')) {
		const idx = parseInt(e.target.getAttribute('data-idx'));
		if (!isNaN(idx)) {
			goToProductDetails(idx);
		}
	}
	// Product details navigation
	if (e.target.id === 'productDetailsPrev') {
		let idx = parseInt(window.location.hash.replace('#product/', ''));
		idx = (idx - 1 + orderCardsData.length) % orderCardsData.length;
		goToProductDetails(idx);
	}
	if (e.target.id === 'productDetailsNext') {
		let idx = parseInt(window.location.hash.replace('#product/', ''));
		idx = (idx + 1) % orderCardsData.length;
		goToProductDetails(idx);
	}
});

// Handle add to cart from product details page
document.addEventListener('submit', function(e) {
	if (e.target && e.target.id === 'productDetailsForm') {
		   e.preventDefault();
		   const form = e.target;
		   const data = {};
		   let valid = true;
		   // Validate all required fields (including file input)
		   Array.from(form.elements).forEach(el => {
			   if (el.type === 'file' && el.required && el.files.length === 0) {
				   valid = false;
				   el.classList.add('input-error');
			   } else if (el.required && !el.value && el.type !== 'file') {
				   valid = false;
				   el.classList.add('input-error');
			   } else {
				   el.classList.remove('input-error');
			   }
			   if (el.name) {
				   if (el.type === 'file' && el.files.length > 0) {
					   data[el.name] = el.files[0];
				   } else {
					   data[el.name] = el.value;
				   }
			   }
		   });
		   // Driver License is optional, so skip its required check
		   // If not valid, do not proceed
		   if (!valid) {
			   // Optionally show a message to the user
			   alert('Please fill all required fields and upload a photo.');
			   return;
		   }
		   const reader = new FileReader();
		   const file = data.photo;
		   reader.onload = function(event) {
			   data.photo = event.target.result; // Store as base64 string
			   cart.push(data);
			   updateCartUI();
			   
			   // Show 'View Cart' button and attach correct event
			   let viewCartBtn = document.getElementById('viewCartBtn');
			   if (viewCartBtn) {
				   viewCartBtn.style.display = 'inline-block';
				   viewCartBtn.onclick = navigateToCart;
			   }
			   alert('Added to cart!');
		   };
		   if (file) {
		   	reader.readAsDataURL(file);
		   } else {
			   cart.push(data);
			   updateCartUI();
			   let viewCartBtn = document.getElementById('viewCartBtn');
			   if (viewCartBtn) {
				   viewCartBtn.style.display = 'inline-block';
				   viewCartBtn.onclick = navigateToCart;
			   }
			   alert('Added to cart!');
		   }
	}
});
// FAQ Accordion Logic
document.addEventListener('DOMContentLoaded', function () {
   // On initial load, show the correct SPA article based on hash
   setTimeout(function() {
	   var hash = window.location.hash;
	   if (hash.startsWith('#product/')) {
		   const idx = parseInt(hash.replace('#product/', ''));
		   if (!isNaN(idx)) showProductDetailsPage(idx);
	   } else if (hash === '#cartPage') {
		   if (typeof showArticleByHash === 'function') {
			   showArticleByHash('cartPage');
		   } else {
			   document.querySelectorAll('.spa-article').forEach(function(article) {
				   article.style.display = article.id === 'cartPage' ? '' : 'none';
			   });
		   }
	   }
   }, 10);
   // Ensure cart icon and cart notification always go to cart page
   setTimeout(function() {
	   // Attach to both desktop and mobile cart icons
	   var cartIcons = [
		   document.getElementById('cartIcon'),
		   document.getElementById('mobileCartIcon')
	   ];
	   cartIcons.forEach(function(icon) {
		   if (icon) {
			   icon.onclick = function(e) {
				   e.preventDefault();
                   navigateToCart();
			   };
		   }
	   });
	   // Attach to both desktop and mobile cart notification boards if present
	   var cartNotifications = [
		   document.getElementById('cartNotification'),
		   document.getElementById('mobileCartNotification')
	   ];
	   cartNotifications.forEach(function(notif) {
		   if (notif) {
			   notif.onclick = function(e) {
				   e.preventDefault();
                   navigateToCart();
			   };
		   }
	   });
   }, 100);
	// Tab logic (existing)
	const tabButtons = document.querySelectorAll('.faq-tab');
	const tabContents = document.querySelectorAll('.faq-tab-content');
	tabButtons.forEach(btn => {
		btn.addEventListener('click', function () {
			tabButtons.forEach(b => b.classList.remove('active'));
			tabContents.forEach(tc => tc.classList.remove('active'));
			btn.classList.add('active');
			document.getElementById('faq-' + btn.dataset.tab).classList.add('active');
		});
	});

	// Accordion logic for each tab
	document.querySelectorAll('.faq-accordion').forEach(accordion => {
		const items = accordion.querySelectorAll('.faq-item');
		items.forEach(item => {
			const question = item.querySelector('.faq-question');
			question.addEventListener('click', function () {
				// Close all other items in this accordion
				items.forEach(i => {
					if (i !== item) {
						i.classList.remove('open');
						i.querySelector('.faq-question').classList.remove('active');
					}
				});
				// Toggle this one
				item.classList.toggle('open');
				question.classList.toggle('active');
			});
		});
	});
});
// FAQ Tabs Functionality
document.addEventListener('DOMContentLoaded', function () {
	const tabButtons = document.querySelectorAll('.faq-tab');
	const tabContents = document.querySelectorAll('.faq-tab-content');
	if (tabButtons.length > 0) {
		tabButtons.forEach(btn => {
			btn.addEventListener('click', function () {
				// Remove active from all
				tabButtons.forEach(b => b.classList.remove('active'));
				tabContents.forEach(tc => tc.classList.remove('active'));
				// Add active to clicked
				btn.classList.add('active');
				const tab = btn.getAttribute('data-tab');
				const content = document.getElementById('faq-' + tab);
				if (content) content.classList.add('active');
			});
		});
	}
});
// Mobile dropdown menu banner logic
const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
let mobileDropdownMenu = document.getElementById('mobileDropdownMenu');
if (!mobileDropdownMenu) {
	mobileDropdownMenu = document.createElement('div');
	mobileDropdownMenu.className = 'mobile-dropdown-menu';
	mobileDropdownMenu.id = 'mobileDropdownMenu';
	   mobileDropdownMenu.innerHTML = `
			   <ul class="mobile-dropdown-list">
				   <li><a href="#home">Home</a></li>
				   <li><a href="#ids-we-offer">IDs We Offer</a></li>
				   <li><a href="#supply">ID Supply</a></li>
				   <li><a href="#prices">Prices</a></li>
				   <li><a href="#faqs">FAQS</a></li>
				   <li><a href="#blog">Blog</a></li>
				   <li><a href="#contact">Contact</a></li>
				   <li><a href="#order">Order</a></li>
				   <li><a href="#" id="mobileLogoutBtn" style="display:none;">Log Out</a></li>
			   </ul>
	   `;
	document.body.appendChild(mobileDropdownMenu);
}
if (hamburgerMenuBtn && mobileDropdownMenu) {
	hamburgerMenuBtn.addEventListener('click', function(e) {
		e.stopPropagation();
		mobileDropdownMenu.classList.toggle('open');
		document.body.style.overflow = mobileDropdownMenu.classList.contains('open') ? 'hidden' : '';
	});
	// Close menu when clicking a link
	   mobileDropdownMenu.querySelectorAll('a').forEach(link => {
		   link.addEventListener('click', (e) => {
			   mobileDropdownMenu.classList.remove('open');
			   document.body.style.overflow = '';
			   // SPA navigation: update hash to show correct article
			   var href = link.getAttribute('href');
			   if (href && href.startsWith('#')) {
				   window.location.hash = href;
			   }
		   });
	   });
	// Close menu when clicking outside
	document.addEventListener('click', function(e) {
		if (mobileDropdownMenu.classList.contains('open') && !mobileDropdownMenu.contains(e.target) && e.target !== hamburgerMenuBtn) {
			mobileDropdownMenu.classList.remove('open');
			document.body.style.overflow = '';
		}
	});
}
// Mobile menu overlay logic
function createMobileMenu() {
	if (document.getElementById('mobileMenuOverlay')) return;
	const overlay = document.createElement('div');
	overlay.className = 'mobile-menu-overlay';
	overlay.id = 'mobileMenuOverlay';
	   overlay.innerHTML = `
		   <div class="mobile-menu-header">
			   <div class="mobile-menu-logo">
				   <span style="font-family:'Montserrat',sans-serif;font-size:1.7rem;font-weight:700;color:#fff;letter-spacing:0.1em;">Club<span style='color:#e53935;'>21IDs</span></span>
			   </div>
			   <div class="mobile-menu-icons">
				   <div class="cart-icon" id="mobileCartIcon" tabindex="0">
					   <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2l2.5 13h11l2-8H6.5"/></svg>
					   <span class="cart-count" id="mobileCartCount">0</span>
				   </div>
				   <div class="search-icon" tabindex="0">
					   <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				   </div>
				   <button class="mobile-menu-close" id="mobileMenuClose">CLOSE</button>
			   </div>
		   </div>
		   <ul class="mobile-menu-list">
			   <li><a href="#home">Home</a></li>
			   <li><a href="#ids-we-offer">IDs We Offer</a></li>
			   <li><a href="#supply">ID Supply</a></li>
			   <li><a href="#prices">Prices</a></li>
			   <li><a href="#faqs">FAQS</a></li>
			   <li><a href="#blog">Blog</a></li>
			   <li><a href="#contact">Contact</a></li>
			   <li><a href="#order">Order</a></li>
		   </ul>
	   `;
	document.body.appendChild(overlay);
	   // Cart count sync
	   const cartCount = document.getElementById('cartCount');
	   const mobileCartCount = document.getElementById('mobileCartCount');
	   if (cartCount && mobileCartCount) {
		   mobileCartCount.textContent = cartCount.textContent;
	   }
	   // Cart icon click always goes to cart page
	   const cartIcon = document.getElementById('cartIcon') || document.getElementById('mobileCartIcon');
	   if (cartIcon) {
		   cartIcon.onclick = function(e) {
			   e.preventDefault();
			   window.location.hash = '#cart';
		   };
	   }
	   // Cart notification click always goes to cart page
	   const cartNotification = document.getElementById('cartNotification');
	   if (cartNotification) {
		   cartNotification.onclick = function(e) {
			   e.preventDefault();
			   window.location.hash = '#cart';
		   };
	   }
	   // Close logic
	   document.getElementById('mobileMenuClose').onclick = () => closeMobileMenu();
		  overlay.querySelectorAll('a').forEach(link => {
			  link.addEventListener('click', (e) => {
				  closeMobileMenu();
				  // SPA navigation: update hash to show correct article
				  var href = link.getAttribute('href');
				  if (href && href.startsWith('#')) {
					  window.location.hash = href;
				  }
			  });
		  });
}

function openMobileMenu() {
	createMobileMenu();
	document.getElementById('mobileMenuOverlay').classList.add('open');
	document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
	const overlay = document.getElementById('mobileMenuOverlay');
	if (overlay) overlay.classList.remove('open');
	document.body.style.overflow = '';
}

const hamburgerBtn2 = document.getElementById('hamburgerBtn');
if (hamburgerBtn2) {
	hamburgerBtn2.addEventListener('click', function() {
		openMobileMenu();
	});
}
// Hamburger menu for mobile
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');
if (hamburgerBtn && mainNav) {
	hamburgerBtn.addEventListener('click', function() {
		mainNav.classList.toggle('open');
	});
	// Optional: close menu when clicking a link
	mainNav.querySelectorAll('a').forEach(link => {
		link.addEventListener('click', () => {
			mainNav.classList.remove('open');
		});
	});
}
// Microtext Section Image Slider
const sliderImages = [
	'assets/lastsectionimage.png',
	'assets/lastsectionimage2.png'
];
let sliderIndex = 0;
const sliderImage = document.getElementById('sliderImage');
const sliderPrev = document.getElementById('sliderPrev');
const sliderNext = document.getElementById('sliderNext');
if (sliderImage && sliderPrev && sliderNext) {
	sliderPrev.addEventListener('click', function() {
		sliderIndex = (sliderIndex - 1 + sliderImages.length) % sliderImages.length;
		sliderImage.src = sliderImages[sliderIndex];
	});
	sliderNext.addEventListener('click', function() {
		sliderIndex = (sliderIndex + 1) % sliderImages.length;
		sliderImage.src = sliderImages[sliderIndex];
	});
}
// Cart logic and UI

const cartIcon = document.getElementById('cartIcon');
const cartDropdown = document.getElementById('cartDropdown');
const cartItemsDiv = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');

// Mobile cart elements
const mobileCartIcon = document.getElementById('mobileCartIcon');
const mobileCartDropdown = document.getElementById('mobileCartDropdown');
const mobileCartItemsDiv = document.getElementById('mobileCartItems');
const mobileCartCount = document.getElementById('mobileCartCount');


// Load cart from localStorage or initialize
let cart = [];
try {
	const savedCart = localStorage.getItem('cart');
	if (savedCart) {
		cart = JSON.parse(savedCart);
	}
} catch (e) {
	cart = [];
}



function updateCartUI() {
	// Save cart to localStorage
	try {
		localStorage.setItem('cart', JSON.stringify(cart));
	} catch (e) {}
	// Desktop
	if (cartItemsDiv && cartCount) {
		if (cart.length === 0) {
			cartItemsDiv.innerHTML = '<div style="padding:10px 0; color:#fff; opacity:0.85;">No product in the cart. Add Products</div>';
			cartCount.textContent = '0';
		} else {
			cartItemsDiv.innerHTML = cart.map((item, idx) => `
				<div class="cart-dropdown-item" data-cart-idx="${idx}" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:6px 0;border-bottom:1px solid #333;gap:8px;cursor:pointer;">
					<div style="flex:1;min-width:0;">
						<div style="font-weight:600;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.cardName || item}</div>
						<div style="font-size:0.92rem;color:#bbb;">$${parseFloat(item.price).toFixed(2)} &times; ${item.quantity || 1}</div>
					</div>
					<button class="cart-dropdown-remove-btn" data-cart-idx="${idx}" aria-label="Remove" style="background:none;border:none;color:#e53935;font-size:1.2rem;cursor:pointer;padding:0 6px;">&times;</button>
				</div>
			`).join('');
			cartCount.textContent = cart.length;
		}
	}
	// Mobile
	if (mobileCartItemsDiv && mobileCartCount) {
		if (cart.length === 0) {
			mobileCartItemsDiv.innerHTML = '<div style="padding:10px 0; color:#fff; opacity:0.85;">No product in the cart. Add Products</div>';
			mobileCartCount.textContent = '0';
		} else {
			mobileCartItemsDiv.innerHTML = cart.map((item, idx) => `
				<div class="cart-dropdown-item" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:6px 0;border-bottom:1px solid #333;gap:8px;">
					<div style="flex:1;min-width:0;">
						<div style="font-weight:600;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.cardName || item}</div>
						<div style="font-size:0.92rem;color:#bbb;">$${parseFloat(item.price).toFixed(2)} &times; ${item.quantity || 1}</div>
					</div>
					<button class="cart-dropdown-remove-btn" data-cart-idx="${idx}" aria-label="Remove" style="background:none;border:none;color:#e53935;font-size:1.2rem;cursor:pointer;padding:0 6px;">&times;</button>
				</div>
			`).join('');
			mobileCartCount.textContent = cart.length;
		}
	}
	// Add event listeners for remove buttons (desktop)
	setTimeout(function() {
		// Remove button logic
		document.querySelectorAll('.cart-dropdown-remove-btn').forEach(function(btn) {
			btn.onclick = function(e) {
				e.stopPropagation();
				const idx = parseInt(btn.getAttribute('data-cart-idx'));
				if (!isNaN(idx)) {
					cart.splice(idx, 1);
					updateCartUI();
					// If on cart page, update it too
					if (document.getElementById('cartPage') && document.getElementById('cartPage').style.display !== 'none') {
						if (typeof showCartPage === 'function') showCartPage();
					}
				}
			};
		});
		// Click on cart item to go to cart page and scroll to item
		document.querySelectorAll('.cart-dropdown-item').forEach(function(itemDiv) {
			itemDiv.addEventListener('click', function(e) {
				const idx = itemDiv.getAttribute('data-cart-idx');
				// Store the index in localStorage for highlighting after navigation
				try { localStorage.setItem('highlightCartIdx', idx); } catch (e) {}
				window.location.hash = '#cartPage';
			});
		});
	}, 0);
}


if (cartIcon && cartDropdown) {
	   cartIcon.addEventListener('click', function(e) {
		   e.preventDefault();
		   // Close mobile menu if open
		   var mobileDropdownMenu = document.getElementById('mobileDropdownMenu');
		   if (mobileDropdownMenu && mobileDropdownMenu.classList.contains('open')) {
			   mobileDropdownMenu.classList.remove('open');
			   document.body.style.overflow = '';
		   }
		   window.location.hash = '#cartPage';
		   setTimeout(function() {
			   if (typeof showArticleByHash === 'function') showArticleByHash('cartPage');
			   else {
				   document.querySelectorAll('.spa-article').forEach(function(article) {
					   article.style.display = article.id === 'cartPage' ? '' : 'none';
				   });
			   }
			   window.scrollTo({top:0, behavior:'smooth'});
		   }, 10);
	   });
	// Mobile cart icon uses same logic as desktop
	if (mobileCartIcon) {
	   mobileCartIcon.addEventListener('click', function(e) {
		   e.preventDefault();
           navigateToCart();
	   });
	}


// Hide dropdowns when clicking outside
document.addEventListener('click', function(e) {
	// Desktop
	if (cartIcon && cartDropdown && !cartIcon.contains(e.target) && !cartDropdown.contains(e.target)) {
		cartDropdown.classList.remove('active');
	}
	// Mobile
	if (mobileCartIcon && mobileCartDropdown && !mobileCartIcon.contains(e.target) && !mobileCartDropdown.contains(e.target)) {
		mobileCartDropdown.classList.remove('active');
	}
});

// For demo: add to cart from console
window.addToCart = function(productName) {
	cart.push(productName);
	updateCartUI();
}

}

// Initialize UI
updateCartUI();
console.log('DocuID Services site loaded.');

function navigateToCart() {
    // Always close mobile menu if it's open
    const mobileDropdownMenu = document.getElementById('mobileDropdownMenu');
    if (mobileDropdownMenu && mobileDropdownMenu.classList.contains('open')) {
        mobileDropdownMenu.classList.remove('open');
        document.body.style.overflow = '';
    }
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    if (mobileMenuOverlay && mobileMenuOverlay.classList.contains('open')) {
        closeMobileMenu();
    }

    // Navigate by setting the hash. The hashchange listener will handle the rest.
    window.location.hash = '#cartPage';
}

// --- SPA Navigation Logic ---
async function populateDashboard() {
	const currentUser = JSON.parse(localStorage.getItem('currentUser'));
	if (!currentUser || !currentUser.id) {
		// Not logged in, or user data is incomplete
		window.location.hash = '#login';
		return;
	}

	try {
		const response = await fetch(`${API_URL}/user/${currentUser.id}`);
		if (!response.ok) {
			throw new Error('Failed to fetch user data.');
		}
		const user = await response.json();

		// 1. Populate Account Details Form
		const accountForm = document.getElementById('dashboardAccountForm');
		if (accountForm) {
			accountForm.firstName.value = user.firstName || '';
			accountForm.lastName.value = user.lastName || '';
			accountForm.displayName.value = user.displayName || user.username || '';
			accountForm.email.value = user.email || '';
		}

		// 2. Populate Addresses Tab
		renderDashboardAddresses(user);

        // 3. Fetch and display orders for the Orders tab
        await renderDashboardOrders(currentUser.id);

        // 4. Update username displays
        const username = user.displayName || user.username;
        const dashboardUserName = document.getElementById('dashboardUserName');
        if (dashboardUserName) dashboardUserName.textContent = username;
        const dashboardUserNameInline = document.getElementById('dashboardUserNameInline');
        if (dashboardUserNameInline) dashboardUserNameInline.textContent = username;
        const dashboardUserNameInline2 = document.getElementById('dashboardUserNameInline2');
        if (dashboardUserNameInline2) dashboardUserNameInline2.textContent = username;

	} catch (error) {
		console.error('Error populating dashboard:', error);
		// Optionally show an error message to the user
	}
}

async function renderDashboardOrders(userId) {
    const ordersContainer = document.getElementById('dashboardTabOrders');
    if (!ordersContainer) return;

    // Try to fetch from API first. If that fails, fall back to localStorage.
    let orders = [];
    let ordersSource = 'remote';
    try {
        const response = await fetch(`${API_URL}/orders/${userId}`);
        if (response.ok) {
            orders = await response.json();
        } else {
            throw new Error('Remote fetch failed');
        }
    } catch (err) {
        // Try localStorage fallback
        try {
            const stored = localStorage.getItem('orders');
            if (stored) {
                const parsed = JSON.parse(stored);
                // stored may be an array of orders or an object keyed by user
                if (Array.isArray(parsed)) {
                    orders = parsed.filter(o => String(o.userId) === String(userId));
                } else if (parsed && parsed[userId]) {
                    orders = parsed[userId];
                }
            }
            // Also consider single latestOrder stored after checkout
            if ((!orders || orders.length === 0) && localStorage.getItem('latestOrder')) {
                const latest = JSON.parse(localStorage.getItem('latestOrder'));
                if (latest && String(latest.userId) === String(userId)) {
                    orders = [latest];
                }
            }
            ordersSource = 'local';
        } catch (e2) {
            console.error('Failed to parse local orders', e2);
            orders = [];
        }
    }

    // Render results
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = '<div style="font-size:1.15rem;font-weight:600;margin-bottom:1.2rem;">Your Orders</div><p>No order has been made yet.</p><a href="#order" class="button" style="display:inline-block;margin-top:1rem;padding:0.7rem 1.5rem;background:#2196f3;color:#fff;text-decoration:none;border-radius:4px;">Browse products</a>';
        return;
    }

    let ordersHtml = `
        <div style="font-size:1.15rem;font-weight:600;margin-bottom:1.2rem;display:flex;justify-content:space-between;align-items:center;">
            <span>Your Orders</span>
            <small style="color:#666;font-weight:400;">Source: ${ordersSource === 'local' ? 'Local storage' : 'Server'}</small>
        </div>
        <div class="orders-list-container">
    `;

    orders.forEach(order => {
        const orderDate = order && order.date ? new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '—';
        const orderNumber = order.orderNumber || (order._id ? order._id : '—');
        const status = order.status || '—';
        const total = (typeof order.total === 'number') ? order.total : (order.total ? parseFloat(order.total) : 0);
        const itemsCount = Array.isArray(order.items) ? order.items.length : (order.cart ? order.cart.length : 0);

        ordersHtml += `
            <div class="order-card-responsive">
                <div class="order-card-row">
                    <div class="order-card-label">Order</div>
                    <div class="order-card-value">#${String(orderNumber).substring(0, 7)}</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Date</div>
                    <div class="order-card-value">${orderDate}</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Status</div>
                    <div class="order-card-value">${status}</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Total</div>
                    <div class="order-card-value">$${total.toFixed(2)} for ${itemsCount} item(s)</div>
                </div>
                <div class="order-card-row">
                    <div class="order-card-label">Actions</div>
                    <div class="order-card-value">
                        <button class="view-order-btn" data-order-id="${order._id || order.orderNumber}">View</button>
                    </div>
                </div>
            </div>
        `;
    });

    ordersHtml += `</div>`;

    ordersContainer.innerHTML = ordersHtml;

    // The CSS has .orders-list-container { display: none; } by default.
    // Make the inserted container visible so the orders show up.
    const listEl = ordersContainer.querySelector('.orders-list-container');
    if (listEl) {
        listEl.style.display = 'flex';
        listEl.style.flexDirection = 'column';
        listEl.style.gap = '1rem';
    }

    // Add event listeners for the view buttons
    ordersContainer.querySelectorAll('.view-order-btn').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            window.location.hash = `#order-view/${orderId}`;
        });
    });
}


function showArticleByHash(hash) {
    hash = (hash || window.location.hash || '#home').replace(/^#/, '');

    // --- Hide all static and dynamic articles first ---
    // Hide all static SPA articles
    document.querySelectorAll('.spa-article').forEach(function(article) {
        // We will manage dynamic pages separately
        if (article.id !== 'cartPage' && article.id !== 'productDetailsPage') {
            article.style.display = 'none';
        }
    });

    // Also explicitly hide or remove dynamic pages before showing the new one
    const cartArticle = document.getElementById('cartPage');
    if (cartArticle) {
        cartArticle.style.display = 'none';
    }
    const productArticle = document.getElementById('productDetailsPage');
    if (productArticle) {
        productArticle.remove(); // This is dynamically generated, so we remove it
    }
    const orderReceivedArticle = document.getElementById('orderReceivedPage');
    if (orderReceivedArticle) {
        orderReceivedArticle.remove();
    }
    const orderViewArticle = document.getElementById('orderViewPage');
    if (orderViewArticle) {
        orderViewArticle.remove();
    }
    
    // --- Show the correct article based on the hash ---
    
    // Special handling for cart page
    if (hash === 'cartPage') {
        if (typeof showCartPage === 'function') {
            showCartPage(); // This function will create and show the cart page
        }
        try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
        return;
    }

    // Special handling for product details page
    if (hash.startsWith('product/')) {
        const idx = parseInt(hash.replace('product/', ''));
        if (!isNaN(idx)) {
            showProductDetailsPage(idx); // This function creates and shows the product page
        }
        try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
        return;
    }

    // Special handling for order received page
    if (hash === 'order-received') {
        renderOrderReceivedPage();
        try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
        return;
    }

    // Special handling for viewing a single order
    if (hash.startsWith('order-view/')) {
        const orderId = hash.split('/')[1];
        renderOrderViewPage(orderId);
        try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
        return;
    }

    // Dashboard tab logic
    if (hash.startsWith('dashboard')) {
        const dashboardArticle = document.getElementById('dashboard');
        if(dashboardArticle) dashboardArticle.style.display = '';
        
        populateDashboard(); // Fetch and populate data

        // Show correct dashboard tab
        var tab = hash.replace('dashboard-', '');
        document.querySelectorAll('.dashboard-tab-content').forEach(function(tabContent) {
            tabContent.style.display = 'none';
        });
        const tabId = 'dashboardTab' + tab.charAt(0).toUpperCase() + tab.slice(1);
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.style.display = '';
        } else {
            // Fallback to the main dashboard view if tab not found
            document.getElementById('dashboardTabDashboard').style.display = '';
        }
        try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
        return;
    }

    // Default page handling for static articles
    var validIds = Array.from(document.querySelectorAll('.spa-article')).map(a => a.id);
    if (!hash || !validIds.includes(hash)) {
        hash = 'home';
    }
    
    const targetArticle = document.getElementById(hash);
    if (targetArticle) {
        targetArticle.style.display = '';
    }

    if (hash === 'login') {
        setTimeout(function() {
            var userInput = document.querySelector('#loginForm input[name="username"]');
            if (userInput) userInput.focus();
        }, 100);
    }
    if (hash === 'checkout') {
        populateCountries();
        renderCheckoutPage();
        const fetchBtcAddress = async () => {
            const btcContainer = document.getElementById('checkoutBitcoinAddress');
            if (!btcContainer) return;
    
            try {
                const response = await fetch(`${API_URL}/settings/bitcoin-address`);
                if (!response.ok) throw new Error('Could not fetch address');
                const data = await response.json();
                btcContainer.textContent = data.bitcoin_address || 'No address configured.';
            } catch (error) {
                btcContainer.textContent = 'Error loading address. Please contact support.';
                console.error('Error fetching Bitcoin address:', error);
            }
        };
    
        fetchBtcAddress();
    }
    try { localStorage.setItem('lastSpaHash', hash); } catch (e) {}
    if (hash === 'order') renderOrderPage();
}

const orderCardTags = ["Fake ID", "Scannable", "Novelty ID"];

let orderCurrentPage = 1;
const orderPerPage = 12;
let orderSort = 'default';
let orderCatalog = [];
let orderCatalogLoaded = false;

async function fetchOrderCatalog() {
    try {
        const resp = await fetch(`${API_URL}/catalog`);
        if (resp.ok) {
            const items = await resp.json();
            if (Array.isArray(items)) {
                orderCatalog = items.map(it => ({
                    id: it._id || it.id || '',
                    name: it.name || '',
                    price: typeof it.price !== 'undefined' ? parseFloat(it.price) : 0,
                    img: it.img || '',
                    category: it.category || '',
                    description: it.description || ''
                }));
                orderCatalogLoaded = true;
                return orderCatalog;
            }
        }
        throw new Error('Failed to fetch catalog');
    } catch (err) {
        console.error('Could not fetch catalog:', err);
        alert('Error loading catalog from server. Please try again later.');
        orderCatalog = [];
        orderCatalogLoaded = false;
        return [];
    }
}

function getOrderCards() {
    return orderCatalog;
}

// Load admin-managed order items from localStorage (if any)
function loadAdminOrderItems() {
    try {
        const raw = localStorage.getItem('orderItems');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
        console.warn('Failed to parse orderItems from localStorage', e);
    }
    return null;
}

function getOrderCards() {
    return orderCatalog;
}

// ORDER PAGE LOGIC (duplicate declaration removed)
// --- Loading Spinner for Order Page ---
function showOrderLoadingSpinner() {
    let spinner = document.getElementById('orderLoadingSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'orderLoadingSpinner';
        spinner.style.position = 'fixed';
        spinner.style.top = '0';
        spinner.style.left = '0';
        spinner.style.width = '100vw';
        spinner.style.height = '100vh';
        spinner.style.background = 'rgba(255,255,255,0.85)';
        spinner.style.display = 'flex';
        spinner.style.alignItems = 'center';
        spinner.style.justifyContent = 'center';
        spinner.style.zIndex = '9999';
        spinner.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
            <div class="lds-roller" style="display:inline-block;width:64px;height:64px;">
                <div style="animation:lds-roller 1.2s linear infinite;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.15s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.3s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.45s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.6s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.75s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 0.9s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
                <div style="animation:lds-roller 1.2s linear infinite 1.05s;position:absolute;width:6px;height:6px;border-radius:50%;background:#2196f3;margin:29px 0 0 29px;"></div>
            </div>
            <div style="margin-top:1.2rem;font-size:1.15rem;color:#333;">Loading products...</div>
        </div>`;
        document.body.appendChild(spinner);
    }
    spinner.style.display = 'flex';
}

function hideOrderLoadingSpinner() {
    const spinner = document.getElementById('orderLoadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

// Add spinner CSS animation
const style = document.createElement('style');
style.innerHTML = `@keyframes lds-roller {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}.lds-roller div {position: absolute;animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);}`;
document.head.appendChild(style);

// orderCardTags is already declared above, no need to redeclare
// orderCurrentPage is already declared above, no need to redeclare
// orderPerPage is already declared above, no need to redeclare
// orderSort is already declared above, no need to redeclare

function renderOrderPage() {
	const grid = document.querySelector('.order-card-grid');
	const sortBox = document.getElementById('order-sort');
	const pageNumbers = document.querySelector('.order-page-numbers');
	if (!grid || !sortBox || !pageNumbers) return;
    // Sorting
    // Prefer admin-managed catalog from localStorage if available
    let cards = [...getOrderCards()];
    if (!orderCatalogLoaded) {
        showOrderLoadingSpinner();
        // Fetch catalog if not loaded
        fetchOrderCatalog().then(() => {
            hideOrderLoadingSpinner();
            renderOrderPage();
        });
        return;
    }
    hideOrderLoadingSpinner();
    if (orderSort === 'price-low') cards.sort((a,b)=>a.price-b.price);
    else if (orderSort === 'price-high') cards.sort((a,b)=>b.price-a.price);
    // Pagination
    const totalPages = Math.ceil(cards.length/orderPerPage);
    if (orderCurrentPage > totalPages) orderCurrentPage = totalPages;
    if (orderCurrentPage < 1) orderCurrentPage = 1;
    const start = (orderCurrentPage-1)*orderPerPage;
    const end = start+orderPerPage;
    const pageCards = cards.slice(start,end);
    // Render grid
    grid.innerHTML = pageCards.map((card, idx) => `
        <div class="order-card" style="background:none;border:none;box-shadow:none;padding:0;margin:0;position:relative;">
            <div class="order-card-img" style="position:relative;overflow:hidden;">
                   <img src="${card.img}" alt="${card.name}" style="width:100%;height:180px;object-fit:cover;border-radius:0;display:block;" onerror="this.onerror=null;this.src='assets/IDCard.png';">
                <button class="order-quick-view-btn" data-idx="${start+idx}" style="position:absolute;left:0;right:0;bottom:0;height:40px;background:rgba(44,44,44,0.85);color:#fff;border:none;width:100%;font-size:1.05rem;display:none;align-items:center;justify-content:center;gap:0.5rem;cursor:pointer;transition:background 0.2s;z-index:2;"><span style="font-size:1.2rem;">&#128065;</span> QUICK VIEW</button>
            </div>
            <div class="order-card-info" style="padding:0.7rem 0 0.2rem 0;text-align:center;background:none;">
                <div class="order-card-name" style="font-size:1.08rem;font-weight:600;margin-bottom:0.2rem;">${card.name}</div>
                <div class="order-card-price" style="color:#43a047;font-size:1.08rem;font-weight:700;margin-bottom:0.5rem;">$${card.price.toFixed(2)}</div>
                <button class="order-card-btn" data-idx="${start+idx}" style="padding:0.4rem 1.2rem;font-size:0.98rem;background:#fff;border:1px solid #bbb;border-radius:4px;cursor:pointer;transition:background 0.2s;">Select options</button>
            </div>
        </div>
    `).join('');
	// Add hover effect for quick view
	document.querySelectorAll('.order-card-img').forEach(function(imgDiv) {
		imgDiv.addEventListener('mouseenter', function() {
			const btn = imgDiv.querySelector('.order-quick-view-btn');
			if (btn) btn.style.display = 'flex';
		});
		imgDiv.addEventListener('mouseleave', function() {
			const btn = imgDiv.querySelector('.order-quick-view-btn');
			if (btn) btn.style.display = 'none';
		});
	});
	// Responsive grid CSS
	grid.style.display = 'grid';
	grid.style.gap = '2rem 1.5rem';
	grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
	grid.style.margin = '0 auto';
	grid.style.maxWidth = '1100px';
	// Responsive
	function updateGridColumns() {
		if (window.innerWidth < 600) grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
		else if (window.innerWidth < 900) grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
		else grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
	}
	updateGridColumns();
	window.addEventListener('resize', updateGridColumns);
	// Pagination
	let pagesHtml = '';
	for (let i=1;i<=totalPages;i++) {
		pagesHtml += `<button class="order-page-btn${i===orderCurrentPage?' active':''}" data-page="${i}" style="padding:0.4rem 1rem;border:1px solid #ccc;background:${i===orderCurrentPage?'#2d2e3a':'#fafafa'};color:${i===orderCurrentPage?'#fff':'#222'};border-radius:4px;cursor:pointer;">${i}</button>`;
	}
	pageNumbers.innerHTML = pagesHtml;
}

function updateLogoutBtn() {
	var desktopBtn = document.getElementById('logoutBtnNav');
	var mobileBtn = document.getElementById('mobileLogoutBtn');
	var isLoggedIn = localStorage.getItem('isLoggedIn');

	if (desktopBtn) {
		desktopBtn.style.display = isLoggedIn ? '' : 'none';
	}
	if (mobileBtn) {
		mobileBtn.style.display = isLoggedIn ? '' : 'none';
	}
}

function isOrderFormValid(form) {
    let isValid = true;
    Array.from(form.elements).forEach(el => {
        if (el.required && !el.value) {
            isValid = false;
        }
    });
    return isValid;
}

function showViewCartBtn() {
    const form = document.getElementById('orderQuickViewForm');
    if (form) {
        const addToCartBtn = form.querySelector('button[type="submit"]');
        const viewCartBtn = document.getElementById('orderQuickViewViewCart');
        if (addToCartBtn) addToCartBtn.style.display = 'none';
        if (viewCartBtn) viewCartBtn.style.display = 'inline-block';
    }
}

function populateCountries() {
    const countrySelect = document.querySelector('#checkoutBillingForm select[name="country"]');
    if (!countrySelect) return;

    // Avoid re-populating if already filled
    if (countrySelect.options.length > 1) return;

    const countries = [
        "United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Austria", "Azerbaijan",
        "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
        "Cabo Verde", "Cambodia", "Cameroon", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic",
        "Denmark", "Djibouti", "Dominica", "Dominican Republic",
        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
        "Fiji", "Finland",
        "Gabon", "Gambia", "Georgia", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
        "Haiti", "Honduras", "Hungary",
        "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
        "Jamaica", "Japan", "Jordan",
        "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
        "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
        "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
        "Oman",
        "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
        "Qatar",
        "Romania", "Russia", "Rwanda",
        "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
        "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
        "Uganda", "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan",
        "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
        "Yemen",
        "Zambia", "Zimbabwe"
    ];

    countrySelect.innerHTML = '<option value="">Select a country / region...</option>';
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

function renderCheckoutPage() {
    const checkoutCartDetails = document.getElementById('checkoutCartDetails');
    if (!checkoutCartDetails) {
        console.error('Checkout details container not found.');
        return;
    }

    if (cart.length === 0) {
        checkoutCartDetails.innerHTML = '<div class="checkout-order-summary" style="padding: 1rem; border: 1px solid #ddd; border-radius: 5px;"><p>Your cart is currently empty.</p></div>';
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
    const shipping = 0; // Assuming free shipping for now
    const total = subtotal + shipping;

    const itemsHtml = cart.map(item => {
        const detailsHtml = Object.entries(item).map(([key, value]) => {
            if (['cardName', 'price', 'quantity', 'img', 'category', 'photo', 'tags'].includes(key) || !value) {
                return '';
            }
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            return `<tr>
                        <td style="padding: 4px 8px; border: 1px solid #eee; background-color: #f9f9f9; font-weight: 600; width: 40%;">${formattedKey}</td>
                        <td style="padding: 4px 8px; border: 1px solid #eee;">${value}</td>
                    </tr>`;
        }).join('');

        return `
            <div class="checkout-item" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem; margin-bottom: 0.75rem;">
                    <span>${item.cardName} &times; ${item.quantity || 1}</span>
                    <span>$${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
                ${detailsHtml ? `
                    <div class="checkout-item-details">
                        <h5 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #555;">Details:</h5>
                        <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                            <tbody>
                                ${detailsHtml}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    const summaryHtml = `
        <div class="checkout-order-summary" style="padding: 1rem; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.4rem;">Your Order</h3>
            ${itemsHtml}
            <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-top: 2px solid #ddd; margin-top: 0.5rem; font-weight: 600;">
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 2px solid #ddd;">
                <span>Shipping</span>
                <span>Free shipping</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 1rem 0; font-size: 1.2rem; font-weight: 700;">
                <span>Total</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    checkoutCartDetails.innerHTML = summaryHtml;
}

document.addEventListener('submit', async function(e) {
    if (e.target.id === 'checkoutBillingForm') {
        e.preventDefault();
        const form = e.target;
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const buttonText = placeOrderBtn.querySelector('.button-text');
        const spinner = placeOrderBtn.querySelector('.spinner');

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!currentUser || !currentUser.id) {
            alert('You must be logged in to place an order.');
            window.location.hash = '#login';
            return;
        }

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        // Show spinner and disable button
        if(placeOrderBtn) {
            placeOrderBtn.disabled = true;
            buttonText.style.display = 'none';
            spinner.style.display = 'block';
        }

        // --- Form Data Collection ---
        const billingAddress = {
            name: `${form.firstName.value} ${form.lastName.value}`,
            country: form.country.value,
            street: form.streetAddress.value,
            city: form.city.value,
            zip: form.zip.value,
            state: form.state.value,
            phone: form.phone.value,
            email: form.email.value,
        };

        let shippingAddress = {};
        const shipToDifferent = form.shipDiff.checked;
        if (shipToDifferent) {
            // This part needs to be implemented if you have shipping fields
            // For now, it will copy billing address
            shippingAddress = { ...billingAddress };
        } else {
            shippingAddress = { ...billingAddress };
        }
        
        const orderNotes = form.orderNotes.value;

        // --- Cart & Total Calculation ---
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
        const shippingCost = 0; // Assuming free shipping for now
        const total = subtotal + shippingCost;

        // --- API Payload ---
        const orderData = {
            userId: currentUser.id,
            cart: cart,
            total: total,
            billingAddress: billingAddress,
            shippingAddress: shippingAddress,
            orderNotes: orderNotes,
            status: 'Processing'
        };

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to place order.');
            }

            // --- Success ---
            // 1. Re-fetch user data to get the updated addresses and save to localStorage
            const userResponse = await fetch(`${API_URL}/user/${currentUser.id}`);
            const updatedUser = await userResponse.json();
            if (userResponse.ok) {
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }

            // 2. Save order to local storage for confirmation page
            localStorage.setItem('latestOrder', JSON.stringify(result.order));

            // 3. Clear cart
            cart = [];
            updateCartUI();

            // 4. Navigate to order received page
            window.location.hash = '#order-received';

        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // Hide spinner and re-enable button
            if(placeOrderBtn) {
                placeOrderBtn.disabled = false;
                buttonText.style.display = 'inline';
                spinner.style.display = 'none';
            }
        }
    }
});


function renderOrderReceivedPage() {
    const latestOrder = JSON.parse(localStorage.getItem('latestOrder'));
    if (!latestOrder) {
        // If no order found, redirect to home
        window.location.hash = '#home';
        return;
    }

    // Create page article
    let orderPage = document.createElement('article');
    orderPage.id = 'orderReceivedPage';
    orderPage.className = 'spa-article order-received-page';
    
    const orderDate = new Date(latestOrder.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const total = latestOrder.total.toFixed(2);
    const orderNumber = latestOrder.orderNumber.substring(0, 7);

    orderPage.innerHTML = `
        <div class="order-received-container" style="max-width: 800px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h2 style="font-size: 1.8rem; color: #333; margin: 0;">Thank you. Your order has been received.</h2>
            </div>
            
            <ul style="list-style: none; padding: 0; display: flex; justify-content: space-around; text-align: center; margin-bottom: 2rem;">
                <li>
                    <span style="display: block; color: #777; font-size: 0.9rem;">ORDER NUMBER:</span>
                    <strong style="font-size: 1.1rem;">#${orderNumber}</strong>
                </li>
                <li>
                    <span style="display: block; color: #777; font-size: 0.9rem;">DATE:</span>
                    <strong style="font-size: 1.1rem;">${orderDate}</strong>
                </li>
                <li>
                    <span style="display: block; color: #777; font-size: 0.9rem;">TOTAL:</span>
                    <strong style="font-size: 1.1rem;">$${total}</strong>
                </li>
                <li>
                    <span style="display: block; color: #777; font-size: 0.9rem;">PAYMENT METHOD:</span>
                    <strong style="font-size: 1.1rem;">Bitcoin</strong>
                </li>
            </ul>

            <!-- Payment instructions removed -->

            <h3 style="font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">Order Details</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                <thead>
                    <tr style="border-bottom: 2px solid #ddd;">
                        <th style="text-align: left; padding: 0.75rem;">Product</th>
                        <th style="text-align: right; padding: 0.75rem;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${latestOrder.items.map(item => {
                        const detailsHtml = Object.entries(item).map(([key, value]) => {
                            if (['cardName', 'price', 'quantity', 'img', 'category', 'photo', 'tags'].includes(key) || !value) {
                                return '';
                            }
                            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                            return `<tr>
                                        <td style="padding: 4px 8px; border: 1px solid #eee; background-color: #f9f9f9; font-weight: 600; width: 40%;">${formattedKey}</td>
                                        <td style="padding: 4px 8px; border: 1px solid #eee;">${value}</td>
                                    </tr>`;
                        }).join('');

                        return `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 0.75rem;" colspan="2">
                                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem; margin-bottom: 0.75rem;">
                                        <span>${item.cardName} &times; ${item.quantity || 1}</span>
                                        <span>$${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                                    </div>
                                    ${detailsHtml ? `
                                        <div class="order-item-details" style="margin-top: 1rem;">
                                            <h5 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #555;">Details:</h5>
                                            <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                                                <tbody>
                                                    ${detailsHtml}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : ''}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: 600;">
                        <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">Subtotal:</td>
                        <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">$${latestOrder.total.toFixed(2)}</td>
                    </tr>
                    <tr style="font-weight: 600;">
                        <td style="text-align: right; padding: 0.75rem;">Shipping:</td>
                        <td style="text-align: right; padding: 0.75rem;">Free shipping</td>
                    </tr>
                    <tr style="font-weight: 700; font-size: 1.2rem;">
                        <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">Total:</td>
                        <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">$${latestOrder.total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3 style="font-size: 1.4rem; margin-bottom: 1rem;">Billing Address</h3>
                    <address style="font-style: normal; line-height: 1.6;">
                        ${latestOrder.billingAddress.name}<br>
                        ${latestOrder.billingAddress.street}<br>
                        ${latestOrder.billingAddress.city}, ${latestOrder.billingAddress.zip}<br>
                        ${latestOrder.billingAddress.country}<br>
                        ${latestOrder.billingAddress.phone}<br>
                        ${latestOrder.billingAddress.email}
                    </address>
                </div>
                <div>
                    <h3 style="font-size: 1.4rem; margin-bottom: 1rem;">Shipping Address</h3>
                     <address style="font-style: normal; line-height: 1.6;">
                        ${latestOrder.shippingAddress.name}<br>
                        ${latestOrder.shippingAddress.street}<br>
                        ${latestOrder.shippingAddress.city}, ${latestOrder.shippingAddress.zip}<br>
                        ${latestOrder.shippingAddress.country}
                    </address>
                </div>
            </div>

            <div style="text-align: center; margin-top: 2.5rem;">
                <button id="goToMyAccountBtn" style="background-color: #1976d2; color: white; padding: 12px 25px; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: background-color 0.2s;">Go to My Account</button>
            </div>
        </div>
    `;

    // Payment instructions removed — bitcoin address fetch disabled

    // Insert page into DOM
    const footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(orderPage, footer);
    } else {
        document.body.appendChild(orderPage);
    }

    // Add event listener for the new button
    const goToMyAccountBtn = document.getElementById('goToMyAccountBtn');
    if (goToMyAccountBtn) {
        goToMyAccountBtn.addEventListener('click', function() {
            window.location.hash = '#dashboard';
        });
    }

    orderPage.style.display = 'block';
    window.scrollTo({top:0, behavior:'smooth'});
}

async function renderOrderViewPage(orderId) {
    // Create page article
    let orderPage = document.createElement('article');
    orderPage.id = 'orderViewPage';
    orderPage.className = 'spa-article order-view-page';

    try {
        const response = await fetch(`${API_URL}/order/${orderId}`);
        if (!response.ok) {
            throw new Error('Order not found.');
        }
        const order = await response.json();

        const orderDate = new Date(order.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const total = order.total.toFixed(2);
        const orderNumber = order.orderNumber.substring(0, 7);

        orderPage.innerHTML = `
            <div class="order-view-container" style="max-width: 800px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #ccc; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.8rem; color: #333; margin: 0;">Order Details</h2>
                    <button id="backToDashboardBtn" style="background-color: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 0.9rem; cursor: pointer;">Back to Orders</button>
                </div>
                
                <ul style="list-style: none; padding: 0; display: flex; justify-content: space-around; text-align: center; margin-bottom: 2rem;">
                    <li>
                        <span style="display: block; color: #777; font-size: 0.9rem;">ORDER NUMBER:</span>
                        <strong style="font-size: 1.1rem;">#${orderNumber}</strong>
                    </li>
                    <li>
                        <span style="display: block; color: #777; font-size: 0.9rem;">DATE:</span>
                        <strong style="font-size: 1.1rem;">${orderDate}</strong>
                    </li>
                    <li>
                        <span style="display: block; color: #777; font-size: 0.9rem;">TOTAL:</span>
                        <strong style="font-size: 1.1rem;">$${total}</strong>
                    </li>
                    <li>
                        <span style="display: block; color: #777; font-size: 0.9rem;">STATUS:</span>
                        <strong style="font-size: 1.1rem;">${order.status}</strong>
                    </li>
                </ul>

                <h3 style="font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">Items</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid #ddd;">
                            <th style="text-align: left; padding: 0.75rem;">Product</th>
                            <th style="text-align: right; padding: 0.75rem;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => {
                            const detailsHtml = Object.entries(item).map(([key, value]) => {
                                if (['cardName', 'price', 'quantity', 'img', 'category', 'photo', 'tags'].includes(key) || !value) {
                                    return '';
                                }
                                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                                return `<tr>
                                            <td style="padding: 4px 8px; border: 1px solid #eee; background-color: #f9f9f9; font-weight: 600; width: 40%;">${formattedKey}</td>
                                            <td style="padding: 4px 8px; border: 1px solid #eee;">${value}</td>
                                        </tr>`;
                            }).join('');

                            return `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 0.75rem;" colspan="2">
                                        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem; margin-bottom: 0.75rem;">
                                            <span>${item.cardName} &times; ${item.quantity || 1}</span>
                                            <span>$${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                        ${detailsHtml ? `
                                            <div class="order-item-details" style="margin-top: 1rem;">
                                                <h5 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #555;">Details:</h5>
                                                <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                                                    <tbody>
                                                        ${detailsHtml}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ` : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: 600;">
                            <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">Subtotal:</td>
                            <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">$${order.total.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight: 600;">
                            <td style="text-align: right; padding: 0.75rem;">Shipping:</td>
                            <td style="text-align: right; padding: 0.75rem;">Free shipping</td>
                        </tr>
                        <tr style="font-weight: 700; font-size: 1.2rem;">
                            <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">Total:</td>
                            <td style="text-align: right; padding: 0.75rem; border-top: 2px solid #ddd;">$${order.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h3 style="font-size: 1.4rem; margin-bottom: 1rem;">Billing Address</h3>
                        <address style="font-style: normal; line-height: 1.6;">
                            ${order.billingAddress.name}<br>
                            ${order.billingAddress.street}<br>
                            ${order.billingAddress.city}, ${order.billingAddress.zip}<br>
                            ${order.billingAddress.country}<br>
                            ${order.billingAddress.phone}<br>
                            ${order.billingAddress.email}
                        </address>
                    </div>
                    <div>
                        <h3 style="font-size: 1.4rem; margin-bottom: 1rem;">Shipping Address</h3>
                         <address style="font-style: normal; line-height: 1.6;">
                            ${order.shippingAddress.name}<br>
                            ${order.shippingAddress.street}<br>
                            ${order.shippingAddress.city}, ${order.shippingAddress.zip}<br>
                            ${order.shippingAddress.country}
                        </address>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        orderPage.innerHTML = `<div class="order-view-container" style="max-width: 800px; margin: 2rem auto; padding: 2rem; text-align: center;">
            <h2>Error</h2>
            <p>${error.message}</p>
            <button id="backToDashboardBtn" style="background-color: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 0.9rem; cursor: pointer;">Back to Orders</button>
        </div>`;
    }

    // Insert page into DOM
    const footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(orderPage, footer);
    } else {
        document.body.appendChild(orderPage);
    }

    // Add event listener for the back button
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', function() {
            window.location.hash = '#dashboard-orders';
        });
    }

    orderPage.style.display = 'block';
    window.scrollTo({top:0, behavior:'smooth'});
}

// --- Initialization function ---
function init() {
    // Initial page load based on hash
    const initialHash = window.location.hash || '#home';
    showArticleByHash(initialHash);

    // Attach all persistent event listeners
    // Sorting
	const sortBox = document.getElementById('order-sort');
	if (sortBox) {
		sortBox.addEventListener('change', function() {
			orderSort = sortBox.value;
			orderCurrentPage = 1;
			renderOrderPage();
		});
	}

    // All body clicks
	document.body.addEventListener('click', function(e) {
		// Quick View button
        const quickViewBtn = e.target.closest('.order-quick-view-btn');
		if (quickViewBtn) {
			const idx = parseInt(quickViewBtn.getAttribute('data-idx'));
            const card = getOrderCards()[idx];
			if (card) {
				openOrderQuickViewModal(card);
			}
		}
		// Pagination
		if (e.target.classList.contains('order-page-btn')) {
			const val = e.target.getAttribute('data-page');
			if (val === 'prev') {
				orderCurrentPage--;
			} else if (val === 'next') {
				orderCurrentPage++;
			} else {
				orderCurrentPage = parseInt(val);
			}
			renderOrderPage();
		}
        // Quick View Modal Qty
		if (e.target && e.target.id === 'orderQuickViewPlus') {
			updateQuickViewQty(1);
		}
		if (e.target && e.target.id === 'orderQuickViewMinus') {
			updateQuickViewQty(-1);
		}
        // View Cart from Quick View
        if (e.target && e.target.id === 'orderQuickViewViewCart') {
			closeOrderQuickViewModal();
			navigateToCart();
		}
        // Main Cart Icon
		if (e.target && e.target.id === 'cartIcon') {
			navigateToCart();
		}
	});

    // All body submits
    document.body.addEventListener('submit', function(ev) {
		if (ev.target && ev.target.id === 'orderQuickViewForm') {
			ev.preventDefault();
			
			const form = ev.target;
			if (!isOrderFormValid(form)) {
				alert('Please fill in all required fields.');
				return;
			}
			const data = {};
			Array.from(form.elements).forEach(el => {
				if (el.name) data[el.name] = el.value;
			});
			const name = document.getElementById('orderQuickViewName').textContent;
			const price = document.getElementById('orderQuickViewPrice').textContent.replace(/[^\d.]/g, '');
			const img = document.getElementById('orderQuickViewImg').src;
			const category = document.getElementById('orderQuickViewCategory').textContent;
			const tags = document.getElementById('orderQuickViewTags').textContent;
			data.cardName = name;
			data.price = price;
			data.img = img;
			data.category = category;
			data.tags = tags;
			cart.push(data);
			updateCartUI();
			showViewCartBtn();
		}
	});

    // Logout buttons
	var logoutBtnNav = document.getElementById('logoutBtnNav');
	if (logoutBtnNav) {
		logoutBtnNav.onclick = function(e) {
			e.preventDefault();
			localStorage.removeItem('isLoggedIn');
			localStorage.removeItem('currentUser');
			window.location.hash = '#login';
			updateLogoutBtn();

            // Listen for admin changes to the catalog (same-tab custom event)
            window.addEventListener('orderItemsUpdated', function() {
                try { orderCurrentPage = 1; renderOrderPage(); } catch (e) { console.error(e); }
            });

            // Also listen for cross-tab/localStorage updates so changes in another tab reflect here
            window.addEventListener('storage', function(e) {
                if (e.key === 'orderItems') {
                    try { orderCurrentPage = 1; renderOrderPage(); } catch (err) { console.error(err); }
                }
            });
		};
	}
	var mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
	if (mobileLogoutBtn) {
		mobileLogoutBtn.onclick = function(e) {
			e.preventDefault();
			localStorage.removeItem('isLoggedIn');
			localStorage.removeItem('currentUser');
			window.location.hash = '#login';
			updateLogoutBtn();
			var mobileDropdownMenu = document.getElementById('mobileDropdownMenu');
			if (mobileDropdownMenu && mobileDropdownMenu.classList.contains('open')) {
				mobileDropdownMenu.classList.remove('open');
				document.body.style.overflow = '';
			}
			var mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
			if (mobileMenuOverlay && mobileMenuOverlay.classList.contains('open')) {
				closeMobileMenu();
			}
		};
	}
	updateLogoutBtn();
}

// --- Run Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', init);

// Persist and reflect "visited/navigated" state for the hero Check More button.
// Default: plain white text. When clicked (navigated) it becomes red with white text.
document.addEventListener('DOMContentLoaded', function() {
    try {
        const cmBtn = document.querySelector('.hero-checkmore-btn');
        if (!cmBtn) return;

        // If user previously clicked the link, keep it marked active across reloads
        if (localStorage.getItem('checkmoreVisited') === 'true') {
            cmBtn.classList.add('active');
            cmBtn.setAttribute('aria-pressed', 'true');
        }

        cmBtn.addEventListener('click', function() {
            try {
                localStorage.setItem('checkmoreVisited', 'true');
            } catch (e) {}
            cmBtn.classList.add('active');
            cmBtn.setAttribute('aria-pressed', 'true');
            // Let the link open in a new tab (we don't preventDefault)
        });
    } catch (e) {
        console.error('CheckMore button initializer error', e);
    }
});

function openOrderQuickViewModal(card) {
	let modal = document.getElementById('orderQuickViewModal');
	if (!modal) return; // Should exist in HTML now

	// Populate modal content
	document.getElementById('orderQuickViewImg').src = card.img;
	document.getElementById('orderQuickViewName').textContent = card.name;
	document.getElementById('orderQuickViewPrice').textContent = `$${card.price.toFixed(2)}`;
	document.getElementById('orderQuickViewCategory').textContent = card.category;
	document.getElementById('orderQuickViewTags').textContent = orderCardTags.join(', ');
	
	// Reset form fields and button visibility
	const form = document.getElementById('orderQuickViewForm');
	if(form) {
        form.reset();
        const addToCartBtn = form.querySelector('button[type="submit"]');
        const viewCartBtn = document.getElementById('orderQuickViewViewCart');
        if (addToCartBtn) addToCartBtn.style.display = 'inline-block';
        if (viewCartBtn) viewCartBtn.style.display = 'none';
    }
	
	// Show the modal
	modal.style.display = 'flex';
}

function closeOrderQuickViewModal() {
	let modal = document.getElementById('orderQuickViewModal');
	if (modal) {
		modal.style.display = 'none';
	}
}

// Attach close events for the modal
document.addEventListener('DOMContentLoaded', function() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function() {
            const form = document.getElementById('checkoutBillingForm');
            if (form) {
                // Create a temporary submit button and click it
                const submitButton = document.createElement('button');
                submitButton.type = 'submit';
                submitButton.style.display = 'none';
                form.appendChild(submitButton);
                submitButton.click();
                form.removeChild(submitButton);
            }
        });
    }

    const modal = document.getElementById('orderQuickViewModal');
    const closeBtn = document.getElementById('orderQuickViewClose');
    const cancelBtn = document.getElementById('orderQuickViewCancel');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeOrderQuickViewModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeOrderQuickViewModal);
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target.id === 'orderQuickViewModal') {
                closeOrderQuickViewModal();
            }
        });
    }
});

// --- Cart Page Display Function (now in global scope) ---
function showCartPage() {
    // Hide all other articles first
    document.querySelectorAll('.spa-article').forEach(function(article) {
        if (article.id !== 'cartPage') {
            article.style.display = 'none';
        }
    });

    // If cart page doesn't exist, create it
    let cartArticle = document.getElementById('cartPage');
    if (!cartArticle) {
        cartArticle = document.createElement('article');
        cartArticle.id = 'cartPage';
        cartArticle.className = 'spa-article';
        cartArticle.style.flex = '1 0 auto'; // For sticky footer
        const footer = document.querySelector('footer');
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(cartArticle, footer);
        } else {
            document.body.appendChild(cartArticle);
        }
    }
    cartArticle.style.display = ''; // Make it visible

    // Render cart items
    let html = `<section style="max-width:1200px;margin:2.5rem auto 2rem auto;padding:1.5rem 1rem;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.03);border-radius:8px;position:relative;">
    <button id="cartPageCancelBtn" aria-label="Close cart" style="position:absolute;top:18px;right:18px;font-size:2rem;background:none;border:none;color:#888;cursor:pointer;z-index:2;">&times;</button>
    <h2 style='font-size:2rem;margin-bottom:1.5rem;'>Your Cart</h2>`;
    if (cart.length === 0) {
        html += '<p>Your cart is empty.</p>';
    } else {
        html += `<table style='width:100%;border-collapse:collapse;'>
        <thead><tr style='border-bottom:1px solid #ddd;'><th style='text-align:left;padding:0.7rem;'>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th></tr></thead><tbody>`;
        cart.forEach((item, idx) => {
            html += `<tr style='border-bottom: 1px solid #eee;vertical-align:top;' data-cart-row-idx="${idx}">
            <td style='padding:0.7rem;' colspan="4">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style='font-weight:600; font-size: 1.2rem;'>${item.cardName}</div>
                        <div style='font-size:0.98rem;color:#bbb;'>Price: $${parseFloat(item.price).toFixed(2)}</div>
                        <div style='font-size:0.98rem;color:#bbb;'>Quantity: ${item.quantity || 1}</div>
                        <div style='font-weight:600; font-size: 1.1rem; margin-top: 5px;'>Subtotal: $${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</div>
                    </div>
                    <div>
                        <button class="cart-edit-btn" data-cart-idx="${idx}" style="padding: 5px 10px; font-size: 0.9rem; background-color: #f0ad4e; color: white; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">Edit</button>
                        <button class="cart-cancel-btn" data-cart-idx="${idx}" style="padding: 5px 10px; font-size: 0.9rem; background-color: #d9534f; color: white; border: none; border-radius: 3px; cursor: pointer;">Remove</button>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <h4 style="margin-bottom: 10px; font-size: 1.1rem; color: #333;">Order Details:</h4>
                    <table style="width: 100%; font-size: 0.95rem; border-collapse: collapse;">
                        <tbody>
                            ${Object.entries(item).map(([key, value]) => {
                                if (key !== 'cardName' && key !== 'price' && key !== 'quantity' && key !== 'img' && key !== 'category' && key !== 'photo' && value) {
                                    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                                    return `<tr>
                                                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600; width: 30%;">${formattedKey}</td>
                                                <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
                                            </tr>`;
                                }
                                return '';
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
            </tr>`;
        });
        let subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
        let expressShippingPrice = 0;
        let shipping = window.selectedShipping === 'express' ? expressShippingPrice : 0;
        let total = subtotal + shipping;
        let shippingTo = 'CA';
        html += `
        <div class="cart-totals-board">
            <div class="cart-totals-title">CART TOTALS</div>
            <div class="cart-totals-row">
                <span>Subtotal</span>
                <span class="cart-totals-amount">$${subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-totals-row cart-totals-shipping">
                <span>Shipping</span>
                <span>
                    <label class="cart-totals-radio"><input type="radio" name="shipping" value="free" ${shipping === 0 ? 'checked' : ''}> Free Shipping 21-27 Days</label><br>
                    <label class="cart-totals-radio"><input type="radio" name="shipping" value="express" ${shipping === expressShippingPrice ? 'checked' : ''}> Express Shipping 3-5 Days: <span style="color:#43a047;font-weight:600;">$${expressShippingPrice.toFixed(2)}</span></label>
                </span>
            </div>
            <div class="cart-totals-row cart-totals-address">
                <span></span>
                <span class="cart-totals-address-info">Shipping To ${shippingTo}. <span class="cart-totals-change-address">CHANGE ADDRESS</span></span>
            </div>
            <div class="cart-totals-row cart-totals-total">
                <span>Total</span>
                <span class="cart-totals-amount cart-totals-total-amount">$${total.toFixed(2)}</span>
            </div>
            <button class="cart-totals-checkout-btn">PROCEED TO CHECKOUT</button>
        </div>`;
    }
    html += '</section>';
    cartArticle.innerHTML = html;

    // Add event listeners after rendering
    setTimeout(function() {
        // Remove button
        document.querySelectorAll('.cart-cancel-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(btn.getAttribute('data-cart-idx'));
                if (!isNaN(idx)) {
                    cart.splice(idx, 1);
                    updateCartUI();
                    showCartPage(); // Re-render the cart page
                }
            });
        });

        // Edit button
        document.querySelectorAll('.cart-edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(btn.getAttribute('data-cart-idx'));
                if (!isNaN(idx) && typeof openCartItemEditModal === 'function') {
                    openCartItemEditModal(idx);
                }
            });
        });

        // Shipping radio buttons
        document.querySelectorAll('.cart-totals-radio input[type="radio"]').forEach(function(radio) {
            radio.addEventListener('change', function() {
                window.selectedShipping = this.value;
                showCartPage(); // Re-render
            });
        });

        // Checkout button
        var checkoutBtn = document.querySelector('.cart-totals-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.onclick = function() {
                if (!localStorage.getItem('isLoggedIn')) {
                    localStorage.setItem('proceedToCheckout', 'true');
                    window.location.hash = '#login';
                } else {
                    window.location.hash = '#checkout';
                }
            };
        }

        // Close button for the whole cart page
        const cancelBtn = document.getElementById('cartPageCancelBtn');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                window.location.hash = '#order'; // Go back to a default page
            };
        }

        // Highlight item if navigated from dropdown
        let highlightIdx = null;
        try {
            const stored = localStorage.getItem('highlightCartIdx');
            if (stored) {
                highlightIdx = parseInt(stored);
                localStorage.removeItem('highlightCartIdx');
            }
        } catch (e) {}
        if (highlightIdx !== null) {
            const row = document.querySelector(`tr[data-cart-row-idx="${highlightIdx}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.background = '#fff9c4';
                setTimeout(() => { row.style.background = ''; }, 2000);
            }
        }
    }, 0);
}

// --- Cart Item Edit Modal ---
function openCartItemEditModal(idx) {
    const item = cart[idx];
    if (!item) return;

    // Create modal structure
    const modal = document.createElement('div');
    modal.id = 'cartItemEditModal';
    modal.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); display: flex; align-items: center;
        justify-content: center; z-index: 1001;
    `;

    let formHtml = '';
    for (const key in item) {
        if (key !== 'cardName' && key !== 'price' && key !== 'img' && key !== 'category' && key !== 'tags' && key !== 'photo') {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            formHtml += `
                <div style="margin-bottom: 10px;">
                    <label for="edit-${key}" style="display: block; margin-bottom: 5px;">${formattedKey}</label>
                    <input type="text" id="edit-${key}" name="${key}" value="${item[key]}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                </div>
            `;
        }
    }

    modal.innerHTML = `
        <div style="background: #fff; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin-top: 0;">Edit: ${item.cardName}</h3>
            <form id="cartItemEditForm">
                ${formHtml}
                <div style="text-align: right; margin-top: 20px;">
                    <button type="button" id="cancelEditBtn" style="padding: 10px 15px; border: none; background: #ccc; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancel</button>
                    <button type="submit" style="padding: 10px 15px; border: none; background: #2196f3; color: #fff; border-radius: 4px; cursor: pointer;">Save Changes</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners for the modal
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    document.getElementById('cartItemEditForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const updatedItem = { ...item }; // Copy original item

        Array.from(form.elements).forEach(el => {
            if (el.name) {
                updatedItem[el.name] = el.value;
            }
        });

        cart[idx] = updatedItem; // Update item in cart
        updateCartUI(); // Persist and update all UI
        showCartPage(); // Re-render cart page
        document.body.removeChild(modal);
    });
}

// Address Modal Logic
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editAddressModal');
    const closeModalBtn = document.querySelector('.address-modal-close');
    const editAddressForm = document.getElementById('editAddressForm');

    document.querySelectorAll('.edit-address-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const addressType = this.getAttribute('data-address-type');
            document.getElementById('addressTypeInput').value = addressType;
            document.getElementById('addressModalTitle').textContent = `Edit ${addressType.charAt(0).toUpperCase() + addressType.slice(1)} Address`;

            // Fetch current address to populate form
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.id) {
                const response = await fetch(`${API_URL}/user/${currentUser.id}`);
                const user = await response.json();
                const address = addressType === 'billing' ? user.billingAddress : user.shippingAddress;
                if (address) {
                    editAddressForm.name.value = address.name || '';
                    editAddressForm.street.value = address.street || '';
                    editAddressForm.city.value = address.city || '';
                    editAddressForm.country.value = address.country || '';
                }
            }
            
            modal.style.display = 'block';
        });
    });

    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            modal.style.display = 'none';
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    if (editAddressForm) {
        editAddressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser || !currentUser.id) {
                alert('You must be logged in.');
                return;
            }

            const addressType = document.getElementById('addressTypeInput').value;
            const addressData = {
                name: editAddressForm.name.value,
                street: editAddressForm.street.value,
                city: editAddressForm.city.value,
                country: editAddressForm.country.value,
            };

            const payload = {};
            if (addressType === 'billing') {
                payload.billingAddress = addressData;
            } else {
                payload.shippingAddress = addressData;
            }

            try {
                const response = await fetch(`${API_URL}/user/address/${currentUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to update address.');

                alert('Address saved successfully!');
                modal.style.display = 'none';
                populateDashboard(); // Refresh dashboard view

            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            // Show spinner on the submit button and disable it
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            let spinner;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-busy', 'true');
                spinner = submitBtn.querySelector('.spinner');
                if (!spinner) {
                    spinner = document.createElement('div');
                    spinner.className = 'spinner';
                    spinner.style.marginLeft = '8px';
                    spinner.style.display = 'inline-block';
                    submitBtn.appendChild(spinner);
                } else {
                    spinner.style.display = 'inline-block';
                }
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Login failed.');
                }

                // Store user data and login state
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                
                // Update UI
                updateLogoutBtn();
                
                // Redirect based on checkout flag
                if (localStorage.getItem('proceedToCheckout') === 'true') {
                    localStorage.removeItem('proceedToCheckout');
                    window.location.hash = '#checkout';
                } else {
                    window.location.hash = '#dashboard';
                }
                window.location.reload();

            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                // Hide spinner and re-enable button (if page didn't navigate/reload)
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.removeAttribute('aria-busy');
                    if (spinner) spinner.style.display = 'none';
                }
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = registerForm.reg_password.value;
            const confirmPassword = registerForm.reg_confirm_password.value;

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            const username = registerForm.reg_username.value;
            const email = registerForm.reg_email.value;

            // Show spinner on the register button and disable it
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            let spinner;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-busy', 'true');
                spinner = submitBtn.querySelector('.spinner');
                if (!spinner) {
                    spinner = document.createElement('div');
                    spinner.className = 'spinner';
                    spinner.style.marginLeft = '8px';
                    spinner.style.display = 'inline-block';
                    submitBtn.appendChild(spinner);
                } else {
                    spinner.style.display = 'inline-block';
                }
            }

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Registration failed.');
                }

                alert('Registration successful! Please log in.');
                
                // Switch to login tab
                document.getElementById('loginTabBtn').click();
                registerForm.reset();

            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.removeAttribute('aria-busy');
                    if (spinner) spinner.style.display = 'none';
                }
            }
        });
    }
});

// Login/Register Tab Switching
document.addEventListener('DOMContentLoaded', function() {
    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTabBtn && registerTabBtn && loginForm && registerForm) {
        loginTabBtn.addEventListener('click', function() {
            loginForm.style.display = '';
            registerForm.style.display = 'none';
            loginTabBtn.style.color = '#222';
            registerTabBtn.style.color = '#888';
        });

        registerTabBtn.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.style.display = '';
            loginTabBtn.style.color = '#888';
            registerTabBtn.style.color = '#222';
        });
    }

    // Password visibility toggles for registration form
    const togglePasswordSpans = document.querySelectorAll('.toggle-password');
    togglePasswordSpans.forEach(span => {
        span.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const eyeIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            const eyeOffIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = eyeOffIcon;
                this.style.color = '#03a9f4';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = eyeIcon;
                this.style.color = '#888';
            }
        });
    });
});

