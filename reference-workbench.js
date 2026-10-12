/* Screenshot composition: one selected shot beside a vertical chapter list. */
const referencePicked=new Map();
const referencePriorWork=work;
work=function(){
 const t=task();if(experienceLanding||!t||t.phase==='batch'||(t.gated&&!t.sourceParsed))return referencePriorWork();
 workflowState(t);let uid=referencePicked.get(t.id);if(!t.shots.some(s=>s.uid===uid))uid=t.shots[0]?.uid;referencePicked.set(t.id,uid);const selected=t.shots.find(s=>s.uid===uid);
 return `<main class="wf-main studio-work reference-work" data-workflow-tab="制作">${storageFeedback()}${brief(t)}<div class="reference-workspace"><nav class="reference-shot-list" aria-label="分镜列表"><div class="row between"><b>分镜列表</b><button data-action="addShot" aria-label="新增分镜">${studioIcon('plus')}</button></div><button class="primary reference-generate-all" data-studio="generateAll" ${!t.parsed||t.requirementDirty||!t.shots.some(s=>['edit','aigc'].includes(s.method)&&s.prompt.trim()&&!(s.independent&&s.method==='edit'&&!s.sourceAssetId)&&!t.clipVersions.some(v=>v.shotUid===s.uid&&v.status==='生成中'))?'disabled':''} title="生成所有已填写提示词的分镜；跳过原片、空白和生成中的分镜">${studioIcon('wand')} 一键生成所有分镜</button><div class="reference-shot-items">${t.shots.map(s=>{const p=studioStatus(t,s);return `<div class="reference-nav-item ${s.uid===uid?'selected':''}"><button data-reference-shot="${s.uid}" aria-label="选择分镜${s.id+1}">${shotVisual(s,'shot-photo',t)}<b>${String(s.id+1).padStart(2,'0')}</b><span class="reference-nav-state"><i>${s.uid===uid?'✓':''}</i><small class="studio-status ${p.type}">${p.text}</small></span></button><button class="reference-nav-delete" data-action="deleteShot" data-i="${s.id}" aria-label="删除分镜${s.id+1}">×</button></div>`}).join('')}</div>${compositionToolbar(t)}${t.templates.length?'<button class="reference-batch-entry" data-bp-action="phase" data-phase="batch">批量生产</button>':''}</nav><div class="reference-current-shot">${selected?shotCard(selected,t):''}</div></div></main>`;
};
document.addEventListener('click',e=>{const button=e.target.closest('[data-reference-shot]');if(!button)return;referencePicked.set(task().id,button.dataset.referenceShot);render();});

