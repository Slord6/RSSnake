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

You can also pass arguments to `index.js` with the format `name:value`.

Currently available config:
- `port:<number>`: Default - `port:80`

# Manage Feeds

## GUI

Head to `/rss/manage`. You can either enter a new url and click `Add` or enter a current url and click `Remove`. then head to `/rss` to see your updated feed.

## Programatically

Feeds can also be managed programatically with a http `POST` call to `/rss/addFeed` and `/rss/removeFeed`. The expected object is of the format:

```JSON
{
    "urls": [
        "http://example.com/rss.xml",
        "http://example.com/rss2.xml",
        "..."
    ]
}
```
An example of which you will find at the `/feeds.json` endpoint, where the current feeds are served.

If you wish to manage feeds completely separately from RSSnake the `/rss` endpoint accepts a query parameter of `feeds`. This allows another http service to serve up a correctly formatted urls JSON which will be interpreted by RSSnake.

For example, if RSSnake is hosted locally then `http://localhost/rss?feeds=http://remote/externalfeeds` will parse the contents of `http://remote/externalfeeds` which is expected to be of the JSON format shown above. See the `/feeds.json` endpoint for an example.

## Improvements

Some things that would make this more useful:

 - REST-like endpoint(s) for:
    - Mark as read/unread
- Filter by feed