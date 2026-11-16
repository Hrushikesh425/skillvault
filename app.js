const KEY = 'skillvault_state_v1';
const STARTER_CREDITS = 5;

const PEERS = [
  {id:'p1',name:'Ananya Rao',initials:'AR',av:'av-1',rating:'4.9',swaps:23,skill:'Python Basics',cat:'Coding',desc:'Variables, loops and functions — write your first 40 lines of real code.',level:'Beginner friendly',format:'Online · Google Meet',tags:['Debugging','Mini project'],match:96,verified:true},
  {id:'p2',name:'Kabir Menon',initials:'KM',av:'av-2',rating:'4.8',swaps:31,skill:'Guitar Chords',cat:'Music',desc:'Open chords, strumming patterns and one full song by the end of the hour.',level:'Beginner friendly',format:'On campus · Music room',tags:['Acoustic','Song practice'],match:92,verified:true},
  {id:'p3',name:'Meera Iyer',initials:'MI',av:'av-3',rating:'5.0',swaps:18,skill:'Spoken French',cat:'Languages',desc:'Conversational French for travellers and DELF beginners. Zero judgement.',level:'Beginner friendly',format:'Online · Google Meet',tags:['Conversation','Pronunciation'],match:89,verified:false},
  {id:'p4',name:'Aditya Sen',initials:'AS',av:'av-4',rating:'4.7',swaps:12,skill:'Figma & UI/UX',cat:'Design',desc:'Wireframes, auto-layout and a clickable prototype you can put in a portfolio.',level:'Intermediate',format:'Online · Figma jam',tags:['Prototyping','Portfolio'],match:94,verified:true},
  {id:'p5',name:'Sneha Kulkarni',initials:'SK',av:'av-6',rating:'4.9',swaps:27,skill:'Excel & Data Analysis',cat:'Academics',desc:'Pivot tables, clean dashboards and the formulas interviewers actually ask for.',level:'Beginner friendly',format:'Either works',tags:['Pivot tables','Dashboards'],match:87,verified:true},
  {id:'p6',name:'Rahul Verma',initials:'RV',av:'av-5',rating:'4.6',swaps:9,skill:'Public Speaking',cat:'Career',desc:'Structure a talk, kill filler words and survive question time with confidence.',level:'Intermediate',format:'On campus · Seminar hall',tags:['Stage presence','Interview prep'],match:91,verified:false},
  {id:'p7',name:'Tanvi Bhat',initials:'TB',av:'av-3',rating:'4.8',swaps:15,skill:'Video Editing',cat:'Creative',desc:'Cut a 60-second reel in CapCut and Premiere Rush. Sound, pacing and captions.',level:'Beginner friendly',format:'Online · Screen share',tags:['Reels','CapCut'],match:85,verified:false},
  {id:'p8',name:'Vikram Nair',initials:'VN',av:'av-4',rating:'4.9',swaps:35,skill:'Calculus Crash Course',cat:'Academics',desc:'Limits, derivatives and integrals explained with past-paper drills.',level:'Intermediate',format:'On campus · Library',tags:['Semester prep','Problem sets'],match:83,verified:true},
  {id:'p9',name:'Ishita Roy',initials:'IR',av:'av-6',rating:'4.7',swaps:11,skill:'Chess Openings',cat:'Creative',desc:'Build a reliable opening repertoire and stop losing in the first ten moves.',level:'Intermediate',format:'Online · Chess.com',tags:['Tactics','Endgames'],match:81,verified:false},
  {id:'p10',name:'Dev Patel',initials:'DP',av:'av-2',rating:'4.8',swaps:20,skill:'Android Dev (Kotlin)',cat:'Coding',desc:'Ship your first Android app screen with Kotlin and Jetpack Compose.',level:'Beginner friendly',format:'Online · Pair programming',tags:['Kotlin','Compose'],match:90,verified:true},
  {id:'p11',name:'Aisha Khan',initials:'AK',av:'av-1',rating:'5.0',swaps:24,skill:'Content Writing',cat:'Career',desc:'Write hooks, structure newsletters and build a portfolio that gets replies.',level:'Beginner friendly',format:'Either works',tags:['Copywriting','LinkedIn'],match:88,verified:true},
  {id:'p12',name:'Nikhil Das',initials:'ND',av:'av-5',rating:'4.5',swaps:7,skill:'Vocal Training',cat:'Music',desc:'Breath support, pitch matching and warm-ups that save your voice.',level:'Beginner friendly',format:'On campus · Music room',tags:['Breathing','Pitch'],match:78,verified:false}
];

