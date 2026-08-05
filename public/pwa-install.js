
if((typeof _deferredPrompt !== 'undefined' && _deferredPrompt) || (window.matchMedia('(display-mode: standalone)').matches === false && /android|iphone|ipad|ipod/i.test(navigator.userAgent))) {
  var ib = document.getElementById('installBanner');
  if(ib) ib.style.display = 'block';
}
