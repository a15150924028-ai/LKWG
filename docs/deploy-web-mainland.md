# Web Mainland China Deployment

This repository's web app is a static site. The production package is:

- `index.html`
- `assets/`
- `data/local-bundle.json`

Build it with:

```powershell
node scripts/build-web-dist.mjs
```

The upload root is `dist/web/`. Do not upload the repository root, because tests, docs, and the Mini Program source are not part of the public web deployment.

## Recommended Production Path

For users in mainland China, use a mainland object-storage bucket plus CDN:

- Tencent Cloud COS static website hosting + Tencent Cloud CDN
- Alibaba Cloud OSS static website hosting + Alibaba Cloud CDN

Avoid GitHub Pages, Vercel, Netlify, and Cloudflare Pages as the primary mainland production endpoint. They can work as source mirrors or overseas fallbacks, but mainland access can be slow or unstable and is harder to support.

Mainland production requirements:

- A custom domain.
- ICP filing for the domain before pointing it at mainland cloud resources.
- HTTPS certificate bound to the CDN/custom domain.
- CDN cache rules that keep `index.html` short-lived and immutable assets longer-lived.

If ICP filing is not ready, use Hong Kong object storage/CDN as a temporary endpoint and treat it as a lower-reliability fallback for mainland users.

## Tencent Cloud COS

1. Create a COS bucket in a mainland region close to the audience, such as Guangzhou, Shanghai, Beijing, or Chengdu.
2. Enable static website hosting with `index.html` as the default index page.
3. Bind an ICP-filed custom domain to the bucket/CDN.
4. Build and sync:

```powershell
node scripts/build-web-dist.mjs
coscli sync dist/web cos://<bucket-name>/ --delete
```

After upload, verify:

- `https://<domain>/` returns the app shell.
- `https://<domain>/data/local-bundle.json` returns JSON.
- `https://<domain>/assets/type-icons/fire.png` returns an image.

## Alibaba Cloud OSS

1. Create an OSS bucket in a mainland region close to the audience, such as `oss-cn-shanghai`, `oss-cn-beijing`, `oss-cn-guangzhou`, or `oss-cn-chengdu`.
2. Enable static website hosting with `index.html` as the default homepage.
3. Bind an ICP-filed custom domain to OSS/CDN.
4. Build and sync:

```powershell
node scripts/build-web-dist.mjs
ossutil sync dist/web oss://<bucket-name>/ --delete
```

After upload, verify:

- `https://<domain>/` returns the app shell.
- `https://<domain>/data/local-bundle.json` returns JSON.
- `https://<domain>/assets/type-icons/fire.png` returns an image.

## Cache Policy

Use these CDN cache rules:

- `index.html`: 60 seconds or no-cache.
- `data/local-bundle.json`: 5 to 10 minutes.
- `assets/*`: 30 days.
- `deploy-manifest.json`: 60 seconds.

After each release, purge `index.html`, `data/local-bundle.json`, and `deploy-manifest.json` from CDN cache.

## Release Checklist

1. Run the full local test sweep.
2. Run `node scripts/build-web-dist.mjs`.
3. Upload only `dist/web/`.
4. Purge CDN cache for the short-lived files.
5. Open the production URL from a mainland network and check the browser console.
