function studioShotTitle(s){return ({meal:'妈妈与男孩用餐','host-living':'主播介绍','product-original':'礼盒实物展示','games-original':'游戏课程画面','host-carousel':'主播讲解','host-rooftop':'套餐介绍'})[s.demoCoverKey]||(['妈妈与男孩用餐','主播介绍','礼盒实物展示','游戏课程画面','主播讲解','套餐介绍'][s.sourceIndex??s.id])||s.description?.slice(0,12)||'新分镜';}
function studioPromptTokens(s){return esc(s.prompt).replace(/@图片(\d+)/g,(token,n)=>{const a=state.assets.find(a=>a.id===s.refs[+n-1]);return a?`<span class="prompt-image-token" data-sp-image-hover="true" data-i="${esc(a.id)}" title="${esc(a.name)}">${token}</span>`:token;});}
/* A video-first workspace. This module changes presentation, not generation state. */
function studioIcon(name) {
  const paths = {
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    film:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    wand:'<path d="m3 17 10-10 4 4L7 21Zm4-20 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 5 5 3-3 5 5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    text:'<path d="M4 5h16M8 10h12M8 15h12M8 20h8M4 10h.01M4 15h.01M4 20h.01"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    edit:'<path d="m15 4 5 5-11 11H4v-5L15 4Zm-2 2 5 5"/>',
    layers:'<path d="m12 3 10 6-10 6L2 9l10-6ZM2 14l10 6 10-6M2 18l10 5 10-5"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'
  };
  return paths[name] ? `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>` : uiIcon(name);
}

function studioStatus(t,s) {
  const pick=resolveShot(t,s), versions=matchingVersions(t,s);
  if(s.independent&&!s.sourceAssetId&&s.method!=='aigc')return {text:'待上传',type:'idle'};
  if(pick.source) return {text:'使用原片',type:'source'};
  if(versions.some(v=>v.status==='生成中')) return {text:'生成中',type:'busy'};
  if(pick.version) return {text:pick.automatic?'可组合':'已选用',type:'ready'};
  if(versions.some(v=>['待预览','待选用'].includes(v.status))) return {text:'待选用',type:'review'};
  if(!t.parsed) return {text:t.brief.trim()?'待解析需求':'待填需求',type:'idle'};
  return {text:'待生成',type:'idle'};
}

