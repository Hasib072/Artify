// script.js

// Initialize Swiper
let mySwiper;

// Zoom Variables
let currentScale = 1;
const scaleStep = 0.1;
const maxScale = 3;
const minScale = 0.5;

// Define size classes with aspect ratios
const sizeClasses = {
    'A4': { aspectRatio: 210 / 297 }, // ≈0.707
    'A3': { aspectRatio: 297 / 420 }, // ≈0.707
    'ar16x9-vertical': { aspectRatio: 9 / 16 }, // ≈0.5625
    'ar16x9-horizontal': { aspectRatio: 16 / 9 }, // ≈1.778
    'FullHD': { aspectRatio: 1920 / 1080 }, // ≈1.778
    // Add more sizes as needed
};

// Reference to the current canvas
let currentCanvas = null;

document.addEventListener('DOMContentLoaded', () => {

    // Home Page: Create Empty Canvas Button
    const createEmptyCanvasBtn = document.getElementById('createEmptyCanvasBtn');
    if (createEmptyCanvasBtn) {
        createEmptyCanvasBtn.addEventListener('click', () => {
            // Redirect to WorkspacePage.html with a query parameter to reset the header
            window.location.href = 'WorkspacePage.html?newCanvas=true';
        });
    }

    // Workspace Page: Editable Document Name
    const documentNameInput = document.getElementById('documentName');
    if (documentNameInput) {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isNewCanvas = urlParams.get('newCanvas') === 'true';

        if (isNewCanvas) {
            // Reset to default name
            documentNameInput.value = 'Untitled';
            document.title = `Artify - Untitled`;
            // Optionally, clear any saved data related to the previous canvas
            localStorage.removeItem('documentName');
            // If using other localStorage items for canvas data, clear them here
        } else {
            // Load the name from localStorage if available
            const savedName = localStorage.getItem('documentName');
            if (savedName) {
                documentNameInput.value = savedName;
                document.title = `Artify - ${savedName}`;
            }
        }

        documentNameInput.addEventListener('input', () => {
            // Update the document title
            document.title = `Artify - ${documentNameInput.value}`;
            // Save the document name to localStorage
            localStorage.setItem('documentName', documentNameInput.value);
            console.log('Document Name:', documentNameInput.value);
        });
    }

    // Initialize Swiper if on WorkspacePage.html
    if (document.querySelector('.swiper-container')) {
        initializeSwiper();
        // Add a default canvas with 16:9 Vertical orientation
        addNewCanvas('ar16x9-vertical', false); // 'false' to prevent adding to Swiper on initial load
        updateThumbnails();
        // Show the thumbnail bar
        const thumbnailBar = document.getElementById('thumbnailBar');
        thumbnailBar.style.display = 'flex';
    }

    // Modal Elements
    const sizeModal = document.getElementById('sizeModal');
    const closeModalSpan = document.querySelector('.close-modal');
    const sizeButtons = document.querySelectorAll('.size-btn');

    // Event Listeners for Modal
    if (closeModalSpan) {
        closeModalSpan.addEventListener('click', closeSizeModal);
    }

    sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const size = button.getAttribute('data-size');
            addNewCanvas(size);
            closeSizeModal();
        });
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target == sizeModal) {
            closeSizeModal();
        }
    });

    // Thumbnail Bar: Add Canvas Button
    const addCanvasThumbnailBtn = document.getElementById('addCanvasThumbnailBtn');
    if (addCanvasThumbnailBtn) {
        addCanvasThumbnailBtn.addEventListener('click', openSizeModal);
    }

    // Zoom Controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoomCanvas(1);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoomCanvas(-1);
        });
    }

    // Workspace Header Tools
    const addImageBtn = document.getElementById('addImageBtn');
    const addTextBtn = document.getElementById('addTextBtn');

    if (addImageBtn) {
        addImageBtn.addEventListener('click', () => {
            // Trigger a hidden file input for image upload
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        insertImageToCanvas(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            fileInput.click();
        });
    }

    if (addTextBtn) {
        addTextBtn.addEventListener('click', () => {
            const userText = prompt('Enter your text:');
            if (userText) {
                insertTextToCanvas(userText);
            }
        });
    }

});

