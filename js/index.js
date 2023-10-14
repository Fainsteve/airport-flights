// Import polyfill for async support
import '@babel/polyfill';

///////////////////////////////
////// Custom Imports  ///////
//////////////////////////////
import airport_input from './airport.js';

const AIRPORT_URL =
  'https://raw.githubusercontent.com/konsalex/Airport-Autocomplete-JS/master/src/data/airports.json';

let airports;

let fetchTries = false;
let pending = true;

///////////////////////////////
// Airport Autocomplete //////
//////////////////////////////

// Fuse Options, can be overriden from dev
const fuse_options = {
  shouldSort: true,
  threshold: 0.4,
  maxPatternLength: 32,
  keys: [
    {
      name: 'IATA',
      weight: 0.25,
    },
    {
      name: 'name',
      weight: 0.25,
    },
    {
      name: 'city',
      weight: 0.5,
    },
  ],
};

const Formatting = `<div class="$(unique-result)"
                     single-result" 
                     data-index="$(i)"> 
                     $(name) $(IATA) 
                    </br>
                    $(city) ,$(country)
                    </div>`;

const default_options = {
  fuse_options,
  // the formatting of the suggestions
  formatting: Formatting,
  // the maximum number of suggestions
  max_returned_results: 5,
};

/**
 * AirportInput(id, options = default_options)
 * Takes as inputs the following ->
 * id : The id of the input element is the webpage
 * options : A js object defining the Fuse options but also the
 *           formatting of the suggestions; more are going to be added
 *
 */

async function AirportInput(id, options = default_options) {
  const mergedOptions = {
    ...default_options,
    ...options,
  };

  // Create a promise to handle airport data fetching from the RawGit
  const airports_data = new Promise(resolve => {
    const FetchingFunction = () => {
      if (fetchTries) {
        // console.log('I am waiting for another id to fetch the airports');
        if (!pending) {
          clearInterval(cron);
          resolve(airports);
        }
      } else {
        fetchTries = true;
        // Call the fetch function passing the url of the API as a parameter
        fetch(AIRPORT_URL)
          .then(function(response) {
            return response.json();
          })
          .then(data => {
            pending = false;
            airports = data;
            clearInterval(cron);
            resolve(data);
          });
      }
    };
    const cron = setInterval(FetchingFunction, 500);
  });

  if (typeof airports === 'undefined' && pending) {
    airports = await airports_data; // wait till the promise resolves (*)
  }

  airport_input(id, airports, mergedOptions);
}

window.AirportInput = AirportInput;
$(document).ready(function() {
  // Initialize datepickers
  $('#depart-date, #return-date').datepicker({
    dateFormat: 'yy-mm-dd',
    showAnim: 'slideDown',
    minDate: 0,
  });

  // Enable/disable return date input based on radio button selection
  $("input[type='radio']").change(function() {
    $('#return-date').prop('disabled', $('#OneWay').is(':checked'));
  });

  // Handle form submission using jQuery
  function submitForm() {
    $('#myForm').submit();
  }

  // Define a variable to store the airport data
  let airportsData;

  // Fetch airport data from the JSON file
  fetch('Airport-Autocomplete.json')
    .then(response => response.json())
    .then(data => {
      // Extract only "name," "city," and "country" from the JSON data
      airportsData = data.map(airport => ({
        name: airport.name,
        city: airport.city,
        country: airport.country,
      }));

      // Your code to work with the extracted data
      console.log(airportsData);
    })
    .catch(error => {
      console.error('Error loading JSON data:', error);
    });

  // Function to filter and display airport suggestions
  function showSuggestions(inputValue) {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';

    if (!inputValue) return;

    // Filter airports that match the input value
    const matchingAirports = airportsData.filter(airport =>
      airport.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    if (matchingAirports.length === 0) {
      suggestionsContainer.innerHTML = '<div>No matching airports found</div>';
    } else {
      matchingAirports.slice(0, 5).forEach(airport => {
        const suggestionItem = document.createElement('div');
        suggestionItem.textContent = `${airport.name}, ${airport.city}, ${
          airport.country
        }`;
        suggestionItem.addEventListener('click', () => {
          document.getElementById('fromInput').value = airport.name;
          suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(suggestionItem);
      });
    }
  }

  // Listen for user input in the "fromInput" field
  document.getElementById('fromInput').addEventListener('input', e => {
    showSuggestions(e.target.value);
  });
});
