---
name: git-summary-push
description: Reviews current git changes, generates a commit message summarizing the work, commits the changes, and pushes to the current branch.
---

# Git Summary and Push Skill

This skill allows the agent to analyze all currently uncommitted changes in the repository, generate a suitable commit message summarizing the development work, and then safely push these changes to the remote repository.

## Instructions

Whenever the user invokes this skill (e.g., "요약해서 푸시해줘"), follow these exact steps:

### 1. Identify Changes
- Run `git status` to see what files have been modified, added, or deleted.
- Run `git diff` and `git diff --staged` to understand the actual code modifications.
  - *Tip: If the diff is very large, you can output it to a temporary file or read it block-by-block, or simply rely on `git status` combined with the user's recent request context.*

### 2. Formulate Commit Message
- Analyze the diffs and recent conversation context to understand what was accomplished.
- Create a concise and descriptive commit message.
- Use Conventional Commits format if appropriate (e.g., `feat: Add new user profile`, `fix: Resolve sidepanel scroll issue`, `refactor: Update CSS styles`).

### 3. Stage and Commit
- Execute commands to stage and commit the changes.
- **CRITICAL**: The environment is **Windows PowerShell**. You MUST use the semicolon `;` operator to chain multiple commands, NOT `&&`.
  - ✅ Correct: `git add . ; git commit -m "feat: your generated message"`
  - ❌ Incorrect: `git add . && git commit -m "..."`

### 4. Push to Remote
- Run `git push` to upload the commits.
- If the current branch has no upstream, ensure you set it correctly using `git push -u origin <branch_name>` (you can check the branch with `git branch --show-current`).

### 5. Report to User
- Let the user know the commit message used and confirm that the push was successful.
