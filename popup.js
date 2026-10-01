const PRESETS = [
  { name: 'London', lat: 51.5074,  lng: -0.1278  },
  { name: 'New York', lat: 40.7128,  lng: -74.0060 },
  { name: 'Tokyo',   lat: 35.6762,  lng: 139.6503 },
  { name: 'Sydney',  lat: -33.8688, lng: 151.2093 },
  { name: 'Paris',   lat: 48.8566,  lng: 2.3522   },
  { name: 'Dubai',   lat: 25.2048,  lng: 55.2708  },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694},
  { name: 'Singapore', lat: 1.3521,  lng: 103.8198},
];

const $ = (id) => document.getElementById(id);

async function load() {
  const stored = await chrome.storage.local.get('locationSpoofer');
  const s = stored.locationSpoofer || { enabled: false, latitude: 51.5074, longitude: -0.1278, accuracy: 50 };

  $('enableToggle').checked = !!s.enabled;
  $('latitude').value  = s.latitude  ?? '';
  $('longitude').value = s.longitude ?? '';
  $('accuracy').value  = s.accuracy  ?? 50;
}

function buildPresets() {
  const grid = $('presetGrid');
  PRESETS.forEach(({ name, lat, lng }) => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = `<strong>${name}</strong><span>${lat}, ${lng}</span>`;
    btn.addEventListener('click', () => {
      $('latitude').value  = lat;
      $('longitude').value = lng;
    });
    grid.appendChild(btn);
  });
}

$('applyBtn').addEventListener('click', async () => {
  const lat = parseFloat($('latitude').value);
  const lng = parseFloat($('longitude').value);
  const acc = parseFloat($('accuracy').value) || 50;

  if (isNaN(lat) || lat < -90 || lat > 90) {
    showStatus('Invalid latitude (must be −90 to 90)', true);
    return;
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    showStatus('Invalid longitude (must be −180 to 180)', true);
    return;
  }

  const settings = {
    enabled:   $('enableToggle').checked,
    latitude:  lat,
    longitude: lng,
    accuracy:  acc,
  };

  await chrome.storage.local.set({ locationSpoofer: settings });
  chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
  showStatus(settings.enabled ? 'Spoofing active — tab reloading…' : 'Spoofing disabled — tab reloading…');
});

function showStatus(msg, isError = false) {
  const el = $('status');
  el.textContent = msg;
  el.style.color = isError ? '#e53e3e' : '#38a169';
}

buildPresets();
load();
