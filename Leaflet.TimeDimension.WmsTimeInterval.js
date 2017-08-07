L.TimeDimension.WmsTimeInterval = L.TimeDimension.extend({
    initialize: function (options) {
        //this.options.limitSliders=false;
        L.TimeDimension.prototype.initialize.call(this, options);
        this._fixedStartTimeValue = null;    
    },

    getfixedStartTimeValue: function () {
        if (this._availableTimes.length > 0) {
            this._fixedStartTimeValue = this._availableTimes[this._lowerLimit || 0]
        }
        return this._fixedStartTimeValue;
    },

    removesyncedLayers: function (){
        for (var i = 0, len = this._syncedLayers.length; i < len; i++) {
            this._syncedLayers[i]._removeAllLayers();            
        }
    },

    setAvailableTimes: function (times, mode) {
        L.TimeDimension.prototype.setAvailableTimes.call(this, times, mode);
        if (this._availableTimes.length > 0) {
            this._fixedStartTimeValue = this._availableTimes[0];
        }
     },

    setLowerLimitIndex: function (index) {
        this._lowerLimit = Math.min(Math.max(index || 0, 0), this._upperLimit || this._availableTimes.length - 1);
        this._fixedStartTimeValue=this._availableTimes[this._lowerLimit];
        this.fire('limitschanged', {
            lowerLimit: this._lowerLimit,
            upperLimit: this._upperLimit
        });
    },    
});

L.Control.TimeDimension.WmsTimeInterval =  L.Control.TimeDimension.extend({        
    initialize: function(options) {
        L.Util.setOptions(this, options);
        L.Control.TimeDimension.prototype.initialize.call(this, options);        
    },

    _update: function() {
         if (!this._timeDimension) {
             return;
         }
         if (this._timeDimension.getCurrentTimeIndex() >= 0) {
             var date = new Date(this._timeDimension.getCurrentTime());
             if (this._displayDate) {
                L.DomUtil.removeClass(this._displayDate, 'loading');
                this._setDisplayDateValue(date);                     
             }
             if (this._sliderTime && !this._slidingTimeSlider) {
                this._sliderTime.setValue(this._timeDimension.getCurrentTimeIndex());
             }
         } else {
             if (this._displayDate) {
                 this._displayDate.innerHTML = this._getDisplayNoTimeError();
             }
         }
    },

     _createSliderTime: function(className, container) {
         var sliderContainer,
             sliderbar,
             max,
             knob, limits;            
         sliderContainer = L.DomUtil.create('div', className, container);        
         sliderbar = L.DomUtil.create('div', 'slider', sliderContainer);
         max = this._timeDimension.getAvailableTimes().length - 1;
 
         if (this.options.limitSliders) {             
             limits = this._limitKnobs = this._createLimitKnobs(sliderbar);
         }
         knob = new L.UI.Knob(sliderbar, {
             className: 'knob main',
             rangeMin: 0,
             rangeMax: max
         });
         knob.on('dragend', function(e) {
             var value = e.target.getValue();
             this._sliderTimeValueChanged(value);
             this._slidingTimeSlider = false;
         }, this);
         knob.on('drag', function(e) {
             this._slidingTimeSlider = true;
             var time = this._timeDimension.getAvailableTimes()[e.target.getValue()];
             if (time) {
                 var date = new Date(time);
                 if (this._displayDate) {
                     this._setDisplayDateValue(date);
                 }
                 if (this.options.timeSliderDragUpdate){
                     this._sliderTimeValueChanged(e.target.getValue());
                 }
             }
         }, this);
 
         knob.on('predrag', function() {
             var minPosition, maxPosition;
             if (limits) {
                 //limits the position between lower and upper knobs
                 minPosition = limits[0].getPosition();
                 maxPosition = limits[1].getPosition();
                 if (this._newPos.x < minPosition) {
                     this._newPos.x = minPosition;
                 }
                 if (this._newPos.x > maxPosition) {
                     this._newPos.x = maxPosition;
                 }
             }
         }, knob);
         L.DomEvent.on(sliderbar, 'click', function(e) {
             if (L.DomUtil.hasClass(e.target, 'knob')) {
                 return; //prevent value changes on drag release
             }
             var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
                 x = L.DomEvent.getMousePosition(first, sliderbar).x;
             if (limits) { // limits exits
                 if (limits[0].getPosition() <= x && x <= limits[1].getPosition()) {
                     knob.setPosition(x);
                     this._sliderTimeValueChanged(knob.getValue());
                 }
             } else {
                 knob.setPosition(x);
                 this._sliderTimeValueChanged(knob.getValue());
             }
 
         }, this);
         knob.setPosition(0);
 
         return knob;
    },

        
    _createLimitKnobs: function(sliderbar) {
        L.DomUtil.addClass(sliderbar, 'has-limits');
        var max = this._timeDimension.getAvailableTimes().length - 1;
        var rangeBar = L.DomUtil.create('div', 'range', sliderbar);        
        var lknob = new L.UI.Knob(sliderbar, {
            className: 'knob lower', 
             rangeMin: 0,
             rangeMax: max
         });
         var uknob = new L.UI.Knob(sliderbar, {
            className: 'knob upper hidden', 
             rangeMin: 0,
             rangeMax: max
        });        
   
         L.DomUtil.setPosition(rangeBar, 0);
         lknob.setPosition(0);
         uknob.setPosition(max);
 
        //Add listeners for value changes       
         lknob.on('dragend', function(e) {
             var value = e.target.getValue();
             this._sliderLimitsValueChanged(value, uknob.getValue());
            if (this._timeDimension.getfixedStartTimeValue()){
                this._timeDimension.removesyncedLayers();
                this._timeDimension.setCurrentTimeIndex(this._timeDimension.getCurrentTimeIndex());
            }
         }, this);
         uknob.on('dragend', function(e) {
             var value = e.target.getValue();
             this._sliderLimitsValueChanged(lknob.getValue(), value);
         }, this);
        lknob.on('drag', function(e) {
            //this._slidingTimeSlider = true;
            var time = this._timeDimension.getAvailableTimes()[e.target.getValue()];
            if (time) {
                var date = new Date(time);
                if (this._displayDate) {
                    this._setDisplayDateValue(null,date);
                }               
            }
        }, this);
         //Add listeners to position the range bar
         lknob.on('drag positionchanged', function() {
             L.DomUtil.setPosition(rangeBar, L.point(lknob.getPosition(), 0));
             rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
         }, this);
 
         uknob.on('drag positionchanged', function() {
             rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
         }, this);
 
         //Add listeners to prevent overlaps
         uknob.on('predrag', function() {
             //bond upper to lower
             var lowerPosition = lknob._toX(lknob.getValue() + this.options.limitMinimumRange);
             if (uknob._newPos.x <= lowerPosition) {
                 uknob._newPos.x = lowerPosition;
             }
         }, this);
 
         lknob.on('predrag', function() {
             //bond lower to upper
             var upperPosition = uknob._toX(uknob.getValue() - this.options.limitMinimumRange);
             if (lknob._newPos.x >= upperPosition) {
                 lknob._newPos.x = upperPosition;
             }
         }, this);
 
         lknob.on('dblclick', function() {
             this._timeDimension.setLowerLimitIndex(0);
         }, this);
         uknob.on('dblclick', function() {
             this._timeDimension.setUpperLimitIndex(this._timeDimension.getAvailableTimes().length - 1);
         }, this);
 
         return [lknob, uknob];
    },

    _setDisplayDateValue: function(date,ldate){
        if (this._timeDimension.getfixedStartTimeValue())
        {                    
            if (!ldate)
                ldate=new Date(this._timeDimension.getfixedStartTimeValue());
            if (!date)
                date=new Date(this._timeDimension.getCurrentTime());
            this._displayDate.innerHTML = this._getDisplayDateFormat(ldate) +
                '<span class="timecontrol-dateseparator"></span>' + 
                this._getDisplayDateFormat(date);
        }
        else
        {
            this._displayDate.innerHTML = this._getDisplayDateFormat(date);
        }
     }

});

