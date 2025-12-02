
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

class NotificationService {
    private permission: NotificationPermission = 'default';

    constructor() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false;
        
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        } catch (e) {
            console.error("Notification permission error:", e);
            return false;
        }
    }

    sendPush(title: string, body: string) {
        if (this.permission === 'granted') {
            try {
                // Try to use ServiceWorker registration if available (for mobile background)
                if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            body: body,
                            icon: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png', // Placeholder icon
                            vibrate: [200, 100, 200],
                            tag: 'alper-ai-notification'
                        } as any);
                    });
                } else {
                    // Fallback to standard API
                    new Notification(title, {
                        body: body,
                        icon: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
                    });
                }
            } catch (e) {
                console.warn("Notification failed:", e);
            }
        }
    }

    sendEmail(to: string, subject: string, body: string) {
        // Safe encoding for URL parameters
        // Note: Browsers and email clients have URL length limits (often 2000 chars).
        // Truncate body if excessive to prevent link failure.
        const safeBody = body.length > 1500 ? body.substring(0, 1500) + "\n\n[Raporun devamı uzunluk sınırı nedeniyle kesildi.]" : body;
        
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(safeBody)}`;
        
        const link = document.createElement('a');
        link.href = mailtoLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Append to body, click, remove (standard practice for programmatic triggers)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const notificationService = new NotificationService();
