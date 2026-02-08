/***************************************
 * LeetSyncGit – Content Script
 * Phase 3.1 + 3.2 + 3.3 (DOM extraction)
 ***************************************/

console.log("[LeetSyncGit] Content script injected on LeetCode");

let observerStarted = false;
let lastSubmissionId = null;

const EXTENSION_MAP = {
  "C++": ".cpp",
  "Java": ".java",
  "Python": ".py",
  "Python3": ".py",
  "JavaScript": ".js",
  "TypeScript": ".ts",
  "C": ".c",
  "C#": ".cs",
  "Go": ".go",
  "Rust": ".rs",
  "Kotlin": ".kt"
};


/* =========================
   SPA OBSERVER
========================= */

function startObserver() {
  if (observerStarted) return;
  observerStarted = true;

  console.log("[LeetSyncGit] MutationObserver started");

  const observer = new MutationObserver(() => {
    detectAcceptedSubmission();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/* =========================
   ACCEPTED DETECTION
========================= */

function detectAcceptedSubmission() {
  if (!window.location.pathname.includes("/submissions")) return;

  const match = window.location.pathname.match(/submissions\/(\d+)/);
  if (!match) return;

  const submissionId = match[1];
  if (submissionId === lastSubmissionId) return;

  const acceptedNode = Array.from(document.querySelectorAll("span, div"))
    .find(el => el.textContent?.trim() === "Accepted");

  if (!acceptedNode) return;

  lastSubmissionId = submissionId;

  console.log("[LeetSyncGit] ✅ Accepted detected");

  const title = getProblemTitle();
  const slug = getProblemSlug();

  console.log("[LeetSyncGit] Problem title:", title);
  console.log("[LeetSyncGit] Problem slug:", slug);

  // Try DOM extraction (may need a short delay)
  extractFromDOMWithRetry();

}

/* =========================
   PROBLEM INFO
========================= */

function getProblemSlug() {
  const match = window.location.pathname.match(/problems\/([^/]+)/);
  return match ? match[1] : null;
}

function getProblemTitle() {
  if (document.title?.includes(" - LeetCode")) {
    return document.title.replace(" - LeetCode", "").trim();
  }
  return null;
}

/* =========================
   DOM EXTRACTION
========================= */
function extractFromDOMWithRetry(attempt = 0) {
  const result = extractLanguageAndCodeFromDOM();

  if (result) {
    console.log("[LeetSyncGit] Language:", result.language);
    console.log(result.code);

    // 🟢 STEP 4.1 — SEND DATA TO EXTENSION
    chrome.runtime.sendMessage({
      type: "LEETCODE_SOLUTION_READY",
      payload: {
        title: getProblemTitle(),
        slug: getProblemSlug(),
        language: result.language,
        code: result.code
      }
    });
    const syncBtn = document.getElementById("leetsyncgit-sync-btn");
    if (syncBtn) {
      syncBtn.style.display = "block";
    }

    attachSyncButtonHandler();

    return;
  }

  if (attempt < 10) {
    setTimeout(() => extractFromDOMWithRetry(attempt + 1), 500);
  } else {
    console.warn("[LeetSyncGit] Failed to extract code from DOM");
  }
}

function extractLanguageAndCodeFromDOM() {
  // Language: shown near Runtime / Memory
  const langNode = Array.from(document.querySelectorAll("span, div"))
    .find(el =>
      el.textContent &&
      /^(C\+\+|Java|Python|Python3|JavaScript|TypeScript|C#|Go|Rust|Kotlin)$/
        .test(el.textContent.trim())
    );

  // Code: inside pre > code
  const codeNode = document.querySelector("pre code");

  if (!langNode || !codeNode) return null;

  const language = langNode.textContent.trim();

  // 🔑 Remove LeetCode line numbers safely
  const rawCode = codeNode.textContent;
  const code = rawCode
    .split("\n")
    .map(line => line.replace(/^\s*\d+\s?/, ""))
    .join("\n");

  if (!language || !code) return null;

  return { language, code };
}
function attachSyncButtonHandler() {
  const btn = document.getElementById("leetsyncgit-sync-btn");
  if (!btn || btn.dataset.bound) return;

  btn.dataset.bound = "true";

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.textContent = "Syncing…";
    btn.style.opacity = "0.7";

    chrome.runtime.sendMessage(
      { type: "GET_LATEST_SOLUTION" },
      (solution) => {
        if (!solution) {
          alert("No Accepted solution found");
          resetButton(btn);
          return;
        }

        const ext = EXTENSION_MAP[solution.language];
        if (!ext) {
          alert(`Unsupported language: ${solution.language}`);
          resetButton(btn);
          return;
        }

        const fileName = `${solution.slug}${ext}`;

        chrome.runtime.sendMessage(
          {
            type: "PUSH_TO_GITHUB",
            payload: {
              fileName,
              code: solution.code
            }
          },

          (res) => {
            if (res?.error) {
              alert("GitHub sync failed: " + res.error);
              resetButton(btn);
            } else {
              btn.textContent = "Synced ✅";
              btn.style.backgroundColor = "#6e7681"; // grey
            }
          }
        );
      }
    );
  });
}

function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = "Sync to GitHub";
  btn.style.opacity = "1";
}


function createFloatingSyncButton() {
  if (document.getElementById("leetsyncgit-sync-btn")) return;

  const btn = document.createElement("button");
  btn.id = "leetsyncgit-sync-btn";
  btn.textContent = "Sync to GitHub";

  btn.style.position = "fixed";
  btn.style.bottom = "24px";
  btn.style.right = "24px";
  btn.style.zIndex = "9999";
  btn.style.padding = "10px 14px";
  btn.style.borderRadius = "8px";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "14px";
  btn.style.fontWeight = "600";

  // ✅ GREEN BUTTON
  btn.style.backgroundColor = "#2ea44f"; // GitHub green
  btn.style.color = "#ffffff";
  btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

  btn.style.display = "none"; // hidden by default

  document.body.appendChild(btn);
}


/* =========================
   BOOT
========================= */

setTimeout(startObserver, 1500);
createFloatingSyncButton();

