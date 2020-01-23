# RSSnake 🐍🌐

An RSS consumer with simple, retro styling.

Inspiration + initial code taken from this [repo](https://github.com/hongkiat/js-rss-reader/).

## Description
A http server that serves the content of `/root` and supports virtual paths (eg `/rss`), to do more interesting things. Currently the 'interesting things' is displaying a list of RSS entries sourced from the urls in `/root/feeds.json`.

## Screenshot

![Example screenshot](https://i.imgur.com/axhNzij.png)

## Known issues
Slight issue around CDATA being parsed at the moment, possibly content-type [related](https://github.com/jsdom/jsdom/pull/2030)?

## Improvements

Some things that would make this far more useful:

 - REST-like endpoint(s) for:
    - Add/remove feeds
    - Mark as read/unread
- Sort feeds by `pubDate`, intersperse with each other
    - Filter by feed
- Specify port as arg

## How to run

I might do a [built](https://github.com/zeit/pkg) application at some point, but for now, it's a marginally more work:

- Pull down repo
- `npm i` in project dir
- `node index.js`
- Point browser to `localhost:80`, `/rss` for the rss view.