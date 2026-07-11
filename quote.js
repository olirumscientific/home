// ==========================================
// 1. DYNAMIC DATA LOADERS (JSON Fetching)
// ==========================================

// Loads a single product onto the product.html page
async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId || !document.getElementById('dynamic-title')) return;

    try {
        const response = await fetch('products.json');
        const data = await response.json();

        if (data[productId]) {
            const product = data[productId];

            document.getElementById('dynamic-title').innerText = product.name;
            document.getElementById('dynamic-price').innerText = `₹${parseFloat(product.price).toFixed(2)}`;
            document.getElementById('dynamic-image').src = product.image;
            document.getElementById('dynamic-image').alt = product.name;
            document.getElementById('dynamic-description').innerText = product.description || "No description available.";
            document.getElementById('dynamic-reviews').innerText = product.reviews || "No reviews yet.";

            const quoteBtn = document.getElementById('dynamic-btn-quote');
            quoteBtn.setAttribute('data-name', product.name);
            quoteBtn.setAttribute('data-price', product.price);
            quoteBtn.setAttribute('data-category', product.category);
            
            quoteBtn.style.display = "block"; 
            // ADD THIS NEW LINE RIGHT HERE:
            quoteBtn.addEventListener('click', addToQuote);
            document.title = `${product.name} - Olirum Scientific`;
        } else {
            document.getElementById('dynamic-title').innerText = "Product Not Found";
            document.getElementById('dynamic-description').innerText = "Please check the URL and try again.";
        }
    } catch (error) {
        console.error("Error loading product data:", error);
    }
}

