// Preset timeline sequences
const MORNING = [{name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 8000}]},{name: "Today", subpages: [{name: "today-page", duration: 10000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "7day-page", duration: 13000}]},];
const NIGHT = [{name: "Now", subpages: [{name: "current-page", duration: 9000}, {name: "radar-page", duration: 8000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 10000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 10000}, {name: "tomorrow-night-page", duration: 10000}, {name: "7day-page", duration: 13000}]},];
const SINGLE = [{name: "Alert", subpages: [{name: "single-alert-page", duration: 7000}]},{name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 8000}, {name: "zoomed-radar-page", duration: 8000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 13000}]},];
const MULTIPLE = [{name: "Alerts", subpages: [{name: "multiple-alerts-page", duration: 7000}]},{name: "Now", subpages: [{name: "current-page", duration: 8000}, {name: "radar-page", duration: 8000}, {name: "zoomed-radar-page", duration: 8000}]},{name: "Tonight", subpages: [{name: "tonight-page", duration: 8000}]},{name: "Beyond", subpages: [{name: "tomorrow-page", duration: 8000}, {name: "7day-page", duration: 13000}]},];
const WEEKDAY = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];

const jingle = new Audio("assets/music/");

const crawlSpeedCasual = 10; // A normal reading pace, in characters per second
const crawlSpeedFast = 20; // A fast reading pace, in characters per second
const crawlScreenTime = 45; // Shortest time crawl will be on screen, in seconds
const crawlSpace = 70; // Approx number of characters that can fix in the crawl bar. Used for crawl speed calcs

var isDay = true;
var currentLogo;
var currentLogoIndex = 0;
var pageOrder;
var music;
var isLooping = false;
var timeoutIds = [];

// Keep track of the current music instance
var currentMusicInstance = null;

// Track current and next music/images
var nextMusicInstance = null;
var currentBackgroundUrl = null;
var nextBackgroundUrl = null;

// Track current and next background image indexes
var currentBackgroundIndex = 1;
var nextBackgroundIndex = 2;
var totalBackgroundImages = 500;

// Add a flag to track if we're in a loop
var isFirstRun = true;

window.onload = function() {
  // Reset the first run flag
  isFirstRun = true;
  
  preLoadMusic();
  resizeWindow();
  setClockTime();
  preloadBackgroundImages();
  
  // Start weather fetching
  airportCode = CONFIG.airportCode;
  fetchCurrentWeather();
};

function toggleAdvancedSettings() {
  let advancedSettingsOptions = getElement('advanced-settings-options');
  let advancedOptionsText = getElement('advanced-options-text');

  var advancedSettingsHidden = advancedSettingsOptions.classList.contains('hidden');

  if(advancedSettingsHidden) {
    advancedSettingsOptions.classList.remove('hidden');
    advancedOptionsText.innerHTML = 'Hide advanced options';
  } else {
    advancedSettingsOptions.classList.add('hidden');
    advancedOptionsText.innerHTML = 'Show advanced options';
  }
}

// Track current music instance
var currentMusicInstance = null;

function preLoadMusic() {
  var index = Math.floor(Math.random() * 30) + 1;
  // Pad the index with a leading zero if it's a single digit
  var paddedIndex = index < 10 ? "0" + index : index;
  
  console.log("Loading music track:", paddedIndex);
  
  // Create new audio instance
  var newMusic = new Audio("assets/music/" + paddedIndex + ".mp3");
  
  // Set up the ended event to automatically play the next track
  newMusic.addEventListener('ended', function() {
    console.log("Track ended, loading next track");
    // When current track ends, preload and play a new one
    var nextMusic = preLoadMusic(); // This creates and returns a new configured audio instance
    playMusic(nextMusic);
  });
  
  // Return the configured audio instance
  return newMusic;
}

