/**
 * todo
 * use vanilla css and vanilla js
 * bugfixes for edge cases
 * next/prev buttons should add history state
 * show form variants on pokedex page
 */
let pokemonNames;
let pokemonIDs = [];

function sharePokemonLink(name) {
	if (navigator.share) {
		navigator
			.share({
				title: 'Pokedex - ' + name,
				url: window.location.href,
			})
			.then(() => {
				console.log('Share successful');
			})
			.catch(console.error);
	} else {
		console.log('Share not supported');
	}
}

// Used for `pokemon-species` API but not `pokemon` API
function pokemonEdgeCases(str) {
	// TODO: confirm these are all of them
	// TODO: make a function that does the opposite?
	return str
		.replace('deoxys-normal', 'deoxys')
		.replace('wormadam-plant', 'wormadam')
		.replace('wormadam', 'wormadam-plant')
		.replace('giratina-altered', 'giratina')
		.replace('shaymin-land', 'shaymin')
		.replace('basculin-red-striped', 'basculin')
		.replace('darmanitan-standard', 'darmanitan')
		.replace('tornadus-incarnate', 'tornadus')
		.replace('thundurus-incarnate', 'thundurus')
		.replace('landorus-incarnate', 'landorus')
		.replace('keldeo-ordinary', 'keldeo')
		.replace('meloetta-aria', 'meloetta')
		.replace('meowstic-male', 'meowstic')
		.replace('aegislash-shield', 'aegislash')
		.replace('pumpkaboo-average', 'pumpkaboo')
		.replace('gourgeist-average', 'gourgeist')
		.replace('zygarde-50', 'zygarde')
		.replace('oricorio-baile', 'oricorio')
		.replace('lycanroc-midday', 'lycanroc')
		.replace('wishiwashi-solo', 'wishiwashi')
		.replace('minior-red-meteor', 'minior')
		.replace('mimikyu-disguised', 'mimikyu')
		.replace('toxtricity-amped', 'toxtricity')
		.replace('eiscue-ice', 'eiscue')
		.replace('indeedee-male', 'indeedee')
		.replace('morpeko-full-belly', 'morpeko')
		.replace('urshifu-single-strike', 'urshifu')
		.replace('basculegion-male', 'basculegion')
		.replace('enamorus-male', 'enamorus');
}

