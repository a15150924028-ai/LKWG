const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const scriptPath = path.join(root, "tools", "send-qq-mail.py");
const bundledPython = path.join(
  process.env.USERPROFILE || "",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "python.exe"
);
const pythonExecutable = fs.existsSync(bundledPython) ? bundledPython : "python";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(fs.existsSync(scriptPath), "Missing fixed QQ mail sender script.");

const source = fs.readFileSync(scriptPath, "utf8");

for (const required of [
  "QQ_MAIL_USER",
  "QQ_MAIL_AUTH_CODE",
  "EmailMessage",
  "SMTP_SSL",
  "Header(subject, \"utf-8\")",
  "set_content(body, subtype=\"plain\", charset=\"utf-8\")",
  "encoding=\"utf-8\"",
  "--subject-file",
  "--body-file",
  "--dry-run"
]) {
  assert(source.includes(required), `send-qq-mail.py must include ${required}.`);
}

assert(!/print\s*\(\s*(?:code|auth|password|credential)/i.test(source), "Sender must not print secrets.");
assert(!/QQ_MAIL_AUTH_CODE[^\n]+print/i.test(source), "Sender must not print QQ_MAIL_AUTH_CODE.");
assert(!/PowerShell|here-string|echo/i.test(source), "Sender must not rely on shell text transport for Chinese mail.");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lkwg-mail-test-"));
const subjectPath = path.join(tempDir, "subject.txt");
const bodyPath = path.join(tempDir, "body.txt");
fs.writeFileSync(subjectPath, "洛克王国世界每日更新摘要 - 干跑测试", "utf8");
fs.writeFileSync(bodyPath, "【今日结论】\n中文正文应保持 UTF-8，不应变成问号。\n", "utf8");

try {
  const output = childProcess.execFileSync(pythonExecutable, [
    scriptPath,
    "--subject-file",
    subjectPath,
    "--body-file",
    bodyPath,
    "--to",
    "2291784327@qq.com",
    "--dry-run"
  ], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      QQ_MAIL_USER: "sender@example.invalid",
      QQ_MAIL_AUTH_CODE: "do-not-use-this-secret"
    }
  });

  const result = JSON.parse(output);
  assert(result.dryRun === true, "Dry run must report dryRun=true.");
  assert(result.to === "2291784327@qq.com", "Dry run must report the recipient.");
  assert(result.subject === "洛克王国世界每日更新摘要 - 干跑测试", "Dry run must preserve UTF-8 subject.");
  assert(result.bodyCharacters > 0, "Dry run must count body characters.");
  assert(!output.includes("do-not-use-this-secret"), "Dry run must not print the auth code.");
  assert(!output.includes("QQ_MAIL_AUTH_CODE"), "Dry run must not print the auth env name as a secret diagnostic.");
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log("send-qq-mail-static.test.js passed");
