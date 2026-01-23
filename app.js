// app.js
// What this file does:
// - Holds the products (data).
// - Displays categories/products.
// - Manages the cart (add, +/-, totals).
// - Saves the cart to localStorage.
// - Opens confirmation modal and completes demo order.

// (1) Product data
// - Each product has: id, category, name, desc, price, img
// - Make sure the images exist in the images/ folder
const PRODUCTS = [
  // (1A) MAINS
  { id: "m1", category: "Κυρίως", name: "Cheeseburger", desc: "Ζουμερό μπιφτέκι, cheddar, μαρούλι, ντομάτα, σως.", price: 7.90, img: "images/burger.jpg" },
  { id: "m2", category: "Κυρίως", name: "Μοσχαρίσια", desc: "Μοσχαρίσια μπριζόλα με πατάτες και σος πιπεριού.", price: 14.50, img: "images/steak.jpg" },
  { id: "m3", category: "Κυρίως", name: "Caesar Salad", desc: "Κοτόπουλο, παρμεζάνα, κρουτόν, caesar dressing.", price: 8.20, img: "images/salad.jpg" },

  // (1B) APPETIZERS
  { id: "a1", category: "Ορεκτικά", name: "Πατατούλες", desc: "Τραγανές πατάτες με αλάτι και ρίγανη.", price: 3.20, img: "images/fries.jpg" },
  { id: "a2", category: "Ορεκτικά", name: "Κοτομπουκές", desc: "6 τεμ. nuggets με sauce επιλογής.", price: 4.60, img: "images/nuggets.jpg" },
  { id: "a3", category: "Ορεκτικά", name: "Τζατζίκι", desc: "Μια μερίδα τζατζίκι με extra σκόρδο.", price: 2.60, img: "images/tzatziki.jpg" },

  // (1C) DRINKS
  { id: "d1", category: "Ποτά", name: "Coca-Cola 330ml", desc: "Αναψυκτικό με ανθρακικό.", price: 1.80, img: "images/cola.jpg" },
  { id: "d2", category: "Ποτά", name: "Νερό 500ml", desc: "Εμφιαλωμένο νερό.", price: 1.00, img: "images/water.jpg" },
  { id: "d3", category: "Ποτά", name: "Μπίρα 500ml", desc: "Ξανθιά μπύρα.", price: 3.50, img: "images/beer.jpg" }
];

// (2) Categories
// - We get all unique categories from the products
// - And put "All" in front
const CATEGORIES = ["Όλα", ...new Set(PRODUCTS.map(p => p.category))];

// (3) Cart
// - The cart is an object: { productId: qty, ... }
// - We load it from localStorage, so it persists after refresh
let cart = loadCartFromStorage();

// (4) UI filter state
// - activeCategory: which category is selected
// - searchTerm: what the user has typed in search
let activeCategory = "Όλα";
let searchTerm = "";

// (5) Grab the DOM elements (whatever we need to update)
const categorySelect = document.getElementById("categorySelect");
const productsGrid = document.getElementById("productsGrid");

const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountBadge = document.getElementById("cartCountBadge");

const searchInput = document.getElementById("searchInput");
const btnClearCart = document.getElementById("btnClearCart");
const btnCheckout = document.getElementById("btnCheckout");

// (6) Modal elements + Bootstrap instance
const modalEl = document.getElementById("checkoutModal");
const modalOrderList = document.getElementById("modalOrderList");
const modalTotal = document.getElementById("modalTotal");
const modalMessage = document.getElementById("modalMessage");
const btnModalConfirm = document.getElementById("btnModalConfirm");

// We create a Bootstrap Modal "object" to open/close it from JS
const checkoutModal = new bootstrap.Modal(modalEl);

// (7) Listeners / Events

// (7A) Clear cart
btnClearCart.addEventListener("click", () => {
  cart = {};                 // clear the object
  saveCartToStorage();       // save to localStorage
  renderCart();              // redraw the cart
});

