# Git Flow Scenario: Building the AI CodeGen Project

This document outlines a practical, step-by-step scenario of using **Git Flow** tailored for the `AI CodeGen` project, which consists of both a frontend (`client/`) and a backend (`server/`).

Git Flow relies on two long-running main branches (`main` and `develop`) and uses temporary branches for features, releases, and hotfixes.

---

## The Scenario: Building a "User Authentication" Feature

Imagine you want to add a login system to your AI CodeGen app. You need to update both the React `client` (login page) and the Node.js `server` (JWT token generation).

### 0. Initializing Git Flow (First Time Setup)

If you haven't set up Git Flow for your repository yet (or if you get an error that the `develop` branch doesn't exist), you need to initialize it. 

*(Note: If you don't have the `git flow` extension installed, Mac users can install it via Homebrew: `brew install git-flow`)*

```bash
# Initialize git flow with default branch naming conventions
git flow init -d

# This automatically creates and switches you to the 'develop' branch.
# Push the newly created develop branch to your remote repository:
git push -u origin develop
```

### 1. The Setup (The Main Branches)

Your repository should always have these two branches:
*   **`main`**: The production-ready code. What the users are currently using.
*   **`develop`**: The "integration" branch. This contains the latest delivered development changes for the next release.

### 2. Starting the Feature (Feature Branch)

You never code directly on `main` or `develop`. Since this is a new feature, you create a `feature` branch branching off from `develop`.

```bash
# First, make sure your local develop branch is up to date
git checkout develop
git pull origin develop

# Create and switch to a new feature branch
git checkout -b feature/user-authentication develop
```

### 3. Development & Committing

Now, you write your code. You make changes to both your client and server folders. You commit your progress logically.

```bash
# You update the backend
git add server/server.js server/.env.example
git commit -m "feat(server): add JWT authentication endpoints"

# You update the frontend
git add client/src/ client/.env.example
git commit -m "feat(client): create login UI and integrate with auth API"
```

### 4. Finishing the Feature

The authentication feature is done and tested locally. It's time to merge it back into `develop` so it can be part of the next release. *(In a team, you would usually push this branch to GitHub and open a Pull Request (PR) to `develop` instead of merging locally).*

```bash
# Switch back to develop
git checkout develop

# Merge your feature branch into develop
git merge feature/user-authentication

# Push the updated develop branch to GitHub
git push origin develop

# Delete the feature branch locally (it's no longer needed)
git branch -d feature/user-authentication
```

### 5. Preparing for Production (Release Branch)

Let's say `develop` now has the new Authentication feature, plus a few other features you finished earlier. You decide it's time to release version `v1.1.0` to your users. 
You create a `release` branch from `develop`. 

```bash
git checkout -b release/v1.1.0 develop
```

**Rules for the Release Branch:**
*   **NO NEW FEATURES** are allowed here.
*   You only use this branch to fix last-minute bugs found during final testing.
*   You bump version numbers (e.g., updating `version: "1.1.0"` in your root `package.json`, `client/package.json`, and `server/package.json`).

### 6. Deploying the Release

Once the release branch is perfectly stable, it must be merged into **BOTH** `main` (for production) and `develop` (so future features have the latest bug fixes).

```bash
# 1. Merge into main and tag it
git checkout main
git merge release/v1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0 with User Authentication"
git push origin main --tags

# 2. Merge back into develop
git checkout develop
git merge release/v1.1.0
git push origin develop

# 3. Clean up the release branch
git branch -d release/v1.1.0
```

### 7. Disaster Strikes! (Hotfix Branch)

A day after releasing `v1.1.0`, users report a critical bug: the server crashes when they enter a wrong password. You need to fix this immediately in production. 
You create a `hotfix` branch directly from `main` (because `develop` might already contain unfinished features for v1.2.0).

```bash
# Branch off from main
git checkout -b hotfix/auth-crash-fix main

# ... fix the bug in server/server.js ...
git commit -am "fix(server): resolve crash on invalid password"

# Merge the fix into main and tag a new patch version
git checkout main
git merge hotfix/auth-crash-fix
git tag -a v1.1.1 -m "Hotfix: resolve auth crash"
git push origin main --tags

# CRUCIAL: Merge the fix into develop so the bug doesn't come back in the next release!
git checkout develop
git merge hotfix/auth-crash-fix
git push origin develop

# Clean up
git branch -d hotfix/auth-crash-fix
```

---

## Summary Cheat Sheet for Git Flow:

*   **New Feature?** `develop` ➔ `feature/...` ➔ `develop`
*   **Ready to Deploy?** `develop` ➔ `release/...` ➔ `main` AND `develop`
*   **Emergency Bug in Prod?** `main` ➔ `hotfix/...` ➔ `main` AND `develop`
