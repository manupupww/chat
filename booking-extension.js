/**
 * Voiceflow Booking Extension - Salon with Categories
 * Trace type: 'ext_booking'
 */

// ===== SALON SERVICES DATA =====
const SALON_SERVICES = [
  {
    category: '💅 Nagų procedūros',
    items: [
      { name: 'Nagų priauginimas', price: '40 €' },
      { name: 'Priaugintų nagų korekcija', price: '30 €' },
      { name: 'Manikiūras su ilgalaikiu lakavimu', price: '25 €' },
      { name: 'Pedikiūras', price: '40 €' },
      { name: 'Ekspres pedikiūras', price: '30 €' },
    ]
  },
  {
    category: '💇 Plaukų kirpimas',
    items: [
      { name: 'Vyriškas kirpimas', price: '15–20 €' },
      { name: 'Barzdos kirpimas', price: '5–10 €' },
      { name: 'Galvos plovimas', price: '3 €' },
      { name: 'Šventinis vyriškas sušukavimas', price: '10–15 €' },
      { name: 'Vaikų kirpimas', price: '12–15 €' },
      { name: 'Moteriški kirpimai', price: '15–25 €' },
      { name: 'Dažymai įvairiomis technikomis', price: 'nuo 50 €' },
      { name: 'Šukuosenos (garb., ties.)', price: '30–60 €' },
      { name: 'Gydomosios plaukų procedūros', price: '30–60 €' },
    ]
  },
  {
    category: '✨ Ilgalaikis makiažas',
    items: [
      { name: 'Ilgalaikis makiažas (antakių/lūpų/akių)', price: '80 €' },
      { name: 'Ilgalaikio makiažo korekcija (3 mėn.)', price: '50 €' },
      { name: 'Blakstienų priauginimas', price: '40 €' },
      { name: 'Blakstienų korekcija', price: '30 €' },
      { name: 'Blakstienų dažymas', price: '10 €' },
    ]
  },
  {
    category: '💄 Makiažas ir antakiai',
    items: [
      { name: 'Makiažas', price: '35–50 €' },
      { name: 'Antakių korekcija / dažymas', price: '15 €' },
      { name: 'Antakių korekcija / dažymas / laminavimas', price: '20 €' },
      { name: 'Antakių korekcija vašku / pincetu', price: '8–10 €' },
    ]
  },
  {
    category: '🧴 Kosmetologės paslaugos',
    items: [
      { name: 'Depiliacija vašku', price: '10–30 €' },
      { name: 'Veido valymas', price: '50–60 €' },
      { name: 'Rūgštiniai pilingai', price: 'nuo 40 €' },
      { name: 'Veido procedūros', price: 'nuo 40 €' },
      { name: 'Lipolitikai – Pagurklis', price: '40 €' },
      { name: 'Lipolitikai – Rankos', price: '65 €' },
      { name: 'Lipolitikai – Pilvas', price: '90 €' },
      { name: 'Lipolitikai – Pilvo šonai', price: '65 €' },
      { name: 'Lipolitikai – Kojos', price: '120 €' },
      { name: 'Lipolitikai – Nugarinė dalis', price: '80 €' },
    ]
  }
];

