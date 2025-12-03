// Copyright (c) 2024-2025 iiPython

// Handle bulb selection
async function loadLightBulb(host) {
    localStorage.setItem("lastBulb", host);

    // Grab status information
    const status = await window._api.getStatus(host);

    // Process HTML
    document.querySelector("main").innerHTML = `
        <section>
            <div id = "color-picker"></div>
            <div class = "brightness">
                <span>Brightness</span>
                <input type = "range" min = "1" max = "100" value = "100" />
                <span>${status.light_state.brightness}%</span>
            </div>
        </section>
        <section style = "margin-top: 10px;">
            <h3>${status.alias}</h3>
            <hr>
            <span>
                Model: ${status.model} <br>
                IP: ${host} <br>
                HSV: <span id = "hsv-text">${status.light_state.hue}°, ${status.light_state.saturation}, ${status.light_state.brightness}%</span> <br>
                Turned on: <input type = "checkbox" ${status.light_state.on_off ? 'checked' : ''} />
            </span>
        </section>
    `;
    document.querySelector("main").style.alignItems = "start";
    document.querySelector("main").style.flexDirection = "row";
    document.querySelector("main").style.width = "600px";
    document.querySelector("main").style.height = "310px";

    // Handle extra controls
    const brightness = document.querySelector(`input[type = "range"]`);
    brightness.value = status.light_state.brightness;

    const toggle = document.querySelector(`input[type = "checkbox"]`);
    toggle.checked = Boolean(status.light_state.on_off);

    // Setup color picking
    const joe = colorjoe.rgb("color-picker", `hsv(${status.light_state.hue}, ${status.light_state.saturation}%, ${status.light_state.brightness}%)`);
    const sendStatus = async (c) => {
        const h = Math.round(c.hue() * 360), s = Math.round(c.saturation() * 100);
        await window._api.setStatus({
            h,
            s,
            b: +brightness.value,
            on: toggle.checked,
            host
        });
        document.querySelector(".brightness > span:last-child").innerText = `${brightness.value}%`;
        document.querySelector("#hsv-text").innerText = `${h}°, ${s}, ${brightness.value}%`;
    }

    joe.on("change", async (c) => await sendStatus(c));
    brightness.addEventListener("change", (e) => joe.update());
    toggle.addEventListener("change", (e) => joe.update());
}

// Load bulbs into UI
const lastBulb = localStorage.getItem("lastBulb");
if (!lastBulb){
    await window._api.getLightBulbs((bulbs) => {
        document.querySelector("main > div").innerHTML = "";
        for (const bulb of bulbs) {
            const button = document.createElement("button");
            button.innerText = bulb.name;
            button.addEventListener("click", () => loadLightBulb(bulb.host));
            document.querySelector("main > div").appendChild(button);
        }
    });
} else loadLightBulb(lastBulb);
