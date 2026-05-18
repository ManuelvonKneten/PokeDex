// TODO html auslagern !!
// Function max 14 Zeilen 

async function fetchJson(url) {
    return fetch(url).then(r => r.json());
}

async function fetchAll(urls) {
    return Promise.all(urls.map(fetchJson));
}

const cardContainer = document.getElementById("cardContainer");
const dialog = document.getElementById("pokemonDialog");
const dialogContent = document.getElementById("dialogContent");

let pokemonCache = [];


const basePath = "./icons/types/";

const typeIcons = Object.fromEntries([
    "normal", "fighting", "flying", "poison", "ground",
    "rock", "bug", "ghost", "steel", "fire",
    "water", "grass", "electric", "psychic", "ice",
    "dragon", "dark", "fairy"
].map(type => [type, `${basePath}${type}.svg`]));


//    INIT
document.addEventListener("DOMContentLoaded", init);

function init() {
    loadPokemons();
}


//    LOAD POKEMONS
async function loadPokemons() {
    try {
        const data = await fetchJson("https://pokeapi.co/api/v2/pokemon?limit=150");
        pokemonCache = await fetchAll(data.results.map(p => p.url));
        renderCards(pokemonCache);
    } catch (err) {
        console.error(err);
        cardContainer.innerHTML = createErrorHTML("Fehler beim Laden der Pokémon");
    }
}


//    RENDER CARDS

function renderCards(pokemons) {
    let html = "";

    for (let i = 0; i < pokemons.length; i++) {
        const p = pokemons[i];
        const primaryType = p.types[0].type.name;
        const typeClasses = p.types.map(t => t.type.name).join(" ");
        const typesHtml = createTypeIconsHTML(p.types);

        html += createPokemonCardHTML(p, i, primaryType, typeClasses, typesHtml);
    }
    cardContainer.innerHTML = html;
}



function createTypeIconsHTML(types) {
    return types
        .map(t => createTypeIconHTML(t.type.name))
        .join("");
}


function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}


//    DIALOG OPEN
function openDialog(index) {
    const p = pokemonCache[index];

    dialogContent.innerHTML = createPokemonDialogHTML(p);
    dialog.classList.add("open");
}



function showTab(tabName) {

    const tabs = document.querySelectorAll(".tab_content");

    tabs.forEach(tab => {
        tab.classList.remove("active");
    });

    document
        .getElementById(`tab_${tabName}`)
        .classList.add("active");
}

//    CLOSE DIALOG
dialog.addEventListener("click", (e) => {
    if (e.target.id === "pokemonDialog") {
        dialog.classList.remove("open");
    }
});
