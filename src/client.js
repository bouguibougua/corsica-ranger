/**
 * Progressive enhancement for the shared Corsica Ranger page shell.
 * Hooks: .site-header; [data-menu-open/close] + #mobile-menu;
 * [data-reveal]; [data-gallery] with [data-filter], a[data-gallery-item],
 * [data-gallery-count] and data-count-template; #lightbox with image,
 * caption, counter, status and prev/next/close data hooks; map load/container;
 * [data-year]. Navigation, languages, FAQ and image links work without JS.
 */

function enhanceHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let scheduled = false;
  const update = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
    scheduled = false;
  };
  update();
  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}

function enhanceReviews() {
  document.querySelectorAll("[data-reviews]").forEach((section) => {
    const track = section.querySelector(".reviews-track");
    const controls = section.querySelector(".reviews-arrows");
    const previous = section.querySelector("[data-review-prev]");
    const next = section.querySelector("[data-review-next]");
    if (!track || !controls || !previous || !next) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const maximum = track.scrollWidth - track.clientWidth;
      controls.hidden = maximum <= 2;
      previous.setAttribute("aria-disabled", String(track.scrollLeft <= 2));
      next.setAttribute(
        "aria-disabled",
        String(track.scrollLeft >= maximum - 2),
      );
    };
    const move = (direction) => {
      if (
        (direction < 0 ? previous : next).getAttribute("aria-disabled") ===
        "true"
      )
        return;
      const card = track.querySelector(".google-review-card");
      const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
      track.scrollBy({
        left:
          direction *
          ((card?.getBoundingClientRect().width || track.clientWidth) + gap),
        behavior: preference.matches ? "instant" : "smooth",
      });
    };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    track.addEventListener("scroll", update, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(update).observe(track);
    else window.addEventListener("resize", update, { passive: true });
    update();
  });
}

function closeOnBackdrop(dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function enhanceMenu() {
  const menu = document.querySelector("#mobile-menu");
  const triggers = [...document.querySelectorAll("[data-menu-open]")];
  if (!menu || typeof menu.showModal !== "function") return;
  let previousFocus = null;

  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", () => {
      if (menu.open) return;
      previousFocus = trigger;
      menu.showModal();
      triggers.forEach((button) =>
        button.setAttribute("aria-expanded", "true"),
      );
    });
  });

  menu.querySelectorAll("[data-menu-close]").forEach((button) => {
    button.addEventListener("click", () => menu.close());
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) menu.close();
  });
  menu.addEventListener("close", () => {
    triggers.forEach((button) => button.setAttribute("aria-expanded", "false"));
    previousFocus?.focus({ preventScroll: true });
  });
  closeOnBackdrop(menu);
}

function enhanceReveals() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!elements.length) return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const show = (element) => {
    element.classList.remove("reveal-pending");
    element.classList.add("is-visible");
  };
  if (preference.matches || !("IntersectionObserver" in window)) {
    elements.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  elements.forEach((element) => {
    const rectangle = element.getBoundingClientRect();
    if (rectangle.top < window.innerHeight && rectangle.bottom > 0) {
      show(element);
    } else {
      element.classList.add("reveal-pending");
      observer.observe(element);
    }
  });

  preference.addEventListener("change", (event) => {
    if (event.matches) {
      observer.disconnect();
      elements.forEach(show);
    }
  });
}

