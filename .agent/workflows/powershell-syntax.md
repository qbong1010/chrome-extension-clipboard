---
description: Windows PowerShell Command Chaining Syntax
---

# Windows PowerShell Command Syntax Rules

- **Current Environment**: This agent operates in a **Windows PowerShell** environment.
- **Command Chaining**: The legacy command chaining operator `&&` (used in Bash or CMD) is not supported and will result in a `ParserError`.
- **Solution**: You MUST use the semicolon `;` operator to chain multiple commands sequentially.

## ❌ Wrong Approach:
```powershell
git add . && git commit -m "fix: comment" && git push
```

## ✅ Correct Approach:
```powershell
git add . ; git commit -m "fix: comment" ; git push
```
