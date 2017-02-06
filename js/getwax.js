// Define variable autocomplete to use in getWax fnc
var autocomplete;
// Fnc to initiate google places search
function initPlaces() {
    // Testing Google autocomplete
    var input = document.getElementById("location");
    var options = {
        types: ['geocode'],
    };
    autocomplete = new google.maps.places.Autocomplete(input, options);
    // Fire getWax when user selects a place
    autocomplete.addListener('place_changed', getWax);
}
// Fire initPlaces fnc on window load
window.onload = initPlaces;

// Defining wax object here with constructor function.
var Wax = function Wax(name, brand, type, maxTempNew, minTempNew, maxTempOld, minTempOld, score) {
    this.name = name;
    this.brand = brand;
    this.type = type;
    this.maxTempNew = maxTempNew;
    this.minTempNew = minTempNew;
    this.maxTempOld = maxTempOld;
    this.minTempOld = minTempOld;
    this.score = score;

    //Method to calculate mean temp for new and old snow
    this.meanTempNew = function() {
        return (this.maxTempNew + this.minTempNew) / 2;
    };

    this.meanTempOld = function() {
        return (this.maxTempOld + this.minTempOld) / 2;
    };

}

// Defining waxes as objects of type "Wax" here
// IDEA Store as JSON in seperate file? Why not?
// BUG With temp above 0 nothing gets output
var allWaxes = [
    swixViolet = new Wax("V50 Violet", "Swix", "Hard", 0, 0, -1, -3),
    swixVioletSpecial = new Wax("V45 Violet Special", "Swix", "Hard", 0, -3, -2, -6),
    swixBlue = new Wax("V30 Blue", "Swix", "Hard", -2, -10, -5, -15),
    swixBlueExtra = new Wax("V40 Blue Extra", "Swix", "Hard", -1, -7, -3, -10),
    swixGreen = new Wax("V20 Green", "Swix", "Hard", -8, -15, -10, -18),
    swixPolar = new Wax("V05 Polar", "Swix", "Hard", -12, -25, -15, -30),
    tokoXcold = new Wax("Nordic GripWax X-cold", "Toko", "Hard", -12, -30, -12, -30),
    tokoBlue = new Wax("Nordic GripWax Blue", "Toko", "Hard", -7, -30, -7, -30),
    tokoRed = new Wax("Nordic GripWax Red", "Toko", "Hard", -2, -10, -2, -10),
    tokoYellow = new Wax("Nordic GripWax Yellow", "Toko", "Hard", -0, -2, -0, -2),
    rodeVerdeSpecial = new Wax("Verde Special", "Rode", "Hard", -10, -30, -10, -30),
    rodeVerde = new Wax("Verde", "Rode", "Hard", -7, -15, -7, -15),
    rodeBlueMultigrade = new Wax("Blue Multigrade", "Rode", "Hard", -5, -12, -5, -12),
    rodeBlue = new Wax("Blue", "Rode", "Hard", -2, -8, -2, -8),
    rodeBlueSuper = new Wax("Blue Super", "Rode", "Hard", -3, -10, -3, -10),
    violaMultigrade = new Wax("Viola Multigrade", "Rode", "Hard", -3, -5, -3, -5),
    viola = new Wax("Viola", "Rode", "Hard", -2, -4, -2, -4),
    violaExtra = new Wax("Viola Extra", "Rode", "Hard", 0, -3, 0, -3),
    rotExtra = new Wax("Rot Extra", "Rode", "Hard", 0, 2, 0, 2),
    rossa = new Wax("Rossa", "Rode", "Hard", 0, 3, 0, 3),
    gialla = new Wax("Gialla", "Rode", "Hard", 1, 4, 1, 4),

];

