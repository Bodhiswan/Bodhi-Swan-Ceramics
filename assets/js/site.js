/* =========================================================================
   Bodhi Swan Ceramics — site behaviour
   Navigation, cart, and page rendering. Pages opt in via <body data-page>.
   Depends on works.js (WORKS, EXHIBITIONS, FEATURED_IDS).
   ========================================================================= */

(function () {
  "use strict";

  var CART_KEY = "bsc-cart-v1";
  var ORDER_EMAIL = "swan1995@gmail.com";

  var aud = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  function byId(id) {
    return WORKS.find(function (w) { return w.id === id; });
  }

  function exhibitionById(id) {
    return EXHIBITIONS.find(function (e) { return e.id === id; });
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ----- Cart ----- */

  var Cart = {
    read: function () {
      try {
        var ids = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        return ids.filter(function (id) {
          var w = byId(id);
          return w && w.status === "available";
        });
      } catch (e) {
        return [];
      }
    },
    write: function (ids) {
      localStorage.setItem(CART_KEY, JSON.stringify(ids));
      Cart.refresh();
    },
    add: function (id) {
      var ids = Cart.read();
      if (ids.indexOf(id) !== -1) {
        toast("Already in your cart — each piece is one of a kind.");
        openCart();
        return;
      }
      ids.push(id);
      Cart.write(ids);
      toast("Added to cart.");
      openCart();
    },
    remove: function (id) {
      Cart.write(Cart.read().filter(function (x) { return x !== id; }));
    },
    total: function () {
      return Cart.read().reduce(function (sum, id) {
        return sum + (byId(id).price || 0);
      }, 0);
    },
    refresh: function () {
      var ids = Cart.read();
      var count = document.querySelector("[data-cart-count]");
      if (count) {
        count.textContent = String(ids.length);
        count.hidden = ids.length === 0;
      }
      renderCartBody(ids);
    },
  };

  function renderCartBody(ids) {
    var body = document.querySelector("[data-cart-body]");
    var foot = document.querySelector("[data-cart-foot]");
    if (!body) return;

    body.innerHTML = "";
    if (!ids.length) {
      body.appendChild(el('<p class="cart-empty">Your cart is empty. Every vase in the shop is a one-off — when it’s gone, it’s gone.</p>'));
      if (foot) foot.hidden = true;
      return;
    }

    ids.forEach(function (id) {
      var w = byId(id);
      var item = el(
        '<div class="cart-item">' +
          '<img src="' + w.image + '" alt="' + escapeHtml(w.alt) + '">' +
          '<div>' +
            '<p class="cart-item__title">' + escapeHtml(w.title) + "</p>" +
            '<p class="cart-item__meta">' + escapeHtml(w.series) + " series · " + w.year + "</p>" +
            '<p class="cart-item__price">' + aud.format(w.price) + "</p>" +
          "</div>" +
          '<button class="cart-item__remove" type="button">Remove</button>' +
        "</div>"
      );
      item.querySelector(".cart-item__remove").addEventListener("click", function () {
        Cart.remove(id);
      });
      body.appendChild(item);
    });

    if (foot) {
      foot.hidden = false;
      var subtotal = foot.querySelector("[data-cart-subtotal]");
      if (subtotal) subtotal.textContent = aud.format(Cart.total());
    }
  }

  function checkoutByEmail() {
    var ids = Cart.read();
    if (!ids.length) return;
    var lines = ids.map(function (id) {
      var w = byId(id);
      return "- " + w.title + " (" + w.series + ", " + w.year + ") — " + aud.format(w.price);
    });
    var body =
      "Hello Bodhi,\n\nI'd like to purchase the following piece(s):\n\n" +
      lines.join("\n") +
      "\n\nSubtotal: " + aud.format(Cart.total()) +
      "\n\nMy delivery address is:\n\n\nThank you!";
    window.location.href =
      "mailto:" + ORDER_EMAIL +
      "?subject=" + encodeURIComponent("Order enquiry — Bodhi Swan Ceramics") +
      "&body=" + encodeURIComponent(body);
  }

  function openCart() {
    var drawer = document.querySelector("[data-cart-drawer]");
    var overlay = document.querySelector("[data-cart-overlay]");
    if (!drawer) return;
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    var drawer = document.querySelector("[data-cart-drawer]");
    var overlay = document.querySelector("[data-cart-overlay]");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  /* ----- Toast ----- */

  var toastTimer;
  function toast(msg) {
    var node = document.querySelector("[data-toast]");
    if (!node) return;
    node.textContent = msg;
    node.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.remove("is-visible");
    }, 2600);
  }

  /* ----- Shared chrome ----- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var mobile = document.querySelector(".mobile-nav");
    if (toggle && mobile) {
      toggle.addEventListener("click", function () {
        var open = mobile.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    document.querySelectorAll("[data-cart-open]").forEach(function (btn) {
      btn.addEventListener("click", openCart);
    });
    document.querySelectorAll("[data-cart-close]").forEach(function (btn) {
      btn.addEventListener("click", closeCart);
    });
    var overlay = document.querySelector("[data-cart-overlay]");
    if (overlay) overlay.addEventListener("click", closeCart);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeCart();
    });

    var checkout = document.querySelector("[data-cart-checkout]");
    if (checkout) checkout.addEventListener("click", checkoutByEmail);

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ----- Work cards ----- */

  function statusBadge(w) {
    if (w.status === "sold") return '<span class="work-card__badge work-card__badge--sold">Sold</span>';
    if (w.status === "exhibition") return '<span class="work-card__badge">On exhibition</span>';
    if (w.status === "collection") return '<span class="work-card__badge">Collection</span>';
    return "";
  }

  function priceLine(w) {
    if (w.status === "available") return '<p class="work-card__price">' + aud.format(w.price) + "</p>";
    if (w.status === "sold" && w.price) return '<p class="work-card__price"><s>' + aud.format(w.price) + "</s></p>";
    return "";
  }

  function workCard(w) {
    return el(
      '<article class="work-card reveal">' +
        '<div class="work-card__media">' +
          '<img src="' + w.image + '" alt="' + escapeHtml(w.alt) + '" loading="lazy">' +
          statusBadge(w) +
        "</div>" +
        '<h3 class="work-card__title"><a href="piece.html?id=' + w.id + '">' + escapeHtml(w.title) + "</a></h3>" +
        '<p class="work-card__meta">' + escapeHtml(w.series) + " series · " + escapeHtml(w.dimensions) + " · " + w.year + "</p>" +
        priceLine(w) +
      "</article>"
    );
  }

  function renderWorks(container, works) {
    container.innerHTML = "";
    works.forEach(function (w) { container.appendChild(workCard(w)); });
    initReveal();
  }

  /* ----- Pages ----- */

  function pageHome() {
    var featured = document.querySelector("[data-featured-grid]");
    if (featured) {
      renderWorks(featured, FEATURED_IDS.map(byId).filter(Boolean));
    }

    var shopTeaser = document.querySelector("[data-shop-teaser]");
    if (shopTeaser) {
      var available = WORKS.filter(function (w) { return w.status === "available"; }).slice(0, 4);
      renderWorks(shopTeaser, available);
    }

    var exhibitionSlot = document.querySelector("[data-current-exhibition]");
    var current = EXHIBITIONS.find(function (e) { return e.status === "current" || e.status === "upcoming"; });
    if (exhibitionSlot && current) {
      exhibitionSlot.appendChild(renderExhibition(current));
    }
  }

  function pageGallery() {
    var grid = document.querySelector("[data-gallery-grid]");
    var filters = document.querySelector("[data-gallery-filters]");
    if (!grid) return;

    var series = WORKS.map(function (w) { return w.series; })
      .filter(function (s, i, a) { return a.indexOf(s) === i; });

    function apply(filter) {
      var works = filter === "all" ? WORKS : WORKS.filter(function (w) { return w.series === filter; });
      renderWorks(grid, works);
    }

    if (filters) {
      ["all"].concat(series).forEach(function (s) {
        var label = s === "all" ? "All work" : s;
        var btn = el('<button type="button">' + escapeHtml(label) + "</button>");
        if (s === "all") btn.classList.add("is-active");
        btn.addEventListener("click", function () {
          filters.querySelectorAll("button").forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
          apply(s);
        });
        filters.appendChild(btn);
      });
    }

    apply("all");
  }

  function renderExhibition(ex) {
    var statusLabel =
      ex.status === "current" ? "Now showing" :
      ex.status === "upcoming" ? "Upcoming" : "Past exhibition";
    var statusClass = ex.status === "current" || ex.status === "upcoming"
      ? "exhibition__status exhibition__status--current"
      : "exhibition__status";

    var workLinks = (ex.workIds || [])
      .map(byId)
      .filter(Boolean)
      .map(function (w) {
        return '<a href="piece.html?id=' + w.id + '">' + escapeHtml(w.title) + "</a>";
      })
      .join("");

    return el(
      '<article class="exhibition reveal">' +
        '<div class="exhibition__media"><img src="' + ex.image + '" alt="Placeholder installation view of ' + escapeHtml(ex.title) + '" loading="lazy"></div>' +
        "<div>" +
          '<span class="' + statusClass + '">' + statusLabel + "</span>" +
          "<h2>" + escapeHtml(ex.title) + "</h2>" +
          '<p class="exhibition__venue"><strong>' + escapeHtml(ex.venue) + "</strong> · " + escapeHtml(ex.location) + "<br>" + escapeHtml(ex.dates) + "</p>" +
          '<p class="exhibition__blurb">' + escapeHtml(ex.blurb) + "</p>" +
          (workLinks ? '<div class="exhibition__works">' + workLinks + "</div>" : "") +
        "</div>" +
      "</article>"
    );
  }

  function pageExhibitions() {
    var currentWrap = document.querySelector("[data-exhibitions-current]");
    var pastWrap = document.querySelector("[data-exhibitions-past]");
    if (!currentWrap) return;

    EXHIBITIONS.forEach(function (ex) {
      var target = ex.status === "past" ? pastWrap : currentWrap;
      if (target) target.appendChild(renderExhibition(ex));
    });
    initReveal();
  }

  function pageShop() {
    var grid = document.querySelector("[data-shop-grid]");
    var countNode = document.querySelector("[data-shop-count]");
    if (!grid) return;

    var works = WORKS.filter(function (w) {
      return w.status === "available" || w.status === "sold";
    }).sort(function (a, b) {
      return a.status === b.status ? 0 : a.status === "available" ? -1 : 1;
    });

    var availableCount = works.filter(function (w) { return w.status === "available"; }).length;
    if (countNode) {
      countNode.textContent = availableCount === 1
        ? "1 piece available now"
        : availableCount + " pieces available now";
    }

    renderWorks(grid, works);
  }

  function pagePiece() {
    var root = document.querySelector("[data-piece-root]");
    if (!root) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var w = byId(id) || WORKS[0];
    document.title = w.title + " — Bodhi Swan Ceramics";

    var ex = w.exhibitionId ? exhibitionById(w.exhibitionId) : null;

    var priceBlock;
    if (w.status === "available") {
      priceBlock = '<p class="piece__price">' + aud.format(w.price) + "</p>";
    } else if (w.status === "sold") {
      priceBlock = '<p class="piece__price"><s>' + (w.price ? aud.format(w.price) : "") + "</s>" +
        '<span class="piece__status-note">Sold — enquire about commissioning a similar form.</span></p>';
    } else if (w.status === "exhibition" && ex) {
      priceBlock = '<p class="piece__price">On exhibition' +
        '<span class="piece__status-note">Showing in “' + escapeHtml(ex.title) + "” at " + escapeHtml(ex.venue) + " until the close of the show. Sales enquiries through the gallery.</span></p>";
    } else {
      priceBlock = '<p class="piece__price">Not for sale' +
        '<span class="piece__status-note">Held in a collection. Commissions of similar forms are welcome.</span></p>';
    }

    var actions = "";
    if (w.status === "available") {
      var buy = w.checkoutUrl
        ? '<a class="btn" href="' + w.checkoutUrl + '">Buy now</a>'
        : '<button class="btn" type="button" data-add-to-cart>Add to cart</button>';
      actions = '<div class="piece__actions">' + buy +
        '<a class="btn btn--ghost" href="mailto:' + ORDER_EMAIL + '?subject=' +
        encodeURIComponent("Enquiry — " + w.title) + '">Ask a question</a></div>' +
        '<p class="piece__note">One of a kind — there is exactly one of this vase in the world. Carefully packed by hand and shipped Australia-wide; international shipping by arrangement.</p>';
    } else {
      actions = '<div class="piece__actions">' +
        '<a class="btn btn--ghost" href="mailto:' + ORDER_EMAIL + '?subject=' +
        encodeURIComponent("Enquiry — " + w.title) + '">Enquire about this work</a></div>';
    }

    root.innerHTML =
      '<div class="piece__media reveal is-visible"><img src="' + w.image + '" alt="' + escapeHtml(w.alt) + '"></div>' +
      '<div class="piece__info">' +
        '<span class="kicker">' + escapeHtml(w.form) + "</span>" +
        "<h1>" + escapeHtml(w.title) + "</h1>" +
        '<p class="piece__series">' + escapeHtml(w.series) + " series · " + w.year + "</p>" +
        priceBlock +
        '<p class="piece__desc">' + escapeHtml(w.description) + "</p>" +
        '<dl class="piece__specs">' +
          "<div><dt>Dimensions</dt><dd>" + escapeHtml(w.dimensions) + "</dd></div>" +
          "<div><dt>Materials</dt><dd>" + escapeHtml(w.materials) + "</dd></div>" +
          "<div><dt>Year</dt><dd>" + w.year + "</dd></div>" +
          (ex ? "<div><dt>Exhibition</dt><dd>" + escapeHtml(ex.title) + ", " + escapeHtml(ex.venue) + "</dd></div>" : "") +
        "</dl>" +
        actions +
      "</div>";

    var addBtn = root.querySelector("[data-add-to-cart]");
    if (addBtn) {
      addBtn.addEventListener("click", function () { Cart.add(w.id); });
    }

    // Prev / next navigation through the full catalogue.
    var idx = WORKS.indexOf(w);
    var prev = WORKS[(idx - 1 + WORKS.length) % WORKS.length];
    var next = WORKS[(idx + 1) % WORKS.length];
    var nav = document.querySelector("[data-piece-nav]");
    if (nav) {
      nav.innerHTML =
        '<a class="text-link" href="piece.html?id=' + prev.id + '">← ' + escapeHtml(prev.title) + "</a>" +
        '<a class="text-link" href="piece.html?id=' + next.id + '">' + escapeHtml(next.title) + " →</a>";
    }
  }

  /* ----- Boot ----- */

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    Cart.refresh();

    switch (document.body.dataset.page) {
      case "home": pageHome(); break;
      case "gallery": pageGallery(); break;
      case "exhibitions": pageExhibitions(); break;
      case "shop": pageShop(); break;
      case "piece": pagePiece(); break;
    }

    initReveal();
  });
})();
