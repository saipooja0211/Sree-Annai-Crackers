
let cart = {};
let activeCategory = "";

const money = n => "₹" + Math.round(n).toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

const categories = [...new Set(products.map(p=>p.category))].filter(Boolean).sort();
document.getElementById("cats").innerHTML =
  '<button class="cat active" onclick="setCategory(this, \'\')">All</button>' +
  categories.map(c => '<button class="cat" onclick="setCategory(this, '+JSON.stringify(c)+')">'+esc(c)+'</button>').join("");

function setCategory(btn, cat){
  activeCategory = cat;
  document.querySelectorAll(".cat").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  render();
}

function render(){
  const q = document.getElementById("search").value.toLowerCase().trim();
  const filtered = products.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
    (!activeCategory || p.category === activeCategory)
  );
  document.getElementById("result").textContent = filtered.length + " products";
  const groups = {};
  filtered.forEach(p => (groups[p.category] ||= []).push(p));
  document.getElementById("catalog").innerHTML =
    Object.entries(groups).map(([cat, arr]) =>
      '<section><div class="section-head"><h2>'+esc(cat)+'</h2></div><div class="grid">'+arr.map(productCard).join("")+'</div></section>'
    ).join("") || '<div class="empty">No products found.</div>';
}

function productCard(p){
  const available = p.status.toLowerCase().includes("available");
  const saving = p.mrp > p.price ? Math.round((1 - p.price/p.mrp)*100) : 0;
  return '<article class="card">' +
    '<div class="code">PRODUCT CODE #'+esc(p.code)+'</div>' +
    '<h3>'+esc(p.name)+'</h3>' +
    '<div class="per">'+esc(p.per)+'</div>' +
    '<div><span class="price">'+money(p.price)+'</span> <span class="mrp">'+money(p.mrp)+'</span></div>' +
    (saving ? '<div class="save">SAVE '+saving+'%</div>' : '') +
    '<button class="add" '+(available ? "" : "disabled")+' onclick="addToCart('+JSON.stringify(p.code)+')">'+(available ? "Add to cart" : "Unavailable")+'</button>' +
  '</article>';
}

function addToCart(code){ cart[code]=(cart[code]||0)+1; updateCount(); }
function updateCount(){ document.getElementById("count").textContent=Object.values(cart).reduce((a,b)=>a+b,0); }
function openCart(){ document.getElementById("modal").classList.add("show"); drawCart(); }
function closeCart(){ document.getElementById("modal").classList.remove("show"); }
function changeQty(code, delta){
  cart[code]=(cart[code]||0)+delta;
  if(cart[code]<=0) delete cart[code];
  updateCount(); drawCart();
}
function drawCart(){
  const entries=Object.entries(cart).filter(x=>x[1]>0);
  document.getElementById("items").innerHTML = entries.length ? entries.map(([code,qty])=>{
    const p=products.find(x=>x.code===code);
    return '<div class="item"><div><div class="item-name">'+esc(p.name)+'</div><div class="item-meta">Code #'+esc(p.code)+' • '+money(p.price)+' each</div></div><div class="qty"><button onclick="changeQty('+JSON.stringify(code)+',-1)">−</button><span>'+qty+'</span><button onclick="changeQty('+JSON.stringify(code)+',1)">+</button></div><b>'+money(p.price*qty)+'</b></div>';
  }).join("") : '<div class="empty">Your cart is empty.</div>';
  calculate();
}

function calculate(){
  const subtotal=Object.entries(cart).reduce((sum,[code,qty])=>{
    const p=products.find(x=>x.code===code); return sum+p.price*qty;
  },0);
  const kg=parseFloat(document.getElementById("weight").value)||0;
  const loc=document.getElementById("location").value;
  // SAMPLE/EDITABLE COURIER RULES:
  const rates={local:[60,20],south:[100,35],other:[150,50]};
  const r=rates[loc];
  const delivery=(r && kg>0) ? r[0] + Math.max(0,Math.ceil(kg)-1)*r[1] : 0;
  document.getElementById("sub").textContent=money(subtotal);
  document.getElementById("delivery").textContent=delivery ? money(delivery) : "Enter details";
  document.getElementById("total").textContent=delivery ? money(subtotal+delivery) : "—";
  const min=document.getElementById("minimum");
  if(subtotal===0){min.textContent="";}
  else if(subtotal<1500){min.className="bad";min.textContent="Minimum order ₹1,500 • Add "+money(1500-subtotal)+" more";}
  else{min.className="good";min.textContent="✓ Minimum order reached";}
}

document.getElementById("weight").addEventListener("input",calculate);
document.getElementById("location").addEventListener("change",calculate);

function sendWhatsApp(){
  const entries=Object.entries(cart).filter(x=>x[1]>0);
  const subtotal=entries.reduce((sum,[code,qty])=>sum+products.find(x=>x.code===code).price*qty,0);
  const name=document.getElementById("customer").value.trim();
  const phone=document.getElementById("customerPhone").value.trim();
  const pin=document.getElementById("pin").value.trim();
  const loc=document.getElementById("location").value;
  const kg=parseFloat(document.getElementById("weight").value)||0;
  const address=document.getElementById("address").value.trim();
  if(subtotal<1500){alert("Minimum order is ₹1,500.");return;}
  if(!name||!phone||!pin||!loc||!kg||!address){alert("Please complete all delivery details.");return;}
  const rates={local:[60,20],south:[100,35],other:[150,50]}[loc];
  const delivery=rates[0]+Math.max(0,Math.ceil(kg)-1)*rates[1];
  const total=subtotal+delivery;
  let msg="Sri Annai Crackers – Order\n\n";
  entries.forEach(([code,qty])=>{
    const p=products.find(x=>x.code===code);
    msg+="Product Code: "+p.code+"\nProduct: "+p.name+"\nQty: "+qty+"\nPrice: "+money(p.price*qty)+"\n\n";
  });
  msg+="Overall Product Price: "+money(subtotal)+"\n";
  msg+="Delivery Charges: "+money(delivery)+"\n";
  msg+="Total Amount: "+money(total)+"\n\n";
  msg+="Customer: "+name+"\nPhone: "+phone+"\nAddress: "+address+"\nPIN: "+pin;
  window.open("https://wa.me/917305089610?text="+encodeURIComponent(msg),"_blank");
}
render();
