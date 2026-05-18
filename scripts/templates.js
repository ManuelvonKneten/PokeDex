function createPokemonCardHTML(p, i, primaryType, typeClasses, typesHtml) {

    return `
        <article class="pokemonCard ${primaryType} ${typeClasses}" onclick="openDialog(${i})">

            <div class="cardImage">
                <img src="${p.sprites.other.home.front_default}" alt="${p.name}">
            </div>

            <div class="cardContent">
                <h2>#${p.id} <br> ${formatName(p.name)}</h2>

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

function createPokemonDialogHTML(p) {
    return `
        <div class="pokemon_dialog">

            <div class="pokemon_header">
                <h2>#${p.id} ${p.name}</h2>
            </div>

            <div class="pokemon_image">
                <img 
                    src="${p.sprites.other.home.front_default}" 
                    alt="${p.name}"
                />
            </div>

            <div class="dialog_menu">
                <button onclick="showTab('stats')">Main Stats</button>
                <button onclick="showTab('evolution')">Evo Chain</button>
                <button onclick="showTab('about')">About</button>
            </div>

            <div class="pokemon_info">

                ${createAboutTabHTML(p)}
                ${createStatsTabHTML(p)}

                <div id="tab_evolution" class="tab_content">
                    <p>Evolution Chain folgt später</p>
                </div>

            </div>

        </div>
    `;
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