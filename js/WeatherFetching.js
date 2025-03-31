function guessZipCode(){
  // Removed as we're using a hardcoded airport code
  return;
}

function fetchAlerts(){
  var alertCrawl = "";
  fetch(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`)
    .then(function(response) {
        if (response.status !== 200) {
            console.warn("Alerts Error, no alerts will be shown");
        }
      response.json().then(function(data) {
        if (data.features == undefined){
          fetchForecast();
          return;
        }
        if (data.features.length == 1) {
          alerts[0] = data.features[0].properties.event + '<br>' + data.features[0].properties.description.replace("..."," ").replace(/\*/g, "")
          for(var i = 0; i < data.features.length; i++){
            /* Take the most important alert message and set it as crawl text
            This will supply more information i.e. tornado warning coverage */
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");
          }
        }
        else {
          for(var i = 0; i < data.features.length; i++){
            /* Take the most important alert message and set it as crawl text
            This will supply more information i.e. tornado warning coverage */
            alertCrawl = alertCrawl + " " + data.features[i].properties.description.replace("...", " ");

            alerts[i] = data.features[i].properties.event
          }
        }
        if(alertCrawl != ""){
          CONFIG.crawl = alertCrawl;
        }
        alertsActive = alerts.length > 0;
        fetchForecast();
      });
    })
}

function fetchForecast(){
  fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/forecast/daily/10day.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
    .then(function(response) {
      if (response.status !== 200) {
        console.log('forecast request error');
        return;
      }
      response.json().then(function(data) {
        let forecasts = data.forecasts
        // narratives
        isDay = forecasts[0].day; // If the API spits out a day forecast, use the day timings
        let ns = []
        ns.push(forecasts[0].day || forecasts[0].night); // there must be a day forecast so if the API doesn't provide one, just make it the night one. It won't show anyway.
        ns.push(forecasts[0].night);
        ns.push(forecasts[1].day);
        ns.push(forecasts[1].night);
        for (let i = 0; i <= 3; i++) {
          let n = ns[i]
          forecastTemp[i] = n.temp
          forecastIcon[i] = n.icon_code
          forecastNarrative[i] = n.narrative
          forecastPrecip[i] = `${n.pop}% Chance<br/> of ${n.precip_type.charAt(0).toUpperCase() + n.precip_type.substr(1).toLowerCase()}`
        }
        // 7 day outlook
        for (var i = 0; i < 7; i++) {
          let fc = forecasts[i+1]
          outlookHigh[i] = fc.max_temp
          outlookLow[i] = fc.min_temp
          outlookCondition[i] = (fc.day ? fc.day : fc.night).phrase_32char.split(' ').join('<br/>')
          // thunderstorm doesn't fit in the 7 day outlook boxes
          // so I multilined it similar to that of the original
          outlookCondition[i] = outlookCondition[i].replace("Thunderstorm", "Thunder</br>storm");
          outlookIcon[i] = (fc.day ? fc.day : fc.night).icon_code
        }
        fetchRadarImages();
      })
    })
}

function fetchCurrentWeather(){
  // Always use hardcoded KHRO airport code
  let location = `icaoCode=${CONFIG.airportCode}`;
  console.log("Using hardcoded airport:", CONFIG.airportCode);

  fetch(`https://api.weather.com/v3/location/point?${location}&language=${CONFIG.language}&format=json&apiKey=${CONFIG.secrets.twcAPIKey}`)
      .then(function (response) {
          if (response.status == 404) {
              console.log('Location not found!');
              console.log('conditions request error');
              return;
          }
          if (response.status !== 200) {
              console.log("Something went wrong (check the console)");
              console.log('conditions request error');
              return;
          }
      response.json().then(function(data) {
        try {
          // Replace with North Central AR instead of the airport name
          cityName = "North Central AR";
          console.log(cityName);
          
          latitude = data.location.latitude;
          longitude = data.location.longitude;
        } catch (err) {
          console.error('Error retrieving location data', err);
          return;
        }
        fetch(`https://api.weather.com/v1/geocode/${latitude}/${longitude}/observations/current.json?language=${CONFIG.language}&units=${CONFIG.units}&apiKey=${CONFIG.secrets.twcAPIKey}`)
          .then(function(response) {
            if (response.status !== 200) {
              console.log("conditions request error");
              return;
            }
            response.json().then(function(data) {
              // cityName is set in the above fetch call and not this one
              let unit = data.observation[CONFIG.unitField];
              currentTemperature = Math.round(unit.temp);
              currentCondition = data.observation.phrase_32char;
              windSpeed = `${data.observation.wdir_cardinal} ${unit.wspd} ${CONFIG.units === 'm' ? 'km/h' : 'mph'}`;
              gusts = unit.gust || 'NONE';
              feelsLike = unit.feels_like
              visibility = Math.round(unit.vis)
              humidity = unit.rh
              dewPoint = unit.dewpt
              pressure = unit.altimeter.toPrecision(4);
              let ptendCode = data.observation.ptend_code
              pressureTrend = (ptendCode == 1 || ptendCode == 3) ? '▲' : ptendCode == 0 ? '' : '▼'; // if ptendCode == 1 or 3 (rising/rising rapidly) up arrow else its steady then nothing else (falling (rapidly)) down arrow
              currentIcon = data.observation.icon_code
              fetchAlerts();
            });
          });
      })
    });
}

function fetchRadarImages(){
  console.log("Fetching radar images...");
  
  // Check if radar container exists
  const radarContainer = getElement('radar-container');
  const zoomedRadarContainer = getElement('zoomed-radar-container');
  
  if (!radarContainer) {
    console.error("Radar container not found in DOM");
    return;
  }
  
  // Clear any existing content
  radarContainer.innerHTML = '';
  radarContainer.style.display = 'block';
  
  // Create radar iframe
  radarImage = document.createElement("iframe");
  
  radarImage.onload = function() {
    console.log("Radar iframe loaded successfully");
    radarContainer.style.display = 'block';
  };
  
  radarImage.onerror = function () {
    console.error("Radar image failed to load. Retrying...");
    radarContainer.style.display = 'none';
    retryRadarImage();
  };

  // Create map settings
  mapSettings = btoa(JSON.stringify({
    "agenda": {
      "id": "weather",
      "center": [longitude, latitude],
      "location": null,
      "zoom": 8
    },
    "animating": true,
    "base": "dark",
    "artcc": false,
    "county": false,
    "cwa": false,
    "rfc": false,
    "state": false,
    "menu": false,
    "shortFusedOnly": false,
    "opacity": {
      "alerts": 0.0,
      "local": 0.0,
      "localStations": 0.0,
      "national": 0.6
    }
  }));

  // Set iframe attributes
  radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings + "&t=" + new Date().getTime());
  radarImage.style.width = "1230px";
  radarImage.style.height = "740px";
  radarImage.style.marginTop = "-220px";
  radarImage.style.overflow = "hidden";
  radarImage.style.border = "none";
  
  // Explicitly append iframe to container
  radarContainer.appendChild(radarImage);
  console.log("Radar iframe added to DOM");

  if(alertsActive && zoomedRadarContainer){
    // Clear zoomed container
    zoomedRadarContainer.innerHTML = '';
    zoomedRadarContainer.style.display = 'block';
    
    // Create zoomed radar iframe
    zoomedRadarImage = document.createElement("iframe");
    
    zoomedRadarImage.onload = function() {
      console.log("Zoomed radar iframe loaded successfully");
      zoomedRadarContainer.style.display = 'block';
    };
    
    zoomedRadarImage.onerror = function () {
      console.error("Zoomed radar image failed to load. Retrying...");
      zoomedRadarContainer.style.display = 'none';
      retryZoomedRadarImage();
    };

    mapSettings = btoa(JSON.stringify({
      "agenda": {
        "id": "weather",
        "center": [longitude, latitude],
        "location": null,
        "zoom": 10
      },
      "animating": true,
      "base": "standard",
      "artcc": false,
      "county": false,
      "cwa": false,
      "rfc": false,
      "state": false,
      "menu": false,
      "shortFusedOnly": false,
      "opacity": {
        "alerts": 0.0,
        "local": 0.0,
        "localStations": 0.0,
        "national": 0.6
      }
    }));

    zoomedRadarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings + "&t=" + new Date().getTime());
    zoomedRadarImage.style.width = "1230px";
    zoomedRadarImage.style.height = "740px";
    zoomedRadarImage.style.marginTop = "-220px";
    zoomedRadarImage.style.overflow = "hidden";
    zoomedRadarImage.style.border = "none";
    
    // Explicitly append zoomed iframe to container
    zoomedRadarContainer.appendChild(zoomedRadarImage);
    console.log("Zoomed radar iframe added to DOM");
  }

  // Create fallback mechanism in case onload/onerror don't trigger
  setTimeout(checkRadarLoaded, 3000);
  
  scheduleTimeline();
}

function checkRadarLoaded() {
  const radarContainer = getElement('radar-container');
  
  if (radarContainer && radarContainer.children.length > 0) {
    const iframe = radarContainer.children[0];
    console.log("Radar check - iframe exists in DOM");
    
    try {
      // Try to access iframe content to verify it's loaded
      if (iframe.contentWindow && iframe.contentWindow.document) {
        console.log("Radar iframe content is accessible");
      } else {
        console.log("Radar iframe content is not accessible - might be CORS protection");
      }
    } catch (e) {
      console.log("Radar iframe content check error:", e.message);
    }
  } else {
    console.error("Radar container has no children - loading failed");
    retryRadarImage();
  }
}

function retryRadarImage() {
  setTimeout(() => {
    console.log("Retrying radar image...");
    fetchRadarImages();
  }, 5000); // Retry after 5 seconds
}

function retryZoomedRadarImage() {
  setTimeout(() => {
    console.log("Retrying zoomed radar image...");
    fetchRadarImages();
  }, 5000); // Retry after 5 seconds
}