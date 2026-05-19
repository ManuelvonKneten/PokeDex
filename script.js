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
let offset = 0;
const limit = 600;
let isLoading = false;

async function loadPokemons(append = false) {

    if (isLoading) return;

    isLoading = true;
    showLoader();

    try {
        const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
        const data = await fetchJson(url);

        const newPokemons = await fetchAll(
            data.results.map(pokemon => pokemon.url)
        );

        pokemonCache = append
            ? [...pokemonCache, ...newPokemons]
            : newPokemons;

        renderCards(pokemonCache);

        offset += limit;

    } catch (err) {

        console.error(err);

        cardContainer.innerHTML = createErrorHTML(
            "Fehler beim Laden der Pokémon"
        );

    } finally {

        isLoading = false;
        hideLoader();
    }
}

function loadMorePokemons() {
    loadPokemons(true);
}

document.getElementById("loadMoreBtn")
    .addEventListener("click", loadMorePokemons);

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

    dialogContent.innerHTML = createPokemonDialogHTML(
        p,
        index,
        pokemonCache.length
    );

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

function showLoader() {
    document.getElementById("loadingSpinner").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loadingSpinner").classList.add("hidden");
}

function navigatePokemon(newIndex) {
    if (newIndex < 0 || newIndex >= pokemonCache.length) return;

    openDialog(newIndex);
}