# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Casual image browsers and people new to AI image generation, on phones first. They are friends and acquaintances of the creator rather than a marketed audience. They open the app to look around, find visual ideas, search by title, prompt or tag, save what they like, and understand how an image was made.

## Product Purpose
Promptual is a mobile web app for browsing the creator's AI-generated images published at https://promptual.puntuale.nl. It makes exploring that archive simple: browse the gallery, search by title, prompt or tag, shuffle through random images, run a swipe-driven slide show, and keep favorites on the device. Success is a beginner who finds an image they like and can see and copy the prompt that produced it.

## Positioning
The prompt sits behind every image. Each image carries its prompt and generation settings (model, steps, guidance, seed, negative prompt), so a newcomer can learn from it and reuse the idea. A generic gallery cannot truthfully claim that every image is traceable to the words that made it.

## Operating Context
- Content comes only from the site's JSON API at https://promptual.puntuale.nl; the app fetches articles and tags and caches both for reuse.
- Used on phones in a browser, as an installable PWA (GitHub Pages at https://promptual-app.puntuale.nl), with Capacitor iOS and Android projects checked in.
- Favorites are stored on the device (localStorage); there are no accounts.

## Capabilities and Constraints
- Gallery with infinite scroll, Tags tab (search plus tag filtering), Random (12 images with refresh), Slide show (full-screen, swipe left for a safe image, right for an NSFW image), Favorites, and an image detail page with prompt, metadata, copy-prompt, share and save.
- Prompts are shown on detail pages only, not on list cards.
- Adult (NSFW) images are hidden by default and opt-in: Safe is the default filter everywhere, and NSFW appears only when a user explicitly selects it or swipes right in the slide show. NSFW images are badged.
- The app depends on the site's API allowing the deployed origin; local development needs a proxy.
- Mobile web remains the product's design language; the Capacitor wrappers do not make it native.

## Brand Commitments
Name: Promptual. The logo is a framed picture with a gold spark on the terracotta brand colour (public/promptual-logo.svg). The voice is plain and beginner-friendly, never technical or hype-driven.

## Evidence on Hand
- The creator's own generated images and their prompts, served from promptual.puntuale.nl.
- No testimonials, usage numbers or customer evidence exist; do not invent any.
- Earlier design intent is recorded in .impeccable.md (users, brand personality, principles).

## Product Principles
- Let the artwork carry the experience; the interface supports browsing and never competes with the images.
- Make the prompt discoverable: any image should lead to the words that made it.
- Make discovery obvious: gallery, search and tags, random, slide show and favorites should each be understandable at a glance for a beginner.
- Safe by default; adult content is always an explicit choice and always labelled.
- Keep it fast and light on a phone: quick start, responsive navigation, cached data.

## Accessibility & Inclusion
Text must stay readable at mobile sizes, especially prompts, metadata, tags and action labels. Gestures such as swiping always have a visible button or key equivalent. Empty, loading and error states are explicit.
