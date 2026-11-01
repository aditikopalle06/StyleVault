
//common.js

document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("mobileMenuButton");
    const sidebar = document.getElementById("mobileSidebar");
    const overlay = document.getElementById("mobileMenuOverlay");

    // Exit safely if a page does not contain the shared navigation.
    if (!menuButton || !sidebar || !overlay) {
        return;
    }

    const menuIcon = menuButton.querySelector(".material-symbols-outlined");

    function openMenu() {
        sidebar.classList.add("mobile-menu-open");
        overlay.classList.add("visible");

        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close navigation menu");

        if (menuIcon) {
            menuIcon.textContent = "close";
        }

        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        sidebar.classList.remove("mobile-menu-open");
        overlay.classList.remove("visible");

        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation menu");

        if (menuIcon) {
            menuIcon.textContent = "menu";
        }

        document.body.style.overflow = "";
    }

    menuButton.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("mobile-menu-open");

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close the drawer when the user taps outside it.
    overlay.addEventListener("click", closeMenu);

    // Close when a navigation link is selected.
    sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        const destination = link.getAttribute("href");

        closeMenu();

        if (destination) {
            window.location.href = destination;
        }
    });
});

    // Escape key closes the drawer.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    // Restore normal page scrolling if the viewport changes to desktop.
    window.addEventListener("resize", () => {
        if (window.innerWidth > 600) {
            closeMenu();
        }
    });
});
