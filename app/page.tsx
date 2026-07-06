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

  // --- STATE QUẢN LÝ CHUNG ---
  const [mode, setMode] = useState<'flashcard' | 'quiz' | 'typing' | 'mistakes'>('flashcard');
  const [xp, setXp] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- STATE DANH SÁCH TỪ KHÓ (MISTAKES) ---
  const [difficultWordIds, setDifficultWordIds] = useState<number[]>([]);

  // --- STATE PHỤ CHO CÁC GAME ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [typedWord, setTypedWord] = useState('');
  const [isTypingCorrect, setIsTypingCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  // 1. TẢI TOÀN BỘ DỮ LIỆU TỪ LOCALSTORAGE KHI VÀO WEB
  useEffect(() => {
    const savedList = localStorage.getItem('english_vocab_list');
    if (savedList) setVocabList(JSON.parse(savedList));
    else {
      setVocabList(DEFAULT_VOCAB);
      localStorage.setItem('english_vocab_list', JSON.stringify(DEFAULT_VOCAB));
    }
    
    const savedXp = localStorage.getItem('english_app_xp');
    if (savedXp) setXp(parseInt(savedXp));

    // Tải danh sách ID các từ làm sai từ trước (nếu có)
    const savedDifficults = localStorage.getItem('english_difficult_ids');
    if (savedDifficults) setDifficultWordIds(JSON.parse(savedDifficults));
    
    setLoading(false);
  }, []);

  // 2. LỌC DANH SÁCH TỪ VỰNG DỰA TRÊN CHẾ ĐỘ HỌC
  // Nếu ở chế độ 'mistakes', chỉ lấy những từ có ID nằm trong danh sách đen
  const activeList = mode === 'mistakes' 
    ? vocabList.filter(item => difficultWordIds.includes(item.id))
    : vocabList;

  const currentVocab = activeList[currentIndex];
  const progressPercentage = activeList.length > 0 ? (currentIndex / activeList.length) * 100 : 0;

  // Tự động dọn dẹp ô nhập liệu khi đổi từ
  useEffect(() => {
    setTypedWord('');
    setIsTypingCorrect(null);
    setShowHint(false);
    setIsFlipped(false);
  }, [currentIndex, mode]);

  // Tự động nhảy về từ đầu tiên nếu danh sách ôn tập bị thay đổi độ dài
  useEffect(() => {
    setCurrentIndex(0);
  }, [mode]);

  // 3. LOGIC HỘP TỪ KHÓ (THÊM / XÓA KHỎI DANH SÁCH ĐEN)
  const addToDifficultWords = (id: number) => {
    if (!difficultWordIds.includes(id)) {
      const newList = [...difficultWordIds, id];
      setDifficultWordIds(newList);
      localStorage.setItem('english_difficult_ids', JSON.stringify(newList));
    }
  };

  const removeFromDifficultWords = (id: number) => {
    const newList = difficultWordIds.filter(wordId => wordId !== id);
    setDifficultWordIds(newList);
    localStorage.setItem('english_difficult_ids', JSON.stringify(newList));
    alert('✨ Xuất sắc! Từ này đã được xóa khỏi danh sách từ khó!');
  };

  const updateXp = (amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      localStorage.setItem('english_app_xp', newXp.toString());
      return newXp;
    });
  };

  // 4. XỬ LÝ KẾT QUẢ CÁC BÀI HỌC
  const handleFlashcardAnswer = (isLearned: boolean) => {
    if (isLearned) {
      updateXp(10);
      if (mode === 'mistakes') removeFromDifficultWords(currentVocab.id);
    } else {
      addToDifficultWords(currentVocab.id); // Ghi sớ táo quân nếu chọn chưa thuộc
    }
    nextWord();
  };

  const handleQuizAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    const correct = option === currentVocab.meaning;
    setIsCorrect(correct);

    if (correct) {
      updateXp(15);
      if (mode === 'mistakes') removeFromDifficultWords(currentVocab.id);
    } else {
      addToDifficultWords(currentVocab.id); // Chọn sai trắc nghiệm -> phạt vào hộp từ khó
    }

    setTimeout(() => { setSelectedAnswer(null); setIsCorrect(null); nextWord(); }, 1200);
  };

  const handleTypingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedWord.trim()) return;
    const isRight = typedWord.trim().toLowerCase() === currentVocab.word.trim().toLowerCase();
    setIsTypingCorrect(isRight);

    if (isRight) {
      updateXp(20);
      if (mode === 'mistakes') removeFromDifficultWords(currentVocab.id);
      setTimeout(() => nextWord(), 1200);
    } else {
      addToDifficultWords(currentVocab.id); // Gõ sai chính tả -> phạt tiếp
      setTimeout(() => setIsTypingCorrect(null), 1500);
    }
  };

  const nextWord = () => {
    if (currentIndex < activeList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert(`🎉 Hoàn thành lượt học này rồi!`);
      setCurrentIndex(0);
    }
  };

  const speakWord = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold">Đang tải vũ trụ từ vựng...</div>;
  if (vocabList.length === 0) return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-4">
      <p className="text-slate-400 italic">Kho từ vựng trống, hãy bảo anh/chị vào Admin thêm từ nhé!</p>
      <Link href="/admin" className="bg-blue-600 px-6 py-3 rounded-xl font-bold">⚙️ Vào trang Admin</Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 font-sans flex flex-col items-center">
      
      {/* NÚT ADMIN */}
      <div className="w-full max-w-6xl flex justify-end mb-4">
        <Link href="/admin" className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 text-slate-300 transition-all">
          ⚙️ Cài đặt từ vựng (Cho Anh/Chị)
        </Link>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ================= CỘT TRÁI: KHU VỰC CHƠI GAME ================= */}
        <div className="lg:col-span-2 flex flex-col items-center bg-slate-800/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
          
          {/* NAV ĐỔI CHẾ ĐỘ HỌC */}
          <div className="flex bg-slate-800 p-1 rounded-xl mb-6 border border-slate-700 shadow-md flex-wrap gap-1 justify-center">
            <button onClick={() => setMode('flashcard')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'flashcard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>📇 Flashcard</button>
            <button onClick={() => setMode('quiz')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'quiz' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>🎮 Trắc Nghiệm</button>
            <button onClick={() => setMode('typing')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'typing' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>⌨️ Điền Từ</button>
            
            {/* Nút Hộp từ khó (Chỉ nổi bật khi có từ sai) */}
            <button 
              onClick={() => {
                if (difficultWordIds.length === 0) {
                  alert('🎉 Tuyệt vời! Hiện tại em không có từ khó nào cần ôn tập cả. Hãy tiếp tục giữ vững phong độ nhé!');
                  return;
                }
                setMode('mistakes');
              }} 
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-1.5
                ${mode === 'mistakes' ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : 'text-red-400 hover:bg-red-500/10'}`}
            >
              🔥 Ôn Từ Khó ({difficultWordIds.length})
            </button>
          </div>

          {/* TIẾN ĐỘ VÒNG HỌC */}
          {activeList.length > 0 && (
            <div className="w-full max-w-md mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{mode === 'mistakes' ? 'Tiến độ diệt từ khó' : 'Tiến độ vòng này'}</span>
                <span>{currentIndex}/{activeList.length} từ</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                <div className={`h-full bg-gradient-to-r transition-all duration-300 ${mode === 'mistakes' ? 'from-red-500 to-orange-400' : 'from-emerald-500 to-green-400'}`} style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          )}

          {/* NẾU HỘP TỪ KHÓ TRỐNG MÀ LỠ BẤM VÀO */}
          {activeList.length === 0 && mode === 'mistakes' && (
            <div className="text-center py-12 bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700">
              <span className="text-5xl block mb-4">🎉</span>
              <h3 className="text-xl font-bold text-emerald-400">Sạch bóng quân thù!</h3>
              <p className="text-slate-400 text-sm mt-2">Em đã hoàn thành xuất sắc việc sửa toàn bộ các từ vựng làm sai trước đó.</p>
              <button onClick={() => setMode('flashcard')} className="mt-6 bg-blue-600 px-5 py-2.5 rounded-xl font-bold text-sm">Quay lại học từ mới</button>
            </div>
          )}

          {/* HIỂN THỊ NỘI DUNG GAME (CHỈ HIỆN KHI CÓ TỪ ĐỂ HỌC) */}
          {activeList.length > 0 && (
            <>
              {/* CHẾ ĐỘ: FLASHCARD HOẶC ÔN TỪ KHÓ DẠNG LẬT THẺ */}
              {(mode === 'flashcard' || mode === 'mistakes') && (
                <div className="w-full max-w-md flex flex-col items-center">
                  <div onClick={() => setIsFlipped(!isFlipped)} className="w-full h-80 cursor-pointer [perspective:1000px] mb-6">
                    <div className={`relative w-full h-full text-center duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                      <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                        {mode === 'mistakes' && <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full mb-3 border border-red-500/20">Cần xử lý gấp ⚠️</span>}
                        <div className="flex items-center gap-3"><h2 className="text-4xl font-black">{currentVocab.word}</h2><button onClick={(e) => speakWord(e, currentVocab.word)} className="bg-slate-700 p-2 rounded-full text-sm">🔊</button></div>
                        <p className="text-slate-400 italic mt-2">{currentVocab.ipa}</p>
                      </div>
                      <div className="absolute inset-0 w-full h-full rounded-2xl bg-indigo-950 border border-indigo-800 shadow-2xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <p className="text-3xl font-bold mb-4">{currentVocab.meaning}</p>
                        <p className="text-xs text-slate-400 italic">"{currentVocab.example}"</p>
                      </div>
                    </div>
                  </div>
                  <div className={`w-full grid grid-cols-2 gap-4 duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => handleFlashcardAnswer(false)} className="bg-slate-800 border border-slate-700 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/5">❌ Chưa thuộc</button>
                    <button onClick={() => handleFlashcardAnswer(true)} className="bg-emerald-600 py-3 rounded-xl font-bold">{mode === 'mistakes' ? '✨ Đã thuộc (Xóa)' : '✅ Thuộc rồi (+10XP)'}</button>
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ: TRẮC NGHIỆM */}
              {mode === 'quiz' && (
                <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2"><h2 className="text-3xl font-black">{currentVocab.word}</h2><button onClick={(e) => speakWord(e, currentVocab.word)} className="bg-slate-700 p-1.5 rounded-full text-xs">🔊</button></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {currentVocab.options.map((option: string, idx: number) => {
                      let btnBg = "bg-slate-700 hover:bg-slate-600";
                      if (selectedAnswer === option) btnBg = isCorrect ? "bg-emerald-600" : "bg-red-600";
                      else if (selectedAnswer && option === currentVocab.meaning) btnBg = "bg-emerald-600";
                      return <button key={idx} disabled={selectedAnswer !== null} onClick={() => handleQuizAnswer(option)} className={`w-full text-left p-4 rounded-xl font-medium transition-all ${btnBg}`}>{option}</button>;
                    })}
                  </div>
                </div>
              )}

              {/* CHẾ ĐỘ: ĐIỀN TỪ */}
              {mode === 'typing' && (
                <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col items-center">
                  <h3 className="text-2xl font-black text-white mb-6 text-center">"{currentVocab.meaning}"</h3>
                  <form onSubmit={handleTypingSubmit} className="w-full flex flex-col gap-4">
                    <div className="relative">
                      <input type="text" autoFocus value={typedWord} disabled={isTypingCorrect === true} onChange={(e) => setTypedWord(e.target.value)} placeholder="Gõ từ tiếng Anh..." className={`w-full bg-slate-900 border text-white rounded-xl p-4 text-center text-xl font-bold tracking-wide outline-none transition-all ${isTypingCorrect === true ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' : isTypingCorrect === false ? 'border-red-500 bg-red-950/20 text-red-400' : 'border-slate-700 focus:border-purple-500'}`} />
                      {isTypingCorrect === true && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-400 font-bold">🎉 Đúng!</span>}
                      {isTypingCorrect === false && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-400 font-bold">❌ Sai!</span>}
                    </div>
                    {showHint ? (
                      <div className="text-xs bg-purple-950/40 border border-purple-800/60 p-2 rounded-lg text-purple-300 text-center">💡 Bắt đầu bằng: "{currentVocab.word[0].toUpperCase()}" ({currentVocab.word.length} chữ cái)</div>
                    ) : (
                      <button type="button" onClick={() => setShowHint(true)} className="text-xs text-slate-400 hover:text-purple-400 self-center">🔍 Hiện gợi ý?</button>
                    )}
                    <button type="submit" disabled={!typedWord.trim() || isTypingCorrect === true} className={`w-full font-bold py-3 rounded-xl text-sm transition-all ${typedWord.trim() && isTypingCorrect !== true ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-500'}`}>🚀 Kiểm tra</button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>

        {/* ================= CỘT PHẢI: TỔNG QUAN HỒ SƠ CỦA EM TRAI ================= */}
        <div className="flex flex-col gap-6">
          
          {/* KHỐI KINH NGHIỆM */}
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thành tích của em</h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl">💎</span>
              <div>
                <div className="text-2xl font-black text-amber-400">{xp} XP</div>
                <p className="text-xs text-slate-400">Điểm số tích lũy từ trước tới nay</p>
              </div>
            </div>
          </div>

          {/* KHỐI CHI TIẾT DANH SÁCH TỪ KHÓ */}
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              📋 Danh sách từ hay quên ({difficultWordIds.length})
            </h3>
            
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {vocabList.filter(item => difficultWordIds.includes(item.id)).map((item) => (
                <div key={item.id} className="bg-slate-900/60 border border-slate-700/60 p-2.5 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-white block">{item.word}</span>
                    <span className="text-slate-400 text-xs">{item.meaning}</span>
                  </div>
                  <span className="text-xs">⚠️</span>
                </div>
              ))}
              {difficultWordIds.length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-4">Chưa có từ nào bị liệt vào danh sách đen. Quá giỏi!</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}