let servers = [];
let selectedServerId = null;
let isAuthLogin = true;

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const response = await sendMessage({ action: 'getState' });
    if (response.success && response.state.isLoggedIn) {
        showMainView();
        loadServers();
        updateUI(response.state);
    } else {
        showLoginView();
    }
});

// ============================================================
// Message Helper
// ============================================================
function sendMessage(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, resolve);
    });
}

// ============================================================
// Auth
// ============================================================
function switchTab(tab) {
    isAuthLogin = tab === 'login';
    document.getElementById('loginTab').classList.toggle('active', isAuthLogin);
    document.getElementById('registerTab').classList.toggle('active', !isAuthLogin);
    document.getElementById('registerFields').style.display = isAuthLogin ? 'none' : 'block';
    document.getElementById('authBtn').textContent = isAuthLogin ? 'Login' : 'Create Account';
    document.getElementById('authError').textContent = '';
}

async function handleAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('authBtn');

    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }

    btn.disabled = true;
    btn.textContent = isAuthLogin ? 'Logging in...' : 'Creating account...';
    errorEl.textContent = '';

    const message = isAuthLogin
        ? { action: 'login', email, password }
        : { action: 'register', name: document.getElementById('regName').value.trim(), email, password };

    const response = await sendMessage(message);

    if (response.success) {
        showMainView();
        loadServers();
    } else {
        errorEl.textContent = response.error || 'Authentication failed';
    }

    btn.disabled = false;
    btn.textContent = isAuthLogin ? 'Login' : 'Create Account';
}

async function handleLogout() {
    await sendMessage({ action: 'logout' });
    showLoginView();
}

// ============================================================
// Views
// ============================================================
function showLoginView() {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('mainView').style.display = 'none';
}

function showMainView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('mainView').style.display = 'block';
}

// ============================================================
// Server List
// ============================================================
async function loadServers() {
    const response = await sendMessage({ action: 'getServers' });
    if (response.success) {
        servers = response.servers;
        document.getElementById('serverCount').textContent = `${servers.length} servers`;
        renderServers(servers);
    }
}

function filterServers() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = servers.filter(s =>
        s.country.toLowerCase().includes(query) ||
        s.city.toLowerCase().includes(query) ||
        (s.countryCode || '').toLowerCase().includes(query)
    );
    renderServers(filtered);
}

function renderServers(list) {
    const container = document.getElementById('serverList');

    if (list.length === 0) {
        container.innerHTML = '<div class="loading">No servers found</div>';
        return;
    }

    container.innerHTML = list.map(server => `
        <div class="server-item ${selectedServerId === server._id ? 'selected' : ''}"
             onclick="selectServer('${server._id}')">
            <span class="flag">${server.flag || '🌐'}</span>
            <div class="info">
                <div class="name">${server.country}</div>
                <div class="city">${server.city || 'Main Gateway'}</div>
            </div>
            <span class="latency">${server.load || 0}% load</span>
        </div>
    `).join('');
}

function selectServer(id) {
    selectedServerId = id;
    renderServers(servers.filter(s => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        return s.country.toLowerCase().includes(query) ||
               s.city.toLowerCase().includes(query) ||
               (s.countryCode || '').toLowerCase().includes(query);
    }).length > 0 ? servers.filter(s => {
        const query = document.getElementById('searchInput').value.toLowerCase();
        return s.country.toLowerCase().includes(query) ||
               s.city.toLowerCase().includes(query) ||
               (s.countryCode || '').toLowerCase().includes(query);
    }) : servers);
}

// ============================================================
// Connection
// ============================================================
async function toggleConnection() {
    const state = await sendMessage({ action: 'getState' });
    const btn = document.getElementById('connectBtn');

    if (state.success && state.state.isConnected) {
        // Disconnect
        btn.classList.add('connecting');
        btn.classList.remove('active');
        const result = await sendMessage({ action: 'disconnect' });
        btn.classList.remove('connecting');
        if (result.success) {
            updateUI({ isConnected: false, currentServer: null });
        }
    } else {
        // Connect
        if (!selectedServerId) {
            alert('Please select a server first');
            return;
        }
        btn.classList.add('connecting');
        document.getElementById('connectLabel').textContent = 'Connecting...';

        const result = await sendMessage({ action: 'connect', serverId: selectedServerId });
        btn.classList.remove('connecting');

        if (result.success) {
            updateUI({
                isConnected: true,
                currentServer: result.connection.server
            });
        } else {
            document.getElementById('connectLabel').textContent = result.error || 'Connection failed';
            setTimeout(() => {
                document.getElementById('connectLabel').textContent = 'Tap to connect';
            }, 3000);
        }
    }
}

async function toggleAutoReconnect() {
    const enabled = document.getElementById('autoReconnectToggle').checked;
    await sendMessage({ action: 'setAutoReconnect', enabled });
}

// ============================================================
// UI Updates
// ============================================================
function updateUI(state) {
    const panel = document.getElementById('statusPanel');
    const btn = document.getElementById('connectBtn');
    const label = document.getElementById('connectLabel');
    const statusText = document.getElementById('statusText');
    const serverInfo = document.getElementById('serverInfo');

    if (state.isConnected && state.currentServer) {
        panel.className = 'status-panel connected';
        btn.classList.add('active');
        statusText.textContent = 'Connected & Protected';
        label.textContent = 'Tap to disconnect';

        serverInfo.style.display = 'flex';
        document.getElementById('serverFlag').textContent = state.currentServer.flag || '🌐';
        document.getElementById('serverCountry').textContent = state.currentServer.country;
        document.getElementById('serverCity').textContent = state.currentServer.city || 'Main Gateway';

        selectedServerId = state.currentServer.id || state.currentServer._id;
    } else {
        panel.className = 'status-panel disconnected';
        btn.classList.remove('active');
        statusText.textContent = 'Disconnected';
        label.textContent = 'Tap to connect';
        serverInfo.style.display = 'none';
    }

    if (state.autoReconnect !== undefined) {
        document.getElementById('autoReconnectToggle').checked = state.autoReconnect;
    }
}
