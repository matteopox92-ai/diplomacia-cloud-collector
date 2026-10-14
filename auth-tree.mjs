export function summarizeGoogleAuthTree(tree){
 const configs=[],googleLoginArgs=[],storedTokenLabels=[];
 const name=n=>n?.type==='Identifier'?n.name:n?.type==='Literal'&&typeof n.value==='string'?n.value:null;
 const unwrap=n=>n?.type==='SequenceExpression'?unwrap(n.expressions.at(-1)):n;
 const method=n=>{n=unwrap(n);return n?.type==='MemberExpression'?name(n.property):name(n);};
 const allowedModes=new Set(['code','token','id_token','offline','online','consent','select_account','none']);
 const shape=n=>{
   if(n?.type==='Literal')return allowedModes.has(n.value)?n.value:typeof n.value==='boolean'?n.value:'literal-value-omitted';
   if(n?.type==='MemberExpression')return ['access_token','id_token','accessToken','idToken','refreshToken','refresh_token','params','authentication','code','token'].includes(method(n))?method(n):'property-value-omitted';
   return n?.type||'missing';
 };
 const visit=n=>{
   if(!n||typeof n!=='object')return;
   if(n.type==='CallExpression'){
     const m=method(n.callee);
     if(['useAuthRequest','useIdTokenAuthRequest'].includes(m)){
       const obj=n.arguments.find(a=>a?.type==='ObjectExpression');
       if(obj){const out={hook:m};for(const p of obj.properties){
          const k=name(p.key);if(['responseType','usePKCE','prompt'].includes(k))out[k]=shape(p.value);
          if(k==='clientSecret')out.hasClientSecret=true;
          if(k==='extraParams'&&p.value?.type==='ObjectExpression')for(const q of p.value.properties){const key=name(q.key);if(['access_type','prompt'].includes(key))out[key]=shape(q.value);}
       }configs.push(out);}
     }
     if(m==='googleLogin')googleLoginArgs.push(n.arguments.map(shape));
     if(m==='setItem'&&n.arguments[0]?.type==='Literal'&&['token','access_token','refresh_token','refreshToken','accessToken','authToken'].includes(n.arguments[0].value))storedTokenLabels.push(n.arguments[0].value);
   }
   for(const [k,v] of Object.entries(n)){if(k==='start'||k==='end')continue;if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
 };
 visit(tree);
 return {configs,googleLoginArgs,storedTokenLabels:[...new Set(storedTokenLabels)].sort()};
}
