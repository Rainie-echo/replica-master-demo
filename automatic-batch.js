/* First-entry recommendations and additive adjustments share one persisted draft. */
const automaticBatchJobs=new Map(),automaticBatchHighlights=new Map();
function automaticBatchRecipe(t){
  const template=t.templates.at(-1),shots=template?.shots||[],editable=shots.filter(s=>s.method!=='keep');
  const text=[template?.brief,...editable.map(s=>s.prompt||'')].filter(Boolean).join('\n');
  const locked=words=>new RegExp(`(?:${words})[^，。；\n]{0,12}(?:保持不变|不变|不换|不改)|(?:保持|保留)(?:原有|原本|原)?(?:${words})(?:不变|一致|形象|外观|身份|服装|场景|背景|[，。；\n])`).test(text);
  const adult=editable.some(s=>(s.refs||[]).some(id=>['妈妈','爸爸','主播','人物'].includes(state.assets.find(a=>a.id===id)?.role)));
  const prefs=defaultBatchPreferences();prefs.configured=true;prefs.face=adult&&!locked('成人|妈妈|主播|人物身份|参考脸');prefs.clothes=adult&&!locked('衣服|服装|服饰|发型');prefs.scene=!!editable.length&&!locked('场景|背景');
  const changes=[prefs.face?'换不同成人参考脸':'',prefs.clothes?'换不同衣服与发型':'',prefs.scene?'搭配不同家庭场景':''].filter(Boolean);
  const retained=['原脚本','商品包装','儿童形象','使用原片的镜头',...(!prefs.face?['人物身份']:[]),...(!prefs.clothes?['服装与发型']:[]),...(!prefs.scene?['场景与背景']:[])];
  return {prefs,brief:changes.join('，')+'；'+retained.join('、')+'保持不变。',editable};
}
function automaticBatchState(t){
  const template=t?.templates?.at(-1);if(!template)return null;
  if(!t.automaticBatch||t.automaticBatch.templateId!==template.id){
    const previous=t.automaticBatch?.templateId||t.batchPlans[0]?.templateId;
    if(previous&&previous!==template.id&&t.batchPlans.length){t.batchProposalHistory=t.batchProposalHistory||[];t.batchProposalHistory.push({templateId:previous,plans:cloneWorkflow(t.batchPlans)});t.batchPlans=[];}
    const recipe=automaticBatchRecipe(t);
    t.automaticBatch={templateId:template.id,status:'idle',initialised:false,draftText:'',requestedCount:t.batchPlans.length||4,appliedCount:t.batchPlans.length||4,message:'',recipe:{prefs:recipe.prefs,brief:recipe.brief},commonInstructions:[]};
    if(t.batchPlans.length){t.automaticBatch.status='ready';t.automaticBatch.initialised=true;t.automaticBatch.message='已保留现有 '+t.batchPlans.length+' 条方案，可直接生成，也可继续调整。';}
  }
  return t.automaticBatch;
}
function hasBatchAdjustmentDraft(t){const a=automaticBatchState(t);return !!a&&(!!a.draftText.trim()||Number(a.requestedCount)!==Number(a.appliedCount))}
function makeAutomaticBatchCandidates(t,count){
  const a=automaticBatchState(t),candidate={...t,batchPlans:[],batchPrefs:cloneWorkflow(a.recipe.prefs),batchBrief:a.recipe.brief,newCount:count};
  if(!makeWorkflowPlans(candidate))return null;
  const batchId=t.batchPlans[0]?.batchId||workflowId();
  candidate.batchPlans.forEach((p,i)=>{p.batchId=batchId;p.uiSelected=true;for(const text of a.commonInstructions||[])applyBatchInstruction(t,p,text,i);});
  return candidate;
}
function recommendAutomaticBatch(t,retry=false){
  const a=automaticBatchState(t);if(!a)return Promise.resolve(false);
  if(a.initialised)return Promise.resolve(true);
  const key=t.id+':'+a.templateId;if(automaticBatchJobs.has(key))return automaticBatchJobs.get(key);
  if(a.status==='error'&&!retry)return Promise.resolve(false);
  const epoch=t.jobEpoch||0;a.status='loading';a.message='正在根据已确认模板搭配 4 条推荐方案…';save();
  const job=(async()=>{
    await new Promise(resolve=>setTimeout(resolve,350));
    if(!state.tasks.includes(t)||(t.jobEpoch||0)!==epoch||t.templates.at(-1)?.id!==a.templateId){a.status='idle';automaticBatchJobs.delete(key);return false;}
    try{
      if(!automaticBatchRecipe(t).editable.length)throw Error('模板全部使用原片，没有可变化镜头。请先在模板制作中允许修改画面。');
      const candidate=makeAutomaticBatchCandidates(t,4);if(!candidate)throw Error('模板暂时没有可推荐的变化项，可回到模板制作调整允许变化的内容。');
      t.batchPlans=candidate.batchPlans;t.batchPrefs=candidate.batchPrefs;t.batchBrief=a.recipe.brief;t.newCount=4;
      a.initialised=true;a.status='ready';a.requestedCount=a.appliedCount=4;a.message='已根据模板推荐 4 条方案，可直接生成，也可继续调整。';
      batchDrafts.delete(t.id);save();renderTaskIfActive(t);return true;
    }catch(error){a.status='error';a.message=error.message;save();renderTaskIfActive(t);return false;}
    finally{automaticBatchJobs.delete(key);}
  })();automaticBatchJobs.set(key,job);return job;
}
function instructionPlanIndexes(text){const matches=[...text.matchAll(/方案\s*([\d０-９]+)/g)];return matches.map(m=>Number(m[1].replace(/[０-９]/g,s=>String(s.charCodeAt(0)-65248)))-1)}
function batchInstructionClauses(text){return text.split(/[，。；;\n]+/).map(s=>s.trim()).filter(s=>s&&!/^(?:其他|其余|未修改|没提到|未提及)[^，。；]*(?:不变|保持|保留|沿用)/.test(s))}
function applyBatchInstruction(t,p,text,index){
  const clauses=batchInstructionClauses(text);if(!clauses.length)return false;
  if(clauses.length>1){let changed=false;const rows=new Set();for(const clause of clauses){if(applyBatchInstruction(t,p,clause,index)){changed=true;automaticBatchHighlights.get(p.id)?.rows.forEach(key=>rows.add(key));}}if(changed)automaticBatchHighlights.set(p.id,{rows,until:Date.now()+2400});return changed;}
  text=clauses[0];
  const specified=instructionPlanIndexes(text);if(specified.length&&!specified.includes(index))return false;
  const roles=/妈妈|用餐成人/.test(text)&&!/主播|讲解人物/.test(text)?['mom']:/主播|讲解人物/.test(text)&&!/妈妈|用餐成人/.test(text)?['host']:['mom','host'];
  const before=cloneWorkflow(p.design),beforeProduct=JSON.stringify(p.productChanges);let recognised=false;
  const age=text.match(/(\d{2})\s*岁(?:左右)?/),ageWords=/年长|老年/.test(text)?'年长 · 55–65岁':/中年/.test(text)?'中年 · 40–50岁':/年轻/.test(text)?'年轻 · 25–35岁':'';
  const gender=/改成男性|换成男|换爸爸|男主播/.test(text)?'男性':/改成女性|换成女|女主播/.test(text)?'女性':'';
  const outfit=text.match(/(?:衣服|服装|穿着|打扮)(?:都|全部|统一)?(?:换成|改成|换为|改为|用)([^，。；\n]+)/)?.[1]||text.match(/(?:妈妈|主播|人物)(?:都|全部|统一)?穿([^，。；\n]+)/)?.[1];
  const hair=text.match(/(?:发型)(?:都|全部|统一)?(?:换成|改成|换为|改为)([^，。；\n]+)/)?.[1];
  const scene=text.match(/(?:场景|背景)(?:都|全部|统一)?(?:换成|改成|换为|改为)([^，。；\n]+)/)?.[1]||text.match(/(?:换成|改成)([^，。；\n]*(?:厨房|餐厅|客厅|书房|庭院|天台|卧室)[^，。；\n]*)/)?.[1];
  for(const role of roles){
    const person=p.design[role];if(!person)continue;
    if(age||ageWords){person.age=age?age[1]+'岁左右':ageWords;recognised=true;}
    if(gender){person.gender=gender;recognised=true;}
    if(outfit){person.outfit=outfit;p.settings.clothes=true;recognised=true;}
    if(hair){person.hair=hair;p.settings.clothes=true;recognised=true;}
    const mentioned=state.assets.filter(a=>['妈妈','爸爸','主播','人物'].includes(a.role)&&text.includes('@'+a.name));
    const named=mentioned.find(a=>a.role===(role==='mom'?'妈妈':'主播'))||(mentioned.length===1?mentioned[0]:null);
    if(named){person.ref=named.id;p.settings.face=true;recognised=true;}
    else if(/换脸|换人物|换不同人物|参考脸/.test(text)||gender){const pool=state.assets.filter(a=>a.type==='image'&&(gender==='男性'?a.role==='爸爸':a.role===(role==='mom'?'妈妈':'主播')));if(pool.length){const at=pool.findIndex(a=>a.id===person.ref);person.ref=pool[(at+1)%pool.length].id;p.settings.face=true;recognised=true;}}
    if(scene){p.design[role==='mom'?'mealScene':'hostScene']=scene;p.settings.scene=true;delete p.sceneReferences?.[role];recognised=true;}
  }
  if(/商品|礼盒|产品/.test(text)){
    const productText=text.match(/(?:商品|礼盒|产品)(?:都|全部|统一)?(?:换成|改成|换为|改为)([^，。；\n]+)/)?.[1];
    if(productText){const template=t.templates.find(v=>v.id===p.templateId);const ids=[...new Set(template.shots.filter(s=>s.method!=='keep').flatMap(s=>s.refs||[]))].filter(id=>state.assets.find(a=>a.id===id)?.role==='商品');p.productChanges=ids.map(id=>({originalId:id,ref:p.productChanges?.find(c=>c.originalId===id)?.ref||id,text:productText}));recognised=true;}
  }
  if(!recognised){p.supplementText=[p.supplementText,text].filter(Boolean).join('\n');}
  p.confirmed=false;p.status='待确认';delete p.generated;delete p.resultId;
  syncPlanDesign(t,p,index);
  const changed=new Set();for(const key of ['mom','host','mealScene','hostScene'])if(JSON.stringify(before[key])!==JSON.stringify(p.design[key]))changed.add(key);
  if(beforeProduct!==JSON.stringify(p.productChanges))p.productChanges.forEach((c,i)=>changed.add('product-'+i));if(!recognised)changed.add('supplement');
  automaticBatchHighlights.set(p.id,{rows:changed,until:Date.now()+2400});return true;
}
function applyAutomaticBatchAdjustments(t){
  const a=automaticBatchState(t);if(!a||!a.initialised||t.batchRunning||a.status==='loading')return false;
  const requested=Number(a.requestedCount);if(!Number.isInteger(requested)||requested<1||requested>12){a.message='方案数量须为 1–12 条。';a.status='ready';renderTaskIfActive(t);return false;}
  const text=a.draftText.trim(),countChanged=requested!==Number(a.appliedCount),original=t.batchPlans;
  const selected=original.filter(p=>p.uiSelected&&p.status!=='已生成');if(text&&!selected.length){a.message='请先勾选需要更新的方案，已生成的视频保持不变。';renderTaskIfActive(t);return false;}
  let added=[];if(requested>original.length){const candidate=makeAutomaticBatchCandidates(t,requested);if(!candidate){a.message='未能补充推荐方案，请检查模板的变化要求。';renderTaskIfActive(t);return false;}added=candidate.batchPlans.slice(original.length);}
  const targets=selected.map(p=>({original:p,copy:cloneWorkflow(p),index:original.indexOf(p)}));
  let updated=0;if(text)for(const target of targets){if(applyBatchInstruction(t,target.copy,text,target.index)){Object.assign(target.original,target.copy);updated++;}}
  if(text&&selected.length===original.filter(p=>p.status!=='已生成').length){const common=batchInstructionClauses(text).filter(s=>!instructionPlanIndexes(s).length);a.commonInstructions.push(...common);for(let i=0;i<added.length;i++)for(const clause of common)applyBatchInstruction(t,added[i],clause,original.length+i);}
  t.batchPlans.push(...added);if(countChanged)t.batchPlans.forEach((p,i)=>p.uiSelected=i<requested&&p.status!=='已生成');
  a.appliedCount=requested;a.draftText='';a.status='ready';a.message=[updated?'已更新 '+updated+' 条所选方案':'',added.length?'已补充 '+added.length+' 条新方案':'',countChanged&&!added.length?'已勾选前 '+requested+' 条，其余方案保留，可重新选择或删除。':''].filter(Boolean).join(' · ')||'方案已就绪，可直接确认生成。';
  batchDrafts.delete(t.id);save();renderTaskIfActive(t);return true;
}
const automaticProposalRows=proposalRows;
proposalRows=function(t,p){const rows=automaticProposalRows(t,p);if(p.supplementText)rows.push({key:'supplement',type:'brief',label:'补充修改',text:p.supplementText});return rows;};
const automaticProposalSync=syncPlanDesign;
syncPlanDesign=function(t,p,index){automaticProposalSync(t,p,index);if(p.supplementText)for(const c of p.changes){c.text+='；'+p.supplementText;c.prompt+='\n【追加修改要求】\n'+p.supplementText;}return p;};
const automaticFieldUpdate=updateProposalField;
updateProposalField=function(t,p,key,property,value){if(key!=='supplement')return automaticFieldUpdate(t,p,key,property,value);if(t.batchRunning||p.running||p.status==='已生成')return false;p.supplementText=value;syncPlanDesign(t,p,t.batchPlans.indexOf(p));save();return true;};
const automaticProposalGenerate=generateSelectedProposals;
generateSelectedProposals=async function(t){if(hasBatchAdjustmentDraft(t)){toast('修改意见尚未应用，请先更新所选方案。');return false;}return automaticProposalGenerate(t);};
/* Confirming the assembled sample now enters proposals without a second requirements dialog. */
const automaticCompositionDialog=compositionDialog;
compositionDialog=function(t,sample){automaticCompositionDialog(t,sample);const confirm=document.querySelector('#dialog [data-gw="confirmComposition"]');if(confirm)confirm.textContent=sample.fixed?'查看批量方案':'确认成片，查看方案';};
function confirmIntoAutomaticBatch(t,sampleId){const sample=t?.samples.find(s=>s.id===sampleId);if(!sample||(!sample.fixed&&!fixWorkflowTemplate(t)))return false;t.phase='batch';t.batchView='plans';viewerPlayback?.();$('#dialog').close();save();render();window.scrollTo?.({top:0});return true;}
const automaticProposalSection=batchSection;
batchSection=function(t){if(t.phase==='batch'&&t.batchView!=='videos'&&t.templates.length){const a=automaticBatchState(t);if(!a.initialised&&a.status!=='error')recommendAutomaticBatch(t);}return automaticProposalSection(t);};
function updateAutomaticBatchControls(t,root){
  const a=automaticBatchState(t);if(!a||!root)return;const dirty=hasBatchAdjustmentDraft(t),loading=a.status==='loading',button=root.querySelector('[data-automatic-batch="apply"]'),generate=root.querySelector('[data-proposal-action="generate"]');
  if(button){button.disabled=loading||t.batchRunning||!dirty;button.title=dirty?'只更新所选方案中明确提出的内容':'可以直接生成，或输入新的调整意见';}
  if(generate){generate.disabled=dirty||loading||t.batchRunning||!t.batchPlans.some(p=>p.uiSelected&&p.status!=='已生成');generate.title=dirty?'修改意见尚未应用，请先更新方案':loading?'正在搭配推荐方案':'使用已确认的方案生成视频';}
  const note=root.querySelector('.automatic-batch-note');if(note){note.classList.toggle('is-pending',dirty);note.classList.toggle('is-error',a.status==='error');note.textContent=dirty&&a.adjustmentError?a.adjustmentError:dirty?'修改意见尚未应用'+(Number(a.requestedCount)!==Number(a.appliedCount)?' · 方案数量调整也将一并应用':''):a.message;}
}
const automaticBatchRender=render;
render=function(){
  automaticBatchRender();const root=document.querySelector('.batch-reference-workspace'),t=task();if(!root?.querySelector||!t)return;const a=automaticBatchState(t);if(!a)return;
  const request=root.querySelector('.proposal-request');request.setAttribute('aria-label','追加方案修改');request.querySelector('h2').textContent='想进一步调整方案？';
  const input=request.querySelector('textarea');input.removeAttribute('data-batch-input');input.dataset.automaticBatchField='brief';input.setAttribute('aria-label','追加方案修改意见');input.placeholder='可选。例如：妈妈都改成40岁左右，方案2换成明亮厨房，其他保持不变。';input.value=a.draftText;input.disabled=t.batchRunning||a.status==='loading';
  const count=request.querySelector('[data-batch-input="count"]');count.removeAttribute('data-batch-input');count.dataset.automaticBatchField='count';count.value=String(a.requestedCount);count.setAttribute('aria-label','推荐方案数量');count.parentElement.firstChild.textContent='方案数量';count.disabled=t.batchRunning||a.status==='loading';
  request.querySelector('.proposal-recommend')?.remove();const apply=request.querySelector('[data-batch-ui="make"]');apply.removeAttribute('data-batch-ui');apply.dataset.automaticBatch='apply';apply.innerHTML='更新所选方案 '+studioIcon('arrow');
  const note=document.createElement('p');note.className='automatic-batch-note';note.setAttribute('role','status');request.append(note);
  if(a.status==='loading'){root.setAttribute('aria-busy','true');const empty=root.querySelector('.batch-empty');if(empty)empty.innerHTML='<span class="automatic-batch-spinner" aria-hidden="true"></span>正在根据模板搭配推荐方案…';}
  if(a.status==='error'){const retry=document.createElement('button');retry.dataset.automaticBatch='retry';retry.textContent='重试推荐';note.after(retry);}
  const empty=root.querySelector('.batch-empty');if(empty&&a.status==='ready')empty.textContent='当前没有方案。点击“新增方案”即可补充推荐方案。';
  root.querySelectorAll('.proposal-card').forEach(card=>{const p=t.batchPlans.find(p=>p.id===card.dataset.proposalId),highlight=automaticBatchHighlights.get(p?.id);if(!p||!highlight||highlight.until<Date.now())return;const rows=proposalRows(t,p);card.querySelectorAll('.proposal-change-row').forEach((row,i)=>{if(highlight.rows.has(rows[i]?.key))row.classList.add('is-recently-updated');});});
  updateAutomaticBatchControls(t,root);
};
document.addEventListener('input',e=>{if(!e.target.matches('[data-automatic-batch-field="brief"]'))return;const t=task(),a=automaticBatchState(t);a.draftText=e.target.value;delete a.adjustmentError;save();updateAutomaticBatchControls(t,e.target.closest('.batch-reference-workspace'));});
document.addEventListener('change',e=>{if(!e.target.matches('[data-automatic-batch-field="count"]'))return;const t=task(),a=automaticBatchState(t);a.requestedCount=Number(e.target.value);save();renderTaskIfActive(t);});
/* Intercept explicit new-batch and add actions before older handlers replace the plans. */
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-automatic-batch],[data-proposal-action="add"],[data-proposal-action="delete"],[data-proposal-action="deleteSelected"],[data-batch-ui="new"],[data-gw="confirmComposition"]');if(!button||button.disabled)return;e.preventDefault();e.stopImmediatePropagation();const t=task();if(!t)return;
  if(button.dataset.gw==='confirmComposition'){confirmIntoAutomaticBatch(t,compositionContext?.sampleId);return;}
  const a=automaticBatchState(t);if(!a||t.batchRunning||a.status==='loading')return;
  if(button.dataset.automaticBatch==='apply'){applyAutomaticBatchAdjustments(t);return;}
  if(button.dataset.automaticBatch==='retry'){recommendAutomaticBatch(t,true);renderTaskIfActive(t);return;}
  if(button.dataset.batchUi==='new'){
    if(t.batchPlans.length){t.batchProposalHistory=t.batchProposalHistory||[];t.batchProposalHistory.push({templateId:a.templateId,plans:cloneWorkflow(t.batchPlans)});}
    t.batchPlans=[];a.initialised=false;a.status='idle';a.draftText='';a.message='';a.commonInstructions=[];t.batchView='plans';batchDrafts.delete(t.id);save();renderTaskIfActive(t);return;
  }
  if(['delete','deleteSelected'].includes(button.dataset.proposalAction)){t.batchPlans=t.batchPlans.filter(p=>button.dataset.proposalAction==='delete'?p.id!==button.dataset.id:!p.uiSelected);if(!hasBatchAdjustmentDraft(t))a.requestedCount=a.appliedCount=Math.max(1,t.batchPlans.length);save();renderTaskIfActive(t);return;}
  if(hasBatchAdjustmentDraft(t)){toast('请先应用或清空追加意见，再新增方案。');return;}
  const candidate=makeAutomaticBatchCandidates(t,t.batchPlans.length+1);if(!candidate)return;t.batchPlans.push(candidate.batchPlans.at(-1));a.requestedCount=a.appliedCount=t.batchPlans.length;a.message='已补充 1 条新方案，已有方案保持不变。';save();renderTaskIfActive(t);
},true);
render();