// (7B) Product search (live)
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderProducts();
});

// (7C) Add product from grid (event delegation)
// - If a button with data-add-id is clicked, we get it and add it
productsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-id]");
  if (!btn) return;

  const id = btn.getAttribute("data-add-id");
  addToCart(id);
});

// (7D) +/- in cart (event delegation)
// - We check if a button with data-plus-id or data-minus-id was clicked
cartItemsEl.addEventListener("click", (e) => {
  const plus = e.target.closest("[data-plus-id]");
  const minus = e.target.closest("[data-minus-id]");

  if (plus)  updateQty(plus.getAttribute("data-plus-id"), +1);
  if (minus) updateQty(minus.getAttribute("data-minus-id"), -1);
});

// (7E) Checkout -> opens the confirmation modal
btnCheckout.addEventListener("click", () => {
  openCheckoutModal();
});


categorySelect.addEventListener("change", (e) => {
  activeCategory = e.target.value;
  renderProducts();
});


// (7F) Confirmation inside the modal
btnModalConfirm.addEventListener("click", () => {
  const total = calcCartTotal();

  // If empty, show message and don't proceed
  if (total <= 0) {
    showModalMessage("Το καλάθι είναι άδειο 🙂");
    return;
  }

  // Demo "completion": create an order number
  const orderNo = generateOrderNo();
  showModalMessage(`🎉 Η παραγγελία επιβεβαιώθηκε! Αρ. Παραγγελίας: ${orderNo}`);

  // Clear the cart and update UI
  cart = {};
  saveCartToStorage();
  renderCart();

  // Refresh modal content to show it's now empty
  renderModalSummary();
});

// (7G) When the modal closes, we clear the message
modalEl.addEventListener("hidden.bs.modal", () => {
  modalMessage.classList.add("d-none");
  modalMessage.textContent = "";
});

// (8) Initial render (as soon as the page opens)
renderCategories();
renderProducts();
renderCart();


// =======================
// (9) RENDER FUNCTIONS
// =======================

// (9A) Render categories
// - Creates buttons for all categories
// - Sets "active" on the selected one
function renderCategories(){
  // Fill the dropdown with options
  categorySelect.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;

    // keep selected the current category
    if (cat === activeCategory) option.selected = true;

    categorySelect.appendChild(option);
  });
}