render();
const referencePriorRender=render;
render=function(){referencePriorRender();const main=document.querySelector('.reference-work');if(!main)return;const t=task(),s=t.shots.find(x=>x.uid===referencePicked.get(t.id));if(!s)return;const editor=main.querySelector('.studio-shot-editor');if(editor){const tabs=document.createElement('div');tabs.className='reference-editor-tabs';tabs.innerHTML=`<button data-reference-tab="edit" class="${!s.open&&!s.sourceDetailsOpen?'active':''}">编辑</button><button data-reference-tab="cuts" class="${s.open?'active':''}">调整细分镜</button><button data-reference-tab="source" class="${s.sourceDetailsOpen?'active':''}">原片信息</button>`;editor.prepend(tabs);const disclosure=main.querySelector(s.open?'.studio-cuts':s.sourceDetailsOpen?'.studio-source-disclosure':'.not-found');if(disclosure){editor.append(disclosure);editor.querySelectorAll('.studio-prompt,.studio-shot-results,.studio-generation,.studio-speech-editor,.studio-mouth').forEach(el=>el.hidden=true)}}const title=main.querySelector('.studio-brief h2');if(title)title.textContent='输入你的模糊需求';};
document.addEventListener('click',e=>{const b=e.target.closest('[data-reference-tab]');if(!b)return;const t=task(),s=t.shots.find(x=>x.uid===referencePicked.get(t.id));if(!s)return;s.open=b.dataset.referenceTab==='cuts';s.sourceDetailsOpen=b.dataset.referenceTab==='source';render();});
render();
const referenceFinalRender=render;
render=function(){referenceFinalRender();const main=document.querySelector('.reference-work');if(!main)return;const refs=main.querySelector('.studio-references'),frame=main.querySelector('.studio-prompt-frame');if(refs&&frame)frame.after(refs);};
render();
const referenceToolbarRender=render;
render=function(){referenceToolbarRender();const main=document.querySelector('.reference-work');if(!main)return;const tools=main.querySelector('.studio-composer-tools');if(tools){const settings=document.createElement('div');settings.className='reference-model-settings';settings.innerHTML='<label>视频 <select aria-label="视频模型"><option>SD2.5</option></select></label><span>9:16</span><button data-reference-clear="true">清空</button>';tools.querySelector('.row')?.append(settings);}const state=main.querySelector('.studio-preview-switch [aria-pressed="true"]');if(state)state.classList.add('reference-source-active');};
document.addEventListener('click',e=>{if(!e.target.closest('[data-reference-clear]'))return;const t=task();t.brief='';t.requirementDirty=true;save();render();});
render();
header=function(){return `<header class="reference-header"><div class="brand"><span class="brand-mark">${uiIcon('brand')}</span>复刻大师 <em>2.0</em></div><nav aria-label="主导航"><button data-action="view" data-view="work" class="${view==='work'?'active':''}">${uiIcon('work')}工作台</button><button data-action="view" data-view="assets" class="${view==='assets'?'active':''}">${uiIcon('assets')}资产库</button></nav><div class="reference-account"><span>${uiIcon('resume')} ${localSaveStatus.ok?'已保存':'保存失败'}</span><button data-action="reset" aria-label="演示选项">${uiIcon('more')}</button><span class="reference-avatar">${assetVisual(state.assets.find(a=>a.id==='family-image-1'),'mini')}</span><b>演示用户</b>${studioIcon('down')}</div></header>`};
const referenceExactRender=render;
render=function(){referenceExactRender();const main=document.querySelector('.reference-work');if(!main)return;const t=task(),s=t.shots.find(x=>x.uid===referencePicked.get(t.id));const tools=main.querySelector('.studio-composer-tools');if(tools){tools.innerHTML=`<div class="reference-brief-images">${(s?.refs||t.assets).slice(0,3).map(id=>{const a=state.assets.find(a=>a.id===id);return a?`<button data-action="assetPreview" data-i="${id}" data-sp-image-hover="true" aria-label="查看需求参考${esc(a.name)}">${assetVisual(a,'mini')}</button>`:''}).join('')}<button data-action="uploadReferenceImages" aria-label="上传参考图片">${studioIcon('plus')}</button></div><label class="reference-model-label">${studioIcon('film')} 视频<select aria-label="视频模型"><option>SD2.5</option></select></label><span class="reference-aspect">${studioIcon('film')}9:16</span><button class="reference-optimize" data-action="optimizeBrief" title="仅优化输入文字，不解析分镜" ${t.running||!t.brief.trim()?'disabled':''}>${studioIcon('wand')} 智能优化</button><span class="reference-count">${t.brief.length} 字</span><button data-reference-clear="true">清空</button><button class="primary" data-action="parse" ${t.running?'disabled':''}>AI解析 ${studioIcon('arrow')}</button>`;}

 const results=main.querySelector('.studio-shot-results');if(results){const title=results.querySelector('b,h3');if(title)title.textContent='生成结果（'+t.clipVersions.filter(v=>v.shotUid===s.uid).length+'）';}
};
render();
const referenceFinishRender=render;
render=function(){referenceFinishRender();const main=document.querySelector('.reference-work');if(!main)return;const generate=main.querySelector('.studio-generation .primary');if(generate&&!generate.disabled)generate.lastChild.textContent='生成此镜';const compose=main.querySelector('.gw-compose-bar .primary');if(compose&&!compose.disabled)compose.textContent='组合成片';const batch=document.querySelector('.reference-account>button');if(batch&&task()?.templates?.length){batch.removeAttribute('data-action');batch.dataset.bpAction='phase';batch.dataset.phase='batch';batch.setAttribute('aria-label','进入批量生产');batch.title='进入批量生产';}};
render();
const referenceMethodRender=render;
render=function(){referenceMethodRender();const main=document.querySelector('.reference-work');if(!main)return;const method=main.querySelector('.studio-shot-tools select');if(method){const group=document.createElement('div');group.className='reference-method-switch';group.innerHTML=`<button data-reference-method="edit" class="${method.value==='edit'?'active':''}">视频编辑</button><button data-reference-method="aigc" class="${method.value==='aigc'?'active':''}">AIGC生成</button><button data-reference-method="keep" class="${method.value==='keep'?'active':''}">使用原片</button>`;method.before(group);method.classList.add('reference-method-menu');method.setAttribute('aria-label','选择生成方式或使用原片');}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-reference-method]');if(!b)return;const select=document.querySelector('.reference-current-shot .studio-shot-tools select');if(select&&!select.disabled){select.value=b.dataset.referenceMethod;select.dispatchEvent(new Event('change',{bubbles:true}));}});
render();
const referenceGeometryRender=render;
render=function(){referenceGeometryRender();const main=document.querySelector('.reference-work');if(!main)return;const frame=main.querySelector('.studio-prompt-frame'),meta=main.querySelector('.studio-prompt-meta');if(frame&&meta){frame.after(meta);const text=meta.querySelector('span');if(text){const s=task().shots.find(x=>x.uid===referencePicked.get(task().id));text.textContent=(s?.prompt.length||0)+' 字';text.style.visibility='visible';}}const mark=document.querySelector('.reference-header .brand-mark');if(mark)mark.innerHTML='<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><defs><linearGradient id="reference-logo" x2="0" y2="1"><stop stop-color="#e6caff"/><stop offset="1" stop-color="#ad78e7"/></linearGradient></defs><path d="M7 2h18c4 0 5 5 2 8l-7 6 6 6c4 4 3 8-2 8H8c-5 0-6-4-2-8l6-6-6-6C3 7 3 2 7 2Z" fill="url(#reference-logo)"/><path d="m12 10 8 1-5 5 5 6-8-1 5-5Z" fill="#1b1031"/></svg>';};
render();
let referencePreviewStop=null;
const referencePlayerRender=render;
render=function(){referencePreviewStop?.();referencePreviewStop=null;referencePlayerRender();const main=document.querySelector('.reference-work');if(!main)return;const t=task(),s=t.shots.find(x=>x.uid===referencePicked.get(t.id)),old=main.querySelector('.studio-shot-media .preview');if(!s||!old||s.independent)return;const wrap=document.createElement('div');wrap.className='preview reference-video-wrap';const video=document.createElement('video');video.className='reference-main-video';video.controls=true;video.muted=true;video.playsInline=true;video.autoplay=true;video.setAttribute('aria-label','当前分镜视频预览');wrap.append(video);old.replaceWith(wrap);referencePreviewStop=startSimulation(video,[mainPreviewShot(t,s)]);};
render();

