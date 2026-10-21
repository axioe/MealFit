import React, { useState } from 'react';
import { AlertTriangle, Award, CheckCircle2, Clock, Dumbbell, LogOut, Scale, Shield, Sparkles, Target, User, Utensils, Zap } from 'lucide-react';
import { DIET_TYPE_OPTIONS, EQUIPMENT_OPTIONS, INJURY_AREA_OPTIONS } from "@/lib/profileOptions";
export function MyPage({ user = {}, profile = {} } = {}) {
    const [activeTab, setActiveTab] = useState('trainer');
    const isSaving = false;
    const [trainerAge, setTrainerAge] = useState("");
    const [trainerHeight, setTrainerHeight] = useState("");
    const [trainerWeight, setTrainerWeight] = useState("");
    const [trainerGoal, setTrainerGoal] = useState("");
    const [trainerLevel, setTrainerLevel] = useState("");
    // Trainer Optional Settings
    const [trainerEnvironment, setTrainerEnvironment] = useState("");
    const [trainerEquipment, setTrainerEquipment] = useState([]);
    const [trainerAvailableTime, setTrainerAvailableTime] = useState("");
    const [trainerInjuries, setTrainerInjuries] = useState([]);
    const [trainerAllergiesText, setTrainerAllergiesText] = useState("");
    const [trainerDislikedFoodsText, setTrainerDislikedFoodsText] = useState("");
    const [trainerDietType, setTrainerDietType] = useState("");
    const [trainerBudget, setTrainerBudget] = useState("");
    // Common Profile state
    const [nickname, setNickname] = useState("");
    const [age, setAge] = useState("");
    const [height, setHeight] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [targetWeight, setTargetWeight] = useState("");
    const [gender, setGender] = useState("");
    const [activityLevel, setActivityLevel] = useState("");
    // Diet Profile state
    const [dietGoal, setDietGoal] = useState("");
    const [allergiesText, setAllergiesText] = useState("");
    const [dislikedFoodsText, setDislikedFoodsText] = useState("");
    const [preferredFoodsText, setPreferredFoodsText] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [defaultServings, setDefaultServings] = useState("");
    const [budgetPerMeal, setBudgetPerMeal] = useState("");
    const [prioritizeFridge, setPrioritizeFridge] = useState(false);
    // Fitness Profile state
    const [fitnessGoal, setFitnessGoal] = useState("");
    const [experience, setExperience] = useState("");
    const [equipment, setEquipment] = useState([]);
    const [daysPerWeek, setDaysPerWeek] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [uncomfortableAreasText, setUncomfortableAreasText] = useState('');
    // Fitness Tests state
    const [restingHeartRate, setRestingHeartRate] = useState("");
    const [pushups, setPushups] = useState("");
    const [squat30s, setSquat30s] = useState("");
    const [plankSeconds, setPlankSeconds] = useState("");
    const toggleTrainerEquipment = (eq) => {
        setTrainerEquipment((prev) => prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]);
    };
    const toggleTrainerInjury = (area) => {
        setTrainerInjuries((prev) => prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]);
    };
    const toggleEquipment = (eq) => {
        setEquipment((prev) => prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]);
    };
    return (<>
      {/* User Header Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
            {profile?.nickname?.[0] || user?.name?.[0] || 'M'}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-gray-900">{profile?.nickname || user?.name || '프로필'}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              키 {trainerHeight || profile?.height}cm • 체중 {trainerWeight || profile?.currentWeight}kg • 목표 {profile?.targetWeight ?? '—'}kg
            </p>
          </div>
        </div>

        <button className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer min-h-[44px]" disabled>
          <LogOut className="w-4 h-4"/>
          <span>로그아웃</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
            { key: 'trainer', label: 'AI 트레이너 프로필 (필수 & 선택)', icon: Zap },
            { key: 'common', label: '신체 기본 정보', icon: User },
            { key: 'diet', label: '식단 기호 & 알레르기', icon: Utensils },
            { key: 'fitness', label: '운동 목표 & 장비', icon: Dumbbell },
            { key: 'tests', label: '체력 테스트 측정', icon: Scale }
        ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (<button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4"/>
              <span>{t.label}</span>
            </button>);
        })}
      </div>

      {/* Tab 0: AI Trainer Profile (필수 & 선택 설정) */}
      {activeTab === 'trainer' && (<form onSubmit={event => event.preventDefault()} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6 text-xs max-w-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="shrink-0 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  AI 트레이너 프로필
                </span>
                <span className="text-[11px] text-gray-400"></span>
              </div>
              <h4 className="font-extrabold text-base text-gray-900">
                오늘의 추천 코칭을 위한 핵심 신체 및 환경 설정
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-emerald-600"/>
            </div>
          </div>

          {/* 1. 필수 항목 섹션 */}
          <div className="space-y-4">
            <h5 className="font-bold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600"/>
              1. 필수 항목 (첫 실행 시 수집)
            </h5>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div>
                <label className="font-bold text-gray-700 block mb-1">나이 (만) *</label>
                <input type="number" min="18" max="80" required value={trainerAge} onChange={e => setTrainerAge(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white focus:outline-emerald-500"/>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">키 (cm) *</label>
                <input type="number" min="100" max="240" required value={trainerHeight} onChange={e => setTrainerHeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white focus:outline-emerald-500"/>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">체중 (kg) *</label>
                <input type="number" min="30" max="250" required value={trainerWeight} onChange={e => setTrainerWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white focus:outline-emerald-500"/>
              </div>
            </div>

            {/* 운동 목적 */}
            <div>
              <label className="font-bold text-gray-800 block mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-600"/>
                운동 목적 *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                { id: 'loss', label: '체중 감량', desc: '체지방 연소' },
                { id: 'hypertrophy', label: '근육 증가', desc: '근비대·근력' },
                { id: 'stamina', label: '체력 향상', desc: '지구력 증진' },
                { id: 'health', label: '건강 유지', desc: '체형·활력' }
            ].map(item => (<button type="button" key={item.id} onClick={() => setTrainerGoal(item.id)} className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${trainerGoal === item.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <span className="font-bold text-xs block">{item.label}</span>
                    <span className={`text-[10px] block truncate ${trainerGoal === item.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {item.desc}
                    </span>
                  </button>))}
              </div>
            </div>

            {/* 운동 수준 */}
            <div>
              <label className="font-bold text-gray-800 block mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-teal-600"/>
                운동 수준 *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                { id: 'starter', label: '입문', desc: '초보/오랜만' },
                { id: 'beginner', label: '초급', desc: '3~6개월 기본' },
                { id: 'intermediate', label: '중급', desc: '1년+ 규칙적' },
                { id: 'advanced', label: '고급', desc: '분할/고강도' }
            ].map(item => (<button type="button" key={item.id} onClick={() => setTrainerLevel(item.id)} className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${trainerLevel === item.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <span className="font-bold text-xs block">{item.label}</span>
                    <span className={`text-[10px] block truncate ${trainerLevel === item.id ? 'text-teal-100' : 'text-gray-400'}`}>
                      {item.desc}
                    </span>
                  </button>))}
              </div>
            </div>
          </div>

          {/* 2. 선택 항목 섹션 (설정 화면에서 나중에 추가) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600"/>
                2. 선택 항목 (설정 화면에서 자유롭게 추가)
              </h5>
              <span className="text-[11px] text-gray-400">환경·기구·부상·식단 맞춤 최적화</span>
            </div>

            {/* 운동 환경 */}
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">운동 환경</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                { id: 'home', label: '🏠 집 (홈트레이닝)' },
                { id: 'gym', label: '🏋️ 헬스장 (피트니스 센터)' },
                { id: 'outdoor', label: '🌳 야외 / 공원' }
            ].map(env => (<button type="button" key={env.id} onClick={() => setTrainerEnvironment(env.id)} className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${trainerEnvironment === env.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {env.label}
                  </button>))}
              </div>
            </div>

            {/* 보유 기구 (다중 선택) */}
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">
                보유 기구 (다중 선택):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {EQUIPMENT_OPTIONS.map(eq => {
                const isChecked = trainerEquipment.includes(eq.id);
                return (<button type="button" key={eq.id} onClick={() => toggleTrainerEquipment(eq.id)} className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${isChecked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      <span>{eq.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"/>}
                    </button>);
            })}
              </div>
            </div>

            {/* 하루 운동 가능 시간 (10~90분) */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600"/>
                  하루 운동 가능 시간 (10~90분)
                </label>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {trainerAvailableTime}분
                </span>
              </div>
              <input type="range" min="10" max="90" step="5" value={trainerAvailableTime} onChange={e => setTrainerAvailableTime(Number(e.target.value))} className="w-full accent-emerald-600 cursor-pointer"/>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>10분 (가벼운 스트레칭)</span>
                <span>30분 (표준)</span>
                <span>60분 (집중)</span>
                <span>90분 (완전 분할)</span>
              </div>
            </div>

            {/* 통증·부상 부위 (다중 선택) */}
            <div>
              <label className="font-bold text-gray-700 block mb-1.5 flex items-center gap-1 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600"/>
                통증·부상 부위 (선택 - 해당 부위 관절 보호 및 대체 동작 제공):
              </label>
              <div className="flex flex-wrap gap-2">
                {INJURY_AREA_OPTIONS.map(area => {
                const isSelected = trainerInjuries.includes(area);
                return (<button type="button" key={area} onClick={() => toggleTrainerInjury(area)} className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {area} {isSelected && '✓'}
                    </button>);
            })}
              </div>
            </div>

            {/* 알레르기 & 기피 음식 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">알레르기 유발 식재료 (쉼표 구분)</label>
                <input type="text" placeholder="예: 땅콩, 갑각류, 복숭아, 우유" value={trainerAllergiesText} onChange={e => setTrainerAllergiesText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-emerald-500"/>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">기피/싫어하는 음식 (쉼표 구분)</label>
                <input type="text" placeholder="예: 오이, 가지, 고수" value={trainerDislikedFoodsText} onChange={e => setTrainerDislikedFoodsText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-emerald-500"/>
              </div>
            </div>

            {/* 식단 유형 & 한 끼 예산 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">식단 유형</label>
                <select value={trainerDietType} onChange={e => setTrainerDietType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"><option value="" disabled>선택하세요</option>
                  {DIET_TYPE_OPTIONS.map(d => (<option key={d.id} value={d.id}>{d.label}</option>))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">한 끼 예산 (원)</label>
                <input type="number" step="1000" min="3000" max="50000" value={trainerBudget} onChange={e => setTrainerBudget(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-emerald-500"/>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer min-h-[46px] disabled:opacity-50" disabled>
              {isSaving ? '연결 상태 확인 중...' : '프로필 저장'}
            </button>
          </div>
        </form>)}

      {/* Tab 1: Common Profile */}
      {activeTab === 'common' && (<form onSubmit={event => event.preventDefault()} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <h4 className="font-bold text-sm text-gray-900 mb-2">신체 기본 프로필 (식단·운동 공유)</h4>

          <div>
            <label className="font-bold text-gray-700 block mb-1">닉네임 *</label>
            <input type="text" required value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">나이 (만 18~80세) *</label>
              <input type="number" min="18" max="80" required value={age} onChange={e => setAge(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">성별</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="unspecified">응답 안 함</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">키 (cm) *</label>
              <input type="number" step="0.1" min="100" max="240" required value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">현재 체중 (kg) *</label>
              <input type="number" step="0.1" min="30" max="250" required value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">목표 체중 (kg) *</label>
              <input type="number" step="0.1" min="30" max="250" required value={targetWeight} onChange={e => setTargetWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">평소 활동량</label>
            <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
              <option value="sedentary">거의 앉아서 생활 (운동 거의 안 함)</option>
              <option value="light">가벼운 활동 (주 1~2회 가벼운 운동)</option>
              <option value="moderate">보통 활동 (주 3~5회 보통 운동)</option>
              <option value="active">활동적인 생활 (주 6~7회 격렬한 운동)</option>
              <option value="very_active">매우 많은 활동량 (육체 노동 또는 전문 운동)</option>
            </select>
          </div>

          <div className="pt-3">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs min-h-[44px] cursor-pointer" disabled>
              {isSaving ? '저장 중...' : '신체 정보 저장'}
            </button>
          </div>
        </form>)}

      {/* Tab 2: Diet Preferences */}
      {activeTab === 'diet' && (<form onSubmit={event => event.preventDefault()} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <h4 className="font-bold text-sm text-gray-900 mb-2">식단 목표 & 선호도 설정</h4>

          <div>
            <label className="font-bold text-gray-700 block mb-1">식단 목표 *</label>
            <select value={dietGoal} onChange={e => setDietGoal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
              <option value="loss">체중 감량 (칼로리 조절, 고단백 식이)</option>
              <option value="maintain">체중 유지 (탄단지 균형, 건강 증진)</option>
              <option value="gain">체중 증량 / 근비대 (영양 밀도 증가)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <label className="font-bold block mb-1">
              🚨 알레르기 및 제외 식재료 (쉼표로 구분 - 엄격 준수)
            </label>
            <input type="text" placeholder="예: 땅콩, 갑각류, 복숭아, 우유" value={allergiesText} onChange={e => setAllergiesText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-sm focus:outline-rose-500"/>
            <p className="text-[11px] text-rose-700 mt-1">
              * 알레르기·제외 재료를 입력하세요.
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">싫어하는 음식 (쉼표 구분)</label>
            <input type="text" placeholder="예: 오이, 가지, 고수" value={dislikedFoodsText} onChange={e => setDislikedFoodsText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">선호 음식 (쉼표 구분)</label>
            <input type="text" placeholder="예: 닭가슴살 덮밥, 두부김치, 달걀 스크램블" value={preferredFoodsText} onChange={e => setPreferredFoodsText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">조리 가능 시간</label>
              <select value={cookTime} onChange={e => setCookTime(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                <option value={10}>10분 이내 (초간단)</option>
                <option value={20}>20분 이내 (표준)</option>
                <option value={30}>30분 이내 (풍성한 요리)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">기본 식사 인분</label>
              <input type="number" min="1" max="6" value={defaultServings} onChange={e => setDefaultServings(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">끼니당 예산 (선택, 원)</label>
            <input type="number" step="1000" value={budgetPerMeal} onChange={e => setBudgetPerMeal(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="prioritizeFridge" checked={prioritizeFridge} onChange={e => setPrioritizeFridge(e.target.checked)} className="w-4 h-4 rounded text-emerald-600 cursor-pointer"/>
            <label htmlFor="prioritizeFridge" className="font-bold text-gray-800 cursor-pointer">
              냉장고 기한 임박 재료 우선 소진 활성화
            </label>
          </div>

          <div className="pt-3">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs min-h-[44px] cursor-pointer" disabled>
              {isSaving ? '저장 중...' : '식단 설정 저장'}
            </button>
          </div>
        </form>)}

      {/* Tab 3: Fitness Profile */}
      {activeTab === 'fitness' && (<form onSubmit={event => event.preventDefault()} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <h4 className="font-bold text-sm text-gray-900 mb-2">운동 목표 & 보유 장비</h4>

          <div>
            <label className="font-bold text-gray-700 block mb-1">운동 목표</label>
            <select value={fitnessGoal} onChange={e => setFitnessGoal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
              <option value="fat_loss">체지방 감량 & 대사 활성화</option>
              <option value="hypertrophy">근비대 & 근력 향상</option>
              <option value="stamina">전신 지구력 & 심폐 강화</option>
              <option value="flexibility_posture">유연성 및 체형 교정</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">운동 구력/경험</label>
              <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
                <option value="beginner">입문 (운동을 거의 해본 적 없음)</option>
                <option value="elementary">초급 (기본 동작 인지 및 3~6개월 경험)</option>
                <option value="intermediate">중급 (규칙적 운동 1년 이상)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">주당 운동 일수 (2~6일)</label>
              <input type="number" min="2" max="6" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">1회 운동 시간</label>
            <select value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"><option value="" disabled>선택하세요</option>
              <option value={15}>15분 (가벼운 순환)</option>
              <option value={30}>30분 (표준 데일리)</option>
              <option value={45}>45분 (집중 루틴)</option>
              <option value={60}>60분 (강도 높은 트레이닝)</option>
            </select>
          </div>

          {/* Equipment checkboxes */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">보유 운동 장비 (선택):</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bodyweight', label: '맨몸' },
                { id: 'dumbbell', label: '덤벨' },
                { id: 'band', label: '저항 밴드' },
                { id: 'pullup_bar', label: '문틀 철봉' },
                { id: 'barbell', label: '바벨' },
                { id: 'gym', label: '헬스장 등록' }
            ].map(item => (<button type="button" key={item.id} onClick={() => toggleEquipment(item.id)} className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${equipment.includes(item.id)
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {item.label}
                </button>))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <label className="font-bold block mb-1">
              불편한 부위 / 관절 통증 (쉼표 구분)
            </label>
            <input type="text" placeholder="예: 허리, 무릎, 손목, 어깨" value={uncomfortableAreasText} onChange={e => setUncomfortableAreasText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-sm focus:outline-amber-500"/>
            <p className="text-[11px] text-amber-800 mt-1">
              * 입력된 부위에 무리를 주는 동작은 루틴에서 제외되거나 쉬운 대체 동작이 자동 배치됩니다.
            </p>
          </div>

          <div className="pt-3">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs min-h-[44px] cursor-pointer" disabled>
              {isSaving ? '저장 중...' : '운동 프로필 저장'}
            </button>
          </div>
        </form>)}

      {/* Tab 4: Fitness Tests */}
      {activeTab === 'tests' && (<form onSubmit={event => event.preventDefault()} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4 text-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-emerald-600"/>
            <h4 className="font-bold text-sm text-gray-900">기초 체력 테스트 (선택 입력)</h4>
          </div>
          <p className="text-gray-500 leading-relaxed">
            측정하기 어려운 항목은 비워두셔도 됩니다. 무리한 측정을 자제하시고 신체 상태에 맞게 진행하세요.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">안정시 심박수 (bpm)</label>
              <input type="number" placeholder="예: 68" value={restingHeartRate} onChange={e => setRestingHeartRate(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">푸시업 (회)</label>
              <input type="number" placeholder="예: 15" value={pushups} onChange={e => setPushups(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">30초 의자 스쿼트 (회)</label>
              <input type="number" placeholder="예: 20" value={squat30s} onChange={e => setSquat30s(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">플랭크 버티기 (초)</label>
              <input type="number" placeholder="예: 45" value={plankSeconds} onChange={e => setPlankSeconds(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
            </div>
          </div>

          <div className="pt-3">
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs min-h-[44px] cursor-pointer" disabled>
              {isSaving ? '저장 중...' : '체력 테스트 저장'}
            </button>
          </div>
        </form>)}

      {/* Privacy Notice & Account Deletion */}
      <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-xs max-w-2xl space-y-4">
        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600"/>
          개인정보 보호 및 AI 전송 범위 고지
        </h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          계정 및 개인정보 설정을 관리합니다.
        </p>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-rose-700 block">회원 탈퇴</span>
            <span className="text-[11px] text-gray-400">계정 삭제 요청</span>
          </div>
          <button className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all min-h-[44px] cursor-pointer" disabled>
            회원 탈퇴
          </button>
        </div>
      </div>
    </>);
}