// (9B) Render products
// - Filters by category and searchTerm
// - Creates cards with image, description, price, add button
function renderProducts(){
  const filtered = PRODUCTS
    .filter(p => activeCategory === "Όλα" ? true : p.category === activeCategory)
    .filter(p => {
      if (!searchTerm) return true;
      const text = (p.name + " " + p.desc).toLowerCase();
      return text.includes(searchTerm);
    });

  productsGrid.innerHTML = "";

  // If nothing found, show message
  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-12">
        <div class="p-3" style="border:2px dashed rgba(218,41,28,0.35); border-radius:14px; background: rgba(255,199,44,0.14);">
          <p class="m-0 fw-bold">No products found for this filter.</p>
        </div>
      </div>
    `;
    return;
  }

  // Normal product list
  filtered.forEach(p => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6";

    col.innerHTML = `
      <article class="product-card">
        <img class="product-img" src="${p.img}" alt="${escapeHtml(p.name)}">
        <div class="product-body">
          <h3 class="product-title">${escapeHtml(p.name)}</h3>
          <p class="product-desc">${escapeHtml(p.desc)}</p>
          <div class="product-footer">
            <span class="price">${formatEUR(p.price)}</span>
            <button class="btn-add" data-add-id="${p.id}">+ Προσθήκη</button>
          </div>
        </div>
      </article>
    `;

    productsGrid.appendChild(col);
  });
}

// (9C) Render cart
// - If cart is empty, shows the empty block
// - Otherwise creates rows with image, title, +/- and subtotal
// - Updates total and count badge
function renderCart(){
  const items = Object.entries(cart); // [ [id, qty], ... ]
  cartItemsEl.innerHTML = "";

  cartEmptyEl.style.display = items.length === 0 ? "block" : "none";

  items.forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    const itemTotal = product.price * qty;

    const item = document.createElement("div");
    item.className = "cart-item";

    item.innerHTML = `
      <img src="${product.img}" alt="${escapeHtml(product.name)}">
      <div>
        <p class="cart-item-title">${escapeHtml(product.name)}</p>
        <p class="cart-item-sub">${formatEUR(product.price)} / item</p>
      </div>
      <div class="qty-controls">
        <div class="qty-row">
          <button class="qty-btn" aria-label="Decrease quantity" data-minus-id="${id}">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" aria-label="Increase quantity" data-plus-id="${id}">+</button>
        </div>
        <div class="item-total">${formatEUR(itemTotal)}</div>
      </div>
    `;

    cartItemsEl.appendChild(item);
  });

  const total = calcCartTotal();
  cartTotalEl.textContent = formatEUR(total);

  const count = calcCartItemsCount();
  cartCountBadge.textContent = `${count} item${count === 1 ? "" : "s"}`;
}


// =======================
// (10) CART ACTIONS
// =======================

// (10A) Add to cart
function addToCart(productId){
  cart[productId] = (cart[productId] || 0) + 1;
  saveCartToStorage();
  renderCart();
}

// (10B) Change quantity (+1 or -1)
// - If it goes to 0, it is removed completely
function updateQty(productId, delta){
  const current = cart[productId] || 0;
  const next = current + delta;

  if (next <= 0) delete cart[productId];
  else cart[productId] = next;

  saveCartToStorage();
  renderCart();
}


// =======================
// (11) MODAL FUNCTIONS
// =======================

// (11A) Open modal
// - Fills the modal with summary and displays it
function openCheckoutModal(){
  renderModalSummary();
  modalMessage.classList.add("d-none");
  modalMessage.textContent = "";
  checkoutModal.show();
}

// (11B) Fill modal with order summary
function renderModalSummary(){
  const items = Object.entries(cart);
  modalOrderList.innerHTML = "";

  if (items.length === 0) {
    modalOrderList.innerHTML = `<div class="fw-bold">The cart is empty.</div>`;
    modalTotal.textContent = formatEUR(0);
    return;
  }

  items.forEach(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    const line = document.createElement("div");
    line.className = "modal-line";

    line.innerHTML = `
      <div>
        <div class="fw-bold">${escapeHtml(product.name)}</div>
        <div style="opacity:.75">x ${qty} • ${formatEUR(product.price)} / item</div>
      </div>
      <div class="fw-bold" style="color:#DA291C">${formatEUR(product.price * qty)}</div>
    `;

    modalOrderList.appendChild(line);
  });

  modalTotal.textContent = formatEUR(calcCartTotal());
}

// (11C) Display message inside the modal
function showModalMessage(text){
  modalMessage.textContent = text;
  modalMessage.classList.remove("d-none");
}


// =======================
// (12) HELPERS
// =======================

// (12A) Calculate total cost
function calcCartTotal(){
  let sum = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) continue;
    sum += product.price * qty;
  }
  return sum;
}

// (12B) Calculate number of items (sum of quantities)
function calcCartItemsCount(){
  let count = 0;
  for (const qty of Object.values(cart)) count += qty;
  return count;
}

// (12C) Format euros in Greek
function formatEUR(value){
  return value.toLocaleString("el-GR", { style: "currency", currency: "EUR" });
}

// (12D) Save cart to localStorage
function saveCartToStorage(){
  localStorage.setItem("datalabs_cart", JSON.stringify(cart));
}

// (12E) Load cart from localStorage
function loadCartFromStorage(){
  try{
    const raw = localStorage.getItem("datalabs_cart");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// (12F) Protection from "broken" HTML strings (security/correct rendering)
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// (12G) Random order number (demo)
function generateOrderNo(){
  const n = Math.floor(100000 + Math.random() * 900000);
  return `DL-${n}`;
}
