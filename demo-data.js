/* Explicit deterministic fixture: no network/model calls. */
const FAMILY_DEMO_BRIEF='AI人物年龄30左右，所有脚本内容不变，AI前贴换不同人物 不同吃饭的画面，视频里拿礼盒的人物换脸 场景也换，视频里单独出现礼盒特写直接用原视频，游戏画面用原视频';
const FAMILY_DEMO_ASSETS=[
 ['妈妈参考A',0,'30岁 · 低马尾 · 围裙','妈妈'],['妈妈参考B',1,'32岁 · 短发 · 绿色上衣','妈妈'],['女主播参考A',2,'30岁 · 黑长直 · 米白开衫','主播'],['女主播参考B',3,'30岁 · 齐肩发 · 蓝色上衣','主播'],['爸爸参考A',4,'32岁 · 短发 · 白衬衫','爸爸'],['男孩参考A',5,'10岁 · 短发 · 蓝白条纹T恤','男孩'],['女孩参考A',6,'10岁 · 粉色上衣 · 牛仔背心','女孩'],['橙色编程礼盒',7,'商品外形与橙色包装','商品'],['蓝色积木礼盒',8,'商品外形与蓝黄积木','商品'],['C++编程礼盒',9,'深蓝色包装 · 产品参照','商品'],['日式餐厨场景',10,'原木餐桌 · 家庭用餐','场景'],['旋转木马场景',11,'游乐园 · 金色旋转木马','场景']
].map(([name,tile,tags,role],i)=>({id:'family-image-'+i,name,tile,tags,role,type:'image',kind:i===5?1:0,source:'核桃编程 · 多人对话示例',url:'family-reference-sheet.png',builtin:true}));
const FAMILY_SPEECH=[
'妈妈：好小子，你今天都闯了三关了。\n男孩：妈你别打扰我，今天用核桃编程学的方法，把一道应用题拆的明明白白，我现在逻辑思维蹭蹭涨。\n妈妈：吃完饭再学。\n男孩：今天必须把所有关卡全打通，谁也别拦我。',
'家里有八九岁孩子的家长，一定要早点给孩子做规划。如果再让我陪孩子读一次小学，我一定不会再逼她上那么多补习班，而是专注让她做好一件事。',
'每天跟着核桃编程，培养专注力，锻炼逻辑思维。光是赠送的编程礼盒和积木礼盒，本身就不止这个价了。',
'蜗牛爬井，飞机大战，田忌赛马。趣味动画+剧情闯关的形式，让孩子边玩、边动手、边动脑。自己写程序、调代码，琢磨怎么让小程序运行起来，整个过程特练思维。',
'而且写代码需要一步一步想清楚，找问题时又格外细心。这套方法一旦用熟了，孩子做数学题自然懂得分步骤，做阅读题也学会抓重点。',
'对了，现在还升级成了双礼盒套装。4个实操主题：二维码词云、巧克力博弈、投资策略、神秘读心术。8件编程创作套装，2次家长规划，现在只要29元就能体验。29元，赶紧点链接来试试。'
];
const FAMILY_DESCRIPTIONS=[
'妈妈端菜与男孩对话，男孩一边操作电脑一边回应，餐桌上摆着饭菜。',
'女主播坐在客厅沙发上面对镜头介绍课程，桌上放着编程礼盒和积木礼盒。',
'女孩拼积木、礼盒实物特写，随后女主播在游乐园举着双礼盒介绍。',
'课程与游戏界面依次展示，随后男孩在书桌前写代码调试程序。',
'同一女主播先在旋转木马前举礼盒讲解，随后在晚霞城市天台继续介绍。',
'女主播举双礼盒、四个实操界面、女主播结尾介绍套餐，原片含29元价格标识。'
];
const FAMILY_VISUAL=[
'竖屏1080×1920，AI前贴重绘。使用 @妈妈参考A 作为妈妈身份参照（约30岁，低马尾、米白围裙、浅灰针织衫），使用 @男孩参考A 作为男孩身份参照（约10岁，短发、蓝白条纹T恤）。成人年龄约30岁，孩子保持原脚本年龄，不把孩子改成30岁。妈妈端着清蒸鱼笑着和男孩说话；男孩坐在餐桌前操作笔记本电脑学编程。场景参考 @日式餐厨场景：浅木色餐桌、白瓷砖厨房、陶瓷餐具与窗外绿意，自然光洒入。餐桌摆清蒸鱼、糖醋排骨、西兰花、紫菜蛋花汤与白米饭。男孩的发型、面部、服饰与分镜4保持一致。',
'竖屏1080×1920，人物换脸并更换场景。使用 @女主播参考A 确定女主播的面部、发型与身份：约30岁黑长直，米白色针织开衫内搭白T、白色长裤。主播坐在阳光书房客厅的米白布艺沙发上亲切介绍课程，背景白色通顶书架、书籍与绿植；原木小圆桌放 @橙色编程礼盒 和 @蓝色积木礼盒。商品图只约束包装、颜色、外形，不作为人物身份参考。主播形象与分镜3③、5、6一致。',
'竖屏1080×1920，三段结构。①0–3秒女孩在白色桌前拼蓝黄积木，直接使用原视频，不重绘。②3–5秒编程礼盒与积木礼盒实物特写，直接使用原视频，不重绘。③5–8秒更换主播和场景：使用 @女主播参考A，约30岁黑长直、米白开衫，与分镜2完全一致；站在 @旋转木马场景 的金色旋转木马前，双手举 @橙色编程礼盒 和 @蓝色积木礼盒 笑着介绍。仅③使用人物和商品引用；①②无需引用图重做。',
'竖屏1080×1920，两段结构。①0–6秒蜗牛爬井、飞机大战、田忌赛马课程界面依次展示，直接使用原视频，画面内容与UI不变。②6–10秒重绘男孩学习画面：使用 @男孩参考A，身份、发型、蓝白条纹T恤与分镜1完全一致；坐在白色书桌前操作笔记本电脑写代码、调试程序，暖光台灯，神情专注。@男孩参考A 仅作用于②，不修改①游戏界面。',
'竖屏1080×1920，两段人物替换与场景更换。①0–6秒使用 @女主播参考A，与分镜2主播身份、米白开衫一致，站在 @旋转木马场景 前，双手举 @橙色编程礼盒 和 @蓝色积木礼盒，讲解写代码对思维的锻炼。②6–11秒同一主播站在城市天台栏杆旁，背景晚霞高楼，手举 @C++编程礼盒 和 @蓝色积木礼盒 继续说话。两段人物身份与服装保持连续，商品图分别约束对应礼盒外观。',
'竖屏1080×1920，三段结构。①0–3秒使用 @女主播参考A，约30岁黑长直、米白开衫，与分镜2、5一致，位于分镜5②的城市天台，举 @橙色编程礼盒 和 @蓝色积木礼盒 介绍套餐。②3–8秒二维码词云、巧克力博弈、投资策略、神秘读心术四个实操界面直接使用原视频，不重绘。③8–12秒切回同一主播举礼盒，人物身份和天台连续。保留原视频的橙黄色29元价格UI，不重新生成价格字样；如果人物替换影响价格UI，需要单独核对该段，不能承诺自动修复。'
];
const FAMILY_REFS=[[0,5,10],[2,7,8],[2,7,8,11],[5],[2,7,8,9,11],[2,7,8]];
const FAMILY_PARTS=[
 [{range:'全镜',mode:'修改画面',text:'妈妈＋男孩 · 用餐场景'}],
 [{range:'全镜',mode:'修改画面',text:'主播换脸 · 客厅换场景'}],
 [{range:'0–3秒',mode:'原片保留',text:'女孩拼积木'},{range:'3–5秒',mode:'原片保留',text:'礼盒特写'},{range:'5–8秒',mode:'修改画面',text:'主播换脸 · 旋转木马'}],
 [{range:'0–6秒',mode:'原片保留',text:'课程与游戏画面'},{range:'6–10秒',mode:'修改画面',text:'男孩学习 · 与分镜1一致'}],
 [{range:'0–6秒',mode:'修改画面',text:'主播 · 旋转木马'},{range:'6–11秒',mode:'修改画面',text:'同一主播 · 城市天台'}],
 [{range:'0–3秒',mode:'修改画面',text:'主播 · 双礼盒'},{range:'3–8秒',mode:'原片保留',text:'四个实操界面'},{range:'8–12秒',mode:'修改画面',text:'主播 · 保留原价格UI'}]
];
FAMILY_DEMO_ASSETS[9]={...FAMILY_DEMO_ASSETS[9],name:'编程商品礼盒',url:'programming-gift.png',tile:undefined,tags:'用户提供 · 语言进化论C++ · 包装外观与字样'};
FAMILY_DEMO_ASSETS.push({id:'family-game-original',name:'原片游戏画面',type:'image',url:'game-original.png',tags:'用户提供 · 原片保留 · 不重绘',role:'原片记录',source:'核桃编程 · 多人对话示例',builtin:true});
FAMILY_VISUAL[4]=FAMILY_VISUAL[4].replace('@C++编程礼盒','@编程商品礼盒');
FAMILY_REFS[5]=[2,7,8,9];
FAMILY_VISUAL[5]=FAMILY_VISUAL[5].replace('双礼盒套装介绍套餐','双礼盒套装介绍套餐')+' 礼盒包装如包含C++款，严格参考 @编程商品礼盒 的包装外形、图案与文字，不使用通用盒子替代。';
FAMILY_VISUAL[3]+=' 游戏截图“原片游戏画面”仅用于标记保留内容，不输入AI重绘，不生成或改动界面UI。';
const FAMILY_CUT_SECONDS={1:6,2:6,3:6,4:12,5:4,6:5,7:5,8:4,9:3,10:2,11:3,12:2,13:2,14:2,15:4,16:3,17:3,18:2,19:3,20:3,21:2,22:3,23:4};
function seedFamilyTask(){const t=makeTask('family-demo','核桃编程 · 多人对话',Date.now());t.demoFamily=true;t.fixtureVersion=4;t.stage='需求待填写';t.brief='';t.plans=['成人约30岁；妈妈A＋主播A＋男孩A；脚本不变；游戏与礼盒特写沿用原片。'];t.assets=FAMILY_DEMO_ASSETS.map(a=>a.id);const groups=[[1,2,3,4],[5,6,7,8],[9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23]];t.shots=groups.map((cuts,i)=>({id:i,description:FAMILY_DESCRIPTIONS[i],person:['妈妈、男孩（双人对话）','女主播','小女孩、女主播','男孩；游戏角色','女主播（跨镜一致）','女主播；游戏界面'][i],scene:['原片餐厨空间','原片客厅','积木桌面、礼盒特写、游乐园','游戏界面、书桌','旋转木马、城市天台','天台、游戏界面'][i],speech:FAMILY_SPEECH[i],caption:i===0?'口播字幕；底部试学价格、情节演绎说明':'卖点字幕；家庭教育、赠品说明'+(i===5?'；29元价格标识':''),cuts,demoCoverKey:['meal','host-living','product-original','games-original','host-carousel','host-rooftop'][i],prompt:'',ai:'',manual:false,refs:[],method:'pending',parts:FAMILY_PARTS[i],open:false,candidates:[],approved:false,thumb:i===0?'family-image-10':i===3?'family-game-original':'family-image-2'}));return t}
function parseFamilyDemo(){const t=task();if(!t.brief.trim())return toast('请输入模糊需求，或填入示例');if(!/脚本|礼盒|吃饭|游戏|人物/.test(t.brief))return toast('此Demo使用示例需求模拟解析');if(!t.singleMethodParsed){t.shots=SINGLE_METHOD_SPECS.map((spec,i)=>singleMethodShot(spec,i));t.singleMethodParsed=true}else{t.shots.forEach(s=>{if(!s.manual&&!s.specKey){s.method='edit';s.prompt=promptFor(s)}if(!s.manual&&s.specKey){const spec=SINGLE_METHOD_SPECS.find(x=>x.key===s.specKey);s.method=spec.method;s.refs=spec.refs.map(n=>FAMILY_DEMO_ASSETS[n].id);s.prompt=singleMethodPrompt(s)}})}t.parsed=true;t.mode='keep';t.change=['分镜1、2、5、6：视频编辑，更换指定人物或场景'];t.keep=['分镜3、4：整个分镜使用原片','全部六个分镜的原脚本、台词顺序和音轨不变'];t.stage='需求已解析 · 生成方式与提示词待确认';touch();render();toast('已解析六个分镜：2镜使用原片，4镜视频编辑（模拟）')}
function assetVisual(a,cls='asset-photo'){if(!a)return '';return typeof a.tile==='number'?`<span role="img" aria-label="${esc(a.name)}" class="${cls} atlas" style="background-image:url('${esc(a.url)}');background-position:${a.tile%4*100/3}% ${[0,48.5,100][Math.floor(a.tile/4)]}%"></span>`:`<img class="${cls}" src="${esc(a.url)}" alt="${esc(a.name)}">`}
// Scene covers are presentation assets. They never become @图片 references or results.
const FAMILY_SCENE_KEYS=['meal','host-living','product-original','games-original','host-carousel','host-rooftop'];
const FAMILY_SCENE_TILES={meal:0,'host-living':1,'host-carousel':2,'host-rooftop':3};
function shotCoverAsset(s,t=task()){
  const original=state.assets.find(a=>a.id===s?.thumb);
  if(!s)return original;
  if(s.independent)return s.sourcePoster?{url:s.sourcePoster,name:s.description||'独立视频'}:null;
  const key=s.demoCoverKey||(t?.demoFamily?FAMILY_SCENE_KEYS[s.sourceIndex??FAMILY_DESCRIPTIONS.indexOf(s.description)]:null);
  if(key==='product-original')return state.assets.find(a=>a.id==='family-image-9')||original;
  if(key==='games-original')return state.assets.find(a=>a.id==='family-game-original')||original;
  const tile=FAMILY_SCENE_TILES[key];
  return tile===undefined?original:{url:'family-scene-covers-v1.png',tile,gridColumns:2,gridRows:2,name:s.description||'分镜场景示意'};
}
function shotVisual(s,cls='shot-photo',t=task()){
  const cover=shotCoverAsset(s,t);
  if(!cover)return '';
  return cover.gridColumns?`<span role="img" aria-label="${esc(cover.name)}" class="${cls} scene-cover" style="display:block;background-image:url('${esc(cover.url)}');background-size:200% 200%;background-position:${cover.tile%2*100}% ${Math.floor(cover.tile/2)*100}%"></span>`:assetVisual(cover,cls);
}
function partRows(s){return `<div class="part-rows">${(s.parts||[]).map(p=>`<span class="part-item ${p.mode==='原片保留'?'keep-part':''}"><b>${p.range}</b><span class="badge ${p.mode==='原片保留'?'green':'blue'}">${p.mode}</span>${p.text}${p.text.includes('游戏')||p.text.includes('课程')||p.text.includes('实操')?`<button class="link small" data-action="assetPreview" data-i="family-game-original">查看原画面</button>`:''}</span>`).join('')}</div>`}

