
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const launcher = $('#supportLauncher');
const bot = $('#supportBot');
const closeBot = $('#closeBot');
const form = $('#botForm');
const input = $('#botInput');
const messages = $('#botMessages');

function openBot(){ bot?.classList.add('open'); bot?.setAttribute('aria-hidden','false'); setTimeout(()=>input?.focus(),180); }
function closeSupport(){ bot?.classList.remove('open'); bot?.setAttribute('aria-hidden','true'); }
launcher?.addEventListener('click', openBot);
closeBot?.addEventListener('click', closeSupport);

function addMsg(text, who='bot'){
  if(!messages) return;
  const div=document.createElement('div');
  div.className='bot-msg '+who;
  div.textContent=text;
  messages.appendChild(div);
  messages.scrollTop=messages.scrollHeight;
}

const answers = [
  {k:['google ads','ads price','advertising','click','morning boost','daily drive','lead rush','prime day'],
   a:'Prime Digital offers flexible Google Ads packages from Quick Boost through Prime Day, plus weekly and monthly options. Click volumes are estimates because Google Ads pricing changes by industry, location and competition. Open the Google Ads page for current package prices.'},
  {k:['website','starter','business launch','business pro','growth website'],
   a:'Our website packages include professional responsive design, domain connection, business email, SSL, contact tools and Google-ready foundations. Managed packages have a setup fee plus monthly service, or you can choose a higher once-off ownership option.'},
  {k:['domain','co.za','.com','domain care'],
   a:'You can search for a business domain through Prime Digital. Domain Care is planned at R150/month for management and renewal administration. The domain should be registered in the client’s registrant details so it remains their domain.'},
  {k:['email','mailbox','@','business email'],
   a:'Business Email plans start with branded addresses such as you@yourbusiness.co.za. Current plans range from Email Start to Email Pro and include setup support.'},
  {k:['payment','payfast','visa','mastercard','eft','bank transfer'],
   a:'Prime Digital uses PayFast for secure payment processing. Payment is only treated as complete after PayFast confirms the transaction.'},
  {k:['carla','cye','agent','human','person','whatsapp'],
   a:'I can send your exact question into WhatsApp so you do not need to repeat yourself. Type your question here first, then use “Speak to Carla or Cye on WhatsApp”.'}
];

function answerFor(q){
  const t=q.toLowerCase();
  let best=null, score=0;
  for(const item of answers){
    const s=item.k.reduce((n,k)=>n+(t.includes(k)?1:0),0);
    if(s>score){score=s;best=item;}
  }
  return best ? best.a : 'I can help with Prime Digital’s websites, Google Ads packages, domains, business email, pricing and getting started. If your question needs a person, I can prepare it for WhatsApp.';
}

form?.addEventListener('submit',e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q)return;
  addMsg(q,'user'); input.value='';
  setTimeout(()=>addMsg(answerFor(q),'bot'),120);
});
$$('.quick-prompts button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;form.requestSubmit();}));

$('#agentHandoff')?.addEventListener('click',()=>{
  const userMsgs=$$('.bot-msg.user',messages);
  const question=userMsgs.length?userMsgs[userMsgs.length-1].textContent:'I need help with Prime Digital.';
  const who=confirm('Press OK for Carla, or Cancel for Cye.');
  const num=who?'27641340537':'27747717078';
  const name=who?'Carla':'Cye';
  const msg=`Hi ${name}, I am on the Prime Digital website. My question is: ${question}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,'_blank');
});

const modal=$('#reviewModal');
$('[data-open-review]')?.addEventListener('click',()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false')});
$('.close-review')?.addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')});
$$('#stars button').forEach(btn=>btn.addEventListener('click',()=>{
  $('#rating').value=btn.dataset.rating;
  $$('#stars button').forEach(b=>b.classList.toggle('selected', Number(b.dataset.rating)<=Number(btn.dataset.rating)));
}));
$('#reviewForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  $('#reviewStatus').textContent='Thank you. Review storage/moderation will activate when the secure backend is connected.';
});
$('#suggestionForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  $('#suggestionStatus').textContent='Thank you. Secure suggestion delivery will activate with the website backend.';
});
