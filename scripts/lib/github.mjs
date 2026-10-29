// The few GitHub API calls the garden needs, with plain fetch.

const API = 'https://api.github.com';

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'car-garden',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function rest(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...headers(token), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

// Open issues whose title asks to water the car, oldest first.
export async function wateringIssues(repo, token) {
  const issues = await rest(`/repos/${repo}/issues?state=open&sort=created&direction=asc&per_page=100`, { token });
  return issues.filter((i) => !i.pull_request && /water/i.test(i.title));
}

export async function replyAndClose(repo, number, body, token) {
  await rest(`/repos/${repo}/issues/${number}/comments`, { token, method: 'POST', body: { body } });
  await rest(`/repos/${repo}/issues/${number}`, { token, method: 'PATCH', body: { state: 'closed', state_reason: 'completed' } });
}

// Daily contribution counts, as the public profile shows them.
export async function contributions(login, token, from, to) {
  try {
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: { ...headers(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`,
        variables: { login, from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
      }),
    });
    const json = await res.json();
    const weeks = json?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
    if (!weeks) throw new Error(JSON.stringify(json.errors ?? json));
    return weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }));
  } catch (err) {
    console.warn(`GraphQL contributions failed (${err.message}); falling back to the public calendar page.`);
    return scrapeContributions(login, from, to);
  }
}

async function scrapeContributions(login, from, to) {
  const html = await (await fetch(`https://github.com/users/${login}/contributions`, { headers: { 'User-Agent': 'car-garden' } })).text();
  const dates = new Map();
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"/g)) dates.set(m[2], m[1]);
  const out = [];
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dates.get(m[1]);
    if (!date || date < from || date > to) continue;
    const count = /^No contributions/.test(m[2]) ? 0 : parseInt(m[2].replace(/,/g, ''), 10);
    if (Number.isFinite(count)) out.push({ date, count });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
