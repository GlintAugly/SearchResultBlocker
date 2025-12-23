let cachedRules = [];

/* ---------- ルール取得 ---------- */
browser.storage.sync.get({ 
    blockedRules: [] 
}).then(data => {
  cachedRules = data.blockedRules;
  scanForResults(document.body);
});

/* ---------- ルール判定 ---------- */
function parseRule(rule) {
  const parts = rule.split("/");
  return {
    domain: parts.shift(),
    path: parts.length ? "/" + parts.join("/") : null
  };
}

function isBlockURL(url) {
  try {
    const u = new URL(url);
    return cachedRules.some(rule => {
      const { domain, path } = parseRule(rule);
      const domainMatch =
        u.hostname === domain || u.hostname.endsWith("." + domain);
      if (!domainMatch) return false;
      if (!path) return true;
      return u.pathname.startsWith(path);
    });
  } catch {
    return false;
  }
}

/* ---------- 検索結果ブロック特定 ---------- */
function findResultContainer(anchor) {
  let el = anchor;
  let depth = 0;

  while (el && depth < 6) {
    // 既に処理済みならここを結果とみなす
    if (el.dataset?.hiddenByAddon !== undefined) return el;

    // 「結果っぽい」要素サイズで判断
    if ((el.tagName === "LI" || el.tagName === "DIV") && el.offsetHeight > 100) {
      return el;
    }

    el = el.parentElement;
    depth++;
  }
  return null;
}

/* ---------- プレースホルダー ---------- */
function createPlaceholder(url, original) {
  const u = new URL(url);
  const div = document.createElement("div");
  div.textContent =
    `${u.hostname}${u.pathname} を非表示にしました（クリックで再表示）`;
  div.style.cssText = `
    cursor:pointer;
    padding:6px;
    margin:6px 0;
    background: #5d6468;
    border:1px dashed #999;
    font-size:13px;
  `;
  div.onclick = () => {
    div.remove();
    original.style.display = "";
  };
  return div;
}

/* ---------- 結果処理 ---------- */
function processAnchor(anchor) {
  const href = anchor.href;

  // 内部リンク・無効リンク除外
  if (!href || !href.startsWith("http")) return;
  if (href.includes("google.com")) return;
  if (href.includes("duckduckgo.com")) return;

  if (!isBlockURL(href)) return;

  const result = findResultContainer(anchor);
  if (!result) return;
  if (result.dataset.hiddenByAddon) return;

  result.dataset.hiddenByAddon = "true";

  const placeholder = createPlaceholder(href, result);
  result.before(placeholder);
  result.style.display = "none";
}

/* ---------- スキャン ---------- */
function scanForResults(root) {
  root.querySelectorAll('a[href^="http"]').forEach(processAnchor);
}

/* ---------- MutationObserver（最小限） ---------- */
const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        scanForResults(node);
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});
