/**
 * Kathirava Agency - B2B Quotation Builder & WhatsApp Order Engine
 */

const RFQ_STORAGE_KEY = "kathirava_rfq_cart";

class RFQManager {
  constructor() {
    this.cart = this.loadCart();
    this.initEventListeners();
    this.updateCartBadge();
  }

  loadCart() {
    try {
      const saved = localStorage.getItem(RFQ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading RFQ cart:", e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(this.cart));
      this.updateCartBadge();
      this.renderDrawer();
    } catch (e) {
      console.error("Error saving RFQ cart:", e);
    }
  }

  addItem(productId, packaging, quantity = 1, customNote = "") {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.cart.findIndex(
      item => item.productId === productId && item.packaging === packaging
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += Number(quantity);
      if (customNote) this.cart[existingIndex].notes = customNote;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        subBrand: product.subBrand,
        sku: product.sku,
        packaging: packaging || product.packaging[0],
        cartonSize: product.cartonSize,
        quantity: Number(quantity) || 1,
        notes: customNote
      });
    }

    this.saveCart();
    this.showToast(`Added to RFQ Cart: ${product.name} (${packaging || product.packaging[0]})`);
  }

  removeItem(index) {
    if (index >= 0 && index < this.cart.length) {
      const removed = this.cart.splice(index, 1)[0];
      this.saveCart();
      this.showToast(`Removed from RFQ: ${removed.name}`, "info");
    }
  }

  updateQuantity(index, quantity) {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    if (this.cart[index]) {
      this.cart[index].quantity = qty;
      this.saveCart();
    }
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.showToast("RFQ Cart cleared", "info");
  }

  getTotalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  updateCartBadge() {
    const total = this.cart.length;
    const badges = document.querySelectorAll(".rfq-count-badge");
    badges.forEach(badge => {
      badge.textContent = total;
      badge.style.display = total > 0 ? "inline-flex" : "none";
    });
  }

  formatWhatsAppMessage(formData = {}) {
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    let msg = `*📋 NEW B2B WHOLESALE RFQ - KATHIRAVA AGENCY*\n`;
    msg += `_Generated via Kathirava Super Stockist Portal_\n`;
    msg += `📅 Date: ${timestamp}\n`;
    msg += `--------------------------------------\n`;

    // Retailer Details
    msg += `*🏢 BUYER DETAILS:*\n`;
    msg += `• Shop / Firm: *${formData.businessName || "Registered Retailer"}*\n`;
    msg += `• Contact Person: ${formData.contactPerson || "Proprietor"}\n`;
    msg += `• Phone / Mobile: ${formData.phone || "Not specified"}\n`;
    msg += `• District / Town: *${formData.city || "Madurai Region"}*\n`;
    if (formData.gstNumber) {
      msg += `• GSTIN: ${formData.gstNumber.toUpperCase()}\n`;
    }
    if (formData.businessType) {
      msg += `• Trade Category: ${formData.businessType}\n`;
    }
    msg += `--------------------------------------\n`;

    // Order Items
    msg += `*📦 REQUESTED PRODUCTS (${this.cart.length} SKUs):*\n\n`;

    let pidiliteItems = this.cart.filter(i => i.brand === "pidilite");
    let havellsItems = this.cart.filter(i => i.brand === "havells");

    if (pidiliteItems.length > 0) {
      msg += `🔹 *PIDILITE INDUSTRIES DIVISION:*\n`;
      pidiliteItems.forEach((item, idx) => {
        msg += `${idx + 1}. *${item.name}*\n`;
        msg += `   • Pack: ${item.packaging}\n`;
        msg += `   • Order Quantity: *${item.quantity} Carton(s) / Units*\n`;
        msg += `   • SKU: ${item.sku}\n`;
        if (item.notes) msg += `   • Note: ${item.notes}\n`;
        msg += `\n`;
      });
    }

    if (havellsItems.length > 0) {
      msg += `🔺 *HAVELLS INDIA DIVISION:*\n`;
      havellsItems.forEach((item, idx) => {
        msg += `${idx + 1}. *${item.name}*\n`;
        msg += `   • Pack / Size: ${item.packaging}\n`;
        msg += `   • Order Quantity: *${item.quantity} Master / Units*\n`;
        msg += `   • SKU: ${item.sku}\n`;
        if (item.notes) msg += `   • Note: ${item.notes}\n`;
        msg += `\n`;
      });
    }

    msg += `--------------------------------------\n`;
    msg += `*🚚 DELIVERY & BILLING NOTE:*\n`;
    if (formData.notes) {
      msg += `• Special Instructions: ${formData.notes}\n`;
    }
    msg += `• Desired Delivery: Next Available Route Van\n`;
    msg += `• Requesting: Best Super Stockist Wholesale Rates & Scheme Margins\n\n`;
    msg += `_Sent via Kathirava Agency B2B Portal (S S Colony, Madurai Hub)_`;

    return msg;
  }

  sendToWhatsApp(formData) {
    if (this.cart.length === 0) {
      this.showToast("Your RFQ cart is empty! Please add products first.", "warning");
      return;
    }

    const message = this.formatWhatsAppMessage(formData);
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${KATHIRAVA_CONFIG.whatsappNumber}?text=${encoded}`;

    window.open(waUrl, "_blank");
    this.showToast("Opening WhatsApp with your formatted RFQ...", "success");
  }

  copyToClipboard(formData) {
    if (this.cart.length === 0) {
      this.showToast("Your RFQ cart is empty!", "warning");
      return;
    }
    const message = this.formatWhatsAppMessage(formData);
    navigator.clipboard.writeText(message).then(() => {
      this.showToast("Quotation copied to clipboard! You can paste in email or SMS.", "success");
    }).catch(err => {
      console.error("Clipboard copy failed:", err);
      this.showToast("Failed to copy automatically. Please try WhatsApp button.", "warning");
    });
  }

  renderDrawer() {
    const listContainer = document.getElementById("rfq-items-list");
    const emptyState = document.getElementById("rfq-empty-state");
    const summaryContainer = document.getElementById("rfq-drawer-summary");
    const submitBtn = document.getElementById("rfq-submit-whatsapp-btn");

    if (!listContainer) return;

    if (this.cart.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      listContainer.innerHTML = "";
      if (summaryContainer) summaryContainer.style.display = "none";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    if (summaryContainer) summaryContainer.style.display = "block";
    if (submitBtn) submitBtn.disabled = false;

    let html = "";
    this.cart.forEach((item, index) => {
      const isPidilite = item.brand === "pidilite";
      const brandTagClass = isPidilite ? "tag-pidilite" : "tag-havells";
      const brandLabel = isPidilite ? "Pidilite" : "Havells";

      html += `
        <div class="rfq-item-card" data-index="${index}">
          <div class="rfq-item-header">
            <div class="rfq-item-brand-row">
              <span class="badge ${brandTagClass}">${brandLabel}</span>
              <span class="rfq-item-sku">${item.sku}</span>
            </div>
            <button class="rfq-remove-btn" onclick="rfqManager.removeItem(${index})" title="Remove item" aria-label="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <h4 class="rfq-item-title">${item.name}</h4>
          <div class="rfq-item-meta">
            <span class="rfq-pack-badge">Pack: <strong>${item.packaging}</strong></span>
          </div>
          <div class="rfq-qty-control-row">
            <label class="rfq-qty-label">Order Quantity (Cartons/Cases):</label>
            <div class="qty-stepper">
              <button type="button" class="stepper-btn minus" onclick="rfqManager.updateQuantity(${index}, ${item.quantity - 1})">-</button>
              <input type="number" min="1" max="999" value="${item.quantity}" class="stepper-input" onchange="rfqManager.updateQuantity(${index}, this.value)">
              <button type="button" class="stepper-btn plus" onclick="rfqManager.updateQuantity(${index}, ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    const totalSkuCount = document.getElementById("rfq-total-skus");
    const totalUnitsCount = document.getElementById("rfq-total-units");
    if (totalSkuCount) totalSkuCount.textContent = this.cart.length;
    if (totalUnitsCount) totalUnitsCount.textContent = this.getTotalItems();
  }

  showToast(message, type = "success") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;
    
    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "warning") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-text">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  initEventListeners() {
    // Open Drawer buttons
    document.addEventListener("click", e => {
      if (e.target.closest(".open-rfq-drawer")) {
        e.preventDefault();
        this.openDrawer();
      }
    });

    // Close Drawer
    const closeBtn = document.getElementById("close-rfq-drawer");
    const overlay = document.getElementById("rfq-drawer-overlay");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeDrawer());
    if (overlay) overlay.addEventListener("click", () => this.closeDrawer());

    // Submit via WhatsApp
    const form = document.getElementById("rfq-drawer-form");
    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const formData = {
          businessName: document.getElementById("rfq-buyer-business")?.value || "",
          contactPerson: document.getElementById("rfq-buyer-name")?.value || "",
          phone: document.getElementById("rfq-buyer-phone")?.value || "",
          city: document.getElementById("rfq-buyer-city")?.value || "",
          gstNumber: document.getElementById("rfq-buyer-gst")?.value || "",
          businessType: document.getElementById("rfq-buyer-type")?.value || "",
          notes: document.getElementById("rfq-buyer-notes")?.value || ""
        };

        this.sendToWhatsApp(formData);
      });
    }

    // Copy Quote button
    const copyBtn = document.getElementById("rfq-copy-quote-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const formData = {
          businessName: document.getElementById("rfq-buyer-business")?.value || "",
          contactPerson: document.getElementById("rfq-buyer-name")?.value || "",
          phone: document.getElementById("rfq-buyer-phone")?.value || "",
          city: document.getElementById("rfq-buyer-city")?.value || "",
          gstNumber: document.getElementById("rfq-buyer-gst")?.value || ""
        };
        this.copyToClipboard(formData);
      });
    }
  }

  openDrawer() {
    const drawer = document.getElementById("rfq-drawer");
    const overlay = document.getElementById("rfq-drawer-overlay");
    if (drawer && overlay) {
      this.renderDrawer();
      drawer.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("drawer-open");
    }
  }

  closeDrawer() {
    const drawer = document.getElementById("rfq-drawer");
    const overlay = document.getElementById("rfq-drawer-overlay");
    if (drawer && overlay) {
      drawer.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("drawer-open");
    }
  }
}

// Global instance
let rfqManager;
document.addEventListener("DOMContentLoaded", () => {
  window.rfqManager = new RFQManager();
  rfqManager = window.rfqManager;
});
