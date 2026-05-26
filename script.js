// =======================
// API HELPERS
// =======================

async function fetchJson(url) {
    return fetch(url).then(r => r.json());
}

async function fetchAll(urls) {
    return Promise.all(urls.map(fetchJson));
}


// =======================
// DOM ELEMENTS
// =======================

const cardContainer = document.getElementById("cardContainer");
const dialog = document.getElementById("pokemonDialog");
const dialogContent = document.getElementById("dialogContent");
const pokemonSearch = document.getElementById("pokemonSearch");
const toggleButton = document.getElementById("darkModeButton");



// =======================
// STATE
// =======================

let pokemonCache = [];
let currentRenderedList = [];

let offset = 0;
const limit = 40;
let isLoading = false;


// =======================
// CONSTANTS
// =======================

const basePath = "./icons/types/";

const typeIcons = Object.fromEntries([
    "normal", "fighting", "flying", "poison", "ground",
    "rock", "bug", "ghost", "steel", "fire",
    "water", "grass", "electric", "psychic", "ice",
    "dragon", "dark", "fairy"
].map(type => [type, `${basePath}${type}.svg`]));


// =======================
// INIT
// =======================

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadPokemons();
}


// =======================
// POKEMON LOADING
// =======================

function buildPokemonUrl(limit, offset) {
    return `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
}

function mergeCache(append, cache, newData) {
    return append ? [...cache, ...newData] : newData;
}

function handleError(err, container) {
    console.error(err);
    container.innerHTML = createErrorHTML("Fehler beim Laden der Pokémon");
}

async function loadPokemons(append = false) {
    if (isLoading) return;

    isLoading = true;
    showLoader();

    try {
        const { results } = await fetchJson(buildPokemonUrl(limit, offset));

        const urls = results.map(p => p.url);
        const newPokemons = await fetchAll(urls);

        pokemonCache = append
            ? pokemonCache.concat(newPokemons)
            : newPokemons;

        offset += limit;

        renderCards(pokemonCache);

    } catch (err) {
        handleError(err, cardContainer);
    } finally {
        isLoading = false;
        hideLoader();
    }
}

function loadMorePokemons() {
    loadPokemons(true);
}

document.querySelectorAll(".loadMoreBtn")
    .forEach(button => {
        button.addEventListener("click", loadMorePokemons);
    });

// =======================
// RENDERING
// =======================

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


// =======================
// POKEMON DETAILS / EVOLUTION
// =======================

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


// =======================
// DIALOG
// =======================

function openDialogById(id) {
    const pokemon = pokemonCache.find(p => p.id === Number(id));

    if (!pokemon) return;

    openDialog(pokemon.id);
}

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

function navigatePokemon(newIndex) {
    if (newIndex < 0 || newIndex >= pokemonCache.length) return;

    openDialog(newIndex);
}

dialog.addEventListener("click", (e) => {
    if (e.target.id === "pokemonDialog") {
        dialog.classList.remove("open");
    }
});

function showTab(tabName) {
    const tabs = document.querySelectorAll(".tab_content");

    tabs.forEach(tab => tab.classList.remove("active"));

    document
        .getElementById(`tab_${tabName}`)
        .classList.add("active");
}


// =======================
// SEARCH
// =======================

function normalizeInput(value) {
    return value.toLowerCase().trim();
}

function filterCache(search) {
    return pokemonCache.filter(p =>
        p.name.toLowerCase().includes(search)
    );
}

function existsInCache(id) {
    return pokemonCache.some(p => p.id === id);
}

async function fetchPokemonByName(name) {
    return fetchJson(`https://pokeapi.co/api/v2/pokemon/${name}`);
}

function buildSearchResult(pokemon) {
    return [{ ...pokemon, isSearch: true }];
}


// =======================
// MAIN SEARCH
// =======================

async function searchPokemon() {
    const value = pokemonSearch.value;
    if (typeof value !== "string") return;
    const search = normalizeInput(value);
    let results = filterCache(search);
    if (!results.length) {
        try {
            const p = await fetchPokemonByName(search);
            if (!existsInCache(p.id)) pokemonCache.push(p);
            results = [{ ...p, isSearch: true }];
        } catch {
            cardContainer.innerHTML = `<p>Kein Pokémon gefunden</p>`;
            return;
        }
    }
    renderCards(results);
}


// =======================
// UI HELPERS
// =======================

function showLoader() {
    document.getElementById("loadingSpinner").classList.remove("hidden");
}

function hideLoader() {
    document.getElementById("loadingSpinner").classList.add("hidden");
}

function createTypeIconsHTML(types) {
    return types
        .map(t => createTypeIconHTML(t.type.name))
        .join("");
}

function formatName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}


// =======================
// EVENTS
// =======================



function handleEvoClick(id) {
    openDialogById(id);
}

function toggleDarkMode() {
    document.body.classList.toggle("darkMode");

    const isDark = document.body.classList.contains("darkMode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

function init() {
    applySavedTheme();
    loadPokemons();
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("darkMode");
    } else {
        document.body.classList.remove("darkMode");
    }
}

if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", "light");
}

document.addEventListener("DOMContentLoaded", () => {

    if (!toggleButton) return;

    toggleButton.addEventListener("click", () => {
        document.body.classList.toggle("darkMode");

        localStorage.setItem(
            "theme",
            document.body.classList.contains("darkMode") ? "dark" : "light"
        );
    });
});
