class ThemeManager {
    constructor() {
        this.currentTheme = this.getSavedTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.initializeThemeToggle();
        this.initializeParticles();
        this.initializeNavigation();
        this.initializeSystemThemeDetection();
    }

    getSavedTheme() {
        return localStorage.getItem('matrixLab-theme') || 'dark';
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('matrixLab-theme', theme);
        this.currentTheme = theme;

        document.documentElement.style.setProperty('--theme-transition', 'all 0.3s ease-in-out');

        this.updateThemeToggleIcons();

        this.updateParticleColors();

        this.updateChartThemes(theme);

        this.updateMetaThemeColor(theme);

        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
    }

    updateThemeToggleIcons() {
        const themeToggles = document.querySelectorAll('#themeToggle');
        themeToggles.forEach(toggle => {
            const icon = toggle.querySelector('svg');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease, fill 0.3s ease';
                icon.style.transform = this.currentTheme === 'light' ? 'rotate(180deg)' : 'rotate(0deg)';

                const iconColor = this.currentTheme === 'light' ?
                    'var(--neutral-600)' : 'var(--neutral-300)';
                icon.style.fill = iconColor;
            }

            toggle.style.setProperty('--hover-bg', this.currentTheme === 'light' ?
                'var(--neutral-100)' : 'var(--neutral-700)');
        });
    }

    updateParticleColors() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.background = this.currentTheme === 'light' ?
                'var(--primary-400)' : 'var(--primary-500)';
            particle.style.opacity = this.currentTheme === 'light' ? '0.08' : '0.1';
        });
    }

    updateChartThemes(theme) {
        if (window.deSolver && window.deSolver.chart) {
            const isDark = theme === 'dark';
            const chart = window.deSolver.chart;

            chart.options.plugins.title.color = isDark ? '#f1f5f9' : '#0f172a';
            chart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
            chart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
            chart.options.scales.x.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            chart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

            chart.update('none');
        }
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff';
    }

    initializeSystemThemeDetection() {
        if (window.matchMedia) {
            const systemThemePreference = window.matchMedia('(prefers-color-scheme: dark)');

            if (!localStorage.getItem('matrixLab-theme')) {
                this.currentTheme = systemThemePreference.matches ? 'dark' : 'light';
                this.applyTheme(this.currentTheme);
            }

            systemThemePreference.addEventListener('change', (e) => {
                if (!localStorage.getItem('matrixLab-theme')) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(this.currentTheme);
                }
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);

        const themeName = this.currentTheme === 'light' ? 'Light' : 'Dark';
        this.showNotification(`${themeName} mode activated`, 'success');

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    initializeThemeToggle() {
        const themeToggles = document.querySelectorAll('#themeToggle');
        themeToggles.forEach(toggle => {
            toggle.replaceWith(toggle.cloneNode(true));
        });

        document.querySelectorAll('#themeToggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleTheme();
            });

            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });

            toggle.setAttribute('aria-label', 'Toggle theme');
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('tabindex', '0');
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'matrixLab-theme') {
                this.currentTheme = e.newValue || 'dark';
                this.applyTheme(this.currentTheme);
            }
        });
    }


initializeNavigation() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('data-active');

        const href = link.getAttribute('href');

        if (currentPath === '/' && (href === '#operations' || href === '/' || href === '')) {
            link.classList.add('active');
        }
        else if (currentPath === '/differential-equations' && (href === '/differential-equations' || href === '#solver')) {
            link.classList.add('active');
        }
        else if (currentPath === '/about' && (href === '/about' || href === '#about')) {
            link.classList.add('active');
        }
        else if (currentHash && href === currentHash) {
            link.classList.add('active');
        }

        link.style.transition = 'all 0.3s ease';
    });
}

    initializeParticles() {
        const container = document.getElementById('particlesContainer');
        if (!container) return;

        const particleCount = 30;
        container.innerHTML = '';

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 4 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 12;
            const duration = Math.random() * 10 + 10;
            const opacity = Math.random() * 0.1 + 0.05;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${-delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.opacity = opacity;
            particle.style.borderRadius = '50%';
            particle.style.position = 'absolute';
            particle.style.pointerEvents = 'none';

            particle.style.background = this.currentTheme === 'light' ?
                'var(--primary-400)' : 'var(--primary-500)';

            container.appendChild(particle);
        }
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.classList.add('notification-exit');
            setTimeout(() => notification.remove(), 300);
        });

        setTimeout(() => {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');

            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${this.escapeHtml(message)}</span>
                    <button class="notification-close" aria-label="Close notification">&times;</button>
                </div>
            `;

            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.transform = 'translateY(0)';
                notification.style.opacity = '1';
            });

            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.classList.add('notification-exit');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            });

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('notification-exit');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 5000);
        }, 100);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    isLightMode() {
        return this.currentTheme === 'light';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();

    window.addEventListener('themeChange', (event) => {
        console.log(`Theme changed to: ${event.detail.theme}`);
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;

}