// Seedance guide, fetched 2026-10-09, revision 522. Slots are LOCAL to each shot.
const SEEDANCE_ROLE_LINES={
0:'<妈妈>对应@图片{n}，采用五官、低马尾和米白围裙、浅灰针织衫。成人设定约30岁，不采用参考图的厨房背景。',
1:'<妈妈>对应@图片{n}，采用五官、短发和绿色上衣，不采用图片背景。',
2:'<主播>对应@图片{n}，采用五官、黑长直和米白针织开衫、白T。成人约30岁，不采用图片背景。',
3:'<主播>对应@图片{n}，采用五官、齐肩发和蓝色上衣，不采用图片背景。',
4:'<爸爸>对应@图片{n}，采用五官、短发和白衬衫，不采用图片背景。',
5:'<男孩>对应@图片{n}，采用五官、黑色短发和蓝白条纹T恤。儿童约10岁，不采用图片背景。',
6:'<女孩>对应@图片{n}，采用五官、发型、粉色上衣和牛仔背心，不采用图片背景。',
7:'<橙色编程礼盒>对应@图片{n}，仅采用包装结构、橙色、材质和图案，不采用背景。礼盒由<主播>持有或放在原片对应桌面位置。',
8:'<蓝色积木礼盒>对应@图片{n}，仅采用包装结构、蓝色与积木外观，不采用背景。不因为参考图内含积木而额外增加桌面道具。',
9:'<编程商品礼盒>对应@图片{n}，仅采用“语言进化论C++”礼盒的包装外形、配色、图案与现有字样；不采用参考图中的手、衣服、人物或背景，不新增商品数量。',
10:'<餐厨空间>参考@图片{n}，采用原木餐桌、厨房材质、自然光与空间氛围；餐桌和人物站位沿用@视频1，不照搬图片机位或重新摆放人物。',
11:'<旋转木马场景>参考@图片{n}，采用金色旋转木马、游乐园建筑和光线，不采用参考图构图；<主播>保持@视频1中的位置、大小和遮挡关系。'
};
const SEEDANCE_EDIT_GOALS=[
'编辑@视频1，将原妈妈和男孩替换为下方绑定的人物，并将用餐环境换成原木日式餐厨空间。全镜只有一名<妈妈>和一名<男孩>；将用餐画面的菜品改为清蒸鱼、糖醋排骨、西兰花、紫菜蛋花汤和米饭，餐桌与餐具接触关系保持自然。保持原片两人的对话、动作与镜头节奏。',
'编辑@视频1，仅替换<主播>的身份、服装和身后的客厅环境；保留她与两只礼盒的动作、握持关系和原脚本。',
'编辑@视频1，仅在5–8秒替换<主播>身份、服装和背景。0–3秒女孩拼积木、3–5秒礼盒特写直接使用原片，不调用图片重绘这些段落。',
'编辑@视频1，仅在6–10秒替换<男孩>及书桌环境。0–6秒的蜗牛爬井、飞机大战、田忌赛马画面直接使用原片，不重绘UI或游戏角色。',
'编辑@视频1，在0–6秒和6–11秒使用同一<主播>替换原主播；第一段背景换成金色旋转木马，第二段换成晚霞城市天台。保持原段落顺序及礼盒交接关系。',
'编辑@视频1，仅在0–3秒和8–12秒替换<主播>身份与天台背景；3–8秒实操界面直接使用原片。结尾原29元价格UI保留，不让图片覆盖价格区域。'
];
const SEEDANCE_STAGE_LINES=[
'继承@视频1中<妈妈>端菜、与<男孩>说话的动作，及<男孩>操作电脑、回应的动作与停顿；不要额外新增抢菜、起身或切镜事件。<妈妈>台词仍由妈妈说，<男孩>台词仍由男孩说，身份、服装和台词不交换。菜品仅替换原片对应餐盘内容，餐盘数量、位置与手部遮挡关系沿用原片；主体大小与电脑位置保持连续。结束时保持原片最后的坐姿、道具归属和视线。',
'<主播>坐在米白沙发上面对镜头，保持@视频1原始表情、手势、镜头运动和时序；背景改为白色通顶书架、绿植与自然光。两只礼盒沿用原片桌面位置，不变成主播的服装图案，不新增第三只礼盒。结束时主播、桌面与礼盒维持原片关系。',
'0–3秒：原片女孩拼积木不变，沿用原动作和原声音。3–5秒：原片两只礼盒实物特写不变，不替换包装、不增加商品。5–8秒：调用<主播>、<橙色编程礼盒>、<蓝色积木礼盒>和<旋转木马场景>；主播双手举礼盒并沿用原介绍动作，人物身份与分镜2一致。结尾两只礼盒仍由同一主播持有，衣服和左右手归属不交换。',
'0–6秒：按@视频1顺序展示课程及游戏界面，原操作、角色、文字、机位、切换节奏全部保留；用户提供的游戏截图只是保留内容记录，不作为重绘图片输入。6–10秒：调用<男孩>，坐在白色书桌前操作笔记本电脑，旁边暖光台灯。身份、发型、服装使用与分镜1相同的“男孩参考A”资产；动作、视线与键盘接触位置继承原片。结束时男孩仍坐在桌前，电脑与双手保持原片结束状态。',
'0–6秒：调用<主播>、<橙色编程礼盒>、<蓝色积木礼盒>及<旋转木马场景>，主播举礼盒，沿用原片介绍动作。6–11秒：同一<主播>切至城市天台栏杆旁，晚霞高楼在主体后方，商品切为<编程商品礼盒>与<蓝色积木礼盒>；切换时点、拿取、遮挡和持有时长继承@视频1，不同时堆出全部三款礼盒。两段主播面部、发型、服装与分镜2保持一致。',
'0–3秒：同一<主播>在城市天台介绍双礼盒，身份、服装和环境承接分镜5第二段；商品按原片对应时段选用绑定的礼盒图片，只出现原片实际持有的两只。3–8秒：二维码词云、巧克力博弈、投资策略、神秘读心术沿用原片界面和操作，不重绘。8–12秒：切回同一主播，握持动作继承原片，商品不交换。原29元UI的位置、出现时点和现有字样保持原样，不新增价格或营销卖点。'
];
function seedanceBindings(index,ids){const list=ids||FAMILY_REFS[index].map(n=>FAMILY_DEMO_ASSETS[n].id);return list.map((id,j)=>{const a=FAMILY_DEMO_ASSETS.find(a=>a.id===id)||state.assets.find(a=>a.id===id);return {id,slot:j+1,name:a?.name||'图片',role:a?.role||'参考',assetIndex:FAMILY_DEMO_ASSETS.findIndex(a=>a.id===id)}})}
function familyPrompt(index){const bindings=seedanceBindings(index);const group=(role)=>bindings.filter(b=>b.role===role).map(b=>(SEEDANCE_ROLE_LINES[b.assetIndex]||'@图片{n}仅参考指定主体外观，不采用无关背景。').replaceAll('{n}',b.slot)).join('\n');const dialogue=index===0?FAMILY_SPEECH[index].split('\n').map(line=>{const pos=line.indexOf('：');return '<'+line.slice(0,pos)+'>沿用原片声音说：{'+line.slice(pos+1)+'}'}).join('\n'):'<主播>原片旁白／对白：{'+FAMILY_SPEECH[index]+'}';return `【编辑目标】\n${SEEDANCE_EDIT_GOALS[index]}\n\n【原视频职责】\n@视频1是当前分镜的唯一编辑母版，负责动作、机位、镜头运动、构图、事件顺序、人物和道具的出现／遮挡／离开时点，以及原对白、旁白、环境声和音乐。只改下面明确指定的对象与时间段。画幅与时长沿用母版。\n\n【人物映射】\n${group('妈妈')}\n${group('男孩')}\n${group('主播')}\n${group('爸爸')}\n${group('女孩')}\n\n【商品与道具】\n${group('商品')||'沿用@视频1中的道具，不新增或改动商品。'}\n\n【场景参考】\n${group('场景')||'目标场景由下方文字指定；人物站位、构图和运动承接@视频1，不引入人物参考图的背景。'}\n\n【编辑范围与连续关系】\n${SEEDANCE_STAGE_LINES[index]}\n\n【声音与保持内容】\n脚本、说话人归属和台词顺序不变，沿用@视频1音轨；台词只作核对，不另配音、不重新生成BGM。\n${dialogue}\n除上方明确修改对象和区域外，保持@视频1原动作、镜头切换、道具数量、声音和事件顺序。原有字幕、底部说明与价格UI沿用原片，不新增字幕样式。`.replace(/\n{3,}/g,'\n\n')}

