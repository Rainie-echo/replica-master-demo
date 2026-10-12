/* Reversible task removal. Shared reference assets remain in the asset library. */
let taskMenuId=null;
state.deletedTasks=state.deletedTasks||[];

function deleteWorkspaceTask(id){
  const index=state.tasks.findIndex(t=>t.id===id);
  if(index<0)return false;
  const [removed]=state.tasks.splice(index,1);
  removed.jobEpoch=(removed.jobEpoch||0)+1;
  removed.results?.forEach(r=>selectedResults.delete(r.id));
  state.deletedTasks=state.deletedTasks.filter(entry=>entry.task.id!==id);
  state.deletedTasks.unshift({id,task:removed,deletedAt:Date.now()});
  if(state.undoTaskMove?.id===id)delete state.undoTaskMove;
  if(active===id){
    const next=[...state.tasks].sort((a,b)=>b.time-a.time)[0];
    active=next?.id||null;
    currentFolder=next?.folder||currentFolder;
    view='work';
    cutSelection.clear();selectedResults.clear();editResult=null;materialsOpen=false;
    if(typeof experienceLanding!=='undefined')experienceLanding=false;
    if(typeof stopHover==='function')stopHover();
    if(typeof viewerPlayback==='function')viewerPlayback();
    if(typeof compositionContext!=='undefined')compositionContext=null;
    $('#dialog')?.close();
  }
  taskMenuId=null;
  save();render();toast('任务已移入回收站，可随时恢复');
  return true;
}

function restoreWorkspaceTask(id){
  const index=state.deletedTasks.findIndex(entry=>entry.task.id===id);
  if(index<0||state.tasks.some(t=>t.id===id))return false;
  const [{task:restored}]=state.deletedTasks.splice(index,1);
  if(!state.folders.some(f=>f.id===restored.folder))restored.folder=currentFolder||state.folders[0]?.id;
  restored.running=false;restored.batchRunning=false;
  if(restored.sourceAnalysing&&!restored.sourceParsed){restored.sourceAnalysing=false;restored.stage='准备自动解析'}
  restored.clipVersions?.forEach(v=>{if(v.status==='生成中'){v.status='需修改';v.error='生成已中断，请重新生成'}});
  restored.samples?.forEach(s=>{if(s.status==='组装中')s.status='需修改'});
  restored.batchPlans?.forEach(p=>{if(p.running){p.running=false;p.status='生成失败';p.error='任务删除时生成已中断，可重试'}});
  restored.results?.forEach(r=>{if(r.repairDraft)r.repairDraft.generating=false});
  restored.time=Date.now();
  state.tasks.unshift(restored);
  active=restored.id;currentFolder=restored.folder;view='work';
  const folder=state.folders.find(f=>f.id===currentFolder);if(folder)folder.open=true;
  if(typeof experienceLanding!=='undefined')experienceLanding=false;
  taskMenuId=null;cutSelection.clear();selectedResults.clear();editResult=null;
  $('#dialog')?.close();save();render();toast('任务已恢复，分镜、版本和素材引用已保留');
  return true;
}

function showTaskTrash(){
  const deleted=[...state.deletedTasks].sort((a,b)=>b.deletedAt-a.deletedAt);
  modal('任务回收站',deleted.length?`<div class="tm-trash-list">${deleted.map(({task:t,deletedAt})=>`<div class="tm-trash-item"><div><b>${esc(t.name)}</b><p class="small muted">${esc(state.folders.find(f=>f.id===t.folder)?.name||'原项目')} · ${new Date(deletedAt).toLocaleString('zh-CN')}</p></div><button data-tm="restore" data-id="${esc(t.id)}">恢复任务</button></div>`).join('')}</div>`:'<div class="empty">回收站为空</div>','<span class="small muted">恢复后保留原分镜和生成版本；共享素材不随任务删除。</span><button data-action="close">关闭</button>');
}

function workspaceTaskNamePrefix(t){
 if(t.medicalSpeechDemo)return '医美';
 if(t.demoFamily)return '核桃';
 const folder=state.folders.find(f=>f.id===t.folder)?.name||'任务';
 return folder==='核桃编程'?'核桃':folder;
}
function workspaceTaskSuggestedName(t,number){
 return workspaceTaskNamePrefix(t)+'-'+String(number).padStart(2,'0')+' '+(t.medicalSpeechDemo||t.mode==='replace'?'改口播':'不改口播');
}
function migrateWorkspaceTaskNames(){
 const used=new Set(state.tasks.filter(t=>t.readableTaskNameV1).map(t=>t.name));
 for(const t of state.tasks){
  if(t.readableTaskNameV1)continue;
  const match=t.name.match(/^(?:HT|YM|核桃|医美)[-－](\d+)(?:\s.*)?$/i);
  if(match){let n=t.medicalSpeechDemo?1:Number(match[1]);let name=workspaceTaskSuggestedName(t,n);while(used.has(name))name=workspaceTaskSuggestedName(t,++n);t.name=name;}
  used.add(t.name);t.readableTaskNameV1=true;
 }
 save();
}

