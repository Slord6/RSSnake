const submit = function(target, object) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", target, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    const body = JSON.stringify(object);
    console.log(body);
    xhr.send(body);
}