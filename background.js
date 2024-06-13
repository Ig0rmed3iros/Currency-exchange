async function fetchExchangeRates() {
  try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
      const data = await response.json();
      return data.rates;
  } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return {};
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const rates = await fetchExchangeRates();
  chrome.storage.sync.set({ rates: rates, enabled: true, iofRate: 0, internationalPurchase: false }, () => {
      console.log('Currency Converter Extension initialized with rates:', rates);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'getConversionRates') {
      chrome.storage.sync.get('rates', (data) => {
          sendResponse(data.rates);
      });
      return true;  // Will respond asynchronously
  }
});
