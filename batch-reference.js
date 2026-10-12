/* Reference-led proposal review: compact change rows, one selection and submit path. */
const batchProposalEdits=new Set();
function batchProductRequested(text){return /(?:换|改|不同)[^，。；]*(?:商品|礼盒|产品)|(?:商品|礼盒|产品)[^，。；]*(?:换|改|不同)/.test(text)&&!/(?:商品|礼盒|产品)[^，。；]*(?:不变|保持|保留)/.test(text)}
function initialiseProposalExtras(t,p,index){
  if(p.uiSelected===undefined)p.uiSelected=true;
  if(p.productChanges===undefined){
    const template=t.templates.find(v=>v.id===p.templateId);
    const products=[...new Set((template?.shots||[]).filter(s=>s.method!=='keep').flatMap(s=>s.refs||[]))].map(id=>state.assets.find(a=>a.id===id)).filter(a=>a?.role==='商品');
    p.productChanges=batchProductRequested(p.settings?.brief||p.brief||'')?products.map(a=>({originalId:a.id,ref:a.id,text:['包装主色改为橙色，保留品牌标识与包装结构。','包装主色改为蓝色，简洁几何图案，保留品牌标识。','包装主色改为奶白色，橙色品牌文字，保留原包装结构。','包装主色改为红色，保留原有品牌标识与商品数量。'][index%4]})):[];
  }
  return p;
}
const proposalBaseSync=syncPlanDesign;
syncPlanDesign=function(t,p,index){
  proposalBaseSync(t,p,index);initialiseProposalExtras(t,p,index);
  const template=t.templates.find(v=>v.id===p.templateId);
  for(const c of p.changes){
    const s=template?.shots.find(s=>s.uid===c.uid);if(!s)continue;
    for(const product of p.productChanges){
      if(!(s.refs||[]).includes(product.originalId))continue;
      c.refs=c.refs.map(id=>id===product.originalId?product.ref:id);
      const slot=c.refs.indexOf(product.ref)+1,a=state.assets.find(a=>a.id===product.ref);
      c.prompt=c.prompt.split('\n').filter(line=>!new RegExp('@图片'+slot+'(?![0-9])').test(line)).join('\n');
      c.prompt=c.prompt.replace('保留口播音轨、字幕、价格信息、商品包装和未指定的主体。','保留口播音轨、字幕、价格信息和未指定的主体。');
      c.prompt+=`\n【商品修改】\n<${a?.name||'商品'}>对应@图片${slot}，${product.text} 仅参考商品，不采用图片中的人物与背景。`;
      c.text+='；'+(a?.name||'商品')+'：'+product.text;
    }
    const role=/妈妈|用餐成人/.test(s.description)?'mom':'host',scene=p.sceneReferences?.[role];
    if(scene){if(!c.refs.includes(scene))c.refs.push(scene);c.prompt+=`\n场景氛围参考@图片${c.refs.indexOf(scene)+1}（${state.assets.find(a=>a.id===scene)?.name||'场景'}），以文字场景要求为主，不继承图片中的人物。`;}
  }
  return p;
};
function proposalRows(t,p){
  const rows=[],settings=p.settings||{},template=t.templates.find(v=>v.id===p.templateId);
  for(const [role,title,sceneKey] of [['mom','人物 · 妈妈','mealScene'],['host','人物 · 讲解人物','hostScene']]){
    const used=p.changes.some(c=>{const s=template?.shots.find(s=>s.uid===c.uid);return (s&&/妈妈|用餐成人/.test(s.description)?'mom':'host')===role});if(!used)continue;
    const person=p.design?.[role];if(!person)continue;
    if(settings.face||settings.clothes||person.gender!=='保持'||person.age!=='保持')rows.push({key:role,type:'person',role,label:title,ref:settings.face?person.ref:null,text:[settings.clothes?person.outfit:'',settings.clothes?person.hair:'',person.gender&&person.gender!=='保持'?person.gender:'',person.age&&person.age!=='保持'?person.age:''].filter(Boolean).join('，')||'参考脸部身份；服装、发型沿用模板。'});
  }
  p.productChanges?.forEach((c,i)=>rows.push({key:'product-'+i,type:'product',productIndex:i,label:'商品 · '+(state.assets.find(a=>a.id===c.originalId)?.name||'商品'),ref:c.ref,text:c.text}));
  if(settings.scene)for(const [role,title,sceneKey] of [['mom','场景 · 用餐场景','mealScene'],['host','场景 · 讲解场景','hostScene']]){
    const used=p.changes.some(c=>{const s=template?.shots.find(s=>s.uid===c.uid);return (s&&/妈妈|用餐成人/.test(s.description)?'mom':'host')===role});if(used)rows.push({key:sceneKey,type:'scene',role,label:title,ref:p.sceneReferences?.[role],text:p.design[sceneKey]});
  }
  if(!rows.length)rows.push({key:'brief',type:'brief',label:'补充修改',text:p.settings?.brief||p.brief||'沿用已保存修改要求。'});
  return rows;
}
function proposalRef(t,p,row){
  const a=state.assets.find(a=>a.id===row.ref);if(!a)return '';
  const bindings=p.changes.filter(c=>c.refs.includes(a.id)).map(c=>'分镜'+c.number+'：@图片'+(c.refs.indexOf(a.id)+1)).join('；');
  return `<button class="proposal-reference" data-action="assetPreview" data-i="${esc(a.id)}" data-sp-image-hover="true" title="${esc(bindings||a.name)}" aria-label="查看方案参考${esc(a.name)}">${assetVisual(a,'mini')}<span>@${esc(a.name)}</span></button>`;
}
function proposalRefOptions(row){return state.assets.filter(a=>a.type==='image'&&a.role!=='原片记录'&&(row.type==='person'?['妈妈','爸爸','主播','人物'].includes(a.role):row.type==='product'?a.role==='商品':a.role==='场景'))}
function proposalEditableRow(t,p,row){
  const attrs=`data-proposal-field data-plan-id="${p.id}" data-row="${row.key}"`,options=proposalRefOptions(row);
  const refs=row.type==='brief'?'':`<select ${attrs} data-property="ref" aria-label="${esc(row.label)}参考图"><option value="">${row.type==='scene'?'不使用参考图':'沿用模板'}</option>${options.map(a=>`<option value="${esc(a.id)}" ${a.id===row.ref?'selected':''}>${esc(a.name)}</option>`).join('')}</select>`;
  const person=p.design?.[row.role];
  const text=row.type==='person'?`<div class="proposal-person-inputs"><input ${attrs} data-property="outfit" aria-label="${esc(row.label)}服装" value="${esc(person.outfit)}" placeholder="服装"><input ${attrs} data-property="hair" aria-label="${esc(row.label)}发型" value="${esc(person.hair)}" placeholder="发型"></div>`:`<textarea rows="1" ${attrs} data-property="text" aria-label="${esc(row.label)}描述">${esc(row.text)}</textarea>`;
  return `<div class="proposal-change-row is-editing"><span class="proposal-change-label">${esc(row.label)}</span><div class="proposal-change-reference">${refs}</div><div class="proposal-change-description">${text}</div></div>`;
}
function proposalCard(t,p,i){
  const editing=batchProposalEdits.has(p.id),rows=proposalRows(t,p),busy=t.batchRunning||p.running,done=p.status==='已生成';
  return `<article class="proposal-card ${p.uiSelected?'is-selected':''}" data-proposal-id="${p.id}"><header class="proposal-card-header"><label><input type="checkbox" data-proposal-select="${p.id}" ${p.uiSelected?'checked':''} ${busy||done?'disabled':''} aria-label="选择方案${i+1}"><b>方案 ${String(i+1).padStart(2,'0')}</b></label><span class="proposal-card-state">${busy?'生成中':done?'已生成':''}</span><button data-proposal-action="edit" data-id="${p.id}" ${busy||done?'disabled':''}>${studioIcon(editing?'check':'edit')}${editing?'完成':'编辑'}</button><button class="proposal-delete" data-proposal-action="delete" data-id="${p.id}" ${busy?'disabled':''} aria-label="删除方案${i+1}">${uiIcon('trash')}</button></header><div class="proposal-change-rows">${rows.map(row=>editing?proposalEditableRow(t,p,row):`<div class="proposal-change-row ${row.ref?'':'no-reference'}"><span class="proposal-change-label">${esc(row.label)}</span>${row.ref?`<div class="proposal-change-reference">${proposalRef(t,p,row)}</div>`:''}<p class="proposal-change-description">${esc(row.text)}</p></div>`).join('')}</div></article>`;
}
const proposalPreviousSection=batchSection;
batchSection=function(t){
  if(t.batchView==='videos'||!t.templates.length)return proposalPreviousSection(t);
  const draft=inlineBatchDraft(t),template=t.templates.at(-1),plans=t.batchPlans;
  plans.forEach((p,i)=>initialiseProposalExtras(t,p,i));
  const selected=plans.filter(p=>p.uiSelected),available=plans.filter(p=>p.status!=='已生成'),pending=selected.filter(p=>p.status!=='已生成'),refs=(t.assets||[]).map(id=>state.assets.find(a=>a.id===id)).filter(a=>a?.type==='image'&&a.role!=='原片记录');
  return `<section class="batch-reference-workspace"><section class="proposal-request" aria-label="整体批量要求"><h2>输入整体批量要求</h2><textarea aria-label="整体批量要求" data-batch-input="brief" placeholder="生成4条不同修改方案，分别调整人物、商品和家庭场景，未修改内容沿用模板。" ${t.batchRunning?'disabled':''}>${esc(draft.batchBrief)}</textarea><div class="proposal-request-toolbar"><div class="proposal-top-references">${refs.slice(0,4).map(a=>`<button data-action="assetPreview" data-i="${a.id}" data-sp-image-hover="true" aria-label="查看批量参考${esc(a.name)}">${assetVisual(a,'mini')}</button>`).join('')}<button class="proposal-reference-add" data-action="uploadReferenceImages" aria-label="上传批量参考图片">${studioIcon('plus')}</button></div><span class="proposal-reference-count">已添加 ${refs.length} 张参考图片</span><label>生成数量<select data-batch-input="count" aria-label="批量视频数量" ${t.batchRunning?'disabled':''}>${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${Number(draft.newCount)===i+1?'selected':''}>${i+1} 条</option>`).join('')}</select></label><label>视频<select aria-label="批量视频模型"><option>SD2.5</option></select></label><span class="proposal-aspect">9:16</span><button class="primary" data-batch-ui="make" ${t.batchRunning?'disabled':''}>AI解析 ${studioIcon('arrow')}</button><button class="proposal-recommend" data-batch-ui="recommend" ${t.batchRunning?'disabled':''}>智能优化</button></div><p class="batch-inline-error" role="status"></p></section><div class="proposal-list-toolbar"><h2>修改方案（${plans.length}）</h2><label><input type="checkbox" data-proposal-all aria-label="全选方案" ${available.length&&available.every(p=>p.uiSelected)?'checked':''} ${t.batchRunning||!available.length?'disabled':''}>全选</label><button data-proposal-action="add" ${t.batchRunning||plans.length>=12?'disabled':''}>${studioIcon('plus')}新增方案</button><button class="proposal-delete-selected" data-proposal-action="deleteSelected" ${t.batchRunning||!selected.length?'disabled':''}>${uiIcon('trash')}删除所选</button><span>仅展示修改内容，未列出的内容沿用模板。</span><button class="proposal-results-entry" data-batch-view="videos">批量成片 ${t.results.filter(r=>r.workflowBatch).length}</button></div><div class="proposal-list">${plans.map((p,i)=>proposalCard(t,p,i)).join('')||'<div class="batch-empty">输入批量要求并点击 AI解析，先确认方案，再生成视频。</div>'}</div><footer class="proposal-submit"><span>${t.batchRunning?'正在生成选中的方案…':'已选择 '+selected.length+' 条方案'}</span><button class="primary" data-proposal-action="generate" ${t.batchRunning||!pending.length?'disabled':''}>${t.batchRunning?'生成中…':(pending.length?'确认并生成 '+pending.length+' 条视频':selected.length?'所选方案已生成':'请选择方案')} ${studioIcon('arrow')}</button><button class="proposal-template-preview" data-gw="previewTemplate">模板 v${template.number}</button></footer></section>`;
};
/* Select-based quantity settings share the existing draft input handler. */
document.addEventListener('change',e=>{
  if(e.target.matches('select[data-batch-input="count"]'))inlineBatchDraft(task()).newCount=e.target.value;
  const t=task();if(!t||t.batchRunning)return;
  if(e.target.matches('[data-proposal-select]')){const p=t.batchPlans.find(p=>p.id===e.target.dataset.proposalSelect);if(p&&p.status!=='已生成'){p.uiSelected=e.target.checked;save();render();}}
  if(e.target.matches('[data-proposal-all]')){t.batchPlans.filter(p=>p.status!=='已生成').forEach(p=>p.uiSelected=e.target.checked);save();render();}
});
function updateProposalField(t,p,rowKey,property,value){
  if(t.batchRunning||p.running||p.status==='已生成')return false;
  const row=proposalRows(t,p).find(row=>row.key===rowKey);if(!row)return false;
  if(property==='ref'&&value&&!t.assets.includes(value))t.assets.push(value);
  if(row.type==='person'){
    if(property==='ref'){const original=t.templates.find(v=>v.id===p.templateId)?.shots.find(s=>(/妈妈|用餐成人/.test(s.description)?'mom':'host')===row.role)?.refs?.find(id=>['妈妈','爸爸','主播','人物'].includes(state.assets.find(a=>a.id===id)?.role));p.design[row.role].ref=value||original||p.design[row.role].ref;p.settings.face=true;}
    else{p.design[row.role][property]=value;p.settings.clothes=true;}
  }else if(row.type==='scene'){
    if(property==='ref'){p.sceneReferences=p.sceneReferences||{};p.sceneReferences[row.role]=value;}
    else p.design[row.key]=value;
  }else if(row.type==='product')p.productChanges[row.productIndex][property==='ref'?'ref':'text']=value|| (property==='ref'?p.productChanges[row.productIndex].originalId:'');
  else{p.brief=value;p.settings.brief=value;}
  p.confirmed=false;p.status='待确认';delete p.generated;delete p.resultId;syncPlanDesign(t,p,t.batchPlans.indexOf(p));save();return true;
}
document.addEventListener('input',e=>{if(!e.target.matches('[data-proposal-field]'))return;const t=task(),d=e.target.dataset,p=t.batchPlans.find(p=>p.id===d.planId);if(p)updateProposalField(t,p,d.row,d.property,e.target.value);});
document.addEventListener('change',e=>{if(!e.target.matches('select[data-proposal-field]'))return;const t=task(),d=e.target.dataset,p=t.batchPlans.find(p=>p.id===d.planId);if(p&&updateProposalField(t,p,d.row,d.property,e.target.value))render();});
async function generateSelectedProposals(t){
  if(!t||t.batchRunning)return false;
  const pending=t.batchPlans.filter(p=>p.uiSelected&&p.status!=='已生成');if(!pending.length)return false;
  if(pending.some(p=>!p.changes.length||p.changes.some(c=>!c.text.trim())))return toast(pending.some(p=>p.imageOnly)?'请为所选方案添加参考图片':'请补充所选方案的修改内容');
  const epoch=t.jobEpoch||0;t.batchRunning=true;pending.forEach(p=>p.confirmed=true);save();renderTaskIfActive(t);
  await Promise.all(pending.map(async p=>{const snapshot=cloneWorkflow(p);p.running=true;p.status='生成中';await processBatchPlan(t,snapshot,t.batchPlans.indexOf(p));if(state.tasks.includes(t)&&(t.jobEpoch||0)===epoch){const live=t.batchPlans.find(x=>x.id===p.id);if(live)Object.assign(live,snapshot);}}));
  if(!state.tasks.includes(t)||(t.jobEpoch||0)!==epoch)return false;
  t.batchRunning=false;if(pending.some(p=>p.status==='已生成')){t.batchView='videos';batchResultFilter.delete(t.id);}save();renderTaskIfActive(t);return true;
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-proposal-action]');if(!b||b.disabled)return;const t=task();if(!t||t.batchRunning)return;const {proposalAction:action,id}=b.dataset,p=t.batchPlans.find(p=>p.id===id);
  if(action==='edit'&&p){if(batchProposalEdits.has(id))batchProposalEdits.delete(id);else batchProposalEdits.add(id);render();return;}
  if(action==='delete'&&p){t.batchPlans=t.batchPlans.filter(p=>p.id!==id);batchProposalEdits.delete(id);save();render();return;}
  if(action==='deleteSelected'){t.batchPlans=t.batchPlans.filter(p=>!p.uiSelected);save();render();return;}
  if(action==='add'){
    const d=inlineBatchDraft(t),candidate={...t,batchPrefs:cloneWorkflow(d.batchPrefs),batchBrief:d.batchBrief,newCount:t.batchPlans.length+1};candidate.batchPrefs.configured=true;
    if(!makeWorkflowPlans(candidate))return;const newPlan=candidate.batchPlans.at(-1);newPlan.batchId=t.batchPlans[0]?.batchId||workflowId();initialiseProposalExtras(candidate,newPlan,t.batchPlans.length);t.batchPlans.push(newPlan);save();render();return;
  }
  if(action==='generate')await generateSelectedProposals(t);
});
/* Focus newly created cut-based shots without inventing an uploaded source. */
const proposalPreviousCuts=createShotFromCuts;
createShotFromCuts=function(cuts,position){const old=new Set(task().shots.map(s=>s.uid));proposalPreviousCuts(cuts,position);workflowState(task());const fresh=task().shots.find(s=>!old.has(s.uid));if(fresh){fresh.open=false;referencePicked.set(task().id,fresh.uid);}};
render();
