const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
test('client navigation queues visits until ready, deduplicates repeated effects, and ignores anchors',()=>{
 let path='/',script;const counts=[],effects=[];
 const window={};const document={title:'Home',querySelector:()=>script,createElement:()=>({dataset:{},remove(){script=undefined;}}),body:{appendChild:s=>{script=s;}}};
 const sandbox={exports:{},process:{env:{NEXT_PUBLIC_GOATCOUNTER_CODE:'test'}},window,document,navigator:{doNotTrack:'1'},require(name){if(name==='react')return{useEffect:fn=>effects.push(fn)};if(name==='next/navigation')return{usePathname:()=>path};throw Error(name);}};
 const js=ts.transpileModule(fs.readFileSync('src/components/analytics/PrivateAnalytics.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,sandbox);
 function render(p){path=p;sandbox.exports.default();effects.splice(0).forEach(f=>f());}
 render('/');render('/');assert.equal(window.goatcounter.no_onload,true);
 render('/cosmology/');window.goatcounter.count=entry=>counts.push(entry.path);script.onload();
 render('/cosmology/'); // A hash change leaves usePathname unchanged.
 render('/finance/');render('/cosmology/');
 assert.deepEqual(counts,['/','/cosmology/','/finance/','/cosmology/']);
});
