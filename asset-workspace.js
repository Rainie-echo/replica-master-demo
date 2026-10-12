/* Assets reuse project ownership, but never expose task editing controls. */
let assetFolderScope=null,assetFolderQuery='',assetRawCategory='全部';
const ASSET_STATUS_COLORS={'待预览':'#27d3e3','待选用':'#6489ff','已选用':'#a347ff','需修改':'#efa52c','已弃用':'#ed555e'};
function libraryIcon(name){const paths={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',film:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/>'};return paths[name]?`<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`:uiIcon(name)}
function assetScopeName(){return state.folders.find(f=>f.id===assetFolderScope)?.name||'全部文件夹'}
function libraryRecords(){
  return state.tasks.flatMap(t=>{
    const results=(t.results||[]).map(r=>{
      const v=r.versions?.find(v=>v.name===r.current);
      return {key:'result:'+r.id,taskId:t.id,taskName:t.name,folderId:t.folder,name:r.name,version:r.current||'v1',status:labelMigration[r.status]||r.status||'待预览',created:v?.created||r.created||t.time,shots:v?.shots||r.templateSnapshot?.shots||[],record:r};
    });
    const samples=(t.samples||[]).filter(s=>s.status!=='组装中'&&!results.some(r=>r.record.sampleId===s.id)).map((s,i)=>({key:'sample:'+s.id,taskId:t.id,taskName:t.name,folderId:t.folder,name:'模板成片 '+(i+1),version:'v1',status:s.fixed?'已选用':labelMigration[s.status]||s.status||'待预览',created:s.created||t.time,shots:s.shots||[],record:s}));
    return [...results,...samples];
  }).sort((a,b)=>b.created-a.created);
}
function libraryVisibleRecords(){return libraryRecords().filter(r=>(!assetFolderScope||r.folderId===assetFolderScope)&&(assetFilter==='全部'||r.status===assetFilter))}
function libraryImageFolders(a){
  const ids=new Set([a.folderId,a.folder].filter(Boolean));
  state.tasks.forEach(t=>{if((t.assets||[]).includes(a.id)||(t.shots||[]).some(s=>(s.refs||[]).includes(a.id)))ids.add(t.folder)});
  state.folders.forEach(f=>{if(a.source===f.name)ids.add(f.id)});
  return ids;
}
function libraryImageVisual(a,cls){return a.url?assetVisual(a,cls):`<span class="library-image-placeholder">${uiIcon('assets')}<span>暂无图片预览</span></span>`}
function libraryVisibleImages(){return state.assets.filter(a=>a.type==='image'&&a.role!=='原片记录'&&(!assetFolderScope||libraryImageFolders(a).has(assetFolderScope))&&(assetRawCategory==='全部'||studioMaterialCategory(a)===assetRawCategory))}
const assetWorkSidebar=sidebar;
sidebar=function(){
  if(view==='work')return assetWorkSidebar();
  if(assetFolderScope&&!state.folders.some(f=>f.id===assetFolderScope))assetFolderScope=null;
  const folders=state.folders.filter(f=>f.name.toLocaleLowerCase().includes(assetFolderQuery.toLocaleLowerCase()));
  return `<aside class="task-sidebar library-sidebar" aria-label="资产文件夹"><h2>文件夹</h2><label class="library-folder-search">${libraryIcon('search')}<input type="search" aria-label="搜索文件夹" placeholder="搜索文件夹" value="${esc(assetFolderQuery)}" data-library-query></label><nav class="library-folder-list" aria-label="文件夹"><button data-library-folder="" class="${!assetFolderScope?'active':''}" aria-current="${!assetFolderScope?'page':'false'}">${uiIcon('assets')}<span>全部文件夹</span></button>${folders.map(f=>`<button data-library-folder="${esc(f.id)}" class="${assetFolderScope===f.id?'active':''}" aria-current="${assetFolderScope===f.id?'page':'false'}">${uiIcon('assets')}<span>${esc(f.name)}</span></button>`).join('')}${!folders.length?'<p class="library-search-empty">没有匹配的文件夹</p>':''}</nav></aside>`;
};
function libraryDuration(shots){const seconds=Math.round(shots.reduce((n,s)=>n+(Number(s.duration)||0),0));return Math.floor(seconds/60).toString().padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
function libraryStatus(status){return `<span class="library-status" style="--asset-status:${ASSET_STATUS_COLORS[status]||'#b7a9cb'}"><i></i>${esc(status)}</span>`}
function libraryVideoCard(r){
  const visual=r.shots[0]?shotVisual(r.shots[0],'shot-photo',state.tasks.find(t=>t.id===r.taskId)):'';
  return `<article class="library-video-card"><button class="library-video-cover" data-library-preview="${esc(r.key)}" aria-label="预览${esc(r.name)} ${esc(r.version)}">${visual||'<span class="library-cover-empty">暂无封面</span>'}${libraryStatus(r.status)}<span class="library-cover-play">${studioIcon('play')}</span><span class="library-duration">${libraryDuration(r.shots)}</span></button><div class="library-card-info"><h3>${esc(r.name)} · ${esc(r.version)}</h3><p>来源任务：${esc(r.taskName)}</p><button class="library-view-button" data-library-preview="${esc(r.key)}">${libraryIcon('eye')} 查看</button></div></article>`;
}
assets=function(){
  const finished=assetTab==='finished',list=finished?libraryVisibleRecords():libraryVisibleImages();
  const scopedCount=finished?libraryRecords().filter(r=>!assetFolderScope||r.folderId===assetFolderScope).length:list.length;
  return `<main class="library-workspace"><header class="library-page-header"><h1>资产库</h1><div class="library-tabs" role="group" aria-label="资产类型"><button data-action="assetTab" data-tab="finished" aria-pressed="${finished}" class="${finished?'active':''}">成片库</button><button data-action="assetTab" data-tab="raw" aria-pressed="${!finished}" class="${!finished?'active':''}">原料素材</button></div></header><section class="library-scope"><div class="library-scope-heading">${uiIcon('assets')}<h2>${esc(assetScopeName())}</h2><span>共 ${scopedCount} ${finished?'个成片':'张图片'}</span></div><div class="library-filter-row" role="group" aria-label="${finished?'筛选成片状态':'筛选素材类型'}"><span>${finished?'状态：':'类型：'}</span>${(finished?['全部',...RESULT_LABELS]:['全部','人物','商品','场景']).map(x=>`<button ${finished?`data-action="filter" data-filter="${x}"`:`data-library-category="${x}"`} class="${(finished?assetFilter:assetRawCategory)===x?'active':''}" aria-pressed="${(finished?assetFilter:assetRawCategory)===x}">${x}</button>`).join('')}</div></section>${list.length?`<div class="${finished?'library-video-grid':'library-image-grid'}">${finished?list.map(libraryVideoCard).join(''):list.map(a=>`<article class="library-image-card"><button data-action="assetPreview" data-i="${esc(a.id)}" aria-label="查看${esc(a.name)}">${libraryImageVisual(a)}</button><h3>${esc(a.name)}</h3><p>${esc([...libraryImageFolders(a)].map(id=>state.folders.find(f=>f.id===id)?.name).filter(Boolean).join(' · ')||'共享素材')}</p></article>`).join('')}</div>`:`<div class="library-empty">${libraryIcon(finished?'film':'assets')}<h3>${finished?(assetFilter==='全部'?'该文件夹暂无成片':'没有“'+esc(assetFilter)+'”的成片'):'该文件夹暂无匹配图片'}</h3><p>${finished?'成片生成后会按来源任务的文件夹归属显示在这里。':'任务引用的图片沿用相同文件夹归属。'}</p>${finished&&assetFilter!=='全部'?'<button data-action="filter" data-filter="全部">查看全部状态</button>':''}</div>`}</main>`;
};
function previewLibraryRecord(key){
  const r=libraryRecords().find(r=>r.key===key);if(!r)return;
  viewerPlayback?.();
  modal(esc(r.name)+' · '+esc(r.version),`<div class="library-readonly-preview"><div class="library-preview-screen"><video id="sp-video" class="sp-modal-video" autoplay muted playsinline controls aria-label="成片只读预览"></video><p>来源任务：${esc(r.taskName)} · ${esc(state.folders.find(f=>f.id===r.folderId)?.name||'')}</p></div><section class="library-prompt-record"><div class="library-preview-record-head"><h3>生成提示词</h3><span>只读 · ${r.shots.length} 个分镜</span></div>${r.shots.map((s,i)=>`<details class="library-prompt-shot" ${i===0?'open':''}><summary>分镜 ${s.number||i+1}<span>${{edit:'视频编辑',aigc:'AIGC生成',keep:'使用原片'}[s.method]||'生成版本'} · ${s.duration||0} 秒</span></summary>${s.refs?.length?`<div class="library-prompt-references">${s.refs.map((id,n)=>{const a=state.assets.find(a=>a.id===id);return a?`<span>${libraryImageVisual(a,'mini')}@图片${n+1} · ${esc(a.name)}</span>`:''}).join('')}</div>`:''}<pre>${esc(s.method==='keep'?'使用原视频片段，未执行画面生成。':s.prompt||'此历史版本未保存提示词。')}</pre><button class="library-seek-button" data-library-seek="${i}">${studioIcon('play')} 预览此分镜</button></details>`).join('')||'<p>此历史成片未保存分镜记录。</p>'}</section></div>`,'<span class="small muted">仅查看视频与生成记录</span><button data-action="close">关闭</button>');
  viewerPlayback=startSimulation($('#sp-video'),r.shots);
}
document.addEventListener('click',e=>{
  const folder=e.target.closest('[data-library-folder]');if(folder){assetFolderScope=folder.dataset.libraryFolder||null;render();return;}
  const category=e.target.closest('[data-library-category]');if(category){assetRawCategory=category.dataset.libraryCategory;render();return;}
  const preview=e.target.closest('[data-library-preview]');if(preview){previewLibraryRecord(preview.dataset.libraryPreview);return;}
  const seek=e.target.closest('[data-library-seek]');if(seek)viewerPlayback?.seek(Number(seek.dataset.librarySeek));
});
document.addEventListener('input',e=>{if(!e.target.matches('[data-library-query]'))return;assetFolderQuery=e.target.value;const pos=e.target.selectionStart;render();const input=document.querySelector('[data-library-query]');input?.focus();if(input&&pos!==null)input.setSelectionRange(pos,pos)});
document.addEventListener('close',e=>{if(e.target.id==='dialog'){viewerPlayback?.();viewerPlayback=null}},true);
const assetWorkspaceRender=render;
render=function(){assetWorkspaceRender();const shell=document.querySelector('.shell');shell?.classList.toggle('library-shell',view!=='work');};
render();
