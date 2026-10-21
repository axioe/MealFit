
export const WORKOUT_GOAL_LABELS = {
    loss: '체중 감량 (체지방 연소 & 슬림 탄탄)',
    hypertrophy: '근육 증가 (벌크업 & 근력 강화)',
    stamina: '체력 향상 (심폐 지구력 & 피로 회복)',
    health: '건강 유지 (체형 교정 & 대사 균형)'
};

export const WORKOUT_LEVEL_LABELS = {
    starter: '입문 (운동을 처음 시작하거나 오랜만임)',
    beginner: '초급 (기본적인 운동 동작 가능 / 3~6개월)',
    intermediate: '중급 (규칙적 운동 습관 1년 이상)',
    advanced: '고급 (고강도 트레이닝 및 분할 루틴 가능)'
};

export const EQUIPMENT_OPTIONS = [
    { id: 'dumbbell', label: '덤벨(아령)' },
    { id: 'band', label: '저항 밴드' },
    { id: 'mat', label: '요가 매트' },
    { id: 'pullup_bar', label: '풀업바 (문틀 철봉)' },
    { id: 'foam_roller', label: '폼롤러' },
    { id: 'kettlebell', label: '케틀벨' },
    { id: 'none', label: '장비 없음 (맨몸)' }
];

export const INJURY_AREA_OPTIONS = [
    '허리',
    '무릎',
    '어깨',
    '목',
    '손목',
    '발목',
    '고관절'
];

export const SORE_MUSCLE_OPTIONS = [
    '목',
    '어깨',
    '가슴',
    '등',
    '허리',
    '하체/허벅지',
    '종아리',
    '없음'
];

export const DIET_TYPE_OPTIONS = [
    { id: 'regular', label: '일반식 (영양 균형)' },
    { id: 'high_protein', label: '고단백 식단 (근성장/포만감)' },
    { id: 'low_carb', label: '저탄수화물 (혈당/체중 관리)' },
    { id: 'keto', label: '키토제닉 (고지저탄)' },
    { id: 'vegan', label: '비건/채식 위주' },
    { id: 'balanced', label: '지중해식 균형식' }
];