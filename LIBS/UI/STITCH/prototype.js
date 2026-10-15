// Screen navigation only. No accounts, payments, entitlements or product services.
const screens = {
  '01': ['Choose your reading', 'prepaid_01_choose_your_reading', 'prepaid_01m_choose_your_reading_mobile'],
  '02': ['Make your chart interactive', 'prepaid_02_make_your_chart_interactive', 'prepaid_02m_make_your_chart_interactive_mobile'],
  '03': ['Bring Natally home', 'prepaid_03_bring_natally_home', 'prepaid_03m_bring_natally_home_mobile'],
  '04': ['Alby marketplace', 'prepaid_04_alby_marketplace', 'prepaid_04m_alby_marketplace_mobile'],
  '05': ['x402 request entry', 'prepaid_05_x402_protocol', 'prepaid_05m_x402_protocol_mobile'],
  '06': ['Review your reading', 'prepaid_06_review_your_reading'],
  '07': ['Your reading is ready', 'prepaid_07_your_reading_is_ready', 'prepaid_07m_your_reading_is_ready_mobile'],
  '08': ['Pick up where you left off', 'prepaid_08_pick_up_where_you_left_off'],
};
const offers = {'pdf-only':'Natal chart — PDF only','pdf-spa':'Natal chart — PDF + SPA',home:'Bring Natally home'};
const frame = document.querySelector('#screen');
const select = document.querySelector('#screen-select');
const dialog = document.querySelector('#preview');
const smallViewport = matchMedia('(max-width:767px)');
let mobile = smallViewport.matches;
let view = '01', offer = 'pdf-spa', channel = 'direct';
for (const [id, [name]] of Object.entries(screens)) select.add(new Option(`${id} · ${name}`, id));

