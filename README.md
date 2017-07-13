# Leaflet.TimeDimension.WmsTimeInterval
Plugin to add the possibility to display a WMS layers not for a single time but for a startTime/endTime continuos interval if supported by the WMS server (like Geoserver).

How to use:

### TimeDimension WMS layer
instead of 
```javascript
    L.timeDimension.layer.wms
```    
use 
```javascript
    L.timeDimension.layer.wms.wmsTimeInterval
```

### TimeDimension Control

instead of 
```javascript
    var map = L.map('map', {
        ...
        timeDimension: true,
        timeDimensionOptions: {
            ....
        },
        timeDimensionControl: true,
    });
```
use
```javascript
    var map = L.map('map', {
        ...
        timeDimension: true,
        timeDimensionOptions: {
            ....
        },
        timeDimensionControlWmsTimeInterval: true,
    });
```

if creating control outside map initialization, instead of 
```javascript
    var timeDimensionControl = L.control.timeDimension(timeDimensionControlOptions);
```
use
```javascript
    var timeDimensionControl = L.control.timeDimension.wmsTimeInterval(timeDimensionControlOptions);
```