function startMusic() {
  console.log("Starting music playback");
  
  // Create initial music instance if none exists
  if (!currentMusicInstance) {
    currentMusicInstance = preLoadMusic();
  }
  
  // Add click handler to start music after user interaction
  document.addEventListener('click', function musicClickHandler() {
    console.log("User interaction detected, attempting to play music");
    playMusic(currentMusicInstance);
    // Remove the event listener after first click
    document.removeEventListener('click', musicClickHandler);
  }, { once: true });
  
  // Try playing anyway (might work if autoplay is enabled)
  playMusic(currentMusicInstance);
}

function playMusic(musicInstance) {
  // Stop any currently playing music first
  if (currentMusicInstance && currentMusicInstance !== musicInstance) {
    try {
      currentMusicInstance.pause();
    } catch (e) {
      console.log("Error pausing music:", e);
    }
  }
  
  // Set the new music instance
  currentMusicInstance = musicInstance;
  
  // Try to play, but catch the promise rejection if autoplay is blocked
  if (currentMusicInstance) {
    console.log("Attempting to play music track");
    var playPromise = currentMusicInstance.play();
    
    // Play might return a promise (in modern browsers)
    if (playPromise !== undefined) {
      playPromise.then(function() {
        console.log("Music playback started successfully");
      }).catch(function(error) {
        console.log("Autoplay prevented by browser policy:", error);
        // Display a message to notify the user they need to interact
        var message = "Click anywhere to enable music";
        alert(message);
      });
    }
  }
}

function checkStormMusic() {
  // Check if there's an active alert or if the current conditions include storms
  if (alertsActive || (currentCondition && currentCondition.toLowerCase().includes("storm"))) {
    console.log("Alert or storm detected - playing storm music");
    
    // Create a storm music instance
    var stormMusic = new Audio("assets/music/storm.wav");
    
    // Set up the ended event for storm music
    stormMusic.addEventListener('ended', function() {
      console.log("Storm music ended, looping storm music");
      // Loop the storm music as long as the alert is active
      if (alertsActive) {
        playMusic(preLoadStormMusic());
      } else {
        // If alerts are no longer active, switch to regular music
        var nextMusic = preLoadMusic();
        playMusic(nextMusic);
      }
    });
    
    // Play the storm music
    playMusic(stormMusic);
  } else {
    // Start with regular music if not a storm/alert
    console.log("No alerts - playing regular music");
    startMusic();
  }
}

function preLoadStormMusic() {
  console.log("Loading storm music");
  
  // Create new storm audio instance
  var stormMusic = new Audio("assets/music/storm.wav");
  
  // Set up the ended event to loop storm music
  stormMusic.addEventListener('ended', function() {
    console.log("Storm music ended, reloading storm music");
    // Loop storm music as long as alert is active
    if (alertsActive) {
      playMusic(preLoadStormMusic());
    } else {
      // Switch back to regular music if alert is no longer active
      var nextMusic = preLoadMusic();
      playMusic(nextMusic);
    }
  });
  
  // Return the configured audio instance
  return stormMusic;
}

// Preload background images
function preloadBackgroundImages() {
  // Set initial image indexes
  currentBackgroundIndex = Math.floor(Math.random() * totalBackgroundImages) + 1;
  
  // Make sure next index is different than current
  do {
    nextBackgroundIndex = Math.floor(Math.random() * totalBackgroundImages) + 1;
  } while (nextBackgroundIndex === currentBackgroundIndex);
  
  // Preload both images
  var currentImagePath = getBackgroundPath(currentBackgroundIndex);
  var nextImagePath = getBackgroundPath(nextBackgroundIndex);
  
  // Preload current image
  var currentImg = new Image();
  currentImg.onload = function() {
    getElement('background-image').style.backgroundImage = 'url(' + currentImagePath + ')';
  };
  currentImg.onerror = function() {
    console.error("Failed to load background image:", currentImagePath);
    // Try another image if this one fails
    currentBackgroundIndex = Math.floor(Math.random() * totalBackgroundImages) + 1;
    getElement('background-image').style.backgroundImage = 'url(' + getBackgroundPath(currentBackgroundIndex) + ')';
  };
  currentImg.src = currentImagePath;
  
  // Preload next image
  var nextImg = new Image();
  nextImg.src = nextImagePath;
}

