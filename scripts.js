let pokemonNames;
$( ()=> {

const setURLParam = (name) => history.replaceState({}, '', '?q=' + name);

//get url params
let url = new URL(window.location.href);
let q = url.searchParams.get('q');
if(!q) q='bulbasaur';
q = q.replace(': ', '-'); // just for "Type: Null"
q = q.toLowerCase();
console.log(q);
setURLParam(q);

$('#search-form').submit( (evt)=> {
	setURLParam($('#search-input').val() );
	evt.preventDefault();
	location.reload();
});

let xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
	if(this.readyState == 4 && this.status == 200) {
		pokemonNames = JSON.parse(this.responseText);

		let newResult = firstAppearance(q, pokemonNames);
		if(newResult.length != q.length) {
			searchPokemon(newResult);
		}

		makeTypeAhead();
		$('#search-input').focus();
	}
};
xmlhttp.open('GET', 'https://raw.githubusercontent.com/sindresorhus/pokemon/master/data/en.json', true);
xmlhttp.send();

function firstAppearance(str, arr) {
	for(item of arr) {
		if(item.toLowerCase().includes(str.toLowerCase() ) )
			return item;
	}
	return str;
}

fetch('https://pokeapi.co/api/v2/pokemon-species/' + q)
	.then(res => {
		if(res.status == 404) $('#loader').html('<h3>Pokemon Not Found</h3>');
		return res.json();
	})
	.then(data => {
		console.log(data);

		fetch(data.evolution_chain.url)
			.then(res => res.json() )
			.then(data => {
				console.log(data);
				let speciesNames = [data.chain.species.name];
				for(let i=0; i<data.chain.evolves_to.length; i++) {
					speciesNames.push(data.chain.evolves_to[i].species.name);
					for(let j=0; j<data.chain.evolves_to[i].evolves_to.length; j++) {
						speciesNames.push(data.chain.evolves_to[i].evolves_to[j].species.name);
					}
				}
				console.log(speciesNames);
				$('#evolution-div-container').prepend('<hr>Evolution:<br><br>')
				for(species of speciesNames) {
					fetch('https://pokeapi.co/api/v2/pokemon/' + species)
						.then(res => res.json() )
						.then(data => {
							checkLoadCount();
							console.log(data);
							$('#evolution-div').append(
								'<div class="evolution-pokemon" onclick="searchPokemon(\'' + data.name + '\')">' +
								'#' + data.id + ' ' + capitalize(data.name) +
								'<img class="pokemon-img" src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/' + padThreeZeroes(data.id) + '.png">' +
								'</div>'
							);
						});
				}
				
			});

		$('#info-div-2').append('Base Happiness: ' + data.base_happiness + '<small>/255</small><br>');
		$('#info-div-2').append('<hr>Capture Rate: ' + data.capture_rate + '<small>/255</small><br>');

		// gender is "odds of being female in eighths, -1 for genderless"
		if(data.gender_rate==-1) {
			$('#info-div-2').append('<hr>Gender Ratio: Genderless<br>');
		}
		else {
			$('#info-div-2').append('<hr>Gender Ratio:<br><div class="gender-bar female" style="width:' + data.gender_rate*12.5 + '%"></div><div class="gender-bar male" style="width:' + (8-data.gender_rate)*12.5 + '%"></div><br>');
			$('#info-div-2').append(data.gender_rate*12.5 + '% &#9792; ' + (8-data.gender_rate)*12.5 + '% &#9794;');
		}
		$('#info-div-2').append('<hr>Growth Rate: ' + formatStr(data.growth_rate.name) + '<br>');
		$('#info-div-2').append('<hr>Hatch Steps: ' + 255*(data.hatch_counter+1) + ' <br><small>Hatch Counter: ' + data.hatch_counter + '</small><br>');

		$('#egg-group-div').append('Egg Groups: <ul>');
		for(let i=0; i<data.egg_groups.length; i++) {
			$('#egg-group-div').append('<li>' + capitalize(data.egg_groups[i].name) + '</li>');
		}
		$('#egg-group-div').append('</ul>');

		let idx = 0;
		for(;idx<data.flavor_text_entries.length;idx++) {
			if(data.flavor_text_entries[idx].language.name=='en')
				break;
		}
		$('#flavor-div').append(data.flavor_text_entries[idx].flavor_text + '<br><br>');

	});

fetch('https://pokeapi.co/api/v2/pokemon/' + q)
	.then(res => res.json() )
	.then(data => {
		checkLoadCount();
		console.log(data);

		$('#damage-taken-div-container').prepend('<hr>Damage Taken:<br><br>');
		for(type of TYPES) {
			let dmg = getDamageTaken(type, data.types);
			let typeHTML = '<span class="type ' + type + '"></span> x' + dmg + '<br>';
			if(dmg < 1) {
				$('#damage-small').append(typeHTML);
			}
			else if(dmg == 1) {
				$('#damage-normal').append(typeHTML);
			}
			else {
				$('#damage-large').append(typeHTML);
			}
		}

		$('#moves-div-container').prepend('<hr>Moves:<br><br>');
		for(move of data.moves) {
			let moveName = formatStr(move.move.name);
			$('#moves-div').append('<div onclick="openMove(\'' + moveName + '\',\'' + move.move.url + '\')" class="move col-6 col-sm-4 col-md-3 col-lg-2">' + moveName + '</div>');
		}

		$('#img-div').append('<img class="pokemon-img" src="https://assets.pokemon.com/assets/cms2/img/pokedex/full/' + padThreeZeroes(data.id) + '.png">');
		$('#header-div').append('<h3><small>#' + data.id + ' &mdash; </small> ' + capitalize(data.name) + '</h3>');

		for(let i=0; i<data.types.length; i++) {
			$('#header-div').append('<span class="type ' + data.types[i].type.name + '"></span> ');
		}

		let EVStat = '';
		let EVVal = 0;
		for(stat in data.stats) {
			$('#'+data.stats[stat].stat.name+'-div').append('' + formatStr(data.stats[stat].stat.name) + ': ' + data.stats[stat].base_stat + '');
			$('#'+data.stats[stat].stat.name+'-div').append('<div class="stat-bar" style="width:' + 1.5*data.stats[stat].base_stat + 'px"></div>');
			if(data.stats[stat].effort!=0) {
				EVStat = formatStr(data.stats[stat].stat.name);
				EVVal = data.stats[stat].effort;
			}
		}
		$('#stats-div').append('<br>EVs Gained: ' + EVVal + ' ' + EVStat + '<br><hr class="mobile-only">');

		$('#ability-div').append('Abilities: <ul>');
		for(ability in data.abilities) {
			let abilityName = formatStr(data.abilities[ability].ability.name);
			$('#ability-div').append(
				'<li onclick="openAbility(\'' + abilityName + '\',\'' + data.abilities[ability].ability.url + '\')" class="ability">' + 
				abilityName + (data.abilities[ability].is_hidden ? ' (hidden)' : '') + '</li>'
			);
		}
		$('#ability-div').append('</ul><hr>');

		$('#height-weight-div').append('Weight: ' + data.weight/10 + ' kg<br>');
		$('#height-weight-div').append('Height: ' + data.height/10 + ' m<br><br>');
	});

});

