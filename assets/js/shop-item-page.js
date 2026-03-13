class BodhiShopItemPage {
    constructor() {
        this.items = Array.isArray(window.BODHI_SHOP_ITEMS) ? window.BODHI_SHOP_ITEMS : [];
        this.params = new URLSearchParams(window.location.search);
        this.slug = this.params.get('slug') || '';
        this.liveStatusUrl = 'https://bodhiswanceramics.netlify.app/.netlify/functions/live-shop-status';

        this.title = document.getElementById('shopItemTitle');
        this.price = document.getElementById('shopItemPrice');
        this.description = document.getElementById('shopItemDescription');
        this.material = document.getElementById('shopItemMaterial');
        this.size = document.getElementById('shopItemSize');
        this.technique = document.getElementById('shopItemTechnique');
        this.shipping = document.getElementById('shopItemShipping');
        this.artNote = document.getElementById('shopItemArtNote');
        this.badge = document.getElementById('shopItemBadge');
        this.buy = document.getElementById('shopItemBuy');
        this.gallery = document.getElementById('shopItemGallery');
        this.empty = document.getElementById('shopItemMissing');
        this.content = document.getElementById('shopItemContent');

        this.render();
        this.refreshFromLiveStatus();
    }

    getItem() {
        return this.items.find((item) => item.slug === this.slug);
    }

    render() {
        const item = this.getItem();
        if (!item || !this.content || !this.empty) {
            if (this.empty) {
                this.empty.hidden = false;
            }
            if (this.content) {
                this.content.hidden = true;
            }
            return;
        }

        this.empty.hidden = true;
        this.content.hidden = false;
        document.title = `${item.title} — Shop — Bodhi Swan Ceramics`;

        if (this.title) {
            this.title.textContent = item.title;
        }

        if (this.price) {
            this.price.textContent = item.price;
        }

        if (this.description) {
            this.description.textContent = item.description;
        }

        if (this.material) {
            this.material.textContent = item.material || 'Stoneware';
        }

        if (this.size) {
            this.size.textContent = item.size || 'One-off piece';
        }

        if (this.technique) {
            this.technique.textContent = item.technique || 'Handmade ceramic work';
        }

        if (this.shipping) {
            this.shipping.textContent = item.shippingNote || 'Packed carefully with protective wrapping. Australian shipping only for now.';
        }

        if (this.artNote) {
            this.artNote.textContent = item.artNote || 'Each piece is handmade and will carry the small marks and variation that come with one-off ceramic work.';
        }

        if (this.badge) {
            this.badge.textContent = item.soldOut ? 'Sold out' : 'Available now';
            this.badge.classList.toggle('is-live', !item.soldOut);
        }

        if (this.buy) {
            if (item.soldOut || !item.stripeUrl) {
                this.buy.textContent = 'Sold out';
                this.buy.removeAttribute('href');
                this.buy.classList.add('is-disabled');
            } else {
                this.buy.textContent = 'Buy with Stripe';
                this.buy.href = item.stripeUrl;
                this.buy.target = '_blank';
                this.buy.rel = 'noopener';
                this.buy.classList.remove('is-disabled');
            }
        }

        if (this.gallery) {
            this.gallery.innerHTML = '';
            const images = Array.isArray(item.images) && item.images.length
                ? item.images
                : [{ src: item.image, alt: item.alt || item.title }];

            images.forEach((image, index) => {
                const figure = document.createElement('figure');
                figure.className = `shop-item-gallery-card${index === 0 ? ' is-featured' : ''}`;

                const img = document.createElement('img');
                img.src = image.src;
                img.alt = image.alt || item.title;
                img.loading = index === 0 ? 'eager' : 'lazy';

                figure.appendChild(img);
                this.gallery.appendChild(figure);
            });
        }
    }

    async refreshFromLiveStatus() {
        const item = this.getItem();
        if (!item) {
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
            const liveItem = payload?.items?.[this.slug];
            if (!payload?.ok || !liveItem) {
                return;
            }

            item.soldOut = Boolean(liveItem.soldOut);
            item.price = Number.isFinite(liveItem.priceAud) ? `AUD ${liveItem.priceAud}` : item.price;
            item.stripeUrl = liveItem.stripeUrl || item.stripeUrl;
            this.render();
        } catch {
            // Keep the static item page visible if the live status call fails.
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BodhiShopItemPage();
});
