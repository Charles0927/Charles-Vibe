# Charles'Vibe

Film photography portfolio with two collections: Hong Kong (HK) and Kota Kinabalu. The editorial layout keeps the photographs at their original proportions, with concise captions and a quiet, restrained interface.

## Preview

Open `index.html` directly or serve the `outputs` folder with any static web server.

## Content

- `content.js`: English, Chinese, Japanese, and Korean labels, collections, and photograph captions.
- `assets/collections/hong-kong/`: optimized photographs from HK1 and HK2.
- `assets/collections/kota-kinabalu/`: optimized Kota Kinabalu photographs.
- `app.js`: per-visit random ordering, collection switching, shuffle hero, four-language labels, and image viewer.
- `styles.css`: responsive editorial layout, typography, and restrained transitions.
- `assets/kodak-canister-isolated.png`: cropped 35mm Kodak Gold 200 canister photo by Runningboards, Wikimedia Commons, CC0 1.0; the original hanging leader is removed so the site’s separate film strip can emerge cleanly from the canister. Source: https://commons.wikimedia.org/wiki/File:Kodak-gold-200.jpg.

Each collection is shuffled on page load; the opening photograph is randomly selected from all 22 photographs. Switching collections fades between galleries. Visitors can open each frame, navigate through the current collection, and shuffle the hero image.