function openMove(moveName, moveURL) {
	$('.modal-title').html(moveName);
	$('.modal-body').html('<div class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>');
	$('.modal').modal('show');

	fetch(moveURL)
		.then(res => res.json() )
		.then(data => {
			console.log(data);
			$('.modal-body').html(
				'<span class="type ' + data.type.name + '"></span>' +
				' &nbsp; <img src="img/move/' + data.damage_class.name + '.png">' + capitalize(data.damage_class.name) +
				'<br><br><b>Power:</b> ' + checkNull(data.power) +
				'<br><b>Accuracy:</b> ' + checkNull(data.accuracy) + '%' +
				'<br><b>PP:</b> ' + data.pp +
				'<br><br><b>Priority:</b> ' + data.priority +
				// '<br>Stat Changes: ' + data.stat_changes +
				'<br><b>Target:</b> ' + formatStr(data.target.name) +
				'<hr><b>Effect:</b> ' + data.effect_entries[0].effect.split('$effect_chance').join(data.effect_chance)
			);
		});
}

function openAbility(abilityName, abilityURL) {
	$('.modal-title').html(abilityName);
	$('.modal-body').html('<div class="text-center"><i class="fas fa-spinner fa-2x fa-spin"></i></div>');
	$('.modal').modal('show');

	fetch(abilityURL)
		.then(res => res.json() )
		.then(data => {
			console.log(data);
			$('.modal-body').html(
				data.effect_entries[0].effect
			);
		});
}

