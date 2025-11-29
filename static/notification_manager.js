class NotificationManager {
    constructor() {
        this.notificationQueue = [];
        this.isShowing = false;
    }

    show(message, type = 'info', duration = 5000) {
        const notification = {
            message,
            type,
            duration,
            timestamp: Date.now()
        };

        this.notificationQueue.push(notification);
        this.processQueue();
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    processQueue() {
        if (this.isShowing || this.notificationQueue.length === 0) {
            return;
        }

        this.isShowing = true;
        const notification = this.notificationQueue.shift();
        this.displayNotification(notification);
    }

    displayNotification(notification) {
        this.removeAllNotifications();

        const notificationElement = this.createNotificationElement(notification);
        document.body.appendChild(notificationElement);

        requestAnimationFrame(() => {
            notificationElement.classList.add('show');
        });

        setTimeout(() => {
            this.hideNotification(notificationElement);
        }, notification.duration);
    }

    createNotificationElement(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification notification-${notification.type}`;
        notificationElement.setAttribute('role', 'alert');
        notificationElement.setAttribute('aria-live', 'polite');

        const icon = this.getIconForType(notification.type);

        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-message-container">
                    <span class="notification-icon">${icon}</span>
                    <span class="notification-message">${this.escapeHtml(notification.message)}</span>
                </div>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;

        const closeBtn = notificationElement.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notificationElement);
        });

        return notificationElement;
    }

    getIconForType(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    hideNotification(notificationElement) {
        if (!notificationElement.parentNode) return;

        notificationElement.classList.remove('show');
        notificationElement.classList.add('hiding');

        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
            this.isShowing = false;
            this.processQueue();
        }, 300);
    }

    removeAllNotifications() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.remove();
            }
        });
        this.isShowing = false;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    matrixOperationSuccess(operation, matrixName) {
        const messages = {
            'rref': `RREF computed for ${matrixName}`,
            'det': `Determinant calculated for ${matrixName}`,
            'inverse': `Inverse matrix computed for ${matrixName}`,
            'eig': `Eigen analysis completed for ${matrixName}`,
            'default': `Operation ${operation} completed for ${matrixName}`
        };
        this.success(messages[operation] || messages.default);
    }

    matrixOperationError(operation, error) {
        this.error(`Matrix operation failed: ${error}`);
    }

    odeSolutionSuccess(equationType) {
        const messages = {
            'first_order': 'First-order ODE solved successfully',
            'second_order': 'Second-order ODE solved successfully',
            'system': 'System of ODEs solved successfully',
            'default': 'Differential equation solved successfully'
        };
        this.success(messages[equationType] || messages.default);
    }

    odeSolutionError(error) {
        this.error(`ODE solving failed: ${error}`);
    }

    saveSuccess(itemType, name) {
        this.success(`${itemType} "${name}" saved successfully`);
    }

    deleteSuccess(itemType, name) {
        this.success(`${itemType} "${name}" deleted successfully`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();

});
