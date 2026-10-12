/* Batch variations are image bindings; users no longer write appearance or scene prompts. */
const IMAGE_PLAN_CATEGORIES=['人物','商品','场景'];
let imagePlanPicker=null;
function imagePlanCategory(a){return a?.role==='商品'?'商品':a?.role==='场景'?'场景':'人物';}
function imagePlanPool(t,category){return refs(t).filter(a=>a.type==='image'&&a.role!=='原片记录'&&(!category||imagePlanCategory(a)===category));}
function imagePlanScope(s){return /妈妈|用餐成人/.test(s.description||'')?'meal':'host';}
function initialiseImagePlan(t,p,index=0){
 if(p.imageBindings)return p;
 const template=t.templates.find(x=>x.id===p.templateId),shots=template?.shots.filter(s=>s.method!=='keep')||[],bindings={人物:[],商品:[],场景:[]};
 for(const s of shots)for(const originalId of s.refs||[]){const a=state.assets.find(a=>a.id===originalId);if(!a||a.type!=='image'||a.role==='原片记录'||imagePlanCategory(a)==='场景')continue;const category=imagePlanCategory(a);let entry=bindings[category].find(e=>e.originalId===originalId);
  if(!entry){let ref=originalId;if(a.role==='妈妈')ref=p.design?.mom?.ref||ref;if(a.role==='主播')ref=p.design?.host?.ref||ref;ref=p.productChanges?.find(x=>x.originalId===originalId)?.ref||ref;const asset=state.assets.find(a=>a.id===ref);if(!asset)ref=originalId;entry={key:category+':'+originalId,originalId,ref,role:a.role,title:a.role==='主播'?'讲解人物':a.role==='商品'?a.name:a.role||'参考人物',shotUids:[]};bindings[category].push(entry);}entry.shotUids.push(s.uid);
 }
 const scenes=imagePlanPool(t,'场景');for(const scope of [...new Set(shots.map(imagePlanScope))]){const own=shots.filter(s=>imagePlanScope(s)===scope),originalId=own.flatMap(s=>s.refs||[]).find(id=>state.assets.find(a=>a.id===id)?.role==='场景'),pool=scope==='meal'?scenes.filter(a=>/餐|厨|客厅|庭院/.test(a.name+' '+(a.tags||''))):scenes.filter(a=>/书房|客厅|天台|旋转|游乐|讲解/.test(a.name+' '+(a.tags||''))),ref=p.sceneReferences?.[scope==='meal'?'mom':'host']||originalId||pool[index%Math.max(1,pool.length)]?.id||scenes[0]?.id;if(ref)bindings.场景.push({key:'scene:'+scope,ref,originalId:originalId||null,role:'场景',title:scope==='meal'?'用餐场景':'讲解场景',shotUids:own.map(s=>s.uid)});}
 p.imageOnly=true;p.imageBindings=bindings;p.clothing='';p.uiSelected=p.uiSelected!==false;return p;
}
function compileImagePlan(t,p){
 const template=t.templates.find(x=>x.id===p.templateId);if(!template)return p;
 p.clothing='';p.supplementText='';
 p.design=p.design||{};for(const [role,assetRole,scope,sceneKey] of [['mom','妈妈','meal','mealScene'],['host','主播','host','hostScene']]){const person=p.imageBindings.人物.find(e=>e.role===assetRole);p.design[role]={ref:person?.ref||null,gender:'保持',age:'保持',outfit:'',hair:''};const scenes=p.imageBindings.场景.filter(e=>e.shotUids.some(uid=>imagePlanScope(template.shots.find(s=>s.uid===uid)||{})===scope)).map(e=>state.assets.find(a=>a.id===e.ref)?.name).filter(Boolean);p.design[sceneKey]=scenes.map(name=>'@'+name).join(' / ');}
 p.changes=template.shots.filter(s=>s.method!=='keep').flatMap(s=>{
  const entries=IMAGE_PLAN_CATEGORIES.flatMap(category=>(p.imageBindings[category]||[]).filter(e=>e.shotUids.includes(s.uid)).map(e=>({...e,category}))).filter(e=>state.assets.some(a=>a.id===e.ref));if(!entries.length)return [];
  const ids=[...new Set(entries.map(e=>e.ref))],bindings=entries.map(e=>{const a=state.assets.find(a=>a.id===e.ref),slot=ids.indexOf(e.ref)+1;if(e.category==='人物')return `<${e.title}>参考@图片${slot}（${a.name}），采用图片中的身份、面部、发型和服装；不采用人物图片的背景，不新增无关人物。`;if(e.category==='商品')return `<${e.title}>参考@图片${slot}（${a.name}），采用图片中的包装、形状、颜色、图案与标识；只作为商品参考，不作为人物或背景参考。`;return `<${e.title}>参考@图片${slot}（${a.name}），采用图片中的空间、布局、材质、布景与光线；不采用场景图中的人物，保持人物与商品的镜头关系。`;});
  return [{uid:s.uid,number:s.number,refs:ids,text:entries.map(e=>e.category+'：'+state.assets.find(a=>a.id===e.ref).name).join('；'),prompt:`【视频与图片职责】\n${s.method==='aigc'?'按本镜脚本与图片参考生成画面。':'@视频1是当前分镜的编辑母版，保留原动作、机位、镜头顺序和时长。'}\n${bindings.join('\n')}\n【脚本与保留项】\n原台词：${s.speech||''}\n台词、音轨、字幕与价格信息保持不变，未指定对象沿用模板；原片镜头不重绘。跨镜使用同一组角色与商品参考图片。`}];
 });return p;
}
const priorImagePlanSync=syncPlanDesign;
syncPlanDesign=function(t,p,index){return p.imageBindings?compileImagePlan(t,p):priorImagePlanSync(t,p,index);};
const priorImagePlanMake=makeWorkflowPlans;
makeWorkflowPlans=function(t){const ok=priorImagePlanMake(t);if(ok)t.batchPlans.forEach((p,i)=>compileImagePlan(t,initialiseImagePlan(t,p,i)));return ok;};
function migrateImagePlans(t){
 if(t.batchRunning||t.batchPlans.some(p=>p.running))return false;const legacy=t.batchPlans.filter(p=>!p.imageBindings);if(!legacy.length)return false;
 t.batchProposalHistory=t.batchProposalHistory||[];t.batchProposalHistory.push({templateId:t.templates.at(-1)?.id,reason:'切换图片参考方案',plans:cloneWorkflow(t.batchPlans)});
 t.batchPlans=t.batchPlans.map((p,i)=>{if(p.imageBindings)return p;const next=cloneWorkflow(p);if(p.status==='已生成'){next.id=workflowId();next.sourcePlanId=p.id;}next.status='待确认';next.confirmed=false;next.uiSelected=true;delete next.generated;delete next.resultId;delete next.error;return compileImagePlan(t,initialiseImagePlan(t,next,i));});
 const a=automaticBatchState(t);if(a){a.legacyDraftText=a.draftText;a.draftText='';a.commonInstructions=[];a.requestedCount=a.appliedCount=t.batchPlans.length||4;a.message='已转换为图片参考方案，已有成片保留。';}batchDrafts.delete(t.id);save();return true;
}
const priorImagePlanSection=batchSection;
batchSection=function(t){if(t.phase==='batch'&&t.batchView!=='videos'&&t.templates.length)migrateImagePlans(t);return priorImagePlanSection(t);};
function imagePlanCard(t,p,i){
 initialiseImagePlan(t,p,i);const busy=t.batchRunning||p.running,done=p.status==='已生成';
 return `<article class="proposal-card image-proposal-card ${p.uiSelected?'is-selected':''}" data-proposal-id="${p.id}"><header class="proposal-card-header"><label><input type="checkbox" data-proposal-select="${p.id}" ${p.uiSelected?'checked':''} ${busy||done?'disabled':''} aria-label="选择方案${i+1}"><b>方案 ${String(i+1).padStart(2,'0')}</b></label><span class="proposal-card-state">${busy?'生成中':done?'已生成':'待确认'}</span><button class="proposal-delete" data-proposal-action="delete" data-id="${p.id}" ${busy?'disabled':''} aria-label="删除方案${i+1}">${uiIcon('trash')}</button></header><div class="image-proposal-rows">${IMAGE_PLAN_CATEGORIES.filter(category=>(p.imageBindings[category]||[]).some(e=>state.assets.some(a=>a.id===e.ref&&a.type==='image'))).map(category=>`<div class="image-proposal-row" data-image-row="${category}"><b>${category}</b><div class="image-proposal-strip">${(p.imageBindings[category]||[]).map(e=>{const a=state.assets.find(a=>a.id===e.ref);return a?`<span class="image-proposal-reference"><button data-image-plan-action="replace" data-plan-id="${p.id}" data-category="${category}" data-key="${esc(e.key)}" data-sp-image-hover="true" data-i="${esc(a.id)}" aria-label="替换方案${i+1}${esc(e.title)}参考图片" ${busy||done?'disabled':''}>${assetVisual(a,'mini')}<span><small>${esc(e.title)}</small><strong>@${esc(a.name)}</strong></span></button>${busy||done?'':`<button data-image-plan-action="remove" data-plan-id="${p.id}" data-category="${category}" data-key="${esc(e.key)}" aria-label="移除${esc(e.title)}参考图片">${studioIcon('close')}</button>`}</span>`:'';}).join('')}${!busy&&!done?`<button class="image-proposal-add" data-image-plan-action="add" data-plan-id="${p.id}" data-category="${category}" aria-label="添加方案${i+1}${category}图片">${studioIcon('plus')} 添加图片</button>`:!(p.imageBindings[category]||[]).length?'<span class="image-proposal-empty">沿用模板</span>':''}</div></div>`).join('')}</div></article>`;
}
proposalCard=imagePlanCard;
function editImageBinding(t,p,category,key,id,remove=false){
 if(t.batchRunning||p.running||p.status==='已生成'||!IMAGE_PLAN_CATEGORIES.includes(category))return false;
 const entries=p.imageBindings[category],entry=entries.find(e=>e.key===key),a=state.assets.find(a=>a.id===id);
 if(remove){if(!entry)return false;p.imageBindings[category]=entries.filter(e=>e!==entry);}
 else if(!a||a.type!=='image'||a.role==='原片记录')return false;
 else if(entry)entry.ref=id;
 else {if(entries.some(e=>e.ref===id))return false;const template=t.templates.find(v=>v.id===p.templateId),editable=template.shots.filter(s=>s.method!=='keep');let scope=editable;
  if(category==='人物'&&a.role==='妈妈')scope=editable.filter(s=>imagePlanScope(s)==='meal');else if(category==='人物'&&a.role==='主播')scope=editable.filter(s=>imagePlanScope(s)==='host');
  entries.push({key:workflowId(),ref:id,originalId:null,role:a.role,title:category==='人物'?a.role||'参考人物':category==='商品'?a.name:'补充场景',shotUids:scope.map(s=>s.uid)});
 }
 if(id&&!t.assets.includes(id))t.assets.push(id);p.status='待确认';p.confirmed=false;delete p.generated;delete p.resultId;compileImagePlan(t,p);save();return true;
}
function closeImagePlanPicker(){imagePlanPicker?.panel.remove();imagePlanPicker=null;}
function openImagePlanPicker(button,showAll=false){
 closeImagePlanPicker();const t=task(),p=t.batchPlans.find(p=>p.id===button.dataset.planId);if(!p||t.batchRunning||p.running||p.status==='已生成')return;
 const category=button.dataset.category,images=imagePlanPool(t,showAll?null:category),key=button.dataset.key||'',selected=(p.imageBindings[category]||[]).map(e=>e.ref),panel=document.createElement('div');panel.className='image-plan-picker';
 panel.innerHTML=`<div class="image-plan-picker-head"><b>${key?'替换':'添加'}${category}参考图片</b><button data-image-picker-all>${showAll?'分类图片':'全部图片'}</button><button data-image-picker-close aria-label="关闭图片选择">${studioIcon('close')}</button></div><div class="image-plan-picker-grid">${images.map(a=>`<button data-image-picker-id="${esc(a.id)}" aria-label="引用${esc(a.name)}" aria-pressed="${selected.includes(a.id)}">${assetVisual(a,'mini')}<span>${esc(a.name)}</span>${selected.includes(a.id)?`<i>${studioIcon('check')}</i>`:''}</button>`).join('')||'<p>暂无参考图片，可展开任务素材添加。</p>'}</div><div class="image-plan-picker-footer"><span>点击图片引用 · 可选择多张</span><button data-image-picker-close>完成</button></div>`;
 document.body.append(panel);imagePlanPicker={panel,anchor:button,taskId:t.id,planId:p.id,category,key,showAll};const rect=button.getBoundingClientRect(),width=Math.min(580,innerWidth-24),height=Math.min(320,innerHeight-32);panel.style.width=width+'px';panel.style.maxHeight=height+'px';panel.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';panel.style.top=(rect.bottom+height+8>innerHeight?Math.max(12,rect.top-height-6):rect.bottom+6)+'px';
}
document.addEventListener('click',e=>{
 const close=e.target.closest('[data-image-picker-close]');if(close)return closeImagePlanPicker();
 const all=e.target.closest('[data-image-picker-all]');if(all&&imagePlanPicker){const c=imagePlanPicker;openImagePlanPicker(c.anchor,!c.showAll);return;}
 const chosen=e.target.closest('[data-image-picker-id]');if(chosen&&imagePlanPicker){const c=imagePlanPicker,t=state.tasks.find(t=>t.id===c.taskId),p=t?.batchPlans.find(p=>p.id===c.planId);if(!p)return closeImagePlanPicker();const id=chosen.dataset.imagePickerId;
  if(!c.key&&p.imageBindings[c.category].some(e=>e.ref===id)){const key=p.imageBindings[c.category].find(e=>e.ref===id).key;editImageBinding(t,p,c.category,key,id,true);}else editImageBinding(t,p,c.category,c.key,id);
  render();if(!c.key){const anchor=document.querySelector(`[data-image-plan-action="add"][data-plan-id="${c.planId}"][data-category="${c.category}"]`);if(anchor)openImagePlanPicker(anchor,c.showAll);}return;
 }
 const b=e.target.closest('[data-image-plan-action]');if(b){if(b.dataset.imagePlanAction==='remove'){const t=task(),p=t.batchPlans.find(p=>p.id===b.dataset.planId);if(p&&editImageBinding(t,p,b.dataset.category,b.dataset.key,null,true))render();}else openImagePlanPicker(b);return;}
 if(imagePlanPicker&&!imagePlanPicker.panel.contains(e.target))closeImagePlanPicker();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&imagePlanPicker){e.preventDefault();closeImagePlanPicker();}});
