// Selezioniamo gli elementi principali dal DOM
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const addNoteButton = document.getElementById('add-note-button');
const moodboardGrid = document.getElementById('moodboard-grid');
const dropZone = document.getElementById('drop-zone');

// Inizializziamo Masonry sulla nostra griglia
// Si occuperà di disporre gli elementi a mosaico
const msnry = new Masonry(moodboardGrid, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-item',
    percentPosition: true,
    gutter: 15,
    transitionDuration: '0.4s'
});

// --- FUNZIONI PER CREARE GLI ELEMENTI ---

/**
 * Crea un elemento immagine con la sua palette di colori
 * @param {string} src - La sorgente dell'immagine (data URL)
 */
function createImageItem(src) {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');

    const img = document.createElement('img');
    img.src = src;
    
    // Per far funzionare ColorThief correttamente quando l'immagine viene da un'altra origine (non il nostro caso ora, ma buona prassi)
    img.crossOrigin = "Anonymous"; 

    // Aspettiamo che l'immagine sia completamente caricata prima di analizzarla
    img.onload = () => {
        const colorThief = new ColorThief();
        try {
            // Estrai una palette di 5 colori
            const palette = colorThief.getPalette(img, 5);
            
            // Crea il contenitore della palette
            const paletteContainer = document.createElement('div');
            paletteContainer.classList.add('color-palette');

            // Crea i singoli campioni di colore
            palette.forEach(color => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                paletteContainer.appendChild(swatch);
            });

            // Aggiungi la palette sotto l'immagine
            gridItem.appendChild(paletteContainer);
        } catch (e) {
            console.error("Impossibile generare la palette per questa immagine:", e);
        }
        
        // La dimensione dell'item è cambiata, quindi Masonry deve ricalcolare il layout
        msnry.layout();
    };

    gridItem.appendChild(img);
    moodboardGrid.prepend(gridItem); // Usiamo prepend per mostrare i nuovi elementi in cima
    msnry.prepended(gridItem); // Diciamo a Masonry che abbiamo aggiunto un elemento all'inizio
}

/**
 * Crea un elemento nota (post-it)
 */
function createNoteItem() {
    const noteItem = document.createElement('div');
    noteItem.classList.add('grid-item', 'note-item');

    const textarea = document.createElement('textarea');
    textarea.placeholder = "Scrivi qui la tua nota...";

    // Funzione per far sì che la textarea si ridimensioni automaticamente con il testo
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto'; // Resetta l'altezza
        textarea.style.height = (textarea.scrollHeight) + 'px'; // Imposta l'altezza al contenuto
        msnry.layout(); // Ricalcola il layout perché l'altezza è cambiata
    });

    noteItem.appendChild(textarea);
    moodboardGrid.prepend(noteItem);
    msnry.prepended(noteItem);
    textarea.focus(); // Mette il cursore direttamente nella nuova nota
}

// --- GESTIONE DEI FILE ---

/**
 * Gestisce una lista di file (da input o da drag & drop)
 * @param {FileList} files - La lista dei file da processare
 */
function handleFiles(files) {
    for (const file of files) {
        // Processa solo i file che sono immagini
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            // Quando il file è stato letto, il suo contenuto è in e.target.result
            reader.onload = (e) => {
                createImageItem(e.target.result);
            };

            // Inizia la lettura del file come Data URL
            reader.readAsDataURL(file);
        }
    }
}

// --- EVENT LISTENERS ---

// 1. Pulsante "Carica Immagini": apre la finestra di dialogo per scegliere i file
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

// 2. Quando l'utente ha scelto i file dalla finestra di dialogo
fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});

// 3. Pulsante "Aggiungi Nota"
addNoteButton.addEventListener('click', createNoteItem);

// 4. Gestione del Drag & Drop
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault(); // Necessario per permettere il 'drop'
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault(); // Impedisce al browser di aprire il file
    dropZone.classList.remove('drag-over');
    const files = event.dataTransfer.files; // Recupera i file trascinati
    handleFiles(files);
});