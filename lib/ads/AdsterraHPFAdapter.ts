export const AdsterraHPFAdapter = {
  name: "adsterra-hpf",

  async mount(container: HTMLElement, key: string) {
    return new Promise<boolean>((resolve) => {
      container.innerHTML = "";

      // Adsterra HighPerformanceFormat config
      (window as any).atOptions = {
        key,
        format: "iframe",
        height: 50,
        width: 320,
        params: {},
      };

      const script = document.createElement("script");
      script.src = `https://www.highperformanceformat.com/${key}/invoke.js`;
      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      container.appendChild(script);
    });
  },
};
