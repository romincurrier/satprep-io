import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const index=read('index.html');
const legacy=read('email-check.js');
const lock=read('migrations/20260825_disable_email_enumeration.sql');

assert.doesNotMatch(index,/email-check\.js/,'Public application shell must not load the legacy email-registration preflight.');
assert.match(legacy,/email_registered/,'Legacy file is retained only as historical source and must remain visibly tied to the account lookup it implemented.');
assert.match(lock,/revoke all on function public\.email_registered\(text\) from public, anon, authenticated/i,'Account lookup RPC must not be executable by browser roles.');
assert.match(lock,/grant execute on function public\.email_registered\(text\) to service_role/i,'Account lookup RPC may remain available only to trusted service code.');

console.log('Account-enumeration guard passed: the public client does not query email membership and the legacy RPC is service-role-only.');
