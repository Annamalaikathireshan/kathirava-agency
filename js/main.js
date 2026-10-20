/**
 * Kathirava Agency - Main Application Script
 * Navigation, statistics counters, route tabs, and dealer onboarding form
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initNavbar();
  initCounters();
  initDealerForm();
  initRouteSchedule();
  initContactForm();
});

/* ================= Apple Design: Theme Controller (Light/Dark) ================= */
function initTheme() {
  const THEME_STORAGE_KEY = "kathirava_theme";
  const themeToggles = document.querySelectorAll("#theme-toggle, .mobile-theme-toggle");

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "light" ? "#fbfbfd" : "#0a0e17");
    }
  }

  // Initial theme check
  const currentTheme = getPreferredTheme();
  applyTheme(currentTheme);

  // Toggle buttons
  themeToggles.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isCurrentlyLight = document.documentElement.getAttribute("data-theme") === "light";
      const nextTheme = isCurrentlyLight ? "dark" : "light";
      applyTheme(nextTheme);

      // Tactile spring feedback
      btn.style.transform = "scale(0.88)";
      setTimeout(() => { btn.style.transform = ""; }, 150);
    });
  });

  // Listen to OS theme changes if user has not explicitly chosen
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? "light" : "dark");
      }
    });
  }
}

/* ================= Sticky Navbar & Mobile Menu ================= */
function initNavbar() {
  const navbar = document.querySelector(".site-header");
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileNav = document.getElementById("mobile-nav-menu");
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");

  // Sticky header background transition on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // Mobile menu toggle
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.contains("active");
      if (isOpen) {
        mobileNav.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
      } else {
        mobileNav.classList.add("active");
        mobileToggle.setAttribute("aria-expanded", "true");
        mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      }
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("active");
        if (mobileToggle) {
          mobileToggle.setAttribute("aria-expanded", "false");
          mobileToggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        }
      });
    });
  }

  // Smooth scroll with header offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#" || targetId === "") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}

/* ================= Animated Statistics Counter ================= */
function initCounters() {
  const counterEls = document.querySelectorAll(".counter-value");
  if (!counterEls.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const finalVal = parseInt(target.getAttribute("data-count"), 10);
        const prefix = target.getAttribute("data-prefix") || "";
        const suffix = target.getAttribute("data-suffix") || "";
        const duration = 1800; // ms
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentCount = Math.floor(easeProgress * finalVal);

          target.textContent = `${prefix}${currentCount}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            target.textContent = `${prefix}${finalVal}${suffix}`;
          }
        }

        requestAnimationFrame(updateCounter);
        obs.unobserve(target);
      }
    });
  }, { threshold: 0.3 });

  counterEls.forEach(el => observer.observe(el));
}

/* ================= Delivery Route Matrix ================= */
function initRouteSchedule() {
  const container = document.getElementById("routes-schedule-grid");
  if (!container || !ROUTE_SCHEDULE) return;

  let html = "";
  ROUTE_SCHEDULE.forEach((route, idx) => {
    const stopsPills = route.stops.map(stop => 
      `<span class="route-stop-pill">${stop}</span>`
    ).join("");

    html += `
      <div class="route-card" data-route="${idx + 1}">
        <div class="route-card-header">
          <div class="route-badge-pill">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${route.day}</span>
          </div>
          <span class="route-vehicle-tag">${route.vehicle}</span>
        </div>
        <h4 class="route-title">${route.route}</h4>
        
        <div class="route-stops-wrapper">
          <span class="route-stops-label">Scheduled Transit Stops:</span>
          <div class="route-stops-list">
            ${stopsPills}
          </div>
        </div>

        <div class="route-lead-time">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>${route.leadTime}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ================= Dealer Onboarding Form ================= */
function initDealerForm() {
  const form = document.getElementById("dealer-onboarding-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const firmName = document.getElementById("dealer-firm")?.value.trim() || "";
    const contactPerson = document.getElementById("dealer-name")?.value.trim() || "";
    const phone = document.getElementById("dealer-phone")?.value.trim() || "";
    const town = document.getElementById("dealer-town")?.value.trim() || "";
    const gst = document.getElementById("dealer-gst")?.value.trim() || "Applied / Not Yet";
    const shopType = document.getElementById("dealer-type")?.value || "Hardware & Electrical Store";
    const brandsInterested = Array.from(document.querySelectorAll("input[name='dealer-brands']:checked"))
      .map(cb => cb.value)
      .join(", ") || "Pidilite & Havells";
    const estMonthlyReq = document.getElementById("dealer-monthly")?.value || "₹1,00,000 - ₹3,00,000";

    // Format WhatsApp Onboarding Lead
    let msg = `*🤝 NEW DEALER / RETAIL PARTNER ONBOARDING APPLICATION*\n`;
    msg += `_Kathirava Agency Super Stockist Network_\n`;
    msg += `--------------------------------------\n`;
    msg += `• Shop/Firm Name: *${firmName}*\n`;
    msg += `• Contact Person: *${contactPerson}*\n`;
    msg += `• Mobile/WhatsApp: *${phone}*\n`;
    msg += `• Town / District: *${town}*\n`;
    msg += `• GSTIN Number: *${gst}*\n`;
    msg += `• Trade Category: ${shopType}\n`;
    msg += `• Brands Requested: *${brandsInterested}*\n`;
    msg += `• Estimated Monthly Turnover: ${estMonthlyReq}\n`;
    msg += `--------------------------------------\n`;
    msg += `_Requesting wholesale dealership rate sheet, brand display support, and territory dispatch slot._`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${KATHIRAVA_CONFIG.whatsappNumber}?text=${encoded}`;

    if (window.rfqManager) {
      window.rfqManager.showToast("Dealer registration details prepared! Launching WhatsApp...", "success");
    }

    window.open(waUrl, "_blank");
    form.reset();
  });
}

/* ================= General Contact Form ================= */
function initContactForm() {
  const form = document.getElementById("quick-contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("contact-name")?.value.trim() || "";
    const phone = document.getElementById("contact-phone")?.value.trim() || "";
    const message = document.getElementById("contact-message")?.value.trim() || "";

    let msg = `*📩 DIRECT INQUIRY - KATHIRAVA AGENCY*\n`;
    msg += `• From: *${name}*\n`;
    msg += `• Phone: *${phone}*\n`;
    msg += `• Inquiry: ${message}\n`;

    const waUrl = `https://wa.me/${KATHIRAVA_CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");

    if (window.rfqManager) {
      window.rfqManager.showToast("Inquiry submitted via WhatsApp!", "success");
    }
    form.reset();
  });
}
