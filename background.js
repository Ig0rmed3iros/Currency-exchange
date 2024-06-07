async function fetchExchangeRates() {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
    const data = await response.json();
    return {
      BRLtoUSD: data.rates.USD,
      USDtoBRL: 1 / data.rates.USD
    };
  }
  
  if (chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(async function () {
      const rates = await fetchExchangeRates();
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({ enabled: true, rates: rates }, function () {
          console.log("Currency Converter Extension enabled with rates:", rates);
        });
      } else {
        console.error('chrome.storage.sync is not available');
      }
    });
  
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message === 'getConversionRates') {
        if (chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get('rates', (data) => {
            sendResponse(data.rates);
          });
        } else {
          console.error('chrome.storage.sync is not available');
        }
        return true;  // Will respond asynchronously
      }
    });
  } else {
    console.error('chrome.runtime is not available');
  }
  