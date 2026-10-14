export function publicAuthSignals(code){
  // Only boolean indicators from public application code. Never export snippets,
  // API responses, client configuration values, keys or account information.
  return {
    firebaseAuth:/securetoken\.googleapis\.com|firebase[\/-]auth|@firebase\/auth|signInWithCredential/.test(code),
    googleOAuth:/accounts\.google\.com|GoogleSignin|GoogleAuthProvider/.test(code),
    refreshFlow:/refresh_token|refreshToken|\/auth\/refresh|\/token\/refresh/.test(code),
    supabaseAuth:/supabase\.co\/auth|@supabase\/auth/.test(code)
  };
}
export function safeDiagnostic(result){
  const status=Number.isInteger(result.apiStatus)?result.apiStatus:null;
  return {browserReachedGame:result.browserReachedGame===true,apiStatus:status,
    requiresLogin:result.requiresLogin===true,authSignals:publicAuthSignals(result.publicCode||'')};
}

export function publicAuthProtocol(code){
 const literals=[...code.matchAll(/["'`]([^"'`\s]{1,180})["'`]/g)].map(m=>m[1]);
 const authPaths=[...new Set(literals.filter(v=>/^\/(?:api\/)?auth\/[a-zA-Z0-9/_-]+$/.test(v)))].sort();
 const known=['accessToken','refreshToken','idToken','token','expiresIn','refresh_token','access_token'];
 const storageLabels=[...new Set(literals.filter(v=>known.includes(v)))].sort();
 const requestShapeHints={};
 for(const path of authPaths){
   const at=code.indexOf(path),window=code.slice(Math.max(0,at-180),at+1100);
   const keys=[...window.matchAll(/(?:[,{]\s*)([A-Za-z_$][\w$]*)\s*:/g)].map(m=>m[1]);
   requestShapeHints[path]=[...new Set(keys)].filter(k=>k.length<45).slice(0,30).sort();
 }
 const tokenStatusNames=[...new Set(literals.filter(v=>/^(?:TOKEN|AUTH)_[A-Z_]{2,40}$/.test(v)))].sort();
 const googleFlowSignals={
   identityServices:code.includes('accounts.google.com/gsi/client'),
   oneTapInitialize:code.includes('accounts.id.initialize'),
   browserTokenClient:code.includes('initTokenClient'),
   browserCodeClient:code.includes('initCodeClient'),
   offlineAccessConfigured:/access_type\s*:\s*["']offline["']/.test(code),
   expoAuthSession:code.includes('expo-auth-session'),
   nativeGoogleSignIn:code.includes('GoogleSignin'),
   googleRefreshEndpoint:code.includes('oauth2.googleapis.com/token')
 };
 return {authPaths,storageLabels,requestShapeHints,tokenStatusNames,googleFlowSignals};
}
