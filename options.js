const textarea = document.getElementById("rules");
const result = document.getElementById("result");

function normalizeRule(line) {
  let rule = line.trim();
  if (!rule) return null;

  // プロトコル除去
  rule = rule.replace(/^https?:\/\//, "");

  // クエリ・フラグメント除去
  rule = rule.split(/[?#]/)[0];

  // 末尾スラッシュは保持（意味がある）
  const parts = rule.split("/");
  const domain = parts[0];

  // ドメイン妥当性チェック
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
    throw new Error(`無効なドメイン: ${domain}`);
  }

  return rule;
}

function restoreOptions() {
  browser.storage.sync.get({
    blockedRules: []
  }).then(data => {
    textarea.value = data.blockedRules.join("\n");
  });
}

function saveOptions() {
  const lines = textarea.value.split("\n");
  const rules = [];
  const errors = [];

  lines.forEach((line, index) => {
    try {
      const rule = normalizeRule(line);
      if (rule) rules.push(rule);
    } catch (e) {
      errors.push(`行 ${index + 1}: ${e.message}`);
    }
  });

  if (errors.length > 0) {
    result.textContent = errors.join(" / ");
    result.style.color = "red";
    return;
  }

  // 重複削除
  const uniqueRules = [...new Set(rules)];

  browser.storage.sync.set({
    blockedRules: uniqueRules
  }).then(() => {
    result.textContent = "保存しました";
    result.style.color = "green";
    setTimeout(() => status.textContent = "", 2000);
  });
}

document.getElementById("save").addEventListener("click", saveOptions);
document.addEventListener("DOMContentLoaded", restoreOptions);
