/* ===== Moteur ===== */
const $=s=>document.querySelector(s),M=$("#main");
const ABBR={
 "PL/pgSQL":"Procedural Language / PostgreSQL (langage procédural de PostgreSQL)",
 "N+1":"problème de requêtes N+1 (une requête par élément)",
 "SKU":"Stock Keeping Unit (référence de stock)",
 "MERISE":"Méthode d'Étude et de Réalisation Informatique pour les Systèmes d'Entreprise",
 "MCD":"Modèle Conceptuel de Données",
 "MLD":"Modèle Logique de Données",
 "DDL":"Data Definition Language (langage de définition des données)",
 "DML":"Data Manipulation Language (langage de manipulation des données)",
 "ACID":"Atomicité, Cohérence, Isolation et Durabilité",
 "CTE":"Common Table Expression (expression de table commune)",
 "ORM":"Object-Relational Mapping (correspondance objet-relationnel)",
 "SQL":"Structured Query Language (langage de requête structuré)",
 "psql":"PostgreSQL interactive terminal (terminal interactif PostgreSQL)",
 "PDF":"Portable Document Format (format de document portable)"
};
function expandAcronyms(root){const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walk.nextNode()){if(node.parentElement.closest("code,pre,script,style"))continue;node.nodeValue=node.nodeValue.replace(/(^|[^\p{L}\p{N}])([A-Za-z][A-Za-z/+0-9-]*|N\+1)(?![\p{L}\p{N}])/gu,(whole,before,term,offset,source)=>{const key=Object.keys(ABBR).find(k=>k.toLowerCase()===term.toLowerCase());if(!key||/^\s*\(/.test(source.slice(offset+whole.length)))return whole;return `${before}${term} (${ABBR[key]})`})}}
expandAcronyms(document.body);new MutationObserver(()=>expandAcronyms(document.body)).observe(document.body,{childList:true,subtree:true});
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9<>=_*()]+/g," ").trim();
let S={ok:0,n:0,miss:[]};try{S=Object.assign(S,JSON.parse(localStorage.getItem("sqlrev")))}catch(e){}
const save=()=>{try{localStorage.setItem("sqlrev",JSON.stringify(S))}catch(e){}
  $("#st").textContent=S.n?`${S.ok} bonnes réponses sur ${S.n}`:"Aucune réponse pour l'instant";$("#sb").style.width=S.n?S.ok/S.n*100+"%":"0"};
$("#nav").innerHTML=MODES.map(m=>`<button data-m="${m[0]}">${m[1]}</button>`).join("");
$("#nav").onclick=e=>e.target.dataset.m&&go(e.target.dataset.m);
$("#logo").onclick=()=>go("home");$("#logo").onkeydown=e=>e.key=="Enter"&&go("home");
function go(v){clearInterval(TI);document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.m==v));
  M.style.animation="none";M.offsetWidth;M.style.animation="rise .45s both";scrollTo(0,0);
  ({home,cours,flash,mix,game})[v]?({home,cours,flash,mix,game})[v]():quiz(v)}

function home(){M.innerHTML=`<h2>Une commande confirmée, c'est une règle métier tenue.</h2>
<p class="lead">Révise le modèle relationnel et les notions du cours 3A : clés, jointures, SQL, transactions, concurrence, analyse et ORM. Compose ton questionnaire en choisissant les formats et le nombre de questions.</p>
<button class="btn alt" onclick="go('game')">Jouer à la boutique SQL</button> <button class="btn" onclick="go('mix')">Composer mon questionnaire</button> <button class="btn" onclick="go('cours')">Relire le cours illustré</button>`}

