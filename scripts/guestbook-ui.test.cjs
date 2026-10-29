const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
test('replies stay under their parent, show three initially, expand and collapse independently',async()=>{
 const states=[],refs=[],effects=[];let index=0,refIndex=0,first=true;
 const message=(id,replies=[])=>({id,name:id,message:id,created_at:'2026-10-29T01:00:00Z',region:'',replies});
 const messages=[message('root-a',Array.from({length:5},(_,i)=>message('a-'+i))),message('root-b',[message('b-0'),message('b-1')])];
 const sandbox={exports:{},process:{env:{NEXT_PUBLIC_GUESTBOOK_API:'https://example.test'}},AbortController,
 window:{setTimeout:()=>1,clearTimeout:()=>{},location:{hash:''}},localStorage:{getItem:()=>null},
 fetch:async()=>({ok:true,json:async()=>({messages,next_cursor:null})}),
 require(name){
  if(name==='react')return {useState(initial){const i=index++;if(!(i in states))states[i]=initial;return[states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useEffect(fn){if(first)effects.push(fn);},useSyncExternalStore:(_a,_b,ssr)=>ssr()};
  if(name==='@/lib/stores/localeStore')return{useLocaleStore:fn=>fn({locale:'zh'})};
  if(name==='@/lib/guestbookTime')return{formatGuestbookTime:()=> '2026-10-29 09:00'};
  return require(name);
 }};
 const js=ts.transpileModule(fs.readFileSync('src/components/home/Guestbook.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,sandbox);
 function render(){index=refIndex=0;const tree=sandbox.exports.default();first=false;return tree;}
 function nodes(tree){if(!tree||typeof tree!=='object')return[];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
 render();effects.forEach(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 let tree=render();const root=id=>nodes(tree).find(n=>n.props?.id==='message-'+id);
 const replies=id=>nodes(root(id)).filter(n=>n.type==='article').length-1;
 const toggle=id=>nodes(root(id)).find(n=>n.type==='button'&&'aria-expanded' in n.props);
 assert.equal(replies('root-a'),3);assert.equal(replies('root-b'),2);
 toggle('root-a').props.onClick();tree=render();assert.equal(replies('root-a'),5);assert.equal(toggle('root-a').props['aria-expanded'],true);
 toggle('root-a').props.onClick();tree=render();assert.equal(replies('root-a'),3);assert.equal(replies('root-b'),2);
 assert.equal(nodes(tree).filter(n=>n.type==='a'&&String(n.props.children).includes('复制链接')).length,0);
});
