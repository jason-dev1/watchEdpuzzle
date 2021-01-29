// ==UserScript==
// @name         Edpuzzle Auto Progress
// @match        https://edpuzzle.com/*
// @version      1.0
// @description  Regain your freedom and time. Watch whatever you want.
// @author       Jason
// @grant        GM_xmlhttpRequest
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// ==/UserScript==

var pageURLCheckTimer = setInterval(
    function () {
        if (this.lastPathStr !== location.pathname
            || this.lastQueryStr !== location.search
            || this.lastPathStr === null
            || this.lastQueryStr === null
        ) {
            this.lastPathStr = location.pathname;
            this.lastQueryStr = location.search;
            gmMain();
        }
    }
    , 1000
);

function gmMain() {
    if (window.self === window.top) {
        waitForKeyElements("div._3rK9y7jREJ", (element) => {
            console.log("Page changed");
            mainScript();
        });
    }
}

function mainScript() {
    let URL = window.location.href;
    let ASSIGNMENT_ID = URL.substring(URL.indexOf('assignments/') + 12, URL.indexOf('/watch'));
    let delay = ms => new Promise(res => setTimeout(res, ms));
    let interval_delay = 2;//seconds
    (async function () {
        'use strict';
        /*
             Locate the holder for inserting container
        */
        let holder = document.querySelector("._1H1EG1IYAm");
        while (!holder) {
            await delay(500);
            holder = document.querySelector("._1H1EG1IYAm");
        }
        /*
              Container for storing created elements
        */
        let container = document.createElement('div');
        container.setAttribute("class", "_3nwiswg7or _1RIr3JDie4");
        holder.append(container);
        /*
              Create button element
        */
        let watch_btn = document.createElement('button');
        watch_btn.setAttribute("type", "button");
        watch_btn.textContent = "Auto Watch";
        container.append(watch_btn);
        /*
              Create progress span element
        */
        const currentProgress = await getCurrentProgress();
        let progress_text = document.createElement('span');
        progress_text.textContent = "Progress: " + currentProgress + "%";
        progress_text.style.padding = "20px";
        container.append(progress_text);
        /*
               Button event listener for executing auto watch
        */
        watch_btn.addEventListener("click", async function () {
            watch_btn.disabled = true;
            watch_btn.textContent = "Running";
            const videoID = (await getAssignmentDetailJSON())._id;
            const unwatchIntervals = await getUnwatchIntervals();
            for (let i = 0; i < unwatchIntervals.length; i++) {
                var postJSON = { timeIntervalNumber: unwatchIntervals[i] };
                await updateWatchInterval(videoID, JSON.stringify(postJSON));
                const progress = await getCurrentProgress();
                progress_text.innerHTML = "Progress: " + progress + "%";
                await delay(Math.random() * interval_delay * 1000);
            }
            window.location.reload();
        });
    })();

    function updateWatchInterval(videoID, data) {
        return new Promise(resolve => GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://edpuzzle.com/api/v4/media_attempts/' + videoID + '/watch',
            headers: {
                "Content-Type": "application/json"
            },
            data: data,
            onload: function (response) {
                if (response.status >= 200 && response.status < 400) {
                    resolve(response.responseText);
                } else {
                    console.error(`Error getting updateWatchInterval:`, response.status, response.statusText, response.responseText);
                    resolve();
                }
            },
            onerror: function (response) {
                console.error(`Error during GM_xmlHttpRequest to updateWatchInterval:`, response.statusText);
                resolve();
            }
        }));
    }

    function getAssignmentDetail() {
        return new Promise(resolve => GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://edpuzzle.com/api/v3/assignments/' + ASSIGNMENT_ID + '/attempt',
            onload: function (response) {
                if (response.status >= 200 && response.status < 400) {
                    resolve(response.responseText);
                } else {
                    console.error(`Error getAssignmentDetail:`, response.status, response.statusText, response.responseText);
                    resolve();
                }
            },
            onerror: function (response) {
                console.error(`Error during GM_xmlHttpRequest to getAssignmentDetail:`, response.statusText);
                resolve();
            }
        }));
    }

    async function getAssignmentDetailJSON() {
        const data = await getAssignmentDetail();
        if (data) {
            return JSON.parse(data);
        }
    }

    async function getCurrentProgress() {
        const timeIntervals = (await getAssignmentDetailJSON()).timeIntervals;
        let currentProgress = 0;
        timeIntervals.forEach(e => {
            e.views === 0 ? null : currentProgress += 1;
        }
        )
        return Math.round(currentProgress / 11 * 100);
    }

    async function getUnwatchIntervals() {
        const timeIntervals = (await getAssignmentDetailJSON()).timeIntervals;
        let unwatchIntervals = [];
        timeIntervals.forEach((e, index) => {
            e.views === 0 ? unwatchIntervals.push(index) : null;
        }
        )
        return unwatchIntervals;
    }
}