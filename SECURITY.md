# Security notes

## Credential rotation (if you have the original project history)

Earlier commits in this repository's history contained a real
`backend/.env` file with a MongoDB connection string, a JWT signing secret,
and (since removed in favour of Azure) AWS credentials. `.env` is no longer
tracked and `.gitignore` now excludes it, but **removing a file from the
working tree does not remove it from history** — anyone with access to the
git history (or who cloned the repo before this change) can still read the
old values.

If this repository has ever been pushed anywhere other than a private,
never-shared local clone, treat every credential in that old `.env` as
compromised:

1. **Rotate the MongoDB credential** — in Atlas: Database Access → edit the
   user → Edit Password. Update `MONGO_URI` in your real `.env` with the new
   password.
2. **Rotate `JWT_SECRET`** — generate a new one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Rotating it invalidates every previously issued token, signing everyone
   out — expected and desired if the old secret leaked.
3. If AWS credentials were ever used (pre-Azure-migration history), rotate or
   deactivate them in the IAM console even though the code no longer uses them.

Rotating the credentials matters more than scrubbing history — a rotated
credential is safe even if the old value is still visible in history, whereas
scrubbed history with unrotated credentials is not. If you also want the
values gone from history (e.g. before making a private repo public), use
[`git-filter-repo`](https://github.com/newren/git-filter-repo) to remove
`backend/.env` from every commit, then force-push — coordinate with anyone
else who has a clone, since their history will diverge.

## Reporting a vulnerability

This is an internal project. Report issues to the repository owner directly
rather than opening a public issue.
