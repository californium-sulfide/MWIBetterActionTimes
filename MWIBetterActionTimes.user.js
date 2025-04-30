// ==UserScript==
// @name         MWIBetterActionTimes
// @namespace    http://tampermonkey.net/
// @version      2025-04-30
// @description  More buttons to change action times
// @author       Californium Sulfide
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=milkywayidle.com
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
    //inspired from MWITools
    function numberFormatter(num, digits = 1) {
        if (num === null || num === undefined) {
            return null;
        }
        if (num < 0) {
            return "-" + numberFormatter(-num);
        }
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "B" },
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup
            .slice()
            .reverse()
            .find(function (item) {
                return num >= item.value;
            });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
    function reactInputTriggerHack(inputElem, value) {
        let lastValue = inputElem.value;
        inputElem.value = value;
        let event = new Event("input", { bubbles: true });
        event.simulated = true;
        let tracker = inputElem._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }
        inputElem.dispatchEvent(event);
    }
    const waitForActionPanelParent = () => {
        const targetNode = document.querySelector("div.GamePage_mainPanel__2njyb");
        if (targetNode) {
            console.log("start observe action panel");
            const actionPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (
                            added?.classList?.contains("Modal_modalContainer__3B80m") &&
                            added.querySelector("div.SkillActionDetail_regularComponent__3oCgr")
                        ) {
                            handleActionPanel(added.querySelector("div.SkillActionDetail_regularComponent__3oCgr"));
                        }
                    }
                }
            });
            actionPanelObserver.observe(targetNode, { attributes: false, childList: true, subtree: true });
        } else {
            setTimeout(waitForActionPanelParent, 200);
        }
    };

    async function handleActionPanel(panel) {
        const showTotalTimeDiv = panel.querySelector("div#showTotalTime");
        if(!showTotalTimeDiv){
            setTimeout(()=>{
                handleActionPanel(panel);
            }, 200);
            return;
        }
        const inputLine = panel.querySelector("div.SkillActionDetail_maxActionCountInput__1C0Pw");
        const inputElem = inputLine.querySelector("input");
        inputLine.insertAdjacentHTML('afterend', '<div class="SkillActionDetail_maxActionCountInput__1C0Pw"></div>')
        inputLine.insertAdjacentHTML('afterend', '<div class="SkillActionDetail_maxActionCountInput__1C0Pw"></div>')
        const plusLine = panel.querySelectorAll("div.SkillActionDetail_maxActionCountInput__1C0Pw")[1];
        const subLine = panel.querySelectorAll("div.SkillActionDetail_maxActionCountInput__1C0Pw")[2];
        const presetPlusTimes = [1, 5, 10, 50, 100, 500, 1000, 2000];
        for (const value of presetPlusTimes) {
            const btn = document.createElement("button");
            btn.classList.add('Button_button__1Fe9z', 'Button_small__3fqC7');
            btn.innerText = '+' + numberFormatter(value);
            btn.onclick = () => {
                if (inputElem.value === '∞') {
                    reactInputTriggerHack(inputElem, value);
                } else {
                    const currentValue = parseInt(inputElem.value);
                    const targetValue = currentValue + value;
                    reactInputTriggerHack(inputElem, targetValue);
                }
            };
            plusLine.append(btn);
        }
        const presetSubTimes = [1, 5, 10, 50, 100, 500, 1000, 2000];
        for (const value of presetSubTimes) {
            const btn = document.createElement("button");
            btn.classList.add('Button_button__1Fe9z', 'Button_small__3fqC7');
            btn.innerText = '-' + numberFormatter(value);
            btn.onclick = () => {
                if (inputElem.value === '∞') {
                    reactInputTriggerHack(inputElem, 1);
                } else {
                    const currentValue = parseInt(inputElem.value);
                    let targetValue = currentValue - value;
                    if (targetValue < 1) targetValue = 1;
                    reactInputTriggerHack(inputElem, targetValue);
                }
            };
            subLine.append(btn);
        }
    }
    waitForActionPanelParent();
})();
