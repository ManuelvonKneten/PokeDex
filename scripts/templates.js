function getPokemonCardTemplate(p, hp, attack, primaryType, typeClasses, typesHtml) {
    return `
        <article class="pokemonCard ${primaryType} ${typeClasses}"
            onclick="openDialog(${p.id})"
            tabindex="0"
            role="button"
            aria-label="Open Pokémon ${formatName(p.name)}"
            onkeydown="if(event.key==='Enter'||event.key===' ') openDialog(${p.id})"
        >
            <div class="cardImage">
                <span class="pokemonHp hpRibbon">HP ${hp}</span>
                <span class="pokemonHp attackRibbon">ATTACK ${attack}</span>

                <img src="${p.sprites.other.home.front_default}"
                    alt="Image of Pokémon ${formatName(p.name)}">
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
            <img src="${typeIcons[typeName]}" alt="${typeName} type icon">
        </span>
    `;
}

function createPokemonDialogHTML(p, index, total) {
    return `
        <div class="pokemon_dialog">

            <div class="pokemon_header">
                <h2 id="dialogTitle">#${p.id} <br> ${p.name}</h2>

                <div class="dialog_nav">

                    <button
                        onclick="navigatePokemon(${index - 1})"
                        ${index === 0 ? "disabled" : ""}
                        aria-label="Previous Pokémon"
                    >
                        Prev
                    </button>

                    <button
                        onclick="navigatePokemon(${index + 1})"
                        ${index === total - 1 ? "disabled" : ""}
                        aria-label="Next Pokémon"
                    >
                        Next
                    </button>

                    <button
                        onclick="closePokemonDialog()"
                        aria-label="Close dialog"
                    >
                        X
                    </button>

                </div>
            </div>

            <div class="pokemon_image">
                <img src="${p.sprites.other.home.front_default}"
                    alt="Image of Pokémon ${p.name}" />
            </div>

            <div class="dialog_menu" role="tablist">

                <button onclick="showTab('stats')" role="tab">
                    Main Stats
                </button>

                <button onclick="loadEvoTab(${p.id})" role="tab">
                    Evo Chain
                </button>

                <button onclick="showTab('about')" role="tab">
                    About
                </button>

            </div>

            <div class="pokemon_info">
                ${createAboutTabHTML(p)}
                ${createStatsTabHTML(p)}
                <div id="tab_evolution" class="tab_content"></div>
            </div>

        </div>
    `;
}

function createPokemonDialogHTML(p, index, total) {
    return `
        <div class="pokemon_dialog">

            <div class="pokemon_header">
                <h2 id="dialogTitle">#${p.id} <br> ${p.name}</h2>

                <div class="dialog_nav">

                    <button
                        onclick="navigatePokemon(${index - 1})"
                        ${index === 0 ? "disabled" : ""}
                        aria-label="Previous Pokémon"
                    >
                        Prev
                    </button>

                    <button
                        onclick="navigatePokemon(${index + 1})"
                        ${index === total - 1 ? "disabled" : ""}
                        aria-label="Next Pokémon"
                    >
                        Next
                    </button>

                    <button
                        onclick="closePokemonDialog()"
                        aria-label="Close dialog"
                    >
                        X
                    </button>

                </div>
            </div>

            <div class="pokemon_image">
                <img src="${p.sprites.other.home.front_default}"
                    alt="Image of Pokémon ${p.name}" />
            </div>

            <div class="dialog_menu" role="tablist">

                <button onclick="showTab('stats')" role="tab">
                    Main Stats
                </button>

                <button onclick="loadEvoTab(${p.id})" role="tab">
                    Evo Chain
                </button>

                <button onclick="showTab('about')" role="tab">
                    About
                </button>

            </div>

            <div class="pokemon_info">
                ${createAboutTabHTML(p)}
                ${createStatsTabHTML(p)}
                <div id="tab_evolution" class="tab_content"></div>
            </div>

        </div>
    `;
}

function createAboutTabHTML(p) {
    return `
        <div id="tab_about" class="tab_content active" role="tabpanel">

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
        <div id="tab_stats" class="tab_content" role="tabpanel">

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
                <div
                    class="evoStep"
                    onclick="handleEvoClick(${e.id})"
                    tabindex="0"
                    role="button"
                    aria-label="Open evolution ${e.name}"
                    onkeydown="if(event.key==='Enter'||event.key===' ') handleEvoClick(${e.id})"
                >

                    <div class="evoCard">

                        <img
                            class="evoImage"
                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.id}.png"
                            alt="Evolution image of ${e.name}"
                        />

                        <div class="evoText">
                            #${e.id} ${formatName(e.name)}
                        </div>

                    </div>
                </div>

                ${i < evo.length - 1 ? `<div class="evoArrow" aria-hidden="true">>></div>` : ""}

            `).join("")}

        </div>
    `;
}

function createErrorHTML(message) {
    return `
        <p class="loading_text" role="alert">
            ${message}
        </p>
    `;
}

function getLoadingSpinnerTemplate() {
    return `
        <div class="loadingSpinner" aria-hidden="true">
            <img src="./icons/misc/loading_spinner.png" alt="Loading">
        </div>
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

function getLoadingSpinnerTemplate() {
    return `
        <div class="loadingSpinner">
            <img src="./icons/misc/loading_spinner.png" alt="Loading">
        </div>
    `;
}

