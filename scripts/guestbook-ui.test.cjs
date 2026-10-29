const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
test('replies start hidden, expand five at a time, reply targets focus the form, successful posts appear immediately',async()=>{
 const states=[],refs=[],effects=[];let index=0,refIndex=0,first=true,focused=0,scrolled=0,savedDraft=null,posted;
 const message=id=>({id,name:id,message:id,created_at:'2026-10-29T01:00:00Z',region:'',replies:[],reply_count:0});
 const rootId='11111111-1111-4111-8111-111111111111';
 const replies=Array.from({length:12},(_,i)=>message(`22222222-2222-4222-8222-${String(i).padStart(12,'0')}`));
 const messages=[{...message(rootId),reply_count:12}];
 const sandbox={exports:{},process:{env:{NEXT_PUBLIC_GUESTBOOK_API:'https://example.test'}},AbortController,
 window:{setTimeout:()=>1,clearTimeout:()=>{},location:{hash:''}},document:{getElementById:()=>({focus:()=>focused++})},localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>savedDraft,setItem:(_k,v)=>{savedDraft=v;},removeItem:()=>{savedDraft=null;}},
 fetch:async(url,init)=>{let data;if(init.method==='POST'){posted=JSON.parse(init.body);data={status:'approved',id:'new-id',root_id:posted.parent_id?rootId:null,message:message('new-id')};}else {const u=new URL(url);const after=Number(u.searchParams.get('after')||0);data=u.searchParams.has('parent_id')?{messages:replies.slice(after,after+5),next_cursor:after+5<12?String(after+5):null}:{messages,next_cursor:null};}return{ok:true,json:async()=>data};},
 require(name){
  if(name==='react')return {useState(initial){const i=index++;if(!(i in states))states[i]=initial;return[states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},useEffect(fn){if(first)effects.push(fn);},useSyncExternalStore:(_a,snapshot)=>snapshot()};
  if(name==='@/lib/stores/localeStore')return{useLocaleStore:fn=>fn({locale:'zh'})};
  if(name==='@/lib/guestbookTime')return{formatGuestbookTime:()=> '2026-10-29 09:00'};
  return require(name);
 }};
 const transpiled=ts.transpileModule(fs.readFileSync('src/components/home/Guestbook.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
 assert.equal(transpiled.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);const js=transpiled.outputText;
 vm.runInNewContext(js,sandbox);
 function render(){index=refIndex=0;const tree=sandbox.exports.default();first=false;return tree;}
 function nodes(tree){if(!tree||typeof tree!=='object')return[];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
 function text(node){if(node===null||node===undefined||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);}
 render();effects.forEach(fn=>fn());await new Promise(resolve=>setImmediate(resolve));
 let tree=render();const root=()=>nodes(tree).find(n=>n.props?.id==='message-'+rootId);
 const count=()=>nodes(root()).filter(n=>n.type==='article').length-1;
 const button=label=>nodes(root()).find(n=>n.type==='button'&&text(n)===label);
 assert.equal(count(),0);assert.ok(button('回复 · 12'));
 await button('展开回复').props.onClick();tree=render();assert.equal(count(),5);
 await button('再展开 5 条回复').props.onClick();tree=render();assert.equal(count(),10);
 await button('再展开 5 条回复').props.onClick();tree=render();assert.equal(count(),12);assert.equal(button('再展开 5 条回复'),undefined);
 button('收起回复').props.onClick();tree=render();assert.equal(count(),0);
 await button('展开回复').props.onClick();tree=render();assert.equal(count(),5);
 const form=nodes(tree).find(n=>n.type==='form');form.props.ref.current={scrollIntoView:()=>scrolled++};
 nodes(root()).find(n=>n.type==='button'&&text(n)==='回复').props.onClick();tree=render();assert.equal(focused,1);assert.equal(scrolled,1);assert.ok(JSON.parse(savedDraft).parent.id.startsWith('22222222'));
 nodes(tree).find(n=>n.type==='textarea').props.onChange({target:{value:'reply text'}});tree=render();
 await nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=render();
 assert.equal(posted.message,'reply text');assert.ok(posted.parent_id.startsWith('22222222'));assert.equal(savedDraft,null);
 assert.ok(text(tree).includes('留言成功！谢谢你的留言！'));assert.ok(button('回复 · 13'));assert.ok(nodes(root()).some(n=>n.props?.id==='message-new-id'));
 nodes(tree).find(n=>n.type==='textarea').props.onChange({target:{value:'new root'}});tree=render();
 await nodes(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=render();assert.equal(posted.parent_id,undefined);assert.equal(nodes(tree).filter(n=>n.type==='article').length,7);
});
