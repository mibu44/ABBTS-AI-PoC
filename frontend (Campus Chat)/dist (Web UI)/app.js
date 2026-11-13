const $ = selector => document.querySelector(selector);
const config = window.CHAT_CONFIG;
let chats = [];
try { chats = JSON.parse(localStorage.getItem('abbts-chats') || '[]'); } catch {}
if (!Array.isArray(chats)) chats = [];
chats = chats.filter(chat => chat && typeof chat.id === 'string' && Array.isArray(chat.messages));
let active = null;
let busy = false;
function save() { try { localStorage.setItem('abbts-chats', JSON.stringify(chats)); } catch {} }
function render() {
  $('#history').replaceChildren();
  for (const chat of chats) {
    const button = document.createElement('button');
    button.textContent = chat.title;
    button.className = chat === active ? 'active' : '';
    button.onclick = () => { if (busy) return; active = chat; render(); $('#sidebar').classList.remove('open'); };
    $('#history').append(button);
  }
  $('#welcome').hidden = !!active;
  $('#messages').replaceChildren();
  for (const message of active?.messages || []) {
    const node = document.createElement('div');
    node.className = 'message ' + (message.role === 'user' ? 'user' : 'assistant');
    if (message.role !== 'user') {
      const label = document.createElement('small');
      label.textContent = 'ABB TS · CAMPUS ASSISTENT';
      node.append(label);
    }
    node.append(document.createTextNode(message.content));
    for (const source of message.sources || []) {
      try {
        const url = new URL(source.url);
        if (!['https:', 'http:'].includes(url.protocol)) continue;
        const link = document.createElement('a');
        link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = source.title || url.hostname;
        node.append(link);
      } catch {}
    }
    $('#messages').append(node);
  }
  $('#scroll').scrollTop = $('#scroll').scrollHeight;
}
async function send(text) {
  if (busy || !text.trim()) return;
  busy = true; $('#send').disabled = true;
  if (!active) { active = { id: crypto.randomUUID(), title: text.slice(0,45), messages: [] }; chats.unshift(active); }
  active.messages.push({ role: 'user', content: text });
  const conversation = active.messages.map(message => ({role: message.role, content: message.content}));
  const reply = { role: 'assistant', content: 'Deine Anfrage wird bearbeitet …' };
  active.messages.push(reply); $('#input').value = ''; render();
  try {
    if (config.demo) {
      await new Promise(resolve => setTimeout(resolve, 600));
      reply.content = /stunden|unterricht|raum|lektion/i.test(text)
        ? 'Für deinen persönlichen Stundenplan benötige ich deine Klasse und den gewünschten Tag. Welche Klasse besuchst du?\n\nDemo-Modus · Die Verbindung zu den Stundenplandaten wird in der nächsten Projektphase eingerichtet.'
        : 'Ich unterstütze dich bei Fragen zur ABB Technikerschule – zum Beispiel zu Kontaktmöglichkeiten, Studiengängen und organisatorischen Themen.\n\nDemo-Modus · Sobald der Schulinfo-Agent angebunden ist, erhältst du hier eine Antwort mit den passenden Quellen der ABB-TS-Webseite.';
    } else {
      if (!config.endpoint) throw new Error('Die API-Adresse fehlt.');
      const response = await fetch(config.endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({conversation_id: active.id, messages: conversation}), signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error('Der Coordinator ist momentan nicht erreichbar.');
      const data = await response.json();
      if (typeof data.answer !== 'string') throw new Error('Das Antwortformat ist ungültig.');
      reply.content = data.answer;
      reply.sources = Array.isArray(data.sources) ? data.sources : [];
    }
  } catch (error) { reply.content = 'Die Anfrage konnte nicht abgeschlossen werden. ' + error.message + ' Bitte sende deine Frage erneut.'; }
  finally { busy = false; $('#send').disabled = false; save(); render(); $('#input').focus(); }
}
$('#form').onsubmit = event => { event.preventDefault(); send($('#input').value.trim()); };
$('#input').onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send($('#input').value.trim()); } };
document.querySelectorAll('[data-prompt]').forEach(button => button.onclick = () => send(button.dataset.prompt));
$('#new').onclick = () => { if (busy) return; active = null; render(); $('#input').focus(); $('#sidebar').classList.remove('open'); };
$('#clear').onclick = () => { if (busy || !confirm('Alle lokal gespeicherten Gespräche löschen?')) return; chats = []; active = null; save(); render(); };
$('#menu').onclick = () => $('#sidebar').classList.toggle('open');
$('#status').textContent = config.demo ? '●  Demo-Version' : '●  Campus Chat';
render();
