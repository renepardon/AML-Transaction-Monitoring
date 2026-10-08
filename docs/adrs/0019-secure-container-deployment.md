# ADR-0019: Secure container deployment with self-built distroless nginx, non-root and read-only

- **Status:** Accepted (extends ADR-0002)
- **Date:** 2026-10-06

## Context

The prototype must be deployable as a Docker image. The app is a static bundle (ADR-0002): it needs no server-side code and no writable storage. The container should do nothing but serve these files, with the smallest possible attack surface, and protect users through HTTP security headers.

Constraints for the base software:

- **Freely usable:** no subscription, every tag and digest pullable without a licence.
- **Long-lived and well-maintained:** backed by an organisation, not a single maintainer.
- **nginx as the web server:** widely known to operators and auditors.

## Decision

### Image (`Dockerfile`)

Only official Docker Hub images are used, written as plain `FROM image:tag@sha256:…` lines, so they are pinned by **tag and digest** and Dependabot can update both (ADR-0020).

| Stage | Image | Purpose |
|---|---|---|
| `build` | `node:24-alpine` | `npm ci --ignore-scripts` (exact lockfile, no dependency lifecycle scripts), then `npm run build` (type-check and Vite build). |
| `rootfs` | `nginx:1.30.5-alpine-slim` (official image, maintained by NGINX/F5 and Docker) | Assembles a minimal root filesystem in `/rootfs` (see below). Used only at build time. |
| runtime | `scratch` | `COPY --from=rootfs /rootfs/ /`. Nothing else. |

**We harden the image ourselves instead of relying on a third-party distroless vendor.** The `rootfs` stage builds the root filesystem as follows:

1. **Security updates first:** `apk upgrade --no-cache` applies Alpine security fixes that are newer than the nginx image (e.g. pcre2 10.49 for a HIGH CVE that the 1.30.5 image still shipped). The nginx binary stays the nginx.org build, because `/etc/apk/world` pins its exact version.
2. **Files copied:**
   - `/usr/sbin/nginx`.
   - **Exactly the shared libraries it links against,** resolved by the musl loader (`ld-musl-*.so.1 --list`): musl, pcre2, OpenSSL, zlib. This works on every architecture. Sonames that resolve through a symlink (`libc.musl-*.so.1 → ld-musl-*.so.1`) are recreated as symlinks.
   - `mime.types`, our `nginx.conf` and `security-headers.conf`, and the static bundle.
   - A minimal `/etc/passwd` and `/etc/group` (`root`, `nginx` with UID/GID 65532, shell `/sbin/nologin`), and an empty `/tmp` (mount point).
3. **Scannability:** `/etc/alpine-release`, `/etc/os-release` and a **filtered apk database** that lists only the packages whose files were copied (nginx, musl, pcre2, libssl3, libcrypto3, zlib, alpine-release) are included. Without them, Trivy could not see the libraries in a `scratch` image. The list is derived from the copied files before our own files are added, so it stays accurate.
4. **Ownership and permissions:** everything is owned by root. Directories are `0555` and files `0444`; only the nginx binary and the loader are `0555`. The server cannot modify anything it serves or runs.
5. **Build-time verification:**
   - `nginx -t` validates the configuration with the identical binary and files.
   - `chroot /rootfs /usr/sbin/nginx -V` proves the copied binary resolves all its libraries inside the new root.
   - Either failure fails the build.

The runtime image therefore contains **no shell, no busybox, no package manager and no other binaries**, only nginx and its libraries.

- **Runtime user:** `USER 65532:65532`, with an explicit `ENTRYPOINT` (`nginx -e /dev/stderr -c /etc/nginx/nginx.conf -g "daemon off;"`) and `STOPSIGNAL SIGQUIT` for graceful shutdown.
- **Allow-list `.dockerignore`:** only `package*.json`, `index.html`, the Vite/TS/shadcn configs, `public/`, `src/` (without tests) and `docker/*.conf` enter the build context. Secrets, `.git`, `node_modules`, `dist` and docs cannot leak into a layer.

### Runtime hardening (`docker run` flags / Kubernetes `securityContext`)

| Control | Setting |
|---|---|
| Non-root | `--user 65532:65532` / `runAsNonRoot: true`, `runAsUser: 65532` |
| Read-only root filesystem | `--read-only` / `readOnlyRootFilesystem: true` |
| Writable scratch | `--tmpfs /tmp:rw,noexec,nosuid,nodev,size=16m` / `emptyDir` (medium Memory) |
| Capabilities | `--cap-drop=ALL` (port 8080 needs none) |
| Privilege escalation | `--security-opt=no-new-privileges` / `allowPrivilegeEscalation: false` |
| Seccomp | runtime default |

nginx is configured so that every write goes to `/tmp`: the PID file and all `*_temp_path`s. Logs go to stdout and stderr.

### nginx behaviour (`docker/nginx.conf`)

