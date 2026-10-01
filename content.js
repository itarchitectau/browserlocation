// Runs in ISOLATED world at document_start.
// Reads settings from storage and injects the spoof script into the MAIN
// world before any page scripts execute.

(async function () {
  const defaults = { enabled: false, latitude: 51.5074, longitude: -0.1278, accuracy: 50 };

  let settings = defaults;
  try {
    const stored = await chrome.storage.local.get('locationSpoofer');
    if (stored.locationSpoofer) settings = { ...defaults, ...stored.locationSpoofer };
  } catch (_) {}

  if (!settings.enabled) return;

  const { latitude, longitude, accuracy } = settings;

  // Build a self-contained spoof snippet with values baked in.
  const spoofCode = `(function(){
    var lat=${latitude}, lng=${longitude}, acc=${accuracy};
    function makePos(){
      return {
        coords:{latitude:lat,longitude:lng,accuracy:acc,
                altitude:null,altitudeAccuracy:null,heading:null,speed:null},
        timestamp:Date.now()
      };
    }
    var spoofed={
      getCurrentPosition:function(ok,err,opts){ setTimeout(function(){ok(makePos());},0); },
      watchPosition:function(ok,err,opts){ setTimeout(function(){ok(makePos());},0); return Math.floor(Math.random()*1e9); },
      clearWatch:function(){}
    };
    try{
      Object.defineProperty(navigator,'geolocation',{get:function(){return spoofed;},configurable:true});
    }catch(e){}
  })();`;

  const script = document.createElement('script');
  script.textContent = spoofCode;
  (document.documentElement || document.head || document.body).appendChild(script);
  script.remove();
})();
