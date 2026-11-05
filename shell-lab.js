(()=> {
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,d)=>{try{const v=localStorage.getItem('webos:'+k);return v===null?d:JSON.parse(v)}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem('webos:'+k,JSON.stringify(v));return true}catch{return false}};
const shells=['bash','zsh','powershell'];
const configs={bash:{label:'Bash',prompt:'user@webos',home:'/home/user'},zsh:{label:'Zsh',prompt:'user@webos',home:'/home/user'},powershell:{label:'PowerShell',prompt:'PS C:\\Users\\LocalUser',home:'C:\\Users\\LocalUser'}};
let shell='bash',cwd='',history=[],historyIndex=0,vars={},dirStack=[];
const base=['Desktop','Documents','Downloads','Pictures','Music','Videos'];
function folders(){let f=read('pc-folders',base);return Array.isArray(f)?f:base}
function files(){let f=read('files',[]);return Array.isArray(f)?f:[]}
function norm(input){let raw=String(input||'').trim();if(!raw||raw==='~'||raw==='$HOME'||raw==='%USERPROFILE%')return '';let absolute=false;if(shell==='powershell'){raw=raw.replace(/\\/g,'/');absolute=/^[a-z]:\//i.test(raw)||raw.startsWith('/');if(/^c:\/?$/i.test(raw))return '';raw=raw.replace(/^c:/i,'');if(raw.startsWith('/Users/LocalUser'))raw=raw.slice('/Users/LocalUser'.length);if(raw.startsWith('/'))raw=raw.slice(1)}else{raw=raw.replace(/^~(?=\/|$)/,'');absolute=raw.startsWith('/');if(raw.startsWith('/home/user'))raw=raw.slice('/home/user'.length);if(raw.startsWith('/'))raw=raw.slice(1)}if(!raw)return '';const parts=(absolute?raw:(cwd?cwd+'/'+raw:raw)).split('/');const out=[];for(const p of parts){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/')}
function displayPath(p){if(shell==='powershell')return 'C:\\Users\\LocalUser'+(p?'\\'+p.replace(/\//g,'\\'):'');return (shell==='zsh'?'~':'/home/user')+(p?'/'+p:'')}
function tokenize(s){const out=[];let cur='',q='',escNext=false;for(let i=0;i<s.length;i++){const c=s[i];if(escNext){cur+=c;escNext=false;continue}if(c==='\\'&&q!=="'"){escNext=true;continue}if(q){if(c===q)q='';else cur+=c;continue}if(c==='"'||c==="'"){q=c;continue}if(/\s/.test(c)){if(cur){out.push(cur);cur=''}}else cur+=c}if(cur)out.push(cur);return out.map(v=>v.replace(/\$\{([A-Za-z_][\w]*)\}|\$([A-Za-z_][\w]*|\?)/g,(m,a,b)=>{const k=a||b;return k==='HOME'?configs[shell].home:k==='USER'?'user':k==='SHELL'?shell:k==='?'?'0':String(vars[k]??m)}))}
function fileIndex(path,name){return files().findIndex(f=>(f.path||'')===path&&f.name.toLowerCase()===name.toLowerCase())}
function splitTarget(target){const p=norm(target);const parts=p.split('/');return {path:parts.length>1?parts.slice(0,-1).join('/'):'',name:parts[parts.length-1]||''}}
function output(text){const line=document.createElement('div');line.className='shell-output-line';line.textContent=String(text);$('#shell-output').append(line);$('#shell-output').scrollTop=$('#shell-output').scrollHeight}
function shellPrompt(){return shell==='powershell'?displayPath(cwd)+' > ': (shell==='zsh'?'% ':'$ ')}
function refreshPrompt(){const p=$('#shell-prompt');if(p)p.textContent=shellPrompt()}
function help(){if(shell==='powershell')return 'PowerShell: Get-ChildItem, Get-Location, Set-Location, New-Item, Get-Content, Set-Content, Add-Content, Remove-Item, Copy-Item, Move-Item, Test-Path, Resolve-Path, Get-Date, Get-Process, Get-Command, Get-History, Write-Output. Use commands for the full catalogue; Get-Help <name> for help; practice beginner|intermediate|advanced to train.';return 'Use commands for the full '+configs[shell].label+' catalogue; man <command> for a manual; practice beginner|intermediate|advanced for guided exercises; hint and check to progress. Core commands: pwd, ls, cd, mkdir, touch, cat, echo, grep, find, cp, mv, rm, history, clear.'}
function resolveFile(target){if(String(target)==='-'&&stdinBuffer!==null)return {file:{name:'stdin',content:stdinBuffer},index:-1,path:'',name:'stdin'};const x=splitTarget(target);const i=fileIndex(x.path,x.name);return i<0?null:{file:files()[i],index:i,path:x.path,name:x.name}}
function executeSingle(raw){const command=raw.trim();if(!command)return '';if(shell==='powershell'&&/^\$[A-Za-z_]\w*\s*=/.test(command)){const m=command.match(/^\$([A-Za-z_]\w*)\s*=\s*(.*)$/);vars[m[1]]=m[2].replace(/^["']|["']$/g,'');return ''}
let tokens=tokenize(command),cmd=(tokens.shift()||'');const lower=cmd.toLowerCase(),args=tokens;
const arg=()=>args.join(' '),need=()=>{if(!args.length)throw Error('A path or name is required.');return args[0]},psValue=(flag,fallback)=>{if(!isPS)return args[fallback||0];const i=args.findIndex(a=>a.toLowerCase()===flag.toLowerCase());return i>=0?args[i+1]:args[fallback||0]};
const ensureFolder=p=>{if(!p)return true;return folders().includes(p)};
const saveFiles=a=>{if(!write('files',a))throw Error('Local browser storage is full. Export files or remove some content.');};
const saveFolders=a=>{if(!write('pc-folders',a))throw Error('Local browser storage is full.')};
const makeFile=(target,content,append)=>{const x=splitTarget(target);if(!x.name)throw Error('Invalid file name.');if(!ensureFolder(x.path))throw Error('Directory does not exist: '+displayPath(x.path));const a=files(),i=fileIndex(x.path,x.name);if(i>=0){a[i].content=append?String(a[i].content||'')+content:content;a[i].updatedAt=new Date().toISOString()}else a.push({name:x.name,type:'Text file',content:content,path:x.path,updatedAt:new Date().toISOString()});saveFiles(a);return ''};
const findFiles=()=>files().map((f,i)=>({...f,_i:i}));
const isPS=shell==='powershell';
const psMap={'gci':'ls','dir':'ls','get-childitem':'ls','gl':'pwd','get-location':'pwd','sl':'cd','set-location':'cd','ni':'mkdir','new-item':'new-item','gc':'cat','get-content':'cat','type':'cat','ri':'rm','remove-item':'rm','del':'rm','erase':'rm','ci':'cp','copy-item':'cp','copy':'cp','mi':'mv','move-item':'mv','cls':'clear','clear-host':'clear','write-output':'echo','write-host':'echo','get-date':'date','get-history':'history','get-alias':'alias','write-host':'echo','write-output':'echo','get-variable':'env','printenv':'env','get-process':'ps','get-uptime':'uptime','clear-host':'clear','remove-variable':'unset','set-variable':'export','where-object':'where-object','select-string':'grep','select-object':'select-object','sort-object':'sort','measure-object':'wc','get-filehash':'stat','compress-archive':'tar','expand-archive':'tar'};
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
let stdinBuffer=null;
function splitShellSegments(source,operators){
 const out=[];let quote="",escape=false,start=0;
 for(let i=0;i<source.length;i++){const c=source[i];if(escape){escape=false;continue}if(c==="\\"&&quote!=="'"){escape=true;continue}if(quote){if(c===quote)quote="";continue}if(c==="'"||c==='"'){quote=c;continue}
  const op=operators.find(x=>source.startsWith(x,i));if(op){out.push({text:source.slice(start,i).trim(),op});i+=op.length-1;start=i+1;}
 }out.push({text:source.slice(start).trim(),op:null});return out.filter(x=>x.text);
}
function execute(raw){
 const segments=splitShellSegments(String(raw||""),["&&","||",";"]);
 let result="",lastCode=0,previousOp=null;
 for(const segment of segments){
  if(previousOp==="&&"&&lastCode!==0){previousOp=segment.op;continue}
  if(previousOp==="||"&&lastCode===0){previousOp=segment.op;continue}
  try{
   const pipeline=splitShellSegments(segment.text,["|"]);let pipeValue=stdinBuffer;
   for(let i=0;i<pipeline.length;i++){
    stdinBuffer=i?pipeValue:null;
    const part=pipeline[i].text;
    const redir=splitShellSegments(part,[">>",">"]);
    let command=redir[0]?.text||part;
    const value=executeSingle(command);
    pipeValue=value&&typeof value==="object"?"":String(value??"");
    if(redir.length>1){const target=redir[1].text.trim().split(/\s+/)[0];if(!target)throw Error("Redirection target missing.");makeFile(target,pipeValue,redir[0].op===">>");}
    if(i===pipeline.length-1)result=value;
   }
   lastCode=0;
  }catch(error){lastCode=1;result="webos: "+error.message}
  previousOp=segment.op;
 }
 stdinBuffer=null;return result;
}
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
"Core & discovery":["Get-Command","Get-Help","Get-Location","Set-Location","Clear-Host","Get-History","Invoke-History","Clear-History","Get-Date","Get-Random","Write-Output","Write-Host","Read-Host","Get-Variable","Set-Variable","New-Variable","Remove-Variable","Get-Alias","Set-Alias","Get-Member","Measure-Object","Out-Host","Get-PSDrive","Get-PSProvider"],
"File system & paths":["Get-ChildItem","New-Item","Remove-Item","Copy-Item","Move-Item","Rename-Item","Get-Item","Set-Item","Test-Path","Resolve-Path","Join-Path","Split-Path","Get-Content","Set-Content","Add-Content","Clear-Content","Select-String","Compare-Object","Get-FileHash","Get-ItemProperty","Set-ItemProperty","Remove-ItemProperty","Get-Acl","Set-Acl","Get-ChildItem -Recurse"],
"System & inventory":["Get-ComputerInfo","hostname","systeminfo","Get-CimInstance","Get-WmiObject","Get-Process","Get-Service","Get-HotFix","Get-InstalledModule","Get-ExecutionPolicy","Set-ExecutionPolicy","Get-TimeZone","Get-Culture","Get-Uptime","Get-Volume","Get-Disk","Get-Partition","Get-PhysicalDisk"],
"Processes & jobs":["Start-Process","Stop-Process","Wait-Process","Debug-Process","Get-Job","Start-Job","Stop-Job","Receive-Job","Remove-Job","Wait-Job","Suspend-Job","Resume-Job"],
"Services":["Start-Service","Stop-Service","Restart-Service","Suspend-Service","Resume-Service","Set-Service","New-Service"],
"Networking":["Test-Connection","Test-NetConnection","Get-NetIPConfiguration","Get-NetIPAddress","New-NetIPAddress","Remove-NetIPAddress","Get-NetAdapter","Enable-NetAdapter","Disable-NetAdapter","Restart-NetAdapter","Get-NetRoute","Get-NetTCPConnection","Resolve-DnsName","Clear-DnsClientCache","Get-DnsClientServerAddress","Set-DnsClientServerAddress","Get-NetFirewallProfile","Get-NetFirewallRule","New-NetFirewallRule","Set-NetFirewallRule","Remove-NetFirewallRule","Get-NetNeighbor","Get-NetConnectionProfile"],
"Users & accounts":["Get-LocalUser","New-LocalUser","Set-LocalUser","Remove-LocalUser","Get-LocalGroup","New-LocalGroup","Add-LocalGroupMember","Remove-LocalGroupMember","Get-LocalGroupMember","Get-Credential","whoami","Get-ADUser","New-ADUser","Set-ADUser","Remove-ADUser","Get-ADGroup"],
"Security & Defender":["Get-MpComputerStatus","Get-MpThreat","Get-MpThreatDetection","Start-MpScan","Update-MpSignature","Get-NetFirewallProfile","Get-NetFirewallRule","New-NetFirewallRule","Set-NetFirewallRule","Remove-NetFirewallRule"],
"Storage & disks":["Get-Disk","Get-PhysicalDisk","Get-Volume","Get-Partition","New-Partition","Remove-Partition","Resize-Partition","Format-Volume","Get-StoragePool","Get-StorageReliabilityCounter","Repair-Volume","Optimize-Volume"],
"Registry & providers":["Get-ItemProperty","Set-ItemProperty","New-ItemProperty","Remove-ItemProperty","Get-Item","New-Item","Remove-Item","Test-Path","Get-PSDrive"],
"PowerShell scripting":["if","elseif","else","switch","for","foreach","while","do","until","break","continue","return","function","param","begin","process","end","try","catch","finally","throw","trap","class","enum","using","workflow","filter"],
"Objects & data":["Select-Object","Where-Object","ForEach-Object","Sort-Object","Group-Object","Measure-Object","Compare-Object","Select-String","ConvertTo-Json","ConvertFrom-Json","ConvertTo-Csv","ConvertFrom-Csv","Import-Csv","Export-Csv","Import-Clixml","Export-Clixml","ConvertTo-Xml","Format-Table","Format-List","Format-Wide","Out-File","Tee-Object"],
"Remoting & sessions":["Enter-PSSession","Exit-PSSession","New-PSSession","Get-PSSession","Remove-PSSession","Invoke-Command","Enable-PSRemoting","Disable-PSRemoting","Get-WSManInstance","Test-WSMan","New-PSSessionOption"],
"Web & transfers":["Invoke-WebRequest","Invoke-RestMethod","Start-BitsTransfer","Invoke-Expression","Test-Connection","Resolve-DnsName"],
"Events & diagnostics":["Get-EventLog","Get-WinEvent","New-EventLog","Write-EventLog","Clear-EventLog","Limit-EventLog","Get-Counter","Get-CimInstance","Get-ComputerInfo","Get-HotFix"],
"Windows administration":["Restart-Computer","Stop-Computer","Rename-Computer","Add-Computer","Remove-Computer","Get-ScheduledTask","Register-ScheduledTask","Unregister-ScheduledTask","Start-ScheduledTask","Stop-ScheduledTask","Get-Printer","Get-PrinterPort","Get-PrintJob"],
"Operators & syntax":["+","-","*","/","%","-eq","-ne","-gt","-lt","-ge","-le","-like","-match","-contains","-in","-and","-or","-not","-is","-isnot","-replace","-join","-split","|",">",">>","if","elseif","else","switch","for","foreach","while","do","break","continue","return","function","param","try","catch","finally","throw"],
"Modules & repositories":["Get-Module","Import-Module","Remove-Module","Find-Module","Install-Module","Update-Module","Uninstall-Module","Save-Module","Get-InstalledModule","Get-PSRepository","Register-PSRepository","Unregister-PSRepository"],
"Aliases":["ls","dir","gci","cd","pwd","cls","clear","cat","type","gc","cp","copy","mv","move","rm","del","rmdir","echo","write","where","select","sort","foreach","%","?","measure","diff","sleep","ps","kill","h"]
}};
const sharedLinuxCommands=["tac","less","more","rmdir","file","stat","ln","readlink","locate","whereis","basename","dirname","realpath","chmod","chown","chgrp","umask","getfacl","setfacl","sudo","su","egrep","fgrep","sed","awk","cut","sort","uniq","wc","tr","paste","join","comm","strings","tee","xargs","column","fold","nl","killall","pkill","nohup","nice","renice","wait","timeout","ip","ifconfig","curl","wget","ssh","scp","sftp","netstat","ss","traceroute","tracepath","nslookup","dig","host","whois","nc","nmap","tcpdump","df","du","lsblk","blkid","mount","umount","fdisk","parted","mkfs","fsck","dd","sync","tar","gzip","gunzip","zip","unzip","bzip2","bunzip2","xz","unxz","zcat","7z","useradd","adduser","usermod","userdel","passwd","groupadd","groupdel","groupmod","groups","who","w","last","lastlog","apt","apt-get","apt-cache","dpkg","yum","dnf","rpm","pacman","zypper","snap","flatpak","systemctl","service","journalctl","dmesg","free","vmstat","iostat","lscpu","lsusb","lspci","reboot","shutdown","poweroff","timedatectl","crontab","at","read","export","unset","declare","local","readonly","let","eval","exec","source","return","break","continue","shift","shopt","trap","builtin","fc","select","until","test","expr","seq","true","false","env","printenv"];
for(const key of ["bash","zsh"]) {
  const target=commandCatalog[key];
  target["Linux utilities & administration"]=sharedLinuxCommands;
}
commandCatalog.powershell["Additional PowerShell cmdlets"]=["Get-ItemProperty","Set-ItemProperty","Remove-ItemProperty","Get-ChildItem","Get-Location","Set-Location","Get-Content","Set-Content","Add-Content","Clear-Content","New-Item","Remove-Item","Copy-Item","Move-Item","Rename-Item","Get-Item","Test-Path","Resolve-Path","Join-Path","Split-Path","Get-FileHash","Get-Acl","Set-Acl","Get-Process","Stop-Process","Start-Process","Get-Service","Start-Service","Stop-Service","Restart-Service","Get-NetIPAddress","Get-NetIPConfiguration","Test-Connection","Resolve-DnsName","Get-ComputerInfo","Get-CimInstance","Get-EventLog","Get-WinEvent","Get-ScheduledTask","Register-ScheduledTask","Get-ExecutionPolicy","Set-ExecutionPolicy","Get-Module","Import-Module","Get-Command","Get-Help","Get-History","Get-Variable","Set-Variable","New-Variable","Remove-Variable","Get-Alias","Set-Alias","Export-Csv","Import-Csv","ConvertTo-Json","ConvertFrom-Json","Invoke-WebRequest","Invoke-RestMethod","Compress-Archive","Expand-Archive","Get-Random","Measure-Object","Where-Object","ForEach-Object","Select-Object","Sort-Object","Group-Object","Compare-Object","Format-Table","Format-List","Out-File","Tee-Object"];
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
function listCommands(filter=''){return Object.entries(commandCatalog[shell]).map(([group,items])=>({group,items:items.filter(item=>!filter||(group+' '+item).toLowerCase().includes(filter.toLowerCase()))})).filter(x=>x.items.length).map(x=>x.group+": "+x.items.join(", ")).join("\n")||'No matching commands.'}
function runPractice(level){const key=(level||'beginner').toLowerCase();if(!lessons[key])return 'Choose a level: practice beginner, practice intermediate, or practice advanced.';activeLesson=key;lessonIndex=0;return key.toUpperCase()+' PRACTICE · '+lessons[key].length+' exercises\n1. '+lessons[key][0][0]+'\nCommand goal: '+lessons[key][0][1]+'\nType hint for a clue, or check when you have completed it.'}
function checkPractice(){if(!activeLesson)return 'Start with: practice beginner';const lesson=lessons[activeLesson][lessonIndex];if(!lesson)return 'All exercises completed! Start another level with practice beginner/intermediate/advanced.';const needed=lesson[1].split(';').map(x=>x.trim().split(/\s+/)[0]);const recent=history.slice(-8).join(' ').toLowerCase();const ok=needed.every(n=>recent.includes(n.toLowerCase()));if(!ok)return 'Not quite yet. Review the task and try again. Hint: '+lesson[2];lessonIndex++;if(lessonIndex>=lessons[activeLesson].length)return 'Excellent! '+activeLesson+' practice completed. Start another level whenever you are ready.';const next=lessons[activeLesson][lessonIndex];return 'Correct! Next exercise ('+(lessonIndex+1)+'/'+lessons[activeLesson].length+'): '+next[0]+'\nGoal: '+next[1]+'\nType hint for a clue.'}
function practiceHint(){if(!activeLesson)return 'Start with: practice beginner';const l=lessons[activeLesson][lessonIndex];return l?'Hint: '+l[2]:'No active exercise.'}
function extraCommand(cmd,args,raw){
const a=args,first=a[0],file=first?resolveFile(first):null;
if(cmd==='commands'||cmd==='compgen'||cmd==='get-help-list')return listCommands(a.join(' '));
if(cmd==='practice')return runPractice(a[0]);
if(cmd==='hint')return practiceHint();
if(cmd==='check')return checkPractice();
if(cmd==='man'||cmd==='help'&&a.length){const name=(cmd==='man'?a[0]:a[0]).toLowerCase();return commandDescriptions[name]||'No detailed manual for '+name+'. Use commands to browse the catalogue.'}
if(cmd==='pushd'){const next=norm(first||'');if(next&&!ensureFolder(next))throw Error('Directory not found.');dirStack.push(cwd);cwd=next;refreshPrompt();return displayPath(cwd)+'\n'+dirStack.map(displayPath).join(' ')}if(cmd==='popd'){if(!dirStack.length)throw Error('Directory stack is empty.');cwd=dirStack.pop();refreshPrompt();return displayPath(cwd)}if(cmd==='dirs')return [displayPath(cwd),...dirStack.slice().reverse().map(displayPath)].join(' ');
if(cmd==='tree'){const root=norm(first||'');if(root&&!ensureFolder(root))throw Error('Directory not found.');const rows=[];folders().filter(p=>!root||p===root||p.startsWith(root+'/')).forEach(p=>rows.push(p+'/'));files().filter(f=>!root||(f.path||'')===root||(f.path||'').startsWith(root+'/')).forEach(f=>rows.push((f.path?f.path+'/':'')+f.name));return rows.join('\n')||'(empty)'}
if(cmd==='rmdir'){const p=norm(first||'');if(!p||!folders().includes(p))throw Error('Directory not found.');if(folders().some(x=>x.startsWith(p+'/'))||files().some(x=>(x.path||'')===p))throw Error('Directory is not empty.');saveFolders(folders().filter(x=>x!==p));return 'Removed directory '+p}
if(cmd==='head'||cmd==='tail'||cmd==='nl'||cmd==='less'||cmd==='more'){if(!file&&stdinBuffer===null)throw Error('Usage: '+cmd+' <file>');let lines=String(file.file.content||'').split('\n');if(cmd==='head')lines=lines.slice(0,Number(a[1])||10);if(cmd==='tail')lines=lines.slice(-(Number(a[1])||10));if(cmd==='nl')lines=lines.map((x,i)=>(i+1)+'  '+x);return lines.join('\n')}
if(cmd==='wc'){if(!file&&stdinBuffer===null)throw Error('Usage: wc <file>');const t=String(file?file.file.content:stdinBuffer||'');return t.split('\n').length+' lines  '+(t.trim()?t.trim().split(/\s+/).length:0)+' words  '+t.length+' characters'}
if(cmd==='printf')return a.join(' ').replace(/\\n/g,'\n').replace(/%s/g,()=>a.shift()||'');
if(cmd==='seq'){let start=1,end=Number(a[0]),step=1;if(a.length>1){start=Number(a[0]);end=Number(a[1])}if(a.length>2)step=Number(a[2]);if(!Number.isFinite(end)||!step||Math.abs(end-start)>1000)throw Error('Usage: seq [start] end [step] (maximum 1001 values)');const out=[];for(let n=start;step>0?n<=end:n>=end;n+=step)out.push(n);return out.join('\n')}
if(cmd==='sort'||cmd==='uniq'||cmd==='tac'||cmd==='rev'){if(!file&&stdinBuffer===null)throw Error('Usage: '+cmd+' <file>');let lines=String(file?file.file.content:stdinBuffer||'').split('\n');if(cmd==='sort')lines.sort((x,y)=>x.localeCompare(y));if(cmd==='uniq')lines=lines.filter((x,i)=>i===0||x!==lines[i-1]);if(cmd==='tac')lines.reverse();if(cmd==='rev')lines=lines.map(x=>[...x].reverse().join(''));return lines.join('\n')}
if(cmd==='cut'||cmd==='tr'){if(!file&&stdinBuffer===null)throw Error('Usage: '+cmd+' <file>');const t=String(file?file.file.content:stdinBuffer||'');if(cmd==='tr')return t.split(a[0]||'').join(a[1]||'');return t.split('\n').map(x=>x.split(a[1]||',')[Math.max(0,(Number((a[0]||'-f1').replace(/^-f/,''))||1)-1)]||'').join('\n')}
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
if(cmd==='set'&&!args.length)return Object.entries(vars).map(([k,v])=>k+'='+v).join('\n');if(cmd==='export'||cmd==='set-variable'||cmd==='set'){const m=raw.match(/(?:export|set-variable|set)\s+([^=\s]+)\s*=\s*(.*)/i);if(m){vars[m[1]]=m[2].replace(/^['"]|['"]$/g,'');return ''}return 'Usage: export NAME=value'}
if(cmd==='unset'||cmd==='remove-variable'){delete vars[first];return ''}
if(cmd==='alias')return 'Aliases: ll=ls -la, la=ls -a, ..=cd ..'+(a.length?'\nAlias creation is not persisted.':'');
if(cmd==='type'||cmd==='which'||cmd==='get-command')return first?first+' is a WebOS virtual command':'Use type <command>.';
if(cmd==='clear'||cmd==='clear-host'||cmd==='cls')return {clear:true};
if(cmd==='chmod'||cmd==='chown'||cmd==='chgrp'||cmd==='umask')return 'Permissions are illustrative only in the virtual filesystem.';
if(cmd==='tar'||cmd==='gzip'||cmd==='gunzip'||cmd==='zip'||cmd==='unzip'||cmd==='compress-archive'||cmd==='expand-archive')return 'Archive operation simulated: use File Manager JSON export for a real backup of WebOS data.';
if(cmd==='curl'||cmd==='wget'||cmd==='invoke-webrequest'||cmd==='invoke-restmethod'||cmd==='ping'||cmd==='test-connection'||cmd==='ssh'||cmd==='scp')return 'Network access is intentionally disabled in the virtual shell.';
if(cmd==='git')return 'Git is not installed in this browser simulator. Use GitHub in the Web Browser app.';


// PowerShell cmdlet coverage: local file/text commands work against the WebOS virtual filesystem;
// OS, registry, account, service, network, security and disk cmdlets are safe simulations.
if(isPS){
 const psAliases={set:"set-variable",gsv:"get-variable",sv:"set-variable",rv:"remove-variable",gal:"get-alias",sal:"set-alias",gm:"get-member",measure:"measure-object",select:"select-object",where:"where-object","%":"foreach-object","?":"where-object",ls:"get-childitem",dir:"get-childitem",gci:"get-childitem",cd:"set-location",pwd:"get-location",cls:"clear-host",clear:"clear-host",cat:"get-content",type:"get-content",gc:"get-content",cp:"copy-item",copy:"copy-item",mv:"move-item",move:"move-item",rm:"remove-item",del:"remove-item",rmdir:"remove-item",echo:"write-output",write:"write-output",where:"where-object",select:"select-object",sort:"sort-object",foreach:"foreach-object","%":"foreach-object","?":"where-object",measure:"measure-object",diff:"compare-object",sleep:"start-sleep",ps:"get-process",kill:"stop-process",h:"get-history"};
 const psc=psAliases[cmd]||cmd;
 if(psc==="get-command")return listCommands(a.join(" "));
 if(psc==="get-help")return a.length?(commandDescriptions[(a[0]||"").toLowerCase()]||"Help for "+a[0]+": PowerShell command recognized. Use Get-Command to search the virtual command catalog."):"Use Get-Help <Command> or Get-Help <Command> -Full.";
 if(psc==="get-location")return displayPath(cwd);
 if(psc==="set-location"){const dest=norm(psValue("-Path",0)||"");if(dest&&!ensureFolder(dest))throw Error("Path not found: "+displayPath(dest));cwd=dest;refreshPrompt();return ""}
 if(psc==="clear-host")return {clear:true};
 if(psc==="get-history")return history.map((h,i)=>(i+1)+"  "+h).join("\n")||"No history.";
 if(psc==="clear-history"){history=[];historyIndex=0;return "Session history cleared."}
 if(psc==="invoke-history"){const n=Number(psValue("-Id",0))||history.length;const previous=history[n-1];return previous?executeSingle(previous):"History entry not found."}
 if(psc==="get-date")return new Date().toString();
 if(psc==="get-random"){const min=Number(psValue("-Minimum",0)),max=Number(psValue("-Maximum",1));return String(Number.isFinite(max)&&args.some(x=>x.toLowerCase()==="-maximum")?Math.floor(Math.random()*(max-min))+min:Math.floor(Math.random()*100)+1)}
 if(psc==="write-output"||psc==="write-host"||psc==="out-host")return a.filter(x=>!/^-(NoNewline|ForegroundColor|BackgroundColor)$/i.test(x)).join(" ");
 if(psc==="read-host")return "Interactive input is simulated. Assign a variable, for example: $name = 'Alex'.";
 if(psc==="get-variable")return Object.entries(vars).map(([k,v])=>"$"+k+" = "+v).join("\n")||"No variables defined.";
 if(psc==="set-variable"||psc==="new-variable"){const n=psValue("-Name",0),v=psValue("-Value",1);if(!n)throw Error("Usage: Set-Variable -Name <name> -Value <value>");vars[n]=v||"";return ""}
 if(psc==="remove-variable"){const n=psValue("-Name",0)||a[0];if(!n)throw Error("Usage: Remove-Variable <name>");delete vars[n.replace(/^\$/,"")];return ""}
 if(psc==="get-alias")return "Alias                 Definition\nls                    Get-ChildItem\ncd                    Set-Location\ncat                   Get-Content\n?                     Where-Object\n%                     ForEach-Object";
 if(psc==="set-alias")return "Alias creation is session-local and not persisted in this simulator.";
 if(psc==="get-childitem"||psc==="get-item"||psc==="get-content"||psc==="test-path"||psc==="resolve-path"||psc==="new-item"||psc==="remove-item"||psc==="copy-item"||psc==="move-item"||psc==="set-content"||psc==="add-content"||psc==="clear-content"||psc==="rename-item"){
  const path=psValue("-Path",0)||psValue("-LiteralPath",0)||psValue("-Name",0)||a.find(x=>!x.startsWith("-"))||"";
  if(psc==="get-childitem"){const p=path?norm(path):cwd;if(p&&!ensureFolder(p))throw Error("Cannot find path "+displayPath(p));const ds=folders().filter(f=>f.split("/").slice(0,-1).join("/")===p).map(f=>({Name:f.split("/").pop(),Mode:"d----",Length:""}));const fs=files().filter(f=>(f.path||"")===p).map(f=>({Name:f.name,Mode:"-a---",Length:String((f.content||"").length)}));const rows=ds.concat(fs);return rows.length?rows.map(x=>x.Mode.padEnd(7)+" "+x.Length.padStart(8)+" "+x.Name).join("\n"):"(empty directory)"}
  if(psc==="get-content"){const f=resolveFile(path);if(!f)throw Error("File not found: "+path);return String(f.file.content||"")}
  if(psc==="test-path")return String(!!resolveFile(path)||ensureFolder(norm(path)));
  if(psc==="resolve-path"){const p=norm(path);if(!resolveFile(path)&&!ensureFolder(p))throw Error("Path not found: "+path);return displayPath(p)}
  if(psc==="get-item"){const f=resolveFile(path);return f?JSON.stringify({Name:f.file.name,Length:String(f.file.content||"").length,FullName:displayPath(f.path?f.path+"/"+f.name:f.name)},null,2):ensureFolder(norm(path))?"Directory: "+displayPath(norm(path)):"Path not found"}
  if(psc==="new-item"){const type=psValue("-ItemType",0)||"File";if(type.toLowerCase()==="directory"||type.toLowerCase()==="container"){const p=norm(path);if(!p||folders().includes(p))throw Error("Invalid or existing directory");const parent=p.split("/").slice(0,-1).join("/");if(parent&&!ensureFolder(parent))throw Error("Parent directory not found");saveFolders(folders().concat(p));return "Directory created: "+displayPath(p)}return makeFile(path,"",false)}
  if(psc==="set-content"||psc==="add-content"){const val=psValue("-Value",1)??a.slice(1).join(" ");return makeFile(path,String(val),psc==="add-content")}
  if(psc==="clear-content")return makeFile(path,"",false);
  if(psc==="remove-item"){const recurse=a.some(x=>x.toLowerCase()==="-recurse");const p=norm(path);const f=resolveFile(path);if(f){const arr=files();arr.splice(f.index,1);saveFiles(arr);return "Removed virtual file "+path}if(ensureFolder(p)){const nested=files().filter(x=>(x.path||"")===p||(x.path||"").startsWith(p+"/"));const dirs=folders().filter(x=>x===p||x.startsWith(p+"/"));if(!recurse&&(nested.length||dirs.length>1))throw Error("Directory is not empty. Use -Recurse.");saveFolders(folders().filter(x=>!dirs.includes(x)));if(nested.length)saveFiles(files().filter(x=>!nested.includes(x)));return "Removed virtual directory "+path}throw Error("Path not found: "+path)}
  if(psc==="copy-item"||psc==="move-item"){const dest=psValue("-Destination",1)||a[a.indexOf(path)+1];const f=resolveFile(path);if(!f||!dest)throw Error("Usage: "+psc+" -Path <source> -Destination <target>");const d=splitTarget(dest);if(!ensureFolder(d.path))throw Error("Destination folder not found");const arr=files();if(psc==="copy-item")arr.push({...f.file,name:d.name||f.name,path:d.path});else arr[f.index]={...f.file,name:d.name||f.name,path:d.path};saveFiles(arr);return psc==="copy-item"?"Copied "+path:"Moved "+path}
  if(psc==="rename-item"){const newName=psValue("-NewName",1)||a[1];const f=resolveFile(path);if(!f||!newName)throw Error("Usage: Rename-Item <path> <new-name>");const arr=files();arr[f.index]={...f.file,name:newName};saveFiles(arr);return "Renamed to "+newName}
 }
 if(psc==="select-string"){const pattern=psValue("-Pattern",0)||a[0],path=psValue("-Path",1)||a[1],f=resolveFile(path);if(!f)throw Error("Usage: Select-String -Pattern <text> -Path <file>");return String(f.file.content||"").split("\n").map((line,i)=>({line,i})).filter(x=>x.line.includes(pattern)).map(x=>path+":"+(x.i+1)+":"+x.line).join("\n")||"No matches."}
 if(psc==="get-filehash"){const f=resolveFile(psValue("-Path",0)||a[0]);if(!f)throw Error("File not found");let h=2166136261;for(const c of String(f.file.content||"")){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return "Algorithm : "+(psValue("-Algorithm",0)||"SHA256")+"\nHash      : SIMULATED-"+(h>>>0).toString(16).padStart(8,"0")+"\nPath      : "+displayPath(f.path?f.path+"/"+f.name:f.name)}
 if(["if","elseif","else","switch","for","foreach","while","do","until","break","continue","return","function","param","begin","process","end","try","catch","finally","throw","trap","class","enum","using","workflow","filter"].includes(psc))return "PowerShell language keyword recognized: "+psc+". Script-block parsing and full PowerShell execution are not implemented; use this as a syntax reference, not as an executable host shell.";
 if(["get-psdrive","get-psprovider"].includes(psc))return "Name        Provider    Root\nC           FileSystem  C:\\Users\\LocalUser\nEnv         Environment WebOS virtual variables\nRegistry    Registry    Simulated (not accessible)";
 if(["get-timezone","get-culture","get-uptime","get-hotfix","get-installedmodule","get-module","get-executionpolicy","get-computerinfo","get-ciminstance","get-wmiobject","systeminfo","hostname"].includes(psc))return "Name                 Value\nComputer             WEBOS-PC\nEnvironment          Browser virtual machine\nOS                   WebOS simulation\nNote: sample data only; the host operating system is not queried.";
 if(psc==="get-member")return "TypeName: WebOS.VirtualObject\nMembers: Name, Path, Content, Length, UpdatedAt";
 if(["where-object","foreach-object","select-object","sort-object","group-object","measure-object","compare-object","format-table","format-list","format-wide","convertto-json","convertfrom-json","convertto-csv","convertfrom-csv","import-csv","export-csv","import-clixml","export-clixml","convertto-xml","tee-object"].includes(psc))return "PowerShell object/pipeline cmdlet recognized: "+psc+". Object pipeline transformation is partially simulated; use Select-String, file commands and command chaining for practical supported workflows.";
 if(["get-process","start-process","stop-process","wait-process","debug-process","get-job","start-job","stop-job","receive-job","remove-job","wait-job","suspend-job","resume-job"].includes(psc))return "Process/job cmdlet recognized: "+psc+". Sample WebOS processes only; host processes and background jobs cannot be controlled.";
 if(["get-service","start-service","stop-service","restart-service","suspend-service","resume-service","set-service","new-service"].includes(psc))return "Service cmdlet recognized: "+psc+". Host services are protected; no Windows/Linux services are modified.";
 if(["test-connection","test-netconnection","get-netipconfiguration","get-netipaddress","new-netipaddress","remove-netipaddress","get-netadapter","enable-netadapter","disable-netadapter","restart-netadapter","get-netroute","get-nettcpconnection","resolve-dnsname","clear-dnsclientcache","get-dnsclientserveraddress","set-dnsclientserveraddress","get-netfirewallprofile","get-netfirewallrule","new-netfirewallrule","set-netfirewallrule","remove-netfirewallrule","get-netneighbor","get-netconnectionprofile"].includes(psc))return "Networking cmdlet recognized: "+psc+". Live network configuration, DNS cache, firewall and adapter access are not exposed to browser apps.";
 if(["get-localuser","new-localuser","set-localuser","remove-localuser","get-localgroup","new-localgroup","add-localgroupmember","remove-localgroupmember","get-localgroupmember","get-credential","get-aduser","new-aduser","set-aduser","remove-aduser","get-adgroup"].includes(psc))return "Account cmdlet recognized: "+psc+". Local/Active Directory accounts and credentials cannot be accessed or changed by this virtual shell.";
 if(["get-mpcomputerstatus","get-mpthreat","get-mpthreatdetection","start-mpscan","update-mpsignature","get-executionpolicy","set-executionpolicy"].includes(psc))return "Security cmdlet recognized: "+psc+". Defender and execution-policy controls are simulated; host security settings are not changed.";
 if(["get-disk","get-physicaldisk","get-volume","get-partition","new-partition","remove-partition","resize-partition","format-volume","get-storagepool","get-storagereliabilitycounter","repair-volume","optimize-volume"].includes(psc))return "Storage cmdlet recognized: "+psc+". Only virtual WebOS files are accessible; physical disks and partitions cannot be changed.";
 if(["get-itemproperty","set-itemproperty","remove-itemproperty","new-itemproperty"].includes(psc))return "Provider/registry cmdlet recognized: "+psc+". Registry and host provider drives are not exposed.";
 if(["enter-pssession","exit-pssession","new-pssession","get-pssession","remove-pssession","invoke-command","enable-psremoting","disable-psremoting","get-wsmaninstance","test-wsman","new-pssessionoption"].includes(psc))return "Remoting cmdlet recognized: "+psc+". Remote PowerShell sessions and WSMan are unavailable in this browser simulator.";
 if(["invoke-webrequest","invoke-restmethod","start-bitstransfer"].includes(psc))return "Web cmdlet recognized: "+psc+". External requests and downloads are disabled in the offline-safe terminal.";
 if(["get-eventlog","get-winevent","new-eventlog","write-eventlog","clear-eventlog","limit-eventlog","get-counter","get-hotfix","get-computerinfo","get-ciminstance","get-wmiobject","get-timezone","get-culture","get-uptime","get-volume","get-physicaldisk","get-scheduledtask","register-scheduledtask","unregister-scheduledtask","start-scheduledtask","stop-scheduledtask","get-printer","get-printerport","get-printjob","restart-computer","stop-computer","rename-computer","add-computer","remove-computer","get-module","import-module","remove-module","find-module","install-module","update-module","uninstall-module","save-module","get-installedmodule","get-psrepository","register-psrepository","unregister-psrepository"].includes(psc))return "System cmdlet recognized: "+psc+". This category is shown for learning, but host OS, module repositories, event logs, printers and machine settings are not accessible.";
}
// Broad safe command coverage: virtual filesystem operations are real within WebOS;
// host administration, network, package and hardware operations return explicit simulations.
if(["locate","whereis"].includes(cmd)){
  const q=(first||"").toLowerCase();const hits=files().filter(f=>f.name.toLowerCase().includes(q)).map(f=>displayPath(f.path)+(f.path?"/":"")+f.name);
  return hits.length?hits.join("\n"):cmd+" : no matching virtual files or executable metadata.";
}
if(cmd==="strings"){if(!file)throw Error("Usage: strings <file>");return String(file.file.content||"").split(/[\r\n]+/).filter(Boolean).join("\n")}
if(cmd==="column"){return a.join(" ").split("\\t").join("  ")}
if(cmd==="fold"){const width=Number((a.find(x=>x.startsWith("-w"))||"").slice(2))||80;return a.slice(1).join(" ").replace(new RegExp("(.{"+width+"})","g"),"$1\n")}
if(cmd==="paste"||cmd==="join"){
 const x=resolveFile(a[0]||""),y=resolveFile(a[1]||"");
 if(!x||!y)throw Error("Usage: "+cmd+" <file1> <file2>");
 const left=String(x.file.content||"").split("\n"),right=String(y.file.content||"").split("\n");
 return left.map((v,i)=>cmd==="paste"?v+"\t"+(right[i]||""):[v,right[i]||""].join(" ")).join("\n");
}
if(cmd==="sed"){
 const target=a[a.length-1],x=resolveFile(target);if(!x)throw Error("Usage: sed 's/old/new/g' <file>");
 const expr=a.slice(0,-1).join(" ").match(/^s([/|#])(.+?)\1(.*?)\1([g]?)$/);
 if(!expr)throw Error("Supported sed form: sed 's/old/new/g' <file>");
 const content=String(x.file.content||"");
 return expr[4]==="g"?content.split(expr[2]).join(expr[3]):content.replace(expr[2],expr[3]);
}
if(cmd==="awk"){
 const target=a[a.length-1],x=resolveFile(target);if(!x)throw Error("Usage: awk '{print $1}' <file>");
 const field=Number((a.join(" ").match(/\$([1-9])/ )||[])[1]||1)-1,sep=(a.join(" ").match(/-F\s*([^\s]+)/)||[])[1]||"\\s+";
 return String(x.file.content||"").split("\n").map(line=>line.split(new RegExp(sep==="\\s+"?"\\s+":sep))[field]||"").join("\n");
}
if(cmd==="fgrep"||cmd==="egrep") {const x=resolveFile(a[a.length-1]||"");if(!x)throw Error("Usage: "+cmd+" <pattern> <file>");const pattern=a.slice(0,-1).join(" ");let re;try{re=new RegExp(pattern,cmd==="egrep"?"":"");}catch{re=null}return String(x.file.content||"").split("\n").filter(line=>re?re.test(line):line.includes(pattern)).join("\n")||"No matching lines."}
if(cmd==="cut"&&a[0]==="-c"){const x=resolveFile(a[a.length-1]||"");if(!x)throw Error("Usage: cut -cN <file>");const n=Number(a[1]||1)-1;return String(x.file.content||"").split("\n").map(line=>line[n]||"").join("\n")}
if(cmd==="ln"){const src=resolveFile(a[a.length-1]||"");if(!src)throw Error("Usage: ln <source> <link-name> (virtual text files only)");return "Symbolic/hard links are represented as references only; use cp to create an independent virtual copy."}
if(["getfacl","setfacl","chmod","chown","chgrp","umask"].includes(cmd))return "Permission metadata simulated for the WebOS virtual filesystem; host ownership and ACLs are never changed.";
if(["sudo","su"].includes(cmd))return "Privilege escalation is unavailable in WebOS. This virtual shell has no host administrator access.";
if(["killall","pkill","kill","bg","fg","jobs","nohup","nice","renice","wait","timeout"].includes(cmd))return "Job-control result simulated. Only virtual WebOS tasks exist; no host processes are affected.";
if(["ip","ifconfig","netstat","ss","traceroute","tracepath","nslookup","dig","host","whois","nc","nmap","tcpdump","ping","curl","wget","ssh","scp","sftp"].includes(cmd))return "Network command recognized. Live network access and packet capture are disabled in this offline-safe virtual shell.";
if(["df","du","free","lsblk","blkid","mount","umount","fdisk","parted","mkfs","fsck","dd","sync"].includes(cmd))return "Storage command recognized. Virtual disk only: "+files().length+" files, "+folders().length+" folders. Physical disks, partitions and filesystems are inaccessible.";
if(["gzip","gunzip","bzip2","bunzip2","xz","unxz","zcat","7z","zip","unzip","tar","compress-archive","expand-archive"].includes(cmd))return "Archive command recognized. Archive creation/extraction is simulated; use File Manager export to create a real WebOS JSON backup.";
if(["useradd","adduser","usermod","userdel","passwd","groupadd","groupdel","groupmod"].includes(cmd))return "User/group management command recognized. WebOS uses one local virtual identity; system accounts and passwords cannot be changed.";
if(["groups","who","w","last","lastlog"].includes(cmd))return cmd==="groups"?"user":cmd==="who"||cmd==="w"?"user  browser-session  WebOS virtual desktop":"No additional virtual login records.";
if(["apt","apt-get","apt-cache","dpkg","yum","dnf","rpm","pacman","zypper","snap","flatpak"].includes(cmd))return "Package-manager command recognized ("+cmd+"). Installing or changing host software is disabled; this browser app has no operating-system package database.";
if(["systemctl","service","journalctl","dmesg","vmstat","iostat","lscpu","lsusb","lspci","reboot","shutdown","poweroff","timedatectl","crontab","at"].includes(cmd))return "System administration command recognized ("+cmd+"). Displaying sample virtual-system information only; host services, hardware, clock, scheduler and power state are protected.";
if(["apt","apt-get","apt-cache","dpkg","yum","dnf","rpm","pacman","zypper","snap","flatpak"].includes(cmd))return "Package operations are simulated; no software is installed.";
if(["env","printenv"].includes(cmd))return Object.entries({...vars,HOME:configs[shell].home,USER:"user",SHELL:shell,PATH:"/usr/local/bin:/usr/bin:/bin",WEBOS:"1"}).map(([k,v])=>k+"="+v).join("\n");
if(["declare","local","readonly","let"].includes(cmd)){
 const m=raw.match(/(?:declare|local|readonly|let)\s+([A-Za-z_][\w]*)\s*(?:=|\s)\s*(.*)/);
 if(!m)return Object.entries(vars).map(([k,v])=>k+"="+v).join("\n")||"No shell variables set.";
 vars[m[1]]=String(m[2]||"").replace(/^['"]|['"]$/g,"");return "";
}
if(cmd==="read")return "Interactive stdin is not available in this simulator. Assign a practice value with NAME=value or use PowerShell Read-Host (simulated).";
if(cmd==="shift"||cmd==="break"||cmd==="continue"||cmd==="return"||cmd==="eval"||cmd==="exec"||cmd==="source"||cmd==="builtin"||cmd==="trap"||cmd==="shopt"||cmd==="setopt"||cmd==="unsetopt"||cmd==="zmodload"||cmd==="autoload"||cmd==="bindkey"||cmd==="compinit"||cmd==="rehash"||cmd==="functions"||cmd==="fc"||cmd==="select"||cmd==="until")return "Shell builtin/syntax recognized ("+cmd+"). Script execution, signal hooks and interactive completion are represented as safe practice output; no host shell is invoked.";
if(cmd==="true")return "";
if(cmd==="false")throw Error("Command returned status 1 (simulated).");
if(cmd==="expr"){const expression=a.join(" ");if(/^[\d\s+*/%()-]+$/.test(expression)){try{return String(Function('"use strict";return ('+expression+')')())}catch{}}return expression;}
if(cmd==="sleep"||cmd==="start-sleep")return "Sleep command accepted (non-blocking simulation).";
if(cmd==="time")return "real  0m0.001s\nuser  0m0.001s\nsys   0m0.000s (simulated)";
if(cmd==="cal")return new Date().toLocaleDateString(undefined,{month:"long",year:"numeric"});
if(cmd==="uptime")return "up "+Math.max(1,Math.round(performance.now()/60000))+" minutes, 1 user, WebOS virtual session";
if(cmd==="hostname")return "WEBOS-PC";
if(cmd==="uname")return "WebOS Virtual PC 1.0 browser environment";
if(cmd==="id")return "uid=1000(user) gid=1000(user) groups=1000(user) [simulated]";
if(cmd==="get-date"||cmd==="date")return new Date().toString();
if(cmd==="clear"||cmd==="clear-host"||cmd==="cls")return {clear:true};
if(cmd==="type"||cmd==="which"||cmd==="get-command")return first?first+" is available as a WebOS virtual command":"Use "+cmd+" <command>.";
if(cmd==="alias"||cmd==="unalias"||cmd==="set-alias"||cmd==="get-alias")return "Shell aliases are session-local. Common aliases: ll=ls -la, la=ls -a, cls=clear.";
if(cmd==="command"||cmd==="help"||cmd==="man")return first?(commandDescriptions[first.toLowerCase()]||"Manual entry for "+first+": behavior is simulated in WebOS."):"Type commands to browse the shell command reference.";
if(cmd==="get-variable"||cmd==="get-variable"||cmd==="get-childitem"&&first==="Env:")return Object.entries(vars).map(([k,v])=>k+"="+v).join("\n")||"No user variables.";
if(cmd==="get-process"||cmd==="get-service"||cmd==="get-computerinfo"||cmd==="get-ciminstance"||cmd==="get-uptime"||cmd==="get-random"||cmd==="get-eventlog"||cmd==="get-winevent"||cmd==="get-scheduledtask"||cmd==="get-netipaddress"||cmd==="get-netipconfiguration"||cmd==="get-module"||cmd==="get-executionpolicy")return "Name                 Status\nWebOS Desktop        Running\nWebOS Terminal       Running\nWebOS Browser        Running\n[Virtual sample data; host system is not queried.]";
if(cmd==="get-filehash"||cmd==="sha256sum"){if(!file)throw Error("Usage: "+cmd+" <file>");let h=2166136261;for(const ch of String(file.file.content||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return "SIMULATED-"+(h>>>0).toString(16).padStart(8,"0")+"  "+file.file.name;}
if(cmd==="get-acl"||cmd==="set-acl"||cmd==="get-authenticodesignature")return "Virtual file metadata only; operating-system ACLs and signatures are not available.";
if(cmd==="convertto-json"){return JSON.stringify({name:first||"WebOS",path:cwd,files:files().length},null,2)}
if(cmd==="convertfrom-json"){try{return JSON.stringify(JSON.parse(a.join(" ")),null,2)}catch{return "Provide valid JSON text to convert."}}
if(cmd==="get-help"||cmd==="get-history"||cmd==="clear-history"||cmd==="invoke-history")return cmd==="clear-history"?"History cleared for this shell session.":history.join("\n")||"No history.";
if(cmd==="write-output"||cmd==="write-host"||cmd==="echo"||cmd==="print")return a.join(" ");
if(cmd==="read-host")return "Interactive prompt simulated; use a variable assignment for repeatable practice.";
if(cmd==="get-member")return "TypeName: WebOS.VirtualObject\nMembers: Name, Path, Content, Length, UpdatedAt";
if(cmd==="get-random")return String(Math.floor(Math.random()*100)+1);
if(cmd==="resolve-dnsname"||cmd==="test-netconnection"||cmd==="test-connection")return "Connectivity test simulated; external network access is disabled.";
if(cmd==="get-itemproperty"||cmd==="set-itemproperty"||cmd==="remove-itemproperty"||cmd==="get-scheduledtask"||cmd==="register-scheduledtask"||cmd==="start-service"||cmd==="stop-service"||cmd==="restart-service"||cmd==="get-eventlog"||cmd==="get-winevent")return "PowerShell system cmdlet recognized. Changes to host registry, services, event logs and scheduled tasks are blocked.";
if(cmd==="get-command"||cmd==="get-help")return "PowerShell help is virtual. Use commands or Get-Help <cmdlet>.";
if(['python','node','npm','make','xargs','awk','sed','paste','expr','sleep','start-process','get-service','stop-process','get-computerinfo','get-ciminstance','get-member','get-random','get-date','get-process','get-childitem','get-location','set-location','new-item','get-content','set-content','add-content','remove-item','copy-item','move-item','rename-item','get-item','clear-content','test-path','resolve-path','join-path','split-path','where-object','foreach-object','select-object','sort-object','group-object','measure-object','compare-object','format-table','format-list','out-file','tee-object','convertto-json','convertfrom-json','export-csv','import-csv','select-string','get-variable','new-variable','get-alias','set-alias','get-help','invoke-history','clear-history','write-error','read-host','get-uptime','resolve-dnsname','test-netconnection','compress-archive','expand-archive','get-filehash','get-acl','set-acl','get-authenticodesignature','autoload','bindkey','compinit','functions','fc','setopt','unsetopt','zmodload','rehash','pushd','popd','dirs','ln','locate','whereis','egrep','comm','sha256sum'].includes(cmd))return 'This command is listed for learning, but its full OS behavior is not available in the safe browser simulator. Use help and practice for supported hands-on commands.';
return null;
}
function renderShell(win){if(win.dataset.shellLab==='1')return;win.dataset.shellLab='1';const body=win.querySelector('.window-body');if(!body)return;
body.innerHTML='<div class="shell-lab"><div class="shell-toolbar"><div class="shell-tabs" role="tablist" aria-label="Choose command shell">'+shells.map(s=>'<button role="tab" data-shell="'+s+'" aria-selected="'+(s===shell)+'">'+configs[s].label+'</button>').join('')+'</div><span class="shell-state">WEBOS VIRTUAL ENVIRONMENT</span><button class="action" data-shell-clear>Clear</button></div><div class="shell-subtitle">Independent command-line environments · Shared virtual PC files</div><div class="shell-screen" id="shell-screen"><div class="shell-banner">WebOS Terminal · Select Bash, Zsh or PowerShell. Type <b>help</b> to see commands.</div><div id="shell-output" aria-live="polite"></div><div class="shell-input-row"><span id="shell-prompt">$ </span><input id="shell-command" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Shell command" placeholder="Type a command…"></div></div><div class="shell-footer"><span>Local virtual disk</span><span>Host OS access: disabled</span></div></div>';
const input=$('#shell-command');function choose(s){shell=s;cwd='';history=[];historyIndex=0;vars={};dirStack=[];win.querySelectorAll('[data-shell]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.shell===shell)));$('#shell-output').innerHTML='';output(configs[shell].label+' shell started. Type help.');refreshPrompt();input.focus()}
win.querySelectorAll('[data-shell]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.shell)));
win.querySelector('[data-shell-clear]').onclick=()=>$('#shell-output').innerHTML='';
function submit(){const raw=input.value;input.value='';if(!raw.trim())return;history.push(raw);historyIndex=history.length;output(shellPrompt()+raw);try{const result=execute(raw);if(result&&result.clear)$('#shell-output').innerHTML='';else if(result)output(result)}catch(e){output((shell==='powershell'?'': 'webos: ')+e.message)}refreshPrompt();$('#shell-screen').scrollTop=$('#shell-screen').scrollHeight}
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}else if(e.key==='ArrowUp'){e.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||''}else if(e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||''}else if(e.key==='Tab'){e.preventDefault();const partial=input.value.trim().split(/\s+/).pop().toLowerCase();const matches=files().map(f=>f.name).concat(folders().map(f=>f.split('/').pop())).filter(n=>n.toLowerCase().startsWith(partial));if(matches.length===1)input.value=input.value.slice(0,input.value.length-partial.length)+matches[0]}});
input.focus();output('Virtual shell ready. Use help for supported commands.');}
function init(){document.addEventListener('webos-app-opened',event=>{if(event.detail&&event.detail.id==='terminal')renderShell(event.detail.window)});const host=$('#desktop');if(!host)return;const observer=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType!==1)return;const win=n.matches('.window[data-app="terminal"]')?n:n.querySelector?.('.window[data-app="terminal"]');if(win)renderShell(win)})));observer.observe(host,{childList:true,subtree:true});const existing=host.querySelector('.window[data-app="terminal"]');if(existing)renderShell(existing)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();