$(() => {
	const setURLParam = (name) => history.replaceState({}, '', '?q=' + name);

	//get url params
	let url = new URL(window.location.href);
	let q = url.searchParams.get('q');
	console.log('q', q);
	// if (!q) q = 'bulbasaur';
	if (!q) {
		// homescreen
		q = '';
	} else {
		q = formatCode(q);
		setURLParam(q);
	}

	$('#search-form').submit((evt) => {
		setURLParam($('#search-input').val());
		evt.preventDefault();
		// Comment out below line for debugging purposes
		location.reload();
	});

	let numPokemon = 0;
	let currentPokemon = -1;

	fetch('https://pokeapi.co/api/v2/pokemon?limit=9999')
		.then((res) => res.json())
		.then((data) => {
			pokemonNames = data.results.map((mon) => mon.name);
			// url ends in `/123/`
			pokemonIDs = data.results.map(
				(mon) => mon.url.match(/\/(\d+)\/$/)[1]
			);

			// Filter out above 10,000 (which are forms and megas, etc.)
			let filtered = pokemonNames.reduce(
				(result, name, index) => {
					const idNumber = pokemonIDs[index];
					if (idNumber <= 10_000) {
						result.pokemonNames.push(name);
						result.pokemonIDs.push(idNumber);
					}
					return result;
				},
				{ pokemonNames: [], pokemonIDs: [] }
			);

			pokemonNames = filtered.pokemonNames;
			pokemonIDs = filtered.pokemonIDs;

			numPokemon = pokemonNames.length;

			if (q === '') {
				$('#prev-btn').hide();
				$('#next-btn').hide();

				let html = '<div class="row">';
				pokemonIDs.forEach((id, idx) => {
					html += `<button class="col-6 col-md-4 col-lg-3 clickable-text" onclick="searchPokemon('${
						pokemonNames[idx]
					}')">
						<img width="48px" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">
                          
                        #${id.padStart(3, '0')}
                            ${formatDisplay(pokemonNames[idx])}
                        </button>`;
				});
				// https://msikma.github.io/pokesprite/overview/dex-gen8.html
				html += '</div>';
				$('#container').html(html);
			} else {
				let newResult = firstAppearance(q, pokemonNames);
				if (newResult.length != q.length) {
					if (
						q !== '2' &&
						newResult !== 'porygon2' &&
						q !== '5' &&
						newResult !== 'zygarde-50' &&
						q !== '50' &&
						newResult !== 'zygarde-50'
					) {
						// should find #2 ivysaur not porygon2
						searchPokemon(newResult);
					}
				}
			}

			makeTypeAhead();
			$('#search-input').focus();
		});

	if (q === '') {
		$('#prev-btn').hide();
		$('#next-btn').hide();
	}

	function firstAppearance(str, arr) {
		for (item of arr) {
			if (item.toLowerCase().includes(str.toLowerCase())) return item;
		}
		return str;
	}

	$('#prev-btn').on('click', function () {
		if (currentPokemon != -1) {
			const num = currentPokemon == 1 ? numPokemon : currentPokemon - 1;
			$('#search-input').val(num);
			$('#search-form').submit();
		}
	});
	$('#next-btn').on('click', function () {
		if (currentPokemon != -1) {
			const num = currentPokemon == numPokemon ? 1 : currentPokemon + 1;
			$('#search-input').val(num);
			$('#search-form').submit();
		}
	});

	if (q === '') return;

	$('#container').html(`
    <div id="loader" class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>
        <div class="row">
            <div id="img-div" class="col-sm-4 col-6"></div>
            <div id="header-div" class="col-sm-4 col-6"></div>
            <div id="height-weight-div" class="col-sm-4 col-12"></div>
            <div class="col-12">
                <hr>
            </div>
            <div id="flavor-div" class="col-12"></div>
            <div id="stats-div" class="col-sm-12 col-md-4">
                <h3>Stats</h3>
                <div id="hp-div"></div>
                <div id="attack-div"></div>
                <div id="defense-div"></div>
                <div id="special-attack-div"></div>
                <div id="special-defense-div"></div>
                <div id="speed-div"></div>
            </div>
            <div id="info-div-1" class="col-sm-6 col-md-4">
                <h3>Training</h3>
                <div id="ability-div"></div>
            </div>
            <div id="info-div-2" class="col-sm-6 col-md-4">
                <h3>Breeding</h3>
                <div id="egg-group-div"></div>
            </div>
            <div id="evolution-div-container" class="col-12">
                <div id="evolution-0"></div>
                <div id="evolution-1"></div>
                <div id="evolution-2"></div>
            </div>
            <div id="damage-taken-div-container" class="col-12">
                <div class="row">
                    <div id="damage-small" class="col-4"></div>
                    <div id="damage-normal" class="col-4"></div>
                    <div id="damage-large" class="col-4"></div>
                </div>
            </div>
            <div id="moves-div-container" class="col-12">
                <div id="moves-div" class="row"></div>
            </div>
            <div id="links-div" class="col-12">
            </div>
        </div>
    `);

	fetch(
		'https://pokeapi.co/api/v2/pokemon-species/' +
			pokemonEdgeCases(formatCode(q))
	)
		.then((res) => {
			if (res.status == 404)
				$('#loader').html('<h3>Pokemon Not Found</h3>');
			return res.json();
		})
		.then((data) => {
			console.log(data);

			fetch(data.evolution_chain.url)
				.then((res) => res.json())
				.then((data) => {
					console.log(data);

					let evoChain = [];
					let evoData = data.chain;
					do {
						let evoDetails = evoData['evolution_details'][0];

						let tmp = { species_name: evoData.species.name };
						if (evoDetails) {
							for (let key in evoDetails) {
								if (evoDetails[key]) {
									tmp[key] = evoDetails[key];
								}
							}
						}
						evoChain.push(tmp);

						evoData = evoData['evolves_to'][0];
					} while (!!evoData && evoData.hasOwnProperty('evolves_to'));

					$('#evolution-div-container').prepend(
						'<hr><h3>Evolution</h3>'
					);

					for (let idx in evoChain) {
						const evo = evoChain[idx];
						fetch(
							'https://pokeapi.co/api/v2/pokemon/' +
								formatCode(evo.species_name)
						)
							.then((res) => res.json())
							.then((data) => {
								checkLoadCount();
								console.log(data);

								let evoHTML = '';
								for (let key in evo) {
									if (key !== 'species_name') {
										evoHTML += '<p>';
										if (typeof evo[key] !== 'object') {
											evoHTML +=
												formatDisplay(key) +
												': ' +
												formatDisplay(
													evo[key].toString()
												);
										} else {
											evoHTML +=
												formatDisplay(key) +
												': ' +
												formatDisplay(evo[key].name);
										}
										evoHTML += '</p>';
									}
								}

								let typeHTML = '';
								for (let i = 0; i < data.types.length; i++) {
									typeHTML +=
										'<span class="type ' +
										data.types[i].type.name +
										'"></span>';
								}

								$('#evolution-' + idx).append(
									'<div class="row border-bottom">' +
										'<button class="clickable-text col-6 row" tabindex="0" onclick="searchPokemon(\'' +
										data.name +
										'\')">' +
										'<div class="col-sm"> <p>#' +
										data.id.toString().padStart(3, '0') +
										' ' +
										formatDisplay(data.name) +
										'</p><br>' +
										typeHTML +
										'</div><div class="col-sm"><img class="pokemon-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
										data.id +
										'.png"></div>' +
										'</button><div class="col-6">' +
										evoHTML +
										'</div>' +
										'</div>'
								);
							});
					}
				});

			$('#info-div-1').append(
				'Base Happiness: ' +
					data.base_happiness +
					'<small>/255</small><br>'
			);
			$('#info-div-1').append(
				'<hr>Capture Rate: ' +
					data.capture_rate +
					'<small>/255</small><br>'
			);
			$('#info-div-1').append(
				'<hr>Growth Rate: ' +
					formatDisplay(data.growth_rate.name) +
					'<br>'
			);

			// gender is "odds of being female in eighths, -1 for genderless"
			if (data.gender_rate == -1) {
				$('#info-div-2').append('<hr>Gender Ratio: Genderless<br>');
			} else {
				$('#info-div-2').append(
					'<hr>Gender Ratio:<br><div class="gender-bar female" style="width:' +
						data.gender_rate * 12.5 +
						'%"></div><div class="gender-bar male" style="width:' +
						(8 - data.gender_rate) * 12.5 +
						'%"></div><br>'
				);
				$('#info-div-2').append(
					data.gender_rate * 12.5 +
						'% &#9792; ' +
						(8 - data.gender_rate) * 12.5 +
						'% &#9794;'
				);
			}
			$('#info-div-2').append(
				'<hr>Hatch Steps: ' +
					255 * (data.hatch_counter + 1) +
					' <br><small>Hatch Counter: ' +
					data.hatch_counter +
					'</small><br>'
			);

			$('#egg-group-div').append('Egg Groups: <br>');
			for (let i = 0; i < data.egg_groups.length; i++) {
				$('#egg-group-div').append(
					'<button tabindex="0" onclick="openEggGroup(\'' +
						data.egg_groups[i].name +
						"','" +
						data.egg_groups[i].url +
						'\')" class="clickable-text">' +
						formatDisplay(data.egg_groups[i].name) +
						'</button>'
				);
			}

			let idx = 0;
			for (; idx < data.flavor_text_entries.length; idx++) {
				if (data.flavor_text_entries[idx].language.name == 'en') break;
			}
			$('#flavor-div').append(
				data.flavor_text_entries[idx].flavor_text.replace('', ' ') +
					'<br><br>'
			);
		});

	fetch('https://pokeapi.co/api/v2/pokemon/' + formatCode(q))
		.then((res) => res.json())
		.then((data) => {
			checkLoadCount();
			console.log(data);

			document.title = 'Pokedex - ' + formatDisplay(data.name);

			$('#damage-taken-div-container').prepend(
				'<hr><h3>Damage Taken</h3>'
			);
			for (type of TYPES) {
				let dmg = getDamageTaken(type, data.types);
				let typeHTML =
					'<span class="type ' + type + '"></span> x' + dmg + '<br>';
				if (dmg < 1) {
					$('#damage-small').append(typeHTML);
				} else if (dmg == 1) {
					$('#damage-normal').append(typeHTML);
				} else {
					$('#damage-large').append(typeHTML);
				}
			}

			$('#moves-div-container').prepend('<hr><h3>Moves</h3>');
			for (move of data.moves) {
				// console.log(move.version_group_details[0].level_learned_at)
				let moveName = formatDisplay(move.move.name);
				$('#moves-div').append(
					'<button tabindex="0" onclick="openMove(\'' +
						moveName +
						"','" +
						move.move.url +
						'\')" class="clickable-text col-6 col-sm-4 col-md-3 col-lg-2">' +
						moveName +
						'</button>'
				);
			}

			$('#links-div').append(
				`<hr>
                <a href="https://pokemondb.net/pokedex/${data.name}" target="_blank">pokemondb.net</a>`
			);

			$('#img-div').append(
				'<img class="main pokemon-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' +
					data.id +
					'.png">'
			);
			$('#header-div').append(
				'<h3><small>#' +
					data.id.toString().padStart(3, '0') +
					' &mdash; </small> ' +
					formatDisplay(data.name) +
					'</h3>'
			);

			currentPokemon = data.id;

			for (let i = 0; i < data.types.length; i++) {
				$('#header-div').append(
					'<span class="type ' +
						data.types[i].type.name +
						'"></span> '
				);
			}

			$('#header-div').append(
				`<br><br><button class="btn btn-dark rounded-0" onclick="sharePokemonLink('${data.name}')">Share</button>`
			);

			let EVStat = '';
			let EVVal = 0;
			let totalStats = 0;
			for (stat in data.stats) {
				let currentStat = data.stats[stat].base_stat;
				totalStats += currentStat;
				$('#' + data.stats[stat].stat.name + '-div').append(
					'' +
						formatDisplay(data.stats[stat].stat.name) +
						': ' +
						currentStat +
						''
				);
				$('#' + data.stats[stat].stat.name + '-div').append(
					'<div id="stat' +
						stat +
						'" class="stat-bar" style="width:0; background-color:' +
						getStatColor(currentStat) +
						';"></div>'
				);
				if (data.stats[stat].effort != 0) {
					EVStat = formatDisplay(data.stats[stat].stat.name);
					EVVal = data.stats[stat].effort;
				}
				$(`#stat${stat}`).animate({ width: 1.5 * currentStat + 'px' });
			}
			$('#stats-div').append('<br>Sum: ' + totalStats);
			$('#info-div-1').append(
				'<hr>EVs Gained: ' +
					EVVal +
					' ' +
					EVStat +
					'<br><hr class="mobile-only">'
			);

			$('#ability-div').append('Abilities: <br>');
			for (ability in data.abilities) {
				let abilityName = formatDisplay(
					data.abilities[ability].ability.name
				);
				$('#ability-div').append(
					'<button tabindex="0" onclick="openAbility(\'' +
						abilityName +
						"','" +
						data.abilities[ability].ability.url +
						'\')" class="clickable-text">' +
						abilityName +
						(data.abilities[ability].is_hidden ? ' (hidden)' : '') +
						'</button>'
				);
			}
			$('#ability-div').append('<hr>');

			$('#height-weight-div').append(
				'Weight: ' + data.weight / 10 + ' kg<br>'
			);
			$('#height-weight-div').append(
				'Height: ' + data.height / 10 + ' m<br><br>'
			);
		});
});

