const addEndpoint = '/rss/addFeed';
const removeEndpoint = '/rss/removeFeed';
const feedsEndpoint = '/feeds.json';

const submit = function(target, object) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", target, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const body = JSON.stringify(object);
    xhr.send(body);
}

const updateFeedsList = () => {
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function(a) {
        if (this.readyState == 4 && this.status == 200) {
            let feeds = JSON.parse(this.responseText);
            let feedNode = document.getElementById("currentFeeds");
            let updateText = "Last updated: " + new Date().toLocaleString() + "\r\n\r\n";
            feedNode.innerText = updateText + feeds.urls.join("\r\n");
        }
    };
    xhr.open("GET", feedsEndpoint, true);
    xhr.send();
};

const addFeed = () => {
    const input = document.getElementById("enteredFeed");
    submit(addEndpoint, { urls: [ input.value ]});
    updateFeedsList();
};

const removeFeed = () => {
    const input = document.getElementById("enteredFeed");
    submit(removeEndpoint, { urls: [ input.value ]});
    updateFeedsList();
};

updateFeedsList();