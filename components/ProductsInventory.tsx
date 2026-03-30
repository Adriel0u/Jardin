"use client";

import {
  CSSProperties,
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { signOut } from "next-auth/react";
import { Product } from "@/lib/types";
import SplashFlower from "@/components/SplashFlower";

type ProductForm = {
  producto: string;
  costo: string;
  venta: string;
  tipo: string;
  imagen: string;
};

type SortKey = "producto" | "tipo" | "venta" | "costo";
type SortDirection = "asc" | "desc";

const emptyForm: ProductForm = {
  producto: "",
  costo: "",
  venta: "",
  tipo: "General",
  imagen: "",
};

const ADMIN_PAGE_SIZE = 10;

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50300000000";

function getProductWhatsAppUrl(productName: string): string {
  const message = `Hola Jardín Esperanza, me interesa la planta: *${productName}* 🌿 ¿Me pueden dar más información?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function getGeneralWhatsAppUrl(): string {
  const message = "Hola Jardín Esperanza 🌿 ¿Me pueden ayudar?";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

type Props = {
  initialProducts: Product[];
  adminMode?: boolean;
};

export default function ProductsInventory({ initialProducts, adminMode = false }: Props) {
  const revealObserverRef = useRef<IntersectionObserver | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);
  const isAdmin = adminMode;
  const [isScrolled, setIsScrolled] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedType, setSelectedType] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [catalogEntered, setCatalogEntered] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [saveSuccessAnimation, setSaveSuccessAnimation] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [sortKey, setSortKey] = useState<SortKey>("producto");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineForm, setInlineForm] = useState<ProductForm>(emptyForm);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((item) => item.tipo?.trim() || "General")
          .filter((type) => type.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return products.filter((item) => {
      const nameMatches = !term || item.producto.toLowerCase().includes(term);
      const typeMatches =
        selectedType === "Todos" || (item.tipo?.trim() || "General") === selectedType;
      return nameMatches && typeMatches;
    });
  }, [products, deferredSearch, selectedType]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce<Record<string, Product[]>>((groups, item) => {
      const type = item.tipo?.trim() || "General";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(item);
      return groups;
    }, {});
  }, [filteredProducts]);

  const sortedAdminProducts = useMemo(() => {
    if (!isAdmin) return filteredProducts;

    const parsePrice = (value: string): number => {
      const normalized = (value || "").replace(/[^\d.,-]/g, "").replace(",", ".");
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
    };

    const values = [...filteredProducts];
    values.sort((a, b) => {
      let result = 0;
      if (sortKey === "venta" || sortKey === "costo") {
        const aValue = parsePrice(a[sortKey]);
        const bValue = parsePrice(b[sortKey]);
        result = aValue - bValue;
      } else {
        const aValue = (a[sortKey] || "").toLowerCase();
        const bValue = (b[sortKey] || "").toLowerCase();
        result = aValue.localeCompare(bValue, "es");
      }

      return sortDirection === "asc" ? result : -result;
    });

    return values;
  }, [filteredProducts, isAdmin, sortDirection, sortKey]);

  const totalAdminPages = Math.max(1, Math.ceil(sortedAdminProducts.length / ADMIN_PAGE_SIZE));

  const paginatedAdminProducts = useMemo(() => {
    if (!isAdmin) return sortedAdminProducts;
    const start = (currentPage - 1) * ADMIN_PAGE_SIZE;
    return sortedAdminProducts.slice(start, start + ADMIN_PAGE_SIZE);
  }, [currentPage, isAdmin, sortedAdminProducts]);

  useEffect(() => {
    setIsFiltering(true);
    const timer = window.setTimeout(() => setIsFiltering(false), 220);
    return () => window.clearTimeout(timer);
  }, [deferredSearch, selectedType, products.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, selectedType, sortKey, sortDirection]);

  useEffect(() => {
    if (currentPage > totalAdminPages) {
      setCurrentPage(totalAdminPages);
    }
  }, [currentPage, totalAdminPages]);

  useEffect(() => {
    setShowSplash(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showSplash ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSplash]);

  useEffect(() => {
    revealObserverRef.current?.disconnect();

    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ).filter((element) => !element.classList.contains("is-visible"));

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" },
    );
    revealObserverRef.current = observer;

    revealElements.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${Math.min(index * 45, 280)}ms`);

      const rect = element.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight * 0.92;
      if (inViewport) {
        element.classList.add("is-visible");
        return;
      }

      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      if (revealObserverRef.current === observer) {
        revealObserverRef.current = null;
      }
    };
  }, [products, filteredProducts.length, isModalOpen]);

  useEffect(() => {
    const parallaxElement = document.querySelector<HTMLElement>("[data-parallax]");
    if (!parallaxElement) return;

    let ticking = false;

    const updateParallax = () => {
      const offset = Math.min(window.scrollY * 0.12, 36);
      parallaxElement.style.setProperty("--hero-parallax-y", `${offset}px`);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (catalogEntered) return;
    const section = catalogRef.current;
    if (!section) return;

    const triggerCatalogAnimation = () => setCatalogEntered(true);
    const immediateCheck = window.setTimeout(() => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.9) {
        triggerCatalogAnimation();
      }
    }, 300);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            triggerCatalogAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    observer.observe(section);

    return () => {
      window.clearTimeout(immediateCheck);
      observer.disconnect();
    };
  }, [catalogEntered]);

  async function reloadProducts() {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("No se pudo refrescar el inventario.");
    }
    const data = (await response.json()) as Product[];
    setProducts(data);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("No se pudo agregar el producto.");
      }

      await reloadProducts();
      setSaveSuccessAnimation(true);
      window.setTimeout(() => {
        setForm(emptyForm);
        setIsModalOpen(false);
        setSaveSuccessAnimation(false);
      }, 1500);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setIsModalOpen(true);
    setForm({
      producto: product.producto,
      costo: product.costo,
      venta: product.venta,
      tipo: product.tipo || "General",
      imagen: product.imagen || "",
    });
    setError("");
  }

  function startCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setSaveSuccessAnimation(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el producto.");
      }

      await reloadProducts();
      setSaveSuccessAnimation(true);
      window.setTimeout(() => {
        setEditingProduct(null);
        setForm(emptyForm);
        setIsModalOpen(false);
        setSaveSuccessAnimation(false);
      }, 1500);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, productName: string) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar "${productName}" del inventario?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el producto.");
      }

      await reloadProducts();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File) {
    setImageUploading(true);
    setError("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch("/api/uploads/image", {
        method: "POST",
        body: uploadData,
      });

      const payload = (await response.json()) as { imageUrl?: string; error?: string };
      if (!response.ok || !payload.imageUrl) {
        throw new Error(payload.error || "No se pudo subir la imagen.");
      }

      setForm((current) => ({ ...current, imagen: payload.imageUrl || "" }));
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado.";
      setError(message);
    } finally {
      setImageUploading(false);
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function startInlineEdit(product: Product) {
    setInlineEditingId(product.id);
    setInlineForm({
      producto: product.producto,
      costo: product.costo,
      venta: product.venta,
      tipo: product.tipo || "General",
      imagen: product.imagen || "",
    });
    setError("");
  }

  function cancelInlineEdit() {
    setInlineEditingId(null);
    setInlineForm(emptyForm);
  }

  async function saveInlineEdit(productId: number) {
    setInlineSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inlineForm),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el producto.");
      }

      await reloadProducts();
      cancelInlineEdit();
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Error inesperado.";
      setError(message);
    } finally {
      setInlineSaving(false);
    }
  }

  function openProductDetails(product: Product) {
    setSelectedProduct(product);
  }

  function closeProductDetails() {
    setSelectedProduct(null);
  }

  function getProductPhoto(product: Product): string {
    if (product.imagen?.trim()) {
      return product.imagen.trim();
    }

    const type = (product.tipo || "general").toLowerCase();
    if (type.includes("frut")) {
      return "https://images.unsplash.com/photo-1519996521438-15b2b9f02e9c?auto=format&fit=crop&w=900&q=80";
    }
    if (type.includes("hierb") || type.includes("medic")) {
      return "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80";
    }
    if (type.includes("insumo")) {
      return "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80";
    }
    return "https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=900&q=80";
  }

  function getProductDescription(product: Product): string {
    const type = product.tipo || "General";
    const sale = product.venta && product.venta !== "-" ? product.venta : "por consultar";
    const cost = product.costo && product.costo !== "-" ? product.costo : "no especificado";
    return `${product.producto} pertenece a la categoría ${type}. Su precio de venta es ${sale} y su costo de referencia es ${cost}. Si deseas disponibilidad, tamaño o recomendaciones de cuidado, escríbenos por WhatsApp.`;
  }

  function getChipTargetType(chip: string): string | null {
    const lower = chip.toLowerCase();
    const matched = availableTypes.find((type) => {
      const value = type.toLowerCase();
      if (lower === "flores") return value.includes("ornament");
      if (lower === "hierbas") return value.includes("hierb") || value.includes("medic");
      if (lower === "frutales") return value.includes("frut");
      if (lower === "interior") return value.includes("interior") || value.includes("ornament");
      if (lower === "exterior") return value.includes("exterior");
      return value.includes(lower);
    });

    return matched ?? null;
  }

  const submitAction = editingProduct ? handleUpdate : handleCreate;

  return (
    <div suppressHydrationWarning className="site page-ambient bg-[var(--cream)] text-[var(--text-dark)]">
      {showSplash ? (
        <SplashFlower onDone={() => setShowSplash(false)} />
      ) : null}

      <nav suppressHydrationWarning
        className={`je-nav sticky top-0 z-40 border-b border-[var(--pink-soft)] bg-white/95 backdrop-blur-md transition-all duration-300 ${
          isScrolled ? "shadow-[0_8px_20px_rgba(26,46,32,0.08)]" : ""
        }`}
      >
        <div suppressHydrationWarning className="je-nav-inner mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-4 md:px-8">
          <div suppressHydrationWarning className="je-nav-logo flex items-center gap-3">
            <div suppressHydrationWarning className="je-nav-badge flex h-9 w-9 items-center justify-center rounded-full bg-[var(--green-dark)]">
              <span className="font-display text-2xl leading-none text-white">e</span>
            </div>
            <p className="je-nav-name font-display text-2xl text-[var(--green-dark)]">
              Jardin Esperanza
            </p>
          </div>
          <div suppressHydrationWarning className="je-nav-links flex items-center gap-6 text-[0.85rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            <a href="#inicio" className="nav-link transition hover:text-[var(--green-dark)]">
              Inicio
            </a>
            <a
              href="#catalogo"
              className="nav-link transition hover:text-[var(--green-dark)]"
            >
              Catalogo
            </a>
            {isAdmin ? (
              <a
                href="#inventario"
                className="nav-link transition hover:text-[var(--green-dark)]"
              >
                Inventario
              </a>
            ) : null}
            {isAdmin ? (
              <div className="ml-2 flex items-center gap-3 normal-case tracking-normal">
                <span className="text-[0.8rem] text-[#a8c5a0]">Admin</span>
                <button suppressHydrationWarning
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-transparent text-[0.8rem] text-[#6b7e6f] transition hover:text-[var(--green-dark)]"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <section
        id="inicio"
        data-reveal
        className="je-hero reveal-on-scroll mx-auto grid min-h-[88vh] w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:px-8"
      >
        <div className="particles" aria-hidden>
          <div className="p petal ph1" />
          <div suppressHydrationWarning className="p leaf ph2" />
          <div className="p heart ph3" />
          <div className="p petal ph4" />
          <div suppressHydrationWarning className="p leaf ph5" />
          <div suppressHydrationWarning className="p heart ph6" />
          <div suppressHydrationWarning className="p petal ph7" />
          <div className="p leaf ph8" />
          <div className="p petal ph9" />
          <div className="p heart ph10" />
          <div className="p leaf ph11" />
          <div className="p petal ph12" />
          <div className="p leaf ph13" />
          <div className="p petal ph14" />
          <div className="p heart ph15" />
          <div className="p petal ph16" />
          <div className="p leaf ph17" />
          <div className="p petal ph18" />
          <div className="p heart ph19" />
          <div className="p petal ph20" />
        </div>
        <div className="je-hero-left relative flex items-center">
          <div
            data-parallax
            className="hero-glow absolute -right-32 top-0 h-[400px] w-[400px] rounded-full bg-[var(--pink-pale)] transition-transform duration-150"
          />
          <div className="relative z-10">
            <p className="je-hero-tag text-[0.75rem] uppercase tracking-[0.2em] text-[var(--green-mid)]">
              Plantas & Flores · El Salvador
            </p>
            <h1 className="je-hero-h1 mt-6 font-display text-[3.2rem] leading-[1.05] text-[var(--green-dark)] md:text-[4.2rem]">
              Lleva la <em className="italic text-[var(--green-mid)]">naturaleza</em>{" "}
              a tu hogar
            </h1>
            <p className="je-hero-p mt-6 max-w-[380px] text-[1.02rem] leading-[1.8] font-light text-[var(--text-muted)]">
              Cuidamos cada detalle para que encuentres flores y plantas con vida,
              color y esencia natural para tus espacios.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button suppressHydrationWarning
                type="button"
                className="je-hero-btn btn-animated rounded-[2px] bg-[var(--green-dark)] px-9 py-3.5 text-[0.78rem] uppercase tracking-[0.1em] text-white transition hover:bg-[var(--green-mid)]"
                onClick={() =>
                  document
                    .getElementById("catalogo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Ver catalogo
              </button>
              <button suppressHydrationWarning
                type="button"
                className="btn-animated rounded-[2px] border-[1.5px] border-[var(--green-dark)] bg-transparent px-9 py-3.5 text-[0.78rem] uppercase tracking-[0.1em] text-[var(--green-dark)] transition hover:bg-[var(--green-xlight)]"
                hidden={!isAdmin}
                onClick={() =>
                  document
                    .getElementById("inventario")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Gestionar inventario
              </button>
            </div>
          </div>
        </div>

        <div className="je-hero-right flex items-center justify-center">
          <div className="je-quote-card float-gentle w-full max-w-[460px] rounded-[20px] border border-[var(--pink-soft)] bg-white p-10 shadow-[0_14px_38px_rgba(45,106,63,0.08)]">
            <div className="logo-pop mx-auto h-[90px] w-[90px]">
              <svg viewBox="0 0 140 140" className="h-full w-full">
                <defs>
                  <path
                    id="arc-text"
                    d="M 22 74 A 48 48 0 0 1 118 74"
                    fill="none"
                  />
                </defs>
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  fill="var(--cream)"
                  stroke="var(--pink-soft)"
                  strokeWidth="2"
                />
                <text
                  x="70"
                  y="88"
                  textAnchor="middle"
                  className="font-display"
                  style={{ fill: "var(--green-dark)", fontSize: "86px", lineHeight: 1 }}
                >
                  e
                </text>
                <text
                  className="font-body"
                  style={{
                    fill: "var(--green-light)",
                    fontSize: "11px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  <textPath href="#arc-text" startOffset="12%">
                    garden
                  </textPath>
                </text>
              </svg>
            </div>
            <p className="mt-7 text-center font-display text-[1.3rem] leading-[1.4] italic text-[var(--green-dark)]">
              Queremos compartir contigo el corazon de este proyecto
            </p>
            <p className="mt-5 text-center text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              — Jardin Esperanza
            </p>
          </div>
        </div>
      </section>

      <section
        id="catalogo"
        data-reveal
        className="je-catalog reveal-on-scroll bg-white px-4 py-16 md:px-8"
        ref={catalogRef}
      >
        <div className="catalog-sow-wrapper mx-auto w-full max-w-6xl">
          <div className={`catalog-soil-line ${catalogEntered ? "is-grown" : ""}`} />
          <span className="float-leaf float-leaf-a" aria-hidden />
          <span className="float-leaf float-leaf-b" aria-hidden />
          <header className="cat-header text-center">
            <p
              className={`cat-super catalog-label text-[0.75rem] uppercase tracking-[0.15em] text-[var(--green-mid)] ${
                catalogEntered ? "is-visible" : ""
              }`}
            >
              Nuestros productos
            </p>
            <h2
              className={`cat-h2 catalog-title mt-3 font-display text-[2.4rem] text-[var(--text-dark)] ${
                catalogEntered ? "is-visible" : ""
              }`}
            >
              Catalogo de plantas
            </h2>
          </header>

          <div className="search-shell group mx-auto mt-8 flex max-w-[420px] items-center rounded-[50px] border-[1.5px] border-[var(--green-light)] bg-white px-4 py-2.5 transition focus-within:border-[var(--green-mid)]">
            <svg
              viewBox="0 0 20 20"
              className={`search-icon mr-3 h-5 w-5 text-[var(--green-light)] ${
                isSearchFocused ? "is-active" : ""
              }`}
              fill="none"
              aria-hidden
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M13.5 13.5L17 17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="w-full border-none bg-transparent text-[0.98rem] text-[var(--text-dark)] outline-none placeholder:text-[var(--text-muted)]"
              type="text"
              placeholder="Buscar planta..."
              value={search}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                if (!search.trim()) {
                  setIsSearchFocused(false);
                }
              }}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {isSearchFocused ? (
            <div className="mx-auto mt-3 flex w-full max-w-[960px] flex-wrap items-center gap-2">
              {["Interior", "Flores", "Hierbas", "Exterior", "Frutales"].map(
                (chip, index) => (
                  <button suppressHydrationWarning
                    key={chip}
                    type="button"
                    className="search-chip"
                    style={{ "--chip-delay": `${index * 100}ms` } as CSSProperties}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const targetType = getChipTargetType(chip);
                      setSelectedType(targetType ?? "Todos");
                    }}
                  >
                    {chip}
                  </button>
                ),
              )}
            </div>
          ) : null}

          <div className="filters mx-auto mt-4 flex w-full max-w-[960px] flex-wrap items-center gap-2">
            <span className="text-[0.72rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Tipo:
            </span>
            <button suppressHydrationWarning
              type="button"
              onClick={() => setSelectedType("Todos")}
              className={`filter-btn rounded-full border px-3 py-1 text-[0.74rem] transition ${
                selectedType === "Todos" ? "active" : ""
              } ${
                selectedType === "Todos"
                  ? "border-[var(--green-mid)] bg-[var(--green-xlight)] text-[var(--green-mid)]"
                  : "border-[var(--pink-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--green-light)]"
              }`}
            >
              Todos
            </button>
            {availableTypes.map((type) => (
              <button suppressHydrationWarning
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`filter-btn rounded-full border px-3 py-1 text-[0.74rem] transition ${
                  selectedType === type ? "active" : ""
                } ${
                  selectedType === type
                    ? "border-[var(--green-mid)] bg-[var(--green-xlight)] text-[var(--green-mid)]"
                    : "border-[var(--pink-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--green-light)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {isAdmin ? (
            <div
              id="inventario"
              className="mx-auto mt-8 flex w-full max-w-[960px] justify-end"
            >
              <button suppressHydrationWarning
                type="button"
                onClick={startCreate}
                className="btn-animated rounded-md bg-[var(--green-dark)] px-4 py-2.5 text-[0.85rem] text-white transition hover:bg-[var(--green-mid)]"
              >
                + Agregar producto
              </button>
            </div>
          ) : null}

          <div className="mx-auto mt-6 w-full max-w-[960px]">
            {error ? (
              <p className="mb-4 rounded-md border border-[var(--pink-soft)] bg-[var(--pink-pale)] px-3 py-2 text-sm text-[var(--text-dark)]">
                {error}
              </p>
            ) : null}
            <p
              key={`${filteredProducts.length}-${products.length}`}
              className="count-fade mb-4 text-sm text-[var(--text-muted)]"
            >
              Mostrando {filteredProducts.length} de {products.length} productos.
            </p>
          </div>

          {isAdmin ? (
            <div
              className={`mx-auto mt-2 w-full max-w-[960px] transition-all duration-300 ${
                isFiltering ? "opacity-75" : "opacity-100"
              }`}
            >
              <div className="overflow-hidden rounded-xl border border-[var(--pink-soft)] bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-[var(--cream)]">
                      <tr className="text-[0.72rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        <th className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            onClick={() => toggleSort("producto")}
                            className="inline-flex items-center gap-1"
                          >
                            Producto
                            {sortKey === "producto"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            onClick={() => toggleSort("tipo")}
                            className="inline-flex items-center gap-1"
                          >
                            Tipo
                            {sortKey === "tipo"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            onClick={() => toggleSort("venta")}
                            className="inline-flex items-center gap-1"
                          >
                            Venta
                            {sortKey === "venta"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            onClick={() => toggleSort("costo")}
                            className="inline-flex items-center gap-1"
                          >
                            Costo
                            {sortKey === "costo"
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : ""}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">Imagen</th>
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAdminProducts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-center text-sm text-[var(--text-muted)]"
                          >
                            No hay productos para mostrar con estos filtros.
                          </td>
                        </tr>
                      ) : (
                        paginatedAdminProducts.map((item) => (
                          <tr
                            key={`${item.id}-${deferredSearch}-${selectedType}`}
                            className="border-t border-[var(--pink-soft)] text-[0.92rem]"
                          >
                            <td className="px-4 py-3">
                              {inlineEditingId === item.id ? (
                                <input
                                  className="w-full rounded border border-[#e0ddd8] px-2 py-1.5 text-sm outline-none focus:border-[var(--green-mid)]"
                                  value={inlineForm.producto}
                                  onChange={(event) =>
                                    setInlineForm((current) => ({
                                      ...current,
                                      producto: event.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openProductDetails(item)}
                                  className="text-left font-medium text-[var(--text-dark)] transition hover:text-[var(--green-mid)]"
                                >
                                  {item.producto}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">
                              {inlineEditingId === item.id ? (
                                <input
                                  className="w-full rounded border border-[#e0ddd8] px-2 py-1.5 text-sm outline-none focus:border-[var(--green-mid)]"
                                  value={inlineForm.tipo}
                                  onChange={(event) =>
                                    setInlineForm((current) => ({
                                      ...current,
                                      tipo: event.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                item.tipo || "General"
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--green-mid)]">
                              {inlineEditingId === item.id ? (
                                <input
                                  className="w-full rounded border border-[#e0ddd8] px-2 py-1.5 text-sm outline-none focus:border-[var(--green-mid)]"
                                  value={inlineForm.venta}
                                  onChange={(event) =>
                                    setInlineForm((current) => ({
                                      ...current,
                                      venta: event.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                item.venta || "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">
                              {inlineEditingId === item.id ? (
                                <input
                                  className="w-full rounded border border-[#e0ddd8] px-2 py-1.5 text-sm outline-none focus:border-[var(--green-mid)]"
                                  value={inlineForm.costo}
                                  onChange={(event) =>
                                    setInlineForm((current) => ({
                                      ...current,
                                      costo: event.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                item.costo || "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-muted)]">
                              {inlineEditingId === item.id ? (
                                <input
                                  className="w-full min-w-[220px] rounded border border-[#e0ddd8] px-2 py-1.5 text-sm outline-none focus:border-[var(--green-mid)]"
                                  value={inlineForm.imagen}
                                  onChange={(event) =>
                                    setInlineForm((current) => ({
                                      ...current,
                                      imagen: event.target.value,
                                    }))
                                  }
                                  placeholder="https://..."
                                />
                              ) : item.imagen ? (
                                <a
                                  href={item.imagen}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-[0.78rem] text-[var(--green-mid)] underline-offset-2 hover:underline"
                                >
                                  <span>Ver</span>
                                </a>
                              ) : (
                                <span className="text-[0.78rem] text-[var(--text-muted)]">Sin imagen</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {inlineEditingId === item.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => saveInlineEdit(item.id)}
                                      disabled={inlineSaving}
                                      className="btn-animated rounded-[6px] border border-[var(--green-light)] bg-[var(--green-xlight)] px-3 py-1.5 text-[0.75rem] text-[var(--green-mid)] transition hover:bg-[var(--green-xlight)] disabled:opacity-70"
                                    >
                                      {inlineSaving ? "Guardando..." : "Guardar"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelInlineEdit}
                                      disabled={inlineSaving}
                                      className="btn-animated rounded-[6px] border border-[var(--pink-soft)] bg-transparent px-3 py-1.5 text-[0.75rem] text-[var(--text-muted)] transition hover:bg-[var(--pink-pale)] disabled:opacity-70"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(item)}
                                      className="btn-animated rounded-[6px] border border-[var(--green-light)] bg-transparent px-3 py-1.5 text-[0.75rem] text-[var(--green-mid)] transition hover:bg-[var(--green-xlight)]"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startEdit(item)}
                                      className="btn-animated rounded-[6px] border border-[var(--green-light)] bg-transparent px-3 py-1.5 text-[0.75rem] text-[var(--green-mid)] transition hover:bg-[var(--green-xlight)]"
                                    >
                                      Modal
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id, item.producto)}
                                  className="btn-animated rounded-[6px] border border-[var(--pink-soft)] bg-transparent px-3 py-1.5 text-[0.75rem] text-[#c0707a] transition hover:bg-[var(--pink-pale)]"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>
                  Pagina {currentPage} de {totalAdminPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded border border-[var(--pink-soft)] px-3 py-1 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalAdminPages, page + 1))
                    }
                    disabled={currentPage === totalAdminPages}
                    className="rounded border border-[var(--pink-soft)] px-3 py-1 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`mx-auto mt-2 w-full max-w-[960px] space-y-6 transition-all duration-300 ${
                isFiltering ? "opacity-75" : "opacity-100"
              }`}
            >
              {Object.entries(groupedProducts)
                .sort(([typeA], [typeB]) => typeA.localeCompare(typeB, "es"))
                .map(([type, items], groupIndex) => (
                  <section key={type}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full border border-[var(--green-light)] bg-[var(--green-xlight)] px-3 py-1 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--green-mid)]">
                        {type}
                      </span>
                      <span className="text-[0.72rem] text-[var(--text-muted)]">
                        {items.length} producto{items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="cards-grid catalog-grid grid gap-[1.2rem] [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                      {items.map((item, index) => (
                        <article
                          key={`${item.id}-${deferredSearch}-${selectedType}`}
                          className="plant-card product-card card-in group cursor-pointer rounded-xl border border-[var(--pink-soft)] bg-white px-[1.2rem] py-[1.4rem] transition duration-300 hover:-translate-y-[4px] hover:border-[var(--green-light)]"
                          style={
                            {
                              "--card-delay": `${Math.min((groupIndex * 3 + index) * 36, 260)}ms`,
                              "--card-seed-delay": `${Math.min(
                                120 + (groupIndex * 6 + index) * 60,
                                1200,
                              )}ms`,
                              "--sprout-delay": `${Math.min(
                                120 + (groupIndex * 6 + index) * 60,
                                1200,
                              )}ms`,
                            } as CSSProperties
                          }
                          onClick={() => openProductDetails(item)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openProductDetails(item);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="mc-sprout" aria-hidden>
                            <span className="mc-sprout-stem" />
                            <span className="mc-sprout-bud" />
                          </span>
                          <span className="card-leaf" aria-hidden>
                            <svg viewBox="0 0 60 60">
                              <path d="M30 4 C12 14 6 34 30 56 C54 34 48 14 30 4Z" fill="#a8c5a0" />
                              <line x1="30" y1="7" x2="30" y2="53" stroke="#4a7c59" strokeWidth="1.5" />
                              <line x1="30" y1="20" x2="20" y2="30" stroke="#4a7c59" strokeWidth="1" />
                              <line x1="30" y1="30" x2="40" y2="38" stroke="#4a7c59" strokeWidth="1" />
                            </svg>
                          </span>
                          <div className="mb-3 overflow-hidden rounded-lg border border-[var(--pink-soft)] bg-[var(--cream)]">
                            <div className="relative h-28 w-full">
                              <img
                                src={getProductPhoto(item)}
                                alt={item.producto}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                          <h3 className="card-name mt-1 font-display text-[1rem] leading-[1.3] text-[var(--text-dark)]">
                            {item.producto}
                          </h3>
                          <p className="card-type mt-1 text-[0.72rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            Tipo: {item.tipo || "General"}
                          </p>
                          <p className="card-price mt-3 text-[1.2rem] font-normal text-[var(--green-mid)]">
                            {item.venta || "-"}
                          </p>
                          <p className="mt-[2px] text-[0.75rem] text-[var(--text-muted)]">
                            Costo: {item.costo || "-"}
                          </p>
                          <a
                            href={getProductWhatsAppUrl(item.producto)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="wa-btn mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-3 py-[0.45rem] text-[0.78rem]"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Consultar por WhatsApp
                            <span className="ripple-el" />
                          </a>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      </section>

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 modal-overlay-in"
          onClick={closeProductDetails}
        >
          <article
            className="modal-pop-in w-full max-w-[520px] overflow-hidden rounded-2xl border border-[var(--pink-soft)] bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="h-[220px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${getProductPhoto(selectedProduct)}")` }}
              role="img"
              aria-label={selectedProduct.producto}
            />
            <div className="p-6">
              <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Tipo: {selectedProduct.tipo || "General"}
              </p>
              <h3 className="mt-2 font-display text-[1.6rem] leading-[1.2] text-[var(--text-dark)]">
                {selectedProduct.producto}
              </h3>
              <p className="mt-3 text-[0.92rem] leading-[1.7] text-[var(--text-muted)]">
                {getProductDescription(selectedProduct)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-[var(--pink-soft)] bg-[var(--cream)] px-3 py-2">
                  <p className="text-[0.68rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Venta
                  </p>
                  <p className="mt-1 text-[1rem] text-[var(--green-mid)]">
                    {selectedProduct.venta || "-"}
                  </p>
                </div>
                <div className="rounded-md border border-[var(--pink-soft)] bg-[var(--cream)] px-3 py-2">
                  <p className="text-[0.68rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Costo
                  </p>
                  <p className="mt-1 text-[1rem] text-[var(--green-mid)]">
                    {selectedProduct.costo || "-"}
                  </p>
                </div>
              </div>

              <a
                href={getProductWhatsAppUrl(selectedProduct.producto)}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-btn mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-3 py-[0.45rem] text-[0.78rem]"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar por WhatsApp
              </a>

              <button suppressHydrationWarning
                type="button"
                onClick={closeProductDetails}
                className="btn-animated mt-2 w-full rounded-[6px] border border-[var(--pink-soft)] bg-white px-3 py-[0.45rem] text-[0.78rem] text-[var(--text-muted)]"
              >
                Cerrar
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {isModalOpen && isAdmin ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 modal-overlay-in"
          onClick={closeModal}
        >
          <div
            className="modal-pop-in w-full max-w-[400px] rounded-2xl border border-[var(--pink-soft)] bg-white p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-[1.4rem] text-[var(--text-dark)]">
              {editingProduct ? "Editar producto" : "Agregar producto"}
            </h3>
            <form className="mt-5 space-y-4" onSubmit={submitAction}>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Nombre
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[var(--green-mid)]"
                  type="text"
                  value={form.producto}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, producto: event.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Tipo de planta
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[var(--green-mid)]"
                  type="text"
                  value={form.tipo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tipo: event.target.value }))
                  }
                  placeholder="Ej: Ornamentales, Medicinales, Frutales..."
                  required
                />
              </div>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Costo ($)
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[var(--green-mid)]"
                  type="text"
                  value={form.costo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, costo: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Precio de venta ($)
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[var(--green-mid)]"
                  type="text"
                  value={form.venta}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, venta: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Imagen (URL)
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3.5 py-2.5 outline-none focus:border-[var(--green-mid)]"
                  type="url"
                  value={form.imagen}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, imagen: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-[0.8rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  Subir imagen
                </label>
                <input
                  className="mt-1.5 w-full rounded-md border-[1.5px] border-[#e0ddd8] px-3 py-2.5 text-sm outline-none focus:border-[var(--green-mid)]"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={imageUploading || loading || saveSuccessAnimation}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (!selectedFile) return;
                    uploadImage(selectedFile);
                    event.currentTarget.value = "";
                  }}
                />
                <p className="mt-1 text-[0.72rem] text-[var(--text-muted)]">
                  {imageUploading
                    ? "Subiendo imagen..."
                    : "En celular puedes elegir camara o galeria."}
                </p>
                {form.imagen ? (
                  <a
                    href={form.imagen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-[0.78rem] text-[var(--green-mid)] underline-offset-2 hover:underline"
                  >
                    Ver imagen cargada
                  </a>
                ) : null}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button suppressHydrationWarning
                  type="button"
                  onClick={closeModal}
                  className="btn-animated rounded-[50px] border-[1.5px] border-[#e0ddd8] bg-transparent px-5 py-2.5 text-[var(--text-muted)]"
                  disabled={saveSuccessAnimation}
                >
                  Cancelar
                </button>
                <button suppressHydrationWarning
                  type="submit"
                  disabled={loading || saveSuccessAnimation}
                  className={`btn-animated rounded-[50px] border-none bg-[var(--green-dark)] px-5 py-2.5 text-white disabled:opacity-70 ${
                    saveSuccessAnimation ? "save-btn-success" : ""
                  }`}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
              {saveSuccessAnimation ? (
                <div className="save-growth" aria-hidden>
                  <span className="save-stem" />
                  <span className="save-leaf save-leaf-l" />
                  <span className="save-leaf save-leaf-r" />
                  <span className="save-check">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                      <path
                        d="M5 12.5L10 17L19 8"
                        stroke="#2d6a3f"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      <footer data-reveal className="footer reveal-on-scroll px-4 py-10 md:px-8">
        <div className="rounded-none bg-[var(--green-dark)] px-6 py-10 text-center">
          <p className="footer-name font-display text-2xl italic text-white">
            Jardin Esperanza
          </p>
          <p className="footer-sub mt-2 text-[0.75rem] uppercase tracking-[0.1em] text-white/50">
            Flores y plantas con amor
          </p>
        </div>
      </footer>
      <a
        href={getGeneralWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_22px_rgba(37,211,102,0.4)] transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="white" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
