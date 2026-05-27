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
const limit = 20;
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

    if (!isValidSearch(search)) {
        activePokemonList = pokemonCache;
        renderCards(pokemonCache);
        return;
    }

    let results = filterCache(search);

    try {
        if (!results.length) {
            const pokemon = await getPokemonFromApi(search);
            if (!existsInCache(pokemon.id)) pokemonCache.push(pokemon);
            results = [pokemon];
        }

        activePokemonList = results;
        activeIndex = 0;
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
    activePokemonList = pokemons;

    let html = "";

    for (let i = 0; i < pokemons.length; i++) {
        html += createPokemonCardHTML(pokemons[i], i);
    }

    cardContainer.innerHTML = html;
}

const evoCache = new Map();

async function getEvoChain(id) {
    const { evolution_chain } = await fetchJson(
        `https://pokeapi.co/api/v2/pokemon-species/${id}`
    );
    if (evoCache.has(evolution_chain.url)) {
        return evoCache.get(evolution_chain.url);
    }
    const { chain: evoChain } = await fetchJson(evolution_chain.url);
    const chain = [];
    for (let node = evoChain; node; node = node.evolves_to[0]) {
        chain.push({
            id: Number(node.species.url.split("/").filter(Boolean).at(-1)),
            name: node.species.name
        });
    }
    evoCache.set(evolution_chain.url, chain);
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
    if (!pokemonCache.length) return;

    if (newIndex < 0) newIndex = pokemonCache.length - 1;
    if (newIndex >= pokemonCache.length) newIndex = 0;

    const pokemon = pokemonCache[newIndex];
    if (!pokemon) return;

    openDialogByIndex(newIndex);
}

function openDialogByIndex(index) {
    const p = activePokemonList[index];
    if (!p) return;

    activeIndex = index;

    dialogContent.innerHTML = createPokemonDialogHTML(
        p,
        index,
        activePokemonList.length
    );

    dialog.classList.add("open");
    document.body.style.overflow = "hidden";
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
    const index = activePokemonList.findIndex(p => p.id === id);

    if (index === -1) {
        const fallbackIndex = pokemonCache.findIndex(p => p.id === id);
        if (fallbackIndex === -1) return;

        openDialogByIndex(fallbackIndex);
        return;
    }

    openDialogByIndex(index);
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

function createPokemonCardHTML(p, index) {
    const typeNames = p.types.map(t => t.type.name);

    return `
        <div class="pokemon_card" onclick="openDialogByIndex(${index})">
            ${getPokemonCardTemplate(
                p,
                p.stats.find(s => s.stat.name === "hp").base_stat,
                p.stats.find(s => s.stat.name === "attack").base_stat,
                typeNames[0],
                typeNames.slice(1).join(" "),
                createTypeIconsHTML(p.types)
            )}
        </div>
    `;
}

function goHome() {
    pokemonSearch.value = "";
    activePokemonList = pokemonCache;
    renderCards(pokemonCache);
    window.scrollTo({ top: 0, behavior: "smooth" });
}