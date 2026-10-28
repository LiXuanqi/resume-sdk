# Prepare a beta release

The current candidate is `0.1.0-beta.1`. All six SDK packages share this version. The workspace root remains private at `0.0.0` because it is not a published package.

## Verify and pack locally

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm cli install-browser
pnpm test:pdf
pnpm test:embed
pnpm test:package
pnpm release:prepare
```

PDF integration checks also need Poppler. On Linux CI, install browser system libraries with `pnpm cli install-browser --with-deps`.

`release:prepare` builds packages and writes six tarballs, `manifest.json`, and `SHA256SUMS` under `dist/release/0.1.0-beta.1/`. The manifest records the Git commit and whether the checkout has uncommitted changes. The command checks coordinated beta versions, license copies, workspace dependency ranges, and publication guards. It does not replace the preceding tests.

The packaged-consumer test verifies that pnpm converts internal `workspace:*` dependencies to the exact beta version in installed tarballs. It tests the CLI, types, HTML, fragments, installer, and PDF output outside the source workspace. Local dependency overrides substitute for unpublished registry packages.

## Prepare through GitHub Actions

After the workflow is committed and pushed, select **Prepare release candidate** in GitHub Actions and choose **Run workflow** for the intended commit's branch. The manual `.github/workflows/release.yml` workflow runs all checks and uploads candidate archives with checksums. Artifacts are retained for 14 days.

This workflow has read-only repository permissions. It contains no publication command, npm token, OIDC permission, tag creation, or GitHub release creation. Pushing a commit or tag does not trigger it.

## Publication remains disabled

Each package retains `private: true`. Its `publishConfig` declares the intended public access, `beta` distribution tag, and npm registry, but does not enable publishing. These private candidate archives are for review and local installation. Do not treat them as ready-to-publish artifacts.

Before the first authorized publication:

1. Recheck ownership of the unscoped `resume-sdk` name. Ownership of `@resume-sdk` does not reserve it.
2. Finish consumer package READMEs and review the release notes.
3. Explicitly authorize publication, then remove the private guards from the six packages while keeping the root private. Update the preparation guard at the same time.
4. Rebuild, inspect, and retest the final publishable archives. The current private archives will differ from those final archives.
5. Choose first-release authentication. npm trusted-publisher configuration is attached to individual package settings, so do not assume organization ownership alone enables a first OIDC publication.
6. Add a separately approved publishing job with an approval environment. Publish in dependency order: core, providers, templates, renderer, pdf, then CLI. Use public access and the beta tag explicitly. Multi-package publication is not atomic; record which versions succeeded before retrying a partial release.
7. Install the registry versions into a fresh consumer without local overrides and repeat the integration checks.

For subsequent automated publishing, configure each package's trusted publisher for GitHub owner `LiXuanqi`, repository `resume-sdk`, and the actual publishing workflow filename and environment. npm requires a supported npm CLI and Node version. Follow the [npm trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/) when enabling this job. No publishing credentials or remote settings have been configured by this preparation work.
