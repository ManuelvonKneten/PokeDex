// TODO html auslagern !!
// Function max 14 Zeilen 


const cardContainer = document.getElementById("cardContainer");
const dialog = document.getElementById("pokemonDialog");
const dialogContent = document.getElementById("dialogContent");

let pokemonCache = [];


//    INIT
document.addEventListener("DOMContentLoaded", init);

function init() {
    loadPokemons();
}


//    LOAD POKEMONS
async function loadPokemons() {

    try {

        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=20");
        const data = await res.json();

        const promises = data.results.map(p => fetch(p.url).then(r => r.json()));

        const results = await Promise.all(promises);

        pokemonCache = results;

        renderCards(results);

    } catch (err) {

        console.error(err);

        cardContainer.innerHTML = `
            <p class="loading_text">
                Fehler beim Laden der Pokémon
            </p>
        `;
    }
}


//    RENDER CARDS
function renderCards(pokemons) {

    let html = "";

    for (let i = 0; i < pokemons.length; i++) {

        const p = pokemons[i];

        html += `
            <article class="pokemonCard" onclick="openDialog(${i})">

                <div class="cardImage">
                    <img src="${p.sprites.other.home.front_default}" alt="${p.name}">
                </div>

                <div class="cardContent">
                <h2>#${p.id} ${p.name}</h2>
                <p><strong>Height:</strong> ${p.height}</p>
                    <p><strong>Weight:</strong> ${p.weight}</p>
                </div>

            </article>
        `;
    }

    cardContainer.innerHTML = html;
}


//    DIALOG OPEN
function openDialog(index) {

    const p = pokemonCache[index];

    dialogContent.innerHTML = `
        <h2>${p.name}</h2>

        <img src="${p.sprites.other.home.front_default}" style="width:100%; border-radius:10px;" />

        <p><strong>ID:</strong> ${p.id}</p>
        <p><strong>Height:</strong> ${p.height}</p>
        <p><strong>Weight:</strong> ${p.weight}</p>

        <p><strong>Types:</strong> ${
            p.types.map(t => t.type.name).join(", ")
        }</p>
    `;

    dialog.classList.add("open");
}


//    CLOSE DIALOG
dialog.addEventListener("click", (e) => {
    if (e.target.id === "pokemonDialog") {
        dialog.classList.remove("open");
    }
});