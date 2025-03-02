document.addEventListener("DOMContentLoaded", function () {
    // Smooth Scroll Effect (Only if the target section exists)
    document.querySelectorAll("nav ul li a").forEach(link => {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId.startsWith("#")) { // Ensure it's an internal page link
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 60,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // Fade-in Animation for Sections
    const fadeInElements = document.querySelectorAll(".fade-in");

    function fadeInOnScroll() {
        fadeInElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", fadeInOnScroll);
    fadeInOnScroll(); // Run on load in case elements are in view
});
