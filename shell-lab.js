(()=> {
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{const v=localStorage.getItem('webos:'+k);return v===null?d:JSON.parse(v)}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem('webos:'+k,JSON.stringify(v));return true}catch{return false}};
const shells=['bash','zsh','powershell'];
const configs={bash:{label:'Bash',prompt:'user@webos',home:'/home/user'},zsh:{label:'Zsh',prompt:'user@webos',home:'/home/user'},powershell:{label:'PowerShell',prompt:'PS C:\\Users\\LocalUser',home:'C:\\Users\\LocalUser'}};
let shell='bash',cwd='',history=[],historyIndex=0,vars={};
const base=['Desktop','Documents','Downloads','Pictures','Music','Videos'];
function folders(){let f=read('pc-folders',base);return Array.isArray(f)?f:base}
function files(){let f=read('files',[]);return Array.isArray(f)?f:[]}
function norm(input){let raw=String(input||'').trim();if(!raw||raw==='~'||raw==='$HOME'||raw==='%USERPROFILE%')return '';let absolute=false;if(shell==='powershell'){raw=raw.replace(/\\/g,'/');absolute=/^[a-z]:\//i.test(raw)||raw.startsWith('/');if(/^c:\/?$/i.test(raw))return '';raw=raw.replace(/^c:/i,'');if(raw.startsWith('/Users/LocalUser'))raw=raw.slice('/Users/LocalUser'.length);if(raw.startsWith('/'))raw=raw.slice(1)}else{raw=raw.replace(/^~(?=\/|$)/,'');absolute=raw.startsWith('/');if(raw.startsWith('/home/user'))raw=raw.slice('/home/user'.length);if(raw.startsWith('/'))raw=raw.slice(1)}if(!raw)return '';const parts=(absolute?raw:(cwd?cwd+'/'+raw:raw)).split('/');const out=[];for(const p of parts){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/')}
function displayPath(p){if(shell==='powershell')return 'C:\\Users\\LocalUser'+(p?'\\'+p.replace(/\//g,'\\'):'');return (shell==='zsh'?'~':'/home/user')+(p?'/'+p:'')}
function tokenize(s){const out=[];let cur='',q='',escNext=false;for(let i=0;i<s.length;i++){const c=s[i];if(escNext){cur+=c;escNext=false;continue}if(c==='\\'&&q!=="'"){escNext=true;continue}if(q){if(c===q)q='';else cur+=c;continue}if(c==='"'||c==="'"){q=c;continue}if(/\s/.test(c)){if(cur){out.push(cur);cur=''}}else cur+=c}if(cur)out.push(cur);return out}
function fileIndex(path,name){return files().findIndex(f=>(f.path||'')===path&&f.name.toLowerCase()===name.toLowerCase())}
function splitTarget(target){const p=norm(target);const parts=p.split('/');return {path:parts.length>1?parts.slice(0,-1).join('/'):'',name:parts[parts.length-1]||''}}
function output(text){const line=document.createElement('div');line.className='shell-output-line';line.textContent=String(text);$('#shell-output').append(line);$('#shell-output').scrollTop=$('#shell-output').scrollHeight}
function shellPrompt(){return shell==='powershell'?displayPath(cwd)+' > ': (shell==='zsh'?'% ':'$ ')}
function refreshPrompt(){const p=$('#shell-prompt');if(p)p.textContent=shellPrompt()}
function help(){if(shell==='powershell')return 'PowerShell: Get-ChildItem, Get-Location, Set-Location, New-Item, Get-Content, Set-Content, Add-Content, Remove-Item, Copy-Item, Move-Item, Test-Path, Resolve-Path, Get-Date, Get-Process, Get-Command, Get-History, Write-Output. Use commands for the full catalogue; Get-Help <name> for help; practice beginner|intermediate|advanced to train.';return 'Use commands for the full '+configs[shell].label+' catalogue; man <command> for a manual; practice beginner|intermediate|advanced for guided exercises; hint and check to progress. Core commands: pwd, ls, cd, mkdir, touch, cat, echo, grep, find, cp, mv, rm, history, clear.'}
function resolveFile(target){const x=splitTarget(target);const i=fileIndex(x.path,x.name);return i<0?null:{file:files()[i],index:i,path:x.path,name:x.name}}
function execute(raw){const command=raw.trim();if(!command)return '';if(shell==='powershell'&&/^\$[A-Za-z_]\w*\s*=/.test(command)){const m=command.match(/^\$([A-Za-z_]\w*)\s*=\s*(.*)$/);vars[m[1]]=m[2].replace(/^["']|["']$/g,'');return ''}
let tokens=tokenize(command),cmd=(tokens.shift()||'');const lower=cmd.toLowerCase(),args=tokens;
const arg=()=>args.join(' '),need=()=>{if(!args.length)throw Error('A path or name is required.');return args[0]},psValue=(flag,fallback)=>{if(!isPS)return args[fallback||0];const i=args.findIndex(a=>a.toLowerCase()===flag.toLowerCase());return i>=0?args[i+1]:args[fallback||0]};
const ensureFolder=p=>{if(!p)return true;return folders().includes(p)};
const saveFiles=a=>{if(!write('files',a))throw Error('Local browser storage is full. Export files or remove some content.');};
const saveFolders=a=>{if(!write('pc-folders',a))throw Error('Local browser storage is full.')};
const makeFile=(target,content,append)=>{const x=splitTarget(target);if(!x.name)throw Error('Invalid file name.');if(!ensureFolder(x.path))throw Error('Directory does not exist: '+displayPath(x.path));const a=files(),i=fileIndex(x.path,x.name);if(i>=0){a[i].content=append?String(a[i].content||'')+content:content;a[i].updatedAt=new Date().toISOString()}else a.push({name:x.name,type:'Text file',content:content,path:x.path,updatedAt:new Date().toISOString()});saveFiles(a);return ''};
const findFiles=()=>files().map((f,i)=>({...f,_i:i}));
const isPS=shell==='powershell';
const psMap={'gci':'ls','dir':'ls','get-childitem':'ls','gl':'pwd','get-location':'pwd','sl':'cd','set-location':'cd','ni':'mkdir','new-item':'new-item','gc':'cat','get-content':'cat','type':'cat','ri':'rm','remove-item':'rm','del':'rm','erase':'rm','ci':'cp','copy-item':'cp','copy':'cp','mi':'mv','move-item':'mv','cls':'clear','clear-host':'clear','write-output':'echo','write-host':'echo','get-date':'date','get-history':'history','get-command':'which','get-alias':'alias','write-host':'echo','write-output':'echo','get-variable':'env','printenv':'env','get-process':'ps','get-uptime':'uptime','clear-host':'clear','remove-variable':'unset','set-variable':'export','where-object':'where-object','select-string':'grep','select-object':'select-object','sort-object':'sort','measure-object':'wc','get-filehash':'stat','compress-archive':'tar','expand-archive':'tar'};
if(isPS)cmd=psMap[lower]||lower;
if(cmd==='help'&&!args.length){return help()}
if(cmd==='clear'||cmd==='cls'){return {clear:true}}
if(cmd==='pwd'){return displayPath(cwd)}
if(cmd==='whoami'){return isPS?'LocalUser':'user'}
if(cmd==='hostname'){return 'WEBOS-PC'}
if(cmd==='uname'){return 'WebOS Virtual PC 1.0 browser-environment'}
if(cmd==='date'){return new Date().toString()}
if(cmd==='history'){return history.map((h,i)=>(i+1)+'  '+h).join('\n')||'No commands in history.'}
if(cmd==='apps'||cmd==='Get-Process'.toLowerCase()){return isPS?'WebOS browser apps only: explorer, notepad, paint, calculator, browser, terminal':'WebOS apps: files, notes, paint, calculator, browser, calendar, terminal'}
if(cmd==='which'||cmd==='get-command'){return args.map(a=>a+' is a WebOS virtual shell command').join('\n')||'Use which <command>.'}
if(cmd==='cd'){const dest=norm(psValue('-Path',0)||'');if(dest&&!ensureFolder(dest))throw Error('No such directory: '+displayPath(dest));cwd=dest;refreshPrompt();return ''}
if(cmd==='ls'||cmd==='dir'){let p=cwd;const target=isPS?(psValue('-Path',0)||args.find(a=>!a.startsWith('-'))):args.find(a=>!a.startsWith('-'));if(target)p=norm(target);if(p&&!ensureFolder(p))throw Error('Cannot find path: '+displayPath(p));const dirs=folders().filter(f=>f.split('/').slice(0,-1).join('/')===p).map(f=>({name:f.split('/').pop(),kind:'Directory'}));const fs=findFiles().filter(f=>(f.path||'')===p).map(f=>({name:f.name,kind:'File',size:String((f.content||'').length)+' B'}));const rows=dirs.concat(fs);return rows.length?rows.map(x=>isPS?x.kind.padEnd(10)+' '+x.name:x.kind==='Directory'?x.name+'/':x.name).join('\n'):'(empty directory)'}
if(cmd==='mkdir'||cmd==='new-item'){const name=isPS?(psValue('-Name',0)||psValue('-Path',0)||args.find(a=>!a.startsWith('-'))):need();if(!name)throw Error('A folder name is required.');let target=norm(name);if(isPS){const ti=args.findIndex(x=>x.toLowerCase()==='-itemtype');if(ti>=0&&args[ti+1]&&args[ti+1].toLowerCase()==='file')return makeFile(name,'',false)}if(!target)throw Error('Cannot create the root directory.');if(folders().includes(target))throw Error('Already exists: '+displayPath(target));const p=target.split('/').slice(0,-1).join('/');if(p&&!ensureFolder(p))throw Error('Parent directory does not exist.');saveFolders(folders().concat(target));return 'Directory created: '+displayPath(target)}
if(cmd==='touch'){return makeFile(need(),'','')}
if(cmd==='cat'){const target=isPS?(psValue('-Path',0)||psValue('-LiteralPath',0)):need();const x=resolveFile(target);if(!x)throw Error('File not found: '+args[0]);return String(x.file.content||'')}
if(cmd==='echo'||cmd==='print'){const redirect=args.findIndex(a=>a==='>'||a==='>>');if(redirect>=0){const text=args.slice(0,redirect).join(' '),target=args[redirect+1];if(!target)throw Error('Missing output file.');return makeFile(target,text, args[redirect]==='>>')}return args.join(' ')}
if(cmd==='set-content'||cmd==='add-content'||cmd==='out-file'){const target=isPS?(psValue('-Path',0)||args.find(a=>!a.startsWith('-'))):args[0];if(!target)throw Error('Usage: Set-Content -Path <file> -Value <text>');const value=isPS?(psValue('-Value',Math.max(0,args.indexOf(target)+1))||''):args.slice(1).join(' ');return makeFile(target,value,cmd==='add-content'||cmd==='out-file'&&args.includes('-Append'))}
if(cmd==='rm'){const target=isPS?(psValue('-Path',0)||psValue('-LiteralPath',0)||args.find(a=>!a.startsWith('-'))):need();if(!target)throw Error('A path is required.');const recursive=args.includes('-r')||args.includes('-Recurse');const p=norm(target);const x=resolveFile(target);if(x){const a=files();const trash=read('files-trash',[]);trash.push(a.splice(x.index,1)[0]);saveFiles(a);write('files-trash',trash);return 'Moved to Recycle Bin: '+target}if(folders().includes(p)){const descendants=folders().filter(f=>f===p||f.startsWith(p+'/'));const nested=files().filter(f=>(f.path||'')===p||(f.path||'').startsWith(p+'/'));if(!recursive&&(descendants.length>1||nested.length))throw Error('Directory is not empty. Use rm -r '+target);saveFolders(folders().filter(f=>!descendants.includes(f)));if(nested.length){const a=files().filter(f=>!nested.includes(f)),trash=read('files-trash',[]).concat(nested);saveFiles(a);write('files-trash',trash)}return 'Directory removed: '+target}throw Error('Path not found: '+target)}
if(cmd==='restore'){const name=need(),trash=read('files-trash',[]),i=trash.findIndex(f=>f.name===name);if(i<0)throw Error('No matching item in Recycle Bin.');const f=trash.splice(i,1)[0];write('files-trash',trash);const a=files();a.push(f);saveFiles(a);return 'Restored '+name}
if(cmd==='cp'||cmd==='mv'){const source=isPS?(psValue('-Path',0)||args.find(a=>!a.startsWith('-'))):args[0],dest=isPS?(psValue('-Destination',1)||args[args.indexOf(source)+1]):args[1];if(!source||!dest)throw Error('Usage: '+cmd+' <source> <destination>');const src=resolveFile(source);if(!src)throw Error('Source file not found.');const dst=splitTarget(dest);if(!ensureFolder(dst.path))throw Error('Destination folder does not exist.');const a=files();if(cmd==='cp'){a.push({...src.file,name:dst.name||src.name,path:dst.path});saveFiles(a);return 'Copied '+src.name}else{a[src.index]={...src.file,name:dst.name||src.name,path:dst.path};saveFiles(a);return 'Moved '+src.name}}
if(cmd==='find'){const term=args[0]||'';return findFiles().filter(f=>f.name.includes(term)||(f.content||'').includes(term)).map(f=>displayPath(f.path)+(f.path?'/':'')+f.name).join('\n')||'No matches.'}
if(cmd==='grep'){const term=args[0],x=resolveFile(args[1]||'');if(!term||!x)throw Error('Usage: grep <text> <file>');return String(x.file.content||'').split('\n').filter(l=>l.includes(term)).join('\n')||'No matching lines.'}
if(cmd==='test-path'){const target=psValue('-Path',0)||need(),p=norm(target);return String(ensureFolder(p)||!!resolveFile(target))}
if(cmd==='resolve-path'){const p=norm(need());if(!ensureFolder(p)&&!resolveFile(args[0]))throw Error('Path not found.');return displayPath(p)}
if(cmd==='nano'||cmd==='notepad'){const target=need(),x=resolveFile(target),initial=x?String(x.file.content||''):'';const value=prompt('Edit '+target+' (saved to virtual disk)',initial);if(value!==null)return makeFile(target,value,false);return 'Edit cancelled.'}
if(cmd==='uname'&&isPS)return 'Microsoft Windows 11 WebOS virtual environment';
if(cmd==='exit'){return 'Shell session remains open. Close the Terminal window to exit.'}
if(cmd==='alias'&&shell==='zsh')return 'Aliases: ll=ls -la, la=ls -a, ..=cd ..';
const extra=extraCommand(cmd,args,command);if(extra!==null)return extra;throw Error('Command not found: '+tokensafe(cmd)+'. Type help for commands available in '+configs[shell].label+'.')}
function tokensafe(s){return String(s).replace(/[<>]/g,'')}

const commandCatalog={
bash:{
"Navigation & files":["pwd","ls","cd","tree","mkdir","rmdir","touch","cp","mv","rm","ln","readlink","stat","file","basename","dirname","realpath","find","locate","which","whereis"],
"Read & edit text":["cat","less","more","head","tail","nl","wc","sort","uniq","cut","paste","tr","grep","egrep","sed","awk","diff","comm","tee","printf"],
"Shell & scripting":["echo","printf","history","alias","unalias","type","command","help","man","source","export","unset","env","set","read","test","expr","seq","true","false","exit"],
"System & processes":["date","cal","whoami","id","hostname","uname","uptime","ps","top","kill","jobs","bg","fg","df","du","free","clear","sleep","time"],
"Permissions & archives":["chmod","chown","chgrp","umask","tar","gzip","gunzip","zip","unzip","sha256sum"],
"Network & developer tools":["curl","wget","ping","ssh","scp","git","python","node","npm","make","xargs"]
},
zsh:{
"Navigation & files":["pwd","ls","cd","pushd","popd","dirs","tree","mkdir","rmdir","touch","cp","mv","rm","ln","readlink","stat","file","basename","dirname","realpath","find","locate","which","whereis"],
"Read & edit text":["cat","less","more","head","tail","nl","wc","sort","uniq","cut","paste","tr","grep","egrep","sed","awk","diff","comm","tee","printf"],
"Zsh features":["autoload","bindkey","compinit","functions","history","fc","alias","unalias","type","command","source","export","unset","env","setopt","unsetopt","zmodload","prompt","rehash"],
"Shell & scripting":["test","expr","seq","true","false","read","return","exit","eval","time"],
"System & processes":["date","cal","whoami","id","hostname","uname","uptime","ps","top","kill","jobs","bg","fg","df","du","free","clear"],
"Permissions & archives":["chmod","chown","chgrp","umask","tar","gzip","gunzip","zip","unzip","sha256sum"],
"Network & developer tools":["curl","wget","ping","ssh","scp","git","python","node","npm","make","xargs"]
},
powershell:{
"Navigation & files":["Get-Location","Set-Location","Get-ChildItem","New-Item","Remove-Item","Copy-Item","Move-Item","Rename-Item","Get-Item","Get-Content","Set-Content","Add-Content","Clear-Content","Test-Path","Resolve-Path","Join-Path","Split-Path","Get-ChildItem -Recurse"],
"Objects & pipelines":["Where-Object","ForEach-Object","Select-Object","Sort-Object","Group-Object","Measure-Object","Compare-Object","Format-Table","Format-List","Out-File","Tee-Object","ConvertTo-Json","ConvertFrom-Json","Export-Csv","Import-Csv","Select-String"],
"Variables & scripting":["Get-Variable","Set-Variable","New-Variable","Remove-Variable","Get-ChildItem Env:","Set-ExecutionPolicy","Get-Command","Get-Alias","Set-Alias","Get-Help","Get-History","Invoke-History","Clear-History","Write-Output","Write-Host","Write-Error","Read-Host","Start-Sleep","Exit"],
"System & processes":["Get-Process","Stop-Process","Start-Process","Get-Service","Get-Date","Get-ComputerInfo","Get-CimInstance","Get-Location","Get-Member","Get-Random","Get-Uptime","Clear-Host"],
"Network & developer tools":["Test-Connection","Invoke-WebRequest","Invoke-RestMethod","Resolve-DnsName","Test-NetConnection","ssh","scp","git","node","npm"],
"Archives & security":["Compress-Archive","Expand-Archive","Get-FileHash","Get-Acl","Set-Acl","Get-AuthenticodeSignature"]
}};
const commandDescriptions={
pwd:"Print the current virtual working directory",ls:"List virtual files and folders",cd:"Change virtual directory",tree:"Display a directory tree",mkdir:"Create a directory",rmdir:"Remove an empty directory",touch:"Create an empty text file",cat:"Display a file",head:"Show the first lines of a file",tail:"Show the last lines of a file",wc:"Count lines, words and characters",grep:"Search text in a file",find:"Find virtual files by name or content",printf:"Print formatted text",seq:"Generate a number sequence",date:"Show the current date and time",history:"Show entered commands",env:"Show shell environment variables",export:"Set a shell variable",unset:"Remove a shell variable",ps:"List simulated WebOS processes",top:"Show simulated process summary",df:"Show virtual storage summary",du:"Estimate virtual file sizes",chmod:"Change simulated file permissions",tar:"Create or list a simulated archive",git:"Run supported local Git practice commands",help:"Show shell help",commands:"List the command catalogue",practice:"Show beginner, intermediate or advanced exercises",hint:"Show a hint for the current exercise",check:"Check the current practice exercise"};
const lessons={
beginner:[
["Show your current directory","pwd","Run pwd."],
["List files and folders","ls -la","Try ls, then ls -la."],
["Create a practice folder","mkdir practice","Create a folder named practice."],
["Create a file inside it","touch practice/notes.txt","Use touch with a path."],
["Write text into the file","echo Hello WebOS > practice/notes.txt","Use > to write a file."],
["Read your file","cat practice/notes.txt","Use cat followed by the path."]
],
intermediate:[
["Create a project structure","mkdir project; mkdir project/src","Create project and its src folder."],
["Create two source files","touch project/src/app.js; touch project/src/utils.js","Use touch twice."],
["Write and append text","echo first > project/src/app.js; echo second >> project/src/app.js","Use >> to append."],
["Search inside a file","grep second project/src/app.js","Search for the word second."],
["Copy and rename a file","cp project/src/app.js project/src/backup.js; mv project/src/backup.js project/src/copy.js","Use cp and mv."],
["Count file contents","wc project/src/app.js","Use wc on the file."]
],
advanced:[
["Build a nested workspace","mkdir workspace; mkdir workspace/logs; mkdir workspace/archive","Create all three folders."],
["Create a log file","echo INFO:started > workspace/logs/app.log; echo ERROR:failed >> workspace/logs/app.log","Write two log lines."],
["Filter errors","grep ERROR workspace/logs/app.log","Find only the error line."],
["Sort and inspect text","sort workspace/logs/app.log","Sort the log output."],
["Create a backup copy","cp workspace/logs/app.log workspace/archive/app-backup.log","Copy the log to archive."],
["Verify the backup","diff workspace/logs/app.log workspace/archive/app-backup.log","Compare both files."]
]};
let activeLesson=null,lessonIndex=0;
function listCommands(){return Object.entries(commandCatalog[shell]).map(([group,items])=>group+": "+items.join(", ")).join("\n")}
function runPractice(level){const key=(level||'beginner').toLowerCase();if(!lessons[key])return 'Choose a level: practice beginner, practice intermediate, or practice advanced.';activeLesson=key;lessonIndex=0;return key.toUpperCase()+' PRACTICE · '+lessons[key].length+' exercises\n1. '+lessons[key][0][0]+'\nCommand goal: '+lessons[key][0][1]+'\nType hint for a clue, or check when you have completed it.'}
function checkPractice(){if(!activeLesson)return 'Start with: practice beginner';const lesson=lessons[activeLesson][lessonIndex];if(!lesson)return 'All exercises completed! Start another level with practice beginner/intermediate/advanced.';const needed=lesson[1].split(';').map(x=>x.trim().split(/\s+/)[0]);const recent=history.slice(-8).join(' ').toLowerCase();const ok=needed.every(n=>recent.includes(n.toLowerCase()));if(!ok)return 'Not quite yet. Review the task and try again. Hint: '+lesson[2];lessonIndex++;if(lessonIndex>=lessons[activeLesson].length)return 'Excellent! '+activeLesson+' practice completed. Start another level whenever you are ready.';const next=lessons[activeLesson][lessonIndex];return 'Correct! Next exercise ('+(lessonIndex+1)+'/'+lessons[activeLesson].length+'): '+next[0]+'\nGoal: '+next[1]+'\nType hint for a clue.'}
function practiceHint(){if(!activeLesson)return 'Start with: practice beginner';const l=lessons[activeLesson][lessonIndex];return l?'Hint: '+l[2]:'No active exercise.'}
function extraCommand(cmd,args,raw){
const a=args,first=a[0],file=first?resolveFile(first):null;
if(cmd==='commands'||cmd==='compgen'||cmd==='get-help-list')return listCommands();
if(cmd==='practice')return runPractice(a[0]);
if(cmd==='hint')return practiceHint();
if(cmd==='check')return checkPractice();
if(cmd==='man'||cmd==='help'&&a.length){const name=(cmd==='man'?a[0]:a[0]).toLowerCase();return commandDescriptions[name]||'No detailed manual for '+name+'. Use commands to browse the catalogue.'}
if(cmd==='tree'){const root=norm(first||'');if(root&&!ensureFolder(root))throw Error('Directory not found.');const rows=[];folders().filter(p=>!root||p===root||p.startsWith(root+'/')).forEach(p=>rows.push(p+'/'));files().filter(f=>!root||(f.path||'')===root||(f.path||'').startsWith(root+'/')).forEach(f=>rows.push((f.path?f.path+'/':'')+f.name));return rows.join('\n')||'(empty)'}
if(cmd==='rmdir'){const p=norm(first||'');if(!p||!folders().includes(p))throw Error('Directory not found.');if(folders().some(x=>x.startsWith(p+'/'))||files().some(x=>(x.path||'')===p))throw Error('Directory is not empty.');saveFolders(folders().filter(x=>x!==p));return 'Removed directory '+p}
if(cmd==='head'||cmd==='tail'||cmd==='nl'||cmd==='less'||cmd==='more'){if(!file)throw Error('Usage: '+cmd+' <file>');let lines=String(file.file.content||'').split('\n');if(cmd==='head')lines=lines.slice(0,Number(a[1])||10);if(cmd==='tail')lines=lines.slice(-(Number(a[1])||10));if(cmd==='nl')lines=lines.map((x,i)=>(i+1)+'  '+x);return lines.join('\n')}
if(cmd==='wc'){if(!file)throw Error('Usage: wc <file>');const t=String(file.file.content||'');return t.split('\n').length+' lines  '+(t.trim()?t.trim().split(/\s+/).length:0)+' words  '+t.length+' characters'}
if(cmd==='printf')return a.join(' ').replace(/\\n/g,'\n').replace(/%s/g,()=>a.shift()||'');
if(cmd==='seq'){let start=1,end=Number(a[0]),step=1;if(a.length>1){start=Number(a[0]);end=Number(a[1])}if(a.length>2)step=Number(a[2]);if(!Number.isFinite(end)||!step||Math.abs(end-start)>1000)throw Error('Usage: seq [start] end [step] (maximum 1001 values)');const out=[];for(let n=start;step>0?n<=end:n>=end;n+=step)out.push(n);return out.join('\n')}
if(cmd==='sort'||cmd==='uniq'||cmd==='tac'||cmd==='rev'){if(!file)throw Error('Usage: '+cmd+' <file>');let lines=String(file.file.content||'').split('\n');if(cmd==='sort')lines.sort((x,y)=>x.localeCompare(y));if(cmd==='uniq')lines=lines.filter((x,i)=>i===0||x!==lines[i-1]);if(cmd==='tac')lines.reverse();if(cmd==='rev')lines=lines.map(x=>[...x].reverse().join(''));return lines.join('\n')}
if(cmd==='cut'||cmd==='tr'){if(!file)throw Error('Usage: '+cmd+' <file>');const t=String(file.file.content||'');if(cmd==='tr')return t.split(a[0]||'').join(a[1]||'');return t.split('\n').map(x=>x.split(a[1]||',')[Math.max(0,(Number((a[0]||'-f1').replace(/^-f/,''))||1)-1)]||'').join('\n')}
if(cmd==='diff'||cmd==='comm'){const x=resolveFile(a[0]||''),y=resolveFile(a[1]||'');if(!x||!y)throw Error('Usage: '+cmd+' <file1> <file2>');return String(x.file.content||'')===String(y.file.content||'')?'Files are identical.':'Files differ.\n'+(cmd==='diff'?'--- '+a[0]+'\n+++ '+a[1]:'Compare each file with cat.')}
if(cmd==='tee'){if(!first)throw Error('Usage: tee <file>');return makeFile(first,a.slice(1).join(' '),false)}
if(cmd==='basename')return (first||'').split('/').pop()||'';
if(cmd==='dirname')return (first||'').split('/').slice(0,-1).join('/')||'.';
if(cmd==='realpath'||cmd==='readlink')return displayPath(norm(first||''));
if(cmd==='file')return file?'ASCII text (virtual file)':'No such virtual file.';
if(cmd==='stat')return file?'File: '+file.file.name+'\nSize: '+String(file.file.content||'').length+' bytes\nModified: '+(file.file.updatedAt||'unknown'):'Path not found.';
if(cmd==='test'||cmd==='['){const target=a[a.length-1]||'';return String(!!resolveFile(target)||ensureFolder(norm(target)))}
if(cmd==='true')return '';
if(cmd==='false')throw Error('Command returned status 1 (simulated).');
if(cmd==='cal')return 'Calendar view is available in the WebOS Calendar app.';
if(cmd==='uptime')return 'WebOS virtual session active in this browser.';
if(cmd==='id')return 'uid=1000(user) gid=1000(user) groups=1000(user) [simulated]';
if(cmd==='ps'||cmd==='top'||cmd==='jobs')return 'PID  PROCESS\n100  WebOS Desktop\n101  Terminal (virtual)\n102  Browser UI\nNote: simulated WebOS processes only.';
if(cmd==='kill'||cmd==='bg'||cmd==='fg')return 'Process job control is simulated; no host processes are affected.';
if(cmd==='df'||cmd==='du'||cmd==='free')return 'Virtual browser storage only. Approximate WebOS file count: '+files().length+'; content bytes: '+files().reduce((n,f)=>n+String(f.content||'').length,0);
if(cmd==='env'||cmd==='printenv'||cmd==='get-variable')return Object.entries({...vars,HOME:configs[shell].home,USER:'user',SHELL:shell,WEBOS:'1'}).map(([k,v])=>k+'='+v).join('\n');
if(cmd==='export'||cmd==='set-variable'||cmd==='set'){const m=raw.match(/(?:export|set-variable|set)\s+([^=\s]+)\s*=\s*(.*)/i);if(m){vars[m[1]]=m[2].replace(/^['"]|['"]$/g,'');return ''}return 'Usage: export NAME=value'}
if(cmd==='unset'||cmd==='remove-variable'){delete vars[first];return ''}
if(cmd==='alias')return 'Aliases: ll=ls -la, la=ls -a, ..=cd ..'+(a.length?'\nAlias creation is not persisted.':'');
if(cmd==='type'||cmd==='which'||cmd==='get-command')return first?first+' is a WebOS virtual command':'Use type <command>.';
if(cmd==='clear'||cmd==='clear-host'||cmd==='cls')return {clear:true};
if(cmd==='chmod'||cmd==='chown'||cmd==='chgrp'||cmd==='umask')return 'Permissions are illustrative only in the virtual filesystem.';
if(cmd==='tar'||cmd==='gzip'||cmd==='gunzip'||cmd==='zip'||cmd==='unzip'||cmd==='compress-archive'||cmd==='expand-archive')return 'Archive operation simulated: use File Manager JSON export for a real backup of WebOS data.';
if(cmd==='curl'||cmd==='wget'||cmd==='invoke-webrequest'||cmd==='invoke-restmethod'||cmd==='ping'||cmd==='test-connection'||cmd==='ssh'||cmd==='scp')return 'Network access is intentionally disabled in the virtual shell.';
if(cmd==='git')return 'Git is not installed in this browser simulator. Use GitHub in the Web Browser app.';
if(['python','node','npm','make','xargs','awk','sed','paste','expr','sleep','start-process','get-service','stop-process','get-computerinfo','get-ciminstance','get-member','get-random','get-date','get-process','get-childitem','get-location','set-location','new-item','get-content','set-content','add-content','remove-item','copy-item','move-item','rename-item','get-item','clear-content','test-path','resolve-path','join-path','split-path','where-object','foreach-object','select-object','sort-object','group-object','measure-object','compare-object','format-table','format-list','out-file','tee-object','convertto-json','convertfrom-json','export-csv','import-csv','select-string','get-variable','new-variable','get-alias','set-alias','get-help','invoke-history','clear-history','write-error','read-host','get-uptime','resolve-dnsname','test-netconnection','compress-archive','expand-archive','get-filehash','get-acl','set-acl','get-authenticodesignature','autoload','bindkey','compinit','functions','fc','setopt','unsetopt','zmodload','rehash','pushd','popd','dirs','ln','locate','whereis','egrep','comm','sha256sum'].includes(cmd))return 'This command is listed for learning, but its full OS behavior is not available in the safe browser simulator. Use help and practice for supported hands-on commands.';
return null;
}
function renderShell(win){if(win.dataset.shellLab==='1')return;win.dataset.shellLab='1';const body=win.querySelector('.window-body');if(!body)return;
body.innerHTML='<div class="shell-lab"><div class="shell-toolbar"><div class="shell-tabs" role="tablist" aria-label="Choose command shell">'+shells.map(s=>'<button role="tab" data-shell="'+s+'" aria-selected="'+(s===shell)+'">'+configs[s].label+'</button>').join('')+'</div><span class="shell-state">WEBOS VIRTUAL ENVIRONMENT</span><button class="action" data-shell-clear>Clear</button></div><div class="shell-subtitle">Independent command-line environments · Shared virtual PC files</div><div class="shell-screen" id="shell-screen"><div class="shell-banner">WebOS Terminal · Select Bash, Zsh or PowerShell. Type <b>help</b> to see commands.</div><div id="shell-output" aria-live="polite"></div><div class="shell-input-row"><span id="shell-prompt">$ </span><input id="shell-command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Shell command" placeholder="Type a command…"></div></div><div class="shell-footer"><span>Local virtual disk</span><span>Host OS access: disabled</span></div></div>';
const input=$('#shell-command');function choose(s){shell=s;cwd='';history=[];historyIndex=0;vars={};win.querySelectorAll('[data-shell]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.shell===shell)));$('#shell-output').innerHTML='';output(configs[shell].label+' shell started. Type help.');refreshPrompt();input.focus()}
win.querySelectorAll('[data-shell]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.shell)));
win.querySelector('[data-shell-clear]').onclick=()=>$('#shell-output').innerHTML='';
function submit(){const raw=input.value;input.value='';if(!raw.trim())return;history.push(raw);historyIndex=history.length;output(shellPrompt()+raw);try{const result=execute(raw);if(result&&result.clear)$('#shell-output').innerHTML='';else if(result)output(result)}catch(e){output((shell==='powershell'?'': 'webos: ')+e.message)}refreshPrompt();$('#shell-screen').scrollTop=$('#shell-screen').scrollHeight}
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}else if(e.key==='ArrowUp'){e.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||''}else if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||''}else if(e.key==='Tab'){e.preventDefault();const partial=input.value.trim().split(/\s+/).pop().toLowerCase();const matches=files().map(f=>f.name).concat(folders().map(f=>f.split('/').pop())).filter(n=>n.toLowerCase().startsWith(partial));if(matches.length===1)input.value=input.value.slice(0,input.value.length-partial.length)+matches[0]}});
input.focus();output('Virtual shell ready. Use help for supported commands.');}
function init(){document.addEventListener('webos-app-opened',event=>{if(event.detail&&event.detail.id==='terminal')renderShell(event.detail.window)});const host=$('#desktop');if(!host)return;const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType!==1)return;const win=n.matches('.window[data-app="terminal"]')?n:n.querySelector?.('.window[data-app="terminal"]');if(win)renderShell(win)})));observer.observe(host,{childList:true,subtree:true});const existing=host.querySelector('.window[data-app="terminal"]');if(existing)renderShell(existing)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();