document.addEventListener('scroll',e=>{if(imagePlanPicker&&!imagePlanPicker.panel.contains(e.target))closeImagePlanPicker();},true);window.addEventListener('resize',closeImagePlanPicker);
const imagePlanPriorRender=render;
render=function(){closeImagePlanPicker();imagePlanPriorRender();const t=task(),root=document.querySelector('.batch-reference-workspace');if(!t||!root)return;const request=root.querySelector('.proposal-request');request.querySelector('h2').textContent='想进一步调整方案？';const input=request.querySelector('textarea');if(input){input.placeholder='请写清方案、修改对象及对应的 @图片名。\n例如：方案2的妈妈参考 @妈妈参考B，用餐场景参考 @日式餐厨场景。';input.setAttribute('aria-describedby','batch-reference-guidance');const hint=document.createElement('p');hint.id='batch-reference-guidance';hint.className='reference-input-guidance';hint.innerHTML='每个要修改的人物、商品、场景，都必须写清对应的 <strong>@图片名</strong>，否则系统无法识别参考图归属。<br>未提到的内容默认沿用模板；只更新勾选的待生成方案。';input.after(hint);}
 const apply=request.querySelector('[data-automatic-batch="apply"]');if(apply)apply.innerHTML='更新所选方案 '+studioIcon('arrow');root.querySelector('.proposal-list-toolbar>span').textContent='人物、商品和场景以引用图片为准，脚本沿用模板。';updateAutomaticBatchControls(t,root);const submit=root.querySelector('.proposal-submit>span');if(submit)submit.textContent=t.batchRunning?'正在生成所选方案…':'已选择 '+t.batchPlans.filter(p=>p.uiSelected&&p.status!=='已生成').length+' 条待生成方案';
};
render();