// Get path to background image based on index
function getBackgroundPath(index) {
  // Format index with leading zeros (001, 002, etc.)
  var paddedIndex = index.toString().padStart(3, '0');
  return 'assets/backgrounds/bg_' + paddedIndex + '.jpg';
}

// Update the background image for next loop
function updateBackgroundImage() {
  // Create a temporary overlay element for the transition
  var bgOverlay = document.createElement('div');
  bgOverlay.id = 'background-image-overlay';
  bgOverlay.style.position = 'absolute';
  bgOverlay.style.top = '0';
  bgOverlay.style.left = '0';
  bgOverlay.style.width = '100%';
  bgOverlay.style.height = '100%';
  bgOverlay.style.zIndex = '1';
  bgOverlay.style.opacity = '0';
  bgOverlay.style.transition = 'opacity 1s ease-in-out';
  bgOverlay.style.backgroundSize = 'cover';
  
  // Set the new background image on the overlay
  var nextImagePath = getBackgroundPath(nextBackgroundIndex);
  bgOverlay.style.backgroundImage = 'url(' + nextImagePath + ')';
  
  // Add the overlay to the DOM
  document.getElementById('render-frame').appendChild(bgOverlay);
  
  // Trigger a reflow to ensure the transition works
  void bgOverlay.offsetWidth;
  
  // Fade in the overlay
  bgOverlay.style.opacity = '1';
  
  // After transition is complete, update the main background and remove overlay
  setTimeout(function() {
    // Current becomes next
    currentBackgroundIndex = nextBackgroundIndex;
    
    // Update the main background
    getElement('background-image').style.backgroundImage = 'url(' + nextImagePath + ')';
    
    // Get a new "next" index that's different from current
    do {
      nextBackgroundIndex = Math.floor(Math.random() * totalBackgroundImages) + 1;
    } while (nextBackgroundIndex === currentBackgroundIndex);
    
    // Preload the next image
    var nextImg = new Image();
    nextImg.src = getBackgroundPath(nextBackgroundIndex);
    
    // Remove the overlay
    bgOverlay.style.opacity = '0';
    setTimeout(function() {
      if (bgOverlay.parentNode) {
        bgOverlay.parentNode.removeChild(bgOverlay);
      }
    }, 1000);
  }, 1000);
}

function scheduleTimeline() {
  if(alerts.length == 1) {
    pageOrder = SINGLE;
  } else if(alerts.length > 1) {
    pageOrder = MULTIPLE;
  } else if(isDay) {
    pageOrder = MORNING;
  } else {
    pageOrder = NIGHT;
  }
  setInformation();
}

function revealTimeline() {
  getElement('timeline-event-container').classList.add('shown');
  getElement('progressbar-container').classList.add('shown');
  getElement('logo-stack').classList.add('shown');
  var timelineElements = document.querySelectorAll(".timeline-item");
  for (var i = 0; i < timelineElements.length; i++) {
    timelineElements[i].style.top = '0px';
  }
}

/* Now that all the fetched information is stored in memory, display them in the appropriate elements */
function setInformation() {
  setGreetingPage();
  checkStormMusic(); // Check for alerts and play storm music if needed
  setAlertPage();
  setForecast();
  setOutlook();
  createLogoElements();
  setCurrentConditions();
  setTimelineEvents();
  hideSettings();
  setTimeout(startAnimation, 100);
}

function setMainBackground() {
  // Background is now handled by preloadBackgroundImages
}

function startAnimation() {
  setInitialPositionCurrentPage();
  // Start music immediately instead of waiting for jingle
  startMusic();
  executeGreetingPage();
}

function hideSettings() {
  // No longer needed as settings are not shown
}

