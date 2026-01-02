// app.js
// Τι κάνει αυτό το αρχείο:
// - Κρατάει τα προϊόντα (δεδομένα).
// - Εμφανίζει κατηγορίες/προϊόντα.
// - Διαχειρίζεται το καλάθι (add, +/-, σύνολα).
// - Αποθηκεύει το καλάθι σε localStorage.
// - Ανοίγει modal επιβεβαίωσης και ολοκληρώνει demo παραγγελία.

// (1) Δεδομένα προϊόντων
// - Κάθε προϊόν έχει: id, category, name, desc, price, img
// - Φρόντισε οι εικόνες να υπάρχουν στον φάκελο images/
const PRODUCTS = [
  // (1A) ΚΥΡΙΩΣ
  { id: "m1", category: "Κυρίως", name: "Cheeseburger", desc: "Ζουμερό μπιφτέκι, cheddar, μαρούλι, ντομάτα, σως.", price: 7.90, img: "images/burger.jpg" },
  { id: "m2", category: "Κυρίως", name: "Μοσχαρίσια", desc: "Μοσχαρίσια μπριζόλα με πατάτες και σος πιπεριού.", price: 14.50, img: "images/steak.jpg" },
  { id: "m3", category: "Κυρίως", name: "Caesar Salad", desc: "Κοτόπουλο, παρμεζάνα, κρουτόν, caesar dressing.", price: 8.20, img: "images/salad.jpg" },

  // (1B) ΟΡΕΚΤΙΚΑ
  { id: "a1", category: "Ορεκτικά", name: "Πατατούλες", desc: "Τραγανές πατάτες με αλάτι και ρίγανη.", price: 3.20, img: "images/fries.jpg" },
  { id: "a2", category: "Ορεκτικά", name: "Κοτομπουκές", desc: "6 τεμ. nuggets με sauce επιλογής.", price: 4.60, img: "images/nuggets.jpg" },
  { id: "a3", category: "Ορεκτικά", name: "Τζατζίκι", desc: "Μια μερίδα τζατζίκι με extra σκόρδο.", price: 2.60, img: "images/tzatziki.jpg" },

  // (1C) ΠΟΤΑ
  { id: "d1", category: "Ποτά", name: "Coca-Cola 330ml", desc: "Αναψυκτικό με ανθρακικό.", price: 1.80, img: "images/cola.jpg" },
  { id: "d2", category: "Ποτά", name: "Νερό 500ml", desc: "Εμφιαλωμένο νερό.", price: 1.00, img: "images/water.jpg" },
  { id: "d3", category: "Ποτά", name: "Μπίρα 500ml", desc: "Ξανθιά μπύρα.", price: 3.50, img: "images/beer.jpg" }
];

// (2) Κατηγορίες
// - Παίρνουμε όλες τις μοναδικές κατηγορίες από τα προϊόντα
// - Και βάζουμε μπροστά το "Όλα"
const CATEGORIES = ["Όλα", ...new Set(PRODUCTS.map(p => p.category))];

// (3) Καλάθι
// - Το καλάθι είναι ένα object: { productId: qty, ... }
// - Το φορτώνουμε από localStorage, ώστε να μένει μετά από refresh
let cart = loadCartFromStorage();

// (4) Κατάσταση φίλτρων UI
// - activeCategory: ποια κατηγορία είναι επιλεγμένη
// - searchTerm: τι έχει γράψει ο χρήστης στο search
let activeCategory = "Όλα";
let searchTerm = "";

// (5) Πιάνουμε τα DOM elements (ό,τι χρειαζόμαστε να ενημερώνουμε)
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

// Δημιουργούμε “αντικείμενο” Bootstrap Modal για να το ανοίγουμε/κλείνουμε από JS
const checkoutModal = new bootstrap.Modal(modalEl);

// (7) Listeners / Events

// (7A) Άδειασμα καλαθιού
btnClearCart.addEventListener("click", () => {
  cart = {};                 // καθαρίζουμε το object
  saveCartToStorage();       // αποθήκευση στο localStorage
  renderCart();              // ξαναζωγραφίζουμε το καλάθι
});

// (7B) Αναζήτηση προϊόντων (live)
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  renderProducts();
});

// (7C) Προσθήκη προϊόντος από το grid (event delegation)
// - Αν πατηθεί κουμπί που έχει data-add-id, το παίρνουμε και το προσθέτουμε
productsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-id]");
  if (!btn) return;

  const id = btn.getAttribute("data-add-id");
  addToCart(id);
});

// (7D) +/- στο καλάθι (event delegation)
// - Ψάχνουμε αν πατήθηκε κουμπί με data-plus-id ή data-minus-id
cartItemsEl.addEventListener("click", (e) => {
  const plus = e.target.closest("[data-plus-id]");
  const minus = e.target.closest("[data-minus-id]");

  if (plus)  updateQty(plus.getAttribute("data-plus-id"), +1);
  if (minus) updateQty(minus.getAttribute("data-minus-id"), -1);
});

// (7E) Checkout -> ανοίγει το modal επιβεβαίωσης
btnCheckout.addEventListener("click", () => {
  openCheckoutModal();
});


categorySelect.addEventListener("change", (e) => {
  activeCategory = e.target.value;
  renderProducts();
});


// (7F) Επιβεβαίωση μέσα στο modal
btnModalConfirm.addEventListener("click", () => {
  const total = calcCartTotal();

  // Αν είναι άδειο, δείχνουμε μήνυμα και δεν προχωράμε
  if (total <= 0) {
    showModalMessage("Το καλάθι είναι άδειο 🙂");
    return;
  }

  // Demo “ολοκλήρωση”: φτιάχνουμε έναν αριθμό παραγγελίας
  const orderNo = generateOrderNo();
  showModalMessage(`🎉 Η παραγγελία επιβεβαιώθηκε! Αρ. Παραγγελίας: ${orderNo}`);

  // Αδειάζουμε το καλάθι και ενημερώνουμε UI
  cart = {};
  saveCartToStorage();
  renderCart();

  // Ανανέωση περιεχομένου modal για να δείξει ότι πλέον είναι κενό
  renderModalSummary();
});

