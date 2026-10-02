/**
 * Inline boot script. Keep the hash parsing in sync with
 * `readClaimTokenFromHash` and `hashWithoutClaimToken` in `installClaim.ts`.
 *
 * Stashes a valid token only when the query already says `claim=pending`,
 * then removes `claim_token` from the fragment. The token is never written
 * into the query and this script does not log it.
 */
export const SHOPIFY_CLAIM_FRAGMENT_BOOT = `(function(){try{var hash=window.location.hash||'';var search=window.location.search||'';if(hash.indexOf('claim_token=')===-1&&search.indexOf('claim_token=')===-1)return;var raw=hash.charAt(0)==='#'?hash.slice(1):hash;var params=new URLSearchParams(raw);var token=params.get('claim_token')||'';params.delete('claim_token');var query=new URLSearchParams(search);query.delete('claim_token');var pending=/(?:^|[?&])claim=pending(?:&|$)/.test(search);if(/^[a-f0-9]{64}$/.test(token)&&pending){window.__cartaisyShopifyClaim=token;}var rest=params.toString();var nextQuery=query.toString();var next=window.location.pathname+(nextQuery?'?'+nextQuery:'')+(rest?'#'+rest:'');window.history.replaceState(window.history.state,'',next);}catch(e){}})();`;
