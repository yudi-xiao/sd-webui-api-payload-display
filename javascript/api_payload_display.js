{
    const registeredElements = new Set();

    function waitForData(dataElement) {
        return new Promise((resolve) => {
            const oldData = dataElement.value;
            const intervalId = setInterval(() => {
                if (dataElement.value != oldData) {
                    resolve(dataElement.value);
                    clearInterval(intervalId);
                }
            }, 200);
        });
    }

    function updateJsonTree(wrapper, data) {
        wrapper.innerHTML = '';
        // Create json-tree
        const tree = jsonTree.create(JSON.parse(data), wrapper);
        // Expand all (or selected) child nodes of root
        tree.expand(function (node) {
            return node.childNodes.length < 2;
        });
    }

    async function copyText(copyText, copyButton) {
        try {
            if (!navigator.clipboard) {
                throw ('Clipboard API not available, please make sure you are using HTTPS.');
            }

            await navigator.clipboard.writeText(copyText);
            copyButton.innerHTML = "Copied!";
            copyButton.classList.add('success');
            copyButton.classList.remove('fail');

            // After 3 seconds, revert the button text and style
            setTimeout(() => {
                copyButton.innerHTML = "Copy📋";
                copyButton.classList.remove('success');
            }, 3000);
        } catch (err) {
            copyButton.innerHTML = "Failed to copy";
            copyButton.classList.remove('success');
            copyButton.classList.add('fail');
        }
    }

    async function saveJson(jsonText, saveButton) {
        try {
            if (!navigator.clipboard) {
                throw ('Clipboard API not available, please make sure you are using HTTPS.');
            }

            var json_blob = new Blob([jsonText], {type: "application/json;charset=utf-8"});
            var blob_url = window.URL.createObjectURL(json_blob);
            var download_link = document.createElement("a");
            document.body.appendChild(download_link);
            download_link.style = "display: none";
            download_link.href = blob_url;
            download_link.download = "api-payload.json";
            download_link.click();
            window.URL.revokeObjectURL(blob_url);
            saveButton.innerHTML = "Saved!";
            saveButton.classList.add('success');
            saveButton.classList.remove('fail');

            // After 3 seconds, revert the button text and style
            setTimeout(() => {
                saveButton.innerHTML = "Save💾";
                saveButton.classList.remove('success');
            }, 3000);
        } catch (err) {
            saveButton.innerHTML = "Failed to copy";
            saveButton.classList.remove('success');
            saveButton.classList.add('fail');
        }
    }

    function addCopyToClipboardButton(accordion, textarea) {
        const span = accordion.querySelector('.label-wrap span');
        const button = document.createElement('button');
        const button_save = document.createElement('button');
        button.classList.add('api-payload-copy-button');
        button.innerHTML = 'Copy📋';
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            copyText(textarea.value, button);
        });

        button_save.classList.add('api-payload-copy-button');
        button_save.innerHTML = 'Save💾';
        button_save.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            saveJson(textarea.value, button_save)
        })

        span.appendChild(button);
        span.appendChild(button_save);
    }

    onUiUpdate(() => {
        const panels = gradioApp().querySelectorAll(".api-payload-display");
        if (!panels) return;

        for (const panel of panels) {
            if (registeredElements.has(panel)) continue;
            const pullButton = panel.querySelector('.api-payload-pull');
            const payloadTextbox = panel.querySelector('.api-payload-content textarea');
            const wrapper = panel.querySelector('.api-payload-json-tree');
            const processType = pullButton.id.replace('-api-payload-pull', '');
            const generateButton = gradioApp().querySelector(
                processType === 'txt2img' ? '#txt2img_generate' : '#img2img_generate');

            if (!generateButton) continue;

            generateButton.addEventListener('click', () => {
                // There is id conflict on the page. So apply class selector
                // as well.
                const progressPanel = gradioApp().querySelector(
                    `#${processType}_results_panel`);
                const progressDiv = gradioApp().querySelector(
                    `#${processType}_results`);
                resultElement = progressPanel ? progressPanel : progressDiv;

                new MutationObserver((_, observer) => {
                    // The click is only triggered when
                    // - generation button is clicked
                    // - progress bar appears
                    const dataPromise = waitForData(payloadTextbox);
                    pullButton.click();
                    dataPromise.then(data => updateJsonTree(wrapper, data));

                    observer.disconnect();
                }).observe(resultElement, {childList: true});
            });

            addCopyToClipboardButton(panel, payloadTextbox);
            registeredElements.add(panel);
        }
    });
}
