# Security Policy

This is the default security policy for repositories in the `0xMiden` organization. A repository's
own security policy takes precedence where one is provided.

Miden is currently in public testnet. Private reports help us fix security issues before mainnet
launch.

## Supported Versions

Security fixes are prioritized for active development branches and the most recent release lines
of the affected projects. Support for older releases is not guaranteed. Check the affected
repository for project-specific support guidance, and plan to upgrade after a security fix is
published.

## Reporting a Vulnerability

Please do not open a public issue, discussion, or pull request for an undisclosed vulnerability.
Report vulnerabilities affecting Miden through our central GitHub private reporting flow:

<https://github.com/0xMiden/protocol/security/advisories/new>

Include the affected repository in your report. Our security team will triage the issue and decide
on the next steps. We will keep you informed of progress and may ask for additional information.

Use a public GitHub issue in the appropriate repository for ordinary bugs that do not create a
security risk.

## What to Include

Please set a high bar for security submissions. Reports are most actionable when they include:

- A clear description of the vulnerability and its security impact.
- The affected repository, crate or component, and version or commit.
- A minimal proof of concept or reproducible test case, with the exact command needed to run it.
- A proposed fix patch, where possible.
- A regression test that fails before the fix and passes after it, where possible.
- Any relevant environment details, configuration, feature flags, inputs, or assumptions.
- Whether the issue has been disclosed anywhere else.

Incomplete reports may still be useful, but maintainers may ask for a proof of concept, a patch, or
a regression test before triage can be completed.

## Scope

Security-relevant reports include:

- Proof soundness or verification bugs that let invalid programs or protocol state be accepted.
- Bugs that bypass authorization or violate asset conservation, including incorrect note consumption.
- Vulnerabilities in cryptographic implementations or the handling of untrusted input.
- Memory-safety issues, panics, or resource exhaustion with a plausible security impact.
- Supply-chain, release, CI, or signing issues that could affect published artifacts.

General correctness bugs, documentation issues, feature requests, and performance problems without a
plausible security impact should be reported through the normal public issue tracker.

## Disclosure

Maintainers will use GitHub security advisories to coordinate investigation, fixes, credits, and
public disclosure. Please give maintainers a reasonable opportunity to investigate and release a fix
before disclosing the issue publicly.

When testing, act in good faith. Do not access data that is not yours, disrupt services, or use the
vulnerability beyond what is necessary to demonstrate impact.
