const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connectBtn");
const revokeBtn = document.getElementById("revokeBtn");
const syncBtn = document.getElementById("syncBtn");
const setupBox = document.getElementById("setupBox");
const repoSelectBox = document.getElementById("repoSelectBox");
const repoSelect = document.getElementById("repoSelect");
const confirmRepoBtn = document.getElementById("confirmRepoBtn");

/* =========================
   LANGUAGE → EXTENSION MAP
========================= */

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
   STORAGE HELPERS
========================= */

async function saveAuth(token) {
  await chrome.storage.local.set({ githubToken: token });
}

async function saveRepo(owner, name) {
  await chrome.storage.local.set({ repoOwner: owner, repoName: name });
}

async function getSavedRepo() {
  return await chrome.storage.local.get(["repoOwner", "repoName"]);
}

async function clearAuth() {
  await chrome.storage.local.clear();
}

/* =========================
   GITHUB API HELPERS
========================= */

async function validateToken(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) throw new Error("INVALID_TOKEN");
  return await res.json();
}

async function fetchRepos(token) {
  const res = await fetch("https://api.github.com/user/repos?per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) throw new Error("REPO_LIST_FAILED");
  return await res.json();
}

/* =========================
   UI HELPERS
========================= */

function showDisconnected() {
  statusEl.textContent = "❌ Not connected to GitHub";
  connectBtn.style.display = "block";
  revokeBtn.style.display = "none";
  repoSelectBox.style.display = "none";
  syncBtn.disabled = true;
  setupBox.style.display = "block";

}

function showRepoSelector(repos) {
  repoSelect.innerHTML = "";

  repos.forEach(r => {
    const option = document.createElement("option");
    option.value = `${r.owner.login}/${r.name}`;
    option.textContent = `${r.owner.login}/${r.name}`;
    repoSelect.appendChild(option);
  });

  repoSelectBox.style.display = "block";
}

/* =========================
   CONNECT GITHUB
========================= */

connectBtn.addEventListener("click", async () => {
  alert(
    "Paste your GitHub Fine-Grained PAT.\n\n" +
    "Required permissions:\n" +
    "- Contents: Read & Write\n\n" +
    "You will select the repository next."
  );

  const token = prompt("Paste GitHub PAT here:");
  if (!token) return;

  try {
    await validateToken(token.trim());
    await saveAuth(token.trim());

    connectBtn.style.display = "none";
    revokeBtn.style.display = "block";
    statusEl.textContent = "🔍 Fetching repositories…";

    const repos = await fetchRepos(token.trim());
    showRepoSelector(repos);

    statusEl.textContent = "Select a repository";

  } catch {
    alert("Invalid or revoked token");
    await clearAuth();
    showDisconnected();
  }
});

/* =========================
   CONFIRM REPO
========================= */

confirmRepoBtn.addEventListener("click", async () => {
  const value = repoSelect.value;
  if (!value) return;

  const [owner, name] = value.split("/");
  await saveRepo(owner, name);

  repoSelectBox.style.display = "none";
  statusEl.innerHTML = `
    ✅ GitHub ready<br>
    Repository:<br>
    <b>${owner}/${name}</b>
  `;

  checkSolutionReady();
});

/* =========================
   CHECK SOLUTION READY
========================= */

function checkSolutionReady() {
  chrome.runtime.sendMessage(
    { type: "GET_LATEST_SOLUTION" },
    (solution) => {
      if (solution) {
        syncBtn.disabled = false;
        statusEl.textContent = "✅ Solution ready to sync";
      } else {
        syncBtn.disabled = true;
      }
    }
  );
}

/* =========================
   SYNC BUTTON
========================= */

syncBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    { type: "GET_LATEST_SOLUTION" },
    (solution) => {
      if (!solution) {
        alert("No Accepted solution found");
        return;
      }

      const ext = EXTENSION_MAP[solution.language];
      if (!ext) {
        alert(`Unsupported language: ${solution.language}`);
        return;
      }

      const fileName = `${solution.slug}${ext}`;
      console.log("[LeetSyncGit] Syncing:", fileName);

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
            alert("GitHub push failed: " + res.error);
          } else {
            alert("✅ Solution pushed to GitHub!");
          }
        }
      );
    }
  );
});

/* =========================
   REVOKE ACCESS
========================= */

revokeBtn.addEventListener("click", async () => {
  await clearAuth();
  chrome.tabs.create({
    url: "https://github.com/settings/personal-access-tokens"
  });
  showDisconnected();
});

/* =========================
   INIT
========================= */

async function init() {
  try {
    const { githubToken } = await chrome.storage.local.get("githubToken");

    if (!githubToken) {
      showDisconnected();
      return;
    }

    await validateToken(githubToken);

    connectBtn.style.display = "none";
    revokeBtn.style.display = "block";

    const { repoOwner, repoName } = await getSavedRepo();
    if (repoOwner && repoName) {
      statusEl.innerHTML = `
        ✅ GitHub ready<br>
        Repository:<br>
        <b>${repoOwner}/${repoName}</b>
      `;
      setupBox.style.display = "none";
      checkSolutionReady();
      return;
    }

    statusEl.textContent = "Select a repository";
    const repos = await fetchRepos(githubToken);
    showRepoSelector(repos);

  } catch {
    await clearAuth();
    showDisconnected();
    setupBox.style.display = "block";

  }
}

init();
