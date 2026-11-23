const {pages,money}=require('./questions.cjs');
const questions=[...pages.filter(q=>q.options),...money];

function validateResponse(body) {
  if (!body || typeof body.feedback !== 'string' || body.feedback.length > 500 || !body.answers || !/^[a-f\d-]{36}$/i.test(body.id || '')) return null;
  const answers={};
  for (const question of questions) {
    const value=body.answers[question.id];
    const valid = v => Number.isInteger(v) && v >= 0 && v < question.options.length;
    if (question.kind === 'multi') {
      if (!Array.isArray(value) || !value.length || !value.every(valid) || new Set(value).size !== value.length ||
        (value.length > 1 && value.some(v => question.exclusive?.includes(v)))) return null;
    } else if (!valid(value)) return null;
    answers[question.id]=value;
  }

  return answers;
}

module.exports={validateResponse};