- **Static files only:**
  - `GET` and `HEAD` only (anything else returns 405).
  - Dotfiles return 404, `disable_symlinks on`, no autoindex, `server_tokens off`.
  - Request bodies are capped at 1 KB, with short timeouts.
- **Caching:** `/assets/*` (content-hashed) are `immutable` for one year; everything else is `no-cache`. gzip is enabled for text assets.
- **Health probe:** `/healthz` returns 200 for orchestrator HTTP probes. The image has no shell or curl, so it has no Docker `HEALTHCHECK`.
- **TLS** terminates at the ingress or reverse proxy. The container speaks plain HTTP on 8080 inside the cluster network.

### Security headers (`docker/security-headers.conf`, sent with `always` on every response)

nginx does not inherit `add_header` into a location that sets its own headers. The snippet is therefore included at server level (for server-level responses such as 405) and in every location, so success, error and 405 responses all carry it.

| Header | Value / purpose |
|---|---|
| Content-Security-Policy | `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` (2 years) |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` (legacy companion of `frame-ancestors`) |
| Referrer-Policy | `no-referrer` |
| Permissions-Policy | every powerful feature denied; only `clipboard-write=(self)` for "Copy as Markdown" |
| Cross-Origin-Opener-Policy / -Embedder-Policy / -Resource-Policy | `same-origin` / `require-corp` / `same-origin` (cross-origin isolation) |
| Origin-Agent-Cluster | `?1` |
| X-Permitted-Cross-Domain-Policies | `none` |
| X-DNS-Prefetch-Control | `off` |

**CSP notes:**
- The header CSP is stricter than the `<meta>` CSP in `index.html` (`default-src 'none'`, plus `frame-ancestors`, `base-uri`, `form-action` and `object-src`, which a meta CSP cannot fully enforce). Browsers apply both, so the intersection holds.
- Scripts are limited to `'self'`, with no `unsafe-inline` and no `unsafe-eval`.
- `style-src 'unsafe-inline'` is required by React style attributes, Radix UI positioning and the shadcn chart `<style>` element (ADR-0015). Style injection is a far lower risk than script injection.
- `connect-src 'self'` documents that the app makes no network calls. A real LLM proxy (ADR-0009) must be added here explicitly.

## Alternatives considered

- **Chainguard images (`cgr.dev/chainguard/nginx`):** rejected. They are not freely usable: the free tier offers only `:latest`, and versioned tags, digest stability and SLA require a subscription.
- **static-web-server (`joseluisq/static-web-server`) on `gcr.io/distroless/static`:** technically a good fit (a single static binary, no tmpfs needed), but rejected because it depends on an individual maintainer, which carries long-term availability and maintenance risk.
- **Official `nginx:alpine-slim` or `nginxinc/nginx-unprivileged` used as-is:** these ship a shell, busybox and apk, which are useful to an attacker after a compromise. They are used here only as the source of the nginx binary.
- **`gcr.io/distroless/*` as the runtime base:** it would add a second vendor without benefit. The only extras it provides (`passwd`, CA certificates, tzdata) are either created by us or not needed, because nginx makes no outbound TLS calls and logs in UTC.
- **Compiling nginx from source:** maximum control, but a slower build and an own patch process. Reusing the official binary keeps upstream's security fixes, and digest updates pick them up.
- **`upgrade-insecure-requests` in the CSP:** dropped. TLS terminates at the proxy and HSTS already forces HTTPS, and the directive breaks plain-HTTP local runs on `localhost`.
- **HSTS `preload`:** not set by default, because preload listing is a domain-wide commitment that is hard to reverse. Add it once the production domain is decided.
- **Trusted Types (`require-trusted-types-for 'script'`):** deferred. The generated shadcn chart writes `<style>` through `dangerouslySetInnerHTML` (ADR-0015). It needs a policy and testing before it can be enforced.
- **Running tests inside the image build:** not done, to keep the build minimal. CI runs `npm test`, typecheck and lint before building the image.

## Consequences

- The runtime image contains nginx, about five shared libraries, three config files and the static bundle, and nothing that can run an attacker's payload (no shell, no interpreter, no other tools).
- **Rebuilds:** library fixes (OpenSSL, pcre2, zlib, musl) arrive with every rebuild through `apk upgrade`; nginx fixes arrive with a new `nginx:*-alpine-slim` tag and digest, proposed by Dependabot. The library list and the apk database are derived automatically, so no manual changes are needed.
- **Reproducibility:** because of `apk upgrade`, two builds of the same commit can contain newer library patch versions. This trade-off favours security over byte-for-byte reproducibility; the CI image scan and SBOM record what each build contains.
- **Debugging:** interactive debugging needs `docker cp` or an ephemeral debug container (`kubectl debug`), because `docker exec sh` is impossible by design.
- **Dynamic nginx modules:** they are not available. Adding one would require copying it and its libraries explicitly.
- **CSP changes:** changing what the browser may load (fonts, an API, analytics) requires updating both CSPs, in `docker/security-headers.conf` and in `index.html`.
