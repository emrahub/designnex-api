// Global variables
let currentStore = null;
let ordersChart, storesChart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    loadDashboard();
    loadStores();
    
    // Set up auto refresh
    setInterval(refreshCurrentSection, 30000); // 30 seconds
});

// Navigation handling
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all nav items and sections
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav item
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
                loadSectionData(sectionId);
            }
        });
    });
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'designs':
            loadDesigns();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'stores':
            loadStores();
            break;
        case 'ai-logs':
            loadAILogs();
            break;
        case 'system':
            loadSystemLogs();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Load overview stats from multiple endpoints
        const [ordersData, designsData, storesData] = await Promise.all([
            fetch('/api/admin/orders-overview').then(r => r.json()).catch(() => ({total: 0, revenue: 0})),
            fetch('/api/admin/designs-overview').then(r => r.json()).catch(() => ({total: 0})),
            fetch('/api/admin/stores-overview').then(r => r.json()).catch(() => ({total: 0}))
        ]);

        // Update dashboard stats
        document.getElementById('totalOrders').textContent = ordersData.total || 0;
        document.getElementById('totalDesigns').textContent = designsData.total || 0;
        document.getElementById('totalRevenue').textContent = '$' + (ordersData.revenue || 0).toFixed(2);
        document.getElementById('totalStores').textContent = storesData.total || 0;
        
        // Load recent items
        loadRecentOrders();
        loadRecentDesigns();
        
        updateLastUpdate();
    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Failed to load dashboard data');
    }
}