/* New shots are assembled from source cuts through the shared addShot action. */
const unlimitedReferenceRender=render;
render=function(){unlimitedReferenceRender();document.querySelectorAll('textarea[maxlength],input[maxlength]').forEach(el=>el.removeAttribute('maxlength'));};
render();

/* Text polishing is independent of requirement parsing and shot generation. */
function optimiseRequirementText(value){
 const references=[];
 let text=String(value||'').replace(/@[^\s，,。；;\n]+/g,token=>{references.push(token);return '\uE000'+(references.length-1)+'\uE001';});
 text=text.replace(/年龄\s*(\d+)\s*(?:岁)?左右/g,'年龄约$1岁').replace(/所有脚本内容不变/g,'全部脚本内容保持不变').replace(/不同吃饭的画面/g,'更换不同的用餐画面').replace(/视频里拿礼盒的人物换脸\s*场景也换/g,'视频中拿礼盒的人物更换面部，场景同步更换').replace(/视频里单独出现礼盒特写直接用原视频/g,'单独出现的礼盒特写直接使用原视频').replace(/游戏画面用原视频/g,'游戏画面直接使用原视频');
 const clauses=text.split(/[，,；;\n]+/).map(s=>s.trim().replace(/\s{2,}/g,' ')).filter(Boolean);
 return clauses.join('；\n').replace(/\uE000(\d+)\uE001/g,(_,n)=>references[+n]);
}
function optimiseBriefOnly(t){
 if(!t||t.running)return false;
 if(!t.brief?.trim()){toast('先输入要优化的文字');return false;}
 const before=t.brief,next=optimiseRequirementText(before);
 if(next===before){toast('当前文字已整理，可点击 AI解析应用到分镜');return false;}
 if(t.parsed&&t.parsedBrief===undefined){t.parsedBrief=before;t.parsedScript=t.script;t.parsedMode=t.mode;}
 t.brief=next;
 t.requirementDirty=!!t.parsed&&(t.brief!==t.parsedBrief||t.script!==t.parsedScript||t.mode!==t.parsedMode);
 save();render();toast('已优化输入文字，点击 AI解析后应用到分镜');return true;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action="optimizeBrief"]');if(!b||b.disabled)return;optimiseBriefOnly(task());});
document.addEventListener('input',e=>{if(e.target.dataset.field!=='brief')return;const b=document.querySelector('.reference-optimize');if(b)b.disabled=!!task()?.running||!e.target.value.trim();});