function studioTime(seconds) {
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

function studioShotNav(t) {
  const total=t.shots.reduce((sum,s)=>sum+duration(s),0);
  return `<section class="studio-sequence" aria-label="分镜导航"><div class="studio-sequence-head"><h2>分镜工作区 <span>${t.shots.length} 镜 / ${studioTime(total)}</span></h2><div class="row"><button class="ui-btn ui-btn-secondary ui-btn-sm" data-action="undoCuts" ${!t.undoCuts?'disabled':''}>${studioIcon('undo')} 撤销调整</button><button class="primary ui-btn ui-btn-primary studio-generate-all" data-studio="generateAll" ${!t.parsed||t.requirementDirty?'disabled':''}>${studioIcon('film')} 生成全部分镜</button></div></div><nav class="studio-compact-nav" aria-label="定位分镜">${t.shots.map(s=>`<div class="nav-shot-item"><button data-sp="locate" data-uid="${s.uid}" aria-label="定位分镜${s.id+1}" title="${esc(studioShotTitle(s))}"><span class="nav-shot-image">${shotVisual(s,'shot-photo',t)||art(s.id%3)}</span><span><b>分镜 ${s.id+1}</b><small class="nav-shot-status ${studioStatus(t,s).type}">${studioStatus(t,s).text}</small></span></button><button class="nav-shot-remove" data-action="deleteShot" data-i="${s.id}" aria-label="从导航删除分镜${s.id+1}" title="删除分镜">${studioIcon('close')}</button></div>`).join('')}<button class="nav-shot-add" data-studio="addShotMenu" aria-label="新增分镜" title="新增分镜">${studioIcon('plus')}</button></nav></section>`;
}

brief=function(t) {
  if(false&&t.parsed&&!t.briefExpanded)return `<section class="studio-brief brief studio-brief-collapsed" aria-label="全片需求"><div class="studio-brief-head"><div class="row"><span class="studio-ai-mark">${studioIcon('wand')}</span><h2>整体修改需求</h2><span class="studio-status studio-requirement-status ${t.requirementDirty?'review':'ready'}">${t.requirementDirty?'待重新解析':'已解析'}</span></div><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="expandBrief">${studioIcon('edit')} 修改需求</button></div><p>${esc(t.brief)}</p>${requirementFeedback(t)}</section>`;
  return `<section class="studio-brief brief" aria-label="全片需求"><div class="studio-brief-head"><div class="row"><span class="studio-ai-mark">${studioIcon('wand')}</span><h2>整体修改需求</h2><span class="studio-brief-hint">AI 将你的想法分配到每个分镜</span></div><div class="row">${(t.demoFamily||t.medicalSpeechDemo)&&!t.parsed?'<button class="ui-btn ui-btn-secondary ui-btn-sm" data-action="fillDemo">填入示例需求</button>':''}${t.parsed?`<span class="studio-status studio-requirement-status ${t.requirementDirty?'review':'ready'}">${t.requirementDirty?'待重新解析':'已解析'}</span>`:''}</div></div><div class="studio-composer"><textarea aria-label="整体修改需求" data-field="brief" aria-describedby="template-reference-guidance" placeholder="请写清每个修改对象及对应的 @图片名。
例如：妈妈参考 @妈妈参考A，男孩参考 @男孩参考A，用餐场景参考 @日式餐厨场景。">${esc(t.brief)}</textarea><p id="template-reference-guidance" class="reference-input-guidance">每个要修改的人物、商品、场景，都必须写清对应的 <strong>@图片名</strong>，否则系统无法识别参考图归属。<br>未提到的内容默认保持不变。</p>${t.brief.endsWith('@')?mentions(-1):''}<div class="studio-composer-tools"><div class="row"><label class="small">口播 <select class="ui-select" data-field="mode" aria-label="口播模式"><option value="keep" ${t.mode==='keep'?'selected':''}>不改口播</option><option value="replace" ${t.mode==='replace'?'selected':''}>替换口播</option></select></label><button class="ui-btn ui-btn-secondary ui-btn-sm" data-action="materials" data-i="-1">${studioIcon('image')} 引用图片</button></div><button class="primary ui-btn ui-btn-primary" data-action="parse" ${t.running?'disabled':''}>${studioIcon('wand')} ${t.parsed?'解析并更新':'解析并填写'}</button></div></div>${t.mode==='replace'?`<label class="studio-extra-script">完整新口播<textarea data-field="script" aria-label="完整新口播" placeholder="填写整条视频的新台词">${esc(t.script)}</textarea></label>`:''}${t.parsed?`<details class="parse-summary studio-parse-summary"><summary>查看已解析的修改项与保留项</summary><div class="summary"><div><b>要修改</b><ul>${t.change.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div><div><b>要保持</b><ul>${t.keep.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div></div></details>`:''}${requirementFeedback(t)}</section>`;
};


function requirementFeedback(t){return `<p class="studio-reparse-note" ${t.requirementDirty||t.parseFeedback?'':'hidden'}>${esc(t.requirementDirty?'总需求已修改，重新解析后才会更新分镜提示词。手动修改会保留。':t.parseFeedback||'')}</p>`;}
function refreshRequirementFeedback(t){
  document.querySelectorAll('.studio-requirement-status').forEach(el=>{el.textContent=t.requirementDirty?'待重新解析':'已解析';el.classList.toggle('review',!!t.requirementDirty);el.classList.toggle('ready',!t.requirementDirty)});
  document.querySelectorAll('.studio-reparse-note').forEach(el=>{el.hidden=!t.requirementDirty&&!t.parseFeedback;el.textContent=t.requirementDirty?'总需求已修改，重新解析后才会更新分镜提示词。手动修改会保留。':t.parseFeedback||''});
  const explanation=compositionExplanation(t),help=document.querySelector('#compose-help'),action=document.querySelector('.gw-compose-bar [aria-describedby="compose-help"]');
  if(help)help.textContent=explanation;if(action)action.title=explanation;
  document.querySelectorAll('[data-workspace-stage]').forEach(el=>{if(el.dataset.workspaceStage===t.id)el.textContent=workspaceProgress(t).stage});
}
function storageFeedback(){return `<div class="studio-save-error" role="alert" ${localSaveStatus.ok?'hidden':''}><span>本地保存失败，当前内容尚未备份。</span><div class="row"><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="retrySave">重试保存</button><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="exportState">导出备份</button></div></div>`;}

function studioMethod(s,t) {
  return `<select class="ui-select" aria-label="分镜处理方式" ${!t.parsed&&!s.independent?'disabled':''} data-field="method" data-i="${s.id}"><option value="pending" disabled ${s.method==='pending'?'selected':''}>待解析需求</option><option value="edit" ${s.method==='edit'?'selected':''}>视频编辑</option><option value="aigc" ${s.method==='aigc'?'selected':''}>AIGC 生成</option><option value="keep" ${s.method==='keep'?'selected':''}>使用原片</option></select>`;
}

function studioReferences(s,t) {
  return s.refs.map(id=>state.assets.find(a=>a.id===id)).filter(a=>a?.type==='image'&&isShotImageUsed(s,a,t)).map(a=>`<span class="ref wf-ref">${a.type==='image'&&a.url?`<button class="ref-preview" data-action="assetPreview" data-sp-image-hover="true" data-i="${a.id}" aria-label="查看${esc(a.name)}">${assetVisual(a,'mini')}</button>`:''}<span>${t.demoFamily||t.medicalSpeechDemo?'@图片'+(s.refs.indexOf(a.id)+1):'@'}<small>${esc(a.name)}</small></span><button class="link" data-action="removeMention" data-i="${s.id}" data-id="${a.id}" aria-label="移除本镜${esc(a.name)}引用">×</button></span>`).join('');
}

function studioSourceInfo(s) {
  const editing=!!s.sourceEditing, read=editing?'':'readonly';
  if(!editing)return `<section class="studio-source-info is-readonly" aria-label="原片识别内容"><div class="studio-source-head"><b>原片内容</b><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="editSource" data-uid="${s.uid}" aria-pressed="false">${studioIcon('edit')}编辑识别内容</button></div><div class="studio-description-read"><span>画面描述</span><p>${esc(s.description)}</p></div><div class="studio-meta-read"><div class="studio-meta-item"><span>人物</span><p>${esc(s.person)}</p></div><div class="studio-meta-item"><span>场景</span><p>${esc(s.scene)}</p></div></div><div class="studio-scripts"><div class="studio-script-read"><div class="studio-speech-label"><span>口播转写</span><button class="ui-btn ui-btn-secondary ui-btn-xs ui-expand" data-studio="expandSpeech" data-uid="${s.uid}" aria-expanded="${!!s.speechExpanded}" aria-label="${s.speechExpanded?'收起口播全文':'展开口播全文'}">${s.speechExpanded?'收起':'展开'}${studioIcon(s.speechExpanded?'up':'down')}</button></div><p class="studio-transcript ${s.speechExpanded?'is-expanded':''}">${esc(s.speech||'未识别到口播')}</p></div><div class="studio-script-read"><span>其他字幕</span><p>${esc(s.caption||'未识别到其他字幕')}</p></div></div></section>`;
  return `<section class="studio-source-info ${editing?'is-editing':''}" aria-label="原片识别内容"><div class="studio-source-head"><b>原片内容</b><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="editSource" data-uid="${s.uid}" aria-pressed="${editing}">${studioIcon('edit')}${editing?'完成编辑':'编辑识别内容'}</button></div><label class="studio-description"><span>画面描述</span><textarea class="studio-inline" data-field="description" data-i="${s.id}" aria-label="画面描述" rows="2" ${read}>${esc(s.description)}</textarea></label><div class="studio-fields"><label><span>人物</span><input class="studio-inline" data-field="person" data-i="${s.id}" aria-label="人物" value="${esc(s.person)}" ${read}></label><label><span>场景</span><input class="studio-inline" data-field="scene" data-i="${s.id}" aria-label="场景" value="${esc(s.scene)}" ${read}></label></div><div class="studio-scripts"><label><span class="studio-speech-label">口播转写<button class="ui-btn ui-btn-secondary ui-btn-xs ui-expand" data-studio="expandSpeech" data-uid="${s.uid}" aria-label="${s.speechExpanded?'收起口播全文':'展开口播全文'}">${s.speechExpanded?'收起':'展开'}${studioIcon(s.speechExpanded?'up':'down')}</button></span><textarea class="studio-inline speech-record ${s.speechExpanded?'is-expanded':''}" data-field="speech" data-i="${s.id}" aria-label="口播转写" rows="${editing?4:2}" ${read}>${esc(s.speech)}</textarea></label><label><span>其他字幕</span><textarea class="studio-inline" data-field="caption" data-i="${s.id}" aria-label="其他字幕识别记录" rows="2" ${read}>${esc(s.caption)}</textarea></label></div></section>`;
}

function studioPrompt(s,t) {
  if(s.method==='keep') return '';
  const selected=resolveShot(t,s).version;
  const editable=t.parsed||s.independent;
  return `<div class="studio-prompt">${studioReferences(s,t)?`<div class="studio-references row wrap" aria-label="本镜已引用图片">${studioReferences(s,t)}</div>`:''}<div class="field-head"><span>分镜提示词 ${s.manual?'<span class="badge amber">已编辑</span>':''}</span><div class="row">${s.undoPrompt!==undefined?`<button class="ui-btn ui-btn-ghost ui-btn-sm" data-action="undoPrompt" data-i="${s.id}">撤销</button>`:''}</div></div><div class="studio-prompt-frame"><div class="prompt-edit-surface"><div class="prompt-token-layer" aria-hidden="true">${studioPromptTokens(s)}</div><textarea class="prompt ${s.promptExpanded?'expanded':''}" data-field="prompt" data-i="${s.id}" aria-label="分镜${s.id+1}提示词" placeholder="${s.independent?'填写这一镜的修改要求…':'解析顶部需求后，AI 将填写本镜提示词。'}" ${!editable?'disabled':''}>${esc(s.prompt)}</textarea></div><div class="studio-prompt-meta"><span>${s.independent&&!s.sourceAssetId?'先上传本镜视频':t.parsed&&s.method==='edit'?'@视频1 · 本镜编辑母版':'输入 @ 引用参考图片'}</span><button class="ui-btn ui-btn-secondary ui-btn-xs ui-expand sp-expand" data-sp="expandPrompt" data-uid="${s.uid}">${s.promptExpanded?'收起提示词':'展开提示词'}${studioIcon(s.promptExpanded?'up':'down')}</button></div></div>${selected?`<p class="studio-draft-note" ${shotDraftChanged(s,selected)?'':'hidden'}>提示词已修改，当前成片仍使用 v${selected.number}。生成并选用新版后才会更新。</p>`:''}${s.prompt.endsWith('@')?mentions(s.id):''}${s.suggestion?`<div class="suggestion"><b>润色建议</b><p>${esc(s.suggestion)}</p><button class="primary small" data-action="apply" data-i="${s.id}">应用到提示词</button><button class="link small" data-action="discard" data-i="${s.id}">放弃</button></div>`:''}</div>`;
}

shotCard=function(s,t) {
  workflowState(t);
  const status=studioStatus(t,s),chosen=resolveShot(t,s).version,showChosen=!!chosen&&s.previewMode!=='original',previewShot=mainPreviewShot(t,s),previewImage=shotVisual(previewShot,'shot-photo',t)||art(s.id%3);
  const resultHtml=shotResultsStrip(s,t,{hideAction:true}),hasResults=s.method!=='keep'&&t.clipVersions.some(v=>v.shotUid===s.uid);
  return `<article class="shot shot-card studio-shot ${hasResults?'has-results':''}" id="shot-${s.id}" data-studio-uid="${s.uid}">
    <div class="studio-shot-header"><div class="studio-shot-name"><b>分镜 ${String(s.id+1).padStart(2,'0')}</b><span class="studio-shot-time">${studioIcon('clock')}${s.independent&&!s.sourceAssetId?'待上传':duration(s)+' 秒'}</span><span class="studio-status ${status.type}">${status.text}</span></div><div class="studio-shot-tools">${studioMethod(s,t)}<button class="ui-btn ui-btn-secondary ui-btn-sm studio-cut-toggle" data-action="toggleCuts" data-i="${s.id}">${studioIcon('layers')}${s.open?'收起调整':'调整细分镜'}${studioIcon(s.open?'up':'down')}</button><details class="studio-more ui-menu"><summary role="button" aria-haspopup="menu" aria-expanded="false" aria-label="分镜${s.id+1}更多操作">${studioIcon('more')}<span>更多</span></summary><div class="studio-more-menu" role="menu" aria-label="分镜${s.id+1}操作"><button role="menuitem" data-action="moveShot" data-i="${s.id}" data-direction="-1" aria-label="上移分镜${s.id+1}" ${s.id===0?'disabled':''}>${studioIcon('up')} 上移分镜</button><button role="menuitem" data-action="moveShot" data-i="${s.id}" data-direction="1" aria-label="下移分镜${s.id+1}" ${s.id===t.shots.length-1?'disabled':''}>${studioIcon('down')} 下移分镜</button><button role="menuitem" class="studio-delete" data-action="deleteShot" data-i="${s.id}" aria-label="删除分镜${s.id+1}">${studioIcon('trash')} 删除分镜</button></div></details></div></div>
    
    <div class="studio-shot-body"><div class="studio-shot-media">${true?`<div class="studio-preview-switch" role="group" aria-label="分镜${s.id+1}预览来源"><button data-studio="previewMode" data-uid="${s.uid}" data-mode="original" class="${showChosen?'':'active'}" aria-pressed="${!showChosen}">原片</button><button data-studio="previewMode" data-uid="${s.uid}" data-mode="selected" class="${showChosen?'active':''}" aria-pressed="${showChosen}" ${!chosen?'disabled':''}>已选用</button></div>`:''}${s.independent?independentShotPreview(s,t):`<button class="preview" data-studio="openShotPreview" data-uid="${s.uid}" data-sp-main="${s.uid}" aria-label="预览分镜${s.id+1}">${previewImage}<span class="studio-preview-tag">${showChosen?'已选用 v'+chosen.number:t.demoFamily?'原片示意':'原片分镜'}</span><span class="play">▶</span><span class="duration">${studioTime(duration(s))}</span></button>`}<div class="studio-media-caption"><span>悬停播放 · 点击放大</span></div>${s.candidates.length?`<button class="small" data-action="candidates" data-i="${s.id}">候选 ${s.candidates.length} 个</button>`:''}</div>
      <div class="studio-shot-editor">
      ${s.needsReview?'<p class="notice">片段已调整，请核对本镜描述、台词及提示词范围。</p>':''}
      ${s.independent?independentUploadEntry(s):''}${studioPrompt(s,t)}${s.method!=='keep'?studioSpeechEditor(s,t):''}${resultHtml?`<div class="studio-shot-results">${resultHtml}</div>`:''}
      ${s.method!=='keep'?`<div class="studio-generation"><span class="studio-status ${status.type}">${status.text}</span>${shotGenerationAction(s,t)}</div>`:''}${duration(s)>0&&duration(s)<4&&s.method!=='keep'?'<p class="notice">此镜按 4 秒重新生成，成片会变长。</p>':''}</div></div><footer class="studio-card-footer"><div class="row"><button class="ui-btn ui-btn-secondary ui-btn-sm" data-studio="sourceDetails" data-uid="${s.uid}" aria-expanded="${!!s.sourceDetailsOpen}">${s.independent?'视频详情':'原片详情'} ${studioIcon(s.sourceDetailsOpen?'up':'down')}</button><button class="ui-btn ui-btn-secondary ui-btn-sm" data-action="toggleCuts" data-i="${s.id}" ${s.independent?'disabled title="独立上传视频，不关联原片细分镜"':''}>调整细分镜 ${studioIcon(s.open?'up':'down')}</button></div><span class="small muted">已保存</span></footer>${s.open?`<div class="studio-cuts">${cutPanel(s)}</div>`:''}${s.sourceDetailsOpen?`<div class="studio-source-disclosure">${studioSourceInfo(s)}</div>`:''}
  </article>`;
};

function studioTaskHeader(t) {
  const folder=state.folders.find(f=>f.id===t.folder);
  return `<div class="studio-task-header"><div><div class="studio-project-path">${studioIcon('assets')}${esc(folder?.name||'项目')}<span>/</span><span>工作台</span></div><div class="studio-task-heading"><h1>${esc(t.name)}</h1><span class="studio-save-state ${localSaveStatus.ok?'':'is-error'}" role="status">${localSaveStatus.ok?'已保存':'保存失败'}</span></div></div><div class="gw-task-actions row">${t.sourceParsed||!t.gated?`<button class="ui-btn ui-btn-secondary ui-btn-sm" data-action="original">${studioIcon('play')} 查看原视频</button><button class="studio-material-toggle ui-btn ui-btn-secondary ui-btn-sm" data-action="toggleMaterials">参考素材</button>`:''}<button class="ui-btn ui-btn-ghost ui-btn-sm" data-bp-action="newTrial">从头体验示例</button></div></div>`;
}

function studioCommand(t) {
  return `<div class="studio-command">${phaseNavigation(t)}${t.phase==='batch'?`<div class="studio-batch-source"><span>基于模板 v${t.templates.at(-1)?.number||1}</span><button class="ui-btn ui-btn-secondary ui-btn-sm" data-gw="previewTemplate">预览模板</button></div>`:''}</div>`;
}

function studioLanding() {
 return `<main class="wf-main studio-landing" data-workflow-tab="入口"><div class="studio-landing-title"><h1>从一条视频，开始创作</h1><p>导入参考视频，自动整理分镜，再按你的想法复刻。</p></div><section class="studio-direct-import"><div class="video-import-options"><button class="studio-demo-upload" data-demo-import="true"><span class="studio-upload-icon">${studioIcon('upload')}</span><b>上传视频</b><span>使用内置示例，直接体验解析</span><small>9:16 竖屏 · 多人对话示例</small></button><form class="link-video-option" id="video-link-form"><b>导入视频链接</b><p>粘贴抖音等平台的视频分享链接</p><textarea id="video-link" rows="2" aria-label="视频链接" placeholder="粘贴视频链接或分享文字"></textarea><button type="submit" class="primary">导入并解析</button></form></div><p class="small muted studio-import-destination">添加到 ${esc(state.folders.find(f=>f.id===currentFolder)?.name||'当前项目')} · 导入后自动创建任务</p></section></main>`;
}
document.addEventListener('click',e=>{if(!e.target.closest('[data-demo-import]'))return;const t=newTrialTask();let n=1;while(state.tasks.some(x=>x!==t&&x.name===workspaceTaskSuggestedName(t,n)))n++;t.name=workspaceTaskSuggestedName(t,n);t.readableTaskNameV1=true;importedTask(t,'demo','核桃编程 · 多人对话示例');});

work=function() {
  const current=task();
  if(experienceLanding||!current) return studioLanding();
  const t=workflowState(current);
  if(t.gated&&!t.sourceParsed){resumeSourceAnalysis(t);return `<main class="wf-main studio-work ${t.videoImported?'':'studio-import-page'}" data-workflow-tab="${t.videoImported?'制作':'导入'}">${studioTaskHeader(t)}${storageFeedback()}${!t.videoImported?'<button class="ui-btn ui-btn-secondary ui-btn-sm studio-home" data-gw="home">返回体验入口</button>':''}${sourceImportPanel(t)}</main>`;}
  const batch=t.phase==='batch';
  return `<main class="wf-main studio-work" data-workflow-tab="${batch?'批量':'制作'}">${studioTaskHeader(t)}${storageFeedback()}${studioCommand(t)}${batch?batchSection(t):`${brief(t)}${studioShotNav(t)}${t.shots.map(s=>shotCard(s,t)).join('')}${compositionToolbar(t)}`}</main>`;
};

let studioObserver;
let studioEntryTask;
const studioPicks=new Map();
const studioPreviousRender=render;
render=function() {
  const entryKey=experienceLanding?'landing':task()?.id;
  const scrollPosition=window.scrollY, preservePosition=entryKey===studioEntryTask;
  studioPreviousRender();
  if(preservePosition&&window.scrollY!==scrollPosition&&typeof window.scrollTo==='function')window.scrollTo({top:scrollPosition,behavior:'instant'});
  const main=document.querySelector('.studio-work,.studio-landing');
  if(main&&entryKey!==studioEntryTask){main.classList.add('studio-enter');studioEntryTask=entryKey;}
  studioObserver?.disconnect();
  if(typeof IntersectionObserver!=='function') return;
  const cards=[...document.querySelectorAll('.studio-shot')];
  if(!cards.length) return;
  cards.forEach(card=>{
    const key=task().id+':'+card.dataset.studioUid,picked=card.querySelector('.sp-version.picked'),id=picked?.querySelector('[data-sp="versionPreview"]')?.dataset.id||'';
    if(studioPicks.has(key)&&studioPicks.get(key)!==id&&picked)picked.classList.add('studio-selected');
    studioPicks.set(key,id);
  });
  studioObserver=new IntersectionObserver(()=>updatePinnedShotNavigation(),{threshold:[0,.2,.5]});
  cards.forEach(card=>studioObserver.observe(card));
  updatePinnedShotNavigation();
};

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-studio]');
  if(!button) return;
  if(button.dataset.studio==='generateAll'){const t=task();if(!t.parsed||t.requirementDirty)return;const eligible=t.shots.filter(s=>['edit','aigc'].includes(s.method)&&s.prompt.trim()&&!(s.independent&&s.method==='edit'&&!s.sourceAssetId)&&!t.clipVersions.some(v=>v.shotUid===s.uid&&v.status==='生成中'));if(!eligible.length)return toast('暂无可生成的分镜');eligible.forEach(s=>generateWorkflowShot(s.uid));return;}
  if(button.dataset.studio==='retrySave'){save();render();return;}
  if(button.dataset.studio==='exportState'){exportWorkspaceState();return;}
  if(button.dataset.studio==='expandBrief'){task().briefExpanded=true;save();render();return;}
  const s=task()?.shots.find(s=>s.uid===button.dataset.uid);
  if(!s) return;
  if(button.dataset.studio==='previewMode'){s.previewMode=button.dataset.mode;save();render();return;}
  if(button.dataset.studio==='openShotPreview'&&s.independent){openIndependentVideo(s);return;}
  if(button.dataset.studio==='openShotPreview'){const chosen=resolveShot(task(),s).version;if(chosen&&s.previewMode!=='original')openSimulation('分镜 '+(s.id+1)+' · 已选用 v'+chosen.number,[mainPreviewShot(task(),s)]);else if(task().demoFamily)openSimulation('分镜 '+(s.id+1)+' · 原片示意',[mainPreviewShot(task(),s)]);else showPreview(s.id);return;}
  if(button.dataset.studio==='sourceDetails')s.sourceDetailsOpen=!s.sourceDetailsOpen;
  else if(button.dataset.studio==='speechEditor')s.speechEditorOpen=!s.speechEditorOpen;
  else if(button.dataset.studio==='editSource')s.sourceEditing=!s.sourceEditing;
  else if(button.dataset.studio==='expandSpeech')s.speechExpanded=!s.speechExpanded;
  else return;
  save();render();
});

