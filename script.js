// sheetID you can find in the URL of your spreadsheet after "spreadsheet/d/"
const sheetId = "1oea0EZsCaTb1viVIPzve-80LwA1zhT1ulmZrYn2lBzc";
// sheetName is the name of the TAB in your spreadsheet (default is "Sheet1")
const sheetName = encodeURIComponent("Réponses au formulaire 1");
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

// Initialize the Leaflet map, centered on the world with a default zoom level of 2
const map = L.map('map').setView([51.505, -0.09], 1);

// Add the OpenStreetMap tile layer to the map (background map imagery)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let apiKey = 'AIzaSyCEhsnCONNwmXa_EhQ-IfkHmsqI-wAPX2E'


/* function geocode(data) {
    let apiUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=' + apiKey;
    
    
    let response = UrlFetchApp.fetch(apiUrl);
    let data = JSON.parse(response.getContentText());
    
    if (data.status == 'OK') {
      let location = data.geometry.location;
      return [location.lat, location.lng];
    } else {
      Logger.log("Geocoding failed: " + data.status);
      return ['Not found', 'Not found'];
    }
} */


// Function to handle the Google Sheet data and place markers on the map
function showInfo(data) {
    console.log('Data fetched from Google Sheets:', data); // Log fetched data to the console
    
    $.ajax({
        type: "GET",
        url: sheetURL,
        dataType: "text",
        success: function (response) {
          // let data = $.csv.toArrays(response);
          let data = $.csv.toObjects(response);
          console.log(data);
          // 'data' is an Array of Objects
          // ADD YOUR CODE HERE
 // Loop through each row of the sheet data
 data.forEach(function(member) {
    console.log('Processing member:', member);  // Log each member data to see what's being processed
    /* if (member.LatHome == "" || member.LonHome == "" || member.LatCorp == "" || member.LonCorp == ""){

        let LatHome = geocode(member.Adresse)[0]
        let LonHome = geocode(member.Adresse)[1]
        let LatCorp = geocode(member.AdresseEntreprise)[0]
        let LonCorp = geocode(member.AdresseEntreprise)[1]

    } */

        let lat = parseFloat(member.LatHome);   // Convert latitude to a floating-point number
        let lon = parseFloat(member.LonHome);  // Convert longitude to a floating-point number
    
    console.log(lat)
    console.log(lon)
    // Check if the latitude and longitude are valid numbers
    if (!isNaN(lat) && !isNaN(lon)) {
        // Add a marker to the map for each member's location
        L.marker([lat, lon]).addTo(map)
            .bindPopup(member.Nom + ' - ' + member.Adresse);  // Display the member's name and role on clicking the marker
    }
});
},


        })
      }

      // Call the init function when the page loads
      window.addEventListener('DOMContentLoaded', showInfo);
   