// Loads a grid of products onto the category.html template
// Loads a grid of products (Handles BOTH Categories and Search Results)
async function loadCategoryData() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetCategory = urlParams.get('cat'); 
    const searchQuery = urlParams.get('search'); // Looks for a search term

    const gridContainer = document.getElementById('dynamic-product-grid');
    const titleContainer = document.getElementById('dynamic-category-title');
    const countContainer = document.getElementById('product-count');

    // Stop executing if we aren't on the grid page or lack parameters
    if (!gridContainer || (!targetCategory && !searchQuery)) return;

    try {
        const response = await fetch('products.json');
        const products = await response.json();

        // 1. Set up the page titles based on whether it's a search or a category view
        if (searchQuery) {
            titleContainer.innerText = `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"`;
            document.title = `Search: ${searchQuery} - Olirum Scientific`;
        } else if (targetCategory) {
            let displayTitle = targetCategory.replace('-', ' ').toUpperCase();
            titleContainer.innerText = displayTitle;
            document.title = `${displayTitle} - Olirum Scientific`;
            
            const activeNavLink = document.getElementById(`nav-${targetCategory}`);
            if (activeNavLink) activeNavLink.classList.add('active');
        }

        let gridHTML = '';
        let matchCount = 0;

        // 2. Loop through all products in JSON to find matches
        for (const productId in products) {
            const product = products[productId];
            let isMatch = false;

            // Logic for a Search query
            if (searchQuery) {
                const queryLower = searchQuery.toLowerCase();
                // Check if the search term exists in the product name or category
                if (product.name.toLowerCase().includes(queryLower) || 
                    product.category.toLowerCase().includes(queryLower)) {
                    isMatch = true;
                }
            } 
            // Logic for a standard Category click
            else if (targetCategory) {
                if (product.category.toLowerCase() === targetCategory.toLowerCase()) {
                    isMatch = true;
                }
            }

            // 3. Build the HTML card if a match was found
            if (isMatch) {
                matchCount++;
                gridHTML += `
                    <div class="product-card" style="cursor: pointer; position: relative;">
                        <a href="product.html?id=${productId}" style="display: block; color: inherit; text-decoration: none;">
                            <img src="${product.image}" alt="${product.name}">
                            <h3>${product.name}</h3>
                            <p class="product-price">₹${parseFloat(product.price).toFixed(2)}</p>
                            <p class="product-category">${product.category.replace('-', ' ').toUpperCase()}</p>
                        </a>
                        <div class="purchase-controls" style="display: flex; gap: 10px; align-items: center; margin-top: 15px; position: relative; z-index: 2;">
                            <input type="number" id="qty-${productId}" value="1" min="1" style="width: 50px; padding: 8px;">
                            <button class="btn-quote" 
                                    data-name="${product.name}" 
                                    data-price="${product.price}" 
                                    data-category="${product.category.toUpperCase()}"
                                    data-qty-id="qty-${productId}">
                                Add to Quote
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        // 4. Output the results to the page
        if (matchCount === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px 0; font-size: 1.2rem;">No products matched your search.</p>';
            countContainer.innerText = 'SHOWING 0 RESULTS';
        } else {
            gridContainer.innerHTML = gridHTML;
            countContainer.innerText = `SHOWING ALL ${matchCount} RESULTS`;
            
            const buttons = gridContainer.querySelectorAll('.btn-quote');
            buttons.forEach(button => {
                button.addEventListener('click', addToQuote);
            });
        }
    } catch (error) {
        console.error("Error fetching or filtering JSON data:", error);
    }
}

// ==========================================
// 2. CART & QUOTE LOGIC (LocalStorage)
// ==========================================

function addToQuote(event) {
    const button = event.target;

    if (button.innerText === "Go to Quote Page") {
        window.location.href = "quote.html";
        return; 
    }

    const productName = button.getAttribute('data-name');
    const productPrice = button.getAttribute('data-price');
    const productCategory = button.getAttribute('data-category');
    const qtyId = button.getAttribute('data-qty-id');
    
    let quantity = 1;
    if (qtyId && document.getElementById(qtyId)) {
        quantity = parseInt(document.getElementById(qtyId).value) || 1;
    }

    const item = {
        name: productName,
        price: parseFloat(productPrice) || 0,
        category: productCategory,
        quantity: quantity
    };

    let quoteList = JSON.parse(localStorage.getItem('quoteItems')) || [];
    
    const existingIndex = quoteList.findIndex(i => i.name === productName);
    if (existingIndex > -1) {
        quoteList[existingIndex].quantity += quantity;
    } else {
        quoteList.push(item);
    }

    localStorage.setItem('quoteItems', JSON.stringify(quoteList));

    button.innerText = "Go to Quote Page";
    button.style.backgroundColor = "#2f855a"; 
}

function renderCart() {
    const cartContainer = document.getElementById('quote-cart-container');
    if (!cartContainer) return; 

    const mainContainer = document.getElementById('quote-container');
    const checkoutForm = document.getElementById('checkout-form-container');
    const pageTitle = document.querySelector('.category-title');

    let quoteList = JSON.parse(localStorage.getItem('quoteItems')) || [];

    // --- EMPTY CART LOGIC (Centers the page and hides form) ---
    if (quoteList.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-msg" style="text-align: center; padding: 60px 20px; font-size: 1.2rem;">
                Your quote cart is currently empty.<br>
                <a href="all-products.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #1a365d; color: #fff; text-decoration: none; border-radius: 4px;">Browse Products</a>
            </div>`;
        
        if (checkoutForm) checkoutForm.style.display = 'none';
        
        if (mainContainer) {
            mainContainer.style.display = 'block'; 
            mainContainer.style.textAlign = 'center';
        }
        if (pageTitle) {
            pageTitle.style.textAlign = 'center';
            pageTitle.style.borderBottom = 'none';
        }
        return;
    }

    // --- POPULATED CART LOGIC (Side-by-Side) ---
    if (mainContainer) {
        mainContainer.style.display = 'flex';
        mainContainer.style.textAlign = 'left';
    }
    if (pageTitle) {
        pageTitle.style.textAlign = 'left';
        pageTitle.style.borderBottom = '2px solid #e2e8f0';
    }
    if (checkoutForm) checkoutForm.style.display = 'block';

    let tableHTML = `
        <table class="quote-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalEstimate = 0;

    quoteList.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0; 
        const itemQty = parseInt(item.quantity) || 1;
        const subtotal = itemPrice * itemQty;
        totalEstimate += subtotal;

        tableHTML += `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td>₹${itemPrice.toFixed(2)}</td>
                <td>${itemQty}</td>
                <td>₹${subtotal.toFixed(2)}</td>
                <td>
                    <button class="remove-btn" onclick="removeItem(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" style="text-align: right; font-weight: bold;">Estimated Total:</td>
                    <td colspan="2" style="font-weight: bold; color: #1a365d;">₹${totalEstimate.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;

    cartContainer.innerHTML = tableHTML;
}

function removeItem(index) {
    let quoteList = JSON.parse(localStorage.getItem('quoteItems')) || [];
    quoteList.splice(index, 1);
    localStorage.setItem('quoteItems', JSON.stringify(quoteList));
    renderCart();
}

// ==========================================
// 3. UI HELPERS (Tabs & Navigation)
// ==========================================

function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active-tab");
    }

    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active-tab");
    evt.currentTarget.classList.add("active");
}

