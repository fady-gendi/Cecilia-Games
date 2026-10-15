(function(){'use strict';const W=CeciliaWallet;
function ensure(){W.importCoins('math',(state.solved||0)*10,!!state.walletV);state.walletV=1}
function refresh(){document.getElementById('stats').textContent='⭐ '+totalStars()+' · 🪙 '+W.balance()}
stats=refresh;
const oldAnswer=answer;answer=function(v,el){ensure();const was=answered;if(q&&!q.walletId)q.walletId='math:answer:'+W.uid();oldAnswer(v,el);if(!was&&answered){const n=10+(!tries&&!helped?5:0);W.award(n,'math','Maths answer',q.walletId);document.getElementById('message').textContent+=' +'+n+' 🪙';persist()}refresh()};
const oldFinish=finish;finish=function(){ensure();const id=run.id,old=state.best[id]||0,mode=run.mode,perfect=run.clean===8;oldFinish();if(mode==='level'&&!old&&state.best[id])W.award(30+(perfect?20:0),'math','Level completed','math:level:'+id);refresh()};
const oldPersist=persist;persist=function(){ensure();oldPersist()};
const oldLoad=cloudLoadMath;cloudLoadMath=async function(manual){await oldLoad(manual);ensure();localMath();refresh()};
W.onChange(refresh);ensure();localMath();
})();