function executeGreetingPage() {
  getElement('background-image').classList.remove("below-screen");
  getElement('content-container').classList.add('shown');
  getElement('infobar-twc-logo').classList.add('shown');
  getElement('hello-text').classList.add('shown');
  getElement('hello-location-text').classList.add('shown');
  getElement('greeting-text').classList.add('shown');
  getElement('local-logo-container').classList.add("shown");
  setTimeout(clearGreetingPage, 2500);
}

function clearGreetingPage() {
  // Remove transition delay from greeting
  getElement('greeting-text').classList.remove('shown');
  getElement('local-logo-container').classList.remove('shown');
  
  // Hide everything
  getElement('greeting-text').classList.add('hidden');
  getElement('hello-text-container').classList.add('hidden');
  getElement("hello-location-container").classList.add("hidden");
  getElement("local-logo-container").classList.add("hidden");
  
  // Clear any existing timeouts from previous runs
  clearAllTimeouts();
  
  // Start the sequence
  schedulePages();
  loadInfoBar();
  revealTimeline();
  setTimeout(showCrawl, 3000);
}

// Clear all active timeouts
function clearAllTimeouts() {
  for (var i = 0; i < timeoutIds.length; i++) {
    clearTimeout(timeoutIds[i]);
  }
  timeoutIds = [];
}

// Set start and end times for every sub page.
function schedulePages() {
  var cumulativeTime = 0;
  
  for(var p = 0; p < pageOrder.length; p++) {
    for (var s = 0; s < pageOrder[p].subpages.length; s++) {
      // For every single sub page
      var startTime = cumulativeTime;
      var clearTime = cumulativeTime + pageOrder[p].subpages[s].duration;
      
      var executeId = setTimeout(function(pageIndex, subPageIndex) {
        executePage(pageIndex, subPageIndex);
      }, startTime, p, s);
      
      var clearId = setTimeout(function(pageIndex, subPageIndex) {
        clearPage(pageIndex, subPageIndex);
      }, clearTime, p, s);
      
      timeoutIds.push(executeId);
      timeoutIds.push(clearId);
      
      cumulativeTime = clearTime;
    }
  }
}

function executePage(pageIndex, subPageIndex) {
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var subPageCount = currentPage.subpages.length;
  var currentSubPageDuration = currentPage.subpages[subPageIndex].duration;
  
  if (subPageIndex === 0) {
    var pageTime = 0;
    for (var i = 0; i < subPageCount; i++) {
      pageTime += currentPage.subpages[i].duration;
    }
    
    // Reset the progress bar first
    resetProgressBar();
    
    // Then set the new duration and start progress animation
    getElement('progressbar').style.transitionDuration = pageTime + "ms";
    
    // Force a reflow to ensure the animation starts properly
    void getElement('progressbar').offsetWidth;
    
    getElement('progressbar').classList.add('progress');
    getElement('timeline-event-container').style.left = (-280*pageIndex).toString() + "px";
    getElement('progress-stack').style.left = (-280*pageIndex).toString() + "px";
  }
  
  if (currentLogo != getPageLogoFileName(currentSubPageName)) {
    getElement('logo-stack').style.left = ((-85*currentLogoIndex)-(20*currentLogoIndex)).toString() + "px";
    currentLogo = getPageLogoFileName(currentSubPageName);
    currentLogoIndex++;
  }
  
  currentSubPageElement.style.transitionDelay = '0.5s';
  
  if (pageIndex === 0 && subPageIndex == 0) {
    currentSubPageElement.style.top = '0px';
  } else {
    currentSubPageElement.style.left = '0px';
  }
  
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;
  
  if (isLastPage) {
    setTimeout(hideCrawl, 2000);
  }
  
  if (currentSubPageName == "current-page") {
    setTimeout(loadCC, 1000);
    setTimeout(scrollCC, currentSubPageDuration / 2);
    
    // If this is not the first run, skip the animation and set the temperature directly
    if (isFirstRun) {
      animateValue('cc-temperature-text', -20, currentTemperature, 2500, 1);
      animateDialFill('cc-dial-color', currentTemperature, 2500);
    } else {
      // Skip animation on subsequent loops
      getElement('cc-temperature-text').innerHTML = currentTemperature;
      getElement('cc-dial-color').style.fill = getTemperatureColor(currentTemperature);
    }
  }
}

