import type { Metadata } from "next";
import Script from "next/script";
import Providers from "./Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jardín Esperanza | Inventario Floral",
  description: "Catálogo e inventario para venta de flores y plantas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="es"
      className="h-full antialiased"
      data-force-motion="true"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script
          id="hydration-attr-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var attrs = ["bis_skin_checked", "fdprocessedid", "bis_register"];
  function shouldStripAttr(attrName) {
    if (!attrName) return false;
    if (attrs.indexOf(attrName) !== -1) return true;
    if (attrName.indexOf("__processed_") === 0) return true;
    if (attrName.indexOf("bis_") === 0) return true;
    return false;
  }
  function cleanNode(root) {
    if (!root) return;
    if (root.nodeType === 1) {
      if (root.attributes && root.attributes.length) {
        for (var a = root.attributes.length - 1; a >= 0; a--) {
          var attrName = root.attributes[a].name;
          if (shouldStripAttr(attrName)) {
            root.removeAttribute(attrName);
          }
        }
      }
    }
    if (!root.querySelectorAll) return;
    var nodes = root.querySelectorAll("*");
    for (var n = 0; n < nodes.length; n++) cleanNode(nodes[n]);
  }

  cleanNode(document.documentElement);

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === "attributes" && m.target && m.attributeName) {
        if (shouldStripAttr(m.attributeName)) {
          m.target.removeAttribute(m.attributeName);
        }
      }
      if (m.type === "childList" && m.addedNodes && m.addedNodes.length) {
        for (var c = 0; c < m.addedNodes.length; c++) {
          cleanNode(m.addedNodes[c]);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });

  window.addEventListener("DOMContentLoaded", function () {
    cleanNode(document.documentElement);
  });

  setTimeout(function () {
    observer.disconnect();
  }, 12000);
})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
