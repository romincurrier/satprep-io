// Shared commercial content-depth policy for runtime and release validation.
// These are engineering release thresholds, not psychometric-equivalence claims.

export const COMMERCIAL_CONTENT_POLICY=Object.freeze({
 diagnostic:Object.freeze({
  minApprovedPerSkill:6,
  minByDifficulty:Object.freeze({1:1,2:1,3:1})
 }),
 practice:Object.freeze({
  minApprovedPerSkill:8,
  sessionLength:5,
  minByDifficulty:Object.freeze({1:2,2:3,3:2})
 })
});

export function evaluateSkillCoverage(items,kind){
 const policy=COMMERCIAL_CONTENT_POLICY[kind];
 if(!policy)throw new Error(`Unknown commercial content kind: ${kind}`);
 const source=Array.isArray(items)?items:[],byDifficulty={1:0,2:0,3:0};
 for(const item of source){const d=Number(item?.difficulty);if(d===1||d===2||d===3)byDifficulty[d]++}
 const shortfalls=[];
 if(source.length<policy.minApprovedPerSkill)shortfalls.push(`depth ${source.length}/${policy.minApprovedPerSkill}`);
 for(const d of [1,2,3]){const required=Number(policy.minByDifficulty[d]||0);if(byDifficulty[d]<required)shortfalls.push(`difficulty ${d} ${byDifficulty[d]}/${required}`)}
 return{ready:shortfalls.length===0,depth:source.length,byDifficulty,shortfalls};
}
