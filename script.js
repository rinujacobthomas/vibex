// ===== vibex fitness waitlist (Apps Script friendly) =====
// Endpoint already set earlier
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbyDDaTSRNraNLKFxROx2XpdYr9nJuUc8lQdAzziYMqzxKV6MVUYfwIRN0WCabFlyF2Z9Q/exec";

async function subscribeWaitlist(e){
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const payload = {
    name: data.get('name')?.trim(),
    email: data.get('email')?.trim(),
    phone: data.get('phone')?.trim() || null,
    source: 'vibex-site',
    ts: new Date().toISOString()
  };

  if(!payload.name || !payload.email){
    alert('Please enter your name and email.');
    return false;
  }

  try {
    // Use text/plain to avoid CORS preflight (Apps Script friendly)
    const res = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    let ok = false;
    try {
      const text = await res.text();
      const maybe = JSON.parse(text);
      ok = !!maybe.ok || res.ok;
    } catch(_) {
      ok = res.ok; // if response isn't JSON, rely on HTTP status
    }

    if(ok){
      alert('Thanks! You are on the list. We\'ll notify you when we launch.');
      form.reset();
    } else {
      alert('Sorry, something went wrong. Please try again later.');
    }
  } catch (err){
    console.error('Waitlist error:', err);
    alert('Sorry, something went wrong. Please try again later.');
  }
  return false;
}

document.getElementById('year').textContent = new Date().getFullYear();
