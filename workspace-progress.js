/* Read-only progress derived from the same shot sources used for composition. */
function workspaceProgress(t) {
  const shots=t?.shots||[], view={...t,clipVersions:t?.clipVersions||[]};
  const batchResults=(t?.results||[]).filter(r=>r.workflowBatch);
  const plans=t?.batchPlans||[];
  const batch={
    total:batchResults.length,
    review:batchResults.filter(r=>['待预览','待选用'].includes(r.status)).length,
    selected:batchResults.filter(r=>r.status==='已选用').length,
    modify:batchResults.filter(r=>r.status==='需修改').length,
    discarded:batchResults.filter(r=>r.status==='已弃用').length,
    busy:plans.filter(p=>p.running||p.status==='生成中').length,
    failed:plans.filter(p=>p.status==='生成失败').length
  };
  const progress={total:shots.length,ready:0,pending:0,choose:0,busy:0,firstMissing:null,promptDraftCount:0,
    stage:'暂无分镜',detail:'',canCompose:false,composing:false,sampleMatching:false,batch,batchDetail:''};
  const sources=[];
  const blocked=t?.gated&&!t.sourceParsed;
  for(const s of shots) {
    const pick=resolveShot(view,s), versions=matchingVersions(view,s);
    const busy=versions.some(v=>v.status==='生成中');
    const candidates=versions.some(v=>['待预览','待选用','已选用'].includes(v.status));
    if(busy)progress.busy++;
    const eligible=!blocked&&!!t?.parsed;
    const ready=eligible&&(pick.source||pick.version);
    if(ready) {
      progress.ready++;
      if(pick.version&&(pick.version.prompt!==s.prompt||JSON.stringify(pick.version.refs||[])!==JSON.stringify(s.refs||[])))progress.promptDraftCount++;
    } else {
      const reason=blocked?'先解析原视频':!t?.parsed?'先解析需求':busy?'生成中':candidates?'待选用':'待生成';
      if(!progress.firstMissing)progress.firstMissing={uid:s.uid,reason};
      if(eligible&&!busy) { if(candidates)progress.choose++;else progress.pending++; }
    }
    sources.push([s.uid,ready?(pick.source?'source':pick.version.id):null,s.cuts,s.method,...(s.independent?[s.sourceAssetId||null]:[])]);
  }
  progress.canCompose=!!t?.parsed&&!blocked&&progress.total>0&&progress.ready===progress.total;
  const sample=t?.samples?.at(-1), template=t?.templates?.at(-1);
  const fingerprint=JSON.stringify(sources);
  progress.composing=(t?.samples||[]).some(s=>s.status==='组装中');
  progress.sampleMatching=progress.canCompose&&!!sample&&sample.fingerprint===fingerprint;
  progress.detail=progress.total?`已确定 ${progress.ready}/${progress.total} 镜`:'';
  if(progress.busy)progress.detail+=`${progress.detail?' · ':''}生成中 ${progress.busy} 镜`;
  if(blocked) {
    progress.stage=t.sourceAnalysing?'原视频解析中':t.sourceParseError?'原视频解析未完成':t.videoImported?'准备自动解析':'待导入视频';
    progress.detail='';
  } else if(t?.running) {
    progress.stage='需求解析中';
  } else if(t?.requirementDirty) {
    progress.stage='需求待重新解析';
  } else if(!t?.parsed) {
    progress.stage=t?.brief?.trim()?'需求待解析':'需求待填写';
  } else if(!progress.total) {
    progress.stage='暂无分镜';
  } else if(progress.composing) {
    progress.stage='成片组合中';
  } else if(!progress.canCompose) {
    progress.stage=progress.busy?'分镜生成中':progress.pending?'分镜待生成':'分镜待选用';
  } else if(progress.sampleMatching&&sample.fixed&&template?.sampleId===sample.id) {
    progress.stage=`模板 v${template.number} 已固定`;
  } else if(progress.sampleMatching&&sample.status==='待预览') {
    progress.stage='成片待确认';
  } else {
    progress.stage='可组合成片';
  }
  if(t?.phase==='batch'&&template&&!blocked) {
    if(t.batchRunning||batch.busy)progress.stage='批量生成中';
    else if(batch.failed)progress.stage='批量生成失败';
    else if(batch.modify)progress.stage='批量成片需修改';
    else if(batch.review)progress.stage='批量成片待审核';
    else if(batch.total&&batch.selected+batch.discarded===batch.total)progress.stage='批量成片已审核';
    else if(plans.length)progress.stage='批量方案待确认';
    else progress.stage=`模板 v${template.number} 已固定`;
    progress.batchDetail=`批量成片 ${batch.total} 条`;
    if(batch.review)progress.batchDetail+=` · 待审核 ${batch.review}`;
    if(batch.modify)progress.batchDetail+=` · 需修改 ${batch.modify}`;
    if(batch.selected)progress.batchDetail+=` · 已选用 ${batch.selected}`;
    if(batch.busy)progress.batchDetail+=` · 生成中 ${batch.busy}`;
    if(batch.failed)progress.batchDetail+=` · 失败 ${batch.failed}`;
  }
  return progress;
}