const LEVELS=[
 {lesson:0,title:"Dessiner le magasin",story:"Tu dois modéliser les clients, leurs commandes et les articles commandés. À quelle étape décris-tu les entités et leurs liens avant de choisir les tables SQL ?",choices:["MCD","DML","EXPLAIN"],answer:0,why:"Le MCD décrit les entités, associations et cardinalités. Le MLD les traduit ensuite en relations et clés."},
 {lesson:1,title:"Choisir une identité",story:"Un produit a un identifiant technique et un SKU utilisé commercialement. Le SKU peut changer. Quelle colonne choisir comme clé primaire ?",choices:["Le SKU, car il est visible","product_id, l'identifiant stable","Le nom du produit"],answer:1,why:"La clé primaire doit identifier durablement la ligne. Une valeur commerciale unique peut changer : garde-la comme contrainte UNIQUE si nécessaire."},
 {lesson:2,title:"Créer un prix",story:"Tu enregistres un prix qui doit rester exact au centime. Quel type convient le mieux ?",choices:["REAL","NUMERIC(12,2)","BOOLEAN"],answer:1,why:"NUMERIC conserve une précision décimale exacte. Ajoute aussi les contraintes adaptées aux valeurs autorisées."},
 {lesson:3,title:"Ajouter une colonne",story:"Le magasin doit ajouter une colonne à la structure d'une table. Quelle commande relève du DDL ?",choices:["ALTER TABLE","UPDATE","SELECT"],answer:0,why:"ALTER TABLE modifie la structure (DDL). UPDATE modifie les lignes (DML)."},
 {lesson:4,title:"Une date manquante",story:"Tu cherches les commandes dont la date de paiement est absente. Quelle condition utiliser ?",choices:["paid_at = NULL","paid_at IS NULL","paid_at = 0"],answer:1,why:"NULL représente une valeur inconnue. On utilise IS NULL, et non = NULL."},
 {lesson:5,title:"Trier les produits",story:"Plusieurs produits ont le même prix. Quel tri rend l'ordre du résultat prévisible ?",choices:["ORDER BY price DESC, product_id","GROUP BY price","ORDER BY price au hasard"],answer:0,why:"La clé en second critère départage les prix égaux et rend le résultat reproductible."},
 {lesson:6,title:"Garder les clients",story:"Le rapport doit inclure les clients qui n'ont aucune commande. Quelle jointure choisir depuis customer ?",choices:["INNER JOIN","LEFT JOIN","CROSS JOIN"],answer:1,why:"LEFT JOIN conserve toutes les lignes de gauche. Les colonnes de commande valent NULL sans correspondance."},
 {lesson:7,title:"Filtrer un rapport",story:"Tu veux garder les clients ayant au moins cinq commandes après avoir compté leurs commandes. Quelle clause filtre le résultat du regroupement ?",choices:["WHERE","HAVING","ON"],answer:1,why:"WHERE filtre les lignes avant le regroupement ; HAVING filtre les groupes après les agrégats."},
 {lesson:8,title:"Chercher une commande",story:"Tu veux sélectionner les clients pour lesquels il existe au moins une commande en attente. Quel mot-clé exprime ce test ?",choices:["EXISTS","ORDER BY","UNIQUE"],answer:0,why:"EXISTS répond à la question « existe-t-il au moins une ligne correspondante ? »"},
 {lesson:9,title:"Choisir une vue",story:"Le tableau de bord doit toujours afficher les données à jour sans étape de rafraîchissement. Quel objet choisir ?",choices:["Une vue classique","Une vue matérialisée sans refresh","Une copie manuelle"],answer:0,why:"Une vue classique relance sa requête à la lecture. Une vue matérialisée stocke un résultat qui peut vieillir."},
 {lesson:10,title:"Accès de l'équipe",story:"Tu veux donner à un collègue le droit de se connecter à PostgreSQL. Quel élément gère ses privilèges ?",choices:["Un rôle","Un tablespace","ORDER BY"],answer:0,why:"Les rôles portent les privilèges ; l'attribut LOGIN autorise une connexion."},
 {lesson:11,title:"Retrouver la table",story:"Tu es connecté dans psql et veux lister les tables du schéma. Quelle commande psql utiliser ?",choices:["\\dt","\\conninfo","\\i"],answer:0,why:"\\dt liste les tables. \\d table affiche le détail d'une table."},
 {lesson:12,title:"Confirmer une commande",story:"La création de commande et la réservation du stock doivent réussir ensemble ou être annulées ensemble. Quel déroulé choisir ?",choices:["BEGIN, opérations, COMMIT (ou ROLLBACK en cas d'erreur)","Exécuter les opérations sans transaction","Faire seulement un SELECT"],answer:0,why:"La transaction protège l'ensemble des opérations métier. COMMIT valide ; ROLLBACK annule."},
 {lesson:13,title:"Calculer une remise",story:"Tu veux encapsuler un calcul réutilisable qui renvoie un montant dans une requête. Quel objet PL/pgSQL choisir ?",choices:["Une fonction","Une procédure appelée par CALL","Un tablespace"],answer:0,why:"Une fonction renvoie une valeur ou un résultat et peut être appelée dans une requête. Une procédure sert à lancer une action avec CALL."},
 {lesson:14,title:"Tracer les changements",story:"Chaque modification d'une commande doit créer automatiquement une entrée d'historique, quel que soit le chemin d'écriture. Quel mécanisme convient ?",choices:["Un trigger documenté","Un tri ORDER BY","Une vue matérialisée"],answer:0,why:"Un trigger réagit aux INSERT, UPDATE ou DELETE et peut protéger un invariant ou tracer les changements."},
 {lesson:15,title:"Le dernier article",story:"Deux clients essaient de réserver l'unique article en stock au même instant. Quelle règle doit rester vraie ?",choices:["Le stock libre ne devient jamais négatif","Les deux réservations réussissent","Le stock est lu une seule fois au démarrage"],answer:0,why:"Une mise à jour conditionnelle ou un verrouillage coordonne l'accès et empêche la survente."},
 {lesson:16,title:"Classer les vendeurs",story:"Tu veux numéroter les produits par prix décroissant dans chaque boutique tout en gardant une ligne par produit. Quel outil SQL utiliser ?",choices:["ROW_NUMBER() OVER (PARTITION BY ...)","GROUP BY seller_id seulement","COUNT(*)"],answer:0,why:"Une fonction de fenêtre calcule un rang par groupe sans fusionner les lignes comme GROUP BY."},
 {lesson:17,title:"Comprendre une lenteur",story:"La page charge une liste puis lance une requête supplémentaire pour chaque produit. Que reconnais-tu et que peux-tu examiner ?",choices:["Le problème N+1 ; lire le SQL généré et utiliser EXPLAIN","Un problème de clé primaire ; supprimer les clés","Une transaction ; utiliser COMMIT"],answer:0,why:"N+1 produit une requête par élément. Regrouper les lectures puis examiner le plan avec EXPLAIN aide à guider l'optimisation."},
 {lesson:18,title:"Annoncer le grain",story:"Tu construis un rapport avec une ligne par commande. Une commande a plusieurs articles. Quel risque faut-il surveiller après la jointure ?",choices:["La commande peut apparaître plusieurs fois et gonfler les montants","La jointure trie automatiquement les commandes","La clé primaire devient NULL"],answer:0,why:"Une jointure vers plusieurs lignes enfants change le grain du résultat. Il faut en tenir compte dans les agrégats."},
 {lesson:19,title:"Commande vide",story:"Une commande sans article doit afficher zéro article après un LEFT JOIN. Quelle combinaison est la plus adaptée ?",choices:["COUNT(order_item.product_id) et COALESCE(SUM(...), 0)","COUNT(*) uniquement","SUM(...) sans COALESCE"],answer:0,why:"COUNT(*) compterait aussi la ligne conservée par LEFT JOIN. COUNT(colonne) ignore le NULL ; COALESCE remplace le total NULL par zéro."},
 {lesson:20,title:"Éviter le double compte",story:"Une commande a 3 articles et 2 paiements. Une jointure directe donne 6 lignes. Quelle solution protège les totaux ?",choices:["Agréger chaque table enfant par commande avant la jointure","Ajouter DISTINCT après avoir calculé les sommes","Supprimer les paiements"],answer:0,why:"Les ensembles enfants se multiplient (3 × 2). Préagrège articles et paiements séparément, puis joins les totaux."},
 {lesson:21,title:"Vérifier avant d'écrire",story:"Tu modifies les prix des articles. Tu veux vérifier les lignes touchées avant de confirmer, et éviter une erreur de filtre. Que faire ?",choices:["Vérifier le WHERE et utiliser UPDATE ... RETURNING dans une transaction","Lancer UPDATE sans WHERE","Remplacer UPDATE par HAVING"],answer:0,why:"Contrôle le WHERE, utilise RETURNING pour voir les lignes modifiées et valide seulement après vérification."}
];
function game(){let step=0,score=0;const paint=()=>{
 if(step>=LEVELS.length){M.innerHTML=`<div class="game-head"><span>Boutique SQL · bilan</span><span>🏁</span></div><h2>${score} / ${LEVELS.length} bonnes décisions</h2><p class="lead">${score===LEVELS.length?"La boutique tourne parfaitement !":score>=3?"Belle gestion. Tu as protégé les commandes et les données.":"La boutique a quelques soucis, mais tu sais maintenant quoi surveiller."}</p><div class="game-card"><p>À retenir : les transactions protègent les opérations liées, les mises à jour atomiques évitent les surventes et les jointures changent parfois le nombre de lignes.</p></div><p style="margin-top:1rem"><button class="btn alt" id="again">Rejouer</button> <button class="btn" onclick="go('cours')">Revoir le cours</button></p>`;$("#again").onclick=game;return}
 const l=LEVELS[step],lesson=FICHES[l.lesson];M.innerHTML=`<div class="game-head"><span>🏪 Boutique SQL</span><span>Étape ${step+1} / ${LEVELS.length}</span></div><div class="prog game-prog"><i style="width:${step/LEVELS.length*100}%"></i></div><h2>${l.title}</h2><div class="game-card"><p>${l.story}</p></div><div class="game-choices">${l.choices.map((c,i)=>`<button class="opt" data-i="${i}">${c}</button>`).join("")}</div><details class="game-reference"><summary>Fiche du cours : ${lesson[0]}</summary><div>${lesson[1]}</div></details><div id="gamefb" aria-live="polite"></div>`;
 $(".game-choices").onclick=e=>{const b=e.target.closest("button");if(!b||b.disabled)return;const ok=+b.dataset.i===l.answer;score+=+ok;document.querySelectorAll(".game-choices button").forEach((x,i)=>{x.disabled=true;if(i===l.answer)x.classList.add("ok");else if(x===b)x.classList.add("ko")});$("#gamefb").innerHTML=`<div class="fb"><p><b>${ok?"Bien joué !":"Oups !"}</b> ${l.why}</p><button class="btn alt" id="continue">${step===LEVELS.length-1?"Voir le bilan":"Continuer"}</button></div>`;$("#continue").onclick=()=>{step++;paint()}}
 };paint()}