// Native disclosure supplies the trigger; menu items keep keyboard and pointer behavior aligned.
document.addEventListener('toggle',e=>{
  const menu=e.target;
  if(!menu.matches?.('.ui-menu'))return;
  menu.querySelector('summary')?.setAttribute('aria-expanded',String(menu.open));
  if(menu.open)document.querySelectorAll('.ui-menu[open]').forEach(other=>{if(other!==menu)other.open=false;});
},true);
document.addEventListener('click',e=>{
  document.querySelectorAll('.ui-menu[open]').forEach(menu=>{if(!menu.contains(e.target))menu.open=false;});
});
document.addEventListener('keydown',e=>{
  const menu=e.target.closest?.('.ui-menu');
  if(!menu)return;
  const trigger=menu.querySelector('summary'),items=[...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
  if(e.key==='Escape'){e.preventDefault();menu.open=false;trigger.focus();return;}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key)||!items.length)return;
  e.preventDefault();menu.open=true;
  const current=items.indexOf(document.activeElement);
  const index=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?(current+1)%items.length:(current<0?items.length-1:(current-1+items.length)%items.length);
  items[index].focus();
});

render();

document.addEventListener('input',e=>{const uid=e.target.dataset.studioSpeech;if(!uid)return;const s=task()?.shots.find(s=>s.uid===uid);if(!s)return;s.newSpeech=e.target.value;s.prompt=s.prompt.replace(/\n【本镜口播覆盖】[\s\S]*$/,'');if(s.newSpeech.trim())s.prompt+='\n【本镜口播覆盖】使用以下新台词替换原口播，口型同步：'+s.newSpeech;s.manual=true;const card=e.target.closest('.studio-shot');const input=card?.querySelector('[data-field="prompt"]');if(input)input.value=s.prompt;save();});

