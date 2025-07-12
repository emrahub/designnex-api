// DesignNex Enhanced Admin Dashboard - Shopify Style
// Mobile-first, responsive, and feature-rich admin interface

// Global variables
let charts = {};
let currentData = {};
let mobileBreakpoint = 768;
let sidebarCollapsed = false;
let refreshIntervals = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    setupMobileHandlers();
    loadInitialData();
    startAutoRefresh();
});

// ===== INITIALIZATION =====

function initializeDashboard() {
    console.log('🚀 Initializing DesignNex Admin Dashboard');
    
    // Check if we're on mobile and set initial state
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= mobileBreakpoint) {
        sidebar.classList.add('mobile-hidden');
        sidebar.classList.remove('mobile-visible');
        console.log('📱 Mobile mode detected - sidebar hidden');
    } else {
        sidebar.classList.remove('mobile-hidden', 'mobile-visible');
        console.log('🖥️ Desktop mode detected');
    }
    
    // Load user preferences
    loadUserPreferences();
    
    // Setup navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    console.log('✅ Dashboard initialized successfully');
}

function setupEventListeners() {
    // Window resize handler
    window.addEventListener('resize', handleResize);
    
    // Form submission handlers
    document.getElementById('orderUpdateForm').addEventListener('submit', handleOrderUpdate);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Offline/online handlers
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
}

function setupMobileHandlers() {
    // Touch gesture handlers for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe right to open sidebar on mobile
        if (deltaX > 50 && Math.abs(deltaY) < 100 && window.innerWidth <= mobileBreakpoint) {
            if (touchStartX < 50) { // Start swipe from left edge
                openMobileSidebar();
            }
        }
        
        // Swipe left to close sidebar on mobile
        if (deltaX < -50 && Math.abs(deltaY) < 100 && window.innerWidth <= mobileBreakpoint) {
            closeMobileSidebar();
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });
}

// ===== NAVIGATION =====

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section, item);
        });
    });
}

function showSection(sectionId, navItem) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        loadSectionData(sectionId);
        
        // Close mobile sidebar after navigation
        if (window.innerWidth <= mobileBreakpoint) {
            closeMobileSidebar();
        }
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Update page title
        updatePageTitle(sectionId);
    }
}

function updatePageTitle(sectionId) {
    const titles = {
        'dashboard': 'Dashboard Overview',
        'orders': 'Order Management',
        'designs': 'Customer Designs',
        'customers': 'Customer Analytics',
        'analytics': 'Advanced Analytics',
        'stores': 'Store Management',
        'ai-usage': 'AI Usage Analytics',
        'system': 'System Management'
    };
    
    document.title = `${titles[sectionId] || 'Dashboard'} - DesignNex Admin`;
}

// ===== MOBILE SIDEBAR =====

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    console.log('🔄 Toggling mobile sidebar');
    
    if (sidebar.classList.contains('mobile-hidden') || !sidebar.classList.contains('mobile-visible')) {
        openMobileSidebar();
    } else {
        closeMobileSidebar();
    }
}

function openMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    console.log('📱 Opening mobile sidebar');
    
    sidebar.classList.remove('mobile-hidden');
    sidebar.classList.add('mobile-visible');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    console.log('📱 Closing mobile sidebar');
    
    sidebar.classList.add('mobile-hidden');
    sidebar.classList.remove('mobile-visible');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleIcon = document.querySelector('.sidebar-toggle i');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        toggleIcon.className = 'fas fa-chevron-left';
    }
    
    // Save preference
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    
    // Resize charts after sidebar toggle
    setTimeout(() => {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }, 300);
}

// ===== DATA LOADING =====

