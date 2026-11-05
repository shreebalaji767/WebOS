(()=> {
'use strict';
const $=s=>document.querySelector(s);
const apps=[
 ['files','📁','File Explorer'],['browser','🌐','Web Browser'],['notes','📝','Notepad'],['paint','🎨','Paint'],['calculator','🧮','Calculator'],['calendar','📅','Calendar'],['office','📄','Office'],['code','</>','Code Studio'],['settings','⚙️','Settings'],['terminal','⌨️','Terminal']
];
const launch=id=>{const b=document.querySelector('[data-launch="'+id+'"]')||document.querySelector('[data-extra="'+id+'"]');if(b)b.click();else if(id==='bin')document.querySelector('[data-extra="bin"]')?.click()};
const style=document.createElement('style');
style.textContent=`
/* PC shell: familiar desktop conventions */
:root{--task:rgba(20,23,31,.94)}
#desktop{background:linear-gradient(135deg,#0876a9 0%,#125c91 38%,#1a3b70 100%)!important}
#desktop:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 72% 42%,#7ac6e866,transparent 32%),linear-gradient(135deg,transparent 40%,#ffffff12 41%,transparent 60%)}
.desktop-top{display:none}
.desktop-welcome{display:none}
.desktop-icons{top:16px;left:14px;grid-template-columns:repeat(1,92px);grid-auto-rows:94px;gap:3px}
.desktop-icon{width:88px;height:88px;border-radius:4px;font-size:12px;text-shadow:1px 1px 2px #000;background:transparent}
.desktop-icon.selected{background:#ffffff35;border:1px solid #ffffff70}
.desktop-icon .app-icon{font-size:34px;filter:drop-shadow(0 2px 2px #0005)}
.taskbar{height:54px;justify-content:center;gap:8px;padding:0 12px;background:rgba(20,24,32,.88);border-top:1px solid #ffffff26}
.launcher-button{width:42px;height:42px;border:0;border-radius:8px;background:transparent;font-size:22px}
.launcher-button:hover,.launcher-button[aria-expanded=true]{background:#ffffff20}
.launcher-glyph{font-size:0;width:19px;height:19px;display:block;margin:auto;background:linear-gradient(90deg,#58a6ff 0 46%,transparent 46% 54%,#58a6ff 54%),linear-gradient(#58a6ff 0 46%,transparent 46% 54%,#58a6ff 54%);background-size:100% 100%;clip-path:polygon(0 0,44% 0,44% 44%,0 44%,0 56%,44% 56%,44% 100%,0 100%,56% 0,100% 0,100% 44%,56% 44%,56% 56%,100% 56%,100% 100%,56% 100%)}
.task-items{max-width:min(42vw,560px);flex:0 1 auto}
.task-item{border-radius:7px;max-width:150px;height:40px}
.system-tray{margin-left:auto;gap:4px}
.tray-status{display:none}
.tray-clock{padding:5px 9px;border-radius:7px;cursor:pointer}
.tray-clock:hover{background:#ffffff18}
#launcher{left:50%;transform:translateX(-50%);bottom:62px;width:min(590px,calc(100vw - 20px));max-height:min(690px,calc(100dvh - 74px));padding:22px;border-radius:12px;background:rgba(31,38,51,.97);border:1px solid #ffffff24;box-shadow:0 24px 80px #0009}
.launcher-heading{margin-bottom:14px}
.launcher-heading .eyebrow{display:none}
.launcher-heading h2{font-size:17px;font-weight:650}
.search-field{border-radius:7px;background:#151b27;border-color:#65748a55}
.app-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:14px 0}
.app-tile{min-height:83px;border-radius:7px;font-size:11px}
.app-tile .app-icon{font-size:27px}
.launcher-foot{margin-top:12px;padding-top:12px}
.window{border-radius:9px;border:1px solid #aab5c455;background:#f5f6f8;color:#202633;box-shadow:0 12px 40px #0005;backdrop-filter:none}
.window .titlebar{height:38px;min-height:38px;background:#f5f6f8;color:#273142;border-bottom:1px solid #d9dee7;cursor:grab}
.window .window-controls button{background:transparent;color:#273142;border-radius:5px}
.window .window-controls button:hover{background:#dce3ed}
.window .window-controls .close:hover{background:#d94b52;color:white}
.window .window-body{background:#fff;color:#202633}
.window .muted{color:#687386}
.window .field,.window .search-field{background:#fff;color:#202633;border:1px solid #cbd3df}
.window .action{background:#f1f4f8;color:#263449;border:1px solid #cbd3df;border-radius:6px}
.window .action.primary{background:#1769aa;color:white;border-color:#1769aa}
.window .card,.window .file-row,.window .stat{background:#f6f8fb;color:#25344a;border-color:#dce2eb}
.window .editor,.window .calc-output{background:#fff;color:#1c2736;border-color:#cbd3df}
.window .terminal{background:#111827;color:#c8f5d4}
#context-menu{background:#f6f7f9;color:#202a39;border:1px solid #cbd2dc;border-radius:7px;box-shadow:0 8px 26px #0003}
#context-menu button{color:#202a39}
#context-menu button:hover{background:#e4ebf4}
.pc-tray-panel{position:fixed;z-index:10004;right:12px;bottom:62px;width:min(350px,calc(100vw - 24px));padding:16px;border:1px solid #ffffff25;border-radius:13px;background:rgba(30,38,52,.97);box-shadow:0 18px 50px #0008;backdrop-filter:blur(22px);color:#f4f7fb}
.pc-tray-panel[hidden]{display:none}
.pc-quick-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}
.pc-quick-grid button,.pc-tray-panel button{padding:11px;border:1px solid #ffffff20;border-radius:8px;background:#ffffff12;color:inherit;text-align:left}
.pc-quick-grid button[aria-pressed=true]{background:#2469a5}
.pc-tray-bottom{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ffffff20;padding-top:12px;font-size:12px}
.pc-start-profile{display:flex;align-items:center;gap:10px;padding:6px 0 14px;border-bottom:1px solid #ffffff20;margin-bottom:12px}
.pc-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#397db8;font-weight:700}
.pc-start-profile small{display:block;color:#aebbd0;font-size:10px;margin-top:2px}
.pc-start-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid #ffffff20}
.pc-start-bottom button{border:0;border-radius:7px;padding:8px 10px;background:#ffffff12;color:#f4f7fb}
.pc-run-dialog{position:fixed;z-index:10006;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100vw - 28px));padding:20px;border:1px solid #ffffff30;border-radius:12px;background:#f7f8fa;color:#202a39;box-shadow:0 25px 80px #0008}
.pc-run-dialog[hidden]{display:none}
.pc-run-dialog input{width:100%;padding:11px;border:1px solid #bac5d4;border-radius:6px;margin:12px 0;color:#202a39;background:white}
.pc-run-dialog button{padding:8px 13px;border:1px solid #c4ccd7;border-radius:6px;background:#edf1f6;color:#243449}
.pc-notification{font-size:12px;padding:11px;border-radius:8px;background:#ffffff12;margin:8px 0;color:#dbe6f5}
@media(max-width:650px){.desktop-icons{grid-template-columns:repeat(2,76px);grid-auto-rows:82px;top:10px;left:7px}.desktop-icon{width:72px;height:76px;font-size:10px}.desktop-icon .app-icon{font-size:28px}.taskbar{justify-content:flex-start;padding:0 5px;gap:3px}.task-items{max-width:30vw}.system-tray{gap:0}.tray-clock{padding:5px}.app-grid{grid-template-columns:repeat(3,minmax(0,1fr))}#launcher{padding:15px}.pc-tray-panel{right:6px;bottom:60px}}
`;
document.head.append(style);
function addDesktopShortcuts(){
 const host=$('#desktop-icons');if(!host||host.dataset.pcReady)return;host.dataset.pcReady='1';
 const extras=[['files','🖥️','This PC'],['bin','🗑️','Recycle Bin'],['browser','🌐','Browser'],['notes','📝','Notepad'],['paint','🎨','Paint'],['code','</>','Code Studio'],['settings','⚙️','Settings']];
 host.innerHTML=extras.map((a,i)=>'<button class="desktop-icon" data-pc-shortcut="'+a[0]+'" data-shortcut-index="'+i+'"><span class="app-icon">'+a[1]+'</span><span>'+a[2]+'</span></button>').join('');
 host.addEventListener('click',e=>{const b=e.target.closest('[data-pc-shortcut]');if(!b)return;host.querySelectorAll('.desktop-icon').forEach(x=>x.classList.toggle('selected',x===b));});
 host.addEventListener('dblclick',e=>{const b=e.target.closest('[data-pc-shortcut]');if(b){e.preventDefault();launch(b.dataset.pcShortcut)}});
 host.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-pc-shortcut]')){e.preventDefault();launch(e.target.dataset.pcShortcut)}});
}
function decorateStart(){
 const launcher=$('#launcher');if(!launcher||launcher.dataset.pcReady)return;launcher.dataset.pcReady='1';
 const head=launcher.querySelector('.launcher-heading');if(head){const h=head.querySelector('h2');if(h)h.textContent='Pinned';const all=document.createElement('span');all.className='eyebrow';all.textContent='START';head.prepend(all)}
 const grid=$('#app-grid');if(grid){const section=document.createElement('div');section.className='pc-start-profile';section.innerHTML='<span class="pc-avatar">U</span><span><b>Local User</b><small>WebOS PC · This device</small></span>';grid.before(section)}
 const foot=launcher.querySelector('.launcher-foot');if(foot){foot.innerHTML='<span>All apps · Local PC environment</span><div class="pc-start-bottom"><span>Local User</span><button id="pc-power">⏻ Power</button></div>'}
 $('#pc-power')?.addEventListener('click',()=>showPower());
}
function addTray(){
 const tray=document.querySelector('.system-tray');if(!tray||tray.dataset.pcReady)return;tray.dataset.pcReady='1';
 const quick=document.createElement('button');quick.className='tray-button';quick.id='pc-quick-toggle';quick.title='Quick settings';quick.textContent='◖';tray.insertBefore(quick,tray.firstChild);
 const panel=document.createElement('section');panel.className='pc-tray-panel';panel.hidden=true;panel.id='pc-tray-panel';panel.innerHTML='<b>Quick settings</b><div class="pc-quick-grid"><button data-quick="wifi" aria-pressed="true">◉ Wi-Fi · Connected</button><button data-quick="bluetooth" aria-pressed="false">ᛒ Bluetooth</button><button data-quick="night" aria-pressed="false">☾ Night light</button><button data-quick="focus" aria-pressed="false">◷ Focus</button></div><div class="pc-tray-bottom"><span id="pc-battery">WebOS · Browser PC</span><button id="pc-open-settings">All settings ⚙</button></div>';
 document.body.append(panel);quick.onclick=()=>{panel.hidden=!panel.hidden;$('#pc-notification-panel').hidden=true};
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-quick]');if(b){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=b.textContent.replace(/ · Connected/,'')+(on&&b.dataset.quick==='wifi'?' · Connected':'')}});$('#pc-open-settings').onclick=()=>launch('settings');
 const clock=$('.tray-clock');if(clock){const notes=document.createElement('section');notes.className='pc-tray-panel';notes.id='pc-notification-panel';notes.hidden=true;notes.innerHTML='<b>Notification center</b><div class="pc-notification">WebOS virtual PC is ready. Your files are stored locally in this browser.</div><div class="pc-tray-bottom"><span id="pc-full-date"></span><button id="pc-clear-notifications">Clear all</button></div>';document.body.append(notes);clock.addEventListener('click',()=>{notes.hidden=!notes.hidden;panel.hidden=true;$('#pc-full-date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'})});$('#pc-clear-notifications').onclick=()=>notes.querySelector('.pc-notification')?.remove()}
 document.addEventListener('click',e=>{if(!e.target.closest('#pc-tray-panel')&&!e.target.closest('#pc-quick-toggle')&&!e.target.closest('.tray-clock')){panel.hidden=true;$('#pc-notification-panel').hidden=true}});
}
function showRun(){let d=$('#pc-run-dialog');if(!d){d=document.createElement('div');d.className='pc-run-dialog';d.id='pc-run-dialog';d.hidden=true;d.innerHTML='<b>Run</b><p>Type the name of an application or folder you want to open.</p><input id="pc-run-input" placeholder="Type an app name…"><div style="display:flex;justify-content:flex-end;gap:8px"><button id="pc-run-cancel">Cancel</button><button id="pc-run-ok">OK</button></div>';document.body.append(d);$('#pc-run-cancel').onclick=()=>d.hidden=true;$('#pc-run-ok').onclick=run;$('#pc-run-input').addEventListener('keydown',e=>{if(e.key==='Enter')run();if(e.key==='Escape')d.hidden=true})}d.hidden=false;$('#pc-run-input').value='';$('#pc-run-input').focus()}
function run(){const v=$('#pc-run-input').value.trim().toLowerCase();const map={'explorer':'files','file explorer':'files','this pc':'files','notepad':'notes','paint':'paint','calculator':'calculator','settings':'settings','browser':'browser','terminal':'terminal','cmd':'terminal','calendar':'calendar','code':'code','code studio':'code'};if(map[v]){launch(map[v]);$('#pc-run-dialog').hidden=true}else{$('#pc-run-input').setCustomValidity('Application not found in this virtual PC. Try explorer, notepad, paint or calculator.');$('#pc-run-input').reportValidity();$('#pc-run-input').setCustomValidity('')}}
function showPower(){let d=$('#pc-power-dialog');if(!d){d=document.createElement('div');d.className='pc-run-dialog';d.id='pc-power-dialog';d.hidden=true;d.innerHTML='<b>Power</b><p>Choose what to do with this virtual PC session.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button data-power="lock">Lock</button><button data-power="restart">Restart</button><button data-power="shutdown">Shut down</button><button data-power="cancel">Cancel</button></div>';document.body.append(d);d.onclick=e=>{const b=e.target.closest('[data-power]');if(!b)return;const action=b.dataset.power;if(action==='cancel'){d.hidden=true;return}if(action==='lock'){d.hidden=true;showLock()}if(action==='restart'){d.hidden=true;showLock('Restarting WebOS…')}if(action==='shutdown'){d.hidden=true;showLock('WebOS is shut down. Click to start again.')}}}d.hidden=false}
function showLock(message='WebOS is locked'){let lock=$('#pc-lock-screen');if(!lock){lock=document.createElement('div');lock.id='pc-lock-screen';lock.style.cssText='position:fixed;inset:0;z-index:10020;display:grid;place-items:center;background:linear-gradient(135deg,#075b87,#152e61);color:white;text-align:center;font-family:inherit';lock.innerHTML='<div><div style="font-size:12px;letter-spacing:.2em;opacity:.8">WEBOS PC</div><div id="pc-lock-time" style="font-size:clamp(42px,10vw,76px);font-weight:300;margin:18px 0">--:--</div><h2 id="pc-lock-message">WebOS is locked</h2><p>Click anywhere or press a key to return to your desktop</p></div>';document.body.append(lock);const update=()=>$('#pc-lock-time').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});update();setInterval(update,10000);const unlock=()=>{lock.remove();lock=null};lock.addEventListener('click',unlock,{once:true});document.addEventListener('keydown',function key(e){if(!lock){document.removeEventListener('keydown',key);return}unlock();document.removeEventListener('keydown',key)},{once:true})}$('#pc-lock-message').textContent=message;lock.style.display='grid'}
function init(){
 addDesktopShortcuts();decorateStart();addTray();
 const start=$('#launcher-toggle');if(start){start.title='Start';start.setAttribute('aria-expanded','false');start.addEventListener('click',()=>{start.setAttribute('aria-expanded',String(!$('#launcher').hidden));$('#pc-tray-panel').hidden=true})}
 $('#launcher-close')?.addEventListener('click',()=>start?.setAttribute('aria-expanded','false'));
 document.addEventListener('click',e=>{if(!e.target.closest('#launcher')&&!e.target.closest('#launcher-toggle'))start?.setAttribute('aria-expanded','false')});
 document.addEventListener('keydown',e=>{
  if(e.key==='Meta'&&!e.repeat){e.preventDefault();$('#launcher-toggle')?.click()}
  if(e.metaKey&&e.key.toLowerCase()==='e'){e.preventDefault();launch('files')}
  if(e.metaKey&&e.key.toLowerCase()==='r'){e.preventDefault();showRun()}
  if(e.key==='Escape'){$('#pc-run-dialog')&&($('#pc-run-dialog').hidden=true);$('#pc-power-dialog')&&($('#pc-power-dialog').hidden=true)}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();