function openNatures() {
	$('.modal-title').html('Natures');
	$('.modal-body').html(
		`
        <h3>By Stat</h3>
        <table>
        <thead>
        <tr><th> <th class="text-negative">- Attack	<th class="text-negative">- Defense	<th class="text-negative">- Sp. Atk	<th class="text-negative">- Sp. Def	<th class="text-negative">- Speed
        </thead>
        <tbody>
        <tr><th class="text-positive">+ Attack	<td>Hardy <td>Lonely <td>Adamant <td>Naughty <td>Brave
        <tr><th class="text-positive">+ Defense	<td>Bold <td>Docile <td>Impish <td>Lax <td>Relaxed
        <tr><th class="text-positive">+ Sp. Atk	<td>Modest <td>Mild <td>Bashful <td>Rash <td>Quiet
        <tr><th class="text-positive">+ Sp. Def	<td>Calm <td>Gentle <td>Careful <td>Quirky <td>Sassy
        <tr><th class="text-positive">+ Speed <td>Timid <td>Hasty <td>Jolly <td>Naive <td>Serious
        </tbody>
        </table>

        <h3>Alphabetically</h3>
        <table>
        <thead>
        <tr><th>Nature <th>Increases <th>Decreases
        </thead>
        <tbody>
        <tr><td>Adamant	<td class="text-positive">Attack	<td class="text-negative">Sp. Atk
        <tr><td>Bashful	<td class="text-positive">Sp. Atk	<td class="text-negative">Sp. Atk
        <tr><td>Bold <td class="text-positive">Defense	<td class="text-negative">Attack
        <tr><td>Brave <td class="text-positive">Attack	<td class="text-negative">Speed
        <tr><td>Calm <td class="text-positive">Sp. Def	<td class="text-negative">Attack
        <tr><td>Careful	<td class="text-positive">Sp. Def	<td class="text-negative">Sp. Atk
        <tr><td>Docile <td class="text-positive">Defense	<td class="text-negative">Defense
        <tr><td>Gentle <td class="text-positive">Sp. Def	<td class="text-negative">Defense
        <tr><td>Hardy <td class="text-positive">Attack	<td class="text-negative">Attack
        <tr><td>Hasty <td class="text-positive">Speed <td class="text-negative">Defense
        <tr><td>Impish <td class="text-positive">Defense	<td class="text-negative">Sp. Atk
        <tr><td>Jolly <td class="text-positive">Speed <td class="text-negative">Sp. Atk
        <tr><td>Lax <td class="text-positive">Defense	<td class="text-negative">Sp. Def
        <tr><td>Lonely <td class="text-positive">Attack	<td class="text-negative">Defense
        <tr><td>Mild <td class="text-positive">Sp. Atk	<td class="text-negative">Defense
        <tr><td>Modest <td class="text-positive">Sp. Atk	<td class="text-negative">Attack
        <tr><td>Naive <td class="text-positive">Speed <td class="text-negative">Sp. Def
        <tr><td>Naughty	<td class="text-positive">Attack	<td class="text-negative">Sp. Def
        <tr><td>Quiet <td class="text-positive">Sp. Atk	<td class="text-negative">Speed
        <tr><td>Quirky <td class="text-positive">Sp. Def	<td class="text-negative">Sp. Def
        <tr><td>Rash <td class="text-positive">Sp. Atk	<td class="text-negative">Sp. Def
        <tr><td>Relaxed	<td class="text-positive">Defense	<td class="text-negative">Speed
        <tr><td>Sassy <td class="text-positive">Sp. Def	<td class="text-negative">Speed
        <tr><td>Serious	<td class="text-positive">Speed <td class="text-negative">Speed
        <tr><td>Timid <td class="text-positive">Speed <td class="text-negative">Attack
        </tbody>
        </table>

        <h3>Berries</h3>
        <table>
        <tr><td>Attack</td><td>Spicy</td></tr>
        <tr><td>Defense</td><td>Sour</td></tr>
        <tr><td>Speed</td><td>Sweet</td></tr>
        <tr><td>Sp. Attack</td><td>Dry</td></tr>
        <tr><td>Sp. Defense</td><td>Bitter</td></tr>
        </table>

        Info from <a href="https://pokemondb.net/mechanics/natures" target="_blank">pokemondb.net/mechanics/natures</a>`
	);
	$('.modal').modal('show');
}

