(function loadDashboardBundles() {
    const scripts = [
        'public_html/js/01-core-data.js',
        'public_html/js/02-business-modules.js',
        'public_html/js/03-settings-forms.js'
    ];

    function appendScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    let chain = Promise.resolve();
    scripts.forEach((src) => {
        chain = chain.then(() => appendScript(src));
    });

    chain.catch((error) => {
        console.error(error);
    });
})();