// const formatStr = str => capitalizeEach(str.replace('-',' ').replace('_',' ') )
const formatStr = str => capitalizeEach(str.split('-').join(' ').split('_').join(' ') )
const capitalizeEach = str => {
	let rtn = '', words = str.split(' ');
	for(word in words)
		rtn += capitalize(words[word]) + ' ';
	return rtn.slice(0,-1);
}
const capitalize = str => str[0].toUpperCase() + str.slice(1).toLowerCase();

const padThreeZeroes = str => ('00' + str).slice(-3);

const checkNull = x => x ? x : 'N/A';

let loadCount = 2;
const checkLoadCount = ()=> --loadCount == 0 ? $('#loader').css('display', 'none') : {};

let TYPES = 'normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split(' ');
const TYPE_DATA = [
	[1,1,1,1,1,1,1,1,1,1,1,1,5,0,1,1,5,1], // normal
	[1,5,5,1,2,2,1,1,1,1,1,2,5,1,5,1,2,1], // fire
	[1,2,5,1,5,1,1,1,2,1,1,1,2,1,5,1,1,1], // water
	[1,1,2,5,5,1,1,1,0,2,1,1,1,1,5,1,1,1], // electric
	[1,5,2,1,5,1,1,5,2,5,1,5,2,1,5,1,5,1], // grass
	[1,5,5,1,2,5,1,1,2,2,1,1,1,1,2,1,5,1], // ice
	[2,1,1,1,1,2,1,5,1,5,5,5,2,0,1,2,2,5], // fighting
	[1,1,1,1,2,1,1,5,5,1,1,1,5,5,1,1,0,2], // poison
	[1,2,1,2,5,1,1,2,1,0,1,5,2,1,1,1,2,1], // ground
	[1,1,1,5,2,1,2,1,1,1,1,2,5,1,1,1,5,1], // flying
	[1,1,1,1,1,1,2,2,1,1,5,1,1,1,1,0,5,1], // psychic
	[1,5,1,1,2,1,5,5,1,5,2,1,1,5,1,2,5,5], // bug
	[1,2,1,1,1,2,5,1,5,2,1,2,1,1,1,1,5,1], // rock
	[0,1,1,1,1,1,1,1,1,1,2,1,1,2,1,5,1,1], // ghost
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,5,0], // dragon
	[1,1,1,1,1,1,5,1,1,1,2,1,1,2,1,5,1,5], // dark
	[1,5,5,5,1,2,1,1,1,1,1,1,2,1,1,1,5,2], // steel
	[1,5,1,1,1,1,2,5,1,1,1,1,1,1,2,2,5,1]  // fairy
];
//.type.name
function getDamageTaken(type, types) {
	let val = 1;
	for(let i=0; i<types.length; i++) {
		let tmp = TYPE_DATA[TYPES.indexOf(type)][TYPES.indexOf(types[i].type.name)];
		val *= (tmp==5?0.5:tmp);
	}
	return val;
}

function makeTypeAhead() {
	//http://twitter.github.io/typeahead.js/examples/
	let substringMatcher = function(strs) {
		return function findMatches(q, cb) {
			let matches, substringRegex;
			matches = [], substrRegex = new RegExp(q, 'i');
			$.each(strs, function(i, str) {
				if(substrRegex.test(str) )
					matches.push(str);
			});
			cb(matches);
		};
	};

	$('#search-input').typeahead({
		hint: true,
		highlight: true,
		minLength: 2
	},
	{
		name: 'Pokemon',
		source: substringMatcher(pokemonNames)
	});

	$('.typeahead').bind('typeahead:select', function(ev, suggestion) {
		// search suggestion when selected
		searchPokemon(suggestion);
	});
}

function searchPokemon(name) {
	$('#search-input').val(name);
	$('#search-form').submit();
}