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
const limit = 40;
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

async function getEvoChain(id) {
    const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    const evoData = await fetchJson(species.evolution_chain.url);

    const chain = [];
    let node = evoData.chain;

    while (node) {
        const urlParts = node.species.url.split("/").filter(Boolean);
        const pokeId = Number(urlParts[urlParts.length - 1]);

        chain.push({
            id: pokeId,
            name: node.species.name
        });

        node = node.evolves_to[0];
    }

    return chain;
}

let currentRenderedList = [];

function openDialogById(id) {
    const pokemon = pokemonCache.find(p => p.id === Number(id));

    if (!pokemon) return;

    openDialog(pokemon.id);
}

async function preloadMissingPokemon(ids) {
    const uniqueIds = [...new Set(ids.map(Number))];

    for (const id of uniqueIds) {
        if (pokemonCache.some(p => p.id === id)) continue;

        try {
            const data = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
            pokemonCache.push(data);
        } catch (e) {}
    }
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

function openDialog(id) {
    const p = pokemonCache.find(p => p.id === id);

    if (!p) {
        console.warn("Pokemon nicht im Cache:", id);
        return;
    }

    dialogContent.innerHTML = createPokemonDialogHTML(
        p,
        id,
        pokemonCache.length
    );

    dialog.classList.add("open");
}



async function handleEvoClick(id) {
    let pokemon = pokemonCache.find(p => p.id === Number(id));

    if (!pokemon) {
        pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
        pokemonCache.push(pokemon);
    }

    openDialogById(pokemon.id);
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

const pokemonSearch = document.getElementById("pokemonSearch");

pokemonSearch.addEventListener("input", searchPokemon);
async function searchPokemon(event) {
    const value = event?.target?.value;

    if (typeof value !== "string") return;

    let search = value.toLowerCase().trim();

    let results = pokemonCache.filter(p =>
        p.name.includes(search)
    );

    if (results.length === 0) {
        try {
            let pokemon = await fetchJson(
                `https://pokeapi.co/api/v2/pokemon/${search}`
            );

            const exists = pokemonCache.some(p => p.id === pokemon.id);

            if (!exists) {
                pokemonCache.push(pokemon);
            }

            results = [{
                ...pokemon,
                isSearch: true
            }];

        } catch (err) {
            cardContainer.innerHTML = `<p>Kein Pokémon gefunden</p>`;
            return;
        }
    }

    renderCards(results);
}