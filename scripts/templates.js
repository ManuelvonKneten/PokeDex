function createPokemonCardHTML(p, i, primaryType, typeClasses, typesHtml) {

    const hp = p.stats.find(s => s.stat.name === "hp").base_stat;
    const attack = p.stats.find(s => s.stat.name === "attack").base_stat;
    const defense = p.stats.find(s => s.stat.name === "defense").base_stat;

    return `
        <article class="pokemonCard ${primaryType} ${typeClasses}" onclick="openDialog(${p.id})">

        <div class="cardImage">
            <span class="pokemonHp hpRibbon">HP ${hp}</span> 
            <span class="pokemonHp attackRibbon">ATTACK ${attack}</span>
            <img src="${p.sprites.other.home.front_default}" alt="${p.name}">
        </div>

            <div class="cardContent">
                <h2>#${p.id} ${formatName(p.name)}</h2>

                <div class="pokemonTypes">
                    ${typesHtml}
                </div>
            </div>

        </article>
    `;
}

function createTypeIconHTML(typeName) {
    return `
        <span class="typeIcon">
            <img src="${typeIcons[typeName]}" alt="${typeName}">
        </span>
    `;
}

function createPokemonDialogHTML(p, index, total) {
    return `
        <div class="pokemon_dialog">

            <div class="pokemon_header">
                <h2>#${p.id} <br> ${p.name}</h2>

                <div class="dialog_nav">

                <button onclick="navigatePokemon(${index - 1})" ${index === 0 ? "disabled" : ""}>Prev</button>
                <button onclick="navigatePokemon(${index + 1})" ${index === total - 1 ? "disabled" : ""}>Next</button>
                <button onclick="closePokemonDialog()">X</button>                

                </div>
            </div>

            <div class="pokemon_image">
                <img src="${p.sprites.other.home.front_default}" alt="${p.name}" />
            </div>

            <div class="dialog_menu">
                <button onclick="showTab('stats')">Main Stats</button>
                <button onclick="loadEvoTab(${p.id})">Evo Chain</button>
                <button onclick="showTab('about')">About</button>
            </div>

            <div class="pokemon_info">
                ${createAboutTabHTML(p)}
                ${createStatsTabHTML(p)}
                <div id="tab_evolution" class="tab_content"></div>
            </div>

        </div>
    `;
}

async function loadEvoTab(id) {
    showTab('evolution');

    const container = document.getElementById("tab_evolution");
    container.innerHTML = `
        <div class="loadingSpinner">
            <img src="./icons/misc/loading_spinner.png" alt="Loading">
        </div>
    `;
    container.innerHTML = await renderEvoChain(id);
}


function createAboutTabHTML(p) {
    return `
        <div id="tab_about" class="tab_content active">

            <div class="info_row">
                <span class="info_label">Height</span>
                <span class="info_value">${p.height}cm</span>
            </div>

            <div class="info_row">
                <span class="info_label">Weight</span>
                <span class="info_value">${p.weight}kg</span>
            </div>

            <div class="info_row">
                <span class="info_label">Types</span>
                <span class="info_value">
                    ${p.types.map(t => t.type.name).join(", ")}
                </span>
            </div>

        </div>
    `;
}

function createStatsTabHTML(p) {
    return `
        <div id="tab_stats" class="tab_content">

            ${p.stats.map(stat => `
                <div class="info_row">
                    <span class="info_label">
                        ${stat.stat.name}
                    </span>

                    <span class="info_value">
                        ${stat.base_stat}
                    </span>
                </div>
            `).join("")}

        </div>
    `;
}

async function renderEvoChain(id) {
    const evo = await getEvoChain(id);

    preloadMissingPokemon(evo.map(e => e.id));

    return `
        <div class="evoLine">
            ${evo.map((e, i) => `
                <div class="evoStep" onclick="handleEvoClick(${e.id})">

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


function createErrorHTML(message) {
    return `
        <p class="loading_text">
            ${message}
        </p>
    `;
}

function createSinglePokemonCardHTML(p, typesHtml, primaryType, typeClasses) {

    return `
        <article class="pokemonCard ${primaryType} ${typeClasses}">

            <div class="cardImage">
                <img src="${p.sprites.other.home.front_default}" alt="${p.name}">
            </div>

            <div class="cardContent">

                <h2>#${p.id} <br> ${formatName(p.name)}</h2>

                <div class="pokemonTypes">
                    ${typesHtml}
                </div>

                <div class="pokemonInfo">

                    <div class="info_row">
                        <span class="info_label">Height</span>
                        <span class="info_value">${p.height}cm</span>
                    </div>

                    <div class="info_row">
                        <span class="info_label">Weight</span>
                        <span class="info_value">${p.weight}kg</span>
                    </div>

                </div>

            </div>

        </article>
    `;
}