document.addEventListener('input',e=>{
  if(e.target.dataset.field!=='prompt')return;
  const t=task(),s=shot(+e.target.dataset.i),v=resolveShot(t,s).version,card=e.target.closest('.studio-shot'),note=card?.querySelector('.studio-draft-note'),generate=card?.querySelector('[data-wf="generateShot"]');
  if(note&&v)note.hidden=!shotDraftChanged(s,v);
  if(generate){const busy=t.clipVersions.some(v=>v.shotUid===s.uid&&v.status==='生成中');generate.disabled=(!t.parsed&&!s.independent)||!s.prompt.trim()||busy||(s.independent&&s.method==='edit'&&!s.sourceAssetId);generate.title=!t.parsed?'先解析顶部需求':!s.prompt.trim()?'填写本镜提示词后生成':'使用当前提示词生成新版本，保留已选视频';}
});

function studioSpeechEditor(s,t){return `<section class="studio-mouth"><div class="row between"><span>口播 <small>${s.newSpeech?.trim()?'已修改':'沿用原片'}</small></span><button class="ui-btn ui-btn-ghost ui-btn-sm" data-studio="speechEditor" data-uid="${s.uid}" ${!t.parsed?'disabled':''}>${s.speechEditorOpen?'收起':'修改口播'} ${studioIcon(s.speechEditorOpen?'up':'chevron')}</button></div>${s.speechEditorOpen?`<textarea data-studio-speech="${s.uid}" aria-label="分镜${s.id+1}新口播" placeholder="输入本镜新口播；留空沿用原片">${esc(s.newSpeech||'')}</textarea><details><summary>查看原口播</summary><p>${esc(s.speech)}</p></details>`:''}</section>`;}

function isShotImageUsed(s,a,t){
 const number=s.refs.indexOf(a.id)+1;
 return new RegExp('@图片'+number+'(?![0-9])').test(s.prompt)||s.prompt.includes('@'+a.name);
}
function updatePinnedShotNavigation(){
 const nav=document.querySelector('.studio-sequence');if(!nav)return;
 const cards=[...document.querySelectorAll('.studio-shot')];if(!cards.length)return;
 const anchor=Math.max(56,nav.getBoundingClientRect().bottom)+12;
 const current=cards.find(card=>card.getBoundingClientRect().bottom>anchor)||cards.at(-1);
 document.querySelectorAll('.studio-compact-nav [data-sp="locate"]').forEach(button=>{const selected=button.dataset.uid===current.dataset.studioUid;button.classList.toggle('is-current',selected);if(selected)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
}
let shotNavFrame=0;
window.addEventListener('scroll',()=>{if(shotNavFrame)return;shotNavFrame=requestAnimationFrame(()=>{shotNavFrame=0;updatePinnedShotNavigation();});},{passive:true});
