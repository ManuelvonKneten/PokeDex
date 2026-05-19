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
        const pokeId = Number(urlParts[urlParts.length - 1]); // FIX

        chain.push({
            id: pokeId,
            name: node.species.name
        });

        node = node.evolves_to[0];
    }

    return chain;
}


async function renderEvoChain(id) {
    const evo = await getEvoChain(id);

    // 🔥 Background preload starten
    preloadMissingPokemon(evo.map(e => e.id));

    return `
        <div class="evoLine">
            ${evo.map((e, i) => `
                <div class="evoStep" onclick="handleEvoClick(${pokeId})">

                    <div class="evoCard">
                        <img 
                            class="evoImage"
                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png"
                            alt="${e.name}"
                        />

                        <div class="evoText">
                            #${e.id} ${formatName(e.name)}
                        </div>
                    </div>

                </div>

                ${i < evo.length - 1 ? `<div class="evoArrow">→</div>` : ""}
            `).join("")}
        </div>
    `;
}



async function preloadMissingPokemon(ids) {
    const queue = ids.filter(id =>
        !pokemonCache.some(p => p.id === Number(id))
    );

    for (const id of queue) {
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

function openDialog(index) {
    const p = pokemonCache[index];

    if (!p) {
        console.warn("Pokemon nicht im Cache:", index);
        return;
    }

    dialogContent.innerHTML = createPokemonDialogHTML(
        p,
        index,
        pokemonCache.length
    );

    dialog.classList.add("open");
}



async function handleEvoClick(id) {
    let index = pokemonCache.findIndex(p => p.id === Number(id));

    if (index === -1) {
        const data = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);

        pokemonCache.push(data);

        index = pokemonCache.length - 1;
    }

    openDialog(index);
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

async function searchPokemon(search) {
    search = search.toLowerCase().trim();

    // erst im Cache suchen
    let results = pokemonCache.filter(p =>
        p.name.includes(search)
    );

    // falls nichts gefunden -> API Versuch
    if (results.length === 0) {
        try {
            const pokemon = await fetchJson(
                `https://pokeapi.co/api/v2/pokemon/${search}`
            );

            // nur hinzufügen wenn noch nicht vorhanden
            const exists = pokemonCache.some(p => p.id === pokemon.id);

            if (!exists) {
                pokemonCache.push(pokemon);
            }

            results = [pokemon];

        } catch (err) {
            cardContainer.innerHTML = `
                <p>Kein Pokémon gefunden</p>
            `;
            return;
        }
    }

    renderCards(results);
}

document
    .getElementById("pokemonSearch")
    .addEventListener("input", (e) => {

        const value = e.target.value;

        if (value.length < 1) {
            renderCards(pokemonCache);
            return;
        }

        searchPokemon(value);
    });