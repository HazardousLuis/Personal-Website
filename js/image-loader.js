document.addEventListener("DOMContentLoaded", () => {
    // 1. Hero Loader Logic (Max 500ms)
    // Create the loader element dynamically if not present, or use existing
    const loader = document.getElementById('hero-loader');

    if (loader) {
        // Force hide after 500ms maximum
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            // Remove from DOM to prevent clicks
            setTimeout(() => {
                if (loader.parentNode) loader.parentNode.removeChild(loader);
            }, 500);
        }, 500);
    }

    // 2. Lazy Load Images with Fade-in
    // Select all images that have loading="lazy"
    // We add the .lazy-img class to them for the initial opacity: 0
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Add skeleton/placeholder class immediately if not loaded
                    if (!img.complete) {
                        img.classList.add('img-placeholder');
                    }

                    // Define load handler
                    const handleLoad = () => {
                        img.classList.add('loaded');
                        img.classList.remove('img-placeholder');
                        observer.unobserve(img);
                    };

                    if (img.complete) {
                        handleLoad();
                    } else {
                        img.addEventListener('load', handleLoad);
                        img.addEventListener('error', () => {
                            console.warn('Image failed:', img.src);
                            // Optionally keep placeholder or hide
                            img.classList.remove('img-placeholder');
                            img.classList.add('loaded'); // Show broken image icon at least
                        });
                    }
                }
            });
        });

        lazyImages.forEach((img) => {
            img.classList.add('lazy-img');
            imageObserver.observe(img);
        });
    } else {
        // Fallback for older browsers (though most support IO now)
        lazyImages.forEach((img) => {
            img.classList.add('lazy-img', 'loaded');
        });
    }
});
