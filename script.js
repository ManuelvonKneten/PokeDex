async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    return res.json();
}

async function fetchAll(urls) {
    return Promise.all(urls.map(fetchJson));
}

const cardContainer = document.getElementById("cardContainer");
const dialog = document.getElementById("pokemonDialog");
const dialogContent = document.getElementById("dialogContent");
const pokemonSearch = document.getElementById("pokemonSearch");
const toggleButton = document.getElementById("darkModeButton");
const pokemonRequestCache = new Map();

let pokemonCache = [];
let offset = 0;
const limit = 40;
let isLoading = false;

const basePath = "./icons/types/";

const typeIcons = Object.fromEntries([
    "normal", "fighting", "flying", "poison", "ground",
    "rock", "bug", "ghost", "steel", "fire",
    "water", "grass", "electric", "psychic", "ice",
    "dragon", "dark", "fairy"
].map(type => [type, `${basePath}${type}.svg`]));

function init() {
    applySavedTheme();
    loadPokemons();
}

document.addEventListener("DOMContentLoaded", init);

function buildPokemonUrl(limit, offset) {
    return `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
}

function handleError(err, container) {
    console.error(err);
    container.innerHTML = createErrorHTML("Fehler beim Laden der Pokémon");
}

function simplifyPokemon(p) {
    return {
        id: p.id,
        name: p.name,
        sprites: p.sprites,
        types: p.types,
        stats: p.stats,
        height: p.height,
        weight: p.weight
    };
}

async function fetchSimplifiedPokemons(urls) {
    const data = await fetchAll(urls);
    return data.map(simplifyPokemon);
}

const updateCache = (append, cache, data) => {
    if (!append) return data;
    return cache.concat(data);
};

const fetchPokemonsPage = async () => {
    const { results } = await fetchJson(buildPokemonUrl(limit, offset));
    return fetchSimplifiedPokemons(results.map(p => p.url));
};

async function loadPokemons(append = false) {
    if (isLoading) return;
    isLoading = true;
    showLoader();
    try {
        pokemonCache = updateCache(append, pokemonCache, await fetchPokemonsPage());
        offset += limit;
        renderCards(pokemonCache);
    } catch (err) {
        handleError(err, cardContainer);
    } finally {
        isLoading = false;
        hideLoader();
    }
}

async function getPokemonFromApi(search) {
    const pokemonData = await fetchPokemonByNameCached(search.toLowerCase());
    return buildSimplifiedPokemon(pokemonData);
}

function showToast(message, type = "error") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast_${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("toast_show");
    }, 10);
    setTimeout(() => {
        toast.classList.remove("toast_show");
        toast.addEventListener("transitionend", () => toast.remove());
    }, 2000);
}

function isValidSearch(search) {
    if (!search || search.length < 3) {
        showToast("Please enter at least 3 characters.", "error");
        return false;
    }
    if (!/^[a-zäöüß]+$/i.test(search)) {
        showToast("Only letters are allowed.", "error");
        return false;
    }
    return true;
}

async function searchPokemon() {
    const value = pokemonSearch.value;
    if (typeof value !== "string") return;
    const search = normalizeInput(value);
    if (!isValidSearch(search)) return renderCards(pokemonCache);
    let results = filterCache(search);
    try {
        if (!results.length) {
            const pokemon = await getPokemonFromApi(search);
            if (!existsInCache(pokemon.id)) pokemonCache.push(pokemon);
            results = [pokemon];
        }
        renderCards(results);
    } catch {
        cardContainer.innerHTML = "<p>No Pokémon found.</p>";
    }
}

function loadMorePokemons() {
    loadPokemons(true);
}

document.querySelectorAll(".loadMoreBtn")
    .forEach(button => {
        button.addEventListener("click", loadMorePokemons);
    });

function renderCards(pokemons) {
    let html = "";

    for (let i = 0; i < pokemons.length; i++) {
        const p = pokemons[i];
        const primaryType = p.types[0].type.name;
        const typeClasses = p.types.map(t => t.type.name).join(" ");
        const typesHtml = createTypeIconsHTML(p.types);
        html += createPokemonCardHTML(p);
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

function openDialogById(id) {
    const pokemon = pokemonCache.find(p => p.id === Number(id));
    if (!pokemon) return;
    openDialog(pokemon.id);
}

function openDialog(id) {
    const p = pokemonCache.find(p => p.id === id);
    if (!p) {
        console.warn("Pokemon not in Cache:", id);
        return;
    }
    dialogContent.innerHTML = createPokemonDialogHTML(
        p,
        id,
        pokemonCache.length
    );
    dialog.classList.add("open");
    document.body.style.overflow = "hidden";
}

function navigatePokemon(newIndex) {
    if (newIndex < 0 || newIndex >= pokemonCache.length) return;
    openDialog(newIndex);
}

dialog.addEventListener("click", (e) => {
    if (e.target.id === "pokemonDialog") {
        dialog.classList.remove("open");
        document.body.style.overflow = "";
    }
});

function showTab(tabName) {
    const tabs = document.querySelectorAll(".tab_content");
    tabs.forEach(tab => tab.classList.remove("active"));
    document
        .getElementById(`tab_${tabName}`)
        .classList.add("active");
}

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

async function fetchPokemonByNameCached(name) {
    if (pokemonRequestCache.has(name)) {
        return pokemonRequestCache.get(name);
    }
    const data = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${name}`);
    pokemonRequestCache.set(name, data);
    return data;
}

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

function handleEvoClick(id) {
    openDialogById(id);
}

function toggleDarkMode() {
    document.body.classList.toggle("darkMode");
    const isDark = document.body.classList.contains("darkMode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

if(!localStorage.getItem("theme"))localStorage.setItem("theme","light");

function applySavedTheme() {
    const theme = localStorage.getItem("theme");
    document.body.classList.toggle("darkMode", theme === "dark");
}

function closePokemonDialog() {
    document.getElementById("pokemonDialog")?.classList.remove("open");
    document.body.style.overflow = "";
}

async function loadEvoTab(id) {
    showTab('evolution');
    const container = document.getElementById("tab_evolution");
    container.innerHTML = getLoadingSpinnerTemplate();
    try {
        const evoHtml = await renderEvoChain(id);
        container.innerHTML = evoHtml;
    } catch (error) {
        container.innerHTML = `<p>Error loading evolution chain</p>`;
        console.error(error);
    }
}

function createPokemonCardHTML(p) {
    const typeNames = p.types.map(t => t.type.name);
    return getPokemonCardTemplate(
        p,
        p.stats.find(s => s.stat.name === "hp").base_stat,
        p.stats.find(s => s.stat.name === "attack").base_stat,
        typeNames[0],
        typeNames.slice(1).join(" "),
        createTypeIconsHTML(p.types)
    );
}