// ==========================================
// 4. INITIALIZATION (Runs on Page Load)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Run dynamic loaders if elements are present on the current page
    loadProductData();
    loadCategoryData();

    // 2. Initialize Hamburger Menu
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('show'); 
        });
    }

    // 3. Attach "Add to Quote" listeners to any hardcoded static buttons
    const buttons = document.querySelectorAll('.btn-quote');
    buttons.forEach(button => {
        // We only add listeners to buttons that aren't dynamic placeholders
        if (button.id !== 'dynamic-btn-quote' && button.id !== 'submit-quote-btn') {
            button.addEventListener('click', addToQuote);
        }
    });

    // 4. Render the cart table if we are on quote.html
    renderCart();
    // --- Global Search Trigger ---
    const searchBtn = document.getElementById('global-search-btn');
    const searchInput = document.getElementById('global-search-input');

    function executeSearch() {
        const query = searchInput.value.trim();
        if (query) {
            // Redirects to the category template, but passes a search query instead
            window.location.href = `category.html?search=${encodeURIComponent(query)}`;
        }
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', executeSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') executeSearch();
        });
    }
});
// ==========================================
// 5. EMAILJS CHECKOUT LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize EmailJS with your Public Key
    if (typeof emailjs !== 'undefined') {
        emailjs.init("CXP3r5IinhevalOUK");
    }

    // 2. Unhide the checkout form if the cart has items
    const quoteList = JSON.parse(localStorage.getItem('quoteItems')) || [];
    const checkoutContainer = document.getElementById('checkout-form-container');
    if (quoteList.length > 0 && checkoutContainer) {
        checkoutContainer.style.display = "block";
    }

    // 3. Handle the Form Submission
    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Stop page from refreshing
            
            const btn = document.getElementById('submit-quote-btn');
            btn.innerText = "Sending...";
            btn.disabled = true;

            // --- HTML EMAIL GENERATOR ---
            
            // MASTER SETTING: Change to false to hide prices in the buyer's email
            const showPricesToBuyer = true; 

            let totalEstimate = 0;
            
            // Start the Seller Table (Always shows prices)
            let sellerCartHTML = `
                <table style="width:100%; border-collapse: collapse; font-family: sans-serif;">
                    <tr style="background-color: #f4f4f4;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                    </tr>
            `;

            // Start the Buyer Table (Dynamic based on your setting)
            let buyerCartHTML = `
                <table style="width:100%; border-collapse: collapse; font-family: sans-serif;">
                    <tr style="background-color: #f4f4f4;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                        ${showPricesToBuyer ? '<th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>' : ''}
                    </tr>
            `;

            // Loop through the cart and build the HTML rows
            quoteList.forEach(item => {
                const subtotal = item.quantity * item.price;
                totalEstimate += subtotal;
                
                // Add row to Seller Table
                sellerCartHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${subtotal.toFixed(2)}</td>
                    </tr>
                `;

                // Add row to Buyer Table
                buyerCartHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                        ${showPricesToBuyer ? `<td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${subtotal.toFixed(2)}</td>` : ''}
                    </tr>
                `;
            });

            // Add the Total Row to the Seller Table
            sellerCartHTML += `
                <tr>
                    <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">ESTIMATED TOTAL:</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${totalEstimate.toFixed(2)}</td>
                </tr>
                </table>
            `;

            // Add the Total Row to the Buyer Table (if prices are shown)
            if (showPricesToBuyer) {
                buyerCartHTML += `
                    <tr>
                        <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">ESTIMATED TOTAL:</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${totalEstimate.toFixed(2)}</td>
                    </tr>
                `;
            }
            buyerCartHTML += `</table>`;

            // Match these keys to the {{variables}} in your EmailJS template
            const templateParams = {
                user_name: document.getElementById('user_name').value,
                user_email: document.getElementById('user_email').value,
                cart_html_seller: sellerCartHTML,
                cart_html_buyer: buyerCartHTML
            };

            // Using your exact Service ID and Template ID
            emailjs.send('service_x00vgxa', 'template_w58swuh', templateParams)
                .then(function(response) {
                   alert("Success! Your quote request has been sent.");
                   localStorage.removeItem('quoteItems'); // Clear the cart
                   window.location.reload(); // Refresh to show empty cart
                }, function(error) {
                   console.error("EmailJS Error:", error);
                   alert("Failed to send request. Please try again.");
                   btn.innerText = "Send Request";
                   btn.disabled = false;
                });
        });
    }
});