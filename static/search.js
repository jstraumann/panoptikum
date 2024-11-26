var titlelist = {};
var titlelist_uniqueEntries = {};
var yearlist = [];
var gallery;

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
	$('#total').text('0');
	$('#start').addClass('disable');
	$('#restart, #restartAll').addClass('hidden');
	$('#results .pagination, #results .output').addClass('hidden');
	$('#results .empty-state').removeClass('hidden');

	clusterTitle.update(titlelist_uniqueEntries);
	clusterYear.update(yearlist);

	// Update the URL to the base URL
	const baseUrl = window.location.origin;
	history.pushState(null, '', baseUrl);
}

// Query builder
function get_werkSearchQuery(from_page) {
	var searchCriteria = $('#searchCriteriaInput').val();
	var contentSearch = $('#searchTitleInput').val();
	var q = '?sort=-Jahr&';
	q += 'per_page=' + PER_PAGE;

	var currentPage = (typeof from_page === typeof 1) ? from_page : 1;
	q += '&page=' + currentPage;

	// If there's a search term, include it in the query
	if (contentSearch) {
		console.log(contentSearch);
		q += '&o_Titel=' + encodeURIComponent(contentSearch);
	}

	filterselect = '';
	filterdata = {};

	$('input:checked').each(function () {
		var nm = $(this).attr('name');
		console.log("category=" + nm);

		if (!nm) return;
		if (!filterdata[nm]) filterdata[nm] = [];
		filterdata[nm].push($(this).attr('value'));
		var label = $(this).parent().find('label');

		var labelTitle = label
			.clone()    // Clone the element
			.children() // Select all the children
			.remove()   // Remove all the children
			.end()      // Go back to selected element
			.text();
		var labelNumber = label.find(".count").text();
		filterselect += '<span>' + labelTitle + ' ' + labelNumber + '</span>';
	});

	$('input[type=text]').each(function () {
		var nm = $(this).attr('name');
		if (!nm) return;
		if (!nm.indexOf('o_') == 0) nm = 'o_' + nm;
		var v = $(this).val();
		if (!v.length) return;
		if (!filterdata[nm]) filterdata[nm] = [];
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

	console.log("query" + q);

	$('#restart, #restartAll').removeClass('hidden');

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
	if (qg.html === '') return $('#total').text('0');

	$.getJSON('/api/images' + qg.query, function (data) {
		$('#total').html(data.total);
		$('#restart', 'restartAll').removeClass('hidden');
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
				if (getcode.toLowerCase().indexOf('technik') > 0) return;
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

// Generates list of Titles, stores them in global titlelist
function listTitles() {
	q = '?sort=-Jahr&per_page=-1';
	let titleItems = [];
	let yearItems = [];

	$.getJSON('/api/images.json' + q, function (data) {
		// Create title item array
		data.forEach(function (item, index) {
			// Saves data for years in yearList
			if (item['Jahr'] != null) {
				if (yearItems[item['Jahr'].substr(0, 4)]) {
					yearItems[item['Jahr'].substr(0, 4)] += 1;
				} else {
					yearItems[item['Jahr'].substr(0, 4)] = 1;
				}
			}
			// Saves data for titles in titlelist
			if (item['Titel'] != null) {
				fixedItem = '<div>' + item['Titel'] + '</div>';
				titleItems.push(fixedItem);
			}
		});
		titleItems.sort(function (a, b) {
			return a.localeCompare(b);
		});

		titlelist = titleItems; // Globally available
		titlelist_uniqueEntries = removeDuplicates(titlelist) // Removes duplicates and stores it globally.

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
		window.location.replace("/#&gid=1&pid=15");
	} else if (fromURL === true) {
		// Handling the URL search case
		werkSearchCount();
		$('#restart').removeClass('hidden');
	} else {
		// Exit if the 'start' button is disabled
		if ($('#start').hasClass('disable')) return;
	}

	// Load and build the query
	var wsq = get_werkSearchQuery(from_page);
	var q = wsq.query;

	// Update page number
	$('#more').data('page', wsq.page);
	if (wsq.page === 1) {
		$('#results').find('div.row').empty();
	}

	$.getJSON(random ? '/api/images.random' : '/api/images.json' + q, function (data) {

		console.log(data);
		
		var $tgt = $('#results').show().find('div.row');

		$('.pagination').addClass('hidden');
		if (data.length === PER_PAGE)
			$('.pagination').removeClass('hidden');

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

		// Initialize the gallery		
		const container = $tgt.get(0);
		initializeGallery(container);

		// Automatically open if only one image or random mode
		if (data.length === 1 || random) {
			gallery.openGallery(0);
		}
	}).fail(function () {
		alert('Could not search!');
	});

	// Update URL
	updateURLWithSearchString(q.substring(1)); // Remove '?' from query before updating URL

	// Update Apperance
	$('#restart, #restartAll').removeClass('hidden');
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
		console.log(savedData.length);
		$("#savedList .output").removeClass('hidden');
		$("#savedList .empty-state").addClass('hidden');
		var urlPrefix = "https://archiv.juergstraumann.ch/";
		var $tgt = $('#savedList').find('div.output');

		// For each saved storage number, find the corresponding item in the data array
		savedData.forEach(function (item) {
			console.log("done", item);

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
				var storageNumber = $(this).data('storage-number');
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

function initializeGallery(container) {
	console.log('init gallery');
	
	const galleryOptions = {
		selector: '.item a',
		licenseKey: '0000-0000-000-0000',
		speed: 1,
		download: false,
		addClass: "js-gallery"
	};

    // Use a property to track whether the gallery is already initialized
    if (!container.galleryInstance) {
        // Initialize the gallery
        container.galleryInstance = lightGallery(container, galleryOptions);
        console.log("Gallery initialized");
    } else {
        // Destroy and reinitialize the gallery if it's already created
        container.galleryInstance.destroy(true);
        container.galleryInstance = lightGallery(container, galleryOptions);
        console.log("Gallery updated");
    }
}