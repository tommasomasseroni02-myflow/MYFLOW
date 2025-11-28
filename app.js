// Webapp di base per iniziare a usare Codex/Copilot.
// Da qui potremo costruire tutta la piattaforma per artisti, producer e videomaker.

console.log("Benvenuto nel tuo progetto! 🎧");

// Modello esempio di come potresti strutturare i tuoi utenti (da espandere con Codex)
const artists = [
  {
    id: 1,
    name: "Artista di esempio",
    genres: ["Rap", "Trap"],
    city: "Milano",
    lookingFor: ["Producer", "Videomaker"]
  }
];

console.log("Artisti caricati:", artists);

// Funzione placeholder — Codex potrà ampliarla
function registerArtist(name, genres, city, lookingFor) {
  const newArtist = {
    id: artists.length + 1,
    name,
    genres,
    city,
    lookingFor
  };

  artists.push(newArtist);
  return newArtist;
}

// Esempio di utilizzo
const example = registerArtist("Nuovo Artista", ["Pop"], "Roma", ["Producer"]);
console.log("Nuovo artista registrato:", example);

// Da qui Codex può:
// - creare il backend Express
// - aggiungere API
// - creare database
// - generare frontend HTML/CSS/JS
// - costruire login / profili / ricerca
// - trasformarlo in una webapp completa