function clearPage(pageIndex, subPageIndex) {
  var currentPage = pageOrder[pageIndex];
  var currentSubPageName = currentPage.subpages[subPageIndex].name;
  var currentSubPageElement = getElement(currentSubPageName);
  var subPageCount = currentPage.subpages.length;
  var isNewPage = subPageCount-1 == subPageIndex;
  var isLastPage = pageIndex >= pageOrder.length-1 && subPageIndex >= pageOrder[pageOrder.length-1].subpages.length-1;
  
  // Always make sure the page slides out
  currentSubPageElement.style.transitionDelay = '0s';
  currentSubPageElement.style.left = '-101%';
  
  if (isNewPage && !isLastPage) {
    resetProgressBar();
  }
  
  if (isLastPage) {
    isLooping = true;
    startEndSequence();
  }
}

function resetProgressBar() {
  getElement('progressbar').style.transitionDuration = '0ms';
  getElement('progressbar').classList.remove('progress');
  void getElement('progressbar').offsetWidth;
}

function startRadar() {
  // Make sure radar container is visible
  getElement('radar-container').style.display = 'block';
  
  // Only append if not already appended
  if (radarImage && !radarImage.parentNode) {
    getElement('radar-container').appendChild(radarImage);
  }
}

function startZoomedRadar() {
  // Make sure zoomed radar container is visible
  getElement('zoomed-radar-container').style.display = 'block';
  
  // Only append if not already appended
  if (zoomedRadarImage && !zoomedRadarImage.parentNode) {
    getElement('zoomed-radar-container').appendChild(zoomedRadarImage);
  }
}

function loadCC() {
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) {
    ccElements[i].style.top = '0px';
  }
}

function scrollCC() {
  var ccElements = document.querySelectorAll(".cc-vertical-group");
  for (var i = 0; i < ccElements.length; i++) {
    ccElements[i].style.top = '-80px';
  }
  
  // Split decimal into 2 objects so that we can animate them individually.
  var pressureArray = pressure.toString().split('.');
  animateValue("cc-visibility", 0, visibility, 800, 1);
  
  if (CONFIG.units != 'm') {
    getElement("cc-visibility-unit-metric").style.fontSize = "0px";
    getElement("cc-visibility-unit-metric").style.visibility = "hidden";
  } else {
    getElement("cc-visibility-unit-imperial").style.fontSize = "0px";
    getElement("cc-visibility-unit-imperial").style.visibility = "hidden";
  }
  
  animateValue("cc-humidity", 0, humidity, 1000, 1);
  animateValue("cc-dewpoint", 0, dewPoint, 1200, 1);
  
  if (CONFIG.units === 'e') { //Imperial units.
    animateValue("cc-pressure1", 0, pressureArray[0], 1400, 1);
    animateValue("cc-pressure2", 0, pressureArray[1], 1400, 2);
    getElement("cc-pressure-metric").style.fontSize = "0px";
    getElement("cc-pressure-metric").style.visibility = "hidden";
  } else { //Metric units.
    animateValue("cc-pressure1", 800, pressureArray[0], 1400, 3);
    getElement("cc-pressure2").style.visibility = "hidden";
    getElement("cc-pressure2").style.fontSize = "0px";
    getElement("cc-pressure-decimal").style.visibility = "hidden";
    getElement("cc-pressure-decimal").style.fontSize = "0px";
  }
}

// New function to handle the end sequence and looping
function startEndSequence() {
  // Show ending screen
  showEnding();
  
  // Schedule the loop to restart after 3 seconds
  setTimeout(function() {
    restartLoop();
  }, 3000);
}

