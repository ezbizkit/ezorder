import { getData } from "./cookie.js";

let currencyVal = "$";
let confirmationMessage = "We will send a confirmation email with your order details.";
let isAcceptingOrders = false;
const APPSCRIPT_URL = window.CONFIG.API_URL;
let payment = {};

await loadAccount();
await orderConfirmation();
init();

async function api(path, payload = {}, params = null) {
    switch (path) {
        case "checkout":
            return await postRequest(payload);
        case "status":
            return await getRequest(path, false);
        case "subscribe":
            return await postRequest(payload);
        case "order":
            const param = `${path}&id=${params}`;
            return await getRequest(param, false);
        default:
            return await getRequest(path, true);
    }
};

async function getRequest(route, save) {
    return await getData(`ezorder-${route}`, `${APPSCRIPT_URL}?route=${route}`, save);
}

async function postRequest(data) {
    try {
        const response = await fetch(`${APPSCRIPT_URL}`, {
            method: "POST",
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const message = `An error occurred: ${response.status}`;
            throw new Error(message);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Error:", error);
        return error;
    }
}

// async function isOpen() {
//     // TODO: check if they're open
//     // update appscript to check on checkout as well
//     let data = await api("status");
//     new Date(data.nextChange).toLocaleTimeString("en-US", {
//         timeZone: data.timezone
//     });
// }

async function loadAccount() {
    let profile = await api("profile");
    if (profile === null) return;
    const bizInfo = profile.filter(b => b.label === "Business Information")[0]?.settings;
    const branding = profile.filter(b => b.label === "Branding")[0]?.settings;
    const storeSettings = profile.filter(b => b.label === "Store Settings")[0]?.settings;
    const social = profile.filter(b => b.label === "Social Media")[0]?.settings;
    const subscribe = profile.filter(b => b.label === "Subscribers")[0]?.settings;
    const paymentSettings = profile.filter(b => b.label === "Payment Settings")[0]?.settings;
    // bizInfo
    const name = bizInfo.filter(b => b.name === "Business Name")[0]?.value;
    const address = bizInfo.filter(b => b.name === "Business Address")[0]?.value;
    const email = bizInfo.filter(b => b.name === "Contact Email")[0]?.value;
    const phone = bizInfo.filter(b => b.name === "Phone Number")[0]?.value;
    // branding
    const logo = branding.filter(b => b.name === "Logo Image URL")[0]?.value;
    const bannerUrl = branding.filter(b => b.name === "Banner Image URL")[0]?.value;
    const bannerText = branding.filter(b => b.name === "Banner Headline")[0]?.value;
    const mainColor = branding.filter(b => b.name === "Primary Brand Color")[0]?.value;
    // store
    const currency = storeSettings.filter(b => b.name === "Currency")[0]?.value;
    const orderMessage = storeSettings.filter(b => b.name === "Order Confirmation Message")[0]?.value;
    const acceptingOrders = storeSettings.filter(b => b.name === "Accept Orders")[0]?.value;

    // socialmedia
    const instagram = social.filter(b => b.name === "Instagram Profile")[0]?.value;
    const facebook = social.filter(b => b.name === "Facebook Page")[0]?.value;

    // subscribe
    const subscriptionContact = subscribe.filter(b => b.name === "Subscriber Contact Type")[0]?.value;
    const subscriptionInstruc = subscribe.filter(b => b.name === "Subscription Instructions")[0]?.value;

    // payments
    const stripe = paymentSettings.filter(b => b.name === "Enable Stripe")[0]?.value;
    const zelle = paymentSettings.filter(b => b.name === "Zelle Contact")[0]?.value;
    const cashApp = paymentSettings.filter(b => b.name === "Cash App ID")[0]?.value;
    const venmo = paymentSettings.filter(b => b.name === "Venmo Username")[0]?.value;

    payment["stripe"] = stripe;
    if (zelle) payment["zelle"] = zelle;
    if (cashApp) payment["cashApp"] = cashApp;
    if (venmo) payment["venmo"] = venmo;

    const year = new Date().getFullYear();

    document.documentElement.style.setProperty("--main-color", mainColor);
    let hexColor = mainColor;
    if (!hexColor.includes("#")) hexColor = colorNameToHex(hexColor);
    const textColor = lightenToAlmostWhite(hexColor);
    document.documentElement.style.setProperty("--text-color", textColor);
    if (bannerUrl) document.documentElement.style.setProperty("--banner-image", `url("${bannerUrl}")  center top / cover no-repeat`);

    document.getElementById("year").textContent = year;
    document.getElementById("businessname").textContent = name;
    if (address) document.getElementById("address").textContent = ` 🏠 ${address} |`;
    if (phone) document.getElementById("phone").textContent = ` 📞 ${phone} |`;
    if (email) document.getElementById("email").textContent = ` 📧 ${email} |`;
    document.getElementById("bannertxt").textContent = bannerText;
    document.getElementById("logo").src = logo;
    let socialMedia = "";
    if (instagram) {
        socialMedia = ` <a target="_blank" href="${instagram}"><svg class="instagram-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.75 2h8.5C19.99 2 22 4.01 22 6.25v11.5C22 19.99 19.99 22 16.25 22h-8.5C4.01 22 2 19.99 2 17.75V6.25C2 4.01 4.01 2 7.75 2Zm0 1.5A4.76 4.76 0 0 0 3.5 6.25v11.5A4.76 4.76 0 0 0 7.75 20.5h8.5a4.76 4.76 0 0 0 4.75-4.75V6.25A4.76 4.76 0 0 0 16.25 3.5h-8.5Zm10.5 2a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/>
      </svg></a>`;
    }
    if (facebook) {
        socialMedia += ` <a target="_blank" href="${facebook}"><svg class="facebook-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-label="Facebook">
  <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.87 6.48 1.87 12.07c0 4.99 3.65 9.13 8.43 9.93v-7.03H7.9v-2.9h2.4V9.41c0-2.37 1.41-3.68 3.57-3.68 1.03 0 2.1.18 2.1.18v2.31h-1.18c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.9h-2.18V22c4.78-.8 8.43-4.94 8.43-9.93Z"/>
</svg>
</a>`;
    }
    document.getElementById("socialmedia").innerHTML = socialMedia;

    let link = document.querySelector("link[rel~='icon']");
    link.href = logo;
    const navTitle = document.getElementById("navtitle")
    navTitle.textContent = name;
    navTitle.style.color = mainColor;

    currencyVal = currency;
    if (orderMessage) confirmationMessage = orderMessage;
    isAcceptingOrders = acceptingOrders;

    if (subscriptionContact) {
        const subscribediv = document.getElementById("subscribe");
        const spanEl = subscribediv.querySelector("span");
        spanEl.textContent = subscriptionInstruc;
        const inputEl = subscribediv.querySelector("input");
        inputEl.placeholder = subscriptionContact;
        subscribediv.style.display = "block";
        const buttonEl = subscribediv.querySelector("button");
        buttonEl.style.backgroundColor = mainColor;
        buttonEl.style.color = textColor;
    }
};

async function init() {
    await loadMenu();

    loadCart();
};

function colorNameToHex(colorName) {
    const el = document.createElement("div");
    el.style.color = colorName;
    document.body.appendChild(el);

    const rgb = getComputedStyle(el).color;
    document.body.removeChild(el);

    const [r, g, b] = rgb.match(/\d+/g).map(Number);

    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

function lightenToAlmostWhite(hex, factor = 0.9) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

async function loadMenu() {
    const menuGrid = document.getElementById("menuGrid");
    menuGrid.innerHTML = `<div style="display: flex; justify-content: center; font-size: 24px;">
        <div class="spinner"></div>
    </div>`;
    let menu = await api("menu");
    if (menu === null) menu = [];
    if (menu.length === 0) {
        menuGrid.innerHTML = `<div style="display: flex; justify-content: center; font-size: 24px;">
        <div>NO DATA</div>
    </div>`;
        return;
    }

    let menuDiv = "";
    for (const m of menu) {
        menuDiv += `<div class="card">
            <img src="${m.imageUrl}" style="display: ${m.imageUrl ? "block" : "none"}" alt="${m.name}" />
            <div class="space-between">
                <div>
                    <h3>${m.name}</h3>
                    <span style="margin-left: 1rem; color: #6c757d; opacity: 0.5; font-size: 10px; font-style: italic; display: ${m.stock && m.stock < 10 ? "block" : "none"}">(Only ${m.stock} left)</span>
                </div>
                <div>
                    <p style="margin: 1rem; font-weight: bolder; font-size: 14px; color: red;">${currencyVal}${m.price}</p>
                </div>
            </div>
            <p>${m.description}</p>
            <div class="btnDiv">
                <button style="display: ${isAcceptingOrders ? "block" : "none"}" class="btn add-to-cart" data-id="${m.id}" data-name="${m.name}" data-price="${m.price}" data-image="${m.imageUrl}" data-stock="${m.stock}">
                Add To Cart
            </button>
            </div>
        </div>`;
    }
    menuGrid.innerHTML = menuDiv;
};

document.addEventListener("click", (e) => {

    const btn = e.target;

    if (e.target.classList.contains("add-to-cart")) {
        addToCart(
            btn.dataset.id,
            btn.dataset.name,
            btn.dataset.price,
            btn.dataset.image,
            btn.dataset.stock
        );
    }

    if (e.target.classList.contains("increase-quantity")) {
        increaseQuantity(btn.dataset.id);
    }

    if (e.target.classList.contains("decrease-quantity")) {
        decreaseQuantity(btn.dataset.id);
    }

    if (e.target.classList.contains("close-cart")) {
        closeCart();
    }

    if (e.target.classList.contains("checkout")) {
        handleCheckout(e);
    }

    if (e.target.classList.contains("subscribe")) {
        handleSubscription(e);
    }
});

async function handleSubscription(e) {
    const btn = e.target;
    btn.disabled = true;
    btn.style.pointerEvents = "none";

    const inputElement = document.getElementById("subscribeInfo");

    const inputValue = inputElement.value;
    if (!inputValue) return;

    btn.textContent = "Submitting...";

    const msg = document.getElementById("subscribeMessage");
    msg.style.fontSize = "11px";
    try {
        const payload = {
            subscriber: inputValue,
            type: "subscribe"
        }
        const res = await api("subscribe", payload);
        if (!res || res !== "ok") throw new Error("Couldn't subscribe");
        msg.textContent = "Successful";
        msg.style.color = "green";
        inputElement.value = "";
    } catch (error) {
        console.error(error);
        msg.textContent = "Failed. Please try again.";
        msg.style.color = "red";
    }
    msg.style.display = "block";
    btn.textContent = "Get Updates";
    var x = setInterval(function () {
        clearInterval(x);
        msg.style.display = "none";
    }, 10000);
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("ezorder-cart") || "[]");
    if (cart.length === 0) closeCart();
    document.getElementById("cartCount").textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    let cartItemDiv = "";
    for (const c of cart) {
        const total = (c.price * c.quantity).toFixed(2);
        cartItemDiv += `<div class="cart-item">
            <img src="${c.imageUrl ? c.imageUrl : "./noimage.jfif"}" alt="${c.name}" />
            <div class="item-info">
                <p>${c.name}</p>
                <p>${currencyVal}${total}</p>
            </div>
            <div class="quantity-controls">
                <button class="btn decrease-quantity" data-id="${c.id}">-</button>
                <span>${c.quantity}</span>
                <button class="btn increase-quantity" data-id="${c.id}">+</button>
            </div>
        </div>
        `;
    }
    const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2);
    const cartTotalDiv = `<div><table style="width: 100%;"><tr><td align="left">Total</td><td style="font-weight: bolder;" align="right">${currencyVal}${cartTotal}</td></tr></table></div>`;
    const cartItems = document.getElementById("cartItems");
    cartItems.innerHTML = cartItemDiv;
    cartItems.innerHTML += cartTotalDiv;
    if (!payment.stripe) {
        const customerPaymentInfo = document.getElementById("customerPaymentInfo");
        let customerPaymentDiv = `<div style="padding-bottom: 2rem; background-color: #fff; text-align: left; border-radius: 5px;"><h3 style="text-decoration: underline; font-weight: bold; text-align: center;">Payment Methods</h3>`;
        for (const key of Object.keys(payment)) {
            if (key === "stripe") continue;
            const val = payment[key];
            customerPaymentDiv += `<p style="padding-left: 5px;">${key.toUpperCase()}: ${val}</p>`;
        }
        customerPaymentDiv += `</div>`;
        customerPaymentDiv += `<div style="padding-bottom: 2rem; background-color: #fff; text-align: left; border-radius: 5px;"><h3 style="text-decoration: underline; font-weight: bold; text-align: center;">Customer Details</h3>`;
        customerPaymentDiv += `<span style="margin-left: 5px;">Name*</span> <br/><input name="fullname" style="margin-left: 5px; margin-bottom: 5px; width: 95%; height:30px; border-radius: 4px;"/>`;
        customerPaymentDiv += `<span style="margin-left: 5px;">Email Address*</span> <br/><input name="email" style="margin-left: 5px; margin-bottom: 5px; width: 95%; height:30px; border-radius: 4px;"/>`;
        customerPaymentDiv += `<span style="margin-left: 5px;">Phone Number*</span> <br/><input name="phone" style="margin-left: 5px; margin-bottom: 5px; width: 95%; height:30px; border-radius: 4px;"/>`;
        customerPaymentDiv += `</div>`;
        customerPaymentInfo.innerHTML = customerPaymentDiv;
    }
};

document.getElementById("shopping-cart").addEventListener("click", () => {
    if (Number(document.getElementById("cartCount").textContent) === 0) return;
    const checkoutDiv = document.getElementById("checkoutModal");
    checkoutDiv.style.display = "grid";
});

function closeCart() {
    const checkoutDiv = document.getElementById("checkoutModal");
    checkoutDiv.style.display = "none";
};

async function addToCart(id, name, price, imageUrl, stock) {
    const newCart = { id, name, price, imageUrl, quantity: 1, stock };
    const cart = JSON.parse(localStorage.getItem("ezorder-cart") || "[]");
    const matchingItem = cart.find(c => c.id === id);
    if (matchingItem) {
        matchingItem.quantity += 1;
    }
    else {
        cart.push(newCart);
    }

    localStorage.setItem("ezorder-cart", JSON.stringify(cart));
    loadCart();
};

function increaseQuantity(id) {
    const cart = JSON.parse(localStorage.getItem("ezorder-cart") || "[]");
    const matchingItem = cart.find(c => c.id === id);
    if (matchingItem) {
        if (matchingItem.stock > matchingItem.quantity) matchingItem.quantity += 1;
    }
    localStorage.setItem("ezorder-cart", JSON.stringify(cart));
    loadCart();
};

function decreaseQuantity(id) {
    const cart = JSON.parse(localStorage.getItem("ezorder-cart") || "[]");
    const matchingItemIndex = cart.findIndex(c => c.id === id);
    if (matchingItemIndex !== -1) {
        cart[matchingItemIndex].quantity -= 1;
        if (cart[matchingItemIndex].quantity <= 0) {
            cart.splice(matchingItemIndex, 1);
        }
    }
    localStorage.setItem("ezorder-cart", JSON.stringify(cart));
    loadCart();
};

async function handleCheckout(e) {
    const btn = e.target;
    const payload = {
        type: "checkout",
    }

    if (!payment.stripe) {
        const customer = {};
        const customerName = document.querySelector('input[name="fullname"]').value;
        if (customerName) customer["name"] = customerName;
        const customerEmail = document.querySelector('input[name="email"]').value;
        if (customerEmail) customer["email"] = customerEmail;
        const customerPhone = document.querySelector('input[name="phone"]').value;
        if (customerPhone) customer["phone"] = customerPhone;
        payload["customer_details"] = customer;
        if (!customerName || (!customerEmail && !customerPhone)) {
            alert("Name and Phone or Email must be provided.");
            return;
        }
    }
    btn.disabled = true;
    btn.style.pointerEvents = "none";
    const text = btn.querySelector(".btn-text");
    const spinner = btn.querySelector(".spinner");

    if (text) text.style.display = "none";
    if (spinner) spinner.style.display = "inline-block";
    const cart = JSON.parse(localStorage.getItem("ezorder-cart") || "[]");
    if (cart.length === 0) return;
    const lineItems = cart.map(({ id, quantity }) => ({
        price: id,
        quantity
    }));
    payload["cart"] = lineItems;

    const res = await api("checkout", payload);
    if (res.url) window.location.href = res.url;
};

async function orderConfirmation() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");

    if (orderId) {
        const orders = await api("order", {}, orderId);
        if (orders === null || (Object.keys(orders).length === 0)) {
            const confirmtext = document.getElementById("orderconfirmation");
            confirmtext.textContent = "INVALID ORDER NUMBER";
            confirmtext.style.color = "red";
            document.getElementById("orderconfirm-check").textContent = "";
            const orderconfirmheader = document.getElementById("orderconfirm-header");
            orderconfirmheader.textContent = "❌ Order Not Found";
            orderconfirmheader.style.color = "#e85a5a";
        }
        else {
            const keys = Object.keys(orders).filter(k => k !== "items");
            let confirmationDiv = "<div>";
            for await (const k of keys) {
                const val = orders[k];
                if (val) confirmationDiv += `<p>${k.toUpperCase()}: ${val}</p>`;
            }
            confirmationDiv += `<table><thead><tr><th>Quantity</th><th>Item</th><th>Price</th></tr></thead><tbody>`;
            for await (const order of orders.items) {
                confirmationDiv += `<tr><td>${order.quantity}</td><td>${order.name}</td><td>${currencyVal}${order.price}</td></tr>`
            }
            confirmationDiv += "</tbody></table></div>";
            const orderConfirm = document.getElementById("orderconfirmation");
            orderConfirm.innerHTML = confirmationDiv;
            document.getElementById("orderconfirm-message").textContent = confirmationMessage;
        }
        localStorage.removeItem("ezorder-cart");
        localStorage.removeItem("ezorder-menu");
        document.getElementById("order-id").textContent = orderId;

        document.getElementById("success-popup").style.display = "flex";

        history.replaceState(null, '', window.location.pathname);
    }
}