const CATEGORIES = ['All','Coding','Music','Languages','Design','Academics','Creative','Career'];

const VIEW_META = {
  discover:['Discover skills','Book a peer with your Time Credits — escrow protects both sides.'],
  sessions:['My sessions','Track active swaps, confirm sessions and release escrow.'],
  teach:['Teach and earn','List a skill, run a session, earn 1 credit per hour taught.'],
  wallet:['Wallet','Your credits, boosts, verification and full transaction history.']
};

let state = loadState();
let activeCategory = 'All';
let query = '';
let bookingPeer = null;
let settleTimers = {};

const $ = (id) => document.getElementById(id);

function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw) return normalize(JSON.parse(raw));
  }catch(e){}
  return normalize({});
}

function normalize(s){
  return Object.assign({
    name:'', onboarded:false, credits:0, escrow:0, earned:0, spent:0,
    pro:false, verified:false, sessions:[], requests:[], listings:[], ledger:[]
  }, s);
}

function saveState(){
  recomputeEscrow();
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
  renderAll();
}

function recomputeEscrow(){
  state.escrow = state.sessions
    .filter(s => s.role === 'learner' && s.status === 'locked')
    .reduce((a,s) => a + Number(s.credits), 0);
}

function initialsOf(name){
  return name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('') || 'U';
}

