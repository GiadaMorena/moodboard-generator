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
    gutter: 20, // Aumentato leggermente per il nuovo design
    transitionDuration: '0.5s'
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
 * Crea un elemento immagine con palette espandibile (FIXED)
 * @param {string} src - La sorgente dell'immagine
 */
function createImageItem(src) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item', 'image-item'); // Aggiungo 'image-item' per distinguerlo
    addDeleteButton(gridItem);

    // **FIX PER LO ZOOM:** L'evento click è ora sul gridItem, non sull'immagine
    gridItem.addEventListener('click', () => {
        lightboxImg.src = src;
        lightboxOverlay.classList.remove('hidden');
    });

    const img = document.createElement('img');
    img.src = src;
    img.crossOrigin = "Anonymous";
    
    // Inseriamo l'immagine prima
    gridItem.appendChild(img);

    img.onload = () => {
        const colorThief = new ColorThief();
        try {
            const paletteRgb = colorThief.getPalette(img, 5);
            const paletteHex = paletteRgb.map(rgbToHex);
            
            const paletteContainer = document.createElement('div');
            paletteContainer.classList.add('palette-container');

            // Vista compatta
            const compactView = document.createElement('div');
            compactView.classList.add('palette-swatches-compact');
            paletteHex.forEach(hex => {
                const swatch = document.createElement('div');
                swatch.classList.add('swatch');
                swatch.style.backgroundColor = hex;
                compactView.appendChild(swatch);
            });

            // Vista dettagliata
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
                    e.stopPropagation();
                    navigator.clipboard.writeText(hex).then(() => {
                        copyFeedback.textContent = 'Copiato!';
                        setTimeout(() => { copyFeedback.textContent = ''; }, 2000);
                    });
                });
                detailedView.appendChild(colorInfo);
            });

            const downloadBtn = document.createElement('button');
            downloadBtn.classList.add('download-palette-btn');
            downloadBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span>Scarica Palette</span>`;
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadPaletteAsSvg(paletteHex);
            });
            detailedView.appendChild(downloadBtn);
            
            paletteContainer.appendChild(compactView);
            paletteContainer.appendChild(detailedView);

            // L'evento per espandere ora è specifico sul contenitore
            paletteContainer.addEventListener('click', (e) => {
                // Se clicchiamo sulla palette, non vogliamo che si attivi lo zoom!
                e.stopPropagation();
                paletteContainer.classList.toggle('is-expanded');
                msnry.layout();
            });
            
            // Aggiungo la palette al grid-item
            gridItem.appendChild(paletteContainer);

        } catch (e) {
            console.error("Impossibile generare la palette:", e);
        }
        
        // Ricalcolo finale dopo aver aggiunto la palette
        msnry.layout();
    };
    
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
    const swatchSize = 100;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${swatchSize * hexColors.length}" height="${swatchSize}">${hexColors.map((color, i) => `<rect x="${i * swatchSize}" y="0" width="${swatchSize}" height="${swatchSize}" fill="${color}" />`).join('')}</svg>`;
    const blob = new Blob([svgContent], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palette.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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