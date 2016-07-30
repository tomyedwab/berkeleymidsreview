var EXPERIMENT_NAME = "Test";
// In "debug" mode, don't actually read cookies or send events
var DEBUG = true;
var HEARTBEAT_INTERVALS = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
    75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285,
    300, 360, 420, 480, 540, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700,
    3000, 3300, 3600
];
var FULL_DISCLOSURE_TEXT = (
    "To improve your experience, we sometimes show potential changes to " +
    "subsets of site viewers. " +
    "By continuing to browse the site you are agreeing to participate " +
    "in these tests.<br><br>" +
    "For more information see our <a href=\"/info/privacy.html\">privacy policy</a>."
)
var COOKIE_DISCLOSURE_TEXT = (
    "We use cookies to improve this site for all viewers. " +
    "We do not use these cookies to track users across multiple sites.<br><br>" +
    "By continuing to browse the site you are agreeing to our " +
    "<a href=\"/info/cookies.html\">cookie policy</a>."
);

var heartbeatIndex = 0;
var pageLoadTime = new Date();
var currentUser = null;

function readCookie(x) {
    if (DEBUG) { return null; }

    var l = document.cookie.split(";");
    for (var i = 0; i < l.length; i++) {
        var idx = l[i].indexOf(x);
        if (idx >= 0) {
            return l[i].substr(idx+x.length);
        }
    }
    return null;
}
function getUser() {
    if (!currentUser) {
        currentUser = readCookie("_c=");
    }
    if (!currentUser) {
        // If not, create one
        currentUser = Math.floor(Math.random()*0xFFFFFFFFFF).toString(16);
        document.cookie = "_c=" + currentUser + "; expires=Thu, 31 Dec 2020 12:00:00 UTC; path=/";
    }
    return currentUser;
}
function sendEvent(conversion) {
    var data = {
        ExperimentName: EXPERIMENT_NAME,
        Conversion: conversion,
        UserId: getUser(),
        EventTime: (new Date()) - pageLoadTime
    };

    if (DEBUG) {
        console.log("Sending event", data);
    } else {
        // Send the data in a POST command
        fetch("https://9o38hr6h75.execute-api.us-west-2.amazonaws.com/prod/record", {
            method: "POST",
            body: JSON.stringify(data),
            headers: new Headers({
                "Content-type": "application/json"
            })
        })
    }
}

// Show banner or dialog?
var showBanner = getUser().slice(4, 5) < "8";

// Which text do we show?
var showFullDisclosure = getUser().slice(5, 6) < "8";

var bannerEl = document.getElementById("disclosure-banner");
var modalEl = document.getElementById("disclosure-modal");
var seen = readCookie("_s=");
var detectedScroll = false;
if (showBanner) {
    sendEvent("page_load_banner");
    if (seen === null) {
        var bannerMsgEl = document.getElementById("disclosure-banner-msg");
        if (showFullDisclosure) {
            sendEvent("page_show_banner_full");
            bannerMsgEl.innerHTML = FULL_DISCLOSURE_TEXT;
        } else {
            sendEvent("page_show_banner_cookies");
            bannerMsgEl.innerHTML = COOKIE_DISCLOSURE_TEXT;
        }
        bannerEl.className = "visible";
    }
} else {
    sendEvent("page_load_dialog");
    if (seen === null) {
        var modalMsgEl = document.getElementById("disclosure-modal-msg");
        if (showFullDisclosure) {
            sendEvent("page_show_dialog_full");
            modalMsgEl.innerHTML = FULL_DISCLOSURE_TEXT;
        } else {
            sendEvent("page_show_dialog_cookies");
            modalMsgEl.innerHTML = COOKIE_DISCLOSURE_TEXT;
        }
        modalEl.className = "visible";
    }
}

if (document.referrer.indexOf("berkeleymidsreview.site") < 0) {
    sendEvent("referrer:" + document.referrer);
}

var queryParams = window.location.search.substring(1).split("&");
for (var i = 0; i < queryParams.length; i++) {
    sendEvent("q:" + queryParams[i]);
}
// Clear URI params
if (window.history.replaceState) {
    window.history.replaceState("", "", window.location.pathname);
}

function queueHeartbeat() {
    if (heartbeatIndex >= HEARTBEAT_INTERVALS.length - 1) {
        return;
    }
    var curMsec = (new Date()) - pageLoadTime;
    var desiredSec = HEARTBEAT_INTERVALS[heartbeatIndex] +
        Math.random() * (HEARTBEAT_INTERVALS[heartbeatIndex+1] -
            HEARTBEAT_INTERVALS[heartbeatIndex]);
    heartbeatIndex += 1;
    setTimeout(sendHeartbeat, desiredSec * 1000 - curMsec);
}
function sendHeartbeat() {
    sendEvent("heartbeat");
    queueHeartbeat();
}
queueHeartbeat();

function optInBtn() {
    sendEvent("dismissed_message");
    bannerEl.className = "";
    modalEl.className = "";
    document.cookie = "_s=1; expires=Thu, 31 Dec 2020 12:00:00 UTC; path=/";
}

function onScroll() {
    if (detectedScroll) { return false; }
    if (document.documentElement.scrollTop > 350 ||
        document.body.scrollTop > 350) {
        sendEvent("scroll");
        detectedScroll = true;
    }
}
