# Asim Ali

Android shell app for [asimali.net](https://www.asimali.net/), built with Expo.

The site is rendered in a WebView. The shell adds the things a browser tab
cannot: a splash that hands over without a flash, native chrome that tracks the
site's own light/dark toggle, an offline screen that recovers on its own,
external links that leave the app, hardware back mapped to page history, and
Android App Links so `asimali.net` URLs open here.

## Develop

    npm install
    npm start

## Build

    npm run build:preview      # APK, sideloadable, for testing on a device
    npm run build:production   # AAB, for the Play Console

## Release

    npm run submit

`submit` needs a Google Play service account key configured in `eas.json`. The
first release has to be uploaded to the Play Console by hand to create the
listing.

App Links stay inert until `https://asimali.net/.well-known/assetlinks.json`
carries the Play app-signing SHA-256, which Google only issues after that first
upload.

## Changing the site

`src/config.js` holds `SITE_URL` and `ALLOWED_HOSTS`. Hosts outside that list
open in the system browser, so both the apex and `www` have to be listed.