// Handle the restart of the loop
function restartLoop() {
  // Hide ending content first
  hideEnding();
  
  // Reset all necessary elements
  resetForNextLoop();
  
  // Start a new background fetch with delay 
  setTimeout(function() {
    setMainBackground();
    resetAndFetchWeather();
  }, 500);
}

// Hide any ending content
function hideEnding() {
  if (getElement('amazing-text')) {
    getElement('amazing-text').classList.remove('extend');
  }
  if (getElement('amazing-logo')) {
    getElement('amazing-logo').classList.remove('shown');
  }
  if (getElement('updated-text')) {
    getElement('updated-text').classList.remove('extend');
  }
  if (getElement('updated-logo')) {
    getElement('updated-logo').classList.remove('shown');
  }
}

// Reset elements for the next loop
function resetForNextLoop() {
  // Reset all pages to off-screen position
  var allPages = document.querySelectorAll("[id$='-page']");
  for (var i = 0; i < allPages.length; i++) {
    allPages[i].style.left = '-101%';
    allPages[i].style.top = '0px';
  }
  
  // Reset current page to its initial position
  setInitialPositionCurrentPage();
  
  // Reset logo indexes
  currentLogoIndex = 0;
  currentLogo = null;
  
  // Reset timeline position
  getElement('timeline-event-container').style.left = '0px';
  getElement('progress-stack').style.left = '0px';
  
  // Reset logo stack position
  getElement('logo-stack').style.left = '0px';
  
  // Clear any radar images
  if (radarImage && radarImage.parentNode) {
    radarImage.parentNode.removeChild(radarImage);
  }
  if (zoomedRadarImage && zoomedRadarImage.parentNode) {
    zoomedRadarImage.parentNode.removeChild(zoomedRadarImage);
  }
  
  // Clear all timeouts
  clearAllTimeouts();
  
  // Reset UI elements
  getElement('content-container').classList.remove("expand");
  getElement('timeline-container').style.visibility = "visible";
  getElement("forecast-left-container").classList.remove('hidden');
  getElement("forecast-right-container").classList.remove('hidden');
  getElement("outlook-titlebar").classList.remove('hidden');
}

// Fetch fresh weather data for the next loop
function resetAndFetchWeather() {
  // Set the flag to indicate we're not on the first run anymore
  isFirstRun = false;
  
  // Update the background image for the next loop
  updateBackgroundImage();
  
  // Re-fetch radar images for the new loop
  fetchRadarImages();
  
  // Start the sequence again
  scheduleTimeline();
}

// Show the ending screen (amazing out there or stay updated)
function showEnding() {
  if (alertsActive) {
    stayUpdated();
  } else {
    itsAmazingOutThere();
  }
}

function itsAmazingOutThere() {
  getElement('amazing-text').classList.add('extend');
  getElement("amazing-logo").classList.add('shown');
}

function stayUpdated() {
  getElement('updated-text').classList.add('extend');
  getElement("updated-logo").classList.add('shown');
}

function twcLogoClick() {
  var alertMessageShown = getElement('alert-message').classList.contains('shown');
  if (alertMessageShown) return;
  
  var loopStatus = localStorage.getItem('loop');
  if (loopStatus == "y") {
    localStorage.setItem('loop', 'n');
    CONFIG.loop = false;
  } else {
    localStorage.setItem('loop', 'y');
    CONFIG.loop = true;
  }
  showLoopMessage();
}

function loadInfoBar() {
  getElement("infobar-local-logo").classList.add("shown");
  getElement("infobar-location-container").classList.add("shown");
  getElement("infobar-time-container").classList.add("shown");
}

function setClockTime() {
  // Use US Central Time (CST/CDT) for Comrade John
  var now = new Date();
  
  // Get local time as 12-hour format with AM/PM for US display
  var h = now.getHours();
  var m = now.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  h = h % 12;
  h = h ? h : 12; // the hour '0' should be '12'
  
  // Format minutes with leading zero if needed
  if (m < 10) {
    m = "0" + m;
  }
  
  // Create the final time string
  var finalString = h + ":" + m + " " + ampm;
  getElement("infobar-time-text").innerHTML = finalString;
  
  // Remove timezone indicator if it exists
  var timezoneIndicator = getElement("timezone-indicator");
  if (timezoneIndicator && timezoneIndicator.parentNode) {
    timezoneIndicator.parentNode.removeChild(timezoneIndicator);
  }
  
  // Refresh clock every 5 seconds
  setTimeout(setClockTime, 5000);
}

