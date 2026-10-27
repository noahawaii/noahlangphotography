
(() => {
  "use strict";

  const CSS_URL = "https://cdn.jsdelivr.net/gh/noahawaii/noahlangphotography/styles.css";
  const OPEN_DELAY = 100;
  const CLOSE_DELAY = 100;
  const menus = [];

  const select = (selector, root = document) =>
    root.querySelector(selector);

  const selectAll = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const getByDataHref = (selector, href, root = document) =>
    selectAll(selector, root).filter(
      element => element.getAttribute("data-href") === href
    );

  function loadStylesheet() {
    if (select(`link[rel="stylesheet"][href="${CSS_URL}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_URL;
    document.head.prepend(link);
  }

  function initializeSquarespaceBlocks() {
    if (!window.Y || !window.Squarespace?.initializeLayoutBlocks) {
      return;
    }

    try {
      window.Y.all(".wm-mega-menu-item").each(element => {
        window.Squarespace.initializeLayoutBlocks(window.Y, element);
      });
    } catch (error) {
      console.warn("Mega Menu layout initialization:", error);
    }
  }

  function loadMenuImages() {
    if (!window.ImageLoader?.load) {
      return;
    }

    selectAll(".wm-mega-menu-item img[data-src]").forEach(image => {
      window.ImageLoader.load(image, { load: true });
    });
  }

  function moveImageMasks() {
    const masks = selectAll(
      ".footer-mega-menu [data-image-mask-id]"
    );

    if (!masks.length) {
      return;
    }

    const container = document.createElement("div");

    container.dataset.description =
      "This element is meant for the Mega Menu Plugin to show image masks in the menu";

    container.classList.add(
      "wm-image-mask-container-mega-menu"
    );

    Object.assign(container.style, {
      position: "absolute",
      zIndex: "-1",
      opacity: "0",
      height: "0",
      overflow: "hidden"
    });

    masks.forEach(mask => container.append(mask));
    document.body.append(container);
  }

  function getDismissTriggers() {
    return selectAll([
      ".header-display-desktop .header-nav-wrapper .header-nav-item",
      "#wm-subnav .header-nav-item",
      ".header-actions-action--cta",
      ".sqs-announcement-bar-dropzone",
      "#site-title",
      ".header-display-desktop .header-title-logo",
      ".header-actions .header-actions-action",
      ".header-actions .user-accounts-link"
    ].join(",")).filter(
      element => !element.classList.contains("wm-mega-menu-trigger")
    );
  }

  function updateHeaderPosition(menu) {
    const header = select("#header");

    if (!header) {
      return;
    }

    const rect = header.getBoundingClientRect();

    menu.style.setProperty(
      "--wM-headerBottom",
      `${Math.max(0, rect.bottom)}px`
    );

    menu.style.setProperty(
      "--wM-headerHeight",
      `${rect.height}px`
    );
  }

  function closeMenu(instance) {
    if (instance.openTimer) {
      clearTimeout(instance.openTimer);
      instance.openTimer = null;
    }

    if (instance.closeTimer) {
      clearTimeout(instance.closeTimer);
      instance.closeTimer = null;
    }

    instance.clone.classList.remove("show-mega-menu");
    instance.clone.classList.remove("active-mega");

    instance.triggers.forEach(trigger => {
      trigger.classList.remove("active-mega");
    });

    instance.dismissHandlers.forEach(({ element, enter, leave }) => {
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
    });

    instance.dismissHandlers = [];

    const hasOtherActiveMenus = menus.some(
      menu =>
        menu !== instance &&
        menu.clone.classList.contains("show-mega-menu")
    );

    if (!hasOtherActiveMenus) {
      selectAll(".header-announcement-bar-wrapper", select("#header") || document)
        .forEach(element => {
          element.classList.remove("mega-menu-on");
        });

      document.body.classList.remove("wm-active-mega-menu");
    }
  }

  function closeAllMenus() {
    menus.forEach(closeMenu);
  }

  function attachDismissHandlers(instance) {
    getDismissTriggers().forEach(element => {
      const enter = () => {
        clearTimeout(instance.closeTimer);

        instance.closeTimer = setTimeout(() => {
          closeMenu(instance);
        }, CLOSE_DELAY);
      };

      const leave = () => {
        clearTimeout(instance.closeTimer);
        instance.closeTimer = null;
      };

      element.addEventListener("mouseenter", enter);
      element.addEventListener("mouseleave", leave);

      instance.dismissHandlers.push({
        element,
        enter,
        leave
      });
    });
  }

  function openMenu(instance, trigger) {
    closeAllMenus();
    updateHeaderPosition(instance.clone);

    instance.clone.classList.add("show-mega-menu");
    trigger.classList.add("active-mega");

    selectAll(".header-announcement-bar-wrapper", select("#header") || document)
      .forEach(element => {
        element.classList.add("mega-menu-on");
      });

    document.body.classList.add("wm-active-mega-menu");

    attachDismissHandlers(instance);
  }

  function scheduleOpen(instance, trigger) {
    clearTimeout(instance.openTimer);

    if (trigger.classList.contains("active-mega")) {
      return;
    }

    instance.openTimer = setTimeout(() => {
      openMenu(instance, trigger);
      instance.openTimer = null;
    }, OPEN_DELAY);
  }

  function attachTrigger(instance, trigger) {
    trigger.classList.add("wm-mega-menu-trigger");

    if (instance.clickThrough !== null) {
      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        window.location.href = instance.clickThrough;
      });

      return;
    }

    selectAll("a", trigger).forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
      });
    });

    if (instance.action === "click") {
      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const isActive = trigger.classList.contains("active-mega");

        if (isActive) {
          closeMenu(instance);
        } else {
          openMenu(instance, trigger);
        }
      });

      return;
    }

    trigger.addEventListener("mouseover", event => {
      event.preventDefault();
      event.stopPropagation();

      scheduleOpen(instance, trigger);
    });

    trigger.addEventListener("mouseleave", () => {
      clearTimeout(instance.openTimer);
      instance.openTimer = null;
    });
  }

  function createMobileSection(instance) {
    if (instance.mobileType !== "section") {
      return;
    }

    const folder = selectAll(
      ".header-menu-nav-folder[data-folder]"
    ).find(
      element =>
        element.getAttribute("data-folder") === instance.linkUrl
    );

    const content = folder
      ? select(".header-menu-nav-folder-content", folder)
      : null;

    if (!content) {
      return;
    }

    const mobileClone = instance.source.cloneNode(true);

    content.append(mobileClone);
    content.classList.add("has-mega-section");
  }

  function createMegaMenu(element) {
    const linkUrl = element.getAttribute("data-mega-menu");
    const source = element.closest("#footer-sections .page-section");

    if (!linkUrl || !source) {
      return;
    }

    const desktopTriggers = getByDataHref(
      "#header .header-nav-item button[data-href]",
      linkUrl
    ).map(
      button => button.closest(".header-nav-item")
    ).filter(Boolean);

    const mobileTriggers = getByDataHref(
      "#header .header-display-mobile .header-nav [data-href]",
      linkUrl
    ).map(
      trigger => trigger.closest(".header-nav-item")
    ).filter(Boolean);

    const triggers = [
      ...new Set([...desktopTriggers, ...mobileTriggers])
    ];

    const action = element.getAttribute("data-action") || "hover";
    const animation = element.getAttribute("data-animation") || "fade";
    const clickThrough = element.hasAttribute("data-clickthrough")
      ? element.getAttribute("data-clickthrough")
      : null;

    const instance = {
      linkUrl,
      source,
      clone: source.cloneNode(true),
      triggers,
      action: action === "click" ? "click" : "hover",
      animation,
      clickThrough,
      showClose: element.getAttribute("data-show-close") === "true",
      mobileType: element.getAttribute("data-mobile-type") === "section"
        ? "section"
        : "folder",
      openTimer: null,
      closeTimer: null,
      dismissHandlers: []
    };

    instance.clone.classList.add(
      "wm-mega-menu-item",
      `mega-animation-${instance.animation}`
    );

    if (instance.showClose) {
      instance.clone.classList.add("show-close-button");
    }

    instance.clone.style.display = "none";

    selectAll("[data-mega-menu]", instance.clone).forEach(item => {
      const block = item.closest(".sqs-block");

      if (block) {
        block.classList.add("remove-height");
      }
    });

    const closeButton = document.createElement("button");

    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close");
    closeButton.classList.add("mega-close-btn");

    closeButton.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(instance);
    });

    instance.clone.append(closeButton);

    source.classList.add("footer-mega-menu");

    const siteWrapper = select("#siteWrapper");

    if (!siteWrapper) {
      return;
    }

    siteWrapper.append(instance.clone);
    menus.push(instance);

    instance.clone.addEventListener("mouseleave", event => {
      event.stopPropagation();
      closeMenu(instance);
    });

    triggers.forEach(trigger => {
      attachTrigger(instance, trigger);
    });

    getByDataHref(
      '[data-folder="root"].header-menu-nav-folder button[data-href]',
      linkUrl
    ).forEach(button => {
      const item = button.closest(".header-menu-nav-item");

      if (item) {
        item.classList.add("mobile-mega-trigger");
      }
    });

    createMobileSection(instance);

    if (clickThrough) {
      const currentPath = window.location.pathname;

      if (currentPath === clickThrough) {
        desktopTriggers.forEach(trigger => {
          trigger.classList.add("header-nav-item--active");
        });
      }
    }
  }

  function initializeEditorObserver() {
    if (window.self === window.top) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (!document.body.classList.contains("sqs-edit-mode-active")) {
        return;
      }

      selectAll(".wm-mega-menu-item").forEach(element => {
        element.remove();
      });

      selectAll("#header .footer-mega-menu").forEach(element => {
        element.remove();
      });

      observer.disconnect();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  function initializeGlobalEvents() {
    const close = () => closeAllMenus();
    const header = select("#header");

    const page = select("#page");

    if (page) {
      page.addEventListener("scroll", close, { passive: true });
    }

    window.addEventListener("resize", close);

    if (document.body.classList.contains("tweak-fixed-header")) {
      if (header) {
        header.addEventListener("transitionend", () => {
          menus.forEach(instance => {
            updateHeaderPosition(instance.clone);
          });
        });
      }

      if (document.body.classList.contains(
        "tweak-fixed-header-style-scroll-back"
      )) {
        document.addEventListener("scroll", close, { passive: true });
      }
    }
  }

  function initializeMegaMenus() {
    const elements = selectAll("[data-mega-menu]").filter(
      element => element.closest("#footer-sections .page-section")
    );

    if (!elements.length) {
      return;
    }

    loadStylesheet();

    elements.forEach(createMegaMenu);

    if (!menus.length) {
      return;
    }

    document.body.classList.add("tweak-wm-mega-menu");

    initializeGlobalEvents();
    initializeEditorObserver();

    initializeSquarespaceBlocks();
    loadMenuImages();

    window.addEventListener("load", () => {
      initializeSquarespaceBlocks();
      loadMenuImages();
      moveImageMasks();
    }, { once: true });

    if (document.readyState === "complete") {
      moveImageMasks();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeMegaMenus,
      { once: true }
    );
  } else {
    initializeMegaMenus();
  }
})();
