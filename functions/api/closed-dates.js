// 홈페이지 문의 달력용 "마감일 중계"
// 방문자의 브라우저는 이 사이트 자신의 주소(/api/closed-dates)만 부르고,
// 이 코드가 서버에서 포토로 캘린더 서버(주소는 Cloudflare 비밀 설정 CALENDAR_URL 에만 있음)에 물어본 뒤
// 날짜 목록만 돌려줍니다. 사유·예약자 정보는 처음부터 받지 않고, 날짜 형식이 아닌 값은 걸러서 내보냅니다.
export async function onRequestGet(context) {
  const ok = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60' };
  const fail = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  const base = context.env && context.env.CALENDAR_URL;
  if (!base) return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: fail });
  try {
    const res = await fetch(String(base).replace(/\/+$/, '') + '/api/closed-dates', { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!res.ok || !data || !Array.isArray(data.closed)) throw new Error('bad_upstream');
    const closed = data.closed.filter(function (d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); });
    return new Response(JSON.stringify({ closed: closed }), { headers: ok });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upstream_unavailable' }), { status: 502, headers: fail });
  }
}