function mix(){M.innerHTML=`<h2>Compose ton questionnaire</h2><p class="lead">Choisis un, deux ou les trois formats. Les questions seront mélangées dans un seul questionnaire.</p><fieldset><legend>Formats de questions</legend><label class="pick"><input type="checkbox" name="kind" value="qcm" checked><span><b>QCM</b><br><span class="muted">Choisir une réponse parmi plusieurs propositions</span></span></label><label class="pick"><input type="checkbox" name="kind" value="type" checked><span><b>Réponse à taper</b><br><span class="muted">Écrire le mot-clé ou la réponse attendue</span></span></label><label class="pick"><input type="checkbox" name="kind" value="link" checked><span><b>Relier</b><br><span class="muted">Associer chaque notion à son rôle</span></span></label></fieldset><label for="nb"><b>Nombre de questions</b></label><br><select id="nb"><option value="10">10 questions</option><option value="15">15 questions</option><option value="20">20 questions</option><option value="0">Toutes les questions disponibles</option></select><p id="mixerror" class="note" hidden>Choisis au moins un format de question.</p><p style="margin-top:1rem"><button class="btn alt" id="startmix">Lancer le questionnaire</button></p>`;$("#startmix").onclick=()=>{const types=[...document.querySelectorAll('input[name="kind"]:checked')].map(x=>x.value);if(!types.length){$("#mixerror").hidden=false;return}quiz("mix",types,+$("#nb").value)}}