// Function to initialize Swiper
function initializeSwiper() {
    mySwiper = new Swiper('.swiper-container', {
        // Parameters to show only one slide at a time
        slidesPerView: 1,
        spaceBetween: 50,
        centeredSlides: true,
        // Enable navigation arrows
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // Disable loop
        loop: false,
        // Enable touch interactions
        simulateTouch: true,
        allowTouchMove: true,
        on: {
            slideChange: function () {
                updateActiveThumbnail();
                resetZoom(); // Reset zoom when changing slides
            },
        },
    });
}

// Function to open the size selection modal
function openSizeModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Function to close the size selection modal
function closeSizeModal() {
    const modal = document.getElementById('sizeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to add a new canvas to the workspace with specified size
function addNewCanvas(size, initial = true) {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    const thumbnailBar = document.getElementById('thumbnailBar');
    const thumbnailsContainer = document.getElementById('thumbnails');

    // Define size classes and aspect ratios
    const sizeClasses = {
        'A4': { aspectRatio: 210 / 297 }, // ≈0.707
        'A3': { aspectRatio: 297 / 420 }, // ≈0.707
        'ar16x9-vertical': { aspectRatio: 9 / 16 }, // ≈0.5625
        'ar16x9-horizontal': { aspectRatio: 16 / 9 }, // ≈1.778
        'FullHD': { aspectRatio: 1920 / 1080 }, // ≈1.778
        // Add more sizes as needed
    };

    let canvasSizeClass = size;
    let aspectRatio = sizeClasses[size]?.aspectRatio || sizeClasses['ar16x9-vertical'].aspectRatio; // Default to 16:9 Vertical

    // Get max dimensions from CSS variables
    const maxWidth = window.innerWidth * 0.9; // 90vw
    const maxHeight = window.innerHeight * 0.8; // 80vh

    let canvasWidth = maxWidth;
    let canvasHeight = canvasWidth / aspectRatio;

    // If calculated height exceeds maxHeight, adjust based on height
    if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
    }

    // Optionally, set a minimum width and height
    const minWidth = 300; // in pixels
    const minHeight = 300; // in pixels

    if (canvasWidth < minWidth) {
        canvasWidth = minWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    if (canvasHeight < minHeight) {
        canvasHeight = minHeight;
        canvasWidth = canvasHeight * aspectRatio;
    }

    // Create a new Swiper slide
    const swiperSlide = document.createElement('div');
    swiperSlide.classList.add('swiper-slide');

    // Create the canvas div
    const canvasWrapper = document.createElement('div');
    canvasWrapper.classList.add('individual-canvas', canvasSizeClass);
    canvasWrapper.style.width = `${canvasWidth}px`;
    canvasWrapper.style.height = `${canvasHeight}px`;

    // Append the canvas to the swiper slide
    swiperSlide.appendChild(canvasWrapper);

    // Append the slide to the swiper wrapper
    mySwiper.appendSlide(swiperSlide);

    // Update thumbnails
    updateThumbnails();

    // Show the thumbnail bar
    thumbnailBar.style.display = 'flex';

    // Navigate to the newly added slide
    mySwiper.slideTo(mySwiper.slides.length - 1);
}

// Function to update the thumbnail bar
function updateThumbnails() {
    const thumbnailsContainer = document.getElementById('thumbnails');
    const slides = mySwiper.slides;
    const thumbnailBar = document.getElementById('thumbnailBar');

    // Clear existing thumbnails
    thumbnailsContainer.innerHTML = '';

    // Iterate through each slide to create thumbnails
    slides.forEach((slide, index) => {
        const canvas = slide.querySelector('.individual-canvas');
        if (canvas) {
            const thumbnail = document.createElement('div');
            thumbnail.classList.add('thumbnail');
            if (index === mySwiper.activeIndex) {
                thumbnail.classList.add('active');
            }

            // Create thumbnail content
            const thumbnailContent = document.createElement('div');
            thumbnailContent.classList.add('thumbnail-content');
            thumbnailContent.innerText = getCanvasLabel(canvas.classList);
            thumbnail.appendChild(thumbnailContent);

            // Create a delete button for the thumbnail
            const deleteThumbBtn = document.createElement('button');
            deleteThumbBtn.classList.add('delete-thumb-btn');
            deleteThumbBtn.innerHTML = '&times;';
            deleteThumbBtn.title = 'Delete Canvas';
            deleteThumbBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the slide change
                deleteCanvas(index);
            });
            thumbnail.appendChild(deleteThumbBtn);

            // Add click event to navigate to the respective slide
            thumbnail.addEventListener('click', () => {
                mySwiper.slideTo(index);
            });

            thumbnailsContainer.appendChild(thumbnail);
        }
    });

    // If at least one canvas exists, show the thumbnail bar
    if (slides.length > 0) {
        thumbnailBar.style.display = 'flex';
    } else {
        thumbnailBar.style.display = 'none';
    }
}

