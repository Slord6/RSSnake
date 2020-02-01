# RSSnake 🐍🌐

An RSS consumer with simple, slightly garish, retro styling.

Inspiration + initial code taken from this [repo](https://github.com/hongkiat/js-rss-reader/).

## Description
A http server that serves the content of `/root` and supports virtual paths (eg `/rss`), to do more interesting things. Currently the 'interesting things' is displaying a list of RSS entries sourced from the urls in `/root/feeds.json`.

## Screenshot

![Example screenshot](https://i.imgur.com/DMXMW3a.png)

## How to run

I might do a [built](https://github.com/zeit/pkg) application at some point, but for now, it's a marginally more work:

- Pull down repo
- `npm i` in project dir
- `node index.js`
- Point browser to `localhost:80`, `/rss` for the rss view.

## Improvements

Some things that would make this more useful:

 - REST-like endpoint(s) for:
    - Add/remove feeds
    - Mark as read/unread
- Filter by feed
- Specify port as arg