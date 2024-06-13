let enabled = false;
let rates = {};
let iofRate = 0;
let internationalPurchase = false;

console.log('Content script loaded');

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
    console.log('Tooltip created');
}

// Show tooltip with the converted price
function showTooltip(event, convertedPrice, exchangeRate) {
    const tooltip = document.getElementById('price-tooltip');
    tooltip.innerHTML = `${convertedPrice}<br>Taxa de Câmbio: ${exchangeRate.toFixed(4)}`;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY - 30}px`;
    tooltip.style.display = 'block';
    console.log('Tooltip shown with converted price:', convertedPrice);
}

// Hide the tooltip
function hideTooltip() {
    const tooltip = document.getElementById('price-tooltip');
    tooltip.style.display = 'none';
    console.log('Tooltip hidden');
}

// Calculate ICMS
function calculateICMS(originalPrice) {
    const totalPrice = originalPrice / 0.83;
    const icms = totalPrice * 0.17;
    console.log('Calculated ICMS:', icms);
    return icms;
}

// Calculate Import Tax
function calculateImportTax(priceWithFreight) {
    const importTax = priceWithFreight * 0.60;
    console.log('Calculated Import Tax:', importTax);
    return importTax;
}

// Convert price to BRL and apply taxes
function convertPrice(priceText) {
    console.log('Converting price:', priceText);
    if (!priceText) {
        console.error('No price text found');
        return null;
    }

    // Extract the currency symbol and the amount
    const currencyMatch = priceText.match(/([^\d.,\s]+)?\s?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?)/);
    console.log('Currency Match:', currencyMatch);

    if (currencyMatch) {
        const symbol = currencyMatch[1] ? currencyMatch[1].trim() : '';
        const currency = window.currencySymbols[symbol] || symbol;
        const price = parseFloat(currencyMatch[2].replace(/[^0-9.]/g, '').replace(',', '.'));
        console.log('Detected Currency:', currency, 'Price:', price);

        if (currency !== 'BRL' && rates[currency]) {
            console.log('Using exchange rate:', rates[currency]);

            const convertedPrice = (price / rates[currency]).toFixed(2);
            const directConversion = (convertedPrice * rates['BRL']).toFixed(2); // Converting to BRL
            console.log('Converted price to BRL:', directConversion);

            const iofTax = (directConversion * (iofRate / 100)).toFixed(2);
            const totalWithIof = (parseFloat(directConversion) + parseFloat(iofTax)).toFixed(2);

            let totalPrice = totalWithIof;
            let icms = 0;
            let importTax = 0;

            if (internationalPurchase) {
                importTax = calculateImportTax(parseFloat(totalWithIof));
                const priceWithImportTax = (parseFloat(totalWithIof) + importTax).toFixed(2);
                icms = calculateICMS(parseFloat(priceWithImportTax));
                totalPrice = (parseFloat(priceWithImportTax) + icms).toFixed(2);
            }

            return `
                Conversão Direta: R$ ${formatBRL(directConversion)}<br>
                Com IOF: R$ ${formatBRL(totalWithIof)}<br>
                IOF (%): ${iofRate}%<br>
                ${internationalPurchase ? `ICMS: R$ ${formatBRL(icms.toFixed(2))}<br>` : ''}
                ${internationalPurchase ? `Taxa de Importação: R$ ${formatBRL(importTax.toFixed(2))}<br>` : ''}
                ${internationalPurchase ? `Total: R$ ${formatBRL(totalPrice)}` : ''}
            `;
        } else {
            console.error('Currency not supported or not found in rates:', currency);
        }
    } else {
        console.error('No currency match found');
    }
    return null;
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
        console.log('Combined Text:', combinedText);
        const priceTexts = combinedText.split('\n').filter(text => text.match(/([^\d.,\s]+)?\s?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})?)/));

        if (priceTexts.length > 0) {
            const priceText = priceTexts[0].trim();
            const convertedPrice = convertPrice(priceText);

            if (convertedPrice) {
                const exchangeRate = priceText.includes('R$') ? rates['BRL'] : rates['USD'];
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
    console.log('Attaching mouse move listener');
    document.addEventListener('mousemove', handleMouseMove);
}

// Remove mousemove listener from document
function detachMouseMoveListener() {
    console.log('Detaching mouse move listener');
    document.removeEventListener('mousemove', handleMouseMove);
}

// Toggle the extension's enabled state
function toggleExtension() {
    if (enabled) {
        console.log('Extension enabled');
        attachMouseMoveListener();
    } else {
        console.log('Extension disabled');
        detachMouseMoveListener();
        hideTooltip();
    }
}

// Listen for changes in the extension's state
if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        console.log('Storage changes detected:', changes);
        if (namespace === 'sync' && 'enabled' in changes) {
            enabled = changes.enabled.newValue;
            toggleExtension();
        }
        if (namespace === 'sync' && 'iofRate' in changes) {
            iofRate = changes.iofRate.newValue;
        }
        if (namespace === 'sync' && 'internationalPurchase' in changes) {
            internationalPurchase = changes.internationalPurchase.newValue;
        }
        if (namespace === 'sync' && 'rates' in changes) {
            rates = changes.rates.newValue;
            console.log('Rates updated:', rates);
        }
    });
} else {
    console.error('chrome.storage.onChanged is not available');
}

// Fetch the initial state and conversion rates
if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['enabled', 'rates', 'iofRate', 'internationalPurchase'], (data) => {
        enabled = data.enabled || false;
        rates = data.rates || {};
        iofRate = data.iofRate || 0;
        internationalPurchase = data.internationalPurchase || false;
        console.log('Initial state:', { enabled, rates, iofRate, internationalPurchase });
        createTooltip();
        if (enabled) {
            attachMouseMoveListener();
        }
    });
} else {
    console.error('chrome.storage.sync is not available');
}