async function loadRecentOrders() {
    try {
        const orders = await fetchAllOrders(5); // Get 5 recent orders
        const container = document.getElementById('recentOrdersList');
        
        if (orders.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No recent orders</p>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                    <p class="font-medium text-sm">${order.customer_email}</p>
                    <p class="text-xs text-gray-500">${order.product_title}</p>
                </div>
                <div class="text-right">
                    <p class="font-medium text-sm">$${order.total_price}</p>
                    <span class="status-badge status-${order.order_status}">${order.order_status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Recent orders error:', error);
        document.getElementById('recentOrdersList').innerHTML = '<p class="text-red-500 text-sm">Failed to load orders</p>';
    }
}

async function loadRecentDesigns() {
    try {
        const designs = await fetchAllDesigns(5); // Get 5 recent designs
        const container = document.getElementById('recentDesignsList');
        
        if (designs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No recent designs</p>';
            return;
        }
        
        container.innerHTML = designs.map(design => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                    <p class="font-medium text-sm">${design.customer_email || 'Anonymous'}</p>
                    <p class="text-xs text-gray-500">${design.ai_prompt ? design.ai_prompt.substring(0, 30) + '...' : 'No prompt'}</p>
                </div>
                <span class="status-badge status-${design.status}">${design.status}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Recent designs error:', error);
        document.getElementById('recentDesignsList').innerHTML = '<p class="text-red-500 text-sm">Failed to load designs</p>';
    }
}

// Orders functions
async function loadOrders() {
    try {
        const orders = await fetchAllOrders();
        displayOrders(orders);
    } catch (error) {
        console.error('Load orders error:', error);
        showError('Failed to load orders');
    }
}

async function fetchAllOrders(limit = 50) {
    // Try to get orders from all stores
    const stores = await fetchStores();
    let allOrders = [];
    
    for (const store of stores) {
        try {
            const response = await fetch(`/api/store/orders?limit=${limit}`, {
                headers: { 'X-Shop-Domain': store.shop_domain }
            });
            if (response.ok) {
                const orders = await response.json();
                allOrders.push(...orders.map(order => ({...order, store_name: store.shop_name})));
            }
        } catch (error) {
            console.log(`Failed to load orders for ${store.shop_domain}:`, error);
        }
    }
    
    return allOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
}

function displayOrders(orders) {
    const container = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-inbox text-3xl text-gray-400"></i>
                <p class="text-gray-500 mt-2">No orders found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="table-row">
            <div>
                <p class="font-medium">${order.customer_email}</p>
                <p class="text-sm text-gray-500">${order.product_title}</p>
            </div>
            <div>
                <p class="text-sm">${order.store_name || 'Unknown Store'}</p>
            </div>
            <div>
                <p class="font-medium">$${order.total_price}</p>
            </div>
            <div>
                <span class="status-badge status-${order.order_status}">${order.order_status}</span>
            </div>
            <div>
                <button onclick="openOrderModal(${order.id}, '${order.order_status}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Designs functions
async function loadDesigns() {
    try {
        const designs = await fetchAllDesigns();
        displayDesigns(designs);
    } catch (error) {
        console.error('Load designs error:', error);
        showError('Failed to load designs');
    }
}

async function fetchAllDesigns(limit = 50) {
    const stores = await fetchStores();
    let allDesigns = [];
    
    for (const store of stores) {
        try {
            const response = await fetch(`/api/store/designs?limit=${limit}`, {
                headers: { 'X-Shop-Domain': store.shop_domain }
            });
            if (response.ok) {
                const designs = await response.json();
                allDesigns.push(...designs.map(design => ({...design, store_name: store.shop_name})));
            }
        } catch (error) {
            console.log(`Failed to load designs for ${store.shop_domain}:`, error);
        }
    }
    
    return allDesigns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function displayDesigns(designs) {
    const container = document.getElementById('designsTableBody');
    
    if (designs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-palette text-3xl text-gray-400"></i>
                <p class="text-gray-500 mt-2">No designs found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = designs.map(design => `
        <div class="table-row">
            <div>
                <p class="font-medium">${design.customer_email || 'Anonymous'}</p>
                <p class="text-sm text-gray-500">${design.product_title}</p>
            </div>
            <div>
                <p class="text-sm">${design.ai_prompt ? design.ai_prompt.substring(0, 40) + '...' : 'No prompt'}</p>
            </div>
            <div>
                <p class="text-sm">${design.store_name || 'Unknown Store'}</p>
            </div>
            <div>
                <span class="status-badge status-${design.status}">${design.status}</span>
            </div>
            <div>
                <p class="text-sm text-gray-500">${new Date(design.created_at).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

// Stores functions
async function loadStores() {
    try {
        const stores = await fetchStores();
        displayStores(stores);
        updateStoreFilter(stores);
    } catch (error) {
        console.error('Load stores error:', error);
        showError('Failed to load stores');
    }
}

async function fetchStores() {
    try {
        // For now, we'll use our sample data approach
        // In a real implementation, you'd have a /api/admin/stores endpoint
        return [
            {
                id: 1,
                shop_domain: 'test-store.myshopify.com',
                shop_name: 'Test Store',
                shop_owner_email: 'owner@teststore.com',
                status: 'active',
                plan_name: 'premium',
                installation_date: new Date().toISOString()
            }
        ];
    } catch (error) {
        console.error('Fetch stores error:', error);
        return [];
    }
}

function displayStores(stores) {
    const container = document.getElementById('storesGrid');
    
    if (stores.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 col-span-full">
                <i class="fas fa-store text-3xl text-gray-400"></i>
                <p class="text-gray-500 mt-2">No stores found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = stores.map(store => `
        <div class="stat-card">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold">${store.shop_name}</h3>
                <span class="status-badge status-${store.status}">${store.status}</span>
            </div>
            <div class="space-y-2">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-globe mr-2"></i>
                    ${store.shop_domain}
                </p>
                <p class="text-sm text-gray-600">
                    <i class="fas fa-envelope mr-2"></i>
                    ${store.shop_owner_email}
                </p>
                <p class="text-sm text-gray-600">
                    <i class="fas fa-crown mr-2"></i>
                    ${store.plan_name} plan
                </p>
                <p class="text-sm text-gray-600">
                    <i class="fas fa-calendar mr-2"></i>
                    ${new Date(store.installation_date).toLocaleDateString()}
                </p>
            </div>
            <div class="mt-4 flex space-x-2">
                <button onclick="viewStoreDetails('${store.shop_domain}')" class="btn btn-primary btn-sm flex-1">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="manageStore('${store.shop_domain}')" class="btn btn-secondary btn-sm flex-1">
                    <i class="fas fa-cog mr-1"></i>Manage
                </button>
            </div>
        </div>
    `).join('');
}

function updateStoreFilter(stores) {
    const select = document.getElementById('storeFilter');
    select.innerHTML = '<option value="">All Stores</option>';
    
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.shop_domain;
        option.textContent = store.shop_name;
        select.appendChild(option);
    });
}

// Analytics functions
async function loadAnalytics() {
    try {
        // Load analytics data
        const period = document.getElementById('analyticsPeriod').value;
        // For now, we'll create sample charts
        createOrdersChart();
        createStoresChart();
    } catch (error) {
        console.error('Analytics error:', error);
        showError('Failed to load analytics');
    }
}

function createOrdersChart() {
    const ctx = document.getElementById('ordersChart').getContext('2d');
    
    if (ordersChart) {
        ordersChart.destroy();
    }
    
    ordersChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Orders',
                data: [12, 19, 8, 15, 25, 22, 30],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createStoresChart() {
    const ctx = document.getElementById('storesChart').getContext('2d');
    
    if (storesChart) {
        storesChart.destroy();
    }
    
    storesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Suspended'],
            datasets: [{
                data: [15, 3, 1],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// AI Logs functions
async function loadAILogs() {
    try {
        const response = await fetch('/api/admin/recent-generations?limit=20');
        const logs = await response.json();
        displayAILogs(logs);
    } catch (error) {
        console.error('AI logs error:', error);
        showError('Failed to load AI logs');
    }
}

function displayAILogs(logs) {
    const container = document.getElementById('aiLogsContainer');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-robot text-3xl text-gray-400"></i>
                <p class="text-gray-500 mt-2">No AI generations found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-4">
            ${logs.map(log => `
                <div class="stat-card">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-${log.success ? 'check-circle text-green-500' : 'times-circle text-red-500'} mr-2"></i>
                                <span class="font-medium">${log.model_used}</span>
                                <span class="ml-2 text-sm text-gray-500">${log.response_time}ms</span>
                            </div>
                            <p class="text-sm text-gray-700 mb-2">"${log.prompt.substring(0, 100)}..."</p>
                            <div class="flex items-center text-xs text-gray-500">
                                <span>${new Date(log.created_at).toLocaleString()}</span>
                                ${log.ip_address ? `<span class="ml-4">IP: ${log.ip_address}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// System Logs functions
async function loadSystemLogs() {
    try {
        const response = await fetch('/api/admin/logs?limit=20');
        const logs = await response.json();
        displaySystemLogs(logs);
    } catch (error) {
        console.error('System logs error:', error);
        showError('Failed to load system logs');
    }
}

function displaySystemLogs(logs) {
    const container = document.getElementById('systemLogsContainer');
    
    if (logs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-list text-3xl text-gray-400"></i>
                <p class="text-gray-500 mt-2">No system logs found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="space-y-2">
            ${logs.map(log => `
                <div class="stat-card">
                    <div class="flex items-center">
                        <i class="fas fa-${getLogIcon(log.level)} text-${getLogColor(log.level)}-500 mr-3"></i>
                        <div class="flex-1">
                            <p class="text-sm font-medium">${log.message}</p>
                            <div class="flex items-center text-xs text-gray-500 mt-1">
                                <span>${new Date(log.created_at).toLocaleString()}</span>
                                ${log.endpoint ? `<span class="ml-4">${log.method} ${log.endpoint}</span>` : ''}
                                ${log.ip_address ? `<span class="ml-4">IP: ${log.ip_address}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Modal functions
function openOrderModal(orderId, currentStatus) {
    document.getElementById('orderIdInput').value = orderId;
    document.getElementById('orderStatusSelect').value = currentStatus;
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('orderUpdateForm').reset();
}

// Form handlers
document.getElementById('orderUpdateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const orderId = document.getElementById('orderIdInput').value;
    const status = document.getElementById('orderStatusSelect').value;
    const trackingNumber = document.getElementById('trackingNumberInput').value;
    const notes = document.getElementById('notesInput').value;
    
    try {
        // This would need to be updated to work with specific stores
        // For now, we'll show a success message
        showSuccess('Order status updated successfully');
        closeOrderModal();
        loadOrders(); // Refresh orders
    } catch (error) {
        console.error('Update order error:', error);
        showError('Failed to update order status');
    }
});

// Utility functions
function refreshCurrentSection() {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        loadSectionData(activeSection.id);
    }
}

function refreshOrders() {
    loadOrders();
}

function refreshDesigns() {
    loadDesigns();
}

function refreshAILogs() {
    loadAILogs();
}

function refreshSystemLogs() {
    loadSystemLogs();
}

function updateLastUpdate() {
    document.getElementById('lastUpdate').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

function getLogIcon(level) {
    switch (level) {
        case 'error': return 'exclamation-triangle';
        case 'warn': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'circle';
    }
}

function getLogColor(level) {
    switch (level) {
        case 'error': return 'red';
        case 'warn': return 'yellow';
        case 'info': return 'blue';
        default: return 'gray';
    }
}

function showError(message) {
    console.error(message);
    // Could implement toast notifications here
}

function showSuccess(message) {
    console.log(message);
    // Could implement toast notifications here
}

function viewStoreDetails(shopDomain) {
    // Navigate to store-specific view
    showSuccess(`Viewing details for ${shopDomain}`);
}

function manageStore(shopDomain) {
    // Open store management options
    showSuccess(`Managing store ${shopDomain}`);
}

function openAddStoreModal() {
    showSuccess('Add store functionality coming soon');
}

// Logout function
async function logout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin/login';
    }
}