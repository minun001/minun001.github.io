const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { runInNewContext } = require('node:vm');
const read = path => readFileSync(join(__dirname, '..', path), 'utf8');

function tracker({ consent = 'yes', dnt, gpc, path = '/', enabled = true, blocked = false, owner = false } = {}) {
  const requests = [];
  const memory = new Map(consent ? [['site.analytics.consent', consent]] : []);
  const storage = { getItem(key) { if (blocked) throw new Error('blocked'); return memory.get(key) || null; }, setItem(key, value) { memory.set(key, value); } };
  const location = { pathname: path, hostname: 'minun001.github.io' };
  const context = { URL, AbortController, setTimeout, clearTimeout, Date, Number,
    localStorage: storage, sessionStorage: { getItem() { return owner ? 'yes' : null; } },
    navigator: { doNotTrack: dnt, globalPrivacyControl: gpc }, location,
    crypto: { randomUUID: () => '6ea78470-c19c-4785-a987-cf0065f57ef6' },
    document: { readyState: 'complete', referrer: 'https://example.org/private?email=secret@example.org' },
    fetch(url, options) { requests.push({ url, options, payload: JSON.parse(options.body) }); return Promise.resolve({ ok: true }); }
  };
  context.window = { location, crypto: context.crypto, innerWidth: 390, SITE_ANALYTICS_CONFIG: { apiBaseUrl: 'https://analytics.example.com', collectionEnabled: enabled } };
  runInNewContext(read('assets/visitor-tracker.js'), context);
  return { requests, memory };
}

test('Tracker sends only consented, minimized data without tokens or full URLs', () => {
  const { requests, memory } = tracker();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.referrer_host, 'example.org');
  assert.equal(requests[0].payload.device, 'mobile');
  assert.equal(requests[0].payload.page_path, '/');
  assert.equal(requests[0].options.credentials, 'omit');
  assert.deepEqual(Object.keys(requests[0].options.headers), ['Content-Type']);
  assert.ok(memory.has('site.analytics.browser'));
  assert.doesNotMatch(JSON.stringify(requests[0]), /email|secret|Authorization/);
});

test('Tracker respects opt-out, DNT, GPC, blocked storage, private pages and owner exclusion', () => {
  for (const options of [{ consent: 'no' }, { dnt: '1' }, { gpc: true }, { blocked: true }, { owner: true }, { enabled: false }, { path: '/analytics/' }, { path: '/workspace/' }, { path: '/privacy/' }, { path: '/workspace/timesfm/' }]) {
    assert.equal(tracker(options).requests.length, 0, JSON.stringify(options));
  }
});

