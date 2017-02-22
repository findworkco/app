// Load in our dependencies
var assert = require('assert');
var $ = require('jquery');

// When we bind our plugin
exports.init = function (containerEl) {
  // Find all partial research company forms
  // DEV: We couldn't use Turbolinks/PJAX as these are split forms
  $(containerEl).find('[data-research-company-partial]').each(function handleAutosizeEl (i, formEl) {
    // Resolve our elements
    // DEV: We could be fancy and dynamically replace elements based on `ids` from response
    //   but this is saner for now as errors will be explicit about not finding matches
    var targetUrl = '/research-company';
    var companyNameEl = formEl.querySelector('input[name=company_name]'); assert(companyNameEl);
    var csrfTokenEl = formEl.querySelector('input[name=x-csrf-token]'); assert(csrfTokenEl);
    var searchEl = formEl.querySelector('#search-btn'); assert(searchEl);
    var partialFormErrorsEl = formEl.querySelector('#partial-form-errors'); assert(partialFormErrorsEl);
    var glassdoorResultsEl = formEl.querySelector('#glassdoor-results'); assert(glassdoorResultsEl);
    var angellistResultsEl = formEl.querySelector('#angellist-results'); assert(angellistResultsEl);

    // Define our search logic
    // DEV: We could have throttling logic but disabling our button works good enough
    function handleSuccess(htmlStr) {
      // Parse our content
      // https://api.jquery.com/jquery.parsehtml/
      // DEV: We use a wrapper `<div>` node for elegant grouping
      // TODO: Weigh out using jQuery.parseHTML vs innerHTML (security risk vs size)
      var replaceEl = $.parseHTML('<div>' + htmlStr + '</div>')[0];
      assert(replaceEl);

      // Replace our results
      var replacementGlassdoorResultsEl = replaceEl.querySelector('#glassdoor-results');
      assert(replacementGlassdoorResultsEl);
      var replacementAngellistResultsEl = replaceEl.querySelector('#angellist-results');
      assert(replacementAngellistResultsEl);
      glassdoorResultsEl.parentNode.replaceChild(replacementGlassdoorResultsEl, glassdoorResultsEl);
      glassdoorResultsEl = replacementGlassdoorResultsEl;
      angellistResultsEl.parentNode.replaceChild(replacementAngellistResultsEl, angellistResultsEl);
      angellistResultsEl = replacementAngellistResultsEl;

      // Complete our request
      handleCompletion();
    }
    function handleError(err) {
      // Output an error on our form
      partialFormErrorsEl.textContent = 'Failed to retrieve results. Please try again later.';
      $(partialFormErrorsEl).removeClass('hidden');

      // Re-enable form
      handleCompletion();

      // Throw error to notify developers
      throw err;
    }
    function handleCompletion() { // jshint ignore:line
      companyNameEl.removeAttribute('disabled');
      searchEl.removeAttribute('disabled');
      $(formEl).removeClass('muted');
    }
    function updateResults() {
      // Remove any existing errors
      $(partialFormErrorsEl).addClass('hidden');

      // Disable our search button and make our form "load"
      companyNameEl.setAttribute('disabled', 'disabled');
      searchEl.setAttribute('disabled', 'disabled');
      $(formEl).addClass('muted');

      // Make our AJAX request
      // http://youmightnotneedjquery.com/#post
      // http://youmightnotneedjquery.com/#request
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/open
      var request = new XMLHttpRequest();
      request.open('POST', targetUrl, true);
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      request.setRequestHeader('X-Partial', '1');
      request.onload = function () {
        if (request.status === 200) {
          handleSuccess(request.responseText);
        } else {
          handleError(
            new Error('Received unexpected status code from `/research-form` "' + request.status + '"'));
        }
      };
      request.onerror = function (err) {
        handleError(err);
      };
      var dataStr = [
        'x-csrf-token=' + encodeURIComponent(csrfTokenEl.value),
        'company_name=' + encodeURIComponent(companyNameEl.value)
      ].join('&');
      request.send(dataStr);
    }

    // When a key is being pressed in our input box
    // https://github.com/ccampbell/mousetrap/blob/1.6.0/mousetrap.js#L328-L350
    companyNameEl.addEventListener('keydown', function handleKeydown (evt) {
      // If enter is being pressed for a submission (e.g. Ctrl+Enter, Super+Enter)
      if (evt.keyCode === 13 && (evt.ctrlKey || evt.metaKey)) {
        // Prevent our default action
        evt.preventDefault();
        evt.stopPropagation();

        // Run our custom submission
        updateResults();
      }
    });

    // Override search link to act like a button
    searchEl.addEventListener('click', function handleClick (evt) {
      // Prevent our default action
      evt.preventDefault();
      evt.stopPropagation();

      // If we are disabled, then stop event
      // DEV: We could update element to a `button` but then our context menu is lost
      // DEV: We use `attribute` instead of `.disabled` due to links not having said property
      if (searchEl.getAttribute('disabled')) {
        return;
      }

      // Perform our search
      updateResults();
    });

    // If we have a company name, then fetch now
    if (companyNameEl.value) {
      updateResults();
    }
  });
};
