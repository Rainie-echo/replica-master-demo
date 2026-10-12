/* A compact reference shelf. Image slots in prompts remain local to each shot. */
let studioMaterialTaskId=null;
let studioMaterialFilter='全部';
const STUDIO_MATERIAL_FILTERS=['全部','人物','商品','场景'];

function studioMaterialCategory(asset){
  if(asset.role==='商品')return '商品';
  if(asset.role==='场景')return '场景';
  if(['妈妈','爸爸','男孩','女孩','主播','人物'].includes(asset.role))return '人物';
  return '';
}

taskMaterials=function(t){
  if(!t||experienceLanding||t.gated&&!t.sourceParsed)return '';
  if(studioMaterialTaskId!==t.id){studioMaterialTaskId=t.id;studioMaterialFilter='全部'}
  const images=refs(t).filter(a=>a.type==='image'&&a.role!=='原片记录');
  const visible=images.filter(a=>studioMaterialFilter==='全部'||studioMaterialCategory(a)===studioMaterialFilter);
  return `<section class="task-materials studio-materials ${materialsOpen?'open':''}" aria-label="任务内素材库">
    <div class="studio-material-head">
      <div class="studio-material-title"><svg aria-hidden="true" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="3"/><circle cx="7" cy="7" r="1.3"/><path d="m4 14 4-4 3 3 2-2 3 3"/></svg><h2>任务素材</h2><span class="studio-material-count">${images.length}</span></div>
      <button class="material-close link small" data-action="toggleMaterials" aria-label="收起任务素材">×</button>
    </div>
    <div class="studio-material-tools"><button class="studio-material-add" data-action="materials" data-i="-1"><span aria-hidden="true">＋</span> 添加参考图片</button></div>
    <div class="studio-material-filters" role="group" aria-label="筛选参考素材">${STUDIO_MATERIAL_FILTERS.map(filter=>`<button data-studio-material="${filter}" aria-pressed="${studioMaterialFilter===filter}" class="${studioMaterialFilter===filter?'active':''}">${filter}</button>`).join('')}</div>
    <div class="studio-material-scroll">
      <div class="material-tiles studio-material-grid">${visible.map(a=>`<div class="material-tile studio-material-tile">
        <div class="studio-material-picture"><button class="material-image" draggable="true" data-drag-asset="${esc(a.id)}" data-action="assetPreview" data-i="${esc(a.id)}" data-sp-image-hover="true" aria-label="查看${esc(a.name)}">${assetVisual(a)}</button><button class="material-remove" data-action="unref" data-id="${esc(a.id)}" aria-label="移除${esc(a.name)}">×</button></div>
        <span class="studio-material-name" title="${esc(a.name)}">${esc(a.name)}</span>
      </div>`).join('')}</div>
      ${!visible.length?`<div class="studio-material-empty"><p>${images.length?'暂无'+studioMaterialFilter+'参考图':'添加图片，用来指定人物或商品外观'}</p>${images.length?'<button class="link small" data-studio-material="全部">查看全部图片</button>':'<button class="link small" data-action="materials" data-i="-1">添加参考图片</button>'}</div>`:''}
    </div>
    <div class="studio-material-hint"><span class="studio-material-at" aria-hidden="true">@</span><p>拖入分镜卡片即可引用图片<br><span>提示词 @图片编号 悬停看大图</span></p></div>
  </section>`;
};

document.addEventListener('click',e=>{
  const button=e.target.closest('[data-studio-material]');
  if(!button||!STUDIO_MATERIAL_FILTERS.includes(button.dataset.studioMaterial))return;
  studioMaterialFilter=button.dataset.studioMaterial;
  render();
});