const BookingExtension = {
  name: 'Booking',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_booking' || trace.payload?.name === 'ext_booking',

  render: ({ trace, element }) => {
    const { businessName = 'Salonas', occupiedSlots = {}, blockedDates = [] } = trace.payload || {};

    let step = 1; // 1=category, 2=service, 3=date, 4=time, 5=contact
    let selCategory = null, selService = null, selPrice = '', selDate = null, selTime = null;
    let viewMonth = new Date().getMonth(), viewYear = new Date().getFullYear();
    let submitted = false;

    function getOccupied(ds) {
      if (occupiedSlots[ds]) return occupiedSlots[ds];
      const seed = ds.split('-').reduce((a,b) => a + parseInt(b), 0);
      return genSlots().filter((_,i) => (seed*(i+1)*7)%10 < 3);
    }
    function isBlocked(ds) {
      if (blockedDates.includes(ds)) return true;
      return new Date(ds+'T00:00:00').getDay() === 0;
    }
    function genSlots() {
      const s=[];
      for(let h=9;h<=17;h++){s.push(`${String(h).padStart(2,'0')}:00`);if(h<17)s.push(`${String(h).padStart(2,'0')}:30`);}
      return s;
    }
    function ds(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}

    // ===== STYLES =====
    const css = `
.vfb{font-family:'Inter','Segoe UI',sans-serif;width:330px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1)}
.vfb *{box-sizing:border-box;margin:0;padding:0}
.vfb-h{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 18px;text-align:center}
.vfb-h h3{font-size:15px;font-weight:700}.vfb-h p{font-size:11px;opacity:.8;margin-top:2px}
.vfb-pr{display:flex;gap:3px;padding:10px 16px 6px;background:#f8f9fb}
.vfb-pr .s{flex:1;height:3px;border-radius:3px;background:#e2e5ea;transition:.3s}
.vfb-pr .s.a{background:#6366f1}.vfb-pr .s.d{background:#22c55e}
.vfb-b{padding:14px 16px;min-height:160px;max-height:380px;overflow-y:auto}
.vfb-b h4{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:10px}
.vfb-f{padding:0 16px 14px;display:flex;gap:8px}

/* Category buttons */
.vfb-cat{display:flex;flex-direction:column;gap:6px}
.vfb-cb{padding:10px 12px;border:2px solid #e2e5ea;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#334155;transition:.2s;text-align:left;display:flex;align-items:center;justify-content:space-between}
.vfb-cb:hover{border-color:#6366f1;background:#f5f3ff}
.vfb-cb.sel{border-color:#6366f1;background:#6366f1;color:#fff}
.vfb-cb .cnt{font-size:11px;opacity:.6}

/* Service list */
.vfb-sl{display:flex;flex-direction:column;gap:5px}
.vfb-si{padding:9px 12px;border:2px solid #e2e5ea;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#334155;transition:.2s;display:flex;justify-content:space-between;align-items:center}
.vfb-si:hover{border-color:#6366f1;background:#f5f3ff}
.vfb-si.sel{border-color:#6366f1;background:#6366f1;color:#fff}
.vfb-si .pr{font-weight:700;font-size:12px;white-space:nowrap}
.vfb-si.sel .pr{color:#c7d2fe}

/* Calendar */
.vfb-cn{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.vfb-cn span{font-size:13px;font-weight:600;color:#1e293b}
.vfb-cn button{width:26px;height:26px;border:1px solid #e2e5ea;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}
.vfb-cn button:hover{background:#f5f3ff;border-color:#6366f1}
.vfb-cg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.vfb-cg .dh{font-size:10px;font-weight:600;color:#94a3b8;padding:3px 0}
.vfb-cg .dc{font-size:11px;padding:5px 2px;border-radius:6px;cursor:pointer;transition:.2s;font-weight:500;color:#334155;position:relative}
.vfb-cg .dc:hover{background:#f5f3ff}
.vfb-cg .dc.today{font-weight:700;color:#6366f1}
.vfb-cg .dc.sel{background:#6366f1;color:#fff}
.vfb-cg .dc.blocked{color:#cbd5e1;cursor:not-allowed;text-decoration:line-through;background:transparent}
.vfb-cg .dc.past{color:#e2e5ea;cursor:not-allowed}
.vfb-cg .dc.empty{cursor:default}
.vfb-cg .dc.ok::after{content:'';position:absolute;bottom:1px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#22c55e}
.vfb-cg .dc.few::after{background:#f59e0b}

/* Time */
.vfb-tg{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.vfb-tb{padding:7px 3px;border:2px solid #e2e5ea;border-radius:7px;background:#fff;cursor:pointer;font-size:12px;font-weight:500;color:#334155;transition:.2s;text-align:center}
.vfb-tb:hover{border-color:#6366f1;background:#f5f3ff}
.vfb-tb.sel{border-color:#6366f1;background:#6366f1;color:#fff}
.vfb-tb.occ{background:#fee2e2;border-color:#fca5a5;color:#b91c1c;cursor:not-allowed;text-decoration:line-through;opacity:.6}
.vfb-ti{font-size:10px;color:#64748b;margin-bottom:6px;display:flex;gap:10px}

/* Form */
.vfb-fd{margin-bottom:7px}
.vfb-fd label{display:block;font-size:11px;font-weight:600;color:#64748b;margin-bottom:2px}
.vfb-fd input{width:100%;padding:7px 10px;border:2px solid #e2e5ea;border-radius:7px;font-size:12px;outline:none;transition:.2s}
.vfb-fd input:focus{border-color:#6366f1}.vfb-fd input.err{border-color:#ef4444}

/* Summary */
.vfb-sm{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px;margin-bottom:8px}
.vfb-sr{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
.vfb-sr .l{color:#64748b}.vfb-sr .v{color:#1e293b;font-weight:600;text-align:right;max-width:180px}

/* Buttons */
.vfb-bp{flex:1;padding:9px 14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
.vfb-bp:disabled{background:#cbd5e1;cursor:not-allowed}
.vfb-bs{padding:9px 10px;background:transparent;color:#64748b;border:2px solid #e2e5ea;border-radius:8px;font-size:12px;cursor:pointer}
.vfb.off{opacity:.7;pointer-events:none}
.vfb-leg{display:flex;gap:8px;margin-top:6px;font-size:9px;color:#94a3b8}
`;

    const root = document.createElement('div'); root.className = 'vfb';
    const styleEl = document.createElement('style'); styleEl.textContent = css;
    const head = document.createElement('div'); head.className = 'vfb-h';
    head.innerHTML = `<h3>📅 Rezervuoti vizitą</h3><p>${businessName}</p>`;
    const prog = document.createElement('div'); prog.className = 'vfb-pr';
    for(let i=1;i<=5;i++){const s=document.createElement('div');s.className='s';s.dataset.s=i;prog.appendChild(s);}
    const body = document.createElement('div'); body.className = 'vfb-b';
    const foot = document.createElement('div'); foot.className = 'vfb-f';

    function updProg(){prog.querySelectorAll('.s').forEach(s=>{const n=+s.dataset.s;s.className='s'+(n<step?' d':'')+(n===step?' a':'');});}

    // STEP 1: Category
    function rS1(){
      body.innerHTML='<h4>📂 Pasirinkite kategoriją</h4>';
      const g=document.createElement('div');g.className='vfb-cat';
      SALON_SERVICES.forEach(cat=>{
        const b=document.createElement('button');b.className='vfb-cb'+(selCategory===cat.category?' sel':'');
        b.innerHTML=`<span>${cat.category}</span><span class="cnt">${cat.items.length} pasl.</span>`;
        b.onclick=()=>{selCategory=cat.category;selService=null;selPrice='';g.querySelectorAll('.vfb-cb').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');updF();};
        g.appendChild(b);
      });
      body.appendChild(g);
    }

    // STEP 2: Service
    function rS2(){
      const cat=SALON_SERVICES.find(c=>c.category===selCategory);
      body.innerHTML=`<h4>${selCategory}</h4>`;
      const g=document.createElement('div');g.className='vfb-sl';
      cat.items.forEach(sv=>{
        const b=document.createElement('button');b.className='vfb-si'+(selService===sv.name?' sel':'');
        b.innerHTML=`<span>${sv.name}</span><span class="pr">${sv.price}</span>`;
        b.onclick=()=>{selService=sv.name;selPrice=sv.price;g.querySelectorAll('.vfb-si').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');updF();};
        g.appendChild(b);
      });
      body.appendChild(g);
    }

    // STEP 3: Calendar
    function rS3(){
      body.innerHTML='<h4>📆 Pasirinkite datą</h4>';
      const nav=document.createElement('div');nav.className='vfb-cn';
      const months=['Sausis','Vasaris','Kovas','Balandis','Gegužė','Birželis','Liepa','Rugpjūtis','Rugsėjis','Spalis','Lapkritis','Gruodis'];
      const pb=document.createElement('button');pb.innerHTML='‹';pb.onclick=()=>{viewMonth--;if(viewMonth<0){viewMonth=11;viewYear--;}rS3();updF();};
      const nb=document.createElement('button');nb.innerHTML='›';nb.onclick=()=>{viewMonth++;if(viewMonth>11){viewMonth=0;viewYear++;}rS3();updF();};
      const lb=document.createElement('span');lb.textContent=`${months[viewMonth]} ${viewYear}`;
      nav.appendChild(pb);nav.appendChild(lb);nav.appendChild(nb);body.appendChild(nav);

      const grid=document.createElement('div');grid.className='vfb-cg';
      ['Pr','An','Tr','Ke','Pe','Še','Se'].forEach(d=>{const h=document.createElement('div');h.className='dh';h.textContent=d;grid.appendChild(h);});

      const fd=new Date(viewYear,viewMonth,1).getDay();
      const dim=new Date(viewYear,viewMonth+1,0).getDate();
      const off=(fd===0?6:fd-1);
      const today=new Date();today.setHours(0,0,0,0);

      for(let i=0;i<off;i++){const e=document.createElement('div');e.className='dc empty';grid.appendChild(e);}
      for(let d=1;d<=dim;d++){
        const c=document.createElement('div');c.className='dc';c.textContent=d;
        const s=ds(viewYear,viewMonth,d);const dt=new Date(viewYear,viewMonth,d);
        if(dt<today){c.classList.add('past');}
        else if(isBlocked(s)){c.classList.add('blocked');}
        else{
          const occ=getOccupied(s);const free=genSlots().length-occ.length;
          if(free<=3&&free>0)c.classList.add('few');else if(free>3)c.classList.add('ok');else c.classList.add('blocked');
          if(selDate===s)c.classList.add('sel');
          c.onclick=()=>{selDate=s;selTime=null;rS3();updF();};
        }
        if(dt.getTime()===today.getTime())c.classList.add('today');
        grid.appendChild(c);
      }
      body.appendChild(grid);
      const leg=document.createElement('div');leg.className='vfb-leg';
      leg.innerHTML='<span>🟢 Laisva</span><span>🟡 Mažai vietų</span><span>⛔ Užimta</span>';
      body.appendChild(leg);
    }

    // STEP 4: Time
    function rS4(){
      body.innerHTML='<h4>🕐 Pasirinkite laiką</h4>';
      const info=document.createElement('div');info.className='vfb-ti';
      const fd=new Date(selDate+'T00:00:00');
      info.innerHTML=`<strong>${fd.toLocaleDateString('lt-LT',{weekday:'long',month:'long',day:'numeric'})}</strong>`;
      body.appendChild(info);
      const grid=document.createElement('div');grid.className='vfb-tg';
      const occ=getOccupied(selDate);
      genSlots().forEach(slot=>{
        const b=document.createElement('button');b.className='vfb-tb';b.textContent=slot;
        if(occ.includes(slot)){b.classList.add('occ');}
        else{if(selTime===slot)b.classList.add('sel');b.onclick=()=>{selTime=slot;grid.querySelectorAll('.vfb-tb').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');updF();};}
        grid.appendChild(b);
      });
      body.appendChild(grid);
    }

    // STEP 5: Contact
    function rS5(){
      body.innerHTML='<h4>👤 Jūsų duomenys</h4>';
      const sm=document.createElement('div');sm.className='vfb-sm';
      const fd=new Date(selDate+'T00:00:00').toLocaleDateString('lt-LT',{weekday:'long',month:'long',day:'numeric'});
      sm.innerHTML=`<div class="vfb-sr"><span class="l">Paslauga</span><span class="v">${selService}</span></div>
        <div class="vfb-sr"><span class="l">Kaina</span><span class="v">${selPrice}</span></div>
        <div class="vfb-sr"><span class="l">Data</span><span class="v">${fd}</span></div>
        <div class="vfb-sr"><span class="l">Laikas</span><span class="v">${selTime}</span></div>`;
      body.appendChild(sm);
      [{n:'name',l:'Vardas, Pavardė',t:'text',p:'Jonas Jonaitis'},{n:'phone',l:'Telefonas',t:'tel',p:'+370 600 00000'},{n:'email',l:'El. paštas',t:'email',p:'jonas@pvz.lt'}].forEach(f=>{
        const w=document.createElement('div');w.className='vfb-fd';
        const lb=document.createElement('label');lb.textContent=f.l;
        const inp=document.createElement('input');inp.type=f.t;inp.name=f.n;inp.placeholder=f.p;inp.required=true;
        w.appendChild(lb);w.appendChild(inp);body.appendChild(w);
      });
    }

    function updF(){
      foot.innerHTML='';
      if(step>1){const b=document.createElement('button');b.className='vfb-bs';b.textContent='← Atgal';b.onclick=()=>{step--;render();};foot.appendChild(b);}
      else{const b=document.createElement('button');b.className='vfb-bs';b.textContent='Atšaukti';b.onclick=()=>{if(submitted)return;submitted=true;root.classList.add('off');window.voiceflow.chat.interact({type:'booking_canceled'});};foot.appendChild(b);}

      const nb=document.createElement('button');nb.className='vfb-bp';
      if(step<5){
        nb.textContent='Toliau →';
        nb.disabled=!((step===1&&selCategory)||(step===2&&selService)||(step===3&&selDate)||(step===4&&selTime));
        nb.onclick=()=>{step++;render();};
      }else{
        nb.textContent='✓ Patvirtinti';
        nb.onclick=()=>{
          if(submitted)return;
          const ni=body.querySelector('input[name="name"]'),pi=body.querySelector('input[name="phone"]'),ei=body.querySelector('input[name="email"]');
          let ok=true;
          [ni,pi,ei].forEach(i=>{if(!i.value.trim()){i.classList.add('err');ok=false;}else i.classList.remove('err');});
          if(!ok)return;
          submitted=true;nb.disabled=true;nb.textContent='Rezervuota! ✓';root.classList.add('off');
          window.voiceflow.chat.interact({type:'booking_complete',payload:{
            category:selCategory,service:selService,price:selPrice,date:selDate,time:selTime,
            name:ni.value.trim(),phone:pi.value.trim(),email:ei.value.trim()
          }});
        };
      }
      foot.appendChild(nb);
    }

    function render(){updProg();switch(step){case 1:rS1();break;case 2:rS2();break;case 3:rS3();break;case 4:rS4();break;case 5:rS5();break;}updF();}

    root.appendChild(styleEl);root.appendChild(head);root.appendChild(prog);root.appendChild(body);root.appendChild(foot);
    render();element.appendChild(root);
  },
};