function workspaceTaskDisplayName(t){
  const folderName=state.folders.find(f=>f.id===t.folder)?.name;
  const prefix=folderName?folderName+' · ':'';
  return prefix&&t.name.startsWith(prefix)&&t.name.length>prefix.length?t.name.slice(prefix.length):t.name;
}

function workspaceTaskRow(t){
 const progress=workspaceProgress(t),seconds=t.shots.reduce((n,s)=>n+(s.independent?Number(s.sourceDuration)||0:s.cuts.reduce((sum,cut)=>sum+(t.medicalSpeechDemo?t.medicalCutSeconds[cut]||2:t.demoFamily?FAMILY_CUT_SECONDS[cut]||2:([7,12].includes(cut)?3:2)),0)),0),rounded=Math.round(seconds),time=Math.floor(rounded/60)+':'+String(rounded%60).padStart(2,'0');
 const selected=(t.clipVersions||[]).filter(v=>v.status==='已选用').length;
 return `<div class="tm-task-row"><button class="task ${t.id===active?'active':''}" data-action="task" data-id="${t.id}" draggable="true" title="${esc(t.name)}" aria-label="${esc(t.name)}，可拖动到其他项目"><div class="task-card-top"><b class="tm-task-name">${esc(workspaceTaskDisplayName(t))}</b><span class="task-stage-chip" data-workspace-stage="${t.id}">${esc(progress.stage)}</span></div><span class="task-card-description">${t.mode==='replace'?'口播改编':'画面复刻'} · ${esc(state.folders.find(f=>f.id===t.folder)?.name||'视频任务')}</span><div class="task-card-metrics"><span>${progress.total} 镜</span><span>已选用 ${selected}</span><span>${time}</span></div></button><button class="tm-more link" data-tm="menu" data-id="${t.id}" aria-label="${esc(t.name)}任务菜单" aria-haspopup="menu" aria-expanded="${taskMenuId===t.id}">${uiIcon('more')}</button>${taskMenuId===t.id?`<div class="tm-task-menu" role="menu"><button role="menuitem" class="danger" data-tm="delete" data-id="${t.id}">${uiIcon('trash')} 删除任务</button><span>可从回收站恢复</span></div>`:''}</div>`;
}

sidebar=function(){
  const sorted=[...state.tasks].sort((a,b)=>b.time-a.time);
  return `<aside class="task-sidebar"><div class="aside-head"><span>项目文件夹</span><button class="link small" data-action="newFolder">${uiIcon('plus')} 文件夹</button></div><button class="primary upload-entry" data-demo-import="true">${uiIcon('upload')} 上传视频</button><p class="upload-destination">添加到 ${esc(state.folders.find(f=>f.id===currentFolder)?.name||'当前项目')}</p><input class="search" aria-label="搜索任务" placeholder="搜索任务名称" value="${esc(taskQuery)}" data-field="taskQuery">${state.folders.map(f=>{const tasks=sorted.filter(t=>t.folder===f.id&&t.name.includes(taskQuery));const open=f.open||!!taskQuery;return `<div class="folder" data-folder="${f.id}"><button class="folder-head ${currentFolder===f.id?'selected':''}" data-action="folder" data-id="${f.id}" aria-expanded="${open}"><span><span class="folder-chevron ${open?'is-open':''}">${uiIcon('down')}</span>${uiIcon('assets')}<span class="folder-name">${esc(f.name)}</span></span><small>${tasks.length}</small></button>${open?`<div class="folder-children">${tasks.map(workspaceTaskRow).join('')||'<p class="folder-empty">暂无任务</p>'}</div>`:''}</div>`}).join('')}${state.undoTaskMove?`<button class="link small" data-action="undoTaskMove">${uiIcon('undo')} 撤销任务移动</button>`:''}<button class="tm-trash-entry link small" data-tm="trash">${uiIcon('trash')} 任务回收站${state.deletedTasks.length?'（'+state.deletedTasks.length+'）':''}</button><div class="aside-note">拖动任务可移动到其他项目<br>项目内最新任务在最上面</div></aside>`;
};

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-tm]');
  if(button&&!button.disabled){
    const {tm,id}=button.dataset;
    if(tm==='menu'){taskMenuId=taskMenuId===id?null:id;render()}
    if(tm==='delete')deleteWorkspaceTask(id);
    if(tm==='trash'){taskMenuId=null;render();showTaskTrash()}
    if(tm==='restore')restoreWorkspaceTask(id);
    return;
  }
  if(taskMenuId&&!e.target.closest('.tm-task-menu')){taskMenuId=null;render()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&taskMenuId){taskMenuId=null;render()}});

save();render();
