/***************************************
 * LeetSyncGit – Background (Service Worker)
 * Phase 4 – GitHub Push
 ***************************************/

let latestSolution = null;

/* =========================
   MESSAGE LISTENER
========================= */

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  /* =========================
     1️⃣ Receive solution from content.js
  ========================= */

  if (msg.type === "LEETCODE_SOLUTION_READY") {
    latestSolution = msg.payload;
    console.log("[LeetSyncGit][BG] Solution stored:", latestSolution.slug);
    sendResponse({ ok: true });
    return;
  }

  /* =========================
     2️⃣ Popup asks for latest solution
  ========================= */

  if (msg.type === "GET_LATEST_SOLUTION") {
    sendResponse(latestSolution);
    return;
  }

  /* =========================
     3️⃣ Push solution to GitHub
  ========================= */

  if (msg.type === "PUSH_TO_GITHUB") {
    const { fileName, code } = msg.payload;

    try {
      const { githubToken, repoOwner, repoName } =
        await chrome.storage.local.get([
          "githubToken",
          "repoOwner",
          "repoName"
        ]);

      if (!githubToken || !repoOwner || !repoName) {
        sendResponse({ error: "GitHub not configured" });
        return;
      }

      const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;

      // 1️⃣ Check if file already exists
      let sha = null;
      const checkRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        }
      });

      if (checkRes.ok) {
        const json = await checkRes.json();
        sha = json.sha;
      }

      // 2️⃣ Create or update file (ROOT ONLY)
      const pushRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: `Add solution: ${fileName}`,
          content: btoa(unescape(encodeURIComponent(code))),
          sha
        })
      });

      const result = await pushRes.json();
      console.log("[LeetSyncGit][BG] GitHub response:", result);

      if (!pushRes.ok) {
        sendResponse({ error: result.message || "GitHub push failed" });
        return;
      }

      sendResponse({ ok: true });
      return;

    } catch (err) {
      console.error("[LeetSyncGit][BG] Push error:", err);
      sendResponse({ error: err.message });
      return;
    }
  }
});
