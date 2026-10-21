import React, { useState } from 'react';
import { Info, Scale, Trash2, X } from 'lucide-react';
export function WeightPage() {
    const records = [];
    const targetWeight = "";
    const currentWeight = "";
    // Add Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 10));
    const [inputWeight, setInputWeight] = useState('');
    const [inputMemo, setInputMemo] = useState('');
    // SVG Chart points calculation
    const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const allWeights = [...sortedRecords.map(r => r.weight), targetWeight];
    const minW = Math.max(30, Math.min(...allWeights) - 2);
    const maxW = Math.max(...allWeights) + 2;
    const chartWidth = 600;
    const chartHeight = 220;
    const paddingX = 40;
    const paddingY = 30;
    const getX = (idx, total) => {
        if (total <= 1)
            return chartWidth / 2;
        return paddingX + (idx / (total - 1)) * (chartWidth - paddingX * 2);
    };
    const getY = (val) => {
        const range = maxW - minW || 1;
        return chartHeight - paddingY - ((val - minW) / range) * (chartHeight - paddingY * 2);
    };
    const polylinePoints = sortedRecords
        .map((r, i) => `${getX(i, sortedRecords.length)},${getY(r.weight)}`)
        .join(' ');
    const targetLineY = getY(targetWeight);
    return (<>
      {/* Top Glance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">현재 체중</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900 tracking-tight">{currentWeight}</span>
            <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">목표 체중</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-700 tracking-tight">{targetWeight}</span>
            <span className="text-sm font-semibold text-gray-500">kg</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">목표 잔여</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-800">
              {currentWeight && targetWeight ? Number((currentWeight - targetWeight).toFixed(1)) : '—'} kg
            </span>
            <button onClick={() => setShowAddModal(true)} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer">
              + 체중 기록
            </button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Weight Trend Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600"/>
            체중 변화 궤적
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600"></span>
              <span className="text-gray-600">측정 기록</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-400"></span>
              <span className="text-emerald-700 font-semibold">목표 기준선 ({targetWeight}kg)</span>
            </div>
          </div>
        </div>

        {sortedRecords.length === 0 ? (<div className="py-16 text-center text-gray-400 text-xs">
            아직 등록된 체중 기록이 없습니다. 우측 상단의 '+ 체중 기록' 버튼을 눌러 기록해보세요.
          </div>) : (<div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 min-w-[500px]">
              {/* Target Baseline */}
              <line x1={paddingX} y1={targetLineY} x2={chartWidth - paddingX} y2={targetLineY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4"/>
              <text x={chartWidth - paddingX + 5} y={targetLineY + 4} fill="#059669" fontSize="10" fontWeight="bold">
                목표 {targetWeight}kg
              </text>

              {/* Polyline */}
              {sortedRecords.length > 1 && (<polyline fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePoints}/>)}

              {/* Data points */}
              {sortedRecords.map((r, i) => {
                const cx = getX(i, sortedRecords.length);
                const cy = getY(r.weight);
                return (<g key={r.id}>
                    <circle cx={cx} cy={cy} r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5"/>
                    <text x={cx} y={cy - 10} fill="#1f2937" fontSize="10" fontWeight="bold" textAnchor="middle">
                      {r.weight}
                    </text>
                    <text x={cx} y={chartHeight - 10} fill="#9ca3af" fontSize="9" textAnchor="middle">
                      {r.date.slice(5)}
                    </text>
                  </g>);
            })}
            </svg>
          </div>)}

        <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2 text-xs text-gray-500">
          <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/>
          <p className="leading-relaxed">
            체중은 단기적인 성공이나 실패의 평가 척도가 아닙니다. 수분 저류, 식사 시간대, 글리코겐 저장량에 따라 매일 등락할 수 있으므로, 2~4주 단위의 완만한 추세를 관찰하세요.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 font-bold text-sm text-gray-900">
          체중 기록 내역 ({records.length}건)
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {records.length === 0 ? (<p className="py-8 text-center text-gray-400">기록이 없습니다.</p>) : ([...records].reverse().map(rec => (<div key={rec.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <span className="font-bold text-gray-800 text-sm">{rec.weight} kg</span>
                  <span className="text-gray-400 text-xs ml-3">{rec.date}</span>
                  {rec.memo && <span className="text-gray-500 ml-2 italic">“{rec.memo}”</span>}
                </div>
                <button className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer" title="삭제" disabled>
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>)))}
        </div>
      </div>

      {/* Add Weight Modal */}
      {showAddModal && (<div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">오늘의 체중 입력</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 p-1 cursor-pointer">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={event => event.preventDefault()} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">측정 날짜</label>
                <input type="date" required value={inputDate} onChange={e => setInputDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"/>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">체중 (kg) *</label>
                <input type="number" step="0.1" min="30" max="250" required value={inputWeight} onChange={e => setInputWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">메모 (선택)</label>
                <input type="text" placeholder="예: 기상 직후 공복 측정" value={inputMemo} onChange={e => setInputMemo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-emerald-500"/>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold min-h-[44px] cursor-pointer">
                  취소
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[44px] cursor-pointer" disabled>
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </>);
}
