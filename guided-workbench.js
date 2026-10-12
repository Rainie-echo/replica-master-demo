/* User-triggered stages; composition lives in a top bar and a centered dialog. */
let experienceLanding=true,compositionContext=null;
const beforeCompositionModal=modal;
modal=function(title,body,footer=''){delete $('#dialog').dataset.gwComposition;delete $('#dialog').dataset.gbTask;return beforeCompositionModal(title,body,footer)};
for(const t of state.tasks){if(t.gated&&t.sourceAnalysing&&!t.sourceParsed){t.sourceAnalysing=false;t.stage='准备自动解析'}}
const priorTrialTask=newTrialTask;
newTrialTask=function(){const t=priorTrialTask();t.shots=[];t.gated=true;t.videoImported=false;t.sourceParsed=false;t.stage='待导入视频';experienceLanding=false;save();render();return t};
const sourceAnalysisJobs=new WeakMap();
function importedTask(t,kind,name,url=''){
  if(!t||!state.tasks.includes(t))return Promise.resolve();
  t.jobEpoch=(t.jobEpoch||0)+1;t.videoImported=true;t.sourceParsed=false;t.sourceAnalysing=false;
  t.importKind=kind;t.sourceName=name;t.localVideoUrl=kind==='local'?url:'';t.sourceUrl=kind==='link'?url:'';
  delete t.sourceParseError;
  return analyseSource(t);
}
function resumeSourceAnalysis(t){
  if(!t?.gated||!t.videoImported||t.sourceParsed||t.sourceAnalysing||t.sourceParseError)return;
  const epoch=t.jobEpoch||0;
  Promise.resolve().then(()=>{if(state.tasks.includes(t)&&(t.jobEpoch||0)===epoch&&!t.sourceParseError)analyseSource(t)});
}
async function analyseSource(t){
  if(!t?.videoImported||t.sourceParsed||!state.tasks.includes(t))return;
  const epoch=t.jobEpoch||0,current=sourceAnalysisJobs.get(t);
  if(current?.epoch===epoch)return current.promise;
  const job={epoch,promise:null};sourceAnalysisJobs.set(t,job);
  job.promise=(async()=>{
    try{
      t.sourceAnalysing=true;delete t.sourceParseError;t.stage='原视频解析中';save();renderTaskIfActive(t);
      await new Promise(r=>setTimeout(r,500));
      if(!state.tasks.includes(t)||(t.jobEpoch||0)!==epoch||!t.sourceAnalysing)return;
      const fixture=seedFamilyTask();t.shots=cloneWorkflow(fixture.shots);t.sourceParsed=true;t.sourceAnalysing=false;t.stage='视频已解析 · 需求待填写';workflowState(t);save();renderTaskIfActive(t);
      if(task()?.id===t.id&&!experienceLanding)toast('已自动识别六个分镜，请填写全片改编需求');
    }catch(error){
      if(!state.tasks.includes(t)||(t.jobEpoch||0)!==epoch)return;
      t.sourceParsed=false;t.sourceAnalysing=false;t.sourceParseError='原视频解析未完成，请重新解析。';t.stage='原视频解析未完成';save();renderTaskIfActive(t);
    }
  })();
  try{return await job.promise}finally{if(sourceAnalysisJobs.get(t)===job)sourceAnalysisJobs.delete(t)}
}
const previousParse=parse;
parse=function(){
  const t=task();if(t?.gated&&!t.sourceParsed)return toast('先导入并解析原视频');
  if(!t?.brief.trim())return toast('请先填写全片需求');
  if(t.mode==='replace'&&!t.script.trim())return toast('替换口播时，请填写完整新台词');
  if(t.demoFamily&&!/脚本|礼盒|吃饭|游戏|人物/.test(t.brief))return toast('此 Demo 使用示例需求解析，请描述人物、场景或保留画面');
  const manual=t.shots.filter(s=>s.manual).length;
  previousParse();
  if(!t.parsed)return;
  t.parsedBrief=t.brief;t.parsedScript=t.script;t.parsedMode=t.mode;t.requirementDirty=false;t.briefExpanded=false;
  t.parseFeedback=manual?'已更新自动提示词，保留 '+manual+' 个手动修改。请核对这些分镜。':'已解析 '+t.shots.length+' 个分镜，原片 '+t.shots.filter(s=>s.method==='keep').length+' 镜直接参与成片。';
  save();render();
};
function sourceImportPanel(t){
  if(t.videoImported)return `<section class="gw-source-status ${t.sourceParseError?'is-error':''}" role="status" aria-live="polite" aria-busy="${!t.sourceParseError}"><span class="gw-source-status-icon">${uiIcon('work')}</span><div><h2>${t.sourceParseError?'原视频解析未完成':'正在解析原视频…'}</h2><p class="small muted">${esc(t.sourceName||'原视频')}</p><p>${t.sourceParseError?esc(t.sourceParseError):'正在识别画面、口播和字幕，完成后自动进入分镜工作区。'}</p>${t.sourceParseError?'<button class="ui-btn ui-btn-secondary" data-gw="retrySource">重新解析</button>':'<progress aria-label="原视频解析进度"></progress>'}</div></section>`;
  return `<section class="panel gw-import"><div class="gw-import-heading"><span class="gw-entry-icon">${uiIcon('upload')}</span><div><h2>导入原视频</h2><p>上传后自动识别分镜、口播和字幕。</p></div></div><div class="gw-import-grid"><label class="upload-label gw-local-upload">${uiIcon('upload')}<strong>上传本地视频</strong><span>选择电脑中的原视频文件</span><input type="file" accept="video/*" data-gw-upload="video" aria-label="导入本地视频"></label><div class="gw-link-import">${uiIcon('link')}<label>通过链接导入<input id="gw-link" aria-label="原视频链接" placeholder="粘贴抖音等视频链接"></label><p>无需先下载到本地</p><button class="ui-btn ui-btn-secondary" data-gw="importLink">${uiIcon('link')} 导入链接</button></div></div><div class="gw-demo-source"><span>先体验完整流程？已准备多人对话示例。</span><button class="ui-btn ui-btn-secondary" data-gw="importDemo">${uiIcon('play')} 使用内置示例视频</button></div></section>`;
}
function fixedTemplateSample(t){return t.samples.find(s=>s.id===t.templates.at(-1)?.sampleId)}
function guidedTop(t){return `<div class="row between gw-task-title"><div><h1>${esc(t.name)}</h1><p class="small muted">${esc(t.stage)} · 自动保存</p></div><div class="row gw-task-actions">${t.sourceParsed||!t.gated?'<button data-action="toggleMaterials">任务素材</button>':''}<button data-bp-action="newTrial">从头体验示例</button></div></div>`}
function phaseNavigation(t){return `<nav class="bp-phases" aria-label="任务阶段"><button class="${t.phase!=='batch'?'active':''}" data-bp-action="phase" data-phase="template">分镜制作</button><button class="${t.phase==='batch'?'active':''}" data-bp-action="phase" data-phase="batch" title="${t.templates.length?'基于已确认模板批量生产':'确认完整成片后即可进入批量生产'}" ${!t.templates.length?'disabled':''}>批量生产</button></nav>`}
function compositionExplanation(t,progress=workspaceProgress(t)){
  const sample=t.samples.at(-1),unresolved=[progress.pending&&progress.pending+' 镜待生成',progress.choose&&progress.choose+' 镜待选用',progress.busy&&progress.busy+' 镜生成中'].filter(Boolean).join(' · ');
  return !t.parsed?'先解析全片需求':t.requirementDirty?'总需求已修改，待重新解析':unresolved|| (progress.promptDraftCount?'有 '+progress.promptDraftCount+' 镜提示词已修改，组合仍使用已选视频':sample?.fixed&&progress.sampleMatching?'成片已确认，可进入批量生产':progress.sampleMatching?'预览满意后确认成片':'每镜来源已确定，可以组合成片');
}
function compositionToolbar(t){
  const progress=workspaceProgress(t),sample=t.samples.at(-1),matching=progress.sampleMatching,busy=progress.composing,missing=progress.firstMissing;
  const explanation=compositionExplanation(t,progress);
  const disabled=(!matching&&!progress.canCompose)||busy;
  return `<section class="gw-compose-bar" aria-label="成片组合工具条"><div class="gw-progress-copy"><span class="small ${progress.ready===progress.total&&progress.ready?'gw-ready-text':'muted'}">已确定 ${progress.ready}/${progress.total} 镜</span><small class="gw-compose-reason" id="compose-help">${esc(explanation)}</small></div><div class="row wrap">${missing&&t.parsed?`<button class="ui-btn ui-btn-secondary ui-btn-sm" data-sp="locate" data-uid="${missing.uid}">${uiIcon('locate')} 去${missing.reason==='待选用'?'选用':'生成'}分镜 ${t.shots.find(s=>s.uid===missing.uid)?.id+1}</button>`:''}${sample&&!matching?`<button class="ui-btn ui-btn-secondary ui-btn-sm" data-gw="previewComposition" ${busy?'disabled':''}>上次成片</button>`:''}<button class="primary ui-btn ui-btn-primary" data-gw="${matching&&!busy?'previewComposition':'assemble'}" aria-describedby="compose-help" title="${esc(explanation)}" aria-busy="${busy}" ${disabled?'disabled':''}>${busy?'组合中…':matching?'查看成片':sample?'重新合成成片':'合成成片'}</button></div></section>`;
}
work=function(){const current=task();if(experienceLanding||!current)return `<main class="wf-main gw-landing" data-workflow-tab="入口"><div class="gw-welcome-label">VIDEO WORKSPACE</div><h1>${current?'开始下一条作品':'开始你的第一条作品'}</h1><p class="muted">从参考视频到全新成片，在一个工作台完成。</p><div class="gw-entry-options"><section class="panel"><span class="gw-entry-icon">${uiIcon('plus')}</span><h2>开始新体验</h2><p>导入原视频，输入你的改编想法。<br>从空白状态逐步体验完整制作流程。</p><button class="primary" data-gw="start">开始新体验</button></section>${current?`<section class="panel"><span class="gw-entry-icon">${uiIcon('resume')}</span><h2>继续上次任务</h2><p>${esc(current.name)}</p><span class="badge">${esc(current.stage)}</span><button data-gw="continue">继续上次任务</button></section>`:''}</div><div class="gw-welcome-flow" aria-label="制作流程"><span><i>1</i>导入参考视频</span><b>→</b><span><i>2</i>调整并生成分镜</span><b>→</b><span><i>3</i>组合成片，批量复刻</span></div></main>`;const t=workflowState(current);if(t.gated&&!t.sourceParsed)return `<main class="wf-main" data-workflow-tab="导入">${guidedTop(t)}<button class="link small" data-gw="home">返回体验入口</button>${phaseNavigation(t)}${sourceImportPanel(t)}</main>`;const batch=t.phase==='batch';return `<main class="wf-main" data-workflow-tab="${batch?'批量':'制作'}">${guidedTop(t)}${!batch?compositionToolbar(t):''}${phaseNavigation(t)}${batch?batchSection(t):`${brief(t)}<div class="section-title"><h2>分镜工作区 <span class="muted small">${t.shots.length} 镜</span></h2><div class="row"><button data-action="undoCuts" ${!t.undoCuts?'disabled':''}>撤销调整</button><button data-action="addShot">＋ 新增分镜</button></div></div>${t.shots.map(s=>shotCard(s,t)).join('')}`}</main>`};
const originalMaterials=taskMaterials;
taskMaterials=function(t){if(!t||experienceLanding||t.gated&&!t.sourceParsed)return '';return originalMaterials(t).replace(/<button class="materials-toggle"[\s\S]*?<\/button>/,'')};
function compositionDialog(t,sample){viewerPlayback?.();compositionContext={taskId:t.id,sampleId:sample.id};const pending=sample.status==='组装中',stale=!sample.fixed&&sample.fingerprint!==sampleFingerprint(t);modal('完整成片',pending?`<div class="gw-composing"><b>正在组合成片…</b><p>按你确定的 ${t.shots.length} 镜来源拼接</p></div>`:`<div class="sp-viewer gw-composition-viewer"><div class="sp-screen"><video class="sp-modal-video" id="gw-composition-video" controls autoplay muted playsinline></video></div><div class="sp-chapters"><h3>${sample.fixed?'此成片已确认':'预览后确认成片'}</h3><p class="small muted">${sample.shots.length} 镜 · 原片 ${sample.shots.filter(s=>s.method==='keep').length} 镜</p>${sample.shots.map((s,i)=>`<div class="gw-chapter"><button class="sp-chapter" data-bp-action="seekPreview" data-number="${i}"><b>分镜 ${s.number} <span class="badge">${s.method==='keep'?'使用原片':'v'+(t.clipVersions.find(v=>v.id===s.versionId)?.number||1)}</span></b><p>${esc(s.description)}</p></button><button class="ui-btn ui-btn-secondary ui-btn-sm" data-gw="editFromComposition" data-uid="${s.uid}">${uiIcon('edit')} 修改此镜</button></div>`).join('')}${stale?'<p class="notice">镜头选择已变更，请关闭后重新组合。</p>':''}</div></div>`,`<span class="small muted">${pending?'':sample.fixed?'已保存模板，可设置新批次':'确认前不会固定为模板'}</span>${!pending?`<button class="primary ui-btn ui-btn-primary" data-gw="confirmComposition" ${stale?'disabled':''}>${sample.fixed?'设置批量':'确认成片，设置批量'}</button>`:''}`);$('#dialog').dataset.gwComposition=sample.id;if(!pending)viewerPlayback=startSimulation($('#gw-composition-video'),sample.shots)}
assembleWorkflowSample=async function(){const t=task(),epoch=t?.jobEpoch||0;if(!t||!readyForSample(t))return toast('请为每个生成镜头选用一个版本');if(t.samples.some(s=>s.status==='组装中'))return;const sample={id:workflowId(),created:Date.now(),shots:cloneWorkflow(chosenShots(t)),fingerprint:sampleFingerprint(t),status:'组装中',fixed:false};t.samples.push(sample);save();render();compositionDialog(t,sample);await new Promise(r=>setTimeout(r,750));if(!state.tasks.includes(t)||(t.jobEpoch||0)!==epoch||sample.status!=='组装中')return;sample.status='待预览';t.stage='成片待确认';save();if(task()?.id===t.id)render();if($('#dialog').open&&compositionContext?.sampleId===sample.id&&$('#dialog').dataset.gwComposition===sample.id)compositionDialog(t,sample)};
const uploadBeforeGuided=upload;
upload=async function(files,mode){if(mode!=='template')return uploadBeforeGuided(files,mode);for(const file of files){if(!file.type.startsWith('video/')){toast('请选择视频文件');continue}const t=newTrialTask();t.name=file.name.replace(/\.[^.]+$/,'');importedTask(t,'local',file.name,URL.createObjectURL(file))}$('#dialog').close();save();render()};
createLinkTask=function(){const url=extractVideoLink($('#video-link').value.trim());if(!url)return toast('请输入有效的视频链接');const t=newTrialTask();t.name='链接视频 · 新任务';importedTask(t,'link',url,url);$('#dialog').close();save();render()};
document.addEventListener('change',e=>{if(e.target.dataset.gwUpload==='video'){const file=e.target.files[0];if(!file)return;if(!file.type.startsWith('video/'))return toast('请选择视频文件');importedTask(task(),'local',file.name,URL.createObjectURL(file))}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-gw]');if(!b||b.disabled)return;const t=task(),d=b.dataset;switch(d.gw){case 'start':newTrialTask();window.scrollTo({top:0});break;case 'continue':experienceLanding=false;render();break;case 'home':experienceLanding=true;render();break;case 'importDemo':importedTask(t,'demo','核桃编程 · 多人对话示例');break;case 'importLink':{const url=extractVideoLink($('#gw-link').value.trim());if(!url)return toast('请输入有效的视频链接');importedTask(t,'link',url,url);break}case 'retrySource':analyseSource(t);break;case 'assemble':assembleWorkflowSample();break;case 'previewComposition':compositionDialog(t,t.samples.at(-1));break;case 'previewTemplate':{const sample=fixedTemplateSample(t);if(sample)compositionDialog(t,sample);break}case 'editFromComposition':{$('#dialog').close();viewerPlayback?.();const s=t.shots.find(s=>s.uid===d.uid);if(s)$('#shot-'+s.id)?.scrollIntoView({block:'center',behavior:'smooth'});break}case 'confirmComposition':{const sample=t.samples.find(s=>s.id===compositionContext?.sampleId);if(!sample)return;if(!sample.fixed&&!fixWorkflowTemplate(t))return;save();render();openBatchSettings(t);break}case 'batchSettings':openBatchSettings(t);break}});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="task"]')){experienceLanding=false;render()}});
document.addEventListener('close',e=>{if(e.target.id==='dialog'){delete e.target.dataset.gwComposition;compositionContext=null;viewerPlayback?.()}},true);
save();render();
