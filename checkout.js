const PACKAGES={
  "launch-day":{name:"Launch Day",days:"1 day",price:"R750"},
  "quick-start":{name:"Quick Start",days:"7 days",price:"R4,725"},
  "growth-sprint":{name:"Growth Sprint",days:"10 days",price:"R6,375"},
  "momentum":{name:"Momentum",days:"15 days",price:"R9,000"},
  "monthly-growth":{name:"Monthly Growth",days:"30 days",price:"R15,750"},
  "business-builder":{name:"Business Builder",days:"3 months",price:"R40,500"}
};
const params=new URLSearchParams(location.search);
const packageId=params.get("package")||"momentum";
const pkg=PACKAGES[packageId]||PACKAGES.momentum;
document.querySelector("#package-name").textContent=pkg.name;
document.querySelector("#package-days").textContent=pkg.days+" campaign management";
document.querySelector("#package-price").textContent=pkg.price;

document.querySelector("#checkout-form").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const button=document.querySelector("#pay-button");
  const error=document.querySelector("#checkout-error");
  button.disabled=true; button.textContent="Preparing secure payment…"; error.style.display="none";
  try{
    const data=Object.fromEntries(new FormData(e.currentTarget).entries());
    data.packageId=packageId;
    const response=await fetch("/api/create-payment",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||"Payment could not be started");
    const form=document.createElement("form");
    form.method="POST"; form.action=result.action;
    Object.entries(result.fields).forEach(([name,value])=>{const input=document.createElement("input");input.type="hidden";input.name=name;input.value=value;form.appendChild(input)});
    document.body.appendChild(form); form.submit();
  }catch(err){
    error.textContent=err.message||"Unable to start PayFast checkout. Please try again.";
    error.style.display="block"; button.disabled=false; button.textContent="Pay securely with PayFast →";
  }
});