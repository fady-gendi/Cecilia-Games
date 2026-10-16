/* Shared wallet adapter for the three language games. */
(function(){'use strict';var W=CeciliaWallet,mutating=false;
function ensure(){W.importCoins(GAME.id,S.coins,!!S.walletV);S.walletV=1;S.coins=W.balance();if(!S.walletPurchases)S.walletPurchases={}}
function refresh(){if(mutating)return;ensure();W.purchases(GAME.id).forEach(function(e){if(e.meta.type!=='sticker')return;var id=e.meta.slot;if(e.status==='rejected'){if(S.walletPurchases[id]===e.id){delete S.owned[id];delete S.walletPurchases[id]}}else{S.owned[id]=1;S.walletPurchases[id]=e.id}});S.coins=W.balance();['hCoins','gCoins','bkCoins'].forEach(function(id){var e=document.getElementById(id);if(e){e.textContent='🪙 '+S.coins;e.style.cursor='pointer';e.onclick=function(){location.href=W.root+'account/?v=v26'}}});}
var oldWin=winWord;winWord=function(lang,misses,hints){ensure();mutating=true;try{var r=oldWin(lang,misses,hints);W.award(r.coins,GAME.id,'Learning reward',GAME.id+':answer:'+W.uid());S.coins=W.balance();save();return r}finally{mutating=false;refresh()}};
var oldBuy=buySticker;buySticker=function(pi,slot){ensure();var id=pi+'_'+slot,P=PAGES[pi];if(S.owned[id])return 'owned';if(S.total<P.need)return 'locked';var before=W.balance();mutating=true;try{var tx='sticker:'+GAME.id+':'+id;if(!W.spend(P.price,GAME.id,'Sticker',tx,{type:'sticker',slot:id}))return 'poor';S.coins=before;var result=oldBuy(pi,slot);S.walletPurchases[id]=tx;if(result==='page')W.award(50,GAME.id,'Sticker page completed','page:'+GAME.id+':'+pi);S.coins=W.balance();save();return result}finally{mutating=false;refresh()}};
pAdd=function(n){ensure();W.award(n,'parent','Parent gift');S.coins=W.balance();save();toast('+'+n+' shared coins');closeModal();parentPanel()};
var oldBoot=bootRestore;bootRestore=function(cb){oldBoot(function(){ensure();refresh();saveLocal();cb()})};
var oldAdopt=cloudAdopt;cloudAdopt=function(st){oldAdopt(st);ensure();refresh();saveLocal()};
var oldParent=parentPanel;parentPanel=function(){oldParent();var target=document.getElementById('mcard');if(target){var a=document.createElement('a');a.className='btn gold';a.href=W.root+'account/?v=v26';a.textContent='👧 Cecilia’s global account';target.appendChild(a)}};
W.onChange(refresh);ensure();
})();