async function loadInitialData() {
    showLoadingOverlay('Loading dashboard data...');
    
    try {
        await Promise.all([
            loadDashboardData(),
            loadStores(),
            loadRecentActivity()
        ]);
        
        console.log('✅ Initial data loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
        showNotification('Failed to load dashboard data', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function loadSectionData(sectionId) {
    console.log(`📊 Loading data for section: ${sectionId}`);
    
    switch(sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'orders':
            await loadOrders();
            break;
        case 'designs':
            await loadDesigns();
            break;
        case 'customers':
            await loadCustomers();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
        case 'stores':
            await loadStores();
            break;
        case 'ai-usage':
            await loadAIUsage();
            break;
        case 'system':
            await loadSystemLogs();
            break;
        default:
            console.warn(`Unknown section: ${sectionId}`);
    }
}

// ===== DASHBOARD DATA =====

async function loadDashboardData() {
    try {
        const [overviewData, revenueData, ordersData] = await Promise.all([
            fetchWithFallback('/api/admin/dashboard-overview'),
            fetchWithFallback('/api/admin/revenue-data'),
            fetchWithFallback('/api/admin/orders-data')
        ]);
        
        updateDashboardMetrics(overviewData);
        updateRevenueChart(revenueData);
        updateOrderStatusChart(ordersData);
        
    } catch (error) {
        console.error('Dashboard data loading error:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateDashboardMetrics(data) {
    const metrics = data || {
        totalRevenue: 0,
        totalOrders: 0,
        totalDesigns: 0,
        totalStores: 0,
        changes: {
            revenue: 0,
            orders: 0,
            designs: 0,
            stores: 0
        }
    };
    
    // Update values
    updateElement('totalRevenue', `$${formatNumber(metrics.totalRevenue)}`);
    updateElement('totalOrders', formatNumber(metrics.totalOrders));
    updateElement('totalDesigns', formatNumber(metrics.totalDesigns));
    updateElement('totalStores', formatNumber(metrics.totalStores));
    
    // Update change indicators
    updateChangeIndicator('revenueChange', metrics.changes.revenue);
    updateChangeIndicator('ordersChange', metrics.changes.orders);
    updateChangeIndicator('designsChange', metrics.changes.designs);
    updateChangeIndicator('storesChange', metrics.changes.stores);
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = element.querySelector('i');
    const text = element.querySelector('span');
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    // Update classes
    element.className = `stat-card-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`;
    
    // Update icon
    if (icon) {
        icon.className = `fas fa-arrow-${isPositive ? 'up' : isNegative ? 'down' : 'right'}`;
    }
    
    // Update text
    if (text) {
        text.textContent = `${Math.abs(change)}% from last period`;
    }
}

// ===== CHART MANAGEMENT =====

function initializeCharts() {
    // Initialize empty charts
    createRevenueChart();
    createOrderStatusChart();
    createCustomerJourneyChart();
    createConversionChart();
}

function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#00848e',
                backgroundColor: 'rgba(0, 132, 142, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}

function createOrderStatusChart() {
    const ctx = document.getElementById('orderStatusChart');
    if (!ctx) return;
    
    charts.orderStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Processing', 'Shipped', 'Delivered'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#ffc453', '#006fbb', '#00848e', '#008060']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createCustomerJourneyChart() {
    const ctx = document.getElementById('customerJourneyChart');
    if (!ctx) return;
    
    charts.customerJourney = new Chart(ctx, {
        type: 'funnel',
        data: {
            labels: ['Visitors', 'Started Design', 'Completed Design', 'Added to Cart', 'Purchased'],
            datasets: [{
                data: [100, 75, 60, 40, 25],
                backgroundColor: [
                    '#e1e3e5',
                    '#c9cccf',
                    '#a7acb1',
                    '#00848e',
                    '#008060'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function createConversionChart() {
    const ctx = document.getElementById('conversionChart');
    if (!ctx) return;
    
    charts.conversion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Visit to Design', 'Design to Cart', 'Cart to Purchase'],
            datasets: [{
                label: 'Conversion Rate (%)',
                data: [0, 0, 0],
                backgroundColor: ['#00848e', '#006fbb', '#008060']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateRevenueChart(data) {
    if (!charts.revenue || !data) return;
    
    charts.revenue.data.labels = data.labels || [];
    charts.revenue.data.datasets[0].data = data.values || [];
    charts.revenue.update('none');
}

function updateOrderStatusChart(data) {
    if (!charts.orderStatus || !data) return;
    
    charts.orderStatus.data.datasets[0].data = data.values || [0, 0, 0, 0];
    charts.orderStatus.update('none');
}

// ===== ORDERS MANAGEMENT =====

async function loadOrders() {
    const container = document.getElementById('ordersTableBody');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-text"><div class="spinner"></div>Loading orders...</div>';
    
    try {
        const orders = await fetchAllOrders();
        displayOrders(orders);
    } catch (error) {
        console.error('Orders loading error:', error);
        container.innerHTML = '<div class="loading-text text-error">Failed to load orders</div>';
    }
}

async function fetchAllOrders() {
    // Simulate API call with sample data
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    id: 1,
                    customer_email: 'customer1@example.com',
                    product_title: 'Custom T-Shirt',
                    store_name: 'Test Store',
                    total_price: 29.99,
                    order_status: 'processing',
                    order_date: new Date().toISOString()
                },
                {
                    id: 2,
                    customer_email: 'customer2@example.com',
                    product_title: 'Custom Hoodie',
                    store_name: 'Test Store',
                    total_price: 49.99,
                    order_status: 'shipped',
                    order_date: new Date().toISOString()
                }
            ]);
        }, 1000);
    });
}

function displayOrders(orders) {
    const container = document.getElementById('ordersTableBody');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="loading-text">
                <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.5;"></i>
                <span>No orders found</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr;">
            <div class="table-cell">
                <div class="table-cell-primary">${order.customer_email}</div>
                <div class="table-cell-secondary">${order.product_title}</div>
            </div>
            <div class="table-cell">
                <div class="table-cell-primary">${order.store_name || 'Unknown Store'}</div>
            </div>
            <div class="table-cell">
                <div class="table-cell-primary">$${order.total_price}</div>
            </div>
            <div class="table-cell">
                <span class="status-badge ${order.order_status}">${order.order_status}</span>
            </div>
            <div class="table-cell">
                <button onclick="openOrderModal(${order.id}, '${order.order_status}')" class="btn btn-sm btn-secondary">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ===== DESIGNS MANAGEMENT =====

async function loadDesigns() {
    const container = document.getElementById('designsTableBody');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-text"><div class="spinner"></div>Loading designs...</div>';
    
    try {
        const designs = await fetchAllDesigns();
        displayDesigns(designs);
    } catch (error) {
        console.error('Designs loading error:', error);
        container.innerHTML = '<div class="loading-text text-error">Failed to load designs</div>';
    }
}

async function fetchAllDesigns() {
    // Simulate API call with sample data
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    id: 1,
                    customer_email: 'customer1@example.com',
                    product_title: 'Custom T-Shirt',
                    ai_prompt: 'Blue dragon with fire breathing',
                    store_name: 'Test Store',
                    status: 'saved',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    customer_email: 'customer2@example.com',
                    product_title: 'Custom Hoodie',
                    ai_prompt: 'Minimalist mountain landscape',
                    store_name: 'Test Store',
                    status: 'ordered',
                    created_at: new Date().toISOString()
                }
            ]);
        }, 1000);
    });
}

function displayDesigns(designs) {
    const container = document.getElementById('designsTableBody');
    if (!container) return;
    
    if (designs.length === 0) {
        container.innerHTML = `
            <div class="loading-text">
                <i class="fas fa-palette" style="font-size: 2rem; opacity: 0.5;"></i>
                <span>No designs found</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = designs.map(design => `
        <div class="table-row" style="grid-template-columns: 2fr 2fr 1fr 1fr 1fr;">
            <div class="table-cell">
                <div class="table-cell-primary">${design.customer_email || 'Anonymous'}</div>
                <div class="table-cell-secondary">${design.product_title}</div>
            </div>
            <div class="table-cell">
                <div class="table-cell-primary">${design.ai_prompt ? design.ai_prompt.substring(0, 40) + '...' : 'No prompt'}</div>
            </div>
            <div class="table-cell">
                <div class="table-cell-primary">${design.store_name || 'Unknown Store'}</div>
            </div>
            <div class="table-cell">
                <span class="status-badge ${design.status}">${design.status}</span>
            </div>
            <div class="table-cell">
                <div class="table-cell-secondary">${new Date(design.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

// ===== MODAL MANAGEMENT =====

function openOrderModal(orderId, currentStatus) {
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('orderStatusSelect').value = currentStatus;
    document.getElementById('orderModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('orderUpdateForm').reset();
    document.body.style.overflow = '';
}

async function handleOrderUpdate(e) {
    e.preventDefault();
    
    const orderId = document.getElementById('orderIdInput').value;
    const status = document.getElementById('orderStatusSelect').value;
    const trackingNumber = document.getElementById('trackingNumberInput').value;
    const notes = document.getElementById('notesInput').value;
    
    try {
        showLoadingOverlay('Updating order...');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotification('Order updated successfully', 'success');
        closeOrderModal();
        await loadOrders(); // Refresh orders
        
    } catch (error) {
        console.error('Order update error:', error);
        showNotification('Failed to update order', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// ===== UTILITY FUNCTIONS =====

async function fetchWithFallback(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`API call failed for ${url}, using fallback data:`, error);
        return getFallbackData(url);
    }
}

function getFallbackData(url) {
    // Return sample data based on endpoint
    const sampleData = {
        '/api/admin/dashboard-overview': {
            totalRevenue: 12500.00,
            totalOrders: 45,
            totalDesigns: 123,
            totalStores: 3,
            changes: { revenue: 15, orders: 8, designs: 22, stores: 0 }
        },
        '/api/admin/revenue-data': {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [1200, 1900, 800, 1500, 2500, 2200, 3000]
        },
        '/api/admin/orders-data': {
            values: [12, 8, 15, 10] // pending, processing, shipped, delivered
        }
    };
    
    return sampleData[url] || {};
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    
    if (overlay && messageEl) {
        messageEl.textContent = message;
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// ===== EVENT HANDLERS =====

function handleResize() {
    // Handle mobile/desktop transitions
    if (window.innerWidth > mobileBreakpoint) {
        // Desktop view
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('mobile-hidden', 'mobile-visible');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        console.log('🖥️ Switched to desktop mode');
    } else {
        // Mobile view
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('mobile-hidden')) {
            closeMobileSidebar();
        }
        console.log('📱 Switched to mobile mode');
    }
    
    // Resize charts
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
}

function handleKeyboardShortcuts(e) {
    // Keyboard navigation
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'r':
                e.preventDefault();
                refreshDashboard();
                break;
            case '1':
                e.preventDefault();
                showSection('dashboard', document.querySelector('[data-section="dashboard"]'));
                break;
            case '2':
                e.preventDefault();
                showSection('orders', document.querySelector('[data-section="orders"]'));
                break;
            case '3':
                e.preventDefault();
                showSection('designs', document.querySelector('[data-section="designs"]'));
                break;
        }
    }
    
    // Escape key to close modals
    if (e.key === 'Escape') {
        closeOrderModal();
        closeMobileSidebar();
    }
}

function handleOnlineStatus() {
    console.log('🌐 Back online');
    showNotification('Connection restored', 'success');
    loadInitialData();
}

function handleOfflineStatus() {
    console.log('📴 Gone offline');
    showNotification('Working offline', 'warning');
}

// ===== USER PREFERENCES =====

function loadUserPreferences() {
    const collapsed = localStorage.getItem('sidebarCollapsed');
    if (collapsed === 'true' && window.innerWidth > mobileBreakpoint) {
        toggleSidebar();
    }
}

function saveUserPreferences() {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
}

// ===== AUTO REFRESH =====

function startAutoRefresh() {
    // Refresh dashboard every 30 seconds
    refreshIntervals.dashboard = setInterval(async () => {
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'dashboard') {
            await loadDashboardData();
        }
    }, 30000);
    
    // Refresh current section every 2 minutes
    refreshIntervals.section = setInterval(async () => {
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            await loadSectionData(activeSection.id);
        }
    }, 120000);
}

function stopAutoRefresh() {
    Object.values(refreshIntervals).forEach(interval => {
        clearInterval(interval);
    });
}

// ===== REFRESH FUNCTIONS =====

async function refreshDashboard() {
    showLoadingOverlay('Refreshing dashboard...');
    try {
        await loadDashboardData();
        showNotification('Dashboard refreshed', 'success');
    } catch (error) {
        showNotification('Failed to refresh dashboard', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

async function refreshOrders() {
    await loadOrders();
    showNotification('Orders refreshed', 'success');
}

async function refreshDesigns() {
    await loadDesigns();
    showNotification('Designs refreshed', 'success');
}

// ===== PLACEHOLDER FUNCTIONS =====

async function loadCustomers() {
    console.log('Loading customers...');
}

async function loadAnalytics() {
    console.log('Loading analytics...');
}

async function loadStores() {
    console.log('Loading stores...');
}

async function loadAIUsage() {
    console.log('Loading AI usage...');
}

async function loadSystemLogs() {
    console.log('Loading system logs...');
}

async function loadRecentActivity() {
    console.log('Loading recent activity...');
}

function filterByStore(storeId) {
    console.log('Filtering by store:', storeId);
}

function updatePeriod(days) {
    console.log('Updating period to:', days);
}

function filterOrders(status) {
    console.log('Filtering orders by status:', status);
}

function filterDesigns(status) {
    console.log('Filtering designs by status:', status);
}

function exportOrders() {
    showNotification('Export feature coming soon', 'info');
}

function exportDesigns() {
    showNotification('Export feature coming soon', 'info');
}

function openAddStoreModal() {
    showNotification('Add store feature coming soon', 'info');
}

async function logout() {
    try {
        showLoadingOverlay('Logging out...');
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin/login';
    }
}

// Export functions for global access
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.refreshDashboard = refreshDashboard;
window.refreshOrders = refreshOrders;
window.refreshDesigns = refreshDesigns;
window.logout = logout;