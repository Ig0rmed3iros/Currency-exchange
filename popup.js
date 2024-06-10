document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle-extension');
  const iofRateInput = document.getElementById('iof-rate');
  const saveIofButton = document.getElementById('save-iof');
  const internationalPurchaseCheckbox = document.getElementById('international-purchase');

  // Initialize the toggle state and IOF rate
  chrome.storage.sync.get(['enabled', 'iofRate', 'internationalPurchase'], (data) => {
    toggle.checked = data.enabled || false;
    iofRateInput.value = data.iofRate || '';
    internationalPurchaseCheckbox.checked = data.internationalPurchase || false;
  });

  // Listen for toggle changes
  toggle.addEventListener('change', function () {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled });
  });

  // Save the IOF rate
  saveIofButton.addEventListener('click', function () {
    let iofRate = iofRateInput.value.replace(',', '.');
    iofRate = parseFloat(iofRate);
    if (!isNaN(iofRate)) {
      chrome.storage.sync.set({ iofRate });
    } else {
      alert('Por favor, informe um IOF válido');
    }
  });

  // Listen for international purchase checkbox changes
  internationalPurchaseCheckbox.addEventListener('change', function () {
    const internationalPurchase = internationalPurchaseCheckbox.checked;
    chrome.storage.sync.set({ internationalPurchase });
  });
});