/* Optional instructions update image bindings; they are not video prompts. */
function imageInstructionUpdates(t,p,text,index){
 const updates=[],unmatched=[];
 for(const clause of batchInstructionClauses(text)){
  const specified=instructionPlanIndexes(clause);if(specified.length&&!specified.includes(index))continue;
  const images=imagePlanPool(t).filter(a=>clause.includes('@'+a.name)||clause.includes(a.name));
  let matched=false;
  for(const a of images){
   const category=imagePlanCategory(a),entries=p.imageBindings[category]||[];
   let targets=entries.filter(e=>category==='人物'?e.role===a.role:category==='商品'?e.originalId===a.id||e.ref===a.id||/橙色/.test(clause)&&/橙色/.test(e.title)||/蓝色/.test(clause)&&/蓝色/.test(e.title):/用餐|餐厨/.test(clause)?/用餐/.test(e.title):/讲解|主播/.test(clause)?/讲解/.test(e.title):true);
   if(!targets.length&&category==='商品'&&entries.length===1)targets=entries;
   if(!targets.length&&category==='人物'&&/妈妈/.test(clause))targets=entries.filter(e=>e.role==='妈妈');
   if(!targets.length&&category==='人物'&&/主播|讲解人物/.test(clause))targets=entries.filter(e=>e.role==='主播');
   if(targets.length){targets.forEach(e=>updates.push({category,key:e.key,id:a.id}));matched=true;}
  }
  if(!matched)unmatched.push(clause);
 }
 return {updates,unmatched};
}
const imageInstructionPrior=applyBatchInstruction;
applyBatchInstruction=function(t,p,text,index){
 if(!p.imageBindings)return imageInstructionPrior(t,p,text,index);
 const {updates}=imageInstructionUpdates(t,p,text,index);if(!updates.length)return false;
 for(const u of updates){const entry=p.imageBindings[u.category].find(e=>e.key===u.key);entry.ref=u.id;}
 p.confirmed=false;p.status='待确认';delete p.generated;delete p.resultId;compileImagePlan(t,p);return true;
};
const imageAdjustmentPrior=applyAutomaticBatchAdjustments;
applyAutomaticBatchAdjustments=function(t){
 const a=automaticBatchState(t);if(!a||t.batchRunning||a.status==='loading')return false;
 delete a.adjustmentError;
 if(a.draftText.trim()){
  const selected=t.batchPlans.filter(p=>p.uiSelected&&p.status!=='已生成');
  const checks=selected.map(p=>imageInstructionUpdates(t,p,a.draftText,t.batchPlans.indexOf(p)));
  if(selected.length&&(!checks.some(c=>c.updates.length)||checks.some(c=>c.unmatched.length))){
   a.adjustmentError=a.message='请用 @ 引用要替换的人物、商品或场景图片，并写明方案及对象；未识别的指令已保留，方案未更改。';save();renderTaskIfActive(t);return false;
  }
 }
 return imageAdjustmentPrior(t);
};

