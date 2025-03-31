//Okay so this is kind of where you configure shit

window.CONFIG = {
  crawl: `Thanks for tuning into SkyCast Television, your source for weather updates for the North Central AR Area. Enjoy the Show <3`,
  greeting: 'Life is like weather, its unpredictable and ever changing.',
  language: 'en-US', // Changed back to English
  countryCode: 'US',
  units: 'e',
  unitField: 'imperial',
  loop: false,
  locationMode: "AIRPORT",
  airportCode: "KHRO", // Hardcoded airport code
  secrets: {
    twcAPIKey: 'e1f10a1e78da46f5b10a1e78da96f525'
  }
};

CONFIG.unitField = CONFIG.units === 'm' ? 'metric' : (CONFIG.units === 'h' ? 'uk_hybrid' : 'imperial')