function openMove(moveName, moveURL) {
	$('.modal-title').html(moveName);
	$('.modal-body').html(
		'<div class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>'
	);
	$('.modal').modal('show');

	fetch(moveURL)
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
			$('.modal-body').html(
				'<span class="type ' +
					data.type.name +
					'"></span>' +
					' &nbsp; <img src="img/move/' +
					data.damage_class.name +
					'.png">' +
					formatDisplay(data.damage_class.name) +
					'<div class="larger-text"><br><b>Power:</b> ' +
					checkNull(data.power) +
					'<br><b>Accuracy:</b> ' +
					checkNull(data.accuracy) +
					(checkNull(data.accuracy) == 'N/A' ? '' : '%') +
					'<br><b>PP:</b> ' +
					data.pp +
					'</div><br><b>Priority:</b> ' +
					data.priority +
					// '<br>Stat Changes: ' + data.stat_changes +
					'<br><b>Target:</b> ' +
					formatDisplay(data.target.name) +
					'<hr><b>Effect:</b> ' +
					data.effect_entries[0].effect
						.split('$effect_chance')
						.join(data.effect_chance)
			);
		});
}

function openAbility(abilityName, abilityURL) {
	$('.modal-title').html(abilityName);
	$('.modal-body').html(
		'<div class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>'
	);
	$('.modal').modal('show');

	fetch(abilityURL)
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
			const enDescription = data.effect_entries.filter(
				(x) => x.language.name === 'en'
			)[0].effect;
			$('.modal-body').html(enDescription);
		});
}