function show(id) {
  if (!screens[id]) return;
  const query = new URLSearchParams({screen:id, offer, channel, view:mobile?'mobile':'desktop'});
  location.hash = query.toString();
  render();
}
function render() {
  const query = new URLSearchParams(location.hash.slice(1));
  view = screens[query.get('screen')] ? query.get('screen') : '01';
  offer = offers[query.get('offer')] ? query.get('offer') : offer;
  channel = ['direct','alby','x402'].includes(query.get('channel')) ? query.get('channel') : channel;
  mobile = query.get('view') ? query.get('view') === 'mobile' : mobile;
  const entry = screens[view];
  const path = `screens/${mobile && entry[2] ? entry[2] : entry[1]}/code.html`;
  if (frame.getAttribute('src') !== path) frame.src = path;
  else if (frame.contentDocument?.body) applyScenario(frame.contentDocument);
  select.value = view;
  document.body.classList.toggle('mobile', mobile);
  document.querySelector('#mobile-toggle').setAttribute('aria-pressed', String(mobile));
  document.querySelector('#selection').textContent = `${offers[offer]} · ${channel}${mobile && !entry[2]?' · responsive desktop screen':''}`;
  for (const button of document.querySelectorAll('[data-channel]')) button.setAttribute('aria-pressed', String(button.dataset.channel === channel));
}
function preview(title, copy, next) {
  document.querySelector('#dialog-title').textContent = title;
  document.querySelector('#dialog-copy').textContent = copy;
  const actions = document.querySelector('#dialog-actions');
  actions.replaceChildren();
  if (next) {
    const forward = document.createElement('button');
    forward.textContent = 'Preview delivery screen';
    forward.onclick = () => {dialog.close(); show('07');};
    actions.append(forward);
  }
  const close = document.createElement('button');
  close.textContent = 'Return to screen';
  close.onclick = () => dialog.close();
  actions.append(close);
  dialog.showModal();
}
function selectedOffer(doc) {
  const value = doc.querySelector('input[type="radio"]:checked')?.value;
  if (/^(pdf|pdf_only)$/.test(value)) offer = 'pdf-only';
  else if (/^(home|bring_home|app_home)$/.test(value)) offer = 'home';
  else if (/pdf_spa/.test(value)) offer = 'pdf-spa';
}
function route(action, doc) {
  const text = (action.textContent || '').replace(/\s+/g,' ').trim();
  if (/close|dismiss|^paste demo$/i.test(text) || (view === '08' && /^\d\./.test(text))) return false;
  if (action.getAttribute('role') === 'radio' || action.hasAttribute('aria-checked')) {
    if (/PDF only/.test(text)) offer = 'pdf-only';
    else if (/PDF \+ SPA/.test(text)) offer = 'pdf-spa';
    else if (/Bring Natally home/.test(text)) offer = 'home';
    document.querySelector('#selection').textContent = `${offers[offer]} · ${channel}`;
    return false;
  }
  if (/choose another payment|return to offers|back to offers|^Natally$|^Natal Chart$/i.test(text)) {show('01'); return true;}
  if (/arrow_back_ios_new|Return to previous/.test(text) || action.getAttribute('aria-label')?.includes('previous')) {show('01'); return true;}
  if (view === '01') {
    if (/2\. Interactive/.test(text)) show('02');
    else if (/3\. Bring/.test(text)) show('03');
    else if (/4\. Channel/.test(text)) show('06');
    else {selectedOffer(doc); show(offer === 'pdf-only'?'02':offer === 'home'?'06':'03');}
  } else if (view === '02') {offer = /Keep PDF only/i.test(text)?'pdf-only':'pdf-spa'; show('03');}
  else if (view === '03') {if (/Choose Bring/i.test(text)) offer = 'home'; show('06');}
  else if (view === '04' || view === '05') {selectedOffer(doc); channel = view === '04'?'alby':'x402'; show('06');}
  else if (view === '06') {
    if (/Change package/i.test(text)) show('01');
    else if (/Edit birth/i.test(text)) preview('Birth details — screen concept', 'The summary uses fictional example details. Editing and chart calculation are outside this screen prototype.');
    else preview(channel === 'x402'?'x402 quote — screen concept':channel === 'alby'?'Lightning quote — screen concept':'Prepaid quote — screen concept', 'The live checkout would show the final amount, applicable currency or asset, terms and expiry for this package. This prototype requests no payment. Continue to inspect the example delivery screen.', true);
  } else if (view === '07') {
    if (/Learn about|Explore Bring|Open personal|Open Natally/i.test(text)) show('03');
    else if (/Download|Keep PDF/i.test(text)) preview('PDF delivery — screen concept', 'This control represents the PDF download after a completed order. No PDF is generated or downloaded by this screen prototype.');
    else if (/interactive/i.test(text)) show('02');
    else show('01');
  } else if (view === '08') {
    if (/fresh quote/i.test(text)) show(channel === 'x402'?'05':channel === 'alby'?'04':'06');
    else if (/Access|Find my reading/i.test(text)) show('07');
    else show('06');
  }
  return true;
}
frame.addEventListener('load', () => {
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.addEventListener('click', event => {
    const action = event.target.closest('a,button');
    if (!action || !route(action, doc)) return;
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  doc.addEventListener('submit', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    selectedOffer(doc);
    if (view === '01') show(offer === 'pdf-only'?'02':offer === 'home'?'06':'03');
  }, true);
  applyScenario(doc);
});
function applyScenario(doc) {
  if (['04','05','06'].includes(view)) {
    for (const heading of doc.querySelectorAll(view === '04'?'h2':'h2,h3')) {
      if (/^Natal chart|^Natal Chart|^PDF \+ SPA/.test(heading.textContent.trim())) heading.textContent = offers[offer];
    }
  }
  const description = doc.querySelector('[data-prototype-offer-description]');
  if (description) description.textContent = {'pdf-only':'A natal chart reading to download.','pdf-spa':'A natal reading to download, plus an interactive chart in your browser.',home:'A personal Natally web app experience.'}[offer];
  const chosenChannel = doc.querySelector('[data-prototype-channel]');
  if (chosenChannel) chosenChannel.textContent = {direct:'Natally direct',alby:'Alby marketplace · Lightning',x402:'x402 · request-based quote'}[channel];
  const spaInclusion = doc.querySelector('[data-prototype-spa-included]');
  if (spaInclusion) spaInclusion.parentElement.hidden = offer === 'pdf-only';
  if (view === '04' && !mobile) {
    const value = {'pdf-only':'pdf','pdf-spa':'pdf_spa',home:'home'}[offer];
    const input = doc.querySelector(`input[value="${value}"]`);
    if (input) {input.checked = true; input.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));}
  }
  if (view === '04' && mobile) {
    const option = Array.from(doc.querySelectorAll('[role="radio"]')).find(element => element.textContent.includes(offers[offer]));
    if (option) option.click();
  }
}
select.onchange = () => show(select.value);
document.querySelector('#mobile-toggle').onclick = () => {mobile = !mobile; show(view);};
document.querySelector('#restart').onclick = () => {offer = 'pdf-spa'; show('01');};
for (const button of document.querySelectorAll('[data-channel]')) button.onclick = () => {channel = button.dataset.channel; show(channel === 'alby'?'04':channel === 'x402'?'05':'01');};
addEventListener('hashchange', render);
render();