// (7G) Όταν κλείσει το modal, καθαρίζουμε το μήνυμα
modalEl.addEventListener("hidden.bs.modal", () => {
  modalMessage.classList.add("d-none");
  modalMessage.textContent = "";
});

// (8) Αρχικό render (μόλις ανοίξει η σελίδα)
renderCategories();
renderProducts();
renderCart();


// =======================
// (9) RENDER FUNCTIONS
// =======================

// (9A) Render κατηγοριών
// - Δημιουργεί κουμπιά για όλες τις κατηγορίες
// - Βάζει “active” στο επιλεγμένο
function renderCategories(){
  // Γεμίζουμε το dropdown με options
  categorySelect.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;

    // κρατάμε selected την τρέχουσα κατηγορία
    if (cat === activeCategory) option.selected = true;

    categorySelect.appendChild(option);
  });
}



// (9B) Render προϊόντων
// - Φιλτράρει ανά κατηγορία και ανά searchTerm
// - Φτιάχνει cards με εικόνα, περιγραφή, τιμή, κουμπί προσθήκης
function renderProducts(){
  const filtered = PRODUCTS
    .filter(p => activeCategory === "Όλα" ? true : p.category === activeCategory)
    .filter(p => {
      if (!searchTerm) return true;
      const text = (p.name + " " + p.desc).toLowerCase();
      return text.includes(searchTerm);
    });

  productsGrid.innerHTML = "";

  // Αν δεν βρεθεί τίποτα, δείξε μήνυμα
  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-12">
        <div class="p-3" style="border:2px dashed rgba(218,41,28,0.35); border-radius:14px; background: rgba(255,199,44,0.14);">
          <p class="m-0 fw-bold">Δεν βρέθηκαν προϊόντα για αυτό το φίλτρο.</p>
        </div>
      </div>
    `;
    return;
  }

  // Κανονική λίστα προϊόντων
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

// (9C) Render καλαθιού
// - Αν το cart είναι άδειο, δείχνει το empty block
// - Αλλιώς δημιουργεί γραμμές με εικόνα, τίτλο, +/- και υποσύνολο
// - Ενημερώνει total και badge πλήθους
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
        <p class="cart-item-sub">${formatEUR(product.price)} / τεμ.</p>
      </div>
      <div class="qty-controls">
        <div class="qty-row">
          <button class="qty-btn" aria-label="Μείωση ποσότητας" data-minus-id="${id}">−</button>
          <span class="qty-num">${qty}</span>
          <button class="qty-btn" aria-label="Αύξηση ποσότητας" data-plus-id="${id}">+</button>
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

// (10A) Προσθήκη στο καλάθι
function addToCart(productId){
  cart[productId] = (cart[productId] || 0) + 1;
  saveCartToStorage();
  renderCart();
}

// (10B) Αλλαγή ποσότητας (+1 ή -1)
// - Αν πάει στο 0, αφαιρείται εντελώς
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

// (11A) Άνοιγμα modal
// - Γεμίζει το modal με σύνοψη και το εμφανίζει
function openCheckoutModal(){
  renderModalSummary();
  modalMessage.classList.add("d-none");
  modalMessage.textContent = "";
  checkoutModal.show();
}

// (11B) Γέμισμα modal με σύνοψη παραγγελίας
function renderModalSummary(){
  const items = Object.entries(cart);
  modalOrderList.innerHTML = "";

  if (items.length === 0) {
    modalOrderList.innerHTML = `<div class="fw-bold">Το καλάθι είναι άδειο.</div>`;
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
        <div style="opacity:.75">x ${qty} • ${formatEUR(product.price)} / τεμ.</div>
      </div>
      <div class="fw-bold" style="color:#DA291C">${formatEUR(product.price * qty)}</div>
    `;

    modalOrderList.appendChild(line);
  });

  modalTotal.textContent = formatEUR(calcCartTotal());
}

// (11C) Εμφάνιση μηνύματος μέσα στο modal
function showModalMessage(text){
  modalMessage.textContent = text;
  modalMessage.classList.remove("d-none");
}


// =======================
// (12) HELPERS
// =======================

// (12A) Υπολογισμός συνολικού κόστους
function calcCartTotal(){
  let sum = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) continue;
    sum += product.price * qty;
  }
  return sum;
}

// (12B) Υπολογισμός πλήθους items (άθροισμα ποσοτήτων)
function calcCartItemsCount(){
  let count = 0;
  for (const qty of Object.values(cart)) count += qty;
  return count;
}

// (12C) Μορφοποίηση ευρώ στα ελληνικά
function formatEUR(value){
  return value.toLocaleString("el-GR", { style: "currency", currency: "EUR" });
}

// (12D) Αποθήκευση καλαθιού σε localStorage
function saveCartToStorage(){
  localStorage.setItem("datalabs_cart", JSON.stringify(cart));
}

// (12E) Φόρτωση καλαθιού από localStorage
function loadCartFromStorage(){
  try{
    const raw = localStorage.getItem("datalabs_cart");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// (12F) Προστασία από “σπασμένα” HTML strings (ασφάλεια/σωστό rendering)
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// (12G) Τυχαίος αριθμός παραγγελίας (demo)
function generateOrderNo(){
  const n = Math.floor(100000 + Math.random() * 900000);
  return `DL-${n}`;
}
