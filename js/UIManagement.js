function setGreetingPage() {
  getElement('greeting-text').innerHTML = CONFIG.greeting;
  getElement('hello-text').innerHTML = 'HELLO';
  getElement('hello-location-text').innerHTML = 'North Central<br>AR';
}

function setTimelineEvents() {
  var timelineEvents = document.querySelectorAll('.timeline-event-name');
  
  if (pageOrder === MORNING) {
    timelineEvents[0].innerHTML = "NOW";
    timelineEvents[1].innerHTML = "TODAY";
    timelineEvents[2].innerHTML = "TONIGHT";
    timelineEvents[3].innerHTML = "BEYOND";
  } else if (pageOrder === NIGHT) {
    timelineEvents[0].innerHTML = "NOW";
    timelineEvents[1].innerHTML = "TONIGHT";
    timelineEvents[2].innerHTML = "BEYOND";
  } else {
    // For SINGLE and MULTIPLE alert page orders
    if (alerts.length == 1) {
      timelineEvents[0].innerHTML = "ALERT";
    } else {
      timelineEvents[0].innerHTML = "ALERTS";
    }
    timelineEvents[1].innerHTML = "NOW";
    timelineEvents[2].innerHTML = "TONIGHT";
    timelineEvents[3].innerHTML = "BEYOND";
  }
}

function setCurrentConditions() {
  getElement('cc-city-name').innerHTML = cityName;
  getElement('cc-current-condition').innerHTML = currentCondition;
  getElement('cc-dial-text').innerHTML = "CURRENT";
  getElement('cc-temperature-text').innerHTML = currentTemperature;
  getElement('cc-feels').innerHTML = "FEELS LIKE";
  getElement('cc-feels-like').innerHTML = feelsLike;
  getElement('cc-column-1-title').innerHTML = "HUMIDITY";
  getElement('cc-column-2-title').innerHTML = "DEWPOINT";
  getElement('cc-column-3-title').innerHTML = "PRESSURE";
  
  getElement('cc-humidity').innerHTML = humidity;
  getElement('cc-dewpoint').innerHTML = dewPoint;
  getElement('cc-pressure1').innerHTML = pressure.split('.')[0];
  getElement('cc-pressure2').innerHTML = pressure.split('.')[1] || "00";
  getElement('cc-pressure-trend').innerHTML = pressureTrend;
  
  getElement('cc-column-4-title').innerHTML = "WIND";
  getElement('cc-column-5-title').innerHTML = "GUSTS";
  getElement('cc-column-6-title').innerHTML = "VISIBILITY";
  
  getElement('cc-wind').innerHTML = windSpeed;
  getElement('cc-gusts').innerHTML = gusts;
  getElement('cc-visibility').innerHTML = visibility;
  
  getElement('cc-icon').src = "assets/icons/" + currentIcon + ".svg";
}

function setForecast() {
  // Today forecast
  getElement('today-title').innerHTML = "TODAY";
  getElement('today-narrative').innerHTML = forecastNarrative[0];
  getElement('today-high').innerHTML = "HIGH " + forecastTemp[0] + "&deg;";
  getElement('today-precip').innerHTML = forecastPrecip[0];
  getElement('today-icon').src = "assets/icons/" + forecastIcon[0] + ".svg";
  
  // Tonight forecast
  getElement('tonight-title').innerHTML = "TONIGHT";
  getElement('tonight-narrative').innerHTML = forecastNarrative[1];
  getElement('tonight-low').innerHTML = "LOW " + forecastTemp[1] + "&deg;";
  getElement('tonight-precip').innerHTML = forecastPrecip[1];
  getElement('tonight-icon').src = "assets/icons/" + forecastIcon[1] + ".svg";
  
  // Tomorrow forecast
  getElement('tomorrow-title').innerHTML = "TOMORROW";
  getElement('tomorrow-narrative').innerHTML = forecastNarrative[2];
  getElement('tomorrow-high').innerHTML = "HIGH " + forecastTemp[2] + "&deg;";
  getElement('tomorrow-precip').innerHTML = forecastPrecip[2];
  getElement('tomorrow-icon').src = "assets/icons/" + forecastIcon[2] + ".svg";
  
  // Tomorrow Night forecast
  getElement('tomorrow-night-title').innerHTML = "TOMORROW NIGHT";
  getElement('tomorrow-night-narrative').innerHTML = forecastNarrative[3];
  getElement('tomorrow-night-low').innerHTML = "LOW " + forecastTemp[3] + "&deg;";
  getElement('tomorrow-night-precip').innerHTML = forecastPrecip[3];
  getElement('tomorrow-night-icon').src = "assets/icons/" + forecastIcon[3] + ".svg";
  
  // Single Alert page
  if(alerts[0]){
    getElement('single-alert-text').innerHTML = alerts[0];
  }
  
  // Multiple Alert page
  if(alerts.length > 1){
    let altxt = "";
    for(var i = 0; i < alerts.length; i++){
      altxt += "<div class='multiple-alert-item'>" + alerts[i] + "</div>";
    }
    getElement('multiple-alerts-container').innerHTML = altxt;
  }
}

function setOutlook() {
  // Set outlook title to English
  getElement('outlook-title').innerHTML = '7-DAY OUTLOOK';
  
  // Set day names to English
  const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  // Get today as a starting point for the 7 day outlook
  var day = new Date().getDay();
  
  for(var i = 0; i < 7; i++) {
    // Get next day of the week
    var nextDay = (day + i + 1) % 7;
    
    // Set day names to English
    getElement('outlook-day-text-' + i).innerHTML = WEEKDAY[nextDay];
    
    // Set high/low temperatures
    getElement('outlook-day-high-' + i).innerHTML = outlookHigh[i] + "&deg;";
    getElement('outlook-day-low-' + i).innerHTML = outlookLow[i] + "&deg;";
    
    // Set conditions text (already split with <br/> in the fetching code)
    getElement('outlook-day-condition-' + i).innerHTML = outlookCondition[i];
    
    // Set icons
    getElement('outlook-day-icon-' + i).src = "assets/icons/" + outlookIcon[i] + ".svg";
  }
}