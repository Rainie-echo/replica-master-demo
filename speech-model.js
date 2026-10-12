/* Pure speech rules shared by templates, batch plans and repairs. */
function readSpeechVariants(text){
 const result=[],pattern=/(?:^|\n)\s*(?:口播(?:词)?\s*)?(\d+)\s*[、：:.]\s*([\s\S]*?)(?=\n\s*(?:口播(?:词)?\s*)?\d+\s*[、：:.]|$)/g;
 for(const m of String(text).matchAll(pattern)){if(m[2].trim())result.push({id:'speech-'+m[1],label:'口播'+m[1],text:m[2].trim()});}
 return result;
}
function distributeSpeech(text,count){
 const weights=Array.isArray(count)?count:Array.from({length:count},()=>1);count=weights.length;const sum=weights.reduce((a,b)=>a+b,0)||count,targets=weights.map((_,i)=>weights.slice(0,i+1).reduce((a,b)=>a+b,0)/sum);const sentences=String(text).match(/[^，。！？!?；;]+[，。！？!?；;]*|[，。！？!?；;]+/g)||[],out=Array.from({length:count},()=>''),total=text.length;let at=0,used=0;
 for(const sentence of sentences){if(at<count-1&&out[at]&&used>=total*targets[at])at++;out[at]+=sentence;used+=sentence.length;}
 return out;
}
function estimateSpeechFit(text,seconds){
 const normal=String(text||'').replace(/1v1/gi,'一对一').replace(/10/g,'十').replace(/do/gi,'做').replace(/\d/g,'一');
 const units=(normal.match(/[\u4e00-\u9fffA-Za-z]/g)||[]).length,pause=(normal.match(/[，、]/g)||[]).length*.12+(normal.match(/[。！？!?；;]/g)||[]).length*.25;
 const minSeconds=units/4.5+pause,maxSeconds=units/3.5+pause;
 return {status:!seconds?'unknown':minSeconds>seconds*1.1?'long':maxSeconds<seconds*.65?'short':'normal',minSeconds,maxSeconds};
}
function readShotSpeech(prompt){const matches=[...String(prompt).matchAll(/【本镜台词】\n([\s\S]*?)(?=\n【|$)/g)];return {text:matches.length===1?matches[0][1].trim():null,ambiguous:matches.length!==1};}
function setSpeechPrompt(prompt,text){
 let base=String(prompt||'').replace(/(?:\n|^)【(?:本镜台词|字幕文字|音轨处理|本镜口播覆盖)】[^\n]*\n?[\s\S]*?(?=\n【|$)/g,'');
 return base+'\n【本镜台词】\n'+text+'\n【字幕文字】\n'+text+'\n【音轨处理】\n替换原台词与对应字幕；无人物讲话的画面使用画外音，人物讲话时口型同步。保留未指定修改的音乐与音效。';
}
