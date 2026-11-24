const {validateResponse} = require('../tools/tpti/validate.cjs');
const {matchParticipant,prepareMatching} = require('../tools/tpti/participants.cjs');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error:'仅接受答卷提交'});
  }
  if (!req.headers['content-type']?.startsWith('application/json')) {
    return res.status(415).json({error:'请求格式不正确'});
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({error:'请求格式不正确'}); }
  }
  if (Buffer.byteLength(JSON.stringify(body ?? null)) > 16384) {
    return res.status(413).json({error:'内容过长'});
  }
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(503).json({error:'答卷收集服务尚未连接'});

  const redis = async command => {
    const response = await fetch(url, {
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify(command),
      signal:AbortSignal.timeout(7000)
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error('Redis rejected the request');
    return payload.result;
  };
  try {
    if(body?.action==='match'){
      const result=await matchParticipant(body,redis);
      return result ? res.status(200).json(result) : res.status(400).json({error:'请检查昵称及答卷'});
    }
    const answers = validateResponse(body);
    if (!answers) return res.status(400).json({error:'请检查答卷是否完整'});
    const details=body.nickname===undefined?null:await prepareMatching(body);
    if(body.nickname!==undefined&&!details)return res.status(400).json({error:'请检查昵称及答卷'});
    const response = {id:body.id, submittedAt:new Date().toISOString(), answers, feedback:body.feedback.trim(),
      ...(body.questionVersion===2?{questionVersion:2}:{}),
      ...(details?{nickname:details.nickname,interests:details.tags,interestHighlights:details.highlights}:{})};
    const result = await redis([details?'HSET':'HSETNX','tpti:responses:v1',body.id,JSON.stringify(response)]);
    if (![0,1].includes(result)) throw new Error('Redis did not accept the response');
    return res.status(200).json({saved:true});
  } catch {
    return res.status(503).json({error:'暂时无法提交，请稍后重试'});
  }
};
