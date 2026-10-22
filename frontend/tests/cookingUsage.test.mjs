import test from 'node:test'
import assert from 'node:assert/strict'
import { cookingBody, validateUsagePreview, validateCookingEvent, createCookingIntent, loadPendingCooking, savePendingCooking, canCompleteUsage } from '../src/api/cookingUsage.js'
import { createCookingApi } from '../src/api/cookingRequests.js'
import { createCookingSubmission } from '../src/api/cookingFlows.js'
const rows = () => [{ ingredientName: '달걀', quantity: '2', unit: '개', enabled: true, added: false }, { ingredientName: '양파', quantity: '50', unit: 'g', enabled: true, added: false }]
const uuid1 = '00000000-0000-4000-8000-000000000001'
const uuid2 = '00000000-0000-4000-8000-000000000002'
test('하루 식단 실제 사용량은 수정 수량과 포함된 재료만 전송하며 UUID를 가정하지 않는다', () => {
  const value=rows(); value[0].quantity='3'; value[1].enabled=false
  assert.deepEqual(cookingBody('meal',{mealPlanId:91},value),{mealPlanId:91,ingredients:[{ingredientName:'달걀',quantity:'3',unit:'개'}]})
})
test('하루 식단의 추가 재료는 차단하고 미사용 또는 제거하면 복귀한다', () => {
  const value=rows(); value.push({ingredientName:'치즈',quantity:'1',unit:'장',enabled:true,added:true})
  assert.throws(()=>cookingBody('meal',{mealPlanId:91},value),/추가/)
  value[2].enabled=false; assert.equal(cookingBody('meal',{mealPlanId:91},value).ingredients.length,2)
})
test('15분 mock도 공식 재료 API 모델만 만들고 가짜 식단·레시피 ID는 넣지 않는다', () => {
  assert.deepEqual(cookingBody('ingredients',{recipeName:'달걀 볶음',servings:null},rows()),{recipeName:'달걀 볶음',ingredients:rows().map(({ingredientName,quantity,unit})=>({ingredientName,quantity,unit}))})
})
test('0·음수·정밀도·범위·빈 입력과 전부 제외를 거부한다', () => {
  for(const quantity of ['0','-1','','0.0001','1000000000']){const value=rows(); value[0].quantity=quantity; assert.throws(()=>cookingBody('meal',{mealPlanId:91},value))}
  assert.throws(()=>cookingBody('ingredients',{recipeName:'요리'},rows().map(x=>({...x,enabled:false}))))
})
test('15분 API의 30개 제한과 인분 범위를 준수한다', () => {
  assert.throws(()=>cookingBody('ingredients',{recipeName:'요리'},Array.from({length:31},()=>rows()[0])))
  assert.throws(()=>cookingBody('ingredients',{recipeName:'요리',servings:11},rows()))
})
test('동일 요청 재시도는 동일 UUID를 사용한다', () => {
  let issued=0; const intent=createCookingIntent(()=>{issued++;return uuid1})
  const body=cookingBody('ingredients',{recipeName:'요리'},rows())
  assert.equal(intent.prepare(body).clientRequestId,intent.prepare(structuredClone(body)).clientRequestId)
  assert.equal(issued,1)
})
test('수량 수정과 성공 후 새 조리는 새 UUID를 사용한다', () => {
  let issued=0; const intent=createCookingIntent(()=>[uuid1,uuid2,'00000000-0000-4000-8000-000000000003'][issued++])
  const body=cookingBody('ingredients',{recipeName:'요리'},rows())
  assert.equal(intent.prepare(body).clientRequestId,uuid1)
  body.ingredients[0].quantity='3'; assert.equal(intent.prepare(body).clientRequestId,uuid2)
  intent.clear(); assert.notEqual(intent.prepare(body).clientRequestId,uuid2)
})
test('불확실한 요청은 사용자별 세션에 정확한 payload와 UUID로 보존한다', () => {
  const entries=new Map(); const storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}
  const body={...cookingBody('ingredients',{recipeName:'요리'},rows()),clientRequestId:uuid1}
  savePendingCooking(storage,1,body); assert.deepEqual(loadPendingCooking(storage,1),body); assert.equal(loadPendingCooking(storage,2),null)
  savePendingCooking(storage,1,null); assert.equal(loadPendingCooking(storage,1),null)
})
test('현재 Controller의 실제 POST 경로와 payload만 호출한다',async()=>{
 const calls=[]; const client={post:async(...args)=>{calls.push(args);return {data:{ok:true}}}}
 const api=createCookingApi(client),body=cookingBody('meal',{mealPlanId:91},rows()),quick=cookingBody('ingredients',{recipeName:'요리'},rows())
 await api.previewUsages(body,'signal');await api.completeUsages(body);await api.previewIngredients(quick,'signal');await api.completeIngredients({...quick,clientRequestId:uuid1});await api.cancel(7)
 assert.deepEqual(calls.map(x=>x[0]),['/cooking/preview','/cooking-events','/cooking/ingredients/preview','/cooking-events/ingredients','/cooking-events/7/cancel'])
 assert.deepEqual(calls[0][1],body); assert.equal(calls[0][2].signal,'signal');assert.equal(calls[3][1].clientRequestId,uuid1)
})
test('다른 식단·요리의 미리보기는 수용하지 않는다',()=>{
 const preview={mealPlanId:91,servings:1,recipeName:'요리',canCook:true,ingredients:[]}
 assert.throws(()=>validateUsagePreview(preview,{mealPlanId:92},'meal'))
 assert.throws(()=>validateUsagePreview(preview,{recipeName:'요리'},'ingredients'))
 assert.equal(validateUsagePreview({...preview,mealPlanId:null},{recipeName:'요리'},'ingredients').recipeName,'요리')
})
test('입력·재고 변경, 미리보기 로딩·부족·불확실 상태에서는 완료 차단',()=>{
 const value={preview:{canCook:true,cooked:false,ingredients:[{}]},ready:true,requested:'a',snapshot:'a',fetching:false,pending:null,uncertain:false,event:null}
 assert.equal(canCompleteUsage(value),true)
 for(const patch of [{snapshot:'b'},{ready:false},{fetching:true},{pending:{}},{uncertain:true},{event:{}},{preview:{canCook:false,ingredients:[{}]}}])assert.equal(canCompleteUsage({...value,...patch}),false)
})
test('동일 UUID 재전송의 RESTORED 응답은 성공한 신규 차감으로 오인하지 않는다',()=>{
 const result={id:7,mealPlanId:null,recipeName:'요리',status:'RESTORED',changes:[]}
 assert.equal(validateCookingEvent(result,{recipeName:'요리'},'ingredients','complete').status,'RESTORED')
 assert.throws(()=>validateCookingEvent({...result,recipeName:'다른 요리'},{recipeName:'요리'},'ingredients','complete'))
})
test('취소는 응답 이벤트 ID와 복원 상태를 검증한다',()=>{
 const result={id:7,mealPlanId:91,status:'RESTORED',changes:[]}
 assert.equal(validateCookingEvent(result,{mealPlanId:91},'meal','cancel',7).id,7)
 assert.throws(()=>validateCookingEvent(result,{mealPlanId:91},'meal','cancel',8))
})
test('완료 더블 클릭은 한 번만 실행한다',async()=>{
 const submit=createCookingSubmission();let count=0,release
 const first=submit(async()=>{count++;await new Promise(resolve=>{release=resolve})})
 await submit(async()=>{count++}); release();await first; assert.equal(count,1)
})
