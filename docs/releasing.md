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
2. Review the consumer README included in each tarball and the release notes.
3. Explicitly authorize publication, then remove the private guards from the six packages while keeping the root private. Update the preparation guard at the same time.
4. Rebuild, inspect, and retest the final publishable archives. The current private archives will differ from those final archives.
5. Choose first-release authentication. npm trusted-publisher configuration is attached to individual package settings, so do not assume organization ownership alone enables a first OIDC publication.
6. Use the interactive first-release runbook below. Publish in dependency order: core, providers, templates, renderer, pdf, then CLI. Use public access and the beta tag explicitly. Multi-package publication is not atomic; record which versions succeeded before retrying a partial release. Configure a separately approved CI publishing job for subsequent releases.
7. Install the registry versions into a fresh consumer without local overrides and repeat the integration checks.

For subsequent automated publishing, configure each package's trusted publisher for GitHub owner `LiXuanqi`, repository `resume-sdk`, and the actual publishing workflow filename and environment. npm requires a supported npm CLI and Node version. Follow the [npm trusted publishing instructions](https://docs.npmjs.com/trusted-publishers/) when enabling this job. No publishing credentials or remote settings have been configured by this preparation work.

## Check account access before publication

Run `pnpm release:preflight` while logged in to npm. This read-only command checks that the current account owns `@resume-sdk`, checks each public package record, and flags existing candidate versions or packages with another listed maintainer. A missing public record is not a reservation or a guarantee that npm will accept the name. The check does not establish package-specific write permissions or verify two-factor authentication. Do not store credentials in the repository.

## First-release runbook

The recommended first-release method is an interactive npm publication by the organization owner. It avoids placing a long-lived publishing token in GitHub. Complete npm's required authentication prompts in the terminal or browser. Do not paste passwords, tokens, or one-time codes into chat.

These are future steps. Do not execute publication commands until the release has been explicitly authorized.

1. Run the preflight and confirm the six candidate versions are not already published. Confirm the account's email and publishing authentication are ready in npm account settings.
2. On a release-preparation commit, remove `private` from the six package manifests. Keep the root private. Change `prepare-release.mjs` to require publishable package manifests instead of private ones. Review these edits before using them.
3. Commit the changes and run CI. Prepare fresh archives from that exact clean commit. Require `dirty: false` in their manifest. Recheck license files, README files, exports, internal dependency versions, and checksums. The current private candidates cannot be reused.
4. Run the following commands from the final artifact directory. Stop on the first failure. Publish dependencies before the packages that use them.

```sh
npm publish resume-sdk-core-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-providers-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-templates-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-renderer-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-pdf-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-0.1.0-beta.1.tgz --access public --tag beta --registry=https://registry.npmjs.org/
```

5. Verify each registry version and its `beta` tag. If a command times out or a partial release occurs, inspect the registry before retrying. Never assume a failed client response means nothing was published. Compare the published archive with the intended candidate before skipping an existing version.
6. Install all six exact registry versions into a fresh directory without workspace overrides. Validate CLI execution, TypeScript imports, HTML and fragment output, browser installation, and PDF export. Then switch the blog from tarballs to registry dependencies and test its production build and download.
7. After verification, record the release commit and package versions. Create the version tag and GitHub prerelease only when requested.

The beta tag is intentional. Do not set or move `latest` during this prerelease.

## Configure subsequent CI publishing

After the packages exist, add a trusted publisher for each package through npm settings. Use owner `LiXuanqi`, repository `resume-sdk`, a future `publish.yml` workflow, and an `npm-publish` GitHub environment. Configure that environment's required reviewer and permitted release refs before enabling any publishing job. Its name alone does not provide approval protection.

The future job must use GitHub-hosted runners, a compatible npm CLI, and `id-token: write` for OIDC. It must publish only the reviewed archives and explicitly select the beta tag. The current `release.yml` remains artifact-only and should not receive npm credentials. Follow the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the supported runtime versions and permission settings. This remote configuration has not been performed.
