class BodhiShopPage {
    constructor() {
        this.items = Array.isArray(window.BODHI_SHOP_ITEMS) ? window.BODHI_SHOP_ITEMS : [];
        this.grid = document.getElementById('shopGrid');
        this.empty = document.getElementById('shopEmpty');
        this.availableCount = document.getElementById('shopAvailableCount');

        this.render();
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

        this.empty.hidden = availableItems.length !== 0;

        this.items.forEach((item) => {
            this.grid.appendChild(this.createCard(item));
        });
    }

    createCard(item) {
        const article = document.createElement('article');
        article.className = `shop-card${item.soldOut ? ' is-sold-out' : ''}`;

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

        const action = document.createElement(item.soldOut ? 'span' : 'a');
        action.className = item.soldOut ? 'shop-card-action is-disabled' : 'shop-card-action';
        action.textContent = item.soldOut ? 'Sold out' : 'Buy with Stripe';

        if (!item.soldOut) {
            action.href = item.stripeUrl;
            action.target = '_blank';
            action.rel = 'noopener';
        }

        content.appendChild(title);
        content.appendChild(price);
        content.appendChild(description);
        content.appendChild(action);

        article.appendChild(imageWrapper);
        article.appendChild(content);

        return article;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BodhiShopPage();
});
