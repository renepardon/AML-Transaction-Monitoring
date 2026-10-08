# syntax=docker/dockerfile:1.7
# Multi-stage build: Node builds the static bundle; the official nginx image is reduced to a
# self-made distroless root filesystem (nginx binary + linked libraries only) on top of scratch.
# Security rationale: docs/adrs/0019-secure-container-deployment.md
# Only official, freely available images, pinned by tag and digest (kept current by Dependabot).

# ---- build the app ---------------------------------------------------------------------
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
ENV CI=true NODE_ENV=development
COPY package.json package-lock.json ./
# Exact lockfile install; no lifecycle scripts from dependencies.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- assemble a minimal nginx root filesystem ------------------------------------------
FROM nginx:1.30.5-alpine-slim@sha256:32463212baf0e7d91aded2e9b843a4f2b9e017804b8c9d5bae7b51dcef64389c AS rootfs
COPY docker/nginx.conf docker/security-headers.conf /tmp/conf/
COPY --from=build /app/dist /tmp/dist
RUN set -eux; \
    # Apply Alpine security fixes that are newer than the nginx image (e.g. pcre2, OpenSSL, musl).
    # nginx itself stays the nginx.org build: /etc/apk/world pins its exact version.
    apk upgrade --no-cache; \
    R=/rootfs; \
    mkdir -p "$R/usr/sbin" "$R/etc/nginx" "$R/usr/share/nginx" "$R/tmp"; \
    cp /usr/sbin/nginx "$R/usr/sbin/nginx"; \
    # Copy exactly the shared libraries nginx links against, resolved by the musl loader.
    # Sonames that resolve via a symlink (e.g. libc.musl-*.so.1 -> ld-musl-*.so.1) become symlinks.
    LDSO="$(ls /lib/ld-musl-*.so.1)"; \
    "$LDSO" --list /usr/sbin/nginx \
      | awk '/=>/ { print $1, $3; next } $1 ~ /^\// { print "-", $1 }' \
      | while read -r name file; do \
          mkdir -p "$R$(dirname "$file")"; \
          [ -e "$R$file" ] || cp -L "$file" "$R$file"; \
          link="$R$(dirname "$file")/$name"; \
          if [ "$name" != "-" ] && [ ! -e "$link" ]; then ln -s "$(basename "$file")" "$link"; fi; \
        done; \
    cp /etc/nginx/mime.types "$R/etc/nginx/mime.types"; \
    # Keep the image scannable (Trivy): OS release files plus an apk database that lists only
    # the packages whose files were copied so far (nginx, musl, pcre2, libssl3, libcrypto3, zlib).
    # Built before our own files are added, so e.g. our /etc/passwd is not attributed to a package.
    cp /etc/alpine-release "$R/etc/alpine-release"; \
    cp -L /etc/os-release "$R/etc/os-release"; \
    (cd "$R" && find . \( -type f -o -type l \) | sed 's#^\./##') > /tmp/rootfs-files; \
    mkdir -p "$R/lib/apk/db"; \
    awk 'NR == FNR { want[$0] = 1; next } \
         /^$/ { if (keep) printf "%s\n", rec; rec = ""; keep = 0; next } \
         { rec = rec $0 "\n" } \
         /^F:/ { dir = substr($0, 3) } \
         /^R:/ { if (want[dir "/" substr($0, 3)]) keep = 1 } \
         END { if (keep) printf "%s\n", rec }' /tmp/rootfs-files /lib/apk/db/installed > "$R/lib/apk/db/installed"; \
    grep -q '^P:nginx$' "$R/lib/apk/db/installed"; \
    cp /tmp/conf/nginx.conf /tmp/conf/security-headers.conf "$R/etc/nginx/"; \
    cp -r /tmp/dist "$R/usr/share/nginx/html"; \
    printf 'root:x:0:0:root:/nonexistent:/sbin/nologin\nnginx:x:65532:65532:nginx:/nonexistent:/sbin/nologin\n' > "$R/etc/passwd"; \
    printf 'root:x:0:\nnginx:x:65532:\n' > "$R/etc/group"; \
    # Everything root-owned and read-only; binaries and libraries read+execute only.
    chown -R 0:0 "$R"; \
    find "$R" -type d -exec chmod 0555 {} +; \
    find "$R" -type f -exec chmod 0444 {} +; \
    chmod 0555 "$R/usr/sbin/nginx" "$R"/lib/ld-musl-*.so.1; \
    chmod 1777 "$R/tmp"; \
    # Fail the build if the configuration is invalid (checked with the identical binary and files)...
    cp /tmp/conf/nginx.conf /tmp/conf/security-headers.conf /etc/nginx/; \
    nginx -t -e /dev/stderr -c /etc/nginx/nginx.conf; \
    # ...or if the copied binary cannot resolve its libraries inside the new root.
    chroot "$R" /usr/sbin/nginx -V

# ---- runtime: nothing but nginx, its libraries, config and the static files -------------
FROM scratch
COPY --from=rootfs /rootfs/ /
USER 65532:65532
EXPOSE 8080
STOPSIGNAL SIGQUIT
ENTRYPOINT ["/usr/sbin/nginx", "-e", "/dev/stderr", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]
