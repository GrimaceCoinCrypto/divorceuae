const TELEGRAM_BOT_TOKEN = '8847884326:AAGZNrcbCtR9hN4BQmONAVf_TRHf52Roqok';
const TELEGRAM_CHAT_ID = '1533375074';

function scoreLabel(score) {
  if (score >= 7) return '🔴 HIGH';
  if (score >= 4) return '🟡 MEDIUM';
  return '🟢 LOW';
}

function calcScore(urgency, caseType, children, hasLawyer) {
  let score = 0;
  if (urgency === 'today') score += 3;
  else if (urgency === 'this_week') score += 2;
  else if (urgency === 'this_month') score += 1;

  if (caseType === 'custody') score += 3;
  else if (caseType === 'contested') score += 2;
  else if (caseType === 'mutual') score += 1;

  if (children === 'yes') score += 2;

  if (hasLawyer === 'no_looking') score += 2;
  else if (hasLawyer === 'no_research') score += 1;

  return score;
}

const LABELS = {
  urgency: {
    today: 'TODAY - urgent',
    this_week: 'This week',
    this_month: 'Within a month',
    researching: 'Just researching',
  },
  caseType: {
    mutual: 'Mutual consent',
    contested: 'Contested',
    custody: 'Custody dispute',
    unknown: 'Not sure yet',
  },
  hasLawyer: {
    no_looking: 'No - looking now',
    no_research: 'No - just researching',
    yes_second: 'Yes - wants second opinion',
    yes: 'Already has lawyer',
  },
};

export async function onRequestPost({ request }) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const name = formData.get('name') || 'Unknown';
  const phone = formData.get('phone') || 'Not provided';
  const email = formData.get('email') || '';
  const situation = formData.get('situation') || '';
  const caseType = formData.get('case_type') || 'unknown';
  const urgency = formData.get('urgency') || 'researching';
  const hasLawyer = formData.get('has_lawyer') || 'no_research';
  const children = formData.get('children') || 'unknown';
  const source = formData.get('source') || 'Unknown page';
  const lang = formData.get('lang') || 'en';

  const score = calcScore(urgency, caseType, children, hasLawyer);
  const label = scoreLabel(score);

  const urgencyText = LABELS.urgency[urgency] || urgency;
  const caseText = LABELS.caseType[caseType] || caseType;
  const lawyerText = LABELS.hasLawyer[hasLawyer] || hasLawyer;
  const childrenText = children === 'yes' ? 'Yes' : children === 'no' ? 'No' : 'Unknown';

  const message = [
    `${label} LEAD — Score: ${score}/10`,
    '',
    `Name: ${name}`,
    `Phone/WA: ${phone}`,
    email ? `Email: ${email}` : null,
    '',
    `Urgency: ${urgencyText}`,
    `Case type: ${caseText}`,
    `Children: ${childrenText}`,
    `Has lawyer: ${lawyerText}`,
    '',
    situation ? `Situation: ${situation}` : null,
    `Source: /${source}`,
    `Language: ${lang.toUpperCase()}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  // 1. Notify operator via Telegram
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });
  } catch {
    // Telegram down — don't fail the form submission
  }

  // 2. Forward lead to portal ingest (async — don't block redirect)
  const PORTAL_URL = 'https://divorceuae-portal-production.up.railway.app';
  const INGEST_SECRET = 'divorceuae-ingest-2025';
  fetch(`${PORTAL_URL}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ingest-secret': INGEST_SECRET,
    },
    body: JSON.stringify({
      name, phone, email, situation,
      case_type: caseType, urgency,
      has_lawyer: hasLawyer, children,
      source, lang,
    }),
  }).catch(() => {});

  // Determine redirect based on lang
  const redirectUrl = lang === 'ar' ? '/ar/شكرا/' : '/en/thank-you/';
  return new Response(null, { status: 302, headers: { Location: redirectUrl } });
}
