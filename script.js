// Selezioniamo gli elementi HTML con cui interagire
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const moodboardGrid = document.getElementById('moodboard-grid');

// Inizializziamo Masonry sulla nostra griglia
// Questo codice crea la "logica a mosaico"
const msnry = new Masonry(moodboardGrid, {
    itemSelector: '.grid-item', // Seleziona tutti gli elementi con questa classe
    columnWidth: '.grid-item', // Usa la larghezza di un elemento come base per le colonne
    percentPosition: true,     // Usa percentuali per il posizionamento, meglio per il responsive
    gutter: 15 // Spazio tra gli elementi
});

// Quando l'utente clicca il nostro pulsante, attiviamo il vero input file (che è nascosto)
uploadButton.addEventListener('click', () => {
    fileInput.click();
});

// Quando l'utente ha selezionato i file, scatta questo evento
fileInput.addEventListener('change', (event) => {
    const files = event.target.files; // La lista dei file selezionati

    // Cicliamo su ogni file scelto
    for (const file of files) {
        // Controlliamo che sia un'immagine
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            // FileReader legge il file e, quando ha finito, scatta l'evento 'onload'
            reader.onload = (e) => {
                // Creiamo gli elementi HTML per la nuova immagine
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');

                const img = document.createElement('img');
                img.src = e.target.result; // Il contenuto dell'immagine letto dal FileReader

                // Aggiungiamo l'immagine al suo contenitore e il contenitore alla griglia
                gridItem.appendChild(img);
                moodboardGrid.appendChild(gridItem);

                // IMPORTANTE: Diciamo a Masonry che abbiamo aggiunto un nuovo elemento
                // in modo che possa ricalcolare il layout.
                msnry.appended(gridItem);
                msnry.layout(); // Ridisegna la griglia
            };

            // Avviamo la lettura del file
            reader.readAsDataURL(file);
        }
    }
});