/**
 * Kathirava Agency - Interactive Product Catalog Controller
 * Multi-brand filtering (Pidilite & Havells), dynamic categories, instant search, and product modal.
 */

class CatalogController {
  constructor() {
    this.activeBrand = "all";
    this.activeCategory = "all";
    this.searchQuery = "";
    this.selectedPackByProduct = {};

    this.initElements();
    this.initEvents();
    this.renderCategoryPills();
    this.renderCatalog();
  }

  initElements() {
    this.grid = document.getElementById("catalog-grid");
    this.brandTabs = document.querySelectorAll(".brand-tab-btn");
    this.categoryContainer = document.getElementById("category-filter-pills");
    this.searchInput = document.getElementById("catalog-search-input");
    this.searchClearBtn = document.getElementById("search-clear-btn");
    this.catalogCountDisplay = document.getElementById("catalog-results-count");
    this.productModal = document.getElementById("product-detail-modal");
    this.modalOverlay = document.getElementById("product-modal-overlay");
    this.closeModalBtn = document.getElementById("close-product-modal");
  }

  initEvents() {
    // Brand tab switching
    this.brandTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        this.brandTabs.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeBrand = btn.dataset.brand;
        this.activeCategory = "all";
        this.renderCategoryPills();
        this.renderCatalog();
      });
    });

    // Instant search with debounce
    if (this.searchInput) {
      let debounceTimer;
      this.searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value.trim();
        if (this.searchClearBtn) {
          this.searchClearBtn.style.display = val.length > 0 ? "block" : "none";
        }
        debounceTimer = setTimeout(() => {
          this.searchQuery = val.toLowerCase();
          this.renderCatalog();
        }, 150);
      });
    }

    if (this.searchClearBtn) {
      this.searchClearBtn.addEventListener("click", () => {
        this.searchInput.value = "";
        this.searchQuery = "";
        this.searchClearBtn.style.display = "none";
        this.renderCatalog();
        this.searchInput.focus();
      });
    }

    // Modal close
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener("click", () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener("click", () => this.closeModal());
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModal();
    });
  }

  renderCategoryPills() {
    if (!this.categoryContainer) return;

    // Filter categories relevant to currently selected brand
    const availableCategories = CATEGORIES.filter(cat => {
      if (cat.id === "all") return true;
      if (this.activeBrand === "all") return true;
      return cat.brand === this.activeBrand;
    });

    let html = "";
    availableCategories.forEach(cat => {
      const isActive = this.activeCategory === cat.id;
      html += `
        <button type="button" 
                class="category-pill-btn ${isActive ? 'active' : ''}" 
                data-category="${cat.id}">
          <span class="cat-pill-name">${cat.name}</span>
        </button>
      `;
    });

    this.categoryContainer.innerHTML = html;

    // Attach click events
    this.categoryContainer.querySelectorAll(".category-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.categoryContainer.querySelectorAll(".category-pill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeCategory = btn.dataset.category;
        this.renderCatalog();
      });
    });
  }

  getFilteredProducts() {
    return PRODUCTS.filter(item => {
      // Brand filter
      if (this.activeBrand !== "all" && item.brand !== this.activeBrand) {
        return false;
      }
      // Category filter
      if (this.activeCategory !== "all" && item.category !== this.activeCategory) {
        return false;
      }
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery;
        const inName = item.name.toLowerCase().includes(query);
        const inSubBrand = item.subBrand.toLowerCase().includes(query);
        const inSku = item.sku.toLowerCase().includes(query);
        const inDesc = item.description.toLowerCase().includes(query);
        const inApps = item.applications.some(a => a.toLowerCase().includes(query));
        const inPacks = item.packaging.some(p => p.toLowerCase().includes(query));
        if (!inName && !inSubBrand && !inSku && !inDesc && !inApps && !inPacks) {
          return false;
        }
      }
      return true;
    });
  }

  renderCatalog() {
    if (!this.grid) return;

    const items = this.getFilteredProducts();

    if (this.catalogCountDisplay) {
      this.catalogCountDisplay.textContent = `Showing ${items.length} of ${PRODUCTS.length} Stockist SKUs`;
    }

    if (items.length === 0) {
      this.grid.innerHTML = `
        <div class="catalog-empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>No products match your current filters</h3>
          <p>Try searching for a different keyword (e.g., "Fevicol", "Lifeline", "M-Seal", "MCB") or reset your category filters.</p>
          <button class="btn btn-secondary" onclick="catalogController.resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    let html = "";
    items.forEach(product => {
      const isPidilite = product.brand === "pidilite";
      const brandClass = isPidilite ? "brand-pidilite" : "brand-havells";
      const brandBadgeText = isPidilite ? "Pidilite Industries" : "Havells India";
      const initialPack = this.selectedPackByProduct[product.id] || product.packaging[0];

      // Build options for packaging select
      const packagingOptions = product.packaging.map(pack => {
        const selected = pack === initialPack ? "selected" : "";
        return `<option value="${pack}" ${selected}>${pack}</option>`;
      }).join("");

      // Feature highlights
      const featuresList = product.features.slice(0, 3).map(feat => {
        return `<li><span class="feat-check">✓</span> ${feat}</li>`;
      }).join("");

      html += `
        <article class="product-card ${brandClass}" id="card-${product.id}">
          <div class="product-card-top">
            <div class="product-brand-tags">
              <span class="badge ${isPidilite ? 'badge-pidilite' : 'badge-havells'}">
                ${brandBadgeText}
              </span>
              <span class="badge badge-subbrand">${product.subBrand}</span>
            </div>
            <span class="product-badge-accent" style="color: ${product.badgeColor}; border-color: ${product.badgeColor}40">
              ${product.badge}
            </span>
          </div>

          <div class="product-card-body">
            <span class="product-sku-code">SKU: ${product.sku}</span>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-headline">${product.headline}</p>

            <ul class="product-features-list">
              ${featuresList}
            </ul>

            <div class="product-spec-row">
              <div class="spec-col">
                <span class="spec-label">Carton Packing</span>
                <span class="spec-value">${product.cartonSize}</span>
              </div>
              <div class="spec-col">
                <span class="spec-label">Wholesale MOQ</span>
                <span class="spec-value">${product.moq}</span>
              </div>
            </div>

            <!-- Pack selector & RFQ Adder -->
            <div class="product-action-box">
              <div class="pack-selector-wrapper">
                <label for="pack-${product.id}" class="pack-label">Select Pack / Size:</label>
                <select id="pack-${product.id}" class="pack-select" onchange="catalogController.updateSelectedPack('${product.id}', this.value)">
                  ${packagingOptions}
                </select>
              </div>

              <div class="card-btn-group">
                <button type="button" 
                        class="btn btn-rfq-add" 
                        onclick="catalogController.handleAddToCart('${product.id}')"
                        id="btn-rfq-${product.id}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add to RFQ</span>
                </button>

                <button type="button" 
                        class="btn-quick-spec" 
                        onclick="catalogController.openProductModal('${product.id}')"
                        title="View Technical Details & Applications"
                        aria-label="View Technical Details">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    });

    this.grid.innerHTML = html;
  }

  updateSelectedPack(productId, pack) {
    this.selectedPackByProduct[productId] = pack;
  }

  handleAddToCart(productId) {
    const pack = this.selectedPackByProduct[productId] || 
      (PRODUCTS.find(p => p.id === productId)?.packaging[0] || "");
    
    if (window.rfqManager) {
      window.rfqManager.addItem(productId, pack, 1);
    }
  }

  openProductModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !this.productModal) return;

    const isPidilite = product.brand === "pidilite";
    const brandBadgeText = isPidilite ? "Pidilite Industries Division" : "Havells India Division";
    const badgeClass = isPidilite ? "badge-pidilite" : "badge-havells";

    const packagingBadges = product.packaging.map(p => 
      `<span class="pack-badge-pill">${p}</span>`
    ).join("");

    const featuresHtml = product.features.map(f => 
      `<li><span class="feat-check">✓</span> <span>${f}</span></li>`
    ).join("");

    const applicationsHtml = product.applications.map(a => 
      `<li class="app-tag-item"><span class="app-bullet">•</span> <span>${a}</span></li>`
    ).join("");

    const modalBody = document.getElementById("product-modal-content");
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="modal-product-header">
          <div class="modal-brand-row">
            <span class="badge ${badgeClass}">${brandBadgeText}</span>
            <span class="badge badge-subbrand">${product.subBrand}</span>
            <span class="modal-sku-tag">SKU: ${product.sku}</span>
          </div>
          <h2 class="modal-product-title">${product.name}</h2>
          <p class="modal-product-headline">${product.headline}</p>
        </div>

        <div class="modal-product-grid">
          <div class="modal-col-left">
            <h4 class="modal-section-title">Product Description & Technical Profile</h4>
            <p class="modal-product-desc">${product.description}</p>

            <h4 class="modal-section-title">Technical Highlights & Quality Standards</h4>
            <ul class="modal-feature-list">
              ${featuresHtml}
            </ul>

            <h4 class="modal-section-title">Approved Trade Applications</h4>
            <ul class="modal-app-list">
              ${applicationsHtml}
            </ul>
          </div>

          <div class="modal-col-right">
            <div class="modal-order-card">
              <h4 class="order-card-title">Super Stockist Supply Terms</h4>
              
              <div class="modal-meta-row">
                <span class="meta-label">Carton Specification:</span>
                <span class="meta-val">${product.cartonSize}</span>
              </div>
              <div class="modal-meta-row">
                <span class="meta-label">Minimum Order Qty (MOQ):</span>
                <span class="meta-val">${product.moq}</span>
              </div>
              <div class="modal-meta-row">
                <span class="meta-label">Dispatch Readiness:</span>
                <span class="meta-val highlight-green">In Ready Stock (Madurai Hub)</span>
              </div>

              <div class="modal-pack-section">
                <label class="modal-pack-label">Available Packaging Sizes:</label>
                <div class="modal-pack-pills">
                  ${packagingBadges}
                </div>
              </div>

              <div class="modal-action-row">
                <button type="button" 
                        class="btn btn-primary btn-block" 
                        onclick="catalogController.handleAddToCart('${product.id}'); catalogController.closeModal();">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add to RFQ Quote Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    this.productModal.classList.add("active");
    if (this.modalOverlay) this.modalOverlay.classList.add("active");
    document.body.classList.add("modal-open");
  }

  closeModal() {
    if (this.productModal) this.productModal.classList.remove("active");
    if (this.modalOverlay) this.modalOverlay.classList.remove("active");
    document.body.classList.remove("modal-open");
  }

  resetFilters() {
    this.activeBrand = "all";
    this.activeCategory = "all";
    this.searchQuery = "";
    if (this.searchInput) this.searchInput.value = "";
    if (this.searchClearBtn) this.searchClearBtn.style.display = "none";
    this.brandTabs.forEach(b => {
      b.classList.toggle("active", b.dataset.brand === "all");
    });
    this.renderCategoryPills();
    this.renderCatalog();
  }
}

let catalogController;
document.addEventListener("DOMContentLoaded", () => {
  window.catalogController = new CatalogController();
  catalogController = window.catalogController;
});
