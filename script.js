// Selezioniamo gli elementi principali
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const addNoteButton = document.getElementById('add-note-button');
const moodboardGrid = document.getElementById('moodboard-grid');
const dropZone = document.getElementById('drop-zone');
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImg = document.getElementById('lightbox-img');

// Inizializziamo Masonry
const msnry = new Masonry(moodboardGrid, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-item',
    percentPosition: true,
    gutter: 15,
    transitionDuration: '0.4s'
});

// --- FUNZIONI HELPER ---
function rgbToHex(rgb) {
    return "#" + rgb.map(val => {
        const hex = val.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join('');
}

// --- FUNZIONI DI CREAZIONE E GESTIONE ---
function addDeleteButton(gridItem) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        msnry.remove(gridItem);
        msnry.layout();
    });
    gridItem.appendChild(deleteBtn);
}

/**
 * Crea un elemento immagine con palette espandibile
 * @param {string} src - La sorgente dell'immagine
 */
function createImageItem(src) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    addDeleteButton(gridItem);

    const img = document.createElement('img');
    img.src = src;
    img.crossOrigin = "Anonymous";
    img.addEventListener('click', () => {
        lightboxImg.src = src;
        lightboxOverlay.classList.remove('hidden');
    });

    img.onload = () => {
        const colorThief = new ColorThief();
        try {
            const paletteRgb = colorThief.getPalette(img, 5);
            const paletteHex = paletteRgb.map(rgbToHex);
            
            // 1. Crea il contenitore principale per la palette
            const paletteContainer = document.createElement('div');
            paletteContainer.classList.add('palette-container');

            // 2. Crea la VISTA COMPATTA (visibile di default)
            const compactView = document.createElement('div');
            compactView.classList.add('palette-swatches-compact');
            paletteHex.forEach(hex => {
                const swatch = document.createElement('div');
                swatch.classList.add('swatch');
                swatch.style.backgroundColor = hex;
                compactView.appendChild(swatch);
            });

            // 3. Crea la VISTA DETTAGLIATA (nascosta di default)
            const detailedView = document.createElement('div');
            detailedView.classList.add('palette-details');
            paletteHex.forEach(hex => {
                const colorInfo = document.createElement('div');
                colorInfo.classList.add('color-info');
                const swatch = document.createElement('div');
                swatch.classList.add('swatch');
                swatch.style.backgroundColor = hex;
                const hexCode = document.createElement('span');
                hexCode.classList.add('hex-code');
                hexCode.textContent = hex.toUpperCase();
                const copyFeedback = document.createElement('span');
                copyFeedback.classList.add('copy-feedback');
                colorInfo.append(swatch, hexCode, copyFeedback);
                colorInfo.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita che il click si propaghi e chiuda la palette
                    navigator.clipboard.writeText(hex).then(() => {
                        copyFeedback.textContent = 'Copiato!';
                        setTimeout(() => { copyFeedback.textContent = ''; }, 2000);
                    });
                });
                detailedView.appendChild(colorInfo);
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.classList.add('download-palette-btn');
            downloadBtn.textContent = 'Scarica Palette (.svg)';
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadPaletteAsSvg(paletteHex);
            });
            detailedView.appendChild(downloadBtn);
            
            // 4. Aggiungi entrambe le viste al contenitore principale
            paletteContainer.appendChild(compactView);
            paletteContainer.appendChild(detailedView);

            // 5. Aggiungi l'evento per ESPANDERE/CHIUDERE
            paletteContainer.addEventListener('click', () => {
                paletteContainer.classList.toggle('is-expanded');
                // FONDAMENTALE: ricalcola il layout di Masonry dopo ogni cambio di altezza
                msnry.layout();
            });

            // 6. Aggiungi l'intera palette al grid-item
            gridItem.appendChild(paletteContainer);

        } catch (e) {
            console.error("Impossibile generare la palette:", e);
        }
        
        msnry.layout();
    };

    gridItem.appendChild(img);
    moodboardGrid.prepend(gridItem);
    msnry.prepended(gridItem);
}

function createNoteItem() {
    const noteItem = document.createElement('div');
    noteItem.classList.add('grid-item', 'note-item');
    addDeleteButton(noteItem);

    const textarea = document.createElement('textarea');
    textarea.placeholder = "Scrivi qui la tua nota...";
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        msnry.layout();
    });

    noteItem.appendChild(textarea);
    moodboardGrid.prepend(noteItem);
    msnry.prepended(noteItem);
    textarea.focus();
}

function downloadPaletteAsSvg(hexColors) {
    const swatchWidth = 100;
    const swatchHeight = 100;
    const svgWidth = swatchWidth * hexColors.length;
    let svgRects = '';
    hexColors.forEach((color, index) => {
        svgRects += `<rect x="${index * swatchWidth}" y="0" width="${swatchWidth}" height="${swatchHeight}" fill="${color}" />`;
    });
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${swatchHeight}">${svgRects}</svg>`;
    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'palette.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleFiles(files) {
    for (const file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => createImageItem(e.target.result);
            reader.readAsDataURL(file);
        }
    }
}

// --- EVENT LISTENERS ---
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));
addNoteButton.addEventListener('click', createNoteItem);
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

lightboxOverlay.addEventListener('click', () => lightboxOverlay.classList.add('hidden'));
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        lightboxOverlay.classList.add('hidden');
    }
});