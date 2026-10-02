const BANK = {
  bankName: "CAPITEC",
  accountHolder: "C & C PRIME DIGITAL",
  accountNumber: "2605354292",
  branchCode: "470010",
  accountType: "ENTREPRENEUR CURRENT"
};

const CATALOG = {
  "quick-boost-daily":{name:"Quick Boost",amount:600,note:"Daily Google Ads campaign"},
  "morning-boost-daily":{name:"Morning Boost",amount:1000,note:"Daily Google Ads campaign"},
  "daily-drive-daily":{name:"Daily Drive",amount:1600,note:"Daily Google Ads campaign"},
  "lead-rush-daily":{name:"Lead Rush",amount:2500,note:"Daily Google Ads campaign"},
  "prime-day-daily":{name:"Prime Day",amount:4000,note:"Daily Google Ads campaign"},
  "quick-boost-weekly":{name:"Quick Boost Weekly",amount:3990,note:"7-day Google Ads campaign plan"},
  "morning-boost-weekly":{name:"Morning Boost Weekly",amount:6720,note:"7-day Google Ads campaign plan"},
  "daily-drive-weekly":{name:"Daily Drive Weekly",amount:10780,note:"7-day Google Ads campaign plan"},
  "lead-rush-weekly":{name:"Lead Rush Weekly",amount:16975,note:"7-day Google Ads campaign plan"},
  "prime-day-weekly":{name:"Prime Day Weekly",amount:27370,note:"7-day Google Ads campaign plan"},
  "quick-boost-monthly":{name:"Quick Boost Monthly",amount:16200,note:"30-day Google Ads campaign plan"},
  "morning-boost-monthly":{name:"Morning Boost Monthly",amount:27750,note:"30-day Google Ads campaign plan"},
  "daily-drive-monthly":{name:"Daily Drive Monthly",amount:45300,note:"30-day Google Ads campaign plan"},
  "lead-rush-monthly":{name:"Lead Rush Monthly",amount:71400,note:"30-day Google Ads campaign plan"},
  "prime-day-monthly":{name:"Prime Day Monthly",amount:115500,note:"30-day Google Ads campaign plan"}
};

const q=new URLSearchParams(location.search);
const productId=q.get("product");
let product=CATALOG[productId];

if(!product){
  const item=q.get("item")||"Prime Digital Service";
  const amount=Number(q.get("amount")||0);
  const recurring=Number(q.get("recurring")||0);
  const note=q.get("note")||"Prime Digital service";
  product={name:item,amount,recurring,note};
}

const ref="PD-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+Math.random().toString(36).slice(2,7).toUpperCase();
const money=n=>"R"+Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:0,maximumFractionDigits:2});

document.getElementById("productName").textContent=product.name;
document.getElementById("amountDue").textContent=product.amount?money(product.amount):"Amount to be confirmed";
document.getElementById("orderRef").textContent=ref;
document.getElementById("paymentRef").textContent=ref;

if(product.recurring){
  document.getElementById("recurringRow").hidden=false;
  document.getElementById("recurringAmount").textContent=money(product.recurring)+" / month";
}

for(const [id,value] of Object.entries(BANK)){
  const el=document.getElementById(id);
  if(el)el.textContent=value;
}

const bankReady=Object.values(BANK).every(v=>v && !String(v).includes("TO BE ADDED"));
if(bankReady)document.getElementById("bankPending").hidden=true;

let prepared=null;
document.getElementById("eftForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  prepared=Object.fromEntries(new FormData(e.currentTarget).entries());
  document.getElementById("proofStep").hidden=false;
  document.getElementById("proofStep").scrollIntoView({behavior:"smooth",block:"start"});
});

function syncButtons(){
  const enabled=bankReady && document.getElementById("paidCheck").checked && document.getElementById("popCheck").checked && !!prepared;
  document.getElementById("whatsappCarla").disabled=!enabled;
  document.getElementById("whatsappCye").disabled=!enabled;
}
document.getElementById("paidCheck").addEventListener("change",syncButtons);
document.getElementById("popCheck").addEventListener("change",syncButtons);

function sendWhatsApp(number,recipient){
  if(!prepared)return;
  const lines=[
    "Hi "+recipient+", I have placed an EFT order with Prime Digital.",
    "",
    "ORDER REFERENCE: "+ref,
    "PRODUCT/SERVICE: "+product.name,
    "AMOUNT PAID: "+(product.amount?money(product.amount):"To be confirmed"),
    product.recurring?"RECURRING: "+money(product.recurring)+" / month":"",
    "CUSTOMER: "+prepared.fullName,
    "BUSINESS: "+prepared.businessName,
    "EMAIL: "+prepared.email,
    "PHONE: "+prepared.phone,
    "DETAILS: "+prepared.details,
    "",
    "I used "+ref+" as my bank payment reference.",
    "I will attach the proof of payment to this WhatsApp message.",
    "I understand the order is only activated after Prime Digital verifies the EFT in the receiving bank account."
  ].filter(Boolean);
  window.open("https://wa.me/"+number+"?text="+encodeURIComponent(lines.join("\n")),"_blank");
}
document.getElementById("whatsappCarla").addEventListener("click",()=>sendWhatsApp("27641340537","Carla"));
document.getElementById("whatsappCye").addEventListener("click",()=>sendWhatsApp("27747717078","Cye"));