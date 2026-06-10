class BodhiShopPage {
    constructor() {
        this.items = Array.isArray(window.BODHI_SHOP_ITEMS) ? window.BODHI_SHOP_ITEMS : [];
        this.grid = document.getElementById('shopGrid');
        this.empty = document.getElementById('shopEmpty');
        this.availableCount = document.getElementById('shopAvailableCount');
        this.liveStatusUrl = 'https://bodhiswanceramics.netlify.app/.netlify/functions/live-shop-status';
        this.refreshIntervalMs = 15000;
        this.maxRefreshAttempts = 12;
        this.refreshAttempts = 0;

        this.render();
        this.refreshFromLiveStatus();
        this.startPolling();
    }

    render() {
        if (!this.grid || !this.empty) {
            return;
        }

        const availableItems = this.items.filter((item) => !item.soldOut && item.stripeUrl);
        if (this.availableCount) {
            this.availableCount.textContent = `${availableItems.length} available now`;
        }

        this.grid.innerHTML = '';

        if (!this.items.length) {
            this.empty.hidden = false;
            return;
        }

        this.empty.hidden = true;

        this.items.forEach((item) => {
            this.grid.appendChild(this.createCard(item));
        });
    }

    createCard(item) {
        const article = document.createElement('article');
        article.className = `shop-card${item.soldOut ? ' is-sold-out' : ''}`;

        const link = document.createElement('a');
        link.className = 'shop-card-link';
        link.href = item.detailUrl || `shop-item.html?slug=${encodeURIComponent(item.slug)}`;
        link.setAttribute('aria-label', `View ${item.title}`);

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'shop-card-image';

        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.alt || item.title;
        image.loading = 'lazy';
        imageWrapper.appendChild(image);

        if (item.soldOut) {
            const badge = document.createElement('span');
            badge.className = 'shop-card-badge';
            badge.textContent = 'Sold out';
            imageWrapper.appendChild(badge);
        }

        const content = document.createElement('div');
        content.className = 'shop-card-content';

        const title = document.createElement('h2');
        title.className = 'shop-card-title';
        title.textContent = item.title;

        const price = document.createElement('p');
        price.className = 'shop-card-price';
        price.textContent = item.price;

        const description = document.createElement('p');
        description.className = 'shop-card-description';
        description.textContent = item.description;

        const action = document.createElement('span');
        action.className = `shop-card-action${item.soldOut ? ' is-disabled' : ''}`;
        action.textContent = item.soldOut ? 'View piece' : 'View piece';

        content.appendChild(title);
        content.appendChild(price);
        content.appendChild(description);
        content.appendChild(action);

        link.appendChild(imageWrapper);
        link.appendChild(content);
        article.appendChild(link);

        return article;
    }

    async refreshFromLiveStatus() {
        if (!this.items.length) {
            return;
        }

        try {
            const response = await fetch(`${this.liveStatusUrl}?t=${Date.now()}`, {
                cache: 'no-store'
            });

            if (!response.ok) {
                return;
            }

            const payload = await response.json();
            if (!payload?.ok || !payload.items) {
                return;
            }

            let changed = false;
            this.items = this.items.map((item) => {
                const liveItem = payload.items[item.slug];
                if (!liveItem) {
                    return item;
                }

                const nextPrice = Number.isFinite(liveItem.priceAud) ? `AUD ${liveItem.priceAud}` : item.price;
                const nextStripeUrl = liveItem.stripeUrl || item.stripeUrl;
                const nextSoldOut = Boolean(liveItem.soldOut);

                if (
                    nextPrice !== item.price ||
                    nextStripeUrl !== item.stripeUrl ||
                    nextSoldOut !== item.soldOut
                ) {
                    changed = true;
                    return {
                        ...item,
                        price: nextPrice,
                        stripeUrl: nextStripeUrl,
                        soldOut: nextSoldOut
                    };
                }

                return item;
            });

            if (changed) {
                this.render();
            }
        } catch {
            // Ignore transient network errors and keep the static shop visible.
        }
    }

    startPolling() {
        window.setInterval(() => {
            if (this.refreshAttempts >= this.maxRefreshAttempts) {
                return;
            }

            this.refreshAttempts += 1;
            this.refreshFromLiveStatus();
        }, this.refreshIntervalMs);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BodhiShopPage();
});