// Safe version of animateValue that clears previous animations
function animateValue(id, start, end, duration, pad) {
  var obj = getElement(id);
  
  // Check if element exists
  if (!obj) return;
  
  // Clear any existing animation
  if (obj.dataset && obj.dataset.animationTimer) {
    clearInterval(parseInt(obj.dataset.animationTimer));
  }
  
  if (start == end) {
    obj.innerHTML = end.pad ? end.pad(pad) : end;
    return;
  }
  
  var range = end - start;
  var current = start;
  var increment = end > start ? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / range));
  
  var timer = setInterval(function() {
    current += increment;
    obj.innerHTML = current.pad ? current.pad(pad) : current;
    
    if (current == end) {
      clearInterval(timer);
    }
  }, stepTime);
  
  // Store timer id
  if (obj.dataset) {
    obj.dataset.animationTimer = timer;
  }
}

// Safe version of animateDialFill that clears previous animations
function animateDialFill(id, temperature, duration) {
  var obj = getElement(id);
  
  // Check if element exists
  if (!obj) return;
  
  // Clear any existing animation
  if (obj.dataset && obj.dataset.animationTimer) {
    clearInterval(parseInt(obj.dataset.animationTimer));
  }
  
  var start = -20;
  var end = temperature;
  
  if (start == end) {
    obj.style.fill = getTemperatureColor(temperature);
    return;
  }
  
  var range = end - start;
  var current = start;
  var increment = end > start ? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / range));
  
  var timer = setInterval(function() {
    current += increment;
    obj.style.fill = getTemperatureColor(current);
    
    if (current == end) {
      clearInterval(timer);
    }
  }, stepTime);
  
  // Store timer id
  if (obj.dataset) {
    obj.dataset.animationTimer = timer;
  }
}

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
};

// Used for the beginning dial in order to map warmer temperatures to warmer colors and vice versa.
function getTemperatureColor(temperature) {
  if (temperature < -20) {
    return 'rgb(0, 0, 255)';
  } else if (temperature > 100) {
    return 'rgb(201, 42, 42)';
  }
  
  var calculatedColor = [0, 0, 0];
  
  if (temperature < 40) {
    var percent = (temperature + 20)/60;
    calculatedColor = interpolateColor([24, 100, 171], [77, 171, 247], percent);
  } else if (temperature < 60) {
    var percent = (temperature - 40)/20;
    calculatedColor = interpolateColor([77, 171, 247], [255, 212, 59], percent);
  } else if (temperature < 80) {
    var percent = (temperature - 60)/20;
    calculatedColor = interpolateColor([255, 212, 59], [247, 103, 7], percent);
  } else {
    var percent = (temperature - 80)/20;
    calculatedColor = interpolateColor([247, 103, 7], [201, 42, 42], percent);
  }
  
  return 'rgb(' + calculatedColor[0] + ', ' + calculatedColor[1] + ', ' + calculatedColor[2] + ')';
}

var interpolateColor = function(color1, color2, factor) {
  if (arguments.length < 3) { factor = 0.5; }
  var result = color1.slice();
  for (var i=0; i<3; i++) {
    result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
  }
  return result;
};

const baseSize = {
  w: 1920,
  h: 1080
};

window.onresize = resizeWindow;

function resizeWindow() {
  var ww = window.innerWidth;
  var wh = window.innerHeight;
  var newScale = 1;
  
  // compare ratios
  if (ww/wh < baseSize.w/baseSize.h) { // tall ratio
    newScale = ww / baseSize.w;
  } else { // wide ratio
    newScale = wh / baseSize.h;
  }
  
  getElement('render-frame').style.transform = 'scale(' + newScale + ',' + newScale + ')';
}

