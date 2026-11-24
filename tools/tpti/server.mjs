import { createServer } from 'node:http';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import bank from './questions.cjs';
import validation from './validate.cjs';
import participants from './participants.cjs';
const {validateResponse}=validation;
const {prepareMatching,rankedParticipants,MAX_MATCH_PROFILES}=participants;

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = process.env.TPTI_DATA_DIR || join(root, 'data');
await mkdir(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'responses.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS responses(id TEXT PRIMARY KEY, submitted_at TEXT NOT NULL, answers TEXT NOT NULL, feedback TEXT NOT NULL)');
db.exec('CREATE TABLE IF NOT EXISTS participant_profiles(id TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, profile TEXT NOT NULL)');
const save = db.prepare('INSERT OR IGNORE INTO responses VALUES (?, ?, ?, ?)');
const publish = db.prepare('INSERT OR REPLACE INTO participant_profiles VALUES (?, ?, ?)');
const unpublish = db.prepare('DELETE FROM participant_profiles WHERE id = ?');
const candidates = db.prepare('SELECT profile FROM participant_profiles WHERE id <> ? ORDER BY updated_at DESC LIMIT ?');
const pages = bank.pages.filter(p => !['register','verify'].includes(p.kind));
const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(body));
};
const files = new Map(['/index.html','/app.js','/scoring.js','/style.css','/questions.json','/matching.js',
  '/celebrities.json','/demo-participants.json'].map(file=>[file,file.slice(1)]));
files.set('/','index.html');
for (const name of ['logo.png','project-logo.png','default-male.png','default-female.png','story-time.jpg','story-pace.jpg','story-money.jpg']) files.set('/assets/'+name,'assets/'+name);
for (const name of await readdir(join(root,'../../project/tpti/assets'))) {
  if (/^[a-z0-9-]+\.(?:webp|jpg|png)$/.test(name)) files.set('/assets/'+name,'assets/'+name);
}
const types = {json:'application/json; charset=utf-8',html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',png:'image/png',jpg:'image/jpeg',webp:'image/webp'};
const server = createServer(async (req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (req.method === 'GET' && pathname === '/project/tpti') { res.writeHead(308,{Location:'/project/tpti/'}); return res.end(); }
  const route = pathname.replace(/^\/project\/tpti(?=\/)/,'');
  try {
    if (req.method === 'GET' && route === '/api/questions') return send(res,200,{pages,money:bank.money});
    if (req.method === 'POST' && route === '/api/responses') {
      if (!req.headers['content-type']?.startsWith('application/json')) return send(res,415,{error:'请求格式不正确'});
      const chunks=[]; let size=0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 16384) return send(res,413,{error:'内容过长'});
        chunks.push(chunk);
      }
      let body;
      try { body=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res,400,{error:'请求格式不正确'}); }
      if(body?.action==='match'){
        const participant=await prepareMatching(body);
        if(!participant)return send(res,400,{error:'请检查昵称及答卷'});
        if(body.shareProfile&&!body.excludeMatching&&!participant.hideRadar)publish.run(body.id,Date.now(),JSON.stringify(participant));
        else unpublish.run(body.id);
        if(body.excludeMatching===true)return send(res,200,{participant:null,participants:[]});
        const matches=candidates.all(body.id,MAX_MATCH_PROFILES).map(row=>JSON.parse(row.profile));
        const shortlist=await rankedParticipants(participant,matches);
        return send(res,200,{participant:shortlist[0]??null,participants:shortlist});
      }
      const answers=validateResponse(body);
      if (!answers) return send(res,400,{error:'请检查答卷是否完整'});
      if(body.nickname!==undefined){
        const details=await prepareMatching(body);
        if(!details)return send(res,400,{error:'请检查昵称及答卷'});
        Object.assign(answers,{nickname:details.nickname,interests:details.tags,interestHighlights:details.highlights});
      }
      save.run(body.id || randomUUID(),new Date().toISOString(),JSON.stringify(answers),body.feedback.trim());
      return send(res,200,{saved:true});
    }
    if (req.method === 'GET' && pathname === '/project') {
      res.writeHead(308, {Location:'/project/'});
      return res.end();
    }
    if (req.method === 'GET' && ['/project/','/project/index.html'].includes(pathname)) {
      const page = await readFile(join(root,'../../project/index.html'));
      res.writeHead(200, {'Content-Type':types.html});
      return res.end(page);
    }
    if (req.method === 'GET' && !pathname.startsWith('/project/tpti/') && /^\/(?:[\w-]+\.html|(?:css|js)\/[\w-]+\.(?:css|js))$/.test(pathname)) {
      const file = await readFile(join(root, '../..', pathname.slice(1))).catch(() => null);
      if (!file) return send(res,404,{error:'页面不存在'});
      res.writeHead(200, {'Content-Type':types[pathname.split('.').pop()], 'X-Content-Type-Options':'nosniff'});
      return res.end(file);
    }
    if (req.method !== 'GET' || !files.has(route)) return send(res,404,{error:'页面不存在'});
    const file = files.get(route);
    const data = await readFile(join(root,'../../project/tpti',file));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'X-Content-Type-Options':'nosniff'});
    res.end(data);
  } catch (error) {
    console.error(error.message);
    if (!res.headersSent) send(res,500,{error:'暂时无法提交，请稍后重试'});
  }
});
server.listen(Number(process.env.PORT || 4173),process.env.HOST || '127.0.0.1',() => console.log('TPTI preview ready'));
