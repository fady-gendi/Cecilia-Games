/* Old-iPad compatibility check (run: node tests/old-ipad-check.cjs)
 * 1. Every inline script and shared/*.js must parse as ES5 (iOS 9 Safari cannot run let/const/=>/async/`...`).
 * 2. New pages may only use emoji from Unicode 6.0, which a 2012-2013 iPad can draw.
 *    (Older games are reported as warnings only.)
 */
const fs=require('fs'),path=require('path'),acorn=require('acorn');
const ROOT=path.join(__dirname,'..');let failed=0;
const pages=fs.readdirSync(ROOT).filter(d=>fs.existsSync(path.join(ROOT,d,'index.html'))).map(d=>d+'/index.html').concat(['index.html']);
const STRICT_EMOJI=['index.html','rainbow-kingdom/index.html','account/index.html','parent/index.html','_template/index.html'];
// Unicode 6.0 emoji blocks above U+1F300 (everything else there is newer)
const OK=[[0x1F300,0x1F320],[0x1F330,0x1F335],[0x1F337,0x1F37C],[0x1F380,0x1F393],[0x1F3A0,0x1F3C4],[0x1F3C6,0x1F3CA],[0x1F3E0,0x1F3F0],[0x1F400,0x1F43E],[0x1F440,0x1F440],
 [0x1F442,0x1F4F7],[0x1F4F9,0x1F4FC],[0x1F500,0x1F53D],[0x1F550,0x1F567],[0x1F5FB,0x1F640],[0x1F645,0x1F64F],[0x1F680,0x1F6C5],[0x1F1E6,0x1F1FF],[0x1F004,0x1F004],[0x1F0CF,0x1F0CF],[0x1F170,0x1F251]];
function newEmoji(text){const bad=new Set();for(const ch of text){const c=ch.codePointAt(0);if(c>=0x1F000&&!OK.some(r=>c>=r[0]&&c<=r[1]))bad.add(ch)}return [...bad]}
function es5(code,where){try{acorn.parse(code,{ecmaVersion:5})}catch(e){failed++;console.log('FAIL not ES5:',where,'line',e.loc&&e.loc.line,e.message)}}
for(const p of pages){
 const html=fs.readFileSync(path.join(ROOT,p),'utf8');const re=/<script([^>]*)>([\s\S]*?)<\/script>/g;let m,n=0;
 while((m=re.exec(html))){n++;if(!/src=/.test(m[1]))es5(m[2],p+' script #'+n)}
 const bad=newEmoji(html);
 if(bad.length){if(STRICT_EMOJI.includes(p)){failed++;console.log('FAIL emoji too new for old iPads in',p,bad.join(' '))}else console.log('warn  newer emoji in',p,'(shows as a box on old iPads):',bad.join(' '))}
}
for(const f of fs.readdirSync(path.join(ROOT,'shared')).filter(f=>f.endsWith('.js')&&f!=='trophy-photos.js'))es5(fs.readFileSync(path.join(ROOT,'shared',f),'utf8'),'shared/'+f);
if(failed){console.log(failed+' problem(s)');process.exitCode=1}else console.log('PASS all pages are ES5 and new pages use old-iPad emoji only');