function enhanceGallery() {
  const dialog = document.querySelector("#lightbox");
  const image = dialog?.querySelector("[data-lightbox-image]");
  const caption = dialog?.querySelector("[data-lightbox-caption]");
  const counter = dialog?.querySelector("[data-lightbox-counter]");
  const status = dialog?.querySelector("[data-lightbox-status]");
  const previous = dialog?.querySelector("[data-lightbox-prev]");
  const next = dialog?.querySelector("[data-lightbox-next]");
  const canOpen = dialog && image && typeof dialog.showModal === "function";
  let activeItems = [];
  let activeIndex = 0;
  let activeGallery = null;
  let previousFocus = null;
  let touch = null;

  const visibleItems = (gallery) =>
    [...gallery.querySelectorAll("a[data-gallery-item]")].filter(
      (item) => !item.hidden && !item.classList.contains("hidden"),
    );

  const displayImage = () => {
    const item = activeItems[activeIndex];
    if (!item) return;
    const text = item.dataset.caption || item.querySelector("img")?.alt || "";
    image.src = item.href;
    image.alt = text;
    image.decoding = "async";
    if (caption) caption.textContent = text;
    const position = `${activeIndex + 1} / ${activeItems.length}`;
    if (counter) counter.textContent = position;
    if (status) status.textContent = `${position}${text ? ` — ${text}` : ""}`;
    if (previous) previous.disabled = activeItems.length < 2;
    if (next) next.disabled = activeItems.length < 2;
  };

  const move = (offset) => {
    if (activeItems.length < 2) return;
    activeIndex =
      (activeIndex + offset + activeItems.length) % activeItems.length;
    displayImage();
  };

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const items = [...gallery.querySelectorAll("a[data-gallery-item]")];
    const filters = [...gallery.querySelectorAll("[data-filter]")];
    const count = gallery.querySelector("[data-gallery-count]");
    const updateCount = () => {
      if (count) {
        const template = gallery.dataset.countTemplate || "{n}";
        count.textContent = template.replace(
          "{n}",
          String(visibleItems(gallery).length),
        );
      }
    };
    updateCount();

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.filter;
        filters.forEach((filter) => {
          const selected = filter === button;
          filter.setAttribute("aria-pressed", String(selected));
          filter.classList.toggle("active", selected);
        });
        items.forEach((item) => {
          item.hidden =
            category !== "all" && item.dataset.category !== category;
        });
        updateCount();
        gallery.dispatchEvent(new CustomEvent("corsica:gallery-filter"));
        if (dialog?.open && activeGallery === gallery) {
          const current = activeItems[activeIndex];
          activeItems = visibleItems(gallery);
          if (!activeItems.length) {
            dialog.close();
          } else {
            activeIndex = Math.max(0, activeItems.indexOf(current));
            displayImage();
          }
        }
      });
    });

    if (canOpen) {
      gallery.addEventListener("click", (event) => {
        const item = event.target.closest("a[data-gallery-item]");
        if (
          !item ||
          !gallery.contains(item) ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        activeGallery = gallery;
        activeItems = visibleItems(gallery);
        activeIndex = activeItems.indexOf(item);
        if (activeIndex < 0) return;
        previousFocus = item;
        displayImage();
        if (!dialog.open) dialog.showModal();
      });
    }
  });

  if (!canOpen) return;
  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  dialog.querySelectorAll("[data-lightbox-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dialog.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType !== "touch" || event.target.closest("button,a"))
        return;
      if (touch) {
        touch = null;
        return;
      }
      touch = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
      };
    },
    { passive: true },
  );
  dialog.addEventListener(
    "pointerup",
    (event) => {
      if (!touch || touch.id !== event.pointerId) return;
      const deltaX = event.clientX - touch.x;
      const deltaY = event.clientY - touch.y;
      const elapsed = event.timeStamp - touch.time;
      touch = null;
      if (
        Math.abs(deltaX) > 50 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.3 &&
        elapsed < 1200
      ) {
        move(deltaX < 0 ? 1 : -1);
      }
    },
    { passive: true },
  );
  dialog.addEventListener(
    "pointercancel",
    () => {
      touch = null;
    },
    { passive: true },
  );
  dialog.addEventListener("close", () => {
    touch = null;
    image.removeAttribute("src");
    previousFocus?.focus({ preventScroll: true });
  });
  closeOnBackdrop(dialog);
}

function enhanceMap() {
  document.querySelectorAll("[data-map-load]").forEach((button) => {
    button.addEventListener("click", () => {
      const container = document.querySelector("[data-map-container]");
      if (!container || !button.dataset.mapSrc) return;
      if (!container.querySelector("iframe")) {
        const iframe = document.createElement("iframe");
        iframe.className = "map-frame";
        iframe.src = button.dataset.mapSrc;
        iframe.title = button.dataset.mapTitle || "Corsica Ranger, Bonifacio";
        iframe.loading = "lazy";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        container.append(iframe);
      }
      button.hidden = true;
    });
  });
}

function initialize() {
  document.documentElement.classList.add("js");
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date());
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = year;
  });
  enhanceHeader();
  enhanceMenu();
  enhanceReveals();
  enhanceGallery();
  enhanceReviews();
  enhanceMap();
  document.documentElement.dataset.clientReady = "true";
  document.dispatchEvent(new Event("corsica:client-ready"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
