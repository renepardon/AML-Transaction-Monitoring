# Security tool images used by the CI workflows. This file is never built.
# It exists so Dependabot (docker ecosystem) keeps the tags AND digests below up to date.
# Workflows read the image reference by its stage name (e.g. "trivy").
FROM aquasec/trivy:0.75.0@sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa AS trivy
FROM trufflesecurity/trufflehog:3.99.0@sha256:39ee0643ae620664287bcc95f133f3fc8484590d6ca4e7105d96b90dac4b9f6f AS trufflehog
FROM ghcr.io/zaproxy/zaproxy:2.16.1@sha256:7840969c7c9fead565bf9734b12f49f6886db90b1d35b1f74d79710bbd081dab AS zap
