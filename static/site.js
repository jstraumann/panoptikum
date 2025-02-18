var cache = {};
var filters = {};
let typingTimer;
const doneTypingInterval = 250;

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
		cache.forEach(function (d) {
			dm = d.Mode.toLowerCase();
			if (!filters[dm])
				{filters[dm] = [];}
			if (!filters[dm].includes(d.Type))
				{filters[dm].push(d.Type);}
		});

		Object.keys(filters).forEach(function (f) {
			initFilterSections(f);
		});
		initColorFilterSection();
		addFormListeners();
		listTitles();
		applySearchFromURL();
		loadSavedItems();

	}).fail(function () {
		console.log('Fehler: Daten konnten nicht geladen werden.');
	});

	werkSearchCount();

	function initFilterSections(sname) {
		console.log("🔥 Init sections", sname);
	
		const searchIds = {
			anderes: "#titleSearch",
			inhalt: "#contentSearch",
			form: "#formSearch",
			farbe: "#colorSearch"
		};
	
		let id = searchIds[sname] || "";		
	
		$(id).each(function () {
			var $tgt = $(this); 
			
			filters[sname].forEach(function (i) {
				if ($('div[data-tag="' + sname + '"]').attr('data-type') === i) {return;}
			
				// Append filter group and add a master checkbox in the group title
				$tgt.append(
					`<div class="filter-group checkboxes">
						<h5 class="group-title">
							<input type="checkbox" class="select-all" data-type="${i}" id="group_${i}">
							<label for="group_${i}">${i}</label>
						</h5>
						<div class="form-group row" data-tag="${sname}" data-type="${i}"></div>
					</div>`
				);
			});
	
			// Ensure 'select-all' reflects the state of individual checkboxes
			$(document).on('change', 'input[type="checkbox"]:not(.select-all)', function () {
				var $checkboxGroup = $(this).closest('.filter-group').find('input[type="checkbox"]:not(.select-all)');
				var $selectAllCheckbox = $(this).closest('.filter-group').find('.select-all');
			
				// Update the 'select-all' checkbox if all checkboxes are selected
				var allChecked = $checkboxGroup.length === $checkboxGroup.filter(':checked').length;
				$selectAllCheckbox.prop('checked', allChecked);
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

	function initColorFilterSection() {
		const $tgt = $("#colorSearch");
	
		// Helper function to add slider group
		function addSliderGroup(idPrefix, title, min, max, step, unit) {
			$tgt.append(
				`<div id="${idPrefix}Sliders" class="filter-group sliders">
					<h5 class="group-title"><label>${title}</label></h5>
					<div class="slider-group d-flex">
						<input type="range" id="${idPrefix}_min" class="range-slider hidden" min="${min}" max="${max}" step="${step}" value="${min}">
						<label class="flex-fill" for="${idPrefix}_min">Min: <span id="${idPrefix}_min_label">${min}${unit}</span></label>
						<input type="range" id="${idPrefix}_max" class="range-slider hidden" min="${min}" max="${max}" step="${step}" value="${max}">
						<label class="flex-fill text-right" for="${idPrefix}_max">Max: <span id="${idPrefix}_max_label">${max}${unit}</span></label>
					</div>
					<!-- Intermediate slider with two handles -->
					<div class="slider-group slider-styled" id="${idPrefix}_range_slider"></div>
				</div>`
			);
	
			// Initialize noUiSlider with two handles for min and max
			const rangeSlider = document.getElementById(`${idPrefix}_range_slider`);
			noUiSlider.create(rangeSlider, {
				start: [min, max],
				connect: true,
				range: {
					'min': min,
					'max': max
				},
				step: step,
				format: {
					to: function (value) {
						return value.toFixed(0); // format to integer
					},
					from: function (value) {
						return parseFloat(value);
					}
				}
			});
	
			// When slider values change, update min and max inputs and trigger form change
			rangeSlider.noUiSlider.on('update', function (values, handle) {
				if (handle === 0) {
					// Handle 0 controls the min value
					const minValue = values[0];
					$(`#${idPrefix}_min`).val(minValue);
					$(`#${idPrefix}_min_label`).text(`${minValue}${unit}`);
					// Trigger form change for min
					$(`#${idPrefix}_min`).trigger('change');
				} else {
					// Handle 1 controls the max value
					const maxValue = values[1];
					$(`#${idPrefix}_max`).val(maxValue);
					$(`#${idPrefix}_max_label`).text(`${maxValue}${unit}`);
					// Trigger form change for max
					$(`#${idPrefix}_max`).trigger('change');
				}
			});
	
			// Sync the original range sliders with the noUiSlider handles
			$(document).on('input', `#${idPrefix}_min`, function () {
				const minValue = this.value;
				rangeSlider.noUiSlider.set([minValue, null]); // Only update min value
				// Trigger form change for min
				$(this).trigger('change');
			});
	
			$(document).on('input', `#${idPrefix}_max`, function () {
				const maxValue = this.value;
				rangeSlider.noUiSlider.set([null, maxValue]); // Only update max value
				// Trigger form change for max
				$(this).trigger('change');
			});
		}
	
		// Add sliders for brightness, hue, and saturation
		addSliderGroup("brightness", "Berechnete Helligkeit", 0, 100, 1, "%");
		// addSliderGroup("hue", "Berechneter Farbton", 0, 360, 1, "°");
		addSliderGroup("saturation", "Berechnete Sättigung", 0, 100, 1, "%");
	}
	
	

	function createSlider(id, min = 0, max = 100, value = 0, step = 1) {
		// Create the slider container
		const sliderGroup = document.createElement('div');
		sliderGroup.classList.add('slider-group');
	
		// Create the input element (slider)
		const slider = document.createElement('input');
		slider.type = 'range';
		slider.id = id;
		slider.classList.add('filter-slider');
		slider.min = min;
		slider.max = max;
		slider.value = value;
		slider.step = step;
	
		// Create the label for the slider
		const label = document.createElement('label');
		label.setAttribute('for', id);
		label.innerHTML = `${id.charAt(0).toUpperCase() + id.slice(1)}: <span id="${id}_label">${value}%</span>`;
	
		// Append the slider and label to the slider group
		sliderGroup.appendChild(slider);
		sliderGroup.appendChild(label);
	
		// Update the label dynamically when the slider value changes
		slider.addEventListener('input', function() {
			const labelText = document.getElementById(`${id}_label`);
			labelText.textContent = `${this.value}%`;
		});
	
		return sliderGroup;  // Return the entire slider group element
	}
	
	

	function addFormListeners() {
		var isSelectAllProcessing = false;
	
		// Handle form change events
		$('form').change(function () {
			console.log("form update");
			
			// Only proceed if select-all is not being processed
			if (!isSelectAllProcessing) {
				$('input[name="Titel"]').val(''); // Reset Titel input
				werkSearchCount();
			}
		});
		
		// Handle select/deselect all checkboxes in the group
		$('.select-all').change(function () {
			isSelectAllProcessing = true;
	
			var $checkboxGroup = $(this).closest('.filter-group').find('input[type="checkbox"]:not(.select-all)');
			var isChecked = $(this).prop('checked');
	
			// Select/deselect all checkboxes
			$checkboxGroup.prop('checked', isChecked);
	
			// Trigger a form change event for the entire group only once
			if (isChecked) {
				$checkboxGroup.trigger('change');
			}
	
			// After select-all is processed, re-enable form change events
			setTimeout(function() {
				isSelectAllProcessing = false; 
				werkSearchCount();
			}, 0); 
		});
	}

	function getAttrOrDefault(attr, defaultval) {
		if (typeof attr !== typeof undefined && attr !== false) {
			return attr;
		} else {
			return defaultval;
		}
	}

	function renderForm($out, dp) {
		var wtype = $out.attr('data-type'),
			inputtype = getAttrOrDefault($out.attr('data-input'), 'checkbox');

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

	function titleSearch() {
		$("#inputYear, #werkNumber").val(''); 
		const visibleTitle = $(this).find('.display').text().trim();
		$("#searchTitleInput").val(visibleTitle);
		werkSearchCount();
	}

	function yearSearch() {
		$("#searchTitleInput, #werkNumber").val(''); 
		$('#inputYear').val(this.innerHTML);
		clusterTitle.update(titlelist_uniqueEntries);
		werkSearchCount();
	}

	function werkNoSearch() {
		$("#searchTitleInput, #inputYear").val(''); 
	}

	// Run search
	$('#start').on('click', function (e) {
		e.preventDefault();
		e.stopPropagation();
		$('#worksMenuItem').click();
	});

	// Random search
	$('#random').on('click', function () {
		werkSearchRandom();
		$('#worksMenuItem').trigger('click', [false]);
	});

	// Reset search
	$('#restart').on('click', function () {
		werkSearchReset();
		$("#searchMenuItem").click();
	});

	// Pagination
	$('#more').click(werkSearchNext);

	// Title, Year Search
	$('#contentAreaTitle').on('click', 'div', titleSearch);
	$('#contentAreaYear').on('click', 'div', yearSearch);
	$('#werkNumber').on('keyup', werkNoSearch);

	// Main nav tabs
	$('.main-nav-item').on('click', function (e, startSearch = true) {
		// Normal tab switching logic
		$('.main-nav .main-nav-item').removeClass('active');
		$('.main .main-pane').removeClass('active');
		$(this).addClass('active');
		var activeSection = $(this).attr("href");
		$(activeSection).addClass('active');
		$('html, body').animate({ scrollTop: 0 }, 'fast');

		if (history.pushState) {
			var params = new URLSearchParams(window.location.search);
			var tabId = $(this).attr('id').replace("MenuItem", "");
			params.set('tab', tabId); 
			var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
			window.history.pushState({ path: newUrl }, '', newUrl);
		}

		// Check if startSearch is true
		if (startSearch) {
			werkSearchStart(); // Start the search if startSearch is true
		}
	});

	// Search tab styling on click
	$('#search .nav-link').click(function () {
		$('#search .nav-item.nav-link').removeClass('active');
		if (history.pushState) {
			var params = new URLSearchParams(window.location.search);
			var modeId = $(this).attr('id').replace("SearchMode", "");			
			params.set('mode', modeId); 
			var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
			window.history.pushState({ path: newUrl }, '', newUrl);
		}
	});

	// Search when user types
	$('.dynamic-input').on('input', function () {
		// Clear the previous timer to reset the delay every time the user types
		clearTimeout(typingTimer);

		// Set a new timer
		typingTimer = setTimeout(() => {
			// Trigger the 'change' event on the form after the delay
			$(this).closest('form').trigger('change');
		}, doneTypingInterval);
	});

	// Handle the keyup event
	$('#searchTitleInput').on('keyup', function () {
		let result = [];
		let searchTerm = $(this).val().toLowerCase();

		if (searchTerm) {
			// Loop through the title list and filter based on input value
			$.each(titlelist_uniqueEntries, function (index, word) {
				word = word.slice(5, -6); // Remove <div></div> from the word
				if (searchTerm.length == 1) {
					if (word.toLowerCase().startsWith(searchTerm)) {
						result.push('<div>' + word + '</div>');
					}
				} else {
					if (word.toLowerCase().indexOf(searchTerm) > -1) {
						result.push('<div>' + word + '</div>');
					}
				}
			});
		} else {
			// If no input, show a fallback message or return the full list
			result = titlelist_uniqueEntries;
		}

		// Update the cluster title with the result
		clusterTitle.update(result);
	});

	$('#inputYear').on('keyup', function () {
		let result = [];
		let searchTerm = $(this).val().toLowerCase();

		if (searchTerm) {
			// Loop through the year list and filter based on the input value
			$.each(yearlist, function (index, word) {
				word = word.slice(5, -6); // Removes <div></div> from the word
				// Case for just one letter
				if (word.toLowerCase().startsWith(searchTerm)) {
					result.push('<div>' + word + '</div>');
				}
			});
		} else {
			// If no input, return the entire list
			result = yearlist;
		}

		// Update the cluster with the results
		clusterYear.update(result);
	});

	$('#resultOrder').on('change', function () {
		// Call the function when the selection changes
		werkSearchStart();
	});	


	// Save all result images
	$('#selectAllResults').on('click', function (e) {
		e.preventDefault();
		e.stopPropagation();

		// Count the number of elements with the class 'check'
		const totalChecks = $('.check').length;

		// If more than 50 elements, show the modal
		if (totalChecks > 50) {
			// Set the message for the modal
			$('#modalMessage').text(`Wollen Sie ${totalChecks} Werke zu ihrer Liste hinzufügen?`);

			// Show the modal
			$('#confirmationModal').modal('show');

			// Handle the "Proceed" button click inside the modal
			$('#confirmSelection').off('click').on('click', function () {
				// Proceed with checking the checkboxes
				$('.check').prop('checked', true);
				$('.check').trigger('change');

				// Close the modal
				$('#confirmationModal').modal('hide');
			});

		} else {
			// If 50 or fewer elements, proceed with checking the checkboxes
			$('.check').prop('checked', true);
			$('.check').trigger('change');
		}
	});

	// Delete local storage -> Delete saved images
	$('#deleteSavedList').on('click', function (e) {
		e.preventDefault();
		e.stopPropagation();
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
			if (!file) {return;}
			try {
				const text = await file.text();
				localStorage.setItem('selectedItems', text);
				loadSavedItems();
			} catch (error) {
				console.error('Error parsing JSON:', error);
			}
		}
		input.click();
	});

	// Start search
	$(document).on('keydown', function (e) {
		if (e.key === 'Enter') {
			e.preventDefault(); // Prevent any default Enter key behavior
			// Check if #searchMenuItem has the 'active' class
			if ($('#searchMenuItem').hasClass('active') && !$('#start').hasClass('disabled')) {
				$('#worksMenuItem').trigger('click', [true]);
				return;
			}
			if ($('#worksMenuItem').hasClass('active')) {
				$('#searchMenuItem').trigger('click');
				$('#searchTitleInput').focus();
				return;
			}
		}
		if (e.key === 'Backspace') {
			if ($('#worksMenuItem').hasClass('active')) {
				e.preventDefault();
				$('#searchMenuItem').trigger('click');
				$('#searchTitleInput').focus();
				return
			}
			if (!$(e.target).is('input[type="text"], textarea, [contenteditable]')) {				
				if ($('#searchMenuItem').hasClass('active')) {
					$('#restart').trigger('click');
					$('#searchTitleInput').focus();
					return
				}

				// Prevent default behavior to avoid navigating back in history
				
			}
		}
	});
})();

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

	// Handle category selectors
	category_selectors.forEach(function (category) {
		if (params[category]) {
			// Split the parameter by '|' to get the individual values
			var values = params[category].split('|');
			// Use the constructed ID to check each corresponding checkbox or input
			values.forEach(function (value) {
				var inputID = category + value;
				$('#' + inputID).prop('checked', true);
				console.log("checked:" + inputID);
			});
		}
	});

	// Handle tab selection from the 'tab' parameter
	if (params.tab) {
		var tabId = params.tab + "MenuItem";
		var $tab = $('#' + tabId);
		if ($tab.length) {
			$tab.trigger('click', [false]); // Trigger click on the tab, passing `false` to avoid a redundant search
		}
	}

	console.log("load");
	
	// Handle mode selection from the 'mode' parameter
	if (params.mode) {
		var modeId = params.mode + "SearchMode";
		var $mode = $('#' + modeId);
		if ($mode.length) {
			$mode.trigger('click'); 
		}
	}

	// Trigger the search if params have been found
	werkSearchStart(null, 1, false, true);
}
