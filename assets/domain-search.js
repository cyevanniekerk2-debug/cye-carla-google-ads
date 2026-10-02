
const form = document.getElementById('domainForm');
const input = document.getElementById('domainName');
const tld = document.getElementById('domainTld');
const result = document.getElementById('domainResult');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = input.value.trim().toLowerCase()
    .replace(/^https?:\/\//,'')
    .replace(/^www\./,'')
    .replace(/\s+/g,'-')
    .replace(/[^a-z0-9-]/g,'');

  if (!name) {
    result.className = 'domain-result error';
    result.innerHTML = '<span class="result-icon">!</span><div><strong>Enter a domain name</strong><p>Example: primeplumbing</p></div>';
    return;
  }

  const domain = `${name}.${tld.value}`;
  result.className = 'domain-result checking';
  result.innerHTML = `<span class="result-icon spinner">◌</span><div><strong>Checking ${domain}</strong><p>Searching domain availability…</p></div>`;

  try {
    const response = await fetch(`/api/domain-check?sld=${encodeURIComponent(name)}&tld=${encodeURIComponent(tld.value)}`);
    if (!response.ok) throw new Error('API_NOT_CONNECTED');
    const data = await response.json();

    if (data.available === true) {
      result.className = 'domain-result available';
      result.innerHTML = `<span class="result-icon">✓</span><div><strong>${domain} is available</strong><p>You can continue to registration and add Prime Domain Care for R150/month.</p><a class="btn primary mini" href="domain-checkout.html?domain=${encodeURIComponent(domain)}">Register This Domain</a></div>`;
    } else if (data.available === false) {
      result.className = 'domain-result unavailable';
      result.innerHTML = `<span class="result-icon">×</span><div><strong>${domain} is already registered</strong><p>Try another name or extension.</p></div>`;
    } else {
      throw new Error('BAD_RESPONSE');
    }
  } catch (err) {
    result.className = 'domain-result pending';
    result.innerHTML = `<span class="result-icon">↗</span><div><strong>${domain}</strong><p>Live domain checking is ready for the Prime Digital reseller API connection. No availability result will be guessed.</p></div>`;
  }
});
