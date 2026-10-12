/* Reference bindings are shot-local; drops append stable slots and never replace prior references. */
function addDroppedReference(t,s,id){const a=state.assets.find(a=>a.id===id);if(!a||a.type!=='image'||s.method==='keep'||!t.parsed)return false;if(!t.assets.includes(id))t.assets.push(id);if(!s.refs.includes(id))s.refs.push(id);const token='@图片'+(s.refs.indexOf(id)+1);if(!s.prompt.includes(token))s.prompt+=(s.prompt?'\n':'')+`${a.role||'参考素材'}参考 ${token}（${a.name}）。`;s.manual=true;return true;}
document.addEventListener('dragstart',e=>{const image=e.target.closest('[data-drag-asset]');if(!image)return;e.dataTransfer.setData('application/x-replica-image',image.dataset.dragAsset);e.dataTransfer.effectAllowed='copy';});
document.addEventListener('dragover',e=>{if(!Array.from(e.dataTransfer?.types||[]).includes('application/x-replica-image'))return;const card=e.target.closest('.studio-shot');if(!card)return;const s=task()?.shots.find(s=>s.uid===card.dataset.studioUid);if(!s||s.method==='keep'||!task().parsed)return;e.preventDefault();e.dataTransfer.dropEffect='copy';card.classList.add('reference-drop-target');});
document.addEventListener('dragleave',e=>{const card=e.target.closest('.studio-shot');if(card&&!card.contains(e.relatedTarget))card.classList.remove('reference-drop-target');});
document.addEventListener('dragend',()=>document.querySelectorAll('.reference-drop-target').forEach(el=>el.classList.remove('reference-drop-target')));
document.addEventListener('drop',e=>{const id=e.dataTransfer?.getData('application/x-replica-image');if(!id)return;const card=e.target.closest('.studio-shot');if(!card)return;e.preventDefault();card.classList.remove('reference-drop-target');const t=task(),s=t.shots.find(s=>s.uid===card.dataset.studioUid);if(addDroppedReference(t,s,id)){save();render();toast('已引用图片，可继续描述它的用途');}else toast('先解析需求，并将本镜设为视频编辑或 AIGC 生成');});
document.addEventListener('input',e=>{if(e.target.dataset.field!=='prompt')return;const s=shot(+e.target.dataset.i),layer=e.target.closest('.prompt-edit-surface')?.querySelector('.prompt-token-layer');if(layer)layer.innerHTML=studioPromptTokens(s);});
document.addEventListener('scroll',e=>{if(e.target.dataset?.field!=='prompt')return;const layer=e.target.closest('.prompt-edit-surface')?.querySelector('.prompt-token-layer');if(layer){layer.scrollTop=e.target.scrollTop;layer.scrollLeft=e.target.scrollLeft;}},true);
// Consolidate old demonstration tasks once; archived data stays recoverable.
if(!state.presentationTasksV1){
 const old=[...state.tasks];state.presentationTaskBackup=cloneWorkflow(old);
 let visual=old.find(t=>t.id==='family-demo')||seedFamilyTask();visual.name='HT-01';visual.folder='walnut';
 const speech=seedFamilyTask();speech.id='dialogue-demo';speech.name='HT-02';speech.folder='walnut';speech.time=visual.time-1;speech.mode='replace';speech.brief='人物与场景保持不变，修改人物口播，妈妈和男孩的对话更自然，游戏和礼盒画面沿用原片。';speech.script='妈妈：先吃饭吧，学编程也要休息一下。\n男孩：等我过完这关，我马上来！';speech.parsed=true;speech.singleMethodParsed=true;speech.shots=SINGLE_METHOD_SPECS.map((spec,i)=>singleMethodShot(spec,i));speech.shots.forEach(s=>{if(s.method==='keep')return;s.newSpeech=s.id===0?speech.script:s.speech;s.prompt+='\n【本镜口播覆盖】'+s.newSpeech;s.speechEditorOpen=s.id===0;});speech.stage='分镜待生成';workflowState(speech);state.tasks=[visual,speech];
 old.filter(t=>t!==visual).forEach(t=>{t.jobEpoch=(t.jobEpoch||0)+1;if(!state.deletedTasks.some(x=>x.id===t.id))state.deletedTasks.push({id:t.id,task:t,deletedAt:Date.now()});});state.presentationTasksV1=true;active=visual.id;save();
}
render();
const presentationParseFamily=parseFamilyDemo;
parseFamilyDemo=function(){const t=task(),mode=t.mode;presentationParseFamily();if(!t.parsed||mode!=='replace')return;t.mode='replace';t.shots.forEach(s=>{if(s.method==='keep')return;if(!s.newSpeech)s.newSpeech=s.id===0?t.script:s.speech;s.prompt=s.prompt.replace(/\n【本镜口播覆盖】[\s\S]*$/,'')+'\n【本镜口播覆盖】使用以下台词替换原口播，口型同步：'+s.newSpeech;});save();render();};

// Compact project task codes for presentation.
// Task names are preserved on reload, including inline edits.
save();render();
