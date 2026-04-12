let servers = [];
let selectedServerId = null;
let isAuthLogin = true;

// ============================================================
// DOM Elements
// ============================================================
const $ = (id) => document.getElementById(id);

// ============================================================
// Initialize - attach ALL event listeners here (no inline onclick)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Auth tab buttons
    $('loginTab').addEventListener('click', () => switchTab('login'));
    $('registerTab').addEventListener('click', () => switchTab('register'));

    // Auth submit button
    $('authBtn').addEventListener('click', handleAuth);

    // Allow Enter key to submit login/register
    $('password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAuth();
    });

    // Logout button
    $('logoutBtn').addEventListener('click', handleLogout);

    // Connect button
    $('connectBtn').addEventListener('click', toggleConnection);

    // Auto-reconnect toggle
    $('autoReconnectToggle').addEventListener('change', toggleAutoReconnect);

    // Search input
    $('searchInput').addEventListener('input', filterServers);

    // Check if already logged in
    try {
        const response = await sendMessage({ action: 'getState' });
        if (response && response.success && response.state.isLoggedIn) {
            showMainView();
            loadServers();
            updateUI(response.state);
        } else {
            showLoginView();
        }
    } catch (err) {
        console.error('Init error:', err);
        showLoginView();
    }
});

// ============================================================
// Message Helper
// ============================================================
function sendMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Message error:', chrome.runtime.lastError.message);
                resolve({ success: false, error: chrome.runtime.lastError.message });
                return;
            }
            resolve(response || { success: false, error: 'No response from background' });
        });
    });
}

// ============================================================
// Auth
// ============================================================
function switchTab(tab) {
    isAuthLogin = tab === 'login';
    $('loginTab').classList.toggle('active', isAuthLogin);
    $('registerTab').classList.toggle('active', !isAuthLogin);
    $('registerFields').style.display = isAuthLogin ? 'none' : 'block';
    $('authBtn').textContent = isAuthLogin ? 'Login' : 'Create Account';
    $('authError').textContent = '';
}

async function handleAuth() {
    const email = $('email').value.trim();
    const password = $('password').value.trim();
    const errorEl = $('authError');
    const btn = $('authBtn');

    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }

    if (!isAuthLogin) {
        const name = $('regName').value.trim();
        if (!name) {
            errorEl.textContent = 'Please enter your name';
            return;
        }
    }

    btn.disabled = true;
    btn.textContent = isAuthLogin ? 'Logging in...' : 'Creating account...';
    errorEl.textContent = '';

    const message = isAuthLogin
        ? { action: 'login', email, password }
        : { action: 'register', name: $('regName').value.trim(), email, password };

    try {
        const response = await sendMessage(message);

        if (response.success) {
            showMainView();
            loadServers();
        } else {
            errorEl.textContent = response.error || 'Authentication failed';
        }
    } catch (err) {
        errorEl.textContent = 'Connection error. Is the backend running?';
    }

    btn.disabled = false;
    btn.textContent = isAuthLogin ? 'Login' : 'Create Account';
}

async function handleLogout() {
    await sendMessage({ action: 'logout' });
    showLoginView();
    // Clear form
    $('email').value = '';
    $('password').value = '';
    $('authError').textContent = '';
}

// ============================================================
// Views
// ============================================================
function showLoginView() {
    $('loginView').style.display = 'block';
    $('mainView').style.display = 'none';
}

function showMainView() {
    $('loginView').style.display = 'none';
    $('mainView').style.display = 'block';
}

// ============================================================
// Server List
// ============================================================
async function loadServers() {
    const response = await sendMessage({ action: 'getServers' });
    if (response.success) {
        servers = response.servers;
        $('serverCount').textContent = `${servers.length} servers`;
        renderServers(servers);
    } else {
        $('serverList').innerHTML = '<div class="loading">Failed to load servers. Is backend running?</div>';
    }
}

function filterServers() {
    const query = $('searchInput').value.toLowerCase();
    const filtered = servers.filter(s =>
        s.country.toLowerCase().includes(query) ||
        (s.city || '').toLowerCase().includes(query) ||
        (s.countryCode || '').toLowerCase().includes(query)
    );
    renderServers(filtered);
}

function renderServers(list) {
    const container = $('serverList');

    if (list.length === 0) {
        container.innerHTML = '<div class="loading">No servers found</div>';
        return;
    }

    container.innerHTML = list.map(server => `
        <div class="server-item ${selectedServerId === server._id ? 'selected' : ''}"
             data-server-id="${server._id}">
            <span class="flag">${server.flag || '🌐'}</span>
            <div class="info">
                <div class="name">${server.country}</div>
                <div class="city">${server.city || 'Main Gateway'}</div>
            </div>
            <span class="latency">${server.load || 0}% load</span>
        </div>
    `).join('');

    // Attach click listeners to each server item
    container.querySelectorAll('.server-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedServerId = item.dataset.serverId;
            // Re-render to update selected state
            renderServers(list);
        });
    });
}

// ============================================================
// Connection
// ============================================================
async function toggleConnection() {
    const stateResponse = await sendMessage({ action: 'getState' });
    const btn = $('connectBtn');

    if (stateResponse.success && stateResponse.state.isConnected) {
        // Disconnect
        btn.classList.add('connecting');
        btn.classList.remove('active');
        $('connectLabel').textContent = 'Disconnecting...';

        const result = await sendMessage({ action: 'disconnect' });
        btn.classList.remove('connecting');

        if (result.success) {
            updateUI({ isConnected: false, currentServer: null });
        }
    } else {
        // Connect
        if (!selectedServerId) {
            $('connectLabel').textContent = 'Select a server first!';
            setTimeout(() => {
                $('connectLabel').textContent = 'Tap to connect';
            }, 2000);
            return;
        }

        btn.classList.add('connecting');
        $('connectLabel').textContent = 'Connecting...';

        const result = await sendMessage({ action: 'connect', serverId: selectedServerId });
        btn.classList.remove('connecting');

        if (result.success) {
            updateUI({
                isConnected: true,
                currentServer: result.connection.server
            });
        } else {
            $('connectLabel').textContent = result.error || 'Connection failed';
            setTimeout(() => {
                $('connectLabel').textContent = 'Tap to connect';
            }, 3000);
        }
    }
}

async function toggleAutoReconnect() {
    const enabled = $('autoReconnectToggle').checked;
    await sendMessage({ action: 'setAutoReconnect', enabled });
}

// ============================================================
// UI Updates
// ============================================================
function updateUI(state) {
    const panel = $('statusPanel');
    const btn = $('connectBtn');
    const label = $('connectLabel');
    const statusText = $('statusText');
    const serverInfo = $('serverInfo');

    if (state.isConnected && state.currentServer) {
        panel.className = 'status-panel connected';
        btn.classList.add('active');
        statusText.textContent = 'Connected & Protected';
        label.textContent = 'Tap to disconnect';

        serverInfo.style.display = 'flex';
        $('serverFlag').textContent = state.currentServer.flag || '🌐';
        $('serverCountry').textContent = state.currentServer.country;
        $('serverCity').textContent = state.currentServer.city || 'Main Gateway';

        selectedServerId = state.currentServer.id || state.currentServer._id;
    } else {
        panel.className = 'status-panel disconnected';
        btn.classList.remove('active');
        statusText.textContent = 'Disconnected';
        label.textContent = 'Tap to connect';
        serverInfo.style.display = 'none';
    }

    if (state.autoReconnect !== undefined) {
        $('autoReconnectToggle').checked = state.autoReconnect;
    }
}
