// ShopifyPulse - API Integration Module
const PulseAPI = {
    // Configuration
    config: {
        endpoints: {
            pagespeed: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
            screenshot: 'https://api.apiflash.com/v1/urltoimage'
        },
        apiKey: null // Set via settings
    },

    // Initialize with saved settings
    init() {
        const settings = PulseUtils.storage.get('settings', {});
        this.config.apiKey = settings.apiKey || null;
    },

    // Analyze URL using PageSpeed Insights API
    async analyzePageSpeed(url) {
        const params = new URLSearchParams({
            url: url,
            strategy: 'mobile',
            category: ['performance', 'accessibility', 'best-practices', 'seo']
        });

        // If no API key, use simulated data
        if (!this.config.apiKey) {
            return this.simulatePageSpeedResult(url);
        }

        try {
            const response = await fetch(`${this.config.endpoints.pagespeed}?${params}&key=${this.config.apiKey}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            return this.parsePageSpeedResult(data);
        } catch (error) {
            console.error('PageSpeed API error:', error);
            return this.simulatePageSpeedResult(url);
        }
    },

    // Parse real PageSpeed result
    parsePageSpeedResult(data) {
        const lighthouse = data.lighthouseResult;
        const categories = lighthouse.categories;

        return {
            url: data.id,
            timestamp: new Date().toISOString(),
            scores: {
                performance: Math.round(categories.performance.score * 100),
                accessibility: Math.round(categories.accessibility.score * 100),
                bestPractices: Math.round(categories['best-practices'].score * 100),
                seo: Math.round(categories.seo.score * 100)
            },
            metrics: {
                fcp: lighthouse.audits['first-contentful-paint'].displayValue,
                lcp: lighthouse.audits['largest-contentful-paint'].displayValue,
                cls: lighthouse.audits['cumulative-layout-shift'].displayValue,
                tbt: lighthouse.audits['total-blocking-time'].displayValue,
                si: lighthouse.audits['speed-index'].displayValue
            },
            audits: this.extractAudits(lighthouse.audits),
            screenshot: lighthouse.audits['final-screenshot']?.details?.data
        };
    },

    // Extract important audits
    extractAudits(audits) {
        const important = [
            'render-blocking-resources',
            'unused-css-rules',
            'unused-javascript',
            'modern-image-formats',
            'uses-text-compression',
            'uses-responsive-images',
            'efficient-animated-content',
            'uses-http2',
            'uses-long-cache-ttl'
        ];

        return important.map(id => {
            const audit = audits[id];
            if (!audit) return null;
            return {
                id: id,
                title: audit.title,
                description: audit.description,
                score: audit.score,
                displayValue: audit.displayValue,
                impact: audit.score === null ? 'info' : audit.score >= 0.9 ? 'pass' : audit.score >= 0.5 ? 'warning' : 'fail'
            };
        }).filter(Boolean);
    },

    // Simulate PageSpeed result
    simulatePageSpeedResult(url) {
        const hostname = new URL(url).hostname;
        const hash = hostname.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

        const randomScore = (base) => Math.min(100, Math.max(20, base + (hash % 30) - 15));

        return {
            url: url,
            timestamp: new Date().toISOString(),
            simulated: true,
            scores: {
                performance: randomScore(75),
                accessibility: randomScore(85),
                bestPractices: randomScore(80),
                seo: randomScore(90)
            },
            metrics: {
                fcp: (1.5 + Math.random()).toFixed(1) + ' s',
                lcp: (2.0 + Math.random() * 2).toFixed(1) + ' s',
                cls: (Math.random() * 0.2).toFixed(3),
                tbt: Math.round(100 + Math.random() * 300) + ' ms',
                si: (2 + Math.random() * 2).toFixed(1) + ' s'
            },
            audits: [
                { id: 'render-blocking', title: 'Eliminate render-blocking resources', score: 0.6, impact: 'warning', displayValue: 'Potential savings of 500ms' },
                { id: 'unused-css', title: 'Reduce unused CSS', score: 0.4, impact: 'fail', displayValue: '45 KB savings' },
                { id: 'image-formats', title: 'Use modern image formats', score: 0.8, impact: 'pass', displayValue: 'Using WebP' },
                { id: 'https', title: 'Uses HTTPS', score: url.startsWith('https') ? 1 : 0, impact: url.startsWith('https') ? 'pass' : 'fail' },
                { id: 'http2', title: 'Uses HTTP/2', score: 0.9, impact: 'pass' },
                { id: 'compression', title: 'Enable text compression', score: 0.7, impact: 'warning', displayValue: 'Potential savings of 120 KB' }
            ]
        };
    },

    // Check website accessibility
    async checkAccessibility(url) {
        try {
            const response = await fetch(url, { mode: 'no-cors', cache: 'no-cache' });
            return { accessible: true, responseTime: null };
        } catch (error) {
            return { accessible: false, error: error.message };
        }
    },

    // Get website technologies (simulated)
    detectTechnologies(url) {
        const techs = ['Shopify', 'jQuery', 'Google Analytics', 'Facebook Pixel'];
        const random = Math.floor(Math.random() * techs.length);
        return techs.slice(0, 2 + random);
    },

    // Store analysis history
    saveAnalysis(result) {
        const history = PulseUtils.storage.get('history', []);
        history.unshift({
            id: PulseUtils.uid(),
            url: result.url,
            scores: result.scores,
            timestamp: result.timestamp,
            overallScore: Math.round((result.scores.performance + result.scores.accessibility + result.scores.bestPractices + result.scores.seo) / 4)
        });
        if (history.length > 50) history.pop();
        PulseUtils.storage.set('history', history);
        return history;
    },

    // Get analysis history
    getHistory() {
        return PulseUtils.storage.get('history', []);
    },

    // Compare two analyses
    compareAnalyses(id1, id2) {
        const history = this.getHistory();
        const a1 = history.find(h => h.id === id1);
        const a2 = history.find(h => h.id === id2);

        if (!a1 || !a2) return null;

        return {
            sites: [a1, a2],
            differences: {
                performance: a1.scores.performance - a2.scores.performance,
                accessibility: a1.scores.accessibility - a2.scores.accessibility,
                bestPractices: a1.scores.bestPractices - a2.scores.bestPractices,
                seo: a1.scores.seo - a2.scores.seo
            }
        };
    },

    // Generate report
    generateReport(result) {
        const overall = Math.round((result.scores.performance + result.scores.accessibility + result.scores.bestPractices + result.scores.seo) / 4);

        return `
WEBSITE HEALTH REPORT
=====================
Generated: ${new Date().toLocaleString()}

URL: ${result.url}
Overall Score: ${overall}/100

SCORES
------
Performance: ${result.scores.performance}/100
Accessibility: ${result.scores.accessibility}/100
Best Practices: ${result.scores.bestPractices}/100
SEO: ${result.scores.seo}/100

CORE WEB VITALS
---------------
First Contentful Paint: ${result.metrics.fcp}
Largest Contentful Paint: ${result.metrics.lcp}
Cumulative Layout Shift: ${result.metrics.cls}
Total Blocking Time: ${result.metrics.tbt}
Speed Index: ${result.metrics.si}

OPPORTUNITIES
-------------
${result.audits.filter(a => a.impact === 'fail' || a.impact === 'warning').map(a => `• ${a.title}: ${a.displayValue || 'Needs attention'}`).join('\n')}

PASSED AUDITS
-------------
${result.audits.filter(a => a.impact === 'pass').map(a => `✓ ${a.title}`).join('\n')}
        `.trim();
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.PulseAPI = PulseAPI;
    document.addEventListener('DOMContentLoaded', () => PulseAPI.init());
}