L.Map.addInitHook(function() {
    if (this.options.timeDimensionWmsTimeInterval) {
        this.timeDimension =L.timeDimension.wmsTimeInterval(this.options.timeDimensionOptions || {});
    }
    if (this.options.timeDimensionControlWmsTimeInterval) {        
        this.timeDimensionControl = L.control.timeDimension.wmsTimeInterval(this.options.timeDimensionControlOptions || {});
        this.addControl(this.timeDimensionControl);        
    }
});

L.control.timeDimension.wmsTimeInterval = function(options) {
    return new L.Control.TimeDimension.WmsTimeInterval(options);
};


L.TimeDimension.Layer.WMS.WmsTimeInterval = L.TimeDimension.Layer.WMS.extend({

     _createLayerForTime: function(time) {
        var wmsParams = this._baseLayer.options;
        if (this._timeDimension.getfixedStartTimeValue()) {
            wmsParams.time = new Date(this._timeDimension.getfixedStartTimeValue()).toISOString() + "/" + new Date(time).toISOString();
        }
        else {
            wmsParams.time = new Date(time).toISOString();
        }
         return new this._baseLayer.constructor(this._baseLayer.getURL(), wmsParams);
     },

     _removeAllLayers: function(){
         for (var itime in this._layers)
         {
             if (this._map)
                this._map.removeLayer(this._layers[itime]);
            delete this._layers[itime];
         }
    },

    _requestTimeDimensionFromCapabilities: function() {
        if (this._capabilitiesRequested) {
            return;
        }
        this._capabilitiesRequested = true;
        var url = this._getCapabilitiesUrl(); 
        if (this._proxy) {
             url = this._proxy + '?url=' + encodeURIComponent(url);
        }
        $.get(url, (function(data) {
            this._defaultTime = Date.parse(this._getDefaultTimeFromCapabilities(data));
            this._setDefaultTime = this._setDefaultTime || (this._timeDimension && this._timeDimension.getAvailableTimes().length == 0);
            this.setAvailableTimes(this._parseTimeDimensionFromCapabilities(data));
            if (this._setDefaultTime && this._timeDimension) {
                this._timeDimension.setCurrentTime(this._defaultTime);
            }
            //hack to recreate baselayer with correct time range
            if (this._timeDimension.getfixedStartTimeValue()) {
                this._baseLayer = this._createLayerForTime(this._defaultTime);
                this._defaultTime = -1;
                this._timeDimension.setCurrentTimeIndex(this._availableTimes.length - 1);
            }         
        }).bind(this));

     },




});

L.timeDimension.layer.wms.wmsTimeInterval = function (layer, options) {
    return new L.TimeDimension.Layer.WMS.WmsTimeInterval(layer, options);
};

L.timeDimension.wmsTimeInterval=function(timeDimensionOptions)
{
    return new L.TimeDimension.WmsTimeInterval(timeDimensionOptions || {});
}
