let enabled = false;
let conversionRateBRLtoUSD = 0;
let conversionRateUSDtoBRL = 0;
let iofRate = 0;

// Create and style the tooltip
function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'price-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = '#333';
  tooltip.style.color = '#fff';
  tooltip.style.padding = '5px';
  tooltip.style.borderRadius = '5px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.zIndex = '1000';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
}

// Show tooltip with the converted price
function showTooltip(event, convertedPrice, exchangeRate) {
  const tooltip = document.getElementById('price-tooltip');
  tooltip.innerHTML = `${convertedPrice}<br>Taxa de Câmbio: ${exchangeRate.toFixed(4)}`;
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY - 30}px`;
  tooltip.style.display = 'block';
}

// Hide the tooltip
function hideTooltip() {
  const tooltip = document.getElementById('price-tooltip');
  tooltip.style.display = 'none';
}

// Convert price from BRL to formatted USD or from USD to formatted BRL
function convertPrice(priceText) {
  if (!priceText) {
    return null;
  }

  const brlMatch = priceText.match(/R\$\s?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?)/);
  const usdMatch = priceText.match(/\$\s?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?)/);

  if (brlMatch) {
    const price = parseFloat(brlMatch[1].replace(/\./g, '').replace(',', '.'));
    const convertedPrice = (price * conversionRateBRLtoUSD).toFixed(2);
    return `USD: ${formatUSD(convertedPrice)}`;
  } else if (usdMatch) {
    const price = parseFloat(usdMatch[1].replace(/,/g, ''));
    const directConversion = (price * conversionRateUSDtoBRL).toFixed(2);
    const iofTax = (directConversion * (iofRate / 100)).toFixed(2);
    const totalWithIof = (parseFloat(directConversion) + parseFloat(iofTax)).toFixed(2);
    return `
      Conversão Direta: R$ ${formatBRL(directConversion)}<br>
      Com IOF: R$ ${formatBRL(totalWithIof)}<br>
      IOF (%): ${iofRate}%
    `;
  }
  return null;
}

// Format the USD price
function formatUSD(price) {
  const [whole, cents] = price.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$ ${formattedWhole}.${cents}`;
}

// Format the BRL price
function formatBRL(price) {
  const [whole, cents] = price.split('.');
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedWhole},${cents}`;
}

// Traverse and combine text content from the element and its children
function getTextContent(element) {
  if (element.childNodes.length === 0) {
    return element.textContent;
  }
  return Array.from(element.childNodes).map(getTextContent).join('');
}

// Handle mouse movement to display the tooltip
function handleMouseMove(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (element) {
    const combinedText = getTextContent(element);
    const priceTexts = combinedText.split('\n').filter(text => text.includes('R$') || text.includes('$'));

    if (priceTexts.length > 0) {
      const priceText = priceTexts[0].trim();
      const convertedPrice = convertPrice(priceText);

      if (convertedPrice) {
        const exchangeRate = priceText.includes('R$') ? conversionRateBRLtoUSD : conversionRateUSDtoBRL;
        showTooltip(event, convertedPrice, exchangeRate);
      } else {
        hideTooltip();
      }
    } else {
    hideTooltip();
  }
} else {
    hideTooltip();
  }
}

// Attach mousemove listener to document
function attachMouseMoveListener() {
  document.addEventListener('mousemove', handleMouseMove);
}

// Remove mousemove listener from document
function detachMouseMoveListener() {
  document.removeEventListener('mousemove', handleMouseMove);
}

// Toggle the extension's enabled state
function toggleExtension() {
  if (enabled) {
    attachMouseMoveListener();
  } else {
    detachMouseMoveListener();
    hideTooltip();
  }
}

// Listen for changes in the extension's state
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && 'enabled' in changes) {
      enabled = changes.enabled.newValue;
      toggleExtension();
    }
    if (namespace === 'sync' && 'iofRate' in changes) {
      iofRate = changes.iofRate.newValue;
    }
  });
} else {
  console.error('chrome.storage.onChanged is not available');
}

// Fetch the initial state and conversion rates
if (chrome.storage && chrome.storage.sync) {
  chrome.storage.sync.get(['enabled', 'rates', 'iofRate'], (data) => {
    enabled = data.enabled || false;
    const rates = data.rates || {};
    conversionRateBRLtoUSD = rates.BRLtoUSD || 0;
    conversionRateUSDtoBRL = rates.USDtoBRL || 0;
    iofRate = data.iofRate || 0;
    createTooltip();
    if (enabled) {
      attachMouseMoveListener();
    }
  });
} else {
  console.error('chrome.storage.sync is not available');
}
