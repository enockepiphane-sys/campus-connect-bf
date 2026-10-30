<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->


## Shared CampusLink spaces
- Keep shared revision and opportunity routes under the session-only `_commun` layout; institution-dependent authorization stays in `_authenticated` to preserve academic boundaries.
- Opportunities and favorites use database RLS with the existing auth identities; permission checks must use the server-controlled `peut_gerer_opportunites` function rather than browser state.
- Extend new database types locally in the shared data module; do not replace generated types for existing features.
- Revision provider adapters are server-only and remain disconnected until credentials, upload limits and authorization are implemented; never fabricate AI results.