test('Private dashboard starts hidden and credentials never appear in frontend sources', () => {
  const html = read('analytics/index.html');
  assert.match(html, /id="analytics-dashboard" hidden/);
  assert.match(html, /robots: noindex,nofollow/);
  assert.match(html, /include_public_analytics: false/);
  const js = read('assets/analytics.js');
  assert.match(js, /\/analytics\/session/);
  assert.match(js, /\/analytics\/login/);
  assert.match(js, /\/analytics\/summary\?days=/);
  assert.doesNotMatch(js, /innerHTML|workspace\.helperSessionToken|localStorage\.setItem\([^\n]*token/i);
  assert.match(js, /sessionStorage\.setItem\(tokenKey\(\), value\)/);
});

test('Only public research routes load the collector and private data is never built', () => {
  assert.match(read('_layouts/default.html'), /assign tracked_paths = '\/\|\/profile\/\|\/research\/\|\/publications\/\|\/news\/'/);
  assert.match(read('_config.yml'), /- \.private\//);
  assert.match(read('.gitignore'), /\.private\//);
  for (const file of ['workspace_servers.local.json', 'workspace_auth.local.json', 'workspace_helper.env']) {
    assert.ok(read('_config.yml').includes('- tools/' + file));
  }
  assert.match(read('_includes/footer.html'), /'\/privacy\/'/);
});

function dashboard() {
  class Node {
    constructor() { this.hidden = false; this.value = ''; this.textContent = ''; this.children = []; this.dataset = {}; this.handlers = {}; }
    addEventListener(name, callback) { this.handlers[name] = callback; }
    replaceChildren(...nodes) { this.children = nodes; }
    append(...nodes) { this.children.push(...nodes); }
    appendChild(node) { this.children.push(node); }
    setAttribute() {}
    focus() {}
  }
  const nodes = new Map();
  const $ = id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); };
  $('dashboard').hidden = true; $('range').value = '30';
  const local = new Map(), session = new Map(), calls = [], timers = [];
  const storage = memory => ({ getItem:key => memory.get(key) || null, setItem:(key,value) => memory.set(key,value), removeItem:key => memory.delete(key) });
  const state = { authorized:false, rejectLogin:false, offline:false, summaryPending:null, loginPending:null };
  const summary = { today:{browsers:2,pageviews:3}, totals:{browsers:2,pageviews:3}, generated_at:'2026-10-11T01:00:00Z',
    daily:[{date:'2026-10-11',browsers:2,pageviews:3}], recent:[], pages:[], referrers:[] };
  const response = (status, data) => ({ok:status === 200,status,headers:{get:() => 'application/json'},json:async() => data});
  const context = {
    URL, AbortController, Date, Number, TypeError, console,
    localStorage:storage(local), sessionStorage:storage(session),
    location:{protocol:'http:',hostname:'127.0.0.1'},
    setTimeout(fn,delay) { timers.push({fn,delay}); return timers.length; }, clearTimeout(){},
    document:{getElementById:id => $(id.replace('analytics-', '')),createElement:() => new Node(),createElementNS:() => new Node()},
    fetch:async(url,options) => {
      calls.push({url,options});
      if (state.offline) throw new TypeError('Network failed');
      if (url.endsWith('/session')) return response(200,{configured:true,authenticated:state.authorized});
      if (url.endsWith('/login')) {
        if (state.loginPending) return state.loginPending;
        if (state.rejectLogin) return response(401,{error:'Incorrect username or password.'});
        state.authorized = true; return response(200,{session_token:'test-only-session-token'});
      }
      if (url.endsWith('/logout')) { state.authorized=false; return response(200,{ok:true}); }
      if (state.summaryPending) return state.summaryPending;
      return state.authorized ? response(200,summary) : response(401,{error:'Owner sign-in required.'});
    }
  };
  context.window = { SITE_ANALYTICS_CONFIG:{apiBaseUrl:'https://analytics.example.com'},scrollTo(){} };
  runInNewContext(read('assets/analytics.js'),context);
  const flush = async() => { for(let i=0;i<4;i++) await new Promise(resolve=>setImmediate(resolve)); };
  const click = async(id,event='click') => { await $(id).handlers[event]({preventDefault(){}}); await flush(); };
  const login = async() => { $('username').value='test-owner'; $('password').value='test-only-password'; await click('login-form','submit'); };
  return {$,state,session,local,calls,timers,summary,response,flush,click,login};
}

test('Dashboard checks the server session before requesting any statistics', async() => {
  const ui=dashboard(); await ui.flush();
  assert.equal(ui.$('dashboard').hidden,true);
  assert.equal(ui.calls.length,1);
  assert.ok(ui.calls[0].url.endsWith('/session'));
});

test('Successful login displays actual API values and stores only a session token', async() => {
  const ui=dashboard(); await ui.flush(); await ui.login();
  assert.equal(ui.$('dashboard').hidden,false);
  assert.equal(ui.$('login').hidden,true);
  assert.equal(ui.$('today-browsers').textContent,2);
  assert.equal(ui.$('today-views').textContent,3);
  assert.equal(ui.$('password').value,'');
  assert.equal(ui.$('chart').children.length,1);
  assert.ok(ui.session.has('site.analytics.session:https://analytics.example.com'));
  assert.equal(ui.local.size,0);
});

test('Rejected login clears the password and never unlocks the dashboard', async() => {
  const ui=dashboard(); await ui.flush(); ui.state.rejectLogin=true; await ui.login();
  assert.equal(ui.$('dashboard').hidden,true);
  assert.equal(ui.$('password').value,'');
  assert.match(ui.$('status').textContent,/Incorrect username/);
  assert.equal(ui.session.size,0);
});

test('Server expiry and network failure erase private content instead of showing false zeros', async() => {
  for(const offline of [false,true]) {
    const ui=dashboard(); await ui.flush(); await ui.login();
    ui.state.authorized=false; ui.state.offline=offline;
    await ui.click('refresh');
    assert.equal(ui.$('dashboard').hidden,true);
    assert.equal(ui.$('chart').children.length,0);
    assert.equal(ui.$('today-views').textContent,'—');
    assert.match(ui.$('status').textContent,offline ? /API disconnected/ : /Owner sign-in required/);
  }
});

test('Logout prevents a late statistics response from restoring private data', async() => {
  const ui=dashboard(); await ui.flush(); await ui.login();
  let resolve;
  ui.state.summaryPending=new Promise(done=>{resolve=done;});
  const pending=ui.click('refresh'); await ui.flush();
  await ui.click('signout');
  resolve(ui.response(200,ui.summary)); await pending;
  assert.equal(ui.$('dashboard').hidden,true);
  assert.equal(ui.$('chart').children.length,0);
  assert.equal(ui.session.size,0);
});

test('Changing API origins during login never sends or saves the old token to the new origin', async() => {
  const ui=dashboard(); await ui.flush();
  let resolve;
  ui.state.loginPending=new Promise(done=>{resolve=done;});
  const pending=ui.login(); await ui.flush();
  ui.$('api-url').value='https://new-api.example.com';
  await ui.click('api-form','submit');
  resolve(ui.response(200,{session_token:'old-origin-secret'})); await pending;
  assert.equal(ui.session.size,0);
  assert.ok(ui.calls.filter(call=>call.url.startsWith('https://new-api.example.com')).every(call=>!call.options.headers.Authorization));
});

test('Client idle expiry removes the visible statistics and saved token', async() => {
  const ui=dashboard(); await ui.flush(); await ui.login();
  const idle=ui.timers.find(timer=>timer.delay===30*60*1000);
  assert.ok(idle); idle.fn();
  assert.equal(ui.$('dashboard').hidden,true);
  assert.equal(ui.session.size,0);
  assert.match(ui.$('status').textContent,/Session expired/);
});