// Algorithm below
function getWax() {
    // Toggle (show) loading animation
    $(".loader").toggle();

    // Get place from selected. Also get that places lat and lng
    var place = autocomplete.getPlace();
    console.log(place);
    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();

    // Clear results text
    $("#result-text").text(" ");

    // Get weather from darksky
    $.getJSON('https://api.darksky.net/forecast/84a24391238d88aafa3e06aac7073214/' + lat + ',' + lng + '?lang=sv&units=si&exclude=minutely,hourly,daily,alerts,flags', function(weatherData) {
        console.log(weatherData);
        // Get degrees from weather data
        var degrees = weatherData.currently.temperature;
        // See if it's snowing
        var precip = weatherData.currently.precipType;

        // Set the score for each wax
        for (var i = 0; i < allWaxes.length; i++) {

            // First, determine which temperature to use depending on snow conditions
            if (precip == "snow") {
                var meanTemp = allWaxes[i].meanTempNew();
                var maxTemp = allWaxes[i].maxTempNew;
                var minTemp = allWaxes[i].minTempNew;
                var snowText = "och snöar";
            } else {
                var meanTemp = allWaxes[i].meanTempOld();
                var maxTemp = allWaxes[i].maxTempOld;
                var minTemp = allWaxes[i].minTempOld;
                var snowText = "";
            }
            // Then run scoring function with appropriate temp
            scoreWax(allWaxes[i], meanTemp, maxTemp, minTemp, degrees);
        }

        $("#result-text").text('Eftersom det är ' + degrees + '°C ' + snowText + ' rekommenderar vi:');

        // Check if user has already selected filters
        if ($('select.filter-brand').val() != null) {
            // If they have, use them straight away
            filterFunc();
        } else {
            // Create the results list from allWaxes array
            createList(allWaxes);
        }

        // Init results animation
        $(".results-container, #location, .footer").addClass('active');

        // Toggle (remove) loading animation
        $(".loader").toggle();

    }); // End ajax function for getting weather

}; // End of getWax function

// Clear input on focus
$("#location").focus(function() {
    $("#location").val("");
});

// Run filtering function every time the value of the dropdown changes
$('.filter-brand').change(function() {
    filterFunc();
});

// Filtering function
function filterFunc() {
    // First get the values from the dropdown
    var filter = $('select.filter-brand').val();
    // To handle errors, make sure the dropdown is not null
    // If it is, just create the list with all waxes
    if (filter != null) {
        // Declare empty array for filters
        var filtered = [];

        // Filter each wax by brand by what user has selected.
        // Concatinate arrays since we're showing multiple brands
        for (var i = 0; i < filter.length; i++) {
            var addToFilter = allWaxes.filter(function(waxes) {
                return waxes.brand == filter[i];
            });
            filtered = filtered.concat(addToFilter);
        }
        // Create list with the filtered list
        createList(filtered);
    } else {
        // If dropdown was null...
        createList(allWaxes);
    }
}

// Scoring function
function scoreWax(wax, meanTemp, maxTemp, minTemp, degrees) {
    // Set score to 10 minus the difference between mean temp and actual temp
    // the 10 is there to make the higher score win.
    var score = 10 - (Math.abs(degrees - meanTemp));
    score = score*10;
    wax.score = Math.round(score*100)/100;

}

// Draw list
function createList(list) {
    $("#results-list").html(" ");
    // Sort array by score
    list.sort(function(a, b) {
            return parseFloat(b.score) - parseFloat(a.score);
        })
        // Append li's with waxes
    for (var i = 0; i < list.length; i++) {
        $("#results-list").append("<div class='wax' id=" + list[i].brand + "><span class='score'>" + list[i].score + "</span><div class='seperator'></div><div class='wax-text'><p class='name'><strong>" + list[i].name + "</strong></p><p class='brand'>" + list[i].brand + "</p></div><img class='chevron' src='images/chevron.png'></div>");
    } // End for-loop
}

// Init multi select
$('.filter-brand').select2({
  placeholder: 'alla varumärken',
  dropdownAutoWidth: true,
});
