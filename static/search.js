var titlelist = {};
var titlelist_uniqueEntries = {};
var yearlist = [];

var PER_PAGE = 100;

// Clusterize title- and yearlist
var clusterTitle = new Clusterize({
	scrollId: 'scrollAreaTitle',
	contentId: 'contentAreaTitle'
});
var clusterYear = new Clusterize({
	scrollId: 'scrollAreaYear',
	contentId: 'contentAreaYear'
});

function werkSearchNext(e) {
	var currentPage = $('#more').data('page');
	werkSearchStart(e, currentPage + 1);
}

function werkSearchRandom(e) {
	werkSearchReset(e);
	$('#restart').removeClass('hidden');
	$('.pagination').hide();
	werkSearchStart(e, 1, true);
}

function werkSearchReset(e) {
	if (typeof e !== typeof undefined) {
		e.preventDefault();
		e.stopPropagation();
	}

	// Update appearance
	$('form')[0].reset();
	$('#brightness_max_label').text('100%');
	$('#brightness_min_label').text('0%');
	$('#hue_max_label').text('360°');
	$('#hue_min_label').text('0°');
	$('#saturation_max_label').text('100%');
	$('#saturation_min_label').text('0%');
	$('#restart').addClass('hidden');
	$('#results .empty-state').removeClass('hidden');
	// Reset the noUiSlider values
	const brightnessSlider = document.getElementById('brightness_range_slider');
	const hueSlider = document.getElementById('hue_range_slider');
	const saturationSlider = document.getElementById('saturation_range_slider');

	// Reset the brightness slider (assuming initial min is 0 and max is 100)
	if (brightnessSlider) {
		brightnessSlider.noUiSlider.set([0, 100]);
	}

	// Reset the hue slider (assuming initial min is 0° and max is 360°)
	if (hueSlider) {
		hueSlider.noUiSlider.set([0, 360]);
	}

	// Reset the saturation slider (assuming initial min is 0% and max is 100%)
	if (saturationSlider) {
		saturationSlider.noUiSlider.set([0, 100]);
	}
	console.log("set sliders");

	werkSearchCount();

	clusterTitle.update(titlelist_uniqueEntries);
	clusterYear.update(yearlist);

	// Update the URL to the base URL
	const baseUrl = window.location.origin;
	history.pushState(null, '', baseUrl);
}

