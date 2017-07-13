# Leaflet.TimeDimension.WmsTimeInterval
Plugin to add the possibility to display a WMS layers not for a single time but for a startTime/endTime continuos interval if supported by the WMS server (like Geoserver).

var timeDimension = new L.TimeDimension.WmsTimeInterval();      

var timeDimensionControlOptions = {
        ....
        lowerSlider: true,
        upperSlider: false,
        ...
    };

timeDimensionControl = new L.Control.TimeDimension.WmsTimeInterval(timeDimensionControlOptions).addTo(map);