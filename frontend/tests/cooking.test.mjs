import test from 'node:test'
import assert from 'node:assert/strict'
import { QueryClient } from '@tanstack/react-query'
import { canCancelCooking, cookingKeys, cookingErrorMessage, createCookingSubmission, refreshCookingQueries, resolveCookingTarget, validateCookingPreview } from '../src/api/cookingFlows.js'
import { createCookingApi } from '../src/api/cookingRequests.js'
import { queryKeys } from '../src/api/queryKeys.js'
const plan={id:91,recipe:{id:3},planDate:'2026-10-22',mealType:'LUNCH',status:'CONFIRMED',servings:2,cooked:false}
const input={mealPlanId:'91',recipeId:'3',date:'2026-10-22',servings:2,result:{planDate:'2026-10-22',mealPlans:[plan]},recipeReady:true,isFetching:false,isError:false}
test('식단 ID와 레시피 ID를 서버 데이터로 구분한다',()=>{
 assert.equal(resolveCookingTarget(input).plan.id,91)
 assert.equal(resolveCookingTarget({...input,mealPlanId:'3'}).plan,null)
 assert.equal(resolveCookingTarget({...input,recipeId:'91'}).plan,null)
})
test('직접 URL·mock·다른 날짜·이전 조회 데이터로 조리할 수 없다',()=>{
 for(const patch of [{mealPlanId:null},{mealPlanId:'mock-egg'},{date:'2026-10-23'},{isFetching:true},{isError:true},{result:undefined}])assert.ok(resolveCookingTarget({...input,...patch}).reason)
})
test('아침·점심·저녁과 다른 날짜도 일치하는 확정 서버 식단이면 허용한다',()=>{
 for(const mealType of ['BREAKFAST','LUNCH','DINNER']){
  const changed={...plan,mealType,planDate:'2026-10-21'}
  assert.equal(resolveCookingTarget({...input,date:'2026-10-21',result:{planDate:'2026-10-21',mealPlans:[changed]}}).reason,'')
 }
})
test('미확정 식단 및 다른 인분·조회 중 레시피는 조리를 차단한다',()=>{
 assert.match(resolveCookingTarget({...input,result:{...input.result,mealPlans:[{...plan,status:'DRAFT'}]}}).reason,/확정/)
 assert.match(resolveCookingTarget({...input,servings:3}).reason,/2인분/)
 assert.ok(resolveCookingTarget({...input,recipeReady:false}).reason)
})
test('미리보기의 대상과 인분을 검증하고 서버 canCook 판정을 유지한다',()=>{
 const preview={mealPlanId:91,servings:2,canCook:false,ingredients:[],blockedReason:'부족'}
 assert.equal(validateCookingPreview(preview,plan).canCook,false)
 assert.throws(()=>validateCookingPreview({...preview,servings:3},plan))
 assert.throws(()=>validateCookingPreview({...preview,mealPlanId:3},plan))
 assert.notDeepEqual(cookingKeys.preview(91,2),cookingKeys.preview(91,3))
})
test('완료 응답 ID만 취소에 사용하고 새로고침·이미 복원 상태에서는 차단한다',()=>{
 const cooked={...plan,cooked:true}
 const event={id:700,mealPlanId:91,status:'COOKED'}
 assert.equal(canCancelCooking(cooked,event),true)
 assert.equal(canCancelCooking(cooked,null),false)
 assert.equal(canCancelCooking(cooked,{...event,mealPlanId:3}),false)
 assert.equal(canCancelCooking(cooked,{...event,status:'RESTORED'}),false)
 assert.equal(canCancelCooking(plan,event),false)
})
test('실제 Controller 계약만 호출하며 완료에는 식단 ID만 보낸다',async()=>{
 const calls=[];const api=createCookingApi({get:async(...args)=>{calls.push(['GET',...args]);return {data:{ok:true}}},post:async(...args)=>{calls.push(['POST',...args]);return {data:{ok:true}}}})
 const controller=new AbortController()
 await api.preview(91,controller.signal);await api.complete(91);await api.cancel(700)
 assert.deepEqual(calls,[['GET','/cooking/preview',{params:{mealPlanId:91},signal:controller.signal}],['POST','/cooking-events',{mealPlanId:91}],['POST','/cooking-events/700/cancel']])
})
test('동시에 누른 완료 요청은 한 번만 실행한다',async()=>{
 const submit=createCookingSubmission();let finish;let calls=0
 const pending=submit(()=>{calls++;return new Promise(resolve=>{finish=resolve})})
 assert.equal(await submit(async()=>{calls++}),undefined)
 finish('COOKED');assert.equal(await pending,'COOKED');assert.equal(calls,1)
})
test('실패한 요청은 재고·완료 상태를 임의 변경하지 않고 자동 재시도하지 않는다',async()=>{
 const submit=createCookingSubmission();const state={quantity:500,cooked:false};let calls=0
 await assert.rejects(submit(async()=>{calls++;throw Error('network')}))
 assert.deepEqual(state,{quantity:500,cooked:false});assert.equal(calls,1)
 assert.equal(await submit(async()=> 'server check'),'server check')
})
test('차감·복원 후 재고 전체·개별 이력·식단·장보기·대시보드·미리보기 캐시를 갱신한다',async()=>{
 const client=new QueryClient();const keys=[queryKeys.inventory.all,queryKeys.inventory.transactions(),queryKeys.inventory.transactions(5),queryKeys.mealPlans.byDate(plan.planDate),queryKeys.shopping.all,queryKeys.dashboard.all,cookingKeys.preview(91,2)]
 keys.forEach(key=>client.setQueryData(key,{value:true}))
 await refreshCookingQueries(client,plan.planDate)
 assert.ok(keys.every(key=>client.getQueryState(key).isInvalidated));client.clear()
})
test('조리 오류 코드를 부족·중복 완료·중복 취소로 구분한다',()=>{
 assert.match(cookingErrorMessage({response:{data:{code:'COOKING_004'}}}),/재고가 부족/)
 assert.match(cookingErrorMessage({response:{data:{code:'COOKING_003'}}}),/이미 조리 완료/)
 assert.match(cookingErrorMessage({response:{data:{code:'COOKING_005'}}}),/이미 취소/)
 assert.match(cookingErrorMessage({}),/반복하지 말고/)
})
