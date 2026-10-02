// EFT is active until PayFast merchant verification is complete.
location.replace("eft-checkout.html?product=" + encodeURIComponent(new URLSearchParams(location.search).get("package") || "quick-boost-daily"));

const PRODUCTS={
  "quick-boost-daily":{name:"Quick Boost",duration:"Daily campaign",price:"R600"},
  "morning-boost-daily":{name:"Morning Boost",duration:"Daily campaign",price:"R1,000"},
  "daily-drive-daily":{name:"Daily Drive",duration:"Daily campaign",price:"R1,600"},
  "lead-rush-daily":{name:"Lead Rush",duration:"Daily campaign",price:"R2,500"},
  "prime-day-daily":{name:"Prime Day",duration:"Daily campaign",price:"R4,000"},
  "quick-boost-weekly":{name:"Quick Boost Weekly",duration:"7-day campaign plan",price:"R3,990"},
  "morning-boost-weekly":{name:"Morning Boost Weekly",duration:"7-day campaign plan",price:"R6,720"},
  "daily-drive-weekly":{name:"Daily Drive Weekly",duration:"7-day campaign plan",price:"R10,780"},
  "lead-rush-weekly":{name:"Lead Rush Weekly",duration:"7-day campaign plan",price:"R16,975"},
  "prime-day-weekly":{name:"Prime Day Weekly",duration:"7-day campaign plan",price:"R27,370"},
  "quick-boost-monthly":{name:"Quick Boost Monthly",duration:"30-day campaign plan",price:"R16,200"},
  "morning-boost-monthly":{name:"Morning Boost Monthly",duration:"30-day campaign plan",price:"R27,750"},
  "daily-drive-monthly":{name:"Daily Drive Monthly",duration:"30-day campaign plan",price:"R45,300"},
  "lead-rush-monthly":{name:"Lead Rush Monthly",duration:"30-day campaign plan",price:"R71,400"},
  "prime-day-monthly":{name:"Prime Day Monthly",duration:"30-day campaign plan",price:"R115,500"}
};
const params=new URLSearchParams(location.search);
const packageId=params.get("package")||"quick-boost-daily";
const product=PRODUCTS[packageId];
if(!product){location.href="packages.html";}
document.getElementById("summaryName").textContent=product.name;
document.getElementById("summaryDuration").textContent=product.duration;
document.getElementById("summaryPrice").textContent=product.price;

document.getElementById("checkoutForm").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const button=document.getElementById("payBtn");
  const error=document.getElementById("checkoutError");
  error.style.display="none";
  button.disabled=true;
  button.textContent="Preparing secure PayFast payment…";
  try{
    const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    data.packageId=packageId;
    const response=await fetch("/api/create-payment",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Unable to start payment");
    const form=document.createElement("form");
    form.method="POST";form.action=result.action;
    Object.entries(result.fields).forEach(([name,value])=>{
      const input=document.createElement("input");
      input.type="hidden";input.name=name;input.value=value;form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }catch(err){
    error.textContent=err.message||"Unable to start PayFast checkout.";
    error.style.display="block";
    button.disabled=false;
    button.textContent="Pay securely with PayFast →";
  }
});
