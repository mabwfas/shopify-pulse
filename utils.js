// ShopifyPulse - Utility Functions
const PulseUtils = {
    // Storage helpers
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`pulse_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch { return defaultValue; }
        },
        set(key, value) {
            localStorage.setItem(`pulse_${key}`, JSON.stringify(value));
        },
        remove(key) {
            localStorage.removeItem(`pulse_${key}`);
        }
    },

    // Date helpers
    date: {
        format(date, format = 'short') {
            const d = new Date(date);
            if (format === 'short') return d.toLocaleDateString();
            if (format === 'long') return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (format === 'time') return d.toLocaleTimeString();
            if (format === 'full') return d.toLocaleString();
            return d.toISOString();
        },
        timeAgo(date) {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
            if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
            if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
            return new Date(date).toLocaleDateString();
        },
        getDaysArray(days = 7) {
            return Array.from({length: days}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (days - 1 - i));
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            });
        }
    },

    // Number helpers
    number: {
        format(num, decimals = 0) {
            return new Intl.NumberFormat().format(Number(num).toFixed(decimals));
        },
        currency(num, currency = 'USD') {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
        },
        percent(num, decimals = 1) {
            return num.toFixed(decimals) + '%';
        },
        abbreviate(num) {
            if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toString();
        }
    },

    // DOM helpers
    dom: {
        $(selector) { return document.querySelector(selector); },
        $$(selector) { return document.querySelectorAll(selector); },
        create(tag, attrs = {}, children = []) {
            const el = document.createElement(tag);
            Object.entries(attrs).forEach(([k, v]) => {
                if (k === 'class') el.className = v;
                else if (k === 'text') el.textContent = v;
                else if (k === 'html') el.innerHTML = v;
                else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
                else el.setAttribute(k, v);
            });
            children.forEach(child => el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
            return el;
        },
        show(el) { if (typeof el === 'string') el = this.$(el); el.style.display = ''; },
        hide(el) { if (typeof el === 'string') el = this.$(el); el.style.display = 'none'; },
        toggle(el) { if (typeof el === 'string') el = this.$(el); el.style.display = el.style.display === 'none' ? '' : 'none'; }
    },

    // Toast notifications
    toast: {
        show(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toast-container') || this.createContainer();
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i><span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
        },
        createContainer() {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
            
            const style = document.createElement('style');
            style.textContent = `.toast{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#1e1e3f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;transform:translateX(120%);transition:transform 0.3s;}.toast.show{transform:translateX(0);}.toast-success{border-left:3px solid #10b981;}.toast-error{border-left:3px solid #ef4444;}.toast-warning{border-left:3px solid #f59e0b;}.toast i{font-size:18px;}.toast-success i{color:#10b981;}.toast-error i{color:#ef4444;}.toast-warning i{color:#f59e0b;}`;
            document.head.appendChild(style);
            return container;
        },
        success(msg) { this.show(msg, 'success'); },
        error(msg) { this.show(msg, 'error'); },
        warning(msg) { this.show(msg, 'warning'); }
    },

    // Export helpers
    export: {
        csv(data, filename = 'export.csv') {
            if (!data.length) return;
            const headers = Object.keys(data[0]);
            const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
            this.download(csv, filename, 'text/csv');
        },
        json(data, filename = 'export.json') {
            this.download(JSON.stringify(data, null, 2), filename, 'application/json');
        },
        download(content, filename, type) {
            const blob = new Blob([content], { type });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        }
    },

    // Chart helpers (requires Chart.js)
    chart: {
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        },
        colors: {
            primary: '#8b5cf6',
            secondary: '#06b6d4',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        },
        gradient(ctx, color1, color2) {
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            return gradient;
        }
    },

    // Validation helpers
    validate: {
        email(str) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); },
        url(str) { try { new URL(str); return true; } catch { return false; } },
        required(str) { return str && str.trim().length > 0; },
        minLength(str, len) { return str && str.length >= len; },
        maxLength(str, len) { return !str || str.length <= len; }
    },

    // Debounce/throttle
    debounce(fn, delay = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    },

    throttle(fn, limit = 300) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); },

    // Copy to clipboard
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast.success('Copied to clipboard!');
            return true;
        } catch {
            this.toast.error('Failed to copy');
            return false;
        }
    }
};

// Make globally available
window.PulseUtils = PulseUtils;
window.$ = PulseUtils.dom.$;
window.$$ = PulseUtils.dom.$$;