/* The two request-level plus buttons upload only; existing assets use @. */
function referenceImageUploadDialog(){
 modal('上传参考图片',`<label class="reference-upload-drop" tabindex="0" role="button" aria-label="选择或拖入参考图片"><span class="reference-upload-icon">${studioIcon('image')}</span><b>拖拽图片到这里</b><span>或点击选择图片 · 支持多张上传</span><input type="file" accept="image/*" multiple data-upload="asset" aria-label="选择参考图片"></label>`, '<button data-action="close">取消</button>');
}
document.addEventListener('click',e=>{if(e.target.closest('[data-action="uploadReferenceImages"]'))referenceImageUploadDialog();});
document.addEventListener('keydown',e=>{if(e.target.matches('.reference-upload-drop')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.querySelector('input').click();}});
document.addEventListener('dragover',e=>{const zone=e.target.closest('.reference-upload-drop');if(!zone)return;e.preventDefault();e.dataTransfer.dropEffect='copy';zone.classList.add('is-dragover');});
document.addEventListener('dragleave',e=>{const zone=e.target.closest('.reference-upload-drop');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('is-dragover');});
document.addEventListener('drop',e=>{const zone=e.target.closest('.reference-upload-drop');if(!zone)return;e.preventDefault();zone.classList.remove('is-dragover');const files=[...e.dataTransfer.files].filter(file=>file.type.startsWith('image/'));if(!files.length)return toast('请拖入图片文件');upload(files,'asset');});
