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

const normalizedNickname=name=>name.trim().normalize('NFKC').toLowerCase();

// The directory supplies newest profiles first. Select the current profile before scoring.
async function rankedParticipants(me, candidates) {
  const {buddyScore,minimumBuddyScore} = await import('../../project/tpti/matching.js');
  const seen=new Set([normalizedNickname(me.nickname)]);
  return candidates.flatMap(candidate=>{
    if(typeof candidate?.nickname!=='string')return [];
    const nicknameKey=normalizedNickname(candidate.nickname);
    if(!nicknameKey||seen.has(nicknameKey))return [];
    seen.add(nicknameKey);
    const score=buddyScore(me,candidate);
    if(score===null||score<minimumBuddyScore)return [];
    const {nickname,scores,tags,portrait}=candidate;
    return [{nickname,scores,tags,portrait,score}];
  }).sort((a,b)=>b.score-a.score).slice(0,3);
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
if ARGV[5] == '1' then return {} end
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
  const excluded = body.excludeMatching === true;
  const candidates = await redis(['EVAL',updateAndRead,2,prefix+PUBLIC_KEY,prefix+INDEX_KEY,body.id,
    body.shareProfile&&!excluded&&!me.hideRadar?JSON.stringify(me):'',Date.now(),MAX_MATCH_PROFILES-1,excluded?'1':'0']);
  const participants=excluded?[]:await rankedParticipants(me,candidates.map(candidate=>JSON.parse(candidate)));
  return {participant:participants[0]??null,participants};
}

module.exports = {prepareMatching,rankedParticipants,matchParticipant,MAX_MATCH_PROFILES};
