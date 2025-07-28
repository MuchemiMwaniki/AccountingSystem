document.addEventListener('DOMContentLoaded', function() {
    // Dynamic Year in Footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // You can add more JavaScript functionality here later,
    // like handling form submissions (frontend validation),
    // interactive charts (using a library like Chart.js),
    // or dynamic content loading for different modules.
});