function cours(){M.innerHTML=`<h2>Le cours</h2><div class="tabs"><button class="btn" aria-pressed="true" id="t1">Version retravaillée</button><button class="btn" aria-pressed="false" id="t2">PDF original</button></div><div id="cb"></div>`;
  const cb=$("#cb"),t1=$("#t1"),t2=$("#t2");
  const fi=()=>{t1.setAttribute("aria-pressed",true);t2.setAttribute("aria-pressed",false);cb.innerHTML=FICHES.map((f,k)=>`<details><summary>${f[0]}</summary><div>${IMG[k]||""}${f[1]}</div></details>`).join("")};
  const pd=()=>{t2.setAttribute("aria-pressed",true);t1.setAttribute("aria-pressed",false);
    cb.innerHTML=`<label>Document <select id="ps">${PDFS.map(p=>`<option value="${p[1]}">${p[0]}</option>`).join("")}</select></label> <a href="${PDFS[0][1]}" id="pl" download>Télécharger</a><iframe id="pf" title="PDF du cours" src="${PDFS[0][1]}"></iframe>`;
    $("#ps").onchange=e=>{$("#pf").src=e.target.value;$("#pl").href=e.target.value}};
  t1.onclick=fi;t2.onclick=pd;fi()}

let TI,fi=0;
function flash(){const f=FICHES[fi];
  M.innerHTML=`<h2>Flashcards</h2><p class="meta">Carte ${fi+1} sur ${FICHES.length}. Clique ou appuie sur Entrée pour retourner.</p>
  <div class="fc" id="fc" tabindex="0" role="button" aria-label="Retourner la carte"><div><section class="f">${f[0]}</section><section class="b"><span>${f[1]}</span></section></div></div>
  <button class="btn" id="pv">Précédente</button> <button class="btn alt" id="nx">Suivante</button>`;
  const c=$("#fc");c.onclick=()=>c.classList.toggle("flip");c.onkeydown=e=>(e.key=="Enter"||e.key==" ")&&(e.preventDefault(),c.click());
  $("#nx").onclick=()=>{fi=(fi+1)%FICHES.length;flash()};$("#pv").onclick=()=>{fi=(fi+FICHES.length-1)%FICHES.length;flash()}}

