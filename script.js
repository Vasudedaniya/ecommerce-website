// Enhanced Global Cart JavaScript
class GlobalCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('globalCart')) || [];
        this.wishlist = JSON.parse(localStorage.getItem('globalWishlist')) || [];
        this.isLoading = false;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filteredProducts = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartCounter();
        this.updateWishlistCounter();
        this.initializeComponents();
        this.setupIntersectionObserver();
        this.setupServiceWorker();
    }

    // Event Listeners Setup
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupMobileNavigation();
            this.setupSearchFunctionality();
            this.setupFilterAndSort();
            this.setupFormValidation();
            this.setupImageLazyLoading();
            this.setupScrollEffects();
            this.setupKeyboardNavigation();
        });

        // Debounced resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Optimized scroll handler
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16));

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    // Mobile Navigation
    setupMobileNavigation() {
        const header = document.querySelector('.header');
        const nav = document.querySelector('.nav');
        
        // Create mobile menu toggle
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
        
        header.querySelector('.container').appendChild(mobileToggle);

        mobileToggle.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            mobileToggle.classList.toggle('active');
            document.body.classList.toggle('nav-open');
            
            // Update aria-expanded
            const isOpen = nav.classList.contains('nav-open');
            mobileToggle.setAttribute('aria-expanded', isOpen);
        });

        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target) && nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
                mobileToggle.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    }

    // Enhanced Search Functionality
    setupSearchFunctionality() {
        const searchInputs = document.querySelectorAll('input[type="search"], .search-box input');
        
        searchInputs.forEach(input => {
            const searchContainer = input.closest('.search-box') || input.parentElement;
            const searchButton = searchContainer.querySelector('button');
            const searchResults = this.createSearchResults(searchContainer);

            // Real-time search with debouncing
            input.addEventListener('input', this.debounce((e) => {
                this.performSearch(e.target.value, searchResults);
            }, 300));

            // Search on button click
            if (searchButton) {
                searchButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.performSearch(input.value, searchResults);
                });
            }

            // Keyboard navigation for search results
            input.addEventListener('keydown', (e) => {
                this.handleSearchKeyboard(e, searchResults);
            });

            // Close search results when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target)) {
                    searchResults.style.display = 'none';
                }
            });
        });
    }

    createSearchResults(container) {
        const results = document.createElement('div');
        results.className = 'search-results';
        results.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        container.style.position = 'relative';
        container.appendChild(results);
        return results;
    }

    performSearch(query, resultsContainer) {
        if (!query.trim()) {
            resultsContainer.style.display = 'none';
            return;
        }

        // Simulate search results (replace with actual search logic)
        const mockResults = [
            { name: 'Casual T-Shirt', price: '₹899', url: 'shop.html#tshirt' },
            { name: 'Denim Jeans', price: '₹1,599', url: 'shop.html#jeans' },
            { name: 'Summer Dress', price: '₹1,299', url: 'shop.html#dress' },
            { name: 'Sneakers', price: '₹2,499', url: 'shop.html#sneakers' }
        ];

        const filteredResults = mockResults.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displaySearchResults(filteredResults, resultsContainer);
    }

    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div class="search-no-results">No products found</div>';
        } else {
            container.innerHTML = results.map(item => `
                <div class="search-result-item" tabindex="0">
                    <a href="${item.url}">
                        <span class="result-name">${item.name}</span>
                        <span class="result-price">${item.price}</span>
                    </a>
                </div>
            `).join('');
        }
        container.style.display = 'block';
    }

    // Enhanced Product Filtering and Sorting
    setupFilterAndSort() {
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        const categoryLinks = document.querySelectorAll('[data-category]');
        const sortSelect = document.getElementById('sortSelect');

        // Price range filter with visual feedback
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', this.debounce(() => {
                priceValue.textContent = this.formatPrice(priceRange.value);
                this.filterProducts();
                this.updatePriceRangeBackground(priceRange);
            }, 100));

            this.updatePriceRangeBackground(priceRange);
        }

        // Category filtering with animation
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActiveCategory(link);
                this.filterProducts();
            });
        });

        // Enhanced sorting
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortProducts(sortSelect.value);
                this.showSortingFeedback();
            });
        }

        // Initialize products array
        this.initializeProducts();
    }

    initializeProducts() {
        const products = document.querySelectorAll('.product-card');
        this.allProducts = Array.from(products).map(product => ({
            element: product,
            name: product.querySelector('h3')?.textContent || '',
            price: parseInt(product.getAttribute('data-price')) || 0,
            category: product.getAttribute('data-category') || '',
            rating: Math.floor(Math.random() * 5) + 1, // Mock rating
            isNew: Math.random() > 0.7 // Mock new status
        }));
        this.filteredProducts = [...this.allProducts];
    }

    setActiveCategory(activeLink) {
        document.querySelectorAll('[data-category]').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
        
        // Add visual feedback
        activeLink.style.transform = 'scale(1.05)';
        setTimeout(() => {
            activeLink.style.transform = '';
        }, 150);
    }

    filterProducts() {
        const activeCategory = document.querySelector('[data-category].active');
        const priceRange = document.getElementById('priceRange');
        
        if (!activeCategory || !priceRange) return;

        const selectedCategory = activeCategory.getAttribute('data-category');
        const maxPrice = parseInt(priceRange.value);

        this.filteredProducts = this.allProducts.filter(product => {
            const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
            const priceMatch = product.price <= maxPrice;
            return categoryMatch && priceMatch;
        });

        this.displayProducts();
        this.updateResultsCount();
        this.animateProductCards();
    }

    displayProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        // Hide all products first
        this.allProducts.forEach(product => {
            product.element.style.display = 'none';
        });

        // Show filtered products with pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        productsToShow.forEach(product => {
            product.element.style.display = 'block';
        });

        this.updatePagination();
    }

    sortProducts(sortBy) {
        this.filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'rating':
                    return b.rating - a.rating;
                case 'newest':
                    return b.isNew - a.isNew;
                default:
                    return 0;
            }
        });

        this.displayProducts();
        this.animateProductCards();
    }

    // Enhanced Cart Functionality
    setupCartFunctionality() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                e.preventDefault();
                this.addToCart(e.target);
            }

            if (e.target.closest('.cart-icon')) {
                this.toggleCartSidebar();
            }

            if (e.target.classList.contains('remove-from-cart')) {
                this.removeFromCart(e.target.dataset.productId);
            }

            if (e.target.classList.contains('wishlist-btn')) {
                this.toggleWishlist(e.target);
            }
        });
    }

    addToCart(button) {
        const productCard = button.closest('.product-card');
        const product = this.extractProductData(productCard);
        
        // Check if product already exists in cart
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            this.showNotification(`Updated ${product.name} quantity in cart`, 'success');
        } else {
            this.cart.push({ ...product, quantity: 1 });
            this.showNotification(`${product.name} added to cart!`, 'success');
        }

        this.saveCart();
        this.updateCartCounter();
        this.animateAddToCart(button);
        this.updateCartSidebar();
    }

    extractProductData(productCard) {
        return {
            id: productCard.dataset.productId || Date.now().toString(),
            name: productCard.querySelector('h3')?.textContent || '',
            price: productCard.querySelector('.price')?.textContent || '',
            image: productCard.querySelector('img')?.src || '',
            category: productCard.dataset.category || ''
        };
    }

    animateAddToCart(button) {
        const originalText = button.textContent;
        const originalBg = button.style.backgroundColor;
        
        button.textContent = 'Added!';
        button.style.backgroundColor = '#27ae60';
        button.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = originalBg;
            button.style.transform = '';
        }, 1500);
    }

    // Wishlist Functionality
    toggleWishlist(button) {
        const productCard = button.closest('.product-card');
        const product = this.extractProductData(productCard);
        const isInWishlist = this.wishlist.some(item => item.id === product.id);

        if (isInWishlist) {
            this.wishlist = this.wishlist.filter(item => item.id !== product.id);
            button.classList.remove('active');
            this.showNotification(`${product.name} removed from wishlist`, 'info');
        } else {
            this.wishlist.push(product);
            button.classList.add('active');
            this.showNotification(`${product.name} added to wishlist!`, 'success');
        }

        this.saveWishlist();
        this.updateWishlistCounter();
        this.animateWishlistButton(button);
    }

    animateWishlistButton(button) {
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }

    // Enhanced Form Validation
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });

            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';

        // Clear previous errors
        this.clearFieldError(field);

        // Required field validation
        if (required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (type === 'tel' && value) {
            const phoneRegex = /^[\+]?[0-9\s\-$$$$]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Password validation
        if (type === 'password' && value) {
            if (value.length < 8) {
                isValid = false;
                errorMessage = 'Password must be at least 8 characters long';
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Notification System
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Performance Optimizations
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Intersection Observer for animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const elementsToAnimate = document.querySelectorAll(
            '.product-card, .feature-item, .blog-card, .value-card, .team-member'
        );
        
        elementsToAnimate.forEach(el => observer.observe(el));
    }

    // Local Storage Management
    saveCart() {
        localStorage.setItem('globalCart', JSON.stringify(this.cart));
    }

    saveWishlist() {
        localStorage.setItem('globalWishlist', JSON.stringify(this.wishlist));
    }

    // Update counters
    updateCartCounter() {
        const cartBadge = document.querySelector('.cart-badge');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    updateWishlistCounter() {
        const wishlistBadge = document.querySelector('.wishlist-badge');
        
        if (wishlistBadge) {
            wishlistBadge.textContent = this.wishlist.length;
            wishlistBadge.style.display = this.wishlist.length > 0 ? 'flex' : 'none';
        }
    }

    // Utility functions
    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Initialize components
    initializeComponents() {
        this.createCartBadge();
        this.createWishlistBadge();
        this.setupCartFunctionality();
        this.setupScrollToTop();
        this.setupImageZoom();
        this.setupProductQuickView();
    }

    createCartBadge() {
        const cartIcon = document.querySelector('.fa-shopping-cart');
        if (cartIcon && !document.querySelector('.cart-badge')) {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            
            cartIcon.parentElement.style.position = 'relative';
            cartIcon.parentElement.appendChild(badge);
        }
    }

    createWishlistBadge() {
        const wishlistIcon = document.querySelector('.fa-heart');
        if (wishlistIcon && !document.querySelector('.wishlist-badge')) {
            const badge = document.createElement('span');
            badge.className = 'wishlist-badge';
            badge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: none;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            
            wishlistIcon.parentElement.style.position = 'relative';
            wishlistIcon.parentElement.appendChild(badge);
        }
    }

    setupScrollToTop() {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #e74c3c;
            color: white;
            border: none;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
        `;

        document.body.appendChild(scrollBtn);

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Initialize the application
const globalCartApp = new GlobalCart();

// Export for use in other scripts
window.GlobalCart = GlobalCart;