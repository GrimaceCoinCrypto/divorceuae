export async function onRequestPost(context) {
  const { request, env } = context

  let formData
  try {
    formData = await request.formData()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const payload = {
    name:      formData.get('name')       || 'Unknown',
    phone:     formData.get('phone')      || '',
    email:     formData.get('email')      || null,
    urgency:   formData.get('urgency')    || 'this_month',
    case_type: formData.get('case_type')  || 'unknown',
    children:  formData.get('children')   || 'no',
    has_lawyer:formData.get('has_lawyer') || 'no',
    situation: formData.get('situation')  || null,
    lang:      formData.get('lang')       || 'en',
    source:    formData.get('source')     || null,
  }

  const portalUrl    = env.PORTAL_INGEST_URL || 'https://divorceuae-portal-production.up.railway.app'
  const ingestSecret = env.INGEST_SECRET     || ''

  // Guard against the silent-failure mode: a missing/incorrect secret makes the
  // portal reject every lead with 401, which is NOT a thrown error. Log loudly
  // so it is visible in Cloudflare Pages function logs.
  if (!ingestSecret) {
    console.error('[lead] INGEST_SECRET env var is not set — portal will reject leads with 401')
  }

  try {
    const res = await fetch(`${portalUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ingest-secret': ingestSecret,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[lead] portal ingest returned ${res.status}: ${body.slice(0, 300)}`)
    }
  } catch (e) {
    console.error('[lead] portal ingest failed:', e)
  }

  const origin = new URL(request.url).origin
  const lang   = payload.lang === 'ar' ? 'ar' : 'en'
  return Response.redirect(`${origin}/${lang}/thank-you/`, 303)
}
