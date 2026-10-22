import test from 'node:test'
import assert from 'node:assert/strict'
import { cookingChangeQuantity, cookingPreviewState, mealCardActions, plannedUsage, recipePlanLink } from '../src/api/cookingUx.js'
const plan={id:91,recipe:{id:3},planDate:'2026-10-22',servings:2,status:'DRAFT',cooked:false}
test('초안은 확정·재추천을 제공하고 요리하기는 제공하지 않는다',()=>{
 assert.deepEqual(mealCardActions(plan),{draft:true,cooked:false,canCook:false,canCancelPlan:true})
 assert.equal(recipePlanLink(plan,true),null)
})
test('확정 후에만 요리하기를 제공하고 식단·레시피 식별자와 인분·날짜를 보존한다',()=>{
 const confirmed={...plan,status:'CONFIRMED'}
 assert.equal(mealCardActions(confirmed).canCook,true)
 const url=new URL(recipePlanLink(confirmed,true),'http://test')
 assert.equal(url.pathname,'/recipes/3');assert.equal(url.searchParams.get('mealPlanId'),'91')
 assert.equal(url.searchParams.get('servings'),'2');assert.equal(url.searchParams.get('date'),'2026-10-22');assert.equal(url.hash,'#cook')
 assert.equal(new URL(recipePlanLink(confirmed),'http://test').hash,'')
})
test('서버의 요리 완료 식단은 다시 요리하거나 식단 자체를 취소하는 버튼을 제공하지 않는다',()=>{
 const cooked={...plan,status:'CONFIRMED',cooked:true}
 assert.deepEqual(mealCardActions(cooked),{draft:false,cooked:true,canCook:false,canCancelPlan:false})
 assert.equal(recipePlanLink(cooked,true),null)
 assert.ok(recipePlanLink(cooked))
})
test('조리 완료 취소 후 서버 cooked가 false이면 요리하기를 다시 제공한다',()=>{
 assert.equal(mealCardActions({...plan,status:'CONFIRMED',cooked:false}).canCook,true)
})
test('취소 상태·조리 상태 미제공·mock 또는 잘못된 식단 정보는 조리 링크를 만들지 않는다',()=>{
 assert.equal(recipePlanLink({...plan,status:'CONFIRMED',cooked:undefined},true),null)
 assert.equal(recipePlanLink({...plan,status:'CANCELED'},true),null)
 for(const patch of [{id:'mock-1'},{recipe:{id:'mock-egg'}},{planDate:'2026-02-30'},{servings:0}])assert.equal(recipePlanLink({...plan,...patch}),null)
})
test('여러 보관 묶음의 사용량은 소수점 오차 없이 합산하고 단위가 다르면 분리한다',()=>{
 const deductions=[{quantity:0.1,unit:'kg'},{quantity:0.2,unit:'kg'},{quantity:50,unit:'g'}]
 const original=JSON.stringify(deductions)
 assert.deepEqual(plannedUsage(deductions),[{quantity:'0.3',unit:'kg'},{quantity:'50',unit:'g'}])
 assert.equal(JSON.stringify(deductions),original)
 assert.deepEqual(plannedUsage([]),[])
 assert.deepEqual(plannedUsage([{quantity:-1,unit:'g'}]),[])
})
test('가능 여부는 서버 판정을 우선하고 부족량이 없더라도 차단 사유를 숨기지 않는다',()=>{
 assert.equal(cookingPreviewState({canCook:true,ingredients:[]}), '요리 가능')
 assert.equal(cookingPreviewState({canCook:false,ingredients:[{shortageQty:1}]}), '재료 부족')
 assert.equal(cookingPreviewState({canCook:false,ingredients:[{shortageQty:0}]}), '확인 필요')
})
test('사용·복원 결과는 응답 수량의 부호만 표시용으로 분리하며 응답을 변경하지 않는다',()=>{
 const used={qtyChange:'-0.125'}
 assert.equal(cookingChangeQuantity(used),'0.125');assert.equal(used.qtyChange,'-0.125')
 assert.equal(cookingChangeQuantity({qtyChange:200}),'200')
})
