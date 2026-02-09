
# LeetSyncGit

LeetSyncGit is a Chrome browser extension that syncs your **accepted LeetCode submissions** directly to a GitHub repository with a single click.

It is designed for developers who want a **clean, automated, and local-first** way to maintain a personal archive of LeetCode solutions without copy-pasting code or giving broad access to their GitHub account.

---

## 1. Project Overview

Most developers practicing on LeetCode eventually want their solutions stored in GitHub:

- for revision
- for interviews
- for sharing progress
- for long-term ownership of their work

LeetCode does not provide a native, secure, one-click way to push accepted solutions to GitHub. Existing tools often:
- require backend servers
- request full GitHub access
- auto-create folders or modify repo structure
- store credentials externally

**LeetSyncGit exists to solve this problem with a minimal, transparent, and security-first approach.**

---

## 2. Key Features

- Sync accepted LeetCode submissions to GitHub in one click
- Works entirely client-side (Chrome extension only)
- No backend server
- No auto-created folders or nested directories
- One file per problem, pushed to the repository root
- Correct file extensions based on language (`.cpp`, `.py`, `.java`, etc.)
- Repository is selected once and reused
- Token stored only on the local device
- Explicit revoke option

---

## 3. Security Design

### Why Personal Access Token (PAT) instead of GitHub OAuth?

GitHub OAuth **cannot be safely constrained to a single repository** without a backend and complex app registration. Most OAuth-based tools end up requesting broad scopes like `repo`, which grants access to **all repositories**.

LeetSyncGit deliberately avoids this.

### Why Fine-Grained Personal Access Token?

LeetSyncGit uses **GitHub Fine-Grained Personal Access Tokens** because they allow:

- Repository-level access (single repo only)
- Minimal permissions (Contents: Read & Write)
- No access to issues, workflows, or other repos
- No OAuth redirect flow
- No backend storage

This approach follows the **principle of least privilege**.

---

## 4. Tech Stack

- **Chrome Extension** (Manifest V3)
- **Vanilla JavaScript**
- **Chrome APIs**
  - `chrome.storage.local`
  - `chrome.runtime`
  - `chrome.webRequest`
  - `MutationObserver`
- **GitHub REST API**
- **Authentication Model**
  - Fine-Grained GitHub Personal Access Token
  - Stored locally in browser storage

---

## 5. Installation (Manual via GitHub)

1. Download the project from GitHub

Option A: Download ZIP

- Go to your GitHub repository

- Click Code → Download ZIP

- Extract the ZIP to a folder on your system

Option B :
- Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/LeetSyncGit.git
   ```

2. Open Chrome and go to:

   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (top right)

4. Click **Load unpacked**

5. Select the cloned `LeetSyncGit` directory

The extension will now appear in your Chrome toolbar.

---

## 6. Generate a GitHub Personal Access Token (Required)

LeetSyncGit requires a **Fine-Grained Personal Access Token**.

### Steps

1. Go to:

   ```
   https://github.com/settings/personal-access-tokens/fine-grained
   ```

2. Click **Generate new token**

3. Configure the token:

   * **Token name**: `LeetSyncGit`
   * **Expiration**: Your choice (recommended: 90 days or more)
   * **Resource owner**: Your GitHub account

4. **Repository access**

   * Select **Only select repositories**
   * Choose the repository you want to sync LeetCode solutions to
     (you must create this repository first)

5. **Permissions**

   * Repository permissions:

     * **Contents** → Read and Write
   * Leave everything else as **No access**

6. Generate the token and **copy it once**
   (GitHub will not show it again)

---

## 7. Configure the Extension

1. Click the **LeetSyncGit** extension icon

2. Click **Connect GitHub**

3. Paste the Personal Access Token when prompted

4. Select the repository (one-time selection)

5. The extension will remember:

   * Your token
   * Selected repository
   * GitHub username

No further setup is required.

---

## 8. Common Mistakes and How to Avoid Them

* **Token has no repo access**

  * Ensure repository access is explicitly selected when creating the token

* **Wrong permissions**

  * Only `Contents: Read & Write` is required

* **Trying to sync before Accepted**

  * Sync only works after an Accepted submission

* **Multiple tabs**

  * Sync from the tab where the accepted submission is visible

* **Token expired**

  * Regenerate and reconnect via the extension

---

## 9. Security Limitations and Trade-offs

* The token is stored locally in `chrome.storage.local`
* Anyone with access to your browser profile could theoretically extract it
* There is no encryption layer (by design, to keep the system simple and auditable)
* OAuth is intentionally not supported to avoid over-privileged access

This is a conscious trade-off in favor of transparency and user control.

---

## 10. Future Improvements

* Optional preview before sync
* Automatic sync toggle
* Support for multiple repositories
* File overwrite strategy selection
* Commit message customization
* Better handling of resubmissions

---

## 12. Contribution Guidelines

Contributions are welcome.

Before submitting a PR:

* Follow the existing project structure
* If you want to contribute to this project, please fork the repository and submit a pull request with clear details of   your changes.
* Do not introduce backend services
* Do not add broad GitHub permissions
* Keep security implications explicit
* Test against multiple LeetCode problems (especially edge cases)

Open an issue before large changes to discuss design decisions.

---

## License

MIT License

```

If you want, I can also:
- tailor this README for a public open-source release
- shorten it for Chrome Web Store listing
- add a threat model section
- review it from a recruiter’s perspective
```
