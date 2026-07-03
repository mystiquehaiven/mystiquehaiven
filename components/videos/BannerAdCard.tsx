"use client";

import { useEffect, useRef } from "react";

export default function BannerAdCard({ adId, isActive }: { adId: string; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!isActive || hasLoaded.current) return;
    const container = containerRef.current;
    if (!container) return;

    hasLoaded.current = true;

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.scrolling = "no";
    container.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
        </head>
        <body>
          <script>
            (function(vwl){
              var d = document,
                  s = d.createElement('script'),
                  l = d.scripts[d.scripts.length - 1];
              s.settings = vwl || {};
              s.src = "//miserly-wrap.com/bNX.VtsNdgGYl/0bYFWocI/Me_mW9/u/Z/UXlxkvPjTCcCxhOUDSgt2/OJDIk/tsNzzNE/4fOpDOYL5xMOwu";
              s.async = true;
              s.referrerPolicy = 'no-referrer-when-downgrade';
              l.parentNode.insertBefore(s, l);
            })({});
          </script>
        </body>
      </html>
    `);
    doc.close();
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="native-ad-card"
      style={{ width: "100%", height: "100%" }}
    />
  );
}