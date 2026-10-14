# Project AURA

Adharsh Vijayakarthy's portfolio: a cinematic entrance, Quick Discovery, and the Stay Awhile spatial garden.

Requires Node.js 20.9 or later and npm.

## Install

```sh
npm install
```

Use `npm ci` to install the exact dependency versions from the lockfile.

## Development

```sh
npm run dev
```

## Build

```sh
npm run check
npm run build
```

The build creates a static website in `out/`. Deploy that directory to a static host with directory index support. The existing deployment settings are in `.openai/hosting.json`.

## Production

```sh
npm start
```

This serves the static export at `http://127.0.0.1:3000`. Run the build first. Set `PORT` to choose another local port.

## Content and assets

- `src/data/content.ts`: shared copy, branding and contact details.
- `src/data/repositories.ts`: supplied project source URLs.
- `src/data/certificates.ts`: certificate images and metadata. Replace the image and alt text, update verified metadata, and set `placeholder: false` when the original certificate is supplied.
- `src/sections/`: entrance, Quick Discovery and Stay Awhile experiences.
- `public/`: required models, textures, posters and certificate placeholders.
- `public/THIRD_PARTY_LICENSES.txt`: asset and font notices.

No environment variables are required by the website. `node_modules/`, `.next/` and `out/` are generated locally and excluded from source control.
