var cache = {};
var filters = {};

const category_selectors = [
	'o_Motiven',
	'o_Paraphrasen',
	'o_Technik',
	'o_Helligkeit',
	'o_Farbigkeit',
	'o_Ausrichtung',
	'o_Serie',
	'o_Grösse',
	'o_Gegenständlich/Ungegenständlich',
	'o_Darstellungsformen',
	'o_Komposition'
];


(function () {

	$.getJSON('/api/filters/all.json', function (jsondata) {
		cache = jsondata;

		// Parse filter structure
		cache.forEach(function (d) {
			//    if (d.Type == 'Format') {
			//      return; // TODO: enable Format in the future
			//    }
			dm = d.Mode.toLowerCase();
			if (!filters[dm])
				filters[dm] = [];
			if (!filters[dm].includes(d.Type))
				filters[dm].push(d.Type);
		});

		Object.keys(filters).forEach(function (f) {
			init_section(f);
		});

		// Filter for Titles (calls js function to store titles (all of them) into var titlelist.)
		listTitles();

		// Hack for display "performance" as wished
		// var elMagic = $('#o_ParaphrasenPar9b').parent();
		// elMagic.appendTo($(elMagic).closest('.col-sm-3').prev());

		// After site has been build, run URL search
		applySearchFromURL();

	}).fail(function () {
		alert('Could not load data!');
	});

	// Apply fancy polar button effect
	$('.btn-polar').each(function() {
        const buttonText = $(this).text();
        const newContent = `
            <span>${buttonText}</span>
            <div class="marquee" aria-hidden="true">
                <div class="marquee-inner">
                    <span>${buttonText}</span>
                    <span>${buttonText}</span>
                    <span>${buttonText}</span>
                    <span>${buttonText}</span>
                </div>
            </div>
        `;
        $(this).html(newContent);
    });

	function init_section(sname) {
		// Add section headers
		console.log("Init sections", sname);

		loadSavedItems();

		let id = "";
		switch (sname) {
			case 'anderes':
				id = "#titleSearch"
				break;
			case 'inhalt':
				id = "#contentSearch"
				break;
			case 'form':
				id = "#formSearch"
				break;
			default:
				break;
		}

		$(id).each(function () {
			var $tgt = $(this);
			filters[sname].forEach(function (i) {
				if ($('div[data-tag="' + sname + '"]').attr('data-type') == i)
					return;
				var allOfType = cache.filter(c => c.Type === i)
				var allCodes = allOfType.map(c => c.Code);
				var filter = allCodes.join('|');
				$tgt.append(
					'<h5 class="group-title"><input type="checkbox" id="group_' + i + '"name="o_' + allOfType[0].Column + '" value="' + filter + '">&nbsp;<label for="group_' + i + '">' + i + '</label></h5>' +
					'<div class="form-group row" ' +
					'data-tag="' + sname + '" ' +
					'data-type="' + i + '"></div>'
				);
			});
		});

		// Subset the data
		var data = cache.filter(function (i) {
			return i.Mode.toLowerCase() == sname.toLowerCase();
		});

		// Process any tags
		$('div[data-tag="' + sname + '"]').each(function () {
			renderForm($(this), data);
		});
	}

	function attr_or(attr, defaultval) {
		if (typeof attr !== typeof undefined && attr !== false) {
			return attr;
		} else {
			return defaultval;
		}
	}

	function renderForm($out, dp) {
		var wtype = $out.attr('data-type'),
			inputtype = attr_or($out.attr('data-input'), 'checkbox');
	
		// Filter data based on type
		data = dp.filter(function (i) {
			return i.Type.toLowerCase() == wtype.toLowerCase();
		});
	
		// Append "form-check" divs directly to $out
		$.each(data, function () {
			$out.append(
				'<div class="form-check">' +
					(this.Code == null ? '&nbsp;' :
						'<input class="form-check-input" ' +
						'id="o_' + this.Column + this.Code + '" ' +
						'name="o_' + this.Column + '" ' +
						'value="' + this.Code + '" ' +
						'type="' + inputtype + '">' +
						'<label class="form-check-label" ' +
						'for="o_' + this.Column + this.Code + '">' +
						this.Title +
						(this.Count == 0 ? '' :
							'&nbsp;<span class="badge badge-light badge-pill count">' + this.Count + '</span> ') +
						'</label>') +
				'</div>'
			);
		});
	}

	function titleSearch(e) {
		$('input[name="Jahr"]').val(''); // Copies Entry to html input form
		$('input[name="Titel"]').val(this.innerHTML); // Copies Entry to html input form
		// $('input').prop("checked", false); // Unchecks all input boxes, reset selection
		werkSearchCount();
	}

	function yearSearch(e) {
		$('input[name="Titel"]').val(''); // Copies Entry to html input form
		$('input[name="Jahr"]').val(this.innerHTML); // Copies Entry to html input form
		//$('input').prop("checked", false); //unchecks all input boxes, reset selection
		werkSearchCount();
	}

	// Run search
	// $('#start').click(werkSearchStart); // -button.click
	$('#start').on('click', function(e) {
		e.preventDefault(); 
		e.stopPropagation();
		werkSearchStart();
		$("#worksMenuItem").click(); // Switch tab
	});
	// Random search
	$('#random').click(werkSearchRandom); // -button.click

	// Reset search
	$('#restart').on('click', { resetPage: false }, werkSearchReset);
	$('#restartAll').on('click', function() {
		werkSearchReset();
		$("#searchMenuItem").click(); // Switch tab
	});

	// Pagination
	$('button#more').click(werkSearchNext); // -button.click

	// Title, Year Search
	$('#contentAreaTitle').on('click', 'div', titleSearch);  // -div.click for title search results
	$('#contentAreaYear').on('click', 'div', yearSearch);  // -div.click for year search results

	// Main nav tabs
	$('.main-nav-item').click(function () {
		console.log("Tabs");
		
		$('.main-nav .main-nav-item').removeClass('active');
		$('.main .main-nav-pane').removeClass('active');
		$(this).addClass('active');
		var activeSection = $(this).attr("href");
		$(activeSection).addClass('active');
        console.log(activeSection);
	});

	// Search tab styling on click
	$('#search .nav-link').click(function () {
		$('#search .nav-item.nav-link').removeClass('active');
	});

	// Counter on click
	$('form').change(function () {
		$('input[name="Titel"]').val('');
		werkSearchCount();
	});

	// Save all result images
	$('#selectAllResults').on('click', function (e) {
		e.preventDefault();
		e.stopPropagation();
		$('.check').prop('checked', true);
		$('.check').trigger('change');
	});

	// Delete local storage -> Delete saved images
	$('#deleteSavedList').on('click', function (e) {
		e.preventDefault(); 
		e.stopPropagation();

		console.log("delete local storage");
		localStorage.removeItem('selectedItems');
		loadSavedItems();
	});

	// Export list
	$('#exportSavedList').on('click', function (e) {
		e.preventDefault(); 
		e.stopPropagation();
		const data = localStorage.getItem('selectedItems');  
		const jsonData = data;
		const blob = new Blob([jsonData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'data.json'; 
		link.click();
		URL.revokeObjectURL(url);
	});

	$('#importSavedList').on('click', function (e) {
		e.preventDefault(); 
		e.stopPropagation();

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json';

		input.onchange = async (event) => {
			const file = event.target.files[0];
			if (!file) return;

			try {
				const text = await file.text();
				localStorage.setItem('selectedItems', text);
				loadSavedItems();
				
			} catch (error) {
				console.error('Error parsing JSON:', error);
				alert('Fehler beim importieren der Liste');
			}
		}
		input.click();
	});

})();



function updateURLWithSearchString(searchString) {
	if (history.pushState) {
		var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + searchString;
		window.history.pushState({ path: newUrl }, '', newUrl);
	}
}

function getSelectedTechniques() {
	let selectedTechniques = [];
	// Select all checkboxes with name "o_Motiven"

	category_selectors.forEach(selector => {
		// For each selector, find checked inputs and add their values to the selectedTechniques array.
		$(`input[name="${selector}"]:checked`).each(function () {
			selectedTechniques.push($(this).val());
		});
	});

	console.log("selectedTechniques: " + selectedTechniques);

	return selectedTechniques;
}

function applySearchFromURL() {
	var params = {};
	var searchStr = window.location.search;
	if (searchStr) {
		var pairs = searchStr.substring(1).split("&");
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=");
			params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
		}
	}
	console.log(params);
	applyURLsearch = false
	category_selectors.forEach(function (category) {
		if (params[category]) {
			// Split the parameter by '|' to get the individual values
			var values = params[category].split('|');
			applyURLsearch = true;
			// Use the constructed ID to check each corresponding checkbox or input
			values.forEach(function (value) {
				var inputID = category + value;
				$('#' + inputID).prop('checked', true);
				console.log("checked:" + inputID);

			});
		}
	});

	// Trigger the search if params have been found
	if (applyURLsearch) {
		werkSearchStart(null, 1, false, true);
	}
}