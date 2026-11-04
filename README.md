# Charles'Vibe

Film photography portfolio with two collections: Hong Kong (HK) and Kota Kinabalu. The editorial layout keeps the photographs at their original proportions, with concise captions and a quiet, restrained interface.

## Preview

Open `index.html` directly, or upload the contents of the deploy folder to a static hosting service.

## Content

- `content.js`: English, Chinese, Japanese, and Korean labels, collections, and photograph captions.
- `assets/optimized/hong-kong/`: 1440px, high-quality web-ready photographs from HK1 and HK2.
- `assets/optimized/kota-kinabalu/`: 1440px, high-quality web-ready Kota Kinabalu photographs.
- Gallery photographs load lazily and decode asynchronously; contact QR codes remain unchanged.
- `app.js`: per-visit random ordering, collection switching, shuffle hero, four-language labels, and image viewer.
- `styles.css`: responsive editorial layout, typography, and restrained transitions.
- `assets/kodak-canister-isolated.png`: cropped 35mm Kodak Gold 200 canister photo by Runningboards, Wikimedia Commons, CC0 1.0; the original hanging leader is removed so the site’s separate film strip can emerge cleanly from the canister. Source: https://commons.wikimedia.org/wiki/File:Kodak-gold-200.jpg.

Each collection is shuffled on page load; the opening photograph is randomly selected from all 22 photographs. Switching collections fades between galleries. Visitors can open each frame, navigate through the current collection, and shuffle the hero image.

## Studio admin

Open `https://charles0927.github.io/Charles-Vibe/admin/` to replace an existing photograph and edit its title and alt text in Chinese, English, Japanese, and Korean. The copy editor also exposes the site's translated labels and page text.

The admin panel uses GitHub's Contents API to commit changes directly to `main`; GitHub Pages publishes them automatically. Create a fine-grained personal access token scoped only to `Charles-Vibe`, with **Contents: Read and write**, then enter it in the panel. The token stays in page memory and is cleared when the page closes or reloads. Never share or commit the token.

Replacement images are resized to a maximum long edge of 2200 px and encoded as high-quality JPEG before upload. The panel updates the existing photo path, so the collection layout and photo ordering remain unchanged.

