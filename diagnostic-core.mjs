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
