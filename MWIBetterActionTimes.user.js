// ==UserScript==
// @name         MWIBetterActionTimes
// @namespace    http://tampermonkey.net/
// @version      2025-05-02-1
// @description  More buttons to change action times
// @author       Californium Sulfide
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=milkywayidle.com
// @grant        none
// @downloadURL https://github.com/californium-sulfide/MWIBetterActionTimes/raw/refs/heads/main/MWIBetterActionTimes.user.js
// @updateURL https://github.com/californium-sulfide/MWIBetterActionTimes/raw/refs/heads/main/MWIBetterActionTimes.meta.js
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
    hookWS();

    function hookWS() {
        const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
        const oriGet = dataProperty.get;

        dataProperty.get = hookedGet;
        Object.defineProperty(MessageEvent.prototype, "data", dataProperty);

        function hookedGet() {
            const socket = this.currentTarget;
            if (!(socket instanceof WebSocket)) {
                return oriGet.call(this);
            }
            if (socket.url.indexOf("api.milkywayidle.com/ws") <= -1 && socket.url.indexOf("api-test.milkywayidle.com/ws") <= -1) {
                return oriGet.call(this);
            }

            const message = oriGet.call(this);
            Object.defineProperty(this, "data", { value: message }); // Anti-loop

            return handleMessage(message);
        }
    }

    function handleMessage(message) {
        let obj = JSON.parse(message);
        if (obj && obj.type === "init_character_data") {
            
            waitForActionPanelParent();
        }
        return message;
    }

    const waitForActionPanelParent = () => {
        const targetNode = document.querySelector("div.GamePage_mainPanel__2njyb");
        if (targetNode) {
            console.log("start observe action panel");
            const actionPanelObserver = new MutationObserver(async function (mutations) {
                for (const mutation of mutations) {
                    for (const added of mutation.addedNodes) {
                        if (added?.classList?.contains("Modal_modalContainer__3B80m")) {
                            if (added.querySelector("div.SkillActionDetail_regularComponent__3oCgr")) {
                                handleActionPanel(added.querySelector("div.SkillActionDetail_regularComponent__3oCgr"));
                            }
                            else if (added.querySelector("div.MarketplacePanel_modalContent__3YhCo")) {
                                handleMarketPanel(added.querySelector("div.MarketplacePanel_modalContent__3YhCo"));
                            }
                        }
                    }
                }
            });
            actionPanelObserver.observe(targetNode, { attributes: false, childList: true, subtree: true });
        } else {
            setTimeout(waitForActionPanelParent, 200);
        }
    };

    async function handleActionPanel(panel,forceDisplay=0) {
        const showTotalTimeDiv = panel.querySelector("div#showTotalTime");
        if(forceDisplay||!showTotalTimeDiv){
            setTimeout(()=>{
                handleActionPanel(panel,1);
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
    async function handleMarketPanel(panel,forceDisplay=0) {
        const inputLine = panel.querySelector("div.MarketplacePanel_quantityInputs__1C3xk");
        const inputElem = inputLine.querySelector("input");
        const outerInputLine=inputLine.parentElement;
        outerInputLine.style.gap='6px';
        inputLine.insertAdjacentHTML('afterend', '<div class="MarketplacePanel_quantityInputs__1C3xk"></div>')
        inputLine.insertAdjacentHTML('afterend', '<div class="MarketplacePanel_quantityInputs__1C3xk"></div>')
        const plusLine = panel.querySelectorAll("div.MarketplacePanel_quantityInputs__1C3xk")[1];
        const subLine = panel.querySelectorAll("div.MarketplacePanel_quantityInputs__1C3xk")[2];
        const presetPlusTimes = [1, 5, 10, 50, 100, 500, 1000, 2000];
        for (const value of presetPlusTimes) {
            const btndiv=document.createElement('div');
            btndiv.classList.add('MarketplacePanel_buttonContainer__vJQud');
            const btn = document.createElement("button");
            btn.classList.add('Button_button__1Fe9z','Button_fullWidth__17pVU','Button_small__3fqC7');
            btn.innerText = '+' + numberFormatter(value);
            btn.onclick = () => {
                    const currentValue = parseInt(inputElem.value);
                    const targetValue = currentValue + value;
                    reactInputTriggerHack(inputElem, targetValue);
            };
            btndiv.append(btn);
            plusLine.append(btndiv);
        }
        const presetSubTimes = [1, 5, 10, 50, 100, 500, 1000, 2000];
        for (const value of presetSubTimes) {
            const btndiv=document.createElement('div');
            btndiv.classList.add('MarketplacePanel_buttonContainer__vJQud');
            const btn = document.createElement("button");
            btn.classList.add('Button_button__1Fe9z','Button_fullWidth__17pVU','Button_small__3fqC7');
            btn.innerText = '-' + numberFormatter(value);
            btn.onclick = () => {
                    const currentValue = parseInt(inputElem.value);
                    let targetValue = currentValue - value;
                    if (targetValue < 1) targetValue = 1;
                    reactInputTriggerHack(inputElem, targetValue);
            };
            btndiv.append(btn);
            subLine.append(btndiv);
        }
    }
})();
