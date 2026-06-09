import { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Shop — MystiqueHaiven",
  description:
    "Official MystiqueHaiven merchandise. Every purchase includes one year of platform access and a 60-day Exclusive trial.",
  openGraph: {
    title: "Shop — MystiqueHaiven",
    description:
      "Official MystiqueHaiven merchandise. Every purchase includes one year of platform access and a 60-day Exclusive trial.",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrintifyImage {
  src: string;
  is_default: boolean;
  position: string;
}

interface PrintifyVariant {
  id: number;
  price: number; // in cents
  is_enabled: boolean;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: PrintifyImage[];
  variants: PrintifyVariant[];
  external: {
    id: string;
    handle: string;
  } | null;
  visible: boolean;
}

interface PrintifyProductsResponse {
  data: PrintifyProduct[];
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function getProducts(): Promise<PrintifyProduct[]> {
  const res = await fetch(
    `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json?limit=20`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "User-Agent": "MystiqueHaiven",
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    }
  );

  if (!res.ok) {
    console.error("[store] Printify fetch failed:", res.status);
    return [];
  }

  const data: PrintifyProductsResponse = await res.json();

  // Only show published, visible products with a Pop-Up Store handle
  return data.data.filter((p) => p.visible && p.external?.handle);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultImage(images: PrintifyImage[]): string {
  return (
    images.find((img) => img.is_default)?.src ??
    images[0]?.src ??
    "/placeholder.jpg"
  );
}

function getStartingPrice(variants: PrintifyVariant[]): number | null {
  const enabled = variants
    .filter((v) => v.is_enabled)
    .map((v) => v.price);
  if (!enabled.length) return null;
  return Math.min(...enabled);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildCheckoutUrl(handle: string): string {
  // Printify provides the full URL in external.handle
  if (handle.startsWith("http")) return handle;
  const store = process.env.PRINTIFY_POPUP_SLUG;
  return `https://${store}.printify.me/product/${handle}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <p style={styles.eyebrow}>MystiqueHaiven</p>
        <h1 style={styles.heading}>Shop</h1>
        <p style={styles.subheading}>
          Every purchase includes one year of Standard access
          and a 60-day Exclusive trial.
        </p>
      </div>

      {products.length === 0 ? (
        <p style={styles.empty}>No products available right now.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => {
            const image = getDefaultImage(product.images);
            const price = getStartingPrice(product.variants);
            const url = buildCheckoutUrl(product.external!.handle);

            return (
              <a
                key={product.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.card}
              >
                <div style={styles.imageWrapper}>
                  <img
                    src={image}
                    alt={product.title}
                    style={styles.image}
                  />
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.productTitle}>{product.title}</p>
                  {price !== null && (
                    <p style={styles.price}>
                      From {formatPrice(price)}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      <div style={styles.footer}>
        <p style={styles.footerText}>
          After your purchase, check your email for a redemption code to activate
          your platform access at{" "}
          <a href="/redeem" style={styles.footerLink}>
            mystiquehaiven.com/redeem
          </a>
          .
        </p>
      </div>
    </main>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0d0d0d",
    padding: "80px 24px 120px",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  header: {
    maxWidth: 720,
    margin: "0 auto 64px",
    textAlign: "center",
  },
  eyebrow: {
    margin: "0 0 16px",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#c8a97e",
    fontFamily: "'Josefin Sans', sans-serif",
  },
  heading: {
    margin: "0 0 16px",
    fontSize: 48,
    fontWeight: 400,
    color: "#e8d8c0",
    letterSpacing: "0.04em",
  },
  subheading: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.75,
    color: "#807060",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 32,
    maxWidth: 1200,
    margin: "0 auto",
  },
  card: {
    display: "block",
    textDecoration: "none",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 4,
    overflow: "hidden",
    transition: "border-color 0.2s",
    cursor: "pointer",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#1a1a1a",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s ease",
  },
  cardBody: {
    padding: "20px 24px 24px",
  },
  productTitle: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 400,
    color: "#e8d8c0",
    lineHeight: 1.3,
  },
  price: {
    margin: 0,
    fontSize: 13,
    letterSpacing: "0.08em",
    color: "#c8a97e",
    fontFamily: "'Josefin Sans', sans-serif",
  },
  empty: {
    textAlign: "center",
    color: "#4a4030",
    fontSize: 15,
    marginTop: 80,
  },
  footer: {
    maxWidth: 560,
    margin: "80px auto 0",
    textAlign: "center",
  },
  footerText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.75,
    color: "#4a4030",
  },
  footerLink: {
    color: "#c8a97e",
    textDecoration: "none",
  },
};