function getElement(id) {
  return document.getElementById(id);
}

function showCrawl() {
  // only show crawl bar if it contains text
  if (CONFIG.crawl && CONFIG.crawl.length > 0) {
    getElement('crawler-container').classList.add("shown");
    setTimeout(startCrawl, 400); // wait for the settings to fully animate out before starting
  }
}

function hideCrawl() {
  getElement('crawler-container').classList.add("hidden");
}

function startCrawl() {
  calculateCrawlSpeed();
  getElement('crawl-text').classList.add('animate');
}

function calculateCrawlSpeed() {
  var crawlTextElement = getElement('crawl-text');
  
  // Get the length of the crawl
  var elementLength = crawlTextElement.innerHTML.length;
  var timeTaken;
  
  // We basically have 3 speed cases to solve for: casual (10 chars/s), fast (20 chars/s), and then anything between.
  // To handle low lengths correctly, we need to add in the ~70 chars worth of length of the crawl box, otherwise short strings fly by too quickly.
  
  // Handle the low end case
  if (elementLength < (crawlScreenTime*crawlSpeedCasual) - crawlSpace) {
    timeTaken = (elementLength + crawlSpace) / crawlSpeedCasual;
  }
  // Handle the high end case. This calc will result in animations longer than screen time, which will cut off the end of long messages, which I find preferable to long messages flying by too fast to read. 
  else if (elementLength > (crawlScreenTime*crawlSpeedFast)) {
    timeTaken = elementLength / crawlSpeedFast;
  }
  // Handle the in-between case. Pin the animation time to screentime and let the chars/sec float between the casual and fast limits.
  else {
    timeTaken = crawlScreenTime;
  }
  
  crawlTextElement.style.animationDuration = timeTaken + "s";
}

function showLoopMessage() {
  var loopStatus = ((CONFIG.loop) ? 'enabled' : 'disabled');
  alert("Looping " + loopStatus + ", click TWC logo to toggle");
}

function alert(message) {
  getElement('alert-message').innerHTML = message;
  getElement('alert-message').classList.add('shown');
  setTimeout(hideAlertMessage, 2000);
}

function hideAlertMessage() {
  getElement('alert-message').classList.remove('shown');
}

// Hook into the weather data loading to start the sequence
function onWeatherDataLoaded() {
  scheduleTimeline();
}

// Completely recreate radar for each loop
function fetchRadarImages() {
  // Clear any existing radar elements first
  if (radarImage && radarImage.parentNode) {
    radarImage.parentNode.removeChild(radarImage);
  }
  if (zoomedRadarImage && zoomedRadarImage.parentNode) {
    zoomedRadarImage.parentNode.removeChild(zoomedRadarImage);
  }
  
  // Create new radar iframes
  radarImage = document.createElement("iframe");
  radarImage.onerror = function() {
    getElement('radar-container').style.display = 'none';
  };

  // Set the map settings again
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
  
  // Add randomization to URL to prevent caching
  radarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings + "&t=" + new Date().getTime());
  radarImage.style.width = "1230px";
  radarImage.style.height = "740px";
  radarImage.style.marginTop = "-220px";
  radarImage.style.overflow = "hidden";
  
  if (alertsActive) {
    zoomedRadarImage = document.createElement("iframe");
    zoomedRadarImage.onerror = function() {
      getElement('zoomed-radar-container').style.display = 'none';
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
    
    // Add randomization to URL to prevent caching
    zoomedRadarImage.setAttribute("src", "https://radar.weather.gov/?settings=v1_" + mapSettings + "&t=" + new Date().getTime());
    zoomedRadarImage.style.width = "1230px";
    zoomedRadarImage.style.height = "740px";
    zoomedRadarImage.style.marginTop = "-220px";
    zoomedRadarImage.style.overflow = "hidden";
  }
}