/* One task-scoped image chooser for requirement and shot prompt inputs. */
const REFERENCE_CATEGORIES=['人物','商品','场景'];
let referenceChooser=null;
mentions=function(){return '';}; // Retire the old full-page, end-of-text-only list.

function referenceCategory(a){return a.role==='商品'?'商品':a.role==='场景'?'场景':'人物';}
function referenceImages(t){return refs(t).filter(a=>a.type==='image'&&a.role!=='原片记录');}
function referenceMatches(images,query,category='全部'){
  const key=query.trim().toLocaleLowerCase();
  return images.filter(a=>(category==='全部'||referenceCategory(a)===category)&&(!key||`${a.name} ${a.role||''} ${a.tags||''}`.toLocaleLowerCase().includes(key)));
}
function referenceQuery(value,caret){
  const before=value.slice(0,caret),start=before.lastIndexOf('@');
  if(start<0||/[\w]/.test(before[start-1]||'')||/[@\n，。；、!?！？]/.test(before.slice(start+1)))return null;
  const query=before.slice(start+1);
  if(/^视频\d/.test(query)||/^图片\d+/.test(query)||/\s$/.test(query))return null;
  return {start,end:caret,query};
}
function namedReferenceAssets(value,images){
  return images.filter(a=>{
    const token='@'+a.name;let pos=value.indexOf(token);
    while(pos>=0){const following=value[pos+token.length];
      if(!following||/[\s，。；、!?！？）)\]】]/.test(following))return true;
      pos=value.indexOf(token,pos+token.length);
    }return false;
  });
}
function insertReferenceValue(value,range,a,shotRefs){
  const local=Array.isArray(shotRefs);
  if(local&&!shotRefs.includes(a.id))shotRefs.push(a.id);
  const token=local?'@图片'+(shotRefs.indexOf(a.id)+1)+'（'+a.name+'）':'@'+a.name;
  const insertion=token+' ',next=value.slice(0,range.start)+insertion+value.slice(range.end);
  return {value:next,caret:range.start+insertion.length};
}
function referenceInputContext(el){
  if(!el?.matches?.('textarea,input[type="text"],input:not([type])')||el.disabled||el.readOnly)return null;
  const t=task();if(!t)return null;
  if(el.dataset.field==='prompt')return {t,s:shot(+el.dataset.i)};
  if(el.dataset.spField==='repairPrompt'){const session=repairSession();return session&&!session.draft.generating&&!session.draft.merging?{t:session.task||t,s:session.shot,repair:session}:null;}
  if(el.dataset.field==='brief'||el.dataset.automaticBatchField==='brief'||el.dataset.batchInput==='brief'||el.dataset.wfField==='batchBrief')return {t};
  return null;
}
function refreshReferenceBindings(el,ctx){
  if(!ctx?.s)return;
  ctx.s.refs=ctx.s.refs||[];
  for(const a of namedReferenceAssets(el.value,referenceImages(ctx.t)))if(!ctx.s.refs.includes(a.id))ctx.s.refs.push(a.id);
  const card=el.closest('.studio-shot'),layer=el.closest('.prompt-edit-surface')?.querySelector('.prompt-token-layer');
  if(layer){layer.innerHTML=studioPromptTokens({...ctx.s,prompt:el.value});layer.scrollTop=el.scrollTop;}
  let chips=card?.querySelector('.studio-references');const chipHTML=card&&studioReferences(ctx.s,ctx.t);
  if(!chips&&chipHTML){chips=document.createElement('div');chips.className='studio-references row wrap';chips.setAttribute('aria-label','本镜已引用图片');card.querySelector('.studio-prompt-frame')?.after(chips);}
  if(chips){chips.innerHTML=chipHTML;chips.hidden=!chipHTML;}
  const count=card?.querySelector('.studio-prompt-meta>span');if(count)count.textContent=el.value.length+' 字';
}
studioPromptTokens=function(s){
  const images=(s.refs||[]).map(id=>state.assets.find(a=>a.id===id)).filter(Boolean);
  const names=images.map(a=>a.name).sort((a,b)=>b.length-a.length);
  const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp('@图片(\\d+)'+(names.length?'|@('+names.map(escapeRE).join('|')+')(?=$|[\\s，。；、!?！？）)\\]】])':''),'g');
  let html='',end=0;
  for(const m of (s.prompt||'').matchAll(re)){
    html+=esc(s.prompt.slice(end,m.index));const a=m[1]?state.assets.find(a=>a.id===s.refs[+m[1]-1]):images.find(a=>a.name===m[2]);
    html+=a?`<span class="prompt-image-token" data-sp-image-hover="true" data-i="${esc(a.id)}" title="${esc(a.name)}">${esc(m[0])}</span>`:esc(m[0]);end=m.index+m[0].length;
  }return html+esc((s.prompt||'').slice(end));
};
function closeReferenceChooser(){
  if(referenceChooser){const {input}=referenceChooser;input.removeAttribute('aria-controls');input.removeAttribute('aria-expanded');input.removeAttribute('aria-activedescendant');referenceChooser.panel.remove();referenceChooser=null;}
}
function placeReferenceChooser(){
  const c=referenceChooser;if(!c)return;if(!c.input.isConnected)return closeReferenceChooser();
  const r=c.input.getBoundingClientRect(),width=Math.min(Math.max(r.width,300),780,window.innerWidth-24),left=Math.min(Math.max(12,r.left),window.innerWidth-width-12);
  c.panel.style.left=left+'px';c.panel.style.top=(r.bottom+6)+'px';c.panel.style.width=width+'px';
  c.panel.style.maxHeight=Math.max(100,Math.min(460,window.innerHeight-r.bottom-18))+'px';
}
function paintReferenceChooser(){
  const c=referenceChooser;if(!c)return;
  c.matches=referenceMatches(referenceImages(c.ctx.t),c.range.query,c.category);c.index=Math.max(0,Math.min(c.index,c.matches.length-1));
  const groups=REFERENCE_CATEGORIES.map(category=>{
    const images=c.matches.filter(a=>referenceCategory(a)===category);
    return `<section aria-label="${category}参考图片"><b>${category}<span>${images.length}</span></b><div class="reference-chooser-group">${images.map(a=>{
      const i=c.matches.indexOf(a);
      return `<button type="button" role="option" id="reference-option-${i}" aria-label="${esc(a.name)}" aria-selected="${i===c.index}" data-reference-choose="${esc(a.id)}"><span class="reference-chooser-image" aria-hidden="true">${assetVisual(a,'mini')}</span><span>${esc(a.name)}</span></button>`;
    }).join('')||`<p class="reference-chooser-empty">${c.range.query?'暂无匹配图片':'暂无参考图片'}</p>`}</div></section>`;
  }).join('');
  c.panel.innerHTML=`<div class="reference-chooser-head"><b>选择参考图片 <span>${c.matches.length}</span></b><button type="button" data-reference-dismiss aria-label="关闭素材候选">${studioIcon('close')}</button></div><div class="reference-chooser-options" role="listbox" id="reference-options" aria-label="选择任务素材">${groups}</div><div class="reference-chooser-foot">点击图片引用 · 输入名称搜索<span>↑↓ 选择 · Enter 引用 · Esc 关闭</span></div>`;
  c.input.setAttribute('aria-activedescendant',c.matches.length?'reference-option-'+c.index:'');placeReferenceChooser();
}
function updateReferenceChooser(input){
  const ctx=referenceInputContext(input),range=ctx&&referenceQuery(input.value,input.selectionStart??input.value.length);
  if(!ctx||!range)return closeReferenceChooser();
  if(referenceChooser?.input!==input){closeReferenceChooser();const panel=document.createElement('div');panel.className='reference-chooser';panel.id='reference-chooser';(input.closest('dialog')||document.body).append(panel);referenceChooser={panel,input,ctx,range,category:'全部',index:0,matches:[]};}
  else {if(referenceChooser.range.query!==range.query){referenceChooser.category='全部';referenceChooser.index=0;}referenceChooser.ctx=ctx;referenceChooser.range=range;}
  input.setAttribute('aria-controls','reference-options');input.setAttribute('aria-expanded','true');paintReferenceChooser();
}
function chooseReference(id){
  const c=referenceChooser;if(!c)return;const a=referenceImages(c.ctx.t).find(a=>a.id===id);if(!a)return;
  const inserted=insertReferenceValue(c.input.value,c.range,a,c.ctx.s?.refs);
  c.input.value=inserted.value;c.input.focus();c.input.setSelectionRange(inserted.caret,inserted.caret);
  closeReferenceChooser();c.input.dispatchEvent(new Event('input',{bubbles:true}));refreshReferenceBindings(c.input,c.ctx);save();
}
document.addEventListener('input',e=>{const ctx=referenceInputContext(e.target);if(!ctx)return;refreshReferenceBindings(e.target,ctx);save();if(!e.isComposing)updateReferenceChooser(e.target);});
document.addEventListener('compositionend',e=>{if(referenceInputContext(e.target))updateReferenceChooser(e.target);});
document.addEventListener('focusin',e=>{if(referenceInputContext(e.target))updateReferenceChooser(e.target);});
document.addEventListener('click',e=>{
  const choose=e.target.closest('[data-reference-choose]');if(choose){chooseReference(choose.dataset.referenceChoose);return;}
  const category=e.target.closest('[data-reference-category]');if(category&&referenceChooser){referenceChooser.category=category.dataset.referenceCategory;referenceChooser.index=0;paintReferenceChooser();return;}
  if(e.target.closest('[data-reference-dismiss]'))return closeReferenceChooser();
  if(referenceInputContext(e.target)){updateReferenceChooser(e.target);return;}
  if(referenceChooser&&!referenceChooser.panel.contains(e.target))closeReferenceChooser();
});
document.addEventListener('mousedown',e=>{if(e.target.closest('.reference-chooser'))e.preventDefault();});
document.addEventListener('keydown',e=>{
  const c=referenceChooser;if(!c||e.target!==c.input||e.isComposing)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeReferenceChooser();}
  else if(['ArrowDown','ArrowUp'].includes(e.key)&&c.matches.length){e.preventDefault();c.index=(c.index+(e.key==='ArrowDown'?1:-1)+c.matches.length)%c.matches.length;paintReferenceChooser();c.panel.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});}
  else if(e.key==='Enter'&&c.matches.length){e.preventDefault();e.stopImmediatePropagation();chooseReference(c.matches[c.index].id);}
},true);
document.addEventListener('focusout',e=>{if(referenceChooser?.input===e.target&&!referenceChooser.panel.contains(e.relatedTarget))closeReferenceChooser();});
document.addEventListener('scroll',placeReferenceChooser,true);window.addEventListener('resize',placeReferenceChooser);
const referenceComposerRender=render;
render=function(){closeReferenceChooser();referenceComposerRender();};
render();