function openEggGroup(eggGroupName, eggGroupURL) {
	$('.modal-title').html(formatDisplay(eggGroupName));
	$('.modal-body').html(
		'<div class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>'
	);
	$('.modal').modal('show');

	fetch(eggGroupURL)
		.then((res) => res.json())
		.then((data) => {
			console.log(data);
			console.log(data.pokemon_species);
			let html = '';
			for (let i = 0; i < data.pokemon_species.length; i++) {
				console.log();
				const name = data.pokemon_species[i].name;
				html +=
					'<button class="clickable-text" onclick="searchPokemon(\'' +
					name +
					'\')">' +
					formatDisplay(name) +
					'</button>';
			}
			$('.modal-body').html(html);
		});
}

const getStatColor = (stat) => {
	const n = Math.floor(Math.min(stat * 1.5, 200));
	return `rgb(${n}, ${n}, ${n})`;
};

function formatDisplay(str) {
	return str
		.replace(/\b\w/g, (match) => match.toUpperCase())
		.replace(/-/g, ' ')
		.replace(/_/g, ' ');
}

function formatCode(str) {
	return str.toLowerCase().replace(/\s+/g, '-');
}

const checkNull = (x) => (x ? x : 'N/A');

let loadCount = 2;
const checkLoadCount = () =>
	--loadCount == 0 ? $('#loader').css('display', 'none') : {};

