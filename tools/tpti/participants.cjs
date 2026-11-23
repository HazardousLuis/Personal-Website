const MAX_MATCH_PROFILES = 300;
const PUBLIC_KEY = 'tpti:public-profiles:v1';
const INDEX_KEY = 'tpti:public-profile-index:v1';
const {validateResponse} = require('./validate.cjs');

async function prepareMatching(body) {
  const {profile} = await import('../../project/tpti/scoring.js');
  const {interestGroups} = await import('../../project/tpti/matching.js');
  const answers = validateResponse({...body,feedback:''});
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
  if (!answers || body.answers.adultConfirmed !== true || !nickname ||
      Array.from(nickname).length > 16 || /[\p{C}@]|\d{6}/u.test(nickname) ||
      typeof body.shareProfile !== 'boolean' || typeof body.hideRadar !== 'boolean') return null;
  const allowed = new Set(interestGroups.flatMap(group=>group.items));
  const tags = Array.isArray(body.interests) ? [...new Set(body.interests.filter(tag=>allowed.has(tag)))] : [];
  const highlights = Array.isArray(body.highlights) ? tags.filter(tag=>body.highlights.includes(tag)).slice(0,3) : [];
  const scores = profile(answers).map(axis=>axis.value);
  const activities = answers.activities;
  const natural = activities.filter(i=>[1,3].includes(i)).length > activities.filter(i=>[0,2].includes(i)).length;
  const group = (answers.gender===1?1:0)+(natural?2:0);
  const variant = (scores[0]>=50?0:2)+(scores[1]>=50?0:1);
  return {nickname,scores,tags,highlights,activities,budget:answers.budget,hideRadar:body.hideRadar,
    portrait:'personality-'+group+'-'+variant+'.webp'};
}

function bestParticipant(me, candidates) {
  const compare = (first, second) => first.filter(value=>second.includes(value)).length / new Set([...first,...second]).size;
  let best = null;
  for(const candidate of candidates){
    if(!candidate || !Array.isArray(candidate.scores) || !Array.isArray(candidate.tags))continue;
    const interests = [...me.tags,...me.highlights];
    const shared = interests.filter(tag=>candidate.tags.includes(tag)).length;
    const activity = compare(me.activities,candidate.activities);
    const similarity = axis => 1-Math.abs(me.scores[axis]-candidate.scores[axis])/100;
    const factors = [[30,activity],[20,similarity(2)],[15,similarity(0)],[5,similarity(1)]];
    if(Number.isInteger(candidate.budget))factors.push([15,1-Math.abs(me.budget-candidate.budget)/3]);
    if(interests.length&&candidate.tags.length)factors.push([15,shared/interests.length]);
    const score = factors.reduce((sum,[weight,value])=>sum+weight*value,0)/
      factors.reduce((sum,[weight])=>sum+weight,0);
    if(!best || score>best.score) best={score,candidate};
  }
  if(!best)return null;
  const {nickname,scores,tags,portrait,hideRadar}=best.candidate;
  return hideRadar ? {nickname,hidden:true} : {nickname,tags,portrait,scores};
}

// Update the public directory and retrieve candidates atomically. Quiz responses use a separate key.
const updateAndRead = `
local id = ARGV[1]
if ARGV[2] ~= '' then
  redis.call('HSET', KEYS[1], id, ARGV[2])
  redis.call('ZADD', KEYS[2], ARGV[3], id)
else
  redis.call('HDEL', KEYS[1], id)
  redis.call('ZREM', KEYS[2], id)
end
local ids = redis.call('ZREVRANGE', KEYS[2], 0, tonumber(ARGV[4]))
local results = {}
for _, other in ipairs(ids) do
  if other ~= id then
    local profile = redis.call('HGET', KEYS[1], other)
    if profile then table.insert(results, profile) end
  end
end
return results
`;

async function matchParticipant(body, redis) {
  const me = await prepareMatching(body);
  if(!me)return null;
  const prefix = process.env.VERCEL_ENV === 'preview' ? 'preview:' : '';
  const candidates = await redis(['EVAL',updateAndRead,2,prefix+PUBLIC_KEY,prefix+INDEX_KEY,body.id,
    body.shareProfile?JSON.stringify(me):'',Date.now(),MAX_MATCH_PROFILES-1]);
  return {participant:bestParticipant(me,candidates.map(candidate=>JSON.parse(candidate)))};
}

module.exports = {prepareMatching,bestParticipant,matchParticipant,MAX_MATCH_PROFILES};
