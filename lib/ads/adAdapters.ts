export interface AdAdapter {
  name: string;

  mount: (container: HTMLElement, zoneId: string) => Promise<boolean>;
}



export const HilltopAdapter: AdAdapter = {
  name: "hilltop",

  async mount(container, zoneId) {
    return new Promise((resolve) => {
      container.innerHTML = "";

      const adDiv = document.createElement("div");
      adDiv.setAttribute("data-ht-zone", zoneId);
      adDiv.style.width = "100%";
      adDiv.style.maxWidth = "300px";
      adDiv.style.margin = "0 auto";

      container.appendChild(adDiv);

      const script = document.createElement("script");
      script.src = "https://js.hilltopads.com/ht.js";
      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      container.appendChild(script);
    });
  },
};



export const AdsterraAdapter: AdAdapter = {
  name: "adsterra",

  mount(container, zoneId) {
  return new Promise((resolve) => {
    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = `https://adsterra.com/${zoneId}.js`;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    container.appendChild(script);
  });
}

};



export const FallbackAdapter: AdAdapter = {
  name: "fallback",

  async mount(container) {
    container.innerHTML = `
      <div style="
        width: 100%;
        max-width: 300px;
        height: 250px;
        background: #111;
        color: #aaa;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        No ads available
      </div>
    `;
    return true;
  },
};