// One card is one execution unit. Incompatible methods become separate cards.
const SINGLE_METHOD_SPECS=[
{key:'meal',source:0,cuts:[1,2,3,4],method:'edit',refs:[0,5,10],description:FAMILY_DESCRIPTIONS[0],scene:'日式餐厨空间',speech:FAMILY_SPEECH[0]},
{key:'host-living',source:1,cuts:[5,6,7,8],method:'edit',refs:[2,7,8],description:FAMILY_DESCRIPTIONS[1],scene:'阳光书房客厅',speech:FAMILY_SPEECH[1]},
{key:'product-original',source:2,cuts:[9,10,11],method:'keep',refs:[],description:FAMILY_DESCRIPTIONS[2],scene:'原片积木桌面、礼盒特写、主播展示',speech:FAMILY_SPEECH[2],person:'小女孩、女主播',thumb:'family-image-9'},
{key:'games-original',source:3,cuts:[12,13,14,15],method:'keep',refs:[],description:FAMILY_DESCRIPTIONS[3],scene:'原片游戏界面、男孩书桌',speech:FAMILY_SPEECH[3],person:'男孩；游戏角色',thumb:'family-game-original'},
{key:'host-two-scenes',source:4,cuts:[16,17,18,19],method:'edit',refs:[2,7,8,9,11],description:FAMILY_DESCRIPTIONS[4],scene:'旋转木马、晚霞天台',speech:FAMILY_SPEECH[4]},
{key:'host-package',source:5,cuts:[20,21,22,23],method:'edit',refs:[2,7,8,9],description:FAMILY_DESCRIPTIONS[5],scene:'城市天台；实操界面沿用原视频',speech:FAMILY_SPEECH[5]}
];
function singleMethodShot(spec,i){const base=seedFamilyTask().shots[spec.source];const s={...base,id:i,sourceIndex:spec.source,specKey:spec.key,cuts:[...spec.cuts],method:spec.method,parts:[],description:spec.description,scene:spec.scene,speech:spec.speech,refs:spec.refs.map(n=>FAMILY_DEMO_ASSETS[n].id),manual:false,open:false,candidates:[],thumb:spec.method==='keep'?(spec.key==='games'||spec.key==='practice'?'family-game-original':spec.key==='gift-closeup'?'family-image-9':'family-image-6'):spec.key==='boy-coding'?'family-image-5':base.thumb};s.person=spec.key==='meal'?'妈妈、男孩（双人对话）':spec.key==='blocks'?'小女孩':spec.key==='gift-closeup'?'无人物，商品特写':spec.key==='games'||spec.key==='practice'?'游戏角色／界面':spec.key==='boy-coding'?'男孩':'女主播';s.person=spec.person||s.person;s.thumb=spec.thumb||s.thumb;s.prompt=singleMethodPrompt(s);return s}
function singleMethodPrompt(s){if(s.method==='keep')return '';const spec=SINGLE_METHOD_SPECS.find(x=>x.key===s.specKey);const bindings=s.refs.map((id,i)=>{const n=FAMILY_DEMO_ASSETS.findIndex(a=>a.id===id);return (SEEDANCE_ROLE_LINES[n]||'@图片{n}作为主体外观参考。').replaceAll('{n}',i+1).replaceAll('@视频1',s.method==='aigc'?'上述画面设定':'@视频1')}).join('\n');const objective=s.method==='aigc'?'AIGC生成完整分镜：'+s.description.replace(/，?使用原片。?/g,'。')+'画幅9:16。依据图片与文字生成新画面，不使用视频编辑母版。':'视频编辑整个分镜：@视频1是当前分镜唯一编辑母版，继承原动作、构图、镜头运动与事件顺序。'+s.description.replace(/，?使用原片。?/g,'。')+'本卡所有片段统一执行视频编辑。';return `【生成方式与目标】\n${objective}\n\n【图片与主体绑定】\n${bindings}\n\n【画面要求】\n${s.scene}。${s.specKey==='meal'?'妈妈端清蒸鱼与男孩说话；桌上摆糖醋排骨、西兰花、紫菜蛋花汤和米饭。妈妈约30岁，男孩约10岁，按台词轮流说话，不交换声音或身份。':''}${s.specKey==='host-package'?'仅替换开头与结尾举礼盒的主播和背景；中间四个实操界面、操作过程及结尾29元UI沿用@视频1，不重绘游戏内容。整个分镜作为一次视频编辑提交。':''}${s.specKey==='host-two-scenes'?'前段旋转木马，后段晚霞天台；两段全部使用视频编辑，同一主播的面部、发型和服装保持连续。':''}跨镜复用相同角色图片；商品图仅约束包装，不作为人物身份。\n\n【脚本与声音】\n沿用该分镜对应的原脚本与音轨，台词顺序不变：{${s.speech}}\n原有字幕和价格信息保持，不新增商品卖点。${s.method==='edit'?'未指定修改的区域、动作和声音继承@视频1。':'保持双人对话的说话顺序和唇形同步。'}`}
