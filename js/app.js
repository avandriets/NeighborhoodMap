var map;
var infowindow;

// Init data for list and map
var locationMarkers = [
    {
        name: "Kiev Pechersk Lavra",
        position: {lat: 50.434167, lng: 30.559167}
    },
    {
        name: "Mother Motherland, Kiev",
        position: {lat: 50.426521, lng: 30.563187}
    },
    {
        name: "St Andrew's Church, Kiev",
        position: {lat: 50.443889, lng: 30.518056}
    },
    {
        name: "Vydubychi Monastery",
        position: {lat: 50.4168, lng: 30.5674}
    },
    {
        name: "Saint Vladimir Hill",
        position: {lat: 50.456772, lng: 30.5263}
    }
];

// to ask if map loaded or nor
var map_timeout = setTimeout(function () {
    if (!window.google || !window.google.maps) {
        //$("#loading_map_error").css("display", "block");
        document.getElementById('loading_map_error').style.display = 'block';
        console.log("Error loading map");
    }
}, 5000);


//Init google map class
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 50.434167, lng: 30.559167},
        zoom: 13
    });

    //first init marker array
    locationsModel.filteredLocations().forEach(function (element) {
        var marker = new google.maps.Marker({
            position: {lat: element.lat, lng: element.lng},
            map: map,
            title: element.name
        });

        element.marker = marker;

        marker.addListener('click', function () {
            locationsModel.itemClick(element);
        });

    });
}

//JQuery resize function for resizing map
$(window).resize(function () {
    var h = $(window).height(),
        offsetTop = 60; // Calculate the top offset
    $('#map').css('height', (h - offsetTop));
}).resize();


// Class to represent a row in the seat reservations grid
function LocationsStore(data) {
    var self = this;

    self.name = data.name;
    self.lat = data.position.lat;
    self.lng = data.position.lng;
    self.marker = null;
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    locationsModel.locationsList().forEach(function (element) {
        element.marker.setMap(null);
    });
}

function showInfoWindow(title, description, url, element) {
    var contentString =
        '<h1>' + element.name + '</h1>' +
        '<div>' +
        '<p>' + description + '</p>' +
        '</div>' +
        '<a href="' + url + '">' + url + '</a>';

    if (infowindow) {
        infowindow.close();
    }

    infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    infowindow.open(map, element.marker);
}

// Overall viewmodel for this screen, along with initial state
function LocationsViewModel() {
    var self = this;

    //current selected location
    self.selectedLocation = ko.observable();

    //Search string
    self.query = ko.observable("");

    self.locationsList = ko.observableArray([]);

    locationMarkers.forEach(function (element) {
        self.locationsList.push(new LocationsStore(element))
    });

    // to handle item click
    self.itemClick = function (element) {
        self.selectedLocation = element;

        //error handling for JSONP
        var wiki_timeout = setTimeout(function () {
            showInfoWindow(element.name, "Cannot load data from wikipedia", "", element);
        }, 8000);

        //AJAX request for wiki data
        $.ajax({
            url: '//en.wikipedia.org/w/api.php',
            data: {action: 'opensearch', search: element.name, format: 'json'},
            dataType: 'jsonp'
        }).done(
            function (x) {
                var title = x[1][0];
                var description = x[2][0];
                var url = x[3][0];

                showInfoWindow(title, description, url, element);

                clearTimeout(wiki_timeout);
            });
    };

    // filter list
    self.filteredLocations = ko.computed(function () {
        //query string
        var filter = self.query().toLowerCase();

        if (!filter) {

            //init markers
            if (map) {
                self.locationsList().forEach(function (element) {
                    element.marker.setMap(map);
                });
            }

            return self.locationsList();
        } else {
            clearMarkers();
            return ko.utils.arrayFilter(self.locationsList(), function (item) {
                var result = item.name.toLowerCase().indexOf(filter) !== -1;

                //init marker on map
                if (result && item.marker && map) {
                    item.marker.setMap(map);
                }

                return result;
            });
        }
    });
}

//init model
var locationsModel = new LocationsViewModel();

//init bindings
ko.applyBindings(locationsModel);