let TYPES =
	'normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split(
		' '
	);
const TYPE_DATA = [
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 0, 1, 1, 5, 1], // normal
	[1, 5, 5, 1, 2, 2, 1, 1, 1, 1, 1, 2, 5, 1, 5, 1, 2, 1], // fire
	[1, 2, 5, 1, 5, 1, 1, 1, 2, 1, 1, 1, 2, 1, 5, 1, 1, 1], // water
	[1, 1, 2, 5, 5, 1, 1, 1, 0, 2, 1, 1, 1, 1, 5, 1, 1, 1], // electric
	[1, 5, 2, 1, 5, 1, 1, 5, 2, 5, 1, 5, 2, 1, 5, 1, 5, 1], // grass
	[1, 5, 5, 1, 2, 5, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 5, 1], // ice
	[2, 1, 1, 1, 1, 2, 1, 5, 1, 5, 5, 5, 2, 0, 1, 2, 2, 5], // fighting
	[1, 1, 1, 1, 2, 1, 1, 5, 5, 1, 1, 1, 5, 5, 1, 1, 0, 2], // poison
	[1, 2, 1, 2, 5, 1, 1, 2, 1, 0, 1, 5, 2, 1, 1, 1, 2, 1], // ground
	[1, 1, 1, 5, 2, 1, 2, 1, 1, 1, 1, 2, 5, 1, 1, 1, 5, 1], // flying
	[1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 5, 1, 1, 1, 1, 0, 5, 1], // psychic
	[1, 5, 1, 1, 2, 1, 5, 5, 1, 5, 2, 1, 1, 5, 1, 2, 5, 5], // bug
	[1, 2, 1, 1, 1, 2, 5, 1, 5, 2, 1, 2, 1, 1, 1, 1, 5, 1], // rock
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 5, 1, 1], // ghost
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 5, 0], // dragon
	[1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 2, 1, 1, 2, 1, 5, 1, 5], // dark
	[1, 5, 5, 5, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 5, 2], // steel
	[1, 5, 1, 1, 1, 1, 2, 5, 1, 1, 1, 1, 1, 1, 2, 2, 5, 1], // fairy
];
//.type.name
function getDamageTaken(type, types) {
	let val = 1;
	for (let i = 0; i < types.length; i++) {
		let tmp =
			TYPE_DATA[TYPES.indexOf(type)][TYPES.indexOf(types[i].type.name)];
		val *= tmp == 5 ? 0.5 : tmp;
	}
	return val;
}

function makeTypeAhead() {
	//http://twitter.github.io/typeahead.js/examples/
	let substringMatcher = function (strs) {
		return function findMatches(q, cb) {
			let matches, substringRegex;
			(matches = []), (substrRegex = new RegExp(q, 'i'));
			$.each(strs, function (i, str) {
				if (substrRegex.test(str)) matches.push(str);
			});
			cb(matches);
		};
	};

	$('#search-input').typeahead(
		{
			hint: true,
			highlight: true,
			minLength: 2,
		},
		{
			name: 'Pokemon',
			source: substringMatcher(
				pokemonNames.map((mon) => formatDisplay(mon))
			),
		}
	);

	$('.typeahead').bind('typeahead:select', function (ev, suggestion) {
		// search suggestion when selected
		searchPokemon(suggestion);
	});
}

function searchPokemon(name) {
	$('#search-input').val(name);
	$('#search-form').submit();
}
