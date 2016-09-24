var offset = 0;
var chatList = [];

function getVar () {
	token = document.getElementById("token").value;
	cid   = document.getElementById("cid").value;
	prase = document.getElementById("prase").value;
	nopv  = document.getElementById("nopreview").value;
	nopu  = document.getElementById("nopush").value;
	body  = document.getElementById("text").value;
}

function addChatList (chat) {
	switch(chat["type"]) {
		case "private":
			name = chat["first_name"] + " " + chat["last_name"];
			break;
		case "group":
		case "supergroup":
		case "channel":
			name = chat["title"];
	}
	chatList.pushArrayIfNotExist([name, chat["id"]]);
	updateChatList(chatList);
}

function botApi (http, action, param, callback) {
	url = "https://api.telegram.org/bot" + token + "/" + action;
	http.open("POST", url, true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.send(param);
	http.onreadystatechange = callback;
}

function sendFdToApi (http, action, fd, callback) {
	para_name = action.substring(4).toLowerCase();
	url = "https://api.telegram.org/bot" + token + "/" + action;
	http.open("POST", url, true);
	http.send(fd);
	http.onreadystatechange = callback;
}

function downloadFile() {
	getVar();
	var http = new XMLHttpRequest();
	fileid = document.getElementById("fileid").value;
	botApi(http, "getFile", "file_id=" + fileid, function () {
		if(http.readyState == 4 && http.status == 200) {
			res = JSON.parse(http.responseText);
			if(res["ok"]) {
				appendLog(res["result"]);
				filepath = res["result"]["file_path"];
				var urldisp = document.getElementById("linkdisp");
				urldisp.href = "https://api.telegram.org/file/bot" + token + "/" + filepath;
				urldisp.innerHTML = filepath;
			}
		} else if (http.readyState == 4) httpError(http);
	});
}

function sendFile () {
	getVar();
	var http = new XMLHttpRequest();
	sendtype = document.getElementById("sendtype").value;
	action = sendtype.substring(4).toLowerCase();
	var fd = new FormData();
	fd.append(action, document.getElementById("tosend").files[0]);
	fd.append("chat_id", document.getElementById("fileto").value);
	sendFdToApi(http, sendtype, fd, function() {
		if(http.readyState == 4 && http.status == 200) {
			res = JSON.parse(http.responseText);
			if(res["ok"]) {
				appendLog(res["result"]);
				addChatList(res["result"]["chat"]);
			}
		} else if (http.readyState == 4) httpError(http);
	});
}

function sendCustomApi () {
	getVar();
	var http = new XMLHttpRequest();
	payload   = document.getElementById("payload").value;
	apimethod = document.getElementById("apimethod").value;
	botApi (http, apimethod, payload, function() {
		if(http.readyState == 4 && http.status == 200) {
			appendLog(JSON.parse(http.responseText));
		} else if (http.readyState == 4) httpError(http);
	});
}

function sendMessage() {
	getVar();
	var http = new XMLHttpRequest();
	if(prase == "none") prase = "";
	para = "chat_id=" + cid + "&text=" + body + 
               "&parse_mode=" + prase + "&disable_web_page_preview=" +
               nopv + "&disable_notification=" + nopu;
	botApi(http, "sendMessage", para, function() {
		if(http.readyState == 4 && http.status == 200) {
        		res = JSON.parse(http.responseText);
			if(res["ok"]) {
				appendLog(res["result"]);
				addChatList(res["result"]["chat"]);
			}
		} else if (http.readyState == 4) httpError(http);
	});

}

function startPolling () {
	document.getElementById("startPollingButton").disabled = true;
	window.setInterval(polling, 1000);
}

function polling() {
	getVar();
	var http = new XMLHttpRequest();
	pollPara = "offset=" + offset;
	botApi(http, "getUpdates", pollPara, function() {
		if(http.readyState == 4 && http.status == 200) {
			pRes = JSON.parse(http.responseText);
			if(pRes["ok"]) {
				pRes["result"].forEach(function(result) {
					appendLog(result["message"])
					offset = result["update_id"];
					addChatList(result["message"]["chat"]);
					try {
						userCode(result["message"]);
					} catch (error) {
						biu("Error: " + error, {type: "danger"});
					}
				});
				offset++;
			}
		}
	});

}

function httpError (http) {
	biu("API retunred non-200 respond: " + http.status + " " + http.statusText, {type: "danger"});
}