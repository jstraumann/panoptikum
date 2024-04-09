var PER_PAGE = 3 * 10;
var clusterTitle = new Clusterize({ // Clusterize prepares title search output
	scrollId: 'scrollAreaTitle',
	contentId: 'contentAreaTitle'
});
var clusterYear = new Clusterize({
	scrollId: 'scrollAreaYear',
	contentId: 'contentAreaYear'
});

function hasAttr(attr) {
	return (typeof attr !== typeof undefined && attr !== false)
}

function werkSearchNext(e) {
	var ppp = $('button#more').data('page');
	werkSearchStart(e, ppp + 1);
}

function werkSearchRandom(e) {
	werkSearchReset(e);
	$('#restart').removeClass('hidden');
	$('button#more').hide();
	werkSearchStart(e, 1, true);
}

function werkSearchBack(e) {
	if (typeof e !== typeof undefined)
		e.preventDefault(); e.stopPropagation();

	var $det = $('#details').hide(); $('#browser').show();
}

function werkSearchReset(e) {
	if (typeof e !== typeof undefined)
		e.preventDefault(); e.stopPropagation();

	// Clear the form and return to start when tapped
	$('form')[0].reset();
	$('#total').text('0');
	$('#start').addClass('disable'); 	// Anzeigen ausblenden
	$('#restart').addClass('hidden');	// Hide reset button
	$('#results').hide(); 				// Hides results
	$('#filters .tab-content').show(); 	// Shows search form
	clusterTitle.update(titlelist_uniqueEntries); // Resets title list display
	clusterYear.update(yearlist); 		// Resets year list display

	// Show the counters again
	// $('.form-check small').css('visibility', 'visible');
}

// Query builder
function get_werkSearchQuery(from_page) {
	var searchCriteria = $('#searchCriteria').val();
	var q = '?sort=-Jahr&';
	q += 'per_page=' + PER_PAGE;

	console.log("Werksearch");

	var ppp = (typeof from_page === typeof 1) ? from_page : 1;
	q += '&page=' + ppp;

	filterselect = '';
	filterdata = {};

	$('input:checked').each(function () {
		var nm = $(this).attr('name');
		console.log("category=" + nm);
		
		if (!hasAttr(nm)) return;
		if (!filterdata[nm]) filterdata[nm] = [];
		filterdata[nm].push($(this).attr('value'));
		var label = $(this).parent().find('label');

		var labelTitle = label
			.clone()    // Clone the element
			.children() // Select all the children
			.remove()   // Remove all the children
			.end()  	// Again go back to selected element
			.text();
		var labelNumber = label.find(".count").text()
		filterselect += '<span>' + labelTitle + ' ' + labelNumber + '</span>';
	});

	$('input[type=text]').each(function () {
		var nm = $(this).attr('name');
		if (!hasAttr(nm)) return;
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
		// Results in searchtsring
		// q += '&' + this + '=' + filterdata[this].join(',');
		// q += '&' + this + '=' + filterdata[this].join('|'); // Assuming '|' is the OR operator for the API
	});

	console.log("query" + q);
	

	return {
		data: filterdata,
		html: filterselect,
		page: ppp,
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

// Main function to run an search
function werkSearchStart(e, from_page, random) {
	if (from_page == typeof undefined)
		from_page = 1;
	if (typeof e !== typeof undefined)
		e.preventDefault(); e.stopPropagation();

	if (random == true) {
		$('#results').find('div.row').empty();
		$('#selection').empty();
		window.location.replace("/#&gid=1&pid=15");
	} else {
		if ($('#start').hasClass('disable')) return;
	}
	$('.modal').modal('show');

	wsq = get_werkSearchQuery(from_page);
	q = wsq.query;

	// Update page number
	$('button#more').data('page', wsq.page);
	if (wsq.page == 1) {
		$('#results').find('div.row').empty();
	}

	$.getJSON(random ? '/api/images.random' : '/api/images.json' + q, function (data) {
		setTimeout(function () {
			$('.modal').modal('hide');
		}, 500);

		$('#filters .tab-content').hide();

		var $tgt = $('#results').show().find('div.row');

		$('button#more').hide();
		if (data.length == PER_PAGE)
			$('button#more').show();

		// var urlPrefix = "http://moirasia.datalets.ch/"
		// var urlPrefix = "http://new.luc.gr/pano/"
		var urlPrefix = "https://archiv.juergstraumann.ch/"

		// Generate thumbnails
		data.forEach(function (item, ix) {

			$link = $('<a>');
			$link.attr('href', urlPrefix + item.path);
			$link.addClass('col-sm-2 item');
			$link.attr('data-sub-html', werkTitle(item));

			$img = $('<img>');
			$img.attr('src', urlPrefix + item.thumb);

			$link.append($img);

			$tgt.append($link);
		}); // -data each

		const gallery = lightGallery($tgt.get(0), {
			selector: '.item',
			plugins: [],
			licenseKey: '0000-0000-000-0000',
			speed: 500,
			download: false,
			addClass: "js-gallery "
		});

		// Automatically open if only one image or random mode
		if (data.length == 1 || random) {
			gallery.openGallery(0);
		}

	}).fail(function (jqxhr, textStatus, error) {
		alert('Could not search!');
	});
}
