const VAPID_PUBLIC = 'BNwPMKt-hOvvHsATkyCmsudziNOyAgwCUnx6--mNxAgoIRSEzKbe7yzr0LLHxDGg26jxusKwchjU9zaMjDtZzks';
const NTFY_TOPIC = 'maple-push-reg-9f3k7x2qde';

const statusEl = document.getElementById('status');
const btn = document.getElementById('subBtn');
const warn = document.getElementById('installWarn');
const subJson = document.getElementById('subJson');

function setStatus(t) { statusEl.textContent = t; }

// iOS: web push only works from a Home Screen-installed PWA
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (!isStandalone) warn.hidden = false;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => setStatus('Service worker failed: ' + err));
} else {
  setStatus('Service workers not supported here.');
  btn.disabled = true;
}

btn.addEventListener('click', async () => {
  try {
    btn.disabled = true;
    setStatus('Requesting permission…');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setStatus('Permission denied. Enable notifications for this app in iOS Settings → Notifications.');
      btn.disabled = false;
      return;
    }
    setStatus('Subscribing…');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
    });
    const subText = JSON.stringify(sub);
    subJson.value = subText;

    // Send the subscription to Maple via ntfy so he can push to this device
    setStatus('Sending subscription to Maple…');
    const res = await fetch('https://ntfy.sh/' + NTFY_TOPIC, { method: 'POST', body: subText });
    if (res.ok) {
      setStatus('✅ Subscribed! Tell Maple "I subscribed" and he will send you a test push.\n\n(Your subscription was delivered to him automatically.)');
    } else {
      setStatus('✅ Subscribed on this device, but auto-delivery failed.\nCopy the subscription from "Subscription details" below and paste it to Maple in chat.');
    }
  } catch (err) {
    setStatus('Something went wrong: ' + (err && err.message ? err.message : err));
    btn.disabled = false;
  }
});