// normalize Search String
function normalizeSearchString(str) {
	return str
		.normalize('NFD') // Decompose combined characters into their base components
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
		.replace(/[.…"«»"-]/g, '') // Remove specific special characters
		.replace(/"/g, '') // Remove double quotes
		.toLowerCase(); // Convert to lowercase
}

// Query builder
function get_werkSearchQuery(from_page) {
	var searchCriteria = $('#searchCriteriaInput').val();
	var contentSearch = $('#searchTitleInput').val();

	const selectedValue = $('#resultOrder').val(); // This will be "UP" or "DOWN"

	const sortMethod = {
		YEAR_UP: "Jahr",
		ID_UP: "-Nummer",
		YEAR_DOWN: "-Jahr",
		ID_DOWN: "Nummer",
		TITLE: "Titel"
	};

	const sort = sortMethod[selectedValue];

	var currentPage = (typeof from_page === typeof 1) ? from_page : 1;
	let q = `?sort=${sort}&`;
	q += `per_page=${PER_PAGE}`;
	q += '&page=' + currentPage;

	if (contentSearch) {
		contentSearch = normalizeSearchString(contentSearch);
		console.log(contentSearch);
		q += '&o_Titel=' + encodeURIComponent(contentSearch);
	}

	filterselect = '';
	filterdata = {};

	$('input:checked').each(function () {
		var nm = $(this).attr('name');
		console.log("category=" + nm);

		if (!nm) { return; }
		if (!filterdata[nm]) { filterdata[nm] = []; }
		filterdata[nm].push($(this).attr('value'));
		var label = $(this).parent().find('label');

		var labelTitle = label
			.clone()
			.children()
			.remove()
			.end()
			.text();
		var labelNumber = label.find(".count").text();
		filterselect += '<span>' + labelTitle + ' ' + labelNumber + '</span>';
	});

	$('input[type=text]').each(function () {
		var nm = $(this).attr('name');
		if (!nm) { return; }
		if (!nm.indexOf('o_') == 0) { nm = 'o_' + nm; }
		var v = $(this).val();
		if (!v.length) { return; }
		if (!filterdata[nm]) { filterdata[nm] = []; }
		filterdata[nm].push(v);
		filterselect += '<span>' + v + '</span>';
	});

	var joinCharater = ',';
	if (searchCriteria == "OR") {
		joinCharater = '|'
	}

	$.each(Object.keys(filterdata), function () {
		q += '&' + this + '=' + filterdata[this].join(joinCharater);
	});

	// Add brightness sliders to the query
	const brightnessMin = $('#brightness_min').val();
	const brightnessMax = $('#brightness_max').val();

	if (!(brightnessMin == 0 && brightnessMax == 100)) {
		q += `&brightness_min=${brightnessMin}&brightness_max=${brightnessMax}`;
	}

	// Add brightness sliders to the query
	const hueMin = $('#hue_min').val();
	const hueMax = $('#hue_max').val();

	if (!(hueMin == 0 && hueMax == 360)) {
		q += `&hue_min=${hueMin}&hue_max=${hueMax}`;
	}

	// Add saturation sliders to the query
	const saturationMin = $('#saturation_min').val();
	const saturationMax = $('#saturation_max').val();

	if (!(saturationMin == 0 && saturationMax == 100)) {
		q += `&saturation_min=${saturationMin}&saturation_max=${saturationMax}`;
	}

	console.log("query" + q);

	$('#restart').removeClass('hidden');

	return {
		data: filterdata,
		html: filterselect,
		page: currentPage,
		query: q
	}
}

// Obtains a count of search results
function werkSearchCount() {
	qg = get_werkSearchQuery(1);

	$('#selection').empty().append(qg.html);

	$.getJSON('/api/images' + qg.query, function (data) {
		$('#total').html(data.total);
		$('#restart').removeClass('hidden');
		$('#start').removeClass('disable')
			.addClass(data.total > 0 ? '' : 'disable');
	});

}

var techniques = {
	'Ac': 'Acryl auf Papier',
	'AcP': 'Acryl auf Pavatex',
	'Aq': 'Aquarell',
	'B': 'Bleistift',
	'Bst': 'Bostitchklammern',
	'Bz': 'Beize',
	'C': 'Collage',
	'Con': 'Conté-Stift',
	'Cy': 'Cyanotypie',
	'Dd': 'Digitaldruck (ohne FAP)',
	'Dp': 'Dispersion',
	'Ecl': 'Eisenchlorid',
	'Fa': 'Farbstift',
	'Fä': 'Fäden',
	'Fal': 'Falz im Papier',
	'FAP': 'Fine Art Print',
	'Ff': 'Farbfolie',
	'Fko': 'Fotokopie',
	'FoD': 'Fotografie (digital, kein FAP)',
	'FoP': 'Fotografie (Polaroid)',
	'Fo': 'Fotografie',
	'Fs': 'Filzstift',
	'G': 'Gouache',
	'Gip': 'Gips',
	'Hd': 'Hochdruck',
	'Hpf': 'Hellraumprojektorfolie',
	'Hs': 'Holzschnitt',
	'K': 'Kohle',
	'Kf': 'Körperfarbe',
	'Kh': 'Kunstharzfarbe',
	'Kl': 'Klebeband',
	'Ko': 'Kohlepapier',
	'Ks': 'Kugelschreiber',
	'Ksp': 'Kunststoffplatte',
	'Kuf': 'Kupferdruckfarbe',
	'Ldf': 'Linoldruckfarbe',
	'Le': 'Leim',
	'Lese': 'Lettraset',
	'Ls': 'Linolschnitt',
	'Lg': 'Lithografie',
	'Lk': 'Lithokreide',
	'Mon': 'Monotypie',
	'Mt': 'Mischtechnik (min. 3 Techniken)',
	'Od': 'Offsetdruck',
	'OGip': 'Ölfarbe auf Gips',
	'Opl': 'Ölpastell, Wachsölkreiden',
	'OP': 'Ölfarbe auf Pavatex',
	'OL': 'Ölfarbe auf Leinwand',
	'OPa': 'Ölfarbe auf Papier',
	'Pfs': 'Pflanzensäfte',
	'Pk': 'Pastellkreide',
	'Pm': 'Pigmentmalerei',
	'R': 'Radierung',
	'Rd': 'Reliefdruck',
	'S': 'Siebdruck',
	'Sc': 'Schnitt',
	'Spm': 'Spachtelmasse',
	'Sto': 'Stoff',
	'T': 'Tusche',
	'Tin': 'Tinte',
	'Tx': 'TippEx',
	'Ve': 'Verletzung des Bildträgers',
	'W': 'Wein',
	'zT': 'zwei Techniken'
}

// Generates an image subtitle
function werkTitle(item) {
	//  console.log("werkTitle "+item['Titel']);
	var Techniken = '';
	if (item['Techniken'] !== null) {
		var itemarr = [];
		item['Techniken'].split(' ').forEach(function (t) {
			getcode = techniques[t.trim()]
			if (typeof getcode !== 'undefined') {
				if (getcode.toLowerCase().indexOf('technik') > 0) { return; }
				itemarr.push(getcode);
			}
		})
		Techniken = itemarr.join(', ');
	}

	var status = '';
	//debugger;
	switch (item['Status']) {
		case 'res':
			status = 'reserviert '
			break;
		case 'vers':
			status = 'verschollen'
			break;
		case 'vernichtet':
			status = 'vernichtet'
			break;
		case 'PB':
			status = 'Privatbesitz'
			break;
		default:
			status = ''
	};

	var s = '' +
		'<b>' + (item['Titel'] || '(Ohne Titel)') + '</b> ' +
		'[' + item['Nummer'] + '], ' +
		'' + Techniken + ', ' +
		'' + item['Format'] + 'cm' +
		'' + (item['Jahr'] !== null ?
			', ' + item['Jahr'].replace('a', '') + '' : '') +
		'' + (item["Zus'arbeit"] !== null ?
			', In Zusammenarbeit mit ' + item["Zus'arbeit"] : '') +
		'' + (status !== '' ?
			', ' + status : '')
		;
	return s;
}


function sortData(data) {
	return data.sort(function (a, b) {
		// Ensure 'TitelEinfach' is not null or empty, set to 'Ohne Titel' if missing
		const regex = /([a-zA-Z]+)(\d*)/;

		// If 'TitelEinfach' is null or empty, set it to 'Ohne Titel'
		const aTitle = a.TitelEinfach ? a.TitelEinfach : 'Ohne Titel';
		const bTitle = b.TitelEinfach ? b.TitelEinfach : 'Ohne Titel';

		// Split titles into alphabetic and numeric parts
		const matchA = aTitle.match(regex);
		const matchB = bTitle.match(regex);

		// If either match is null, treat as alphabetic comparison only
		if (!matchA || !matchB) {
			return bTitle.localeCompare(aTitle); // Reverse the comparison for descending order
		}

		// First, compare the alphabetic parts (A-Z)
		const alphaComparison = matchA[1].localeCompare(matchB[1]);

		// If alphabetic parts are different, return alphabetic comparison result
		return alphaComparison;
	});
}

// This function is used in a different file
// Generates list of Titles, stores them in global titlelist
function listTitles() {
	q = '?sort=-Jahr&per_page=-1';
	let titleItems = [];
	let yearItems = [];
	console.log("list titles");


	$.getJSON('/api/images.json' + q, function (data) {

		const sortedData = sortData(data);

		// Create title item array
		sortedData.forEach(function (item) {
			// Saves data for years in yearList
			if (item['Jahr'] != null) {
				if (yearItems[item['Jahr'].substr(0, 4)]) {
					yearItems[item['Jahr'].substr(0, 4)] += 1;
				} else {
					yearItems[item['Jahr'].substr(0, 4)] = 1;
				}
			}
			// Saves data for titles in titlelist
			if (item['Titel'] != null && item['TitelEinfach'] != null) {
				fixedItem =
					'<div>' +
					'<span class="hidden" aria-hidden="true">' + item['TitelEinfach'] + '</span>' +
					'<span class="display">' + item['Titel'] + '</span>' +
					'</div>';
				titleItems.push(fixedItem);
			}
		});

		titlelist = titleItems; // Globally available
		titlelist_uniqueEntries = removeDuplicates(titlelist); // Removes duplicates and stores globally

		yearItems.forEach(function (item, index) {
			yearlist.push('<div>' + index + '</div>');
		});

		clusterTitle.update(titlelist_uniqueEntries);
		clusterYear.update(yearlist);
	});
}

function countDuplicates(names) {
	var count = {};
	names.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
	console.log('countDuplicates: ' + count);
}

function removeDuplicates(names) {
	let unique = {};
	names.forEach(function (i) {
		if (!unique[i]) {
			unique[i] = true;
		}
	});
	return Object.keys(unique);
}

// Main function to run a search
function werkSearchStart(e, from_page, random, fromURL) {
	if (e) {
		e.preventDefault();
		e.stopPropagation();
	}

	// Setting default value for 'from_page' if not provided or undefined
	if (typeof from_page === 'undefined' || from_page === null) {
		from_page = 1;
	}

	if (random === true) {
		// Handling the random search case
		$('#results').find('div.row').empty();
		$('#selection').empty();
		// window.location.replace("/#&gid=1&pid=15");
	} else if (fromURL === true) {
		// Handling the URL search case
		werkSearchCount();
		$('#restart').removeClass('hidden');
	} else {
		// Exit if the 'start' button is disabled
		if ($('#start').hasClass('disable')) { return; }
	}

	// Load and build the query
	var wsq = get_werkSearchQuery(from_page);
	var q = wsq.query;
	var single = false;

	// Update page number
	$('#more').data('page', wsq.page);
	if (wsq.page === 1) {
		$('#results').find('div.row').empty();
	}

	$.getJSON(random ? '/api/images.random' : '/api/images.json' + q, function (data) {

		var $tgt = $('#results').show().find('div.row');
		single = (data.length == 1 && $('#worksMenuItem').hasClass("active"));

		$('.pagination').addClass('hidden');
		if (data.length === PER_PAGE) { $('.pagination').removeClass('hidden'); }

		var urlPrefix = "https://archiv.juergstraumann.ch/";

		// Generate thumbnails
		data.forEach(function (item) {
			var $container = $('<div>').addClass('item');
			var $link = $('<a>').attr('href', urlPrefix + item.path).attr('data-sub-html', werkTitle(item));
			var $img = $('<img>').attr('src', urlPrefix + item.thumb).addClass('thumb');

			// Get the current saved data from localStorage
			var savedData = JSON.parse(localStorage.getItem('selectedItems')) || [];

			// Check if the current item is already saved in localStorage
			var isChecked = savedData.some(function (i) {
				return i.Nummer === item.Nummer;
			});

			// Create the checkbox and set it as checked if the item is already saved
			var $checkbox = $('<input type="checkbox">')
				.attr('id', 'result-item' + item.Nummer)
				.addClass('check')
				.attr('data-storage-number', item.Nummer)
				.prop('checked', isChecked);

			// Append the image and checkbox to the container
			$link.append($img);
			$container.append($link);
			$container.append($checkbox);

			// Append the container to the target element
			$tgt.append($container);

			// Add event listener to checkbox
			$checkbox.on('change', function () {
				// Get the data-storage-number value from the checkbox
				var storageNumber = $(this).data('storage-number');

				// Find the complete item from the 'data' array
				var selectedItem = data.find(function (i) {
					return i.Nummer === storageNumber;
				});

				// Get current saved data from localStorage, or initialize as an empty array
				var savedData = JSON.parse(localStorage.getItem('selectedItems')) || [];

				if ($(this).is(':checked')) {
					// If checkbox is checked, add the complete item to the array
					if (!savedData.some(function (i) { return i.Nummer === selectedItem.Nummer; })) {
						savedData.push(selectedItem);  // Push the entire item object
					}
				} else {
					// If checkbox is unchecked, remove the specific item by matching its 'Nummer'
					savedData = savedData.filter(function (i) {
						return i.Nummer !== selectedItem.Nummer;  // Remove the item with the matching 'Nummer'
					});
				}

				// Save the updated array back to localStorage
				localStorage.setItem('selectedItems', JSON.stringify(savedData));
				loadSavedItems();
			});
		});

		// Initialize the gallery, open immediately when random
		const container = $tgt.get(0);
		initializeGallery(container, (random || single));
		// initializeGallery(container, (random));

	}).fail(function () {
		console.log('Fehler: Suche fehlgeschlagen');
	});

	// Update URL
	updateURLWithSearchString(q.substring(1)); // Remove '?' from query before updating URL

	// Update Apperance
	$('#restart').removeClass('hidden');
	$('#results .pagination, #results .output').removeClass('hidden');
	$('#results .empty-state').addClass('hidden');
}

function loadSavedItems() {

	// Get saved data (IDs) from localStorage
	var savedData = JSON.parse(localStorage.getItem('selectedItems')) || [];
	var $savedList = $('#savedList .output');

	// Clear the current content (if any)
	$savedList.empty();

	if (savedData.length === 0) {
		// If no items are saved, show the "No saved items" message
		$("#savedList .output").addClass('hidden');
		$("#savedList .empty-state").removeClass('hidden');
		console.log("Keine Werke gespeichert…");

	} else {
		console.log('Saved images:', savedData.length);
		$("#savedList .output").removeClass('hidden');
		$("#savedList .empty-state").addClass('hidden');
		var urlPrefix = "https://archiv.juergstraumann.ch/";
		var $tgt = $('#savedList').find('div.output');

		// For each saved storage number, find the corresponding item in the data array
		savedData.forEach(function (item) {
			var $container = $('<div>').addClass('item');
			var $link = $('<a>').attr('href', urlPrefix + item.path).attr('data-sub-html', werkTitle(item));
			var $img = $('<img>').attr('src', urlPrefix + item.thumb).addClass('thumb');
			var $checkbox = $('<input type="checkbox">')
				.attr('id', 'mylist-' + item.Nummer)
				.addClass('check')
				.attr('data-storage-number', item.Nummer)
				.prop("checked", true);
			$link.append($img);
			$container.append($link);
			$container.append($checkbox);
			$tgt.append($container);

			$checkbox.on('change', function () {
				var savedData = JSON.parse(localStorage.getItem('selectedItems')) || [];
				// Remove the item from the savedList
				savedData = savedData.filter(function (i) {
					console.log(i);
					return i.Nummer !== item.Nummer;  // Remove the item with the matching 'Nummer'
				});

				// Save the updated array back to localStorage
				localStorage.setItem('selectedItems', JSON.stringify(savedData));
				loadSavedItems();
			});
		});

		// Initialize the gallery		
		const container = $tgt.get(0);
		initializeGallery(container);
	}
}

function initializeGallery(container, openImmediately = false) {
	const galleryOptions = {
		selector: '.item a',
		speed: 1,
		download: false,
		addClass: "js-gallery"
	};

	if (!container.galleryInstance) {
		// Initialize the gallery
		container.galleryInstance = lightGallery(container, galleryOptions);
	} else {
		// Destroy and reinitialize the gallery if it's already created
		container.galleryInstance.destroy(true);
		container.galleryInstance = lightGallery(container, galleryOptions);
	}
	if (openImmediately) {
		container.galleryInstance.openGallery();
	}
}

function updateURLWithSearchString(searchString) {
	if (history.pushState) {
		// Parse existing URL parameters
		var params = new URLSearchParams(window.location.search);

		// Add or update the search parameters
		var searchPairs = searchString.split("&");
		searchPairs.forEach(function (pair) {
			var [key, value] = pair.split("=");
			if (key) { params.set(key, value); }
		});

		// Build the updated URL
		var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
		window.history.pushState({ path: newUrl }, '', newUrl);
	}
}
