// Tenký klient GitHub Contents API — ukladanie zoznamu farností priamo
// do repozitára. Zápis spustí automatické nasadenie na Cloudflare Pages.

import { REPO } from './config.js';
import { utf8ToBase64, base64ToUtf8 } from './util.js';

const API = 'https://api.github.com';

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function gh(token, path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(token), ...(options.headers || {}) } });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch { /* bez detailu */ }
    throw new Error(`GitHub API ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

export async function verifyToken(token) {
  const repo = await gh(token, `/repos/${REPO.owner}/${REPO.repo}`);
  return {
    ok: true,
    defaultBranch: repo.default_branch,
    permissions: repo.permissions || {},
    private: repo.private,
  };
}

export async function getFile(token, path, branch) {
  const ref = branch ? `?ref=${encodeURIComponent(branch)}` : '';
  const data = await gh(token, `/repos/${REPO.owner}/${REPO.repo}/contents/${path}${ref}`);
  return { sha: data.sha, text: base64ToUtf8(data.content) };
}

export async function putFile(token, path, branch, text, message, sha) {
  return gh(token, `/repos/${REPO.owner}/${REPO.repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: utf8ToBase64(text),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

// Čas poslednej automatickej kontroly — verejný údaj z behu workflow.
// Funguje bez tokenu pri verejnom repozitári; pri súkromnom ticho zlyhá.
export async function lastCheckRun() {
  try {
    const res = await fetch(
      `${API}/repos/${REPO.owner}/${REPO.repo}/actions/workflows/${REPO.checkWorkflow}/runs?per_page=1&status=completed`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const run = data.workflow_runs && data.workflow_runs[0];
    if (!run) return null;
    return { at: run.run_started_at, conclusion: run.conclusion, url: run.html_url };
  } catch {
    return null;
  }
}
