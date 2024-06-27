document.addEventListener('DOMContentLoaded', function () {
    const popupButton = document.querySelector('.popup-button');
    const overlay = document.getElementById('overlay');
    const closeButton = document.getElementById('close-btn');

    popupButton.addEventListener('click', function () {
        overlay.style.display = 'flex';
    });

    closeButton.addEventListener('click', function () {
        overlay.style.display = 'none';
    });

    // Close the overlay when clicking outside the popup content
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
            overlay.style.display = 'none';
        }
    });
});
