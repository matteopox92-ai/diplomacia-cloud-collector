import test from 'node:test';
import assert from 'node:assert/strict';
import {publicAuthSignals,safeDiagnostic} from '../diagnostic-core.mjs';
test('public output contains no arbitrary response data or credentials',()=>{
 const result=safeDiagnostic({browserReachedGame:true,apiStatus:401,requiresLogin:true,publicCode:'refreshToken="EXAMPLE_PRIVATE"; accounts.google.com',province:'REAL_DATA',authorization:'PRIVATE'});
 assert(!JSON.stringify(result).includes('EXAMPLE_PRIVATE'));assert(!JSON.stringify(result).includes('REAL_DATA'));assert.equal(result.authSignals.refreshFlow,true);assert.equal(result.authSignals.googleOAuth,true);
});
test('empty source is not evidence of an auth provider',()=>assert.deepEqual(publicAuthSignals(''),{firebaseAuth:false,googleOAuth:false,refreshFlow:false,supabaseAuth:false}));
test('diagnostics normalize unexpected values',()=>{
 const result=safeDiagnostic({apiStatus:'Bearer PRIVATE',browserReachedGame:'yes',requiresLogin:'yes'});assert.equal(result.apiStatus,null);assert.equal(result.browserReachedGame,false);assert.equal(result.requiresLogin,false);
});
