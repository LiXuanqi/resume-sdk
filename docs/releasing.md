# Prepare a beta release

The current candidate is `0.1.0-beta.2`. Both SDK packages share this version. The workspace root remains private at `0.0.0` because it is not a published package.

The six-package `0.1.0-beta.1` release was interrupted during publication. Use `0.1.0-beta.2` for the consolidated packages; never overwrite or retry the old archives as this release. Check registry state before deprecating any old package.

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

`release:prepare` builds packages and writes two tarballs, `manifest.json`, and `SHA256SUMS` under `dist/release/0.1.0-beta.2/`. The manifest records the Git commit and whether the checkout has uncommitted changes. The command checks coordinated beta versions, license copies, workspace dependency ranges, and publication guards. It does not replace the preceding tests.

The packaged-consumer test verifies that pnpm converts internal `workspace:*` dependencies to the exact beta version in installed tarballs. It tests the CLI, types, HTML, fragments, installer, and PDF output outside the source workspace. Local dependency overrides substitute for unpublished registry packages.

## Prepare through GitHub Actions

After the workflow is committed and pushed, select **Prepare release candidate** in GitHub Actions and choose **Run workflow** for the intended commit's branch. The manual `.github/workflows/release.yml` workflow runs all checks and uploads candidate archives with checksums. Artifacts are retained for 14 days.

This workflow has read-only repository permissions. It contains no publication command, npm token, OIDC permission, tag creation, or GitHub release creation. Pushing a commit or tag does not trigger it.

## Publication

The two release packages have publishable manifests. The workspace root stays private. `release:prepare` requires publishable packages, but never publishes them. Publication is an explicit manual step using the npm organization owner's login.

Use public access and the `beta` tag. Publish in dependency order, core, then CLI. Multi-package publication is not atomic. Record successful versions before retrying a partial release.

## Check account access before publication

Run `pnpm release:preflight` while logged in to npm. This read-only command checks that the current account owns `@resume-sdk`, checks each public package record, and flags existing candidate versions or packages with another listed maintainer. A missing public record is not a reservation or a guarantee that npm will accept the name. The check does not establish package-specific write permissions or verify two-factor authentication. Do not store credentials in the repository.

## First-release runbook

The recommended first-release method is an interactive npm publication by the organization owner. It avoids placing a long-lived publishing token in GitHub. Complete npm's required authentication prompts in the terminal or browser. Do not paste passwords, tokens, or one-time codes into chat.

Execute publication commands only after the release has been explicitly authorized.

1. Run the preflight and confirm the two candidate versions are not already published. Confirm the account's email and publishing authentication are ready in npm account settings.
2. Confirm both package manifests are publishable and the root remains private. Review the consumer README files and release notes.
3. Commit the changes and run CI. Prepare fresh archives from that exact clean commit. Require `dirty: false` in their manifest. Recheck license files, README files, exports, internal dependency versions, and checksums. Do not reuse archives from an earlier preparation commit.
4. Run the following commands from the final artifact directory. Stop on the first failure. Publish dependencies before the packages that use them.

```sh
npm publish resume-sdk-core-0.1.0-beta.2.tgz --access public --tag beta --registry=https://registry.npmjs.org/
npm publish resume-sdk-0.1.0-beta.2.tgz --access public --tag beta --registry=https://registry.npmjs.org/
```

5. Verify each registry version and its `beta` tag. If a command times out or a partial release occurs, inspect the registry before retrying. Never assume a failed client response means nothing was published. Compare the published archive with the intended candidate before skipping an existing version.
6. Install both exact registry versions into a fresh directory without workspace overrides. Validate CLI execution, TypeScript imports, HTML and fragment output, browser installation, and PDF export. Then switch the blog from tarballs to registry dependencies and test its production build and download.
7. After verification, record the release commit and package versions. Create the version tag and GitHub prerelease only when requested.

The beta tag is intentional. Do not set or move `latest` during this prerelease.

## Configure subsequent CI publishing

After the packages exist, add a trusted publisher for each package through npm settings. Use owner `LiXuanqi`, repository `resume-sdk`, a future `publish.yml` workflow, and an `npm-publish` GitHub environment. Configure that environment's required reviewer and permitted release refs before enabling any publishing job. Its name alone does not provide approval protection.

The future job must use GitHub-hosted runners, a compatible npm CLI, and `id-token: write` for OIDC. It must publish only the reviewed archives and explicitly select the beta tag. The current `release.yml` remains artifact-only and should not receive npm credentials. Follow the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the supported runtime versions and permission settings. This remote configuration has not been performed.