function quiz(v,selectedTypes=null,questionCount=10){
  const withId=ALL.map((q,i)=>({...q,id:i}));
  const pool=v=="mix"?withId.filter(q=>selectedTypes.includes(q.t)):v=="err"?withId.filter(q=>S.miss.includes(q.id)):withId.filter(q=>q.t==v);
  let L;if(v=="mix"){
    const target=questionCount||pool.length,required=shuf(selectedTypes.map(t=>shuf(pool.filter(q=>q.t==t))[0]).filter(Boolean));
    const included=new Set(required.map(q=>q.id));L=required.concat(shuf(pool.filter(q=>!included.has(q.id)))).slice(0,Math.max(target,required.length));
  }else L=shuf(pool).slice(0,v=="qcm"?10:99);
  if(v=="mix"&&L.length<questionCount&&questionCount!==0)questionCount=L.length;
  if(!L.length){M.innerHTML=`<h2>Rien à retravailler</h2><p class="lead">Aucune erreur enregistrée. Réponds à quelques questions, celles qui t'échappent apparaîtront ici.</p><button class="btn" onclick="go('all')">Lancer un quiz</button>`;return}
  let i=0,sc=0;
  const next=()=>{i++;show()};
  function done(ok,q,html){if($(".stamp"))return;clearInterval(TI);const t=$(".tag");S.n++;if(ok){S.ok++;sc++;S.miss=S.miss.filter(x=>x!=q.id)}else if(!S.miss.includes(q.id))S.miss.push(q.id);save();
    t.insertAdjacentHTML("afterbegin",`<span class="stamp ${ok?"ok":"ko"}">${ok?"Validé":"À revoir"}</span>`);
    $("#fb").innerHTML=`<div class="fb"><p>${html||""}${q.e?q.e:""}</p><button class="btn" id="nq">${i+1<L.length?"Question suivante":"Voir mon score"}</button></div>`;$("#nq").onclick=next;$("#nq").focus()}
  function show(){
    if(i>=L.length){M.innerHTML=`<h2>${sc} sur ${L.length}</h2><p class="lead">${sc==L.length?"Sans faute.":"Les questions ratées sont gardées dans « Mes erreurs »."}</p><button class="btn alt" onclick="go('${v}')">Recommencer</button>`;return}
    const q=L[i];
    M.innerHTML=`<div class="prog"><i style="width:${i/L.length*100}%"></i></div><section class="tag"><div class="tm"><i id="ti"></i></div><p class="meta">Question ${i+1} sur ${L.length} <b id="tt"></b></p><h2>${q.q}</h2><div id="bd"></div><div id="fb"></div></section>`;
    const bd=$("#bd");
    if(q.t=="qcm"){bd.className="opts";bd.innerHTML=shuf(q.o.map((t,k)=>[t,k])).map(o=>`<button class="opt" data-k="${o[1]}">${o[0]}</button>`).join("");
      bd.onclick=e=>{const b=e.target.closest(".opt");if(!b)return;const ok=+b.dataset.k==q.a;
        bd.querySelectorAll(".opt").forEach(x=>{x.classList.add("done");if(+x.dataset.k==q.a)x.classList.add("ok")});if(!ok)b.classList.add("ko");done(ok,q)}}
    else if(q.t=="type"){bd.innerHTML=`<input type="text" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ta réponse" placeholder="Ta réponse"><button class="btn" id="go">Valider</button>`;
      const inp=$("#in");inp.focus();const sub=()=>{if(!inp.value.trim()||$(".stamp"))return;const ok=q.a.some(a=>norm(a)==norm(inp.value));inp.disabled=true;$("#go").remove();
        done(ok,q,ok?"":`Réponse attendue : <code>${q.a[0]}</code>. `)};$("#go").onclick=sub;inp.onkeydown=e=>{if(e.key=="Enter"){e.preventDefault();sub()}}}
    else{let bad=false,left=null,n=0;const R=shuf(q.p.map(p=>p[1]));
      bd.className="cols";bd.innerHTML=q.p.map((p,k)=>`<button class="opt l" data-k="${k}">${p[0]}</button><button class="opt r" data-v="${R.indexOf(p[1])}">${R[k]}</button>`.replace(/data-v="\d+"/,`data-t="${p[1].replace(/"/g,"&quot;")}"`)).join("");
      // colonne gauche et droite mélangées indépendamment
      const ls=[...bd.querySelectorAll(".l")],rs=[...bd.querySelectorAll(".r")];
      rs.forEach((b,k)=>{b.textContent=R[k];b.dataset.t=R[k]});
      bd.innerHTML="";ls.forEach((l,k)=>{bd.append(l,rs[k])});
      bd.onclick=e=>{const b=e.target.closest(".opt");if(!b||b.classList.contains("ok"))return;
        if(b.classList.contains("l")){bd.querySelectorAll(".l").forEach(x=>x.style.background="");left=b;b.style.background="var(--l)"}
        else if(left){const ok=q.p[+left.dataset.k][1]==b.dataset.t;
          if(ok){left.classList.add("ok","done");b.classList.add("ok","done");left.style.background="";left=null;if(++n==q.p.length)done(!bad,q,bad?"Quelques erreurs en route. ":"")}
          else{bad=true;b.classList.add("ko");setTimeout(()=>b.classList.remove("ko"),400)}}}}
    const dur=q.t=="qcm"?20:q.t=="type"?30:45,t0=Date.now();clearInterval(TI);
    TI=setInterval(()=>{const r=dur-(Date.now()-t0)/1000,b=$("#ti");if(!b)return clearInterval(TI);
      b.style.width=Math.max(r,0)/dur*100+"%";b.classList.toggle("lo",r<6);$("#tt").textContent=Math.ceil(Math.max(r,0))+" s";
      if(r<=0){clearInterval(TI);if($(".stamp"))return;bd.onclick=null;
        bd.querySelectorAll(".opt").forEach(x=>{x.classList.add("done");if(q.t=="qcm"&&+x.dataset.k==q.a)x.classList.add("ok")});
        const inp=$("#in");if(inp)inp.disabled=true;
        done(false,q,"Temps écoulé. "+(q.t=="type"?`Réponse attendue : <code>${q.a[0]}</code>. `:""))}},200)
  }
  show()}
save();go("home");

