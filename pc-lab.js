(()=> {
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d)=>{try{const v=localStorage.getItem('webos:'+k);return v===null?d:JSON.parse(v)}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem('webos:'+k,JSON.stringify(v));return true}catch{toast('Browser storage is full. Export a backup or remove old items.');return false}};
const toast=m=>{const t=$('#toast');if(t){t.textContent=m;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200)}};
const join=(a,b)=>a?a+'/'+b:b, parent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';
const baseFolders=['Desktop','Documents','Downloads','Pictures','Music','Videos'];
function seed(){let f=get('pc-folders',null);if(!Array.isArray(f)){put('pc-folders',baseFolders);f=baseFolders}return f}
function css(){const s=document.createElement('style');s.textContent=`
/* Practical PC environment */
body{user-select:none}input,textarea,[contenteditable=true]{user-select:text}
#desktop{background:radial-gradient(ellipse at 68% 38%,#1b9cba 0,transparent 27%),radial-gradient(ellipse at 35% 72%,#164c86 0,transparent 42%),linear-gradient(135deg,#07527b,#0b315d 72%,#102847)!important}
#desktop:after{background:linear-gradient(125deg,transparent 42%,#ffffff0b 42.2%,transparent 67%)}
.desktop-icons{grid-auto-flow:column;grid-template-rows:repeat(8,88px);grid-template-columns:repeat(2,88px)}
.desktop-icon{min-height:80px}
.pc-lab-folder{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #dbe2eb;border-radius:6px;background:#f8fafc;color:#253449;text-align:left;min-height:43px}
.pc-lab-folder:hover{background:#eaf2fc;border-color:#9cbde5}
.pc-lab-folder .folder-glyph{font-size:23px}
.pc-lab-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:8px 0}
.pc-lab-toolbar .field{flex:1;min-width:130px}
.pc-lab-breadcrumb{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:8px 0;color:#4b5d73;font-size:12px}
.pc-lab-breadcrumb button{border:0;background:transparent;color:#1769aa;padding:4px}
.pc-lab-layout{display:grid;grid-template-columns:minmax(120px,170px) minmax(0,1fr);gap:12px;min-height:230px}
.pc-lab-sidebar{border-right:1px solid #e1e6ed;padding-right:8px}
.pc-lab-sidebar button{display:block;width:100%;padding:8px;border:0;border-radius:5px;background:transparent;color:#34445b;text-align:left;font-size:12px}
.pc-lab-sidebar button:hover,.pc-lab-sidebar button[aria-current=true]{background:#e8f0fa;color:#155b98}
.pc-lab-main{min-width:0}
.pc-lab-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px}
.pc-lab-file{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid #e2e7ee;border-radius:6px;background:#fff;color:#27364a}
.pc-lab-file .file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px}
.pc-lab-file .file-icon{font-size:21px}
.pc-lab-file .file-actions{display:flex;gap:3px}
.pc-lab-file .action{padding:5px 7px;font-size:11px}
.pc-lab-empty{padding:28px 10px;text-align:center;color:#78869a;font-size:13px}
.pc-lab-status{display:flex;justify-content:space-between;gap:10px;margin-top:10px;padding-top:8px;border-top:1px solid #e5e9ef;color:#718096;font-size:11px}
.pc-context{position:fixed;z-index:10030;min-width:190px;padding:5px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;box-shadow:0 8px 30px #0004;color:#253449}
.pc-context[hidden]{display:none}
.pc-context button{display:block;width:100%;padding:9px 11px;text-align:left;border:0;border-radius:4px;background:transparent;color:#253449;font-size:12px}
.pc-context button:hover{background:#e6edf6}
@media(max-width:620px){.desktop-icons{grid-template-rows:repeat(5,76px);grid-template-columns:repeat(2,76px)}.pc-lab-layout{grid-template-columns:1fr}.pc-lab-sidebar{display:flex;gap:4px;overflow:auto;border-right:0;border-bottom:1px solid #e1e6ed;padding:0 0 6px}.pc-lab-sidebar button{white-space:nowrap;width:auto}.pc-lab-items{grid-template-columns:1fr}}
`;document.head.append(s)}
function makeExplorer(win){if(win.dataset.pcLab==='1')return;const list=win.querySelector('#file-list');if(!list)return;win.dataset.pcLab='1';
 const old=win.querySelector('.file-upgrade-tools');if(old)old.remove();
 const head=win.querySelector('.window-body h2');if(head)head.textContent='File Explorer';
 const intro=win.querySelector('.window-body p.muted');if(intro)intro.remove();
 const top=document.createElement('div');top.className='pc-lab-toolbar';top.innerHTML='<button class="action" data-lab-up title="Up one folder">↑</button><button class="action primary" data-lab-folder>＋ New folder</button><button class="action" data-lab-file>＋ New file</button><button class="action" data-lab-import>Import</button><button class="action" data-lab-export>Export</button><input class="field" type="search" data-lab-search placeholder="Search this PC…"><input type="file" data-lab-picker multiple hidden>';
 const crumb=document.createElement('nav');crumb.className='pc-lab-breadcrumb';crumb.setAttribute('aria-label','Folder path');
 const layout=document.createElement('div');layout.className='pc-lab-layout';
 const side=document.createElement('aside');side.className='pc-lab-sidebar';side.innerHTML='<button data-lab-place="" aria-current="true">🖥️ Quick access</button>'+baseFolders.map(f=>'<button data-lab-place="'+esc(f)+'">📁 '+esc(f)+'</button>').join('');
 const main=document.createElement('section');main.className='pc-lab-main';main.append(list);layout.append(side,main);
 const status=document.createElement('div');status.className='pc-lab-status';status.innerHTML='<span data-lab-count>0 items</span><span>Local virtual disk · This device</span>';
 const original=win.querySelector('.window-body .row');if(original)original.remove();
 list.className='pc-lab-items';list.innerHTML='';
 const body=win.querySelector('.window-body');body.append(top,crumb,layout,status);
 let path='';
 const folders=()=>seed();
 function render(){const allFolders=folders(),allFiles=get('files',[]),query=top.querySelector('[data-lab-search]').value.trim().toLowerCase();
 crumb.innerHTML='<button data-lab-crumb="">This PC</button>'+ (path?path.split('/').map((p,i,a)=>'<span>›</span><button data-lab-crumb="'+esc(a.slice(0,i+1).join('/'))+'">'+esc(p)+'</button>').join(''):'');
 side.querySelectorAll('[data-lab-place]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.labPlace===path)));
 let sub=allFolders.filter(f=>parent(f)===path&&(!query||f.toLowerCase().includes(query)));
 let files=allFiles.map((f,i)=>({...f,_i:i})).filter(f=>(f.path||'')===path&&(!query||f.name.toLowerCase().includes(query)));
 if(query){sub=allFolders.filter(f=>f.toLowerCase().includes(query));files=allFiles.map((f,i)=>({...f,_i:i})).filter(f=>f.name.toLowerCase().includes(query))}
 const folderHtml=sub.map(f=>'<article class="pc-lab-file" data-folder-row="'+esc(f)+'"><span class="file-icon">📁</span><span class="file-name">'+esc(f.split('/').pop())+'</span><div class="file-actions"><button class="action" data-lab-rename-folder="'+esc(f)+'" title="Rename folder">Rename</button></div></article>').join('');
 const fileHtml=files.map(f=>'<article class="pc-lab-file"><span class="file-icon">'+(f.type&&f.type.startsWith('image/')?'🖼️':f.name.toLowerCase().endsWith('.pdf')?'📕':f.name.toLowerCase().match(/\.(mp3|wav|mp4|webm)$/)?'🎵':'📄')+'</span><span class="file-name" title="'+esc(f.name)+'">'+esc(f.name)+'</span><div class="file-actions"><button class="action" data-file-open="'+f._i+'">Open</button><button class="action" data-v3-rename="'+f._i+'">Rename</button><button class="action" data-v3-delete="'+f._i+'">Delete</button></div></article>').join('');
 list.innerHTML=folderHtml+fileHtml||'<div class="pc-lab-empty">This folder is empty</div>';
 status.querySelector('[data-lab-count]').textContent=(sub.length+files.length)+' items';
 }
 const addFolder=()=>{const name=prompt('New folder name');if(!name||!name.trim())return;const clean=name.trim().replace(/[\\/]/g,'-').slice(0,80),full=join(path,clean),all=folders();if(all.includes(full)){toast('A folder with that name already exists.');return}if(put('pc-folders',[...all,full])){render();toast('Folder created')}};
 const addFile=()=>{const name=prompt('New file name','New Text Document.txt');if(!name||!name.trim())return;const files=get('files',[]);files.push({name:name.trim().slice(0,120),type:'Text file',content:'',path,updatedAt:new Date().toISOString()});if(put('files',files)){render();toast('File created')}};
 top.querySelector('[data-lab-up]').onclick=()=>{path=parent(path);render()};
 top.querySelector('[data-lab-folder]').onclick=addFolder;top.querySelector('[data-lab-file]').onclick=addFile;
 top.querySelector('[data-lab-import]').onclick=()=>top.querySelector('[data-lab-picker]').click();
 top.querySelector('[data-lab-export]').onclick=()=>{const blob=new Blob([JSON.stringify({folders:folders(),files:get('files',[])},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='webos-pc-files.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 top.querySelector('[data-lab-search]').oninput=render;
 top.querySelector('[data-lab-picker]').onchange=async e=>{const files=get('files',[]);for(const f of e.target.files){try{files.push({name:f.name,type:f.type||'Imported file',content:await f.text(),path,updatedAt:new Date().toISOString()})}catch{toast('Could not import '+f.name)}}put('files',files);e.target.value='';render()};
 side.onclick=e=>{const b=e.target.closest('[data-lab-place]');if(b){path=b.dataset.labPlace;render()}};
 crumb.onclick=e=>{const b=e.target.closest('[data-lab-crumb]');if(b){path=b.dataset.labCrumb;render()}};
 list.addEventListener('dblclick',e=>{const row=e.target.closest('[data-folder-row]');if(row){path=row.dataset.folderRow;top.querySelector('[data-lab-search]').value='';render()}});
 list.addEventListener('click',e=>{const rename=e.target.closest('[data-lab-rename-folder]');if(rename){const oldPath=rename.dataset.labRenameFolder,oldName=oldPath.split('/').pop(),name=prompt('Rename folder',oldName);if(!name||!name.trim())return;const next=join(parent(oldPath),name.trim().replace(/[\\/]/g,'-').slice(0,80)),all=folders();if(all.includes(next)){toast('Folder already exists');return}const updated=all.map(f=>f===oldPath||f.startsWith(oldPath+'/')?next+f.slice(oldPath.length):f);put('pc-folders',updated);const files=get('files',[]);files.forEach(f=>{if(f.path===oldPath||String(f.path||'').startsWith(oldPath+'/'))f.path=next+String(f.path||'').slice(oldPath.length)});put('files',files);if(path===oldPath||path.startsWith(oldPath+'/'))path=next+path.slice(oldPath.length);render()}});
 list.addEventListener('dragover',e=>{e.preventDefault();list.style.outline='2px dashed #3b82c4'});
 list.addEventListener('dragleave',()=>list.style.outline='');
 list.addEventListener('drop',async e=>{e.preventDefault();list.style.outline='';const files=get('files',[]);for(const f of e.dataTransfer.files){try{files.push({name:f.name,type:f.type||'Imported file',content:await f.text(),path,updatedAt:new Date().toISOString()})}catch{toast('Could not import '+f.name)}}put('files',files);render()});
 render();
}
function desktopMenu(){
 let menu=$('#pc-desktop-context');if(menu)return menu;
 menu=document.createElement('div');menu.className='pc-context';menu.id='pc-desktop-context';menu.hidden=true;
 menu.innerHTML='<button data-pc-action="folder">📁 New folder</button><button data-pc-action="file">📄 New text file</button><button data-pc-action="refresh">↻ Refresh</button><button data-pc-action="settings">⚙ Personalize</button><button data-pc-action="terminal">⌨ Open Terminal</button>';
 document.body.append(menu);let px=0,py=0;
 $('#desktop').addEventListener('contextmenu',e=>{if(e.target.closest('.window'))return;e.preventDefault();px=e.clientX;py=e.clientY;menu.style.left=Math.min(px,innerWidth-205)+'px';menu.style.top=Math.min(py,innerHeight-190)+'px';menu.hidden=false});
 document.addEventListener('click',e=>{if(!e.target.closest('#pc-desktop-context'))menu.hidden=true});
 menu.addEventListener('click',e=>{const b=e.target.closest('[data-pc-action]');if(!b)return;const action=b.dataset.pcAction;menu.hidden=true;if(action==='folder'){const n=prompt('New desktop folder name');if(n&&n.trim()){const all=seed();if(!all.includes('Desktop/'+n.trim()))put('pc-folders',[...all,'Desktop/'+n.trim()]);toast('Folder created on Desktop')}}if(action==='file'){const n=prompt('New text file name','New Text Document.txt');if(n&&n.trim()){const a=get('files',[]);a.push({name:n.trim(),type:'Text file',content:'',path:'Desktop'});put('files',a);toast('File created on Desktop')}}if(action==='refresh'){location.reload()}if(action==='settings'){document.querySelector('[data-launch="settings"]')?.click()}if(action==='terminal'){document.querySelector('[data-launch="terminal"]')?.click()}});
}
function desktopFolders(){const host=$('#desktop-icons');if(!host||host.dataset.labFolders)return;host.dataset.labFolders='1';const add=()=>{const all=seed().filter(f=>parent(f)==='Desktop');all.forEach(name=>{if(host.querySelector('[data-lab-desktop-folder="'+esc(name)+'"]'))return;const b=document.createElement('button');b.className='desktop-icon';b.dataset.labDesktopFolder=name;b.innerHTML='<span class="app-icon">📁</span><span>'+esc(name.split('/').pop())+'</span>';b.addEventListener('click',()=>{host.querySelectorAll('.desktop-icon').forEach(x=>x.classList.toggle('selected',x===b))});b.addEventListener('dblclick',()=>{document.querySelector('[data-launch="files"]')?.click();setTimeout(()=>document.dispatchEvent(new CustomEvent('webos-open-folder',{detail:name})),60)});host.append(b)})};add();document.addEventListener('webos-folders-changed',add)}
function init(){seed();css();desktopMenu();desktopFolders();
 const desktop=$('#desktop');if(desktop)new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1&&n.matches('.window[data-app="files"]'))makeExplorer(n)}))).observe(desktop,{childList:true});
 document.addEventListener('webos-open-folder',e=>{const win=document.querySelector('.window[data-app="files"]');if(!win)return;win.querySelector('[data-lab-place=""]')?.click();const path=e.detail;const button=win.querySelector('[data-lab-crumb="'+CSS.escape(path)+'"]');if(button)button.click();else{const side=win.querySelector('[data-lab-place="'+CSS.escape(path)+'"]');if(side)side.click()}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();