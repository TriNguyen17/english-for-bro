'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_VOCAB = [
  { id: 1, word: 'Gamification', ipa: '/ˌɡeɪmɪfɪˈkeɪʃn/', meaning: 'Trò chơi hóa', example: 'Gamification makes learning English much more fun!', options: ['Trò chơi hóa', 'Sự kiên trì', 'Từ vựng', 'Phát âm'] },
  { id: 2, word: 'Persistent', ipa: '/pəˈsɪstənt/', meaning: 'Kiên trì, bền bỉ', example: 'If you want to master English, you must be persistent.', options: ['Giao tiếp', 'Thất bại', 'Kiên trì, bền bỉ', 'Thông minh'] },
  { id: 3, word: 'Vocabulary', ipa: '/vəˈkæbjəlri/', meaning: 'Từ vựng', example: 'Reading books is a great way to expand your vocabulary.', options: ['Ngữ pháp', 'Từ vựng', 'Từ điển', 'Bài tập'] },
];

export default function Home() {
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE TABS NAVIGATION ---
  const [activeTab, setActiveTab] = useState<'flashcard' | 'quiz' | 'typing' | 'matching' | 'notebook'>('flashcard');
  
  // --- STATE QUẢN LÝ CHUNG ---
  const [xp, setXp] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficultWordIds, setDifficultWordIds] = useState<number[]>([]);

  // --- STATE CHO CÁC GAME ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [typedWord, setTypedWord] = useState('');
  const [isTypingCorrect, setIsTypingCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // --- STATE GAME NỐI TỪ ---
  const [enCards, setEnCards] = useState<{ id: number; word: string }[]>([]);
  const [viCards, setViCards] = useState<{ id: number; meaning: string }[]>([]);
  const [selectedEn, setSelectedEn] = useState<number | null>(null);
  const [selectedVi, setSelectedVi] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [isMatchError, setIsMatchError] = useState(false);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const savedList = localStorage.getItem('english_vocab_list');
    if (savedList) setVocabList(JSON.parse(savedList));
    else {
      setVocabList(DEFAULT_VOCAB);
      localStorage.setItem('english_vocab_list', JSON.stringify(DEFAULT_VOCAB));
    }
    
    const savedXp = localStorage.getItem('english_app_xp');
    if (savedXp) setXp(parseInt(savedXp));

    const savedDifficults = localStorage.getItem('english_difficult_ids');
    if (savedDifficults) setDifficultWordIds(JSON.parse(savedDifficults));
    
    setLoading(false);
  }, []);

  // Khởi tạo bàn cờ nối từ
  useEffect(() => {
    if (activeTab === 'matching' && vocabList.length > 0) {
      const sampleWords = vocabList.slice(0, 5);
      setEnCards([...sampleWords].map(item => ({ id: item.id, word: item.word })).sort(() => Math.random() - 0.5));
      setViCards([...sampleWords].map(item => ({ id: item.id, meaning: item.meaning })).sort(() => Math.random() - 0.5));
      setSelectedEn(null); setSelectedVi(null); setMatchedIds([]); setIsMatchError(false);
    }
  }, [activeTab, vocabList]);

  // Tự động dọn dẹp form khi chuyển từ vựng hoặc đổi Tab
  useEffect(() => {
    setTypedWord(''); setIsTypingCorrect(null); setShowHint(false); setIsFlipped(false);
  }, [currentIndex, activeTab]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTab]);

  const currentVocab = vocabList[currentIndex];
  const progressPercentage = vocabList.length > 0 ? (currentIndex / vocabList.length) * 100 : 0;

  // Hộp từ khó
  const addToDifficultWords = (id: number) => {
    if (!difficultWordIds.includes(id)) {
      const newList = [...difficultWordIds, id];
      setDifficultWordIds(newList);
      localStorage.setItem('english_difficult_ids', JSON.stringify(newList));
    }
  };

  const removeDifficultWordDirectly = (id: number) => {
    const newList = difficultWordIds.filter(wordId => wordId !== id);
    setDifficultWordIds(newList);
    localStorage.setItem('english_difficult_ids', JSON.stringify(newList));
  };

  const updateXp = (amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      localStorage.setItem('english_app_xp', newXp.toString());
      return newXp;
    });
  };

  const handleFlashcardAnswer = (isLearned: boolean) => {
    if (isLearned) updateXp(10);
    else addToDifficultWords(currentVocab.id);
    nextWord();
  };

  const handleQuizAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    const correct = option === currentVocab.meaning;
    setIsCorrect(correct);
    if (correct) updateXp(15);
    else addToDifficultWords(currentVocab.id);
    setTimeout(() => { setSelectedAnswer(null); setIsCorrect(null); nextWord(); }, 1200);
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWord.trim()) return;
    const isRight = typedWord.trim().toLowerCase() === currentVocab.word.trim().toLowerCase();
    setIsTypingCorrect(isRight);
    if (isRight) {
      updateXp(20);
      setTimeout(() => nextWord(), 1200);
    } else {
      addToDifficultWords(currentVocab.id);
      setTimeout(() => setIsTypingCorrect(null), 1500);
    }
  };

  // --- CÁC HÀM XỬ LÝ CLICK NỐI TỪ (ĐÃ ĐƯỢC BỔ SUNG ĐẦY ĐỦ) ---
  const handleEnCardClick = (id: number) => {
    if (matchedIds.includes(id) || isMatchError) return;
    setSelectedEn(id);
    if (selectedVi !== null) {
      checkMatch(id, selectedVi);
    }
  };

  const handleViCardClick = (id: number) => {
    if (matchedIds.includes(id) || isMatchError) return;
    setSelectedVi(id);
    if (selectedEn !== null) {
      checkMatch(selectedEn, id);
    }
  };

  const checkMatch = (enId: number, viId: number) => {
    if (enId === viId) {
      const newMatched = [...matchedIds, enId];
      setMatchedIds(newMatched); setSelectedEn(null); setSelectedVi(null); updateXp(5);
      if (newMatched.length === Math.min(vocabList.length, 5)) {
        setTimeout(() => {
          alert('🎉 Tuyệt vời! Em đã nối chính xác toàn bộ!');
          updateXp(15);
          setActiveTab('flashcard');
        }, 500);
      }
    } else {
      setIsMatchError(true); addToDifficultWords(enId);
      setTimeout(() => { setSelectedEn(null); setSelectedVi(null); setIsMatchError(false); }, 800);
    }
  };

  const nextWord = () => {
    if (currentIndex < vocabList.length - 1) setCurrentIndex((prev) => prev + 1);
    else { alert(`🎉 Hoàn thành lượt học! Tiếp tục cày game nào!`); setCurrentIndex(0); }
  };

  const speakWord = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">Đang tải đấu trường...</div>;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 font-sans flex flex-col items-center justify-between pb-28 md:pb-6">
      
      {/* HEADER */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          <div>
            <span className="text-xl font-black text-amber-400">{xp} XP</span>
            <span className="text-[10px] text-slate-400 block">Thành tích của em</span>
          </div>
        </div>
        <Link href="/admin" className="bg-slate-700 hover:bg-slate-600 text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-600 text-slate-200 transition-all">
          ⚙️ Quản lý từ (Cho Anh/Chị)
        </Link>
      </div>

      {/* KHU VỰC CHỨA NỘI DUNG FORM GAME */}
      <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center px-2">
        
        {activeTab !== 'matching' && activeTab !== 'notebook' && (
          <div className="w-full max-w-md mb-6">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Tiến độ vòng này</span>
              <span>{currentIndex}/{vocabList.length} từ</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        )}

        {/* TAB 1: FLASHCARD */}
        {activeTab === 'flashcard' && (
          <div className="w-full max-w-md flex flex-col items-center">
            <div onClick={() => setIsFlipped(!isFlipped)} className="w-full h-80 cursor-pointer [perspective:1000px] mb-6">
              <div className={`relative w-full h-full text-center duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                  <div className="flex items-center gap-3"><h2 className="text-4xl font-black">{currentVocab?.word}</h2><button onClick={(e) => speakWord(e, currentVocab?.word)} className="bg-slate-700 p-2 rounded-full text-sm">🔊</button></div>
                  <p className="text-slate-400 italic mt-2">{currentVocab?.ipa}</p>
                </div>
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-indigo-950 border border-indigo-800 shadow-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-3xl font-bold mb-4">{currentVocab?.meaning}</p>
                  <p className="text-xs text-slate-400 italic">"{currentVocab?.example}"</p>
                </div>
              </div>
            </div>
            <div className={`w-full grid grid-cols-2 gap-4 duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <button onClick={() => handleFlashcardAnswer(false)} className="bg-slate-800 border border-slate-700 py-3.5 rounded-xl font-bold text-red-400">❌ Chưa thuộc</button>
              <button onClick={() => handleFlashcardAnswer(true)} className="bg-emerald-600 py-3.5 rounded-xl font-bold">✅ Thuộc rồi (+10XP)</button>
            </div>
          </div>
        )}

        {/* TAB 2: TRẮC NGHIỆM */}
        {activeTab === 'quiz' && (
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2"><h2 className="text-3xl font-black">{currentVocab?.word}</h2><button onClick={(e) => speakWord(e, currentVocab?.word)} className="bg-slate-700 p-1.5 rounded-full text-xs">🔊</button></div>
            </div>
            <div className="flex flex-col gap-3">
              {currentVocab?.options.map((option: string, idx: number) => {
                let btnBg = "bg-slate-900/60 hover:bg-slate-700 border-slate-700";
                if (selectedAnswer === option) btnBg = isCorrect ? "bg-emerald-600 border-emerald-500" : "bg-red-600 border-red-500";
                else if (selectedAnswer && option === currentVocab.meaning) btnBg = "bg-emerald-600 border-emerald-500";
                return <button key={idx} disabled={selectedAnswer !== null} onClick={() => handleQuizAnswer(option)} className={`w-full text-left p-4 rounded-xl font-medium border transition-all ${btnBg}`}>{option}</button>;
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ĐIỀN TỪ */}
        {activeTab === 'typing' && (
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col items-center">
            <h3 className="text-2xl font-black text-white mb-6 text-center">"{currentVocab?.meaning}"</h3>
            <form onSubmit={handleTypingSubmit} className="w-full flex flex-col gap-4">
              <div className="relative">
                <input type="text" autoFocus value={typedWord} disabled={isTypingCorrect === true} onChange={(e) => setTypedWord(e.target.value)} placeholder="Gõ từ tiếng Anh..." className={`w-full bg-slate-900 border text-white rounded-xl p-4 text-center text-xl font-bold tracking-wide outline-none transition-all ${isTypingCorrect === true ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' : isTypingCorrect === false ? 'border-red-500 bg-red-950/20 text-red-400' : 'border-slate-700 focus:border-purple-500'}`} />
                {isTypingCorrect === true && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">🎉 Đúng!</span>}
                {isTypingCorrect === false && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-red-400 font-bold">❌ Sai!</span>}
              </div>
              {showHint ? (
                <div className="text-xs bg-purple-950/40 border border-purple-800/60 p-2.5 rounded-lg text-purple-300 text-center">💡 Bắt đầu bằng: "{currentVocab?.word[0].toUpperCase()}" ({currentVocab?.word.length} chữ cái)</div>
              ) : (
                <button type="button" onClick={() => setShowHint(true)} className="text-xs text-slate-400 hover:text-purple-400 self-center">🔍 Hiện gợi ý?</button>
              )}
              <button type="submit" disabled={!typedWord.trim() || isTypingCorrect === true} className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all ${typedWord.trim() && isTypingCorrect !== true ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-500'}`}>🚀 Kiểm tra kết quả</button>
            </form>
          </div>
        )}

        {/* TAB 4: GAME NỐI TỪ */}
        {activeTab === 'matching' && (
          <div className="w-full bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full">Thử Thách Ghép Đôi</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2.5">
                {enCards.map((card) => {
                  const isMatched = matchedIds.includes(card.id);
                  const isSelected = selectedEn === card.id;
                  let btnStyle = "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700/50";
                  if (isMatched) btnStyle = "bg-slate-900/20 border-slate-850 text-slate-600 line-through opacity-30 pointer-events-none";
                  else if (isSelected) btnStyle = isMatchError ? "bg-red-600 border-red-500 text-white" : "bg-teal-600 border-teal-500 text-white ring-2 ring-teal-400";
                  return <button key={card.id} onClick={() => handleEnCardClick(card.id)} className={`p-3.5 rounded-xl font-bold border text-center transition-all text-sm ${btnStyle}`}>{card.word}</button>;
                })}
              </div>
              <div className="flex flex-col gap-2.5">
                {viCards.map((card) => {
                  const isMatched = matchedIds.includes(card.id);
                  const isSelected = selectedVi === card.id;
                  let btnStyle = "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-700/50";
                  if (isMatched) btnStyle = "bg-slate-900/20 border-slate-850 text-slate-600 line-through opacity-30 pointer-events-none";
                  else if (isSelected) btnStyle = isMatchError ? "bg-red-600 border-red-500 text-white" : "bg-teal-600 border-teal-500 text-white ring-2 ring-teal-400";
                  return <button key={card.id} onClick={() => handleViCardClick(card.id)} className={`p-3.5 rounded-xl font-medium border text-center transition-all text-xs ${btnStyle}`}>{card.meaning}</button>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SỔ TAY */}
        {activeTab === 'notebook' && (
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-black text-red-400 mb-2 flex items-center gap-2">📕 Sổ Tay Từ Khó ({difficultWordIds.length})</h3>
            <p className="text-xs text-slate-400 mb-4">Tổng hợp những từ em từng làm sai. Hãy xóa chúng khi đã thuộc nhé!</p>
            
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {vocabList.filter(item => difficultWordIds.includes(item.id)).map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-white flex items-center gap-2">{item.word} <span className="text-[10px] text-slate-500 font-normal">{item.ipa}</span></span>
                    <span className="text-emerald-400 text-xs mt-0.5 block">{item.meaning}</span>
                  </div>
                  <button onClick={() => removeDifficultWordDirectly(item.id)} className="bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-all">
                    ✓ Đã thuộc
                  </button>
                </div>
              ))}
              {difficultWordIds.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-2">⭐</span>
                  <p className="text-slate-500 text-xs italic">Sổ tay trống trơn. Em không có từ sai nào cả, tuyệt vời!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* THANH ĐIỀU HƯỚNG ĐÁY */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-850/95 border-t border-slate-800 backdrop-blur-md py-3 px-2 flex justify-around items-center z-50 max-w-2xl mx-auto md:rounded-t-2xl md:bottom-4 md:border shadow-2xl">
        
        <button onClick={() => setActiveTab('flashcard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'flashcard' ? 'text-blue-500 scale-105 font-bold' : 'text-slate-400'}`}>
          <span className="text-2xl">📇</span>
          <span className="text-xs">Flashcard</span>
        </button>

        <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'quiz' ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400'}`}>
          <span className="text-2xl">🎮</span>
          <span className="text-xs">Trắc Nghiệm</span>
        </button>

        <button onClick={() => setActiveTab('typing')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'typing' ? 'text-purple-500 scale-105 font-bold' : 'text-slate-400'}`}>
          <span className="text-2xl">⌨️</span>
          <span className="text-xs">Điền Từ</span>
        </button>

        <button onClick={() => setActiveTab('matching')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'matching' ? 'text-teal-500 scale-105 font-bold' : 'text-slate-400'}`}>
          <span className="text-2xl">🔗</span>
          <span className="text-xs">Nối Từ</span>
        </button>

        <button onClick={() => setActiveTab('notebook')} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'notebook' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400'}`}>
          {difficultWordIds.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse border border-slate-900">
              {difficultWordIds.length}
            </span>
          )}
          <span className="text-2xl">📕</span>
          <span className="text-xs">Sổ Tay</span>
        </button>

      </div>

    </main>
  );
}