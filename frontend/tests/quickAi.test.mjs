import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareServerQuickInput,adaptAiQuickResponse,createQuickRecipesApi } from '../src/api/quickRecipeRequests.js'
const response=()=>({source:'AI_GENERATED',recipes:[{title:'두부 볶음',description:'간단한 요리',cookingMinutes:10,servings:2,reason:'재고 활용',steps:['익혀 주세요.'],ingredients:[{name:'두부',quantity:'300',unit:'g',inventory:{quantity:'300',unit:'g',shortageQuantity:'0',status:'SUFFICIENT',hasIncompatibleUnits:false}}]}]})
test('선택 재고 ID만 전송하고 보유량을 브라우저에서 주장하지 않는다',()=>{
 assert.deepEqual(prepareServerQuickInput([{quantity:'999',lots:[{id:1},{id:2}]}],'15'),{selectedLotIds:[1,2],maxCookingMinutes:15,recommendationCount:3})
})
test('빈 선택·시간 범위 오류를 거부한다',()=>{
 assert.throws(()=>prepareServerQuickInput([],15));assert.throws(()=>prepareServerQuickInput([{lots:[{id:1}]}],16))
})
test('실제 AI 응답을 카드·상세·사용량 편집 모델로 변환한다',()=>{
 const value=adaptAiQuickResponse(response()).recipes[0]
 assert.equal(value.source,'AI_GENERATED');assert.equal(value.name,'두부 볶음');assert.equal(value.servings,2)
 assert.equal(value.reason,'재고 활용');assert.equal(value.ingredients[0].ingredientName,'두부');assert.equal(value.comparisons[0].status,'sufficient');assert.equal(value.recipeId,null);assert.equal(value.mealPlanId,null)
})
test('단위 불일치 결과의 부족량은 임의 생성하지 않는다',()=>{
 const data=response();data.recipes[0].ingredients[0].inventory={quantity:'0',unit:'g',shortageQuantity:null,status:'UNIT_MISMATCH',hasIncompatibleUnits:true}
 assert.equal(adaptAiQuickResponse(data).recipes[0].comparisons[0].shortageText,'')
})
test('mock·빈 결과·잘못된 구조를 실제 AI 성공으로 표시하지 않는다',()=>{
 for(const value of [{source:'mock',recipes:[]},{source:'AI_GENERATED',recipes:[]},{source:'AI_GENERATED',recipes:[{}]}])assert.throws(()=>adaptAiQuickResponse(value))
})
test('React는 Spring 경로만 호출하고 실패를 전파한다',async()=>{
 const calls=[];const api=createQuickRecipesApi({post:async(...args)=>{calls.push(args);return {data:response()}}})
 const body={selectedLotIds:[1],maxCookingMinutes:15,recommendationCount:3};await api.recommend(body)
 assert.deepEqual(calls,[['/quick-recipes/recommend',body]])
 await assert.rejects(createQuickRecipesApi({post:async()=>{throw new Error('timeout')}}).recommend(body),/timeout/)
})