// Helper function to get canvas label based on class
function getCanvasLabel(classList) {
    if (classList.contains('A4')) return 'A4';
    if (classList.contains('A3')) return 'A3';
    if (classList.contains('FullHD')) return 'FullHD';
    if (classList.contains('ar16x9-vertical')) return '16:9 Vertical';
    if (classList.contains('ar16x9-horizontal')) return '16:9 Horizontal';
    return '';
}

// Function to delete a canvas by index
function deleteCanvas(index) {
    mySwiper.removeSlide(index);
    updateThumbnails();
    // Hide thumbnail bar if no canvases left
    if (mySwiper.slides.length === 0) {
        const thumbnailBar = document.getElementById('thumbnailBar');
        thumbnailBar.style.display = 'none';
        // Optionally, prompt the user to add a new canvas
        alert('All canvases have been deleted. Please add a new canvas.');
    }
}

// Function to update active thumbnail based on Swiper's active slide
function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        if (index === mySwiper.activeIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Zoom Functionality
function zoomCanvas(direction) {
    // direction: 1 for zoom in, -1 for zoom out
    const slides = mySwiper.slides;
    if (mySwiper.activeIndex >= slides.length) return;
    const activeSlide = slides[mySwiper.activeIndex];
    const canvas = activeSlide.querySelector('.individual-canvas');

    if (!canvas) return;

    // Update current scale
    currentScale += direction * scaleStep;
    currentScale = Math.min(Math.max(currentScale, minScale), maxScale);

    // Apply scale transform
    canvas.style.transform = `scale(${currentScale})`;
}

// Reset Zoom when changing slides
function resetZoom() {
    currentScale = 1;
    const slides = mySwiper.slides;
    if (mySwiper.activeIndex >= slides.length) return;
    const activeSlide = slides[mySwiper.activeIndex];
    const canvas = activeSlide.querySelector('.individual-canvas');

    if (!canvas) return;

    canvas.style.transform = `scale(${currentScale})`;
}

// Function to make elements selectable and draggable within the canvas
function makeElementSelectable(element) {
    element.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();

        selectElement(element);

        const rect = element.getBoundingClientRect();
        const containerRect = element.parentElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        element.style.position = 'absolute';
        element.style.zIndex = 1000;
        element.parentElement.style.position = 'relative';

        function onMouseMove(e) {
            let left = e.clientX - containerRect.left - offsetX;
            let top = e.clientY - containerRect.top - offsetY;

            // Constrain within the container
            left = Math.max(0, Math.min(left, element.parentElement.clientWidth - element.clientWidth));
            top = Math.max(0, Math.min(top, element.parentElement.clientHeight - element.clientHeight));

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        }

        function onMouseUp(e) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // Prevent image drag default behavior
    element.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
}



// Function to select an element
function selectElement(element) {
    // Deselect any previously selected element
    const previousSelected = document.querySelector('.selected-element');
    if (previousSelected && previousSelected !== element) {
        deselectElement(previousSelected);
    }

    // Add the 'selected-element' class to the element
    element.classList.add('selected-element');

    // Create resize handle (if you still want to resize)
    createHandles(element);
}


// Function to deselect an element
function deselectElement(element) {
    element.classList.remove('selected-element');
    const handles = element.querySelectorAll('.move-handle, .resize-handle');
    handles.forEach(handle => handle.remove());
}

// Function to create move and resize handles
function createHandles(element) {
    // Remove existing handles if any
    const existingHandles = element.querySelectorAll('.resize-handle');
    existingHandles.forEach(handle => handle.remove());

    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');
    element.appendChild(resizeHandle);

    // Add resize functionality
    addResizeFunctionality(element, resizeHandle);
}


// Function to add move functionality
function addMoveFunctionality(element, handle) {
    handle.addEventListener('mousedown', (e) => {
        console.log('Move handle mousedown');
        e.stopPropagation();
        e.preventDefault();

        const rect = element.getBoundingClientRect();
        const containerRect = element.parentElement.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        element.style.position = 'absolute';
        element.style.zIndex = 1000;
        element.parentElement.style.position = 'relative';

        function onMouseMove(e) {
            const containerRect = element.parentElement.getBoundingClientRect();
            let left = e.clientX - containerRect.left - offsetX;
            let top = e.clientY - containerRect.top - offsetY;

            // Constrain within the container
            left = Math.max(0, Math.min(left, element.parentElement.clientWidth - element.clientWidth));
            top = Math.max(0, Math.min(top, element.parentElement.clientHeight - element.clientHeight));

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        }

        function onMouseUp(e) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// Function to add resize functionality
function addResizeFunctionality(element, handle) {
    handle.addEventListener('mousedown', (e) => {
        console.log('Resize handle mousedown');
        e.stopPropagation();
        e.preventDefault();

        const rect = element.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;
        const startX = e.clientX;
        const startY = e.clientY;
        const aspectRatio = startWidth / startHeight;

        function onMouseMove(e) {
            const deltaX = e.clientX - startX;
            let newWidth = startWidth + deltaX;
            let newHeight = newWidth / aspectRatio;

            // Constrain within the container
            const containerWidth = element.parentElement.clientWidth;
            const containerHeight = element.parentElement.clientHeight;
            newWidth = Math.max(50, Math.min(newWidth, containerWidth - element.offsetLeft));
            newHeight = Math.max(50, Math.min(newHeight, containerHeight - element.offsetTop));

            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
        }

        function onMouseUp(e) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}


// Function to insert image into the active canvas
function insertImageToCanvas(imageSrc) {
    const slides = mySwiper.slides;
    if (mySwiper.activeIndex >= slides.length) return;
    const activeSlide = slides[mySwiper.activeIndex];
    const canvas = activeSlide.querySelector('.individual-canvas');

    if (canvas) {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = 'Inserted Image';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.borderRadius = '5px';
        img.style.cursor = 'pointer';
        img.style.position = 'absolute'; // Position absolutely within the canvas
        img.style.top = '10px';
        img.style.left = '10px';
        img.style.width = '150px'; // Default width
        img.style.height = 'auto'; // Auto height to maintain aspect ratio

        // Make the image selectable
        makeElementSelectable(img, canvas);

        canvas.appendChild(img);
    }
}

// Function to insert text into the active canvas
function insertTextToCanvas(text) {
    const slides = mySwiper.slides;
    if (mySwiper.activeIndex >= slides.length) return;
    const activeSlide = slides[mySwiper.activeIndex];
    const canvas = activeSlide.querySelector('.individual-canvas');

    if (canvas) {
        const p = document.createElement('p');
        p.textContent = text;
        p.style.fontSize = '20px';
        p.style.color = '#333';
        p.style.cursor = 'pointer';
        p.style.userSelect = 'none';
        p.style.position = 'absolute'; // Position absolutely within the canvas
        p.style.top = '10px';
        p.style.left = '10px';
        p.style.padding = '5px';
        p.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        p.style.borderRadius = '4px';

        // Make the text selectable
        makeElementSelectable(p, canvas);

        canvas.appendChild(p);
    }
}

// Deselect elements when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.individual-canvas')) {
        const selectedElement = document.querySelector('.selected-element');
        if (selectedElement) {
            deselectElement(selectedElement);
        }
    }
});
