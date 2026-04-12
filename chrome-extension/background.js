const API_BASE = 'http://localhost:5000/api';

// ============================================================
// State Management
// ============================================================
let state = {
    isConnected: false,
    token: null,
    currentServer: null,
    proxyConfig: null,
    autoReconnect: true,
    connectionId: null,
    proxyMode: false // true = real proxy active, false = simulation mode
};

// Load persisted state on startup
chrome.storage.local.get(['vpnState'], (result) => {
    if (result.vpnState) {
        state = { ...state, ...result.vpnState };
        if (state.isConnected && state.token && state.autoReconnect) {
            reconnect();
        }
    }
});

function saveState() {
    chrome.storage.local.set({ vpnState: state });
}

// ============================================================
// API Helper
// ============================================================
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['x-auth-token'] = state.token;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ msg: 'Request failed' }));
        throw new Error(error.msg || 'API Error');
    }
    return response.json();
}

// ============================================================
// Proxy Management
// ============================================================

// RFC 5737 test/documentation IPs — these will never work as real proxies
const FAKE_IP_PREFIXES = ['192.0.2.', '198.51.100.', '203.0.113.', '0.0.0.', '10.0.0.'];

function isRealProxy(config) {
    if (!config || !config.host) return false;
    // Check if the proxy IP is a placeholder/test IP
    return !FAKE_IP_PREFIXES.some(prefix => config.host.startsWith(prefix));
}

function setProxy(config) {
    if (!config || !config.host) return false;

    // Only set proxy if it's a real, reachable proxy server
    if (!isRealProxy(config)) {
        console.log('Simulation mode: proxy host is a placeholder IP, skipping proxy setup');
        return false;
    }

    const proxyConfig = {
        mode: 'fixed_servers',
        rules: {
            singleProxy: {
                scheme: config.type || 'http',
                host: config.host,
                port: config.port || 8080
            },
            bypassList: ['localhost', '127.0.0.1', '<local>']
        }
    };

    chrome.proxy.settings.set({ value: proxyConfig, scope: 'regular' }, () => {
        console.log('Proxy set to:', config.host, config.port);
    });

    if (config.username && config.password) {
        chrome.webRequest?.onAuthRequired?.addListener(
            (details, callback) => {
                callback({ authCredentials: { username: config.username, password: config.password } });
            },
            { urls: ['<all_urls>'] },
            ['asyncBlocking']
        );
    }

    return true;
}

function clearProxy() {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
        console.log('Proxy cleared');
    });
}

// ============================================================
// Connection Management
// ============================================================
async function connectToServer(serverId) {
    try {
        const data = await apiRequest('/connection/connect', 'POST', {
            serverId,
            type: 'proxy'
        });

        state.isConnected = true;
        state.currentServer = data.connection.server;
        state.proxyConfig = data.connection.proxyConfig;
        state.connectionId = data.connection.id;
        state.autoReconnect = data.connection.autoReconnect;

        // Only set proxy if the server has a real proxy host
        if (data.connection.proxyConfig) {
            state.proxyMode = setProxy(data.connection.proxyConfig);
        } else {
            state.proxyMode = false;
        }

        saveState();

        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#06b6d4' });

        const mode = state.proxyMode ? 'proxy' : 'simulation';
        return { success: true, connection: data.connection, mode };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function disconnectFromServer() {
    try {
        await apiRequest('/connection/disconnect', 'POST', { type: 'proxy' });
    } catch (err) {
        console.error('Disconnect API error:', err);
    }

    // Only clear proxy if we actually set one
    if (state.proxyMode) {
        clearProxy();
    }

    state.isConnected = false;
    state.proxyConfig = null;
    state.connectionId = null;
    state.proxyMode = false;
    saveState();

    chrome.action.setBadgeText({ text: '' });

    return { success: true };
}

async function reconnect() {
    if (!state.token) return;

    try {
        const data = await apiRequest('/connection/reconnect', 'POST', { type: 'proxy' });

        state.isConnected = true;
        state.currentServer = data.connection.server;
        state.proxyConfig = data.connection.proxyConfig;
        state.connectionId = data.connection.id;

        if (data.connection.proxyConfig) {
            state.proxyMode = setProxy(data.connection.proxyConfig);
        } else {
            state.proxyMode = false;
        }

        saveState();

        chrome.action.setBadgeText({ text: 'ON' });
        chrome.action.setBadgeBackgroundColor({ color: '#06b6d4' });

        chrome.notifications.create('reconnected', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'SecureNet VPN',
            message: `Reconnected to ${state.currentServer?.country || 'VPN server'}`
        });

        return { success: true };
    } catch (err) {
        console.error('Reconnect failed:', err);
        return { success: false, error: err.message };
    }
}

// ============================================================
// Network Monitoring for Auto-Reconnect
// ============================================================
chrome.alarms.create('networkCheck', { periodInMinutes: 0.5 });

let wasOffline = false;

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'networkCheck') return;
    if (!state.autoReconnect || !state.token) return;

    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            if (wasOffline && state.currentServer && !state.isConnected) {
                console.log('Network recovered - auto-reconnecting...');
                await reconnect();
                wasOffline = false;
            }
        }
    } catch (err) {
        if (state.isConnected) {
            wasOffline = true;
            state.isConnected = false;
            saveState();
            if (state.proxyMode) clearProxy();
            chrome.action.setBadgeText({ text: '!' });
            chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        }
    }
});

// ============================================================
// Message Handler (communication with popup)
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = async () => {
        switch (message.action) {
            case 'login': {
                try {
                    const data = await apiRequest('/auth/login', 'POST', {
                        email: message.email,
                        password: message.password
                    });
                    state.token = data.token;
                    saveState();
                    return { success: true, user: data.user };
                } catch (err) {
                    return { success: false, error: err.message };
                }
            }

            case 'register': {
                try {
                    const data = await apiRequest('/auth/register', 'POST', {
                        name: message.name,
                        email: message.email,
                        password: message.password
                    });
                    state.token = data.token;
                    saveState();
                    return { success: true, user: data.user };
                } catch (err) {
                    return { success: false, error: err.message };
                }
            }

            case 'getServers': {
                try {
                    const servers = await apiRequest('/servers');
                    return { success: true, servers };
                } catch (err) {
                    return { success: false, error: err.message };
                }
            }

            case 'connect': {
                return await connectToServer(message.serverId);
            }

            case 'disconnect': {
                return await disconnectFromServer();
            }

            case 'reconnect': {
                return await reconnect();
            }

            case 'getState': {
                return {
                    success: true,
                    state: {
                        isConnected: state.isConnected,
                        isLoggedIn: !!state.token,
                        currentServer: state.currentServer,
                        autoReconnect: state.autoReconnect,
                        proxyMode: state.proxyMode
                    }
                };
            }

            case 'setAutoReconnect': {
                state.autoReconnect = message.enabled;
                saveState();
                if (state.token) {
                    try {
                        await apiRequest('/connection/auto-reconnect', 'PUT', {
                            enabled: message.enabled
                        });
                    } catch (err) { /* ignore */ }
                }
                return { success: true };
            }

            case 'logout': {
                if (state.isConnected) await disconnectFromServer();
                state.token = null;
                state.currentServer = null;
                saveState();
                return { success: true };
            }

            default:
                return { success: false, error: 'Unknown action' };
        }
    };

    handler().then(sendResponse);
    return true;
});