function esc(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function money(n){
  return '₹' + Number(n).toLocaleString('en-IN');
}

function creditLabel(n){
  return (n > 0 ? '+' : '') + n + ' TC';
}

function shortDate(ts){
  return new Date(ts).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

function addLedger(detail, type, amount, kind){
  state.ledger.unshift({id:'l'+Date.now()+Math.random().toString(16).slice(2,6), detail, type, amount, kind, at:Date.now()});
}

function toast(title, message, tone){
  const el = document.createElement('div');
  el.className = 'toast ' + (tone || 'info');
  el.innerHTML = '<span class="ti">' + (tone === 'good' ? '✓' : tone === 'warn' ? '!' : 'i') + '</span><div><b>' + esc(title) + '</b><span>' + esc(message) + '</span></div>';
  $('toastWrap').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 4200);
}

function openModal(id){ $(id).classList.add('open'); }
function closeModal(id){ $(id).classList.remove('open'); }

function switchView(view){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const panel = $('view-' + view);
  if(panel) panel.classList.add('active');
  document.querySelectorAll('.sidebar .side-link[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  const meta = VIEW_META[view] || VIEW_META.discover;
  $('viewTitle').textContent = meta[0];
  $('viewSub').textContent = meta[1];
  if(window.innerWidth < 1020){
    panel.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

function renderAll(){
  recomputeEscrow();
  $('navBalance').textContent = state.credits;
  $('statAvail').innerHTML = state.credits + ' <small>TC</small>';
  $('statEscrow').innerHTML = state.escrow + ' <small>TC</small>';
  $('statEarned').innerHTML = state.earned + ' <small>TC</small>';
  $('statSpent').innerHTML = state.spent + ' <small>TC</small>';
  $('walletAvail').innerHTML = state.credits + ' <small>TC</small>';
  $('walletEscrow').innerHTML = state.escrow + ' <small>TC</small>';
  $('walletEarned').innerHTML = state.earned + ' <small>TC</small>';
  $('walletSpent').innerHTML = state.spent + ' <small>TC</small>';
  $('escrowNote').textContent = state.escrow + ' TC in escrow';
  $('sessionsBadge').textContent = state.sessions.filter(s => s.status === 'locked').length;
  $('planBadge').textContent = state.pro ? 'Pro' : 'Starter';
  $('userChipName').textContent = state.onboarded ? (state.name || 'Guest') : 'Guest';
  $('userAvatar').textContent = state.onboarded ? initialsOf(state.name || 'Guest') : 'G';
  $('userAvatar').className = 'avatar av-1';
  renderChips();
  renderSkills();
  renderSessions();
  renderRequests();
  renderListings();
  renderLedger();
  renderBoosts();
}

function renderChips(){
  $('chips').innerHTML = CATEGORIES.map(c =>
    '<button class="chip' + (c === activeCategory ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>'
  ).join('');
}

function renderSkills(){
  const q = query.trim().toLowerCase();
  const list = PEERS
    .filter(p => activeCategory === 'All' || p.cat === activeCategory)
    .filter(p => !q || (p.skill + ' ' + p.name + ' ' + p.cat + ' ' + p.tags.join(' ')).toLowerCase().includes(q))
    .sort((a,b) => b.match - a.match);

  if(!list.length){
    $('skillGrid').innerHTML = '<div class="empty" style="grid-column:1/-1"><b>No matches yet</b>Try a different skill or clear the search.</div>';
    return;
  }

  $('skillGrid').innerHTML = list.map(p => {
    const canBook = state.credits >= 1;
    return '<article class="skill-card">' +
      '<div class="skill-top">' +
        '<div class="avatar ' + p.av + '">' + p.initials + '</div>' +
        '<div class="who"><b>' + esc(p.name) + (p.verified ? ' <span style="color:#b7791f;font-size:11px">●</span>' : '') + '</b><span>' + p.swaps + ' swaps · ' + p.level + '</span></div>' +
        '<span class="rating">★ ' + p.rating + '</span>' +
      '</div>' +
      '<div class="skill-title">' + esc(p.skill) + '</div>' +
      '<p class="skill-desc">' + esc(p.desc) + '</p>' +
      '<div class="skill-tags"><span class="mini-tag">' + esc(p.format) + '</span><span class="mini-tag">' + esc(p.cat) + '</span>' + (p.verified ? '<span class="mini-tag" style="color:#96650a;border-color:#f0dcaa;background:#fff6e0">Verified</span>' : '') + '</div>' +
      '<div class="skill-foot">' +
        '<div class="cost"><b>1 TC</b> / hour <span class="match" style="margin-left:6px">' + p.match + '% match</span></div>' +
        '<button class="btn btn-primary btn-sm" data-book="' + p.id + '"' + (canBook ? '' : ' disabled') + '>' + (canBook ? 'Book swap' : 'Need credits') + '</button>' +
      '</div>' +
    '</article>';
  }).join('');
}

function sessionCard(s){
  const done = s.status === 'done';
  const isTeacher = s.role === 'teacher';
  const name = isTeacher ? s.student : s.peerName;
  const av = s.av;
  const initials = s.initials;
  const progress = done ? 100 : (s.myConfirm ? 50 : 0);
  const statusClass = done ? 'done' : (s.myConfirm ? 'wait' : 'locked');
  const statusText = done ? 'Released' : (s.myConfirm ? 'Awaiting peer' : 'In escrow');
  const action = done
    ? '<span class="confirm-state"><span class="ok">✓ Completed &amp; settled on ' + shortDate(s.settledAt || s.createdAt) + '</span></span>'
    : (s.myConfirm
      ? '<div class="confirm-state"><span class="ok">✓ You confirmed</span><span>Waiting for ' + esc(name.split(' ')[0]) + ' to confirm…</span></div>'
      : '<div class="session-actions"><button class="btn btn-accent btn-sm" data-complete="' + s.id + '">' + (isTeacher ? 'Mark session taught' : 'I completed this session') + '</button></div>');

  return '<div class="session-card">' +
    '<div class="session-top">' +
      '<div class="avatar ' + av + '">' + initials + '</div>' +
      '<div class="who"><b>' + esc(s.skill) + '</b><span>' + (isTeacher ? 'Student: ' + esc(name) : 'Teacher: ' + esc(name)) + ' · ' + s.hours + ' hr · ' + shortDate(s.createdAt) + '</span></div>' +
      '<span class="status ' + statusClass + '">' + statusText + '</span>' +
    '</div>' +
    '<div class="session-meta">' +
      '<span>Value <b>' + s.credits + ' TC</b></span>' +
      '<span>' + (isTeacher ? 'Earning' : 'Locked in escrow') + '</span>' +
      '<span>Role <b>' + (isTeacher ? 'Teacher' : 'Learner') + '</b></span>' +
    '</div>' +
    '<div class="session-bar"><div class="bar"><i style="width:' + progress + '%"></i></div><span class="muted" style="font-size:11.5px">' + progress + '% confirmed</span></div>' +
    action +
  '</div>';
}

function renderSessions(){
  const active = state.sessions.filter(s => s.status === 'locked');
  const done = state.sessions.filter(s => s.status === 'done');
  $('activeSessions').innerHTML = active.length
    ? active.map(sessionCard).join('')
    : '<div class="empty"><b>No active swaps</b>Book a skill from Discover, or accept a teaching request to start one.</div>';
  $('doneSessions').innerHTML = done.length
    ? done.map(sessionCard).join('')
    : '<div class="empty"><b>Nothing completed yet</b>Your settled swaps and released credits will appear here.</div>';
}

function renderRequests(){
  const list = state.requests.filter(r => r.status === 'pending');
  if(!list.length){
    $('requestList').innerHTML = '<div class="empty"><b>No pending requests</b>Publish a listing or simulate a booking below to see the teacher-side flow.</div>';
    return;
  }
  $('requestList').innerHTML = list.map(r =>
    '<div class="request-card">' +
      '<div class="avatar ' + r.av + '">' + r.initials + '</div>' +
      '<div class="who"><b>' + esc(r.student) + ' wants to learn ' + esc(r.skill) + '</b><span>' + r.hours + ' hour session · ' + esc(r.note) + ' · ' + r.hours + ' TC already in escrow</span></div>' +
      '<button class="btn btn-accent btn-sm" data-accept="' + r.id + '">Accept request</button>' +
    '</div>'
  ).join('');
}

function renderListings(){
  const grid = $('myListings');
  if(!state.listings.length){
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><b>No listings yet</b>Add the first skill you can teach using the form above.</div>';
    return;
  }
  grid.innerHTML = state.listings.map((l, i) =>
    '<article class="skill-card">' +
      '<div class="skill-top">' +
        '<div class="avatar av-2">' + initialsOf(state.name || 'Guest') + '</div>' +
        '<div class="who"><b>You' + (state.verified ? ' <span style="color:#b7791f;font-size:11px">●</span>' : '') + '</b><span>Our newest teacher · 0 swaps</span></div>' +
        '<span class="match">' + (90 + (i % 7)) + '% match</span>' +
      '</div>' +
      '<div class="skill-title">' + esc(l.skill) + '</div>' +
      '<p class="skill-desc">' + esc(l.desc || 'A one-hour, beginner-friendly intro session.') + '</p>' +
      '<div class="skill-tags"><span class="mini-tag">' + esc(l.cat) + '</span><span class="mini-tag">' + esc(l.level) + '</span><span class="mini-tag">' + esc(l.format) + '</span></div>' +
      '<div class="skill-foot">' +
        '<div class="cost"><b>1 TC</b> / hour earned</div>' +
        '<button class="btn btn-ghost btn-sm" data-simulate="' + i + '">Simulate booking</button>' +
      '</div>' +
    '</article>'
  ).join('');
}

function renderLedger(){
  if(!state.ledger.length){
    $('ledgerBody').innerHTML = '<tr><td colspan="4" style="text-align:center;padding:28px">No transactions yet. Your first bonus will show up here.</td></tr>';
    return;
  }
  $('ledgerBody').innerHTML = state.ledger.map(l => {
    const isCredit = typeof l.amount === 'number';
    const cls = !isCredit ? 'neutral' : (l.amount > 0 ? 'pos' : 'neg');
    const txt = isCredit ? creditLabel(l.amount) : l.amount;
    return '<tr>' +
      '<td><b>' + esc(l.detail) + '</b></td>' +
      '<td><span class="type">' + esc(l.type) + '</span></td>' +
      '<td>' + shortDate(l.at) + '</td>' +
      '<td class="amt ' + cls + '">' + esc(txt) + '</td>' +
    '</tr>';
  }).join('');
}

function renderBoosts(){
  const setBtn = (id, label, disabled, extra) => {
    const b = $(id);
    if(!b) return;
    b.textContent = label;
    b.disabled = !!disabled;
    b.className = 'btn ' + (extra || 'btn-primary') + ' btn-sm';
  };
  setBtn('buyPro', state.pro ? 'Pro active' : 'Upgrade to Pro', state.pro, state.pro ? 'btn-ghost' : 'btn-primary');
  setBtn('buyBadge', state.verified ? 'Verified' : 'Get verified', state.verified, 'btn-ghost');
  $('buyTopup').textContent = 'Add 5 credits';
}

function bookModal(peer){
  bookingPeer = peer;
  $('bookTitle').textContent = 'Book ' + peer.skill;
  $('bookSub').textContent = peer.name + ' · ' + peer.rating + ' stars · ' + peer.swaps + ' completed swaps';
  $('bookBody').innerHTML =
    '<div class="swap-row">' +
      '<div class="avatar ' + peer.av + '">' + peer.initials + '</div>' +
      '<div class="who"><b>' + esc(peer.skill) + '</b><span>' + esc(peer.format) + ' · ' + esc(peer.level) + '</span></div>' +
      '<span class="match">' + peer.match + '% match</span>' +
    '</div>' +
    '<div class="field" style="margin-top:16px">' +
      '<label for="bookHours">Session length</label>' +
      '<select id="bookHours"><option value="1">1 hour — 1 Time Credit</option><option value="2">2 hours — 2 Time Credits</option><option value="3">3 hours — 3 Time Credits</option></select>' +
    '</div>' +
    '<div style="margin-top:16px">' +
      '<div class="how-line"><span>Your balance</span><b>' + state.credits + ' TC</b></div>' +
      '<div class="how-line"><span>Escrow lock</span><b id="bookCost">1 TC</b></div>' +
      '<div class="how-line"><span>Balance after booking</span><b id="bookAfter">' + Math.max(0, state.credits - 1) + ' TC</b></div>' +
      '<div class="total-line"><span>Released when both confirm</span><b>1 TC</b></div>' +
    '</div>' +
    '<p class="hint" style="margin-top:12px">If you do not confirm completion, the credit stays locked — nobody can take it.</p>';

  const hoursEl = $('bookHours');
  hoursEl.addEventListener('change', updateBookCost);
  $('bookConfirm').disabled = state.credits < 1;
  $('bookConfirm').textContent = state.credits < 1 ? 'Not enough credits' : 'Lock credit in escrow';
  openModal('bookModal');
}

function updateBookCost(){
  const hours = Number($('bookHours').value);
  const enough = state.credits >= hours;
  $('bookCost').textContent = hours + ' TC';
  $('bookAfter').textContent = Math.max(0, state.credits - hours) + ' TC';
  $('bookConfirm').disabled = !enough;
  $('bookConfirm').textContent = enough ? 'Lock credit in escrow' : 'Not enough credits';
}

function confirmBooking(){
  if(!bookingPeer) return;
  const hours = Number($('bookHours').value);
  if(state.credits < hours){
    toast('Not enough credits', 'Earn by teaching or grab a 5-credit top-up pack in Wallet.', 'warn');
    return;
  }
  state.credits -= hours;
  state.sessions.unshift({
    id:'s' + Date.now(),
    role:'learner',
    peerId: bookingPeer.id,
    peerName: bookingPeer.name,
    initials: bookingPeer.initials,
    av: bookingPeer.av,
    skill: bookingPeer.skill,
    hours, credits: hours,
    status:'locked',
    myConfirm:false,
    peerConfirm:false,
    createdAt:Date.now()
  });
  addLedger('Escrow opened — ' + bookingPeer.skill + ' with ' + bookingPeer.name, 'Escrow', 'Locked', 'neutral');
  closeModal('bookModal');
  saveState();
  switchView('sessions');
  toast('Credit locked in escrow', hours + ' TC reserved for ' + bookingPeer.name + '. Nothing gets paid until you both confirm.', 'good');
}

function completeSession(id){
  const s = state.sessions.find(x => x.id === id);
  if(!s || s.status !== 'locked' || s.myConfirm) return;
  s.myConfirm = true;
  s.myConfirmedAt = Date.now();
  saveState();
  toast('Marked complete', 'Waiting for your peer to confirm. Demo peer auto-confirms in 2 seconds.', 'info');
  settleTimers[id] = setTimeout(() => peerConfirm(id), 2000);
}

function peerConfirm(id){
  const s = state.sessions.find(x => x.id === id);
  if(!s || s.status !== 'locked' || !s.myConfirm || s.peerConfirm) return;
  s.peerConfirm = true;
  s.status = 'done';
  s.settledAt = Date.now();
  if(s.role === 'learner'){
    state.spent += Number(s.credits);
    addLedger('Swap completed — ' + s.skill + ' with ' + s.peerName, 'Session', -Number(s.credits), 'neg');
    toast('Escrow released', s.credits + ' TC paid to ' + s.peerName + '. Swap settled and rated.', 'good');
  }else{
    state.credits += Number(s.credits);
    state.earned += Number(s.credits);
    addLedger('Taught ' + s.skill + ' — ' + s.student, 'Teaching', Number(s.credits), 'pos');
    toast('Credits earned', '+' + s.credits + ' TC from teaching ' + s.skill + '. Spend it on anything.', 'good');
  }
  saveState();
}

function acceptRequest(id){
  const r = state.requests.find(x => x.id === id);
  if(!r || r.status !== 'pending') return;
  r.status = 'accepted';
  state.sessions.unshift({
    id:'s' + Date.now(),
    role:'teacher',
    student: r.student,
    initials: r.initials,
    av: r.av,
    skill: r.skill,
    hours: r.hours,
    credits: r.hours,
    status:'locked',
    myConfirm:false,
    peerConfirm:false,
    createdAt:Date.now()
  });
  saveState();
  switchView('sessions');
  toast('Request accepted', r.student.split(' ')[0] + '\'s ' + r.hours + ' TC is locked in escrow. Teach the session, then mark it complete.', 'good');
}

function simulateBooking(index){
  const l = state.listings[index];
  if(!l) return;
  const names = [['Aarav Nair','AN','av-4'],['Diya Shah','DS','av-6'],['Kunal Bose','KB','av-3']];
  const pick = names[state.requests.length % names.length];
  state.requests.push({
    id:'r' + Date.now(),
    student: pick[0],
    initials: pick[1],
    av: pick[2],
    skill: l.skill,
    hours: 1,
    note: 'Demo booking',
    status:'pending'
  });
  saveState();
  toast('New teaching request', pick[0] + ' booked ' + l.skill + ' and funded the escrow. Accept it above.', 'info');
}

function claimCredits(){
  const name = $('onbName').value.trim() || 'Guest';
  state.name = name;
  state.onboarded = true;
  state.credits += STARTER_CREDITS;
  state.requests = [
    {id:'r-seed-1',student:'Riya Sharma',initials:'RS',av:'av-6',skill:'Python Basics',hours:1,note:'Referred by your campus club',status:'pending'},
    {id:'r-seed-2',student:'Karan Mehta',initials:'KM',av:'av-4',skill:'Guitar Chords',hours:2,note:'Wants a weekend session',status:'pending'}
  ];
  addLedger('New member bonus — welcome to SkillVault', 'Bonus', STARTER_CREDITS, 'pos');
  closeModal('onboardModal');
  saveState();
  toast('5 credits added', 'Welcome, ' + name + '! Your Time Credits are ready to spend on any skill.', 'good');
}

function buyTopup(){
  state.credits += 5;
  addLedger('Credit Top-Up Pack (5 TC) — UPI', 'Top-up', 5, 'pos');
  saveState();
  toast('5 Time Credits added', 'Demo purchase complete. ₹299 would be charged via UPI in production.', 'good');
}

function buyPro(){
  if(state.pro) return;
  state.pro = true;
  addLedger('SkillVault Pro — monthly subscription', 'Subscription', money(199), 'neutral');
  saveState();
  toast('Welcome to Pro', 'Unlimited swaps and priority ranking are now active on your profile.', 'good');
}

function buyBadge(){
  if(state.verified) return;
  state.verified = true;
  addLedger('Verified Trust Badge — ID & portfolio', 'Verification', money(499), 'neutral');
  saveState();
  toast('You are verified', 'Your badge now appears on every listing you publish.', 'good');
}

function bindEvents(){
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-view]');
    if(navBtn){
      const v = navBtn.dataset.view;
      if(VIEW_META[v]){ switchView(v); if(v === 'wallet') history.replaceState(null,'','#wallet'); }
      return;
    }
    const chip = e.target.closest('[data-cat]');
    if(chip){ activeCategory = chip.dataset.cat; renderChips(); renderSkills(); return; }

    const book = e.target.closest('[data-book]');
    if(book){ const p = PEERS.find(x => x.id === book.dataset.book); if(p) bookModal(p); return; }

    const complete = e.target.closest('[data-complete]');
    if(complete){ completeSession(complete.dataset.complete); return; }

    const accept = e.target.closest('[data-accept]');
    if(accept){ acceptRequest(accept.dataset.accept); return; }

    const sim = e.target.closest('[data-simulate]');
    if(sim){ simulateBooking(Number(sim.dataset.simulate)); return; }

    const closeBtn = e.target.closest('[data-close]');
    if(closeBtn){ closeModal(closeBtn.dataset.close); return; }

    if(e.target.classList.contains('modal-backdrop')){
      if(e.target.id === 'onboardModal' && !state.onboarded) return;
      e.target.classList.remove('open');
    }
  });

  $('searchInput').addEventListener('input', (e) => { query = e.target.value; renderSkills(); });

  $('teachForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const skill = $('teachSkill').value.trim();
    if(!skill) return;
    state.listings.push({
      skill,
      cat: $('teachCategory').value,
      level: $('teachLevel').value,
      format: $('teachFormat').value,
      desc: $('teachDesc').value.trim()
    });
    $('teachForm').reset();
    saveState();
    toast('Listing published', skill + ' is now discoverable. Every completed hour earns you 1 TC.', 'good');
  });

  $('bookConfirm').addEventListener('click', confirmBooking);
  $('claimCredits').addEventListener('click', claimCredits);
  $('onbName').addEventListener('keydown', (e) => { if(e.key === 'Enter') claimCredits(); });
  $('buyTopup').addEventListener('click', buyTopup);
  $('buyPro').addEventListener('click', buyPro);
  $('buyBadge').addEventListener('click', buyBadge);

  $('resetDemo').addEventListener('click', () => {
    if(confirm('Reset the demo? This clears your credits, sessions and listings in this browser.')){
      localStorage.removeItem(KEY);
      location.reload();
    }
  });

  document.addEventListener('keydown', (e) => {
    if(e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop.open').forEach(m => {
      if(m.id === 'onboardModal' && !state.onboarded) return;
      m.classList.remove('open');
    });
  });
}

function boot(){
  bindEvents();
  renderAll();
  if(!state.onboarded){
    openModal('onboardModal');
    setTimeout(() => $('onbName').focus(), 350);
  }else{
    const hash = location.hash.replace('#','');
    if(VIEW_META[hash]) switchView(hash);
  }
}

boot();
