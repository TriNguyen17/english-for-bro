'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const DEFAULT_VOCAB = [
  { id: 1, word: 'Gamification', ipa: '/ˌɡeɪmɪfɪˈkeɪʃn/', meaning: 'Trò chơi hóa', example: 'Gamification makes learning English much more fun!', options: ['Trò chơi hóa', 'Sự kiên trì', 'Từ vựng', 'Phát âm'], topic: 'Công nghệ' },
  { id: 2, word: 'Persistent', ipa: '/pəˈsɪstənt/', meaning: 'Kiên trì, bền bỉ', example: 'If you want to master English, you must be persistent.', options: ['Giao tiếp', 'Thất bại', 'Kiên trì, bền bỉ', 'Thông minh'], topic: 'Tính cách' },
  { id: 3, word: 'Vocabulary', ipa: '/vəˈkæbjəlri/', meaning: 'Từ vựng', example: 'Reading books is a great way to expand your vocabulary.', options: ['Ngữ pháp', 'Từ vựng', 'Từ điển', 'Bài tập'], topic: 'Học tập' },
];

export default function Home() {
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ CHỦ ĐỀ (THƯ MỤC) ---
  const [selectedTopic, setSelectedTopic] = useState(null as string | null);

  // --- STATE TABS NAVIGATION ---
  const [activeTab, setActiveTab] = useState<'flashcard' | 'quiz' | 'typing' | 'matching' | 'playground' | 'notebook'>('flashcard');
  
  // --- STATE QUẢN LÝ CHUNG ---
  const [xp, setXp] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [difficultWordIds, setDifficultWordIds] = useState<number[]>([]);

  // --- STATE CHO CÁC GAME CŨ ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null as string | null);
  const [isCorrect, setIsCorrect] = useState(null as boolean | null);
  const [typedWord, setTypedWord] = useState('');
  const [isTypingCorrect, setIsTypingCorrect] = useState(null as boolean | null);
  const [showHint, setShowHint] = useState(false);

  // --- STATE GAME NỐI TỪ ---
  const [enCards, setEnCards] = useState<{ id: number; word: string }[]>([]);
  const [viCards, setViCards] = useState<{ id: number; meaning: string }[]>([]);
  const [selectedEn, setSelectedEn] = useState(null as number | null);
  const [selectedVi, setSelectedVi] = useState(null as number | null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [isMatchError, setIsMatchError] = useState(false);

  // --- ⚡ STATE GAME ĐẤU TRÙM TIME ATTACK ĐỒNG BỘ SIÊU MƯỢT ⚡ ---
  const [bossGameState, setBossGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [bossHp, setBossHp] = useState(3);
  const [bossTime, setBossTime] = useState(30); // 30 đơn vị tương đương với 3.0 giây chuyên nghiệp
  const [bossCombo, setBossCombo] = useState(0);

  // Tải dữ liệu ban đầu từ bộ nhớ máy
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

  const uniqueTopics = Array.from(new Set(vocabList.map(item => item.topic || 'Chủ đề chung')));
  const filteredVocab = vocabList.filter(item => (item.topic || 'Chủ đề chung') === selectedTopic);
  const currentVocab = filteredVocab[currentIndex];
  const progressPercentage = filteredVocab.length > 0 ? (currentIndex / filteredVocab.length) * 100 : 0;

  // Khởi tạo bàn cờ nối từ
  useEffect(() => {
    if (activeTab === 'matching' && filteredVocab.length > 0) {
      const sampleWords = filteredVocab.slice(0, 5);
      setEnCards([...sampleWords].map(item => ({ id: item.id, word: item.word })).sort(() => Math.random() - 0.5));
      setViCards([...sampleWords].map(item => ({ id: item.id, meaning: item.meaning })).sort(() => Math.random() - 0.5));
      setSelectedEn(null); setSelectedVi(null); setMatchedIds([]); setIsMatchError(false);
    }
  }, [activeTab, selectedTopic, vocabList]);

  // Bộ Refs bảo vệ dữ liệu ngầm tránh xung đột thời gian thực
  const gameStateRef = useRef({ currentIndex, filteredVocab, currentVocab });
  useEffect(() => {
    gameStateRef.current = { currentIndex, filteredVocab, currentVocab };
  }, [currentIndex, filteredVocab, currentVocab]);

  // ⚡ LUỒNG 1: ĐẾM NGƯỢC SIÊU TỐC TẦN SỐ CAO (100MS MỘT LẦN - SIÊU MƯỢT LỤA) ⚡
  useEffect(() => {
    let timer: any;
    if (activeTab === 'playground' && bossGameState === 'playing' && bossTime > 0) {
      timer = setInterval(() => {
        setBossTime((prev) => prev - 1);
      }, 100); // Chạy liên tục mỗi 0.1 giây để đồng bộ mượt mà với thanh đồ họa
    }
    return () => clearInterval(timer);
  }, [activeTab, bossGameState, bossTime]);

  // ⚡ LUỒNG 2: XỬ LÝ SỰ KIỆN HẾT GIỜ KHI ĐỒNG HỒ CHẠM ĐÚNG VẠCH SỐ 0 ⚡
  useEffect(() => {
    if (activeTab === 'playground' && bossGameState === 'playing' && bossTime === 0) {
      const { currentIndex: idx, filteredVocab: currentList, currentVocab: vocab } = gameStateRef.current;
      
      setBossCombo(0); 
      if (vocab) addToDifficultWords(vocab.id);

      setBossHp((prevHp) => {
        const nextHp = prevHp - 1;
        if (nextHp <= 0) {
          setBossGameState('gameover'); 
          return 0;
        }
        
        if (idx < currentList.length - 1) {
          setCurrentIndex(idx + 1); 
        }
        return nextHp;
      });

      setBossTime(30); // Khôi phục đầy 30 đơn vị (3.0 giây) cho từ tiếp theo
    }
  }, [bossTime, activeTab, bossGameState]); 

  useEffect(() => {
    setTypedWord(''); setIsTypingCorrect(null); setShowHint(false); setIsFlipped(false);
  }, [currentIndex, activeTab]);

  useEffect(() => {
    setCurrentIndex(0);
    setBossGameState('idle');
  }, [activeTab, selectedTopic]);

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

  const handleEnCardClick = (id: number) => {
    if (matchedIds.includes(id) || isMatchError) return;
    setSelectedEn(id);
    if (selectedVi !== null) checkMatch(id, selectedVi);
  };

  const handleViCardClick = (id: number) => {
    if (matchedIds.includes(id) || isMatchError) return;
    setSelectedVi(id);
    if (selectedEn !== null) checkMatch(selectedEn, id);
  };

  const checkMatch = (enId: number, viId: number) => {
    if (enId === viId) {
      const newMatched = [...matchedIds, enId];
      setMatchedIds(newMatched); setSelectedEn(null); setSelectedVi(null); updateXp(5);
      if (newMatched.length === Math.min(filteredVocab.length, 5)) {
        setTimeout(() => {
          alert(`🎉 Tuyệt vời! Bạn đã ghép chính xác hoàn toàn!`);
          updateXp(15);
          setActiveTab('flashcard');
        }, 500);
      }
    } else {
      setIsMatchError(true); addToDifficultWords(enId);
      setTimeout(() => { setSelectedEn(null); setSelectedVi(null); setIsMatchError(false); }, 800);
    }
  };

  // ⚡ LOGIC CHỦ ĐỘNG CHỌN ĐÁP ÁN ĐẤU TRÙM ⚡
  const handleBossAnswer = (option: string) => {
    if (bossGameState !== 'playing') return;
    const isRight = option === currentVocab.meaning;
    
    if (isRight) {
      const newCombo = bossCombo + 1;
      setBossCombo(newCombo);
      updateXp(10 + newCombo * 2); 
      
      // Đúng được cộng +1 giây (+10 đơn vị), kịch khung không quá 30 đơn vị (3s)
      setBossTime((prev) => Math.min(prev + 10, 30));
      
      if (currentIndex < filteredVocab.length - 1) {
        setBossTime(30); // Sang từ mới nạp đầy lại thanh 3s
        setCurrentIndex((prev) => prev + 1);
      } else {
        setBossGameState('victory');
        updateXp(50);
      }
    } else {
      setBossCombo(0);
      addToDifficultWords(currentVocab.id);
      
      setBossHp((prevHp) => {
        const nextHp = prevHp - 1;
        if (nextHp <= 0) {
          setBossGameState('gameover');
          return 0;
        }
        
        setBossTime(30); // Còn mạng nạp lại đầy 3s chơi tiếp câu này
        if (currentIndex < filteredVocab.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
        return nextHp;
      });
    }
  };

  const startBossFight = () => {
    setCurrentIndex(0);
    setBossHp(3);
    setBossTime(30); // Khởi chạy ở mức tối đa 30 đơn vị
    setBossCombo(0);
    setBossGameState('playing');
  };

  const nextWord = () => {
    if (currentIndex < filteredVocab.length - 1) setCurrentIndex((prev) => prev + 1);
    else { alert(`🎉 Hoàn thành trọn vẹn từ vựng của chủ đề [${selectedTopic}]!`); setCurrentIndex(0); }
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
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div>
            <span className="text-xl font-black text-amber-400">{xp} XP</span>
            <span className="text-[10px] text-slate-400 block">Thành tích của bạn</span>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedTopic && (
            <button onClick={() => setSelectedTopic(null)} className="bg-slate-700 hover:bg-slate-600 text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-600">
              📁 Đổi Chủ Đề
            </button>
          )}
          <Link href="/admin" className="bg-slate-700 hover:bg-slate-600 text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-600 text-slate-200">
            ⚙️ Quản lý (Admin)
          </Link>
        </div>
      </div>

      {/* THƯ MỤC CHỦ ĐỀ */}
      {!selectedTopic ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center py-6">
          <h2 className="text-2xl font-black mb-2 text-center text-amber-400">📚 Đấu Trường Từ Vựng</h2>
          <p className="text-slate-400 text-sm mb-8 text-center">Hãy chọn một thư mục chủ đề bên dưới để bắt đầu luyện game!</p>
          
          <div className="grid grid-cols-2 gap-4 w-full px-2">
            {uniqueTopics.map((topicName, index) => {
              const count = vocabList.filter(item => (item.topic || 'Chủ đề chung') === topicName).length;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedTopic(topicName)}
                  className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 p-5 rounded-2xl flex flex-col items-center text-center gap-3 transition-all active:scale-95 group shadow-xl"
                >
                  <span className="text-5xl group-hover:scale-110 transition-transform">📁</span>
                  <div>
                    <h3 className="font-black text-base text-white tracking-wide">{topicName}</h3>
                    <span className="text-xs text-slate-400 mt-1 block bg-slate-900/50 px-2 py-0.5 rounded-full font-mono">{count} từ vựng</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // GIAO DIỆN CHỦ ĐỀ
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center px-2">
          
          <div className="text-center mb-4">
            <span className="text-xs font-bold uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Chủ đề: {selectedTopic}
            </span>
          </div>

          {activeTab !== 'matching' && activeTab !== 'playground' && activeTab !== 'notebook' && filteredVocab.length > 0 && (
            <div className="w-full max-w-md mb-6">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Tiến độ chủ đề này</span>
                <span>{currentIndex}/{filteredVocab.length} từ</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          )}

          {/* FLASHCARD */}
          {activeTab === 'flashcard' && filteredVocab.length > 0 && (
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

          {/* TRẮC NGHIỆM */}
          {activeTab === 'quiz' && filteredVocab.length > 0 && (
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

          {/* CHÍNH TẢ */}
          {activeTab === 'typing' && filteredVocab.length > 0 && (
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

          {/* NỐI TỪ */}
          {activeTab === 'matching' && filteredVocab.length > 0 && (
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

          {/* ================= ⚡ TAB 5: ĐẤU TRÙM TIME ATTACK 3 GIÂY ĐỒNG BỘ TUYỆT ĐỐI ⚡ ================= */}
          {activeTab === 'playground' && filteredVocab.length > 0 && (
            <div className="w-full max-w-md bg-slate-850 border border-slate-700 p-6 rounded-2xl shadow-2xl flex flex-col items-center bg-slate-800/60 backdrop-blur-sm">
              
              {/* CHỜ CHƠI */}
              {bossGameState === 'idle' && (
                <div className="text-center py-6">
                  <span className="text-5xl block mb-4 animate-pulse">🔥</span>
                  <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest">ĐẤU TRÙM TỐC ĐỘ 3S</h3>
                  <p className="text-slate-400 text-sm mt-3 px-4 leading-relaxed">
                    Chế độ sinh tử cực hạn! Bạn chỉ có đúng <span className="text-red-400 font-bold">3 giây</span> để chọn. Mất hết trái tim mới bại trận, hết thời gian chỉ trừ mạng chứ không trực tiếp thua cuộc nha!
                  </p>
                  <button onClick={startBossFight} className="mt-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-base font-black px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/40">
                    ⚔️ KHIÊU CHIẾN NGAY
                  </button>
                </div>
              )}

              {/* ĐANG CHƠI */}
              {bossGameState === 'playing' && currentVocab && (
                <div className="w-full flex flex-col items-center">
                  
                  {/* HP & Combo */}
                  <div className="w-full flex justify-between items-center mb-4 border-b border-slate-700/50 pb-3">
                    <div className="text-lg tracking-wider">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={`text-xl inline-block mr-1 transition-all ${i < bossHp ? 'scale-100 opacity-100' : 'scale-75 opacity-15 grayscale'}`}>❤️</span>
                      ))}
                    </div>
                    {bossCombo > 0 && (
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-bounce">
                        🔥 Combo x{bossCombo}
                      </div>
                    )}
                  </div>

                  {/* 🌟 THANH THỜI GIAN CO RÚT SIÊU MƯỢT ĐỒNG BỘ CHU KỲ 100MS 🌟 */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-6 border border-slate-800 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-100 ease-linear" 
                      style={{ width: `${(bossTime / 30) * 100}%` }}
                    ></div>
                  </div>

                  {/* TỪ VỰNG */}
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-black tracking-wide text-white drop-shadow-md">{currentVocab.word}</h2>
                  </div>

                  {/* ĐÁP ÁN */}
                  <div className="flex flex-col gap-2.5 w-full">
                    {currentVocab.options.map((option: string, idx: number) => (
                      <button 
                        key={idx} 
                        onClick={() => handleBossAnswer(option)} 
                        className="w-full text-left p-4 rounded-xl font-bold bg-slate-900 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-sm transition-all active:scale-98 shadow-md"
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 text-[10px] font-mono text-slate-500">
                    Mức từ: {currentIndex + 1} / {filteredVocab.length}
                  </div>
                </div>
              )}

              {/* GAME OVER */}
              {bossGameState === 'gameover' && (
                <div className="text-center py-6">
                  <span className="text-6xl block mb-4">💀</span>
                  <h3 className="text-2xl font-black text-red-500 uppercase tracking-wider">BẠN ĐÃ BỊ HẠ GỤC</h3>
                  <p className="text-slate-400 text-xs mt-2 px-2">Hết mạng! Tốc độ dồn dập đã vắt kiệt trái tim của bạn. Luyện tập lại thôi nào.</p>
                  <div className="flex gap-3 justify-center mt-8">
                    <button onClick={startBossFight} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all">
                      🔄 Chơi Lại
                    </button>
                    <button onClick={() => setBossGameState('idle')} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold text-sm transition-all">
                      📁 Thư Mục
                    </button>
                  </div>
                </div>
              )}

              {/* VICTORY */}
              {bossGameState === 'victory' && (
                <div className="text-center py-6">
                  <span className="text-6xl block mb-4">👑</span>
                  <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest">THẦN PHẢN XẠ 3S</h3>
                  <p className="text-slate-400 text-xs mt-2 px-4 leading-relaxed">Bạn sở hữu bộ não game thủ siêu cấp! Đã chinh phục thành công chế độ khó nhất.</p>
                  <p className="text-emerald-400 font-black text-sm mt-3 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1 rounded-xl">🎁 Thưởng vô địch: +50 XP!</p>
                  <button onClick={() => setBossGameState('idle')} className="mt-8 bg-blue-600 hover:bg-blue-500 px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg">
                    🏁 Hoàn Thành Trận Đấu
                  </button>
                </div>
              )}

            </div>
          )}

          {/* SỔ TAY TỪ KHÓ */}
          {activeTab === 'notebook' && (
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-black text-red-400 mb-2 flex items-center gap-2">📕 Sổ Tay Từ Khó ({difficultWordIds.length})</h3>
              <p className="text-xs text-slate-400 mb-4">Tổng hợp từ làm sai từ tất cả các chủ đề.</p>
              
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {vocabList.filter(item => difficultWordIds.includes(item.id)).map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        {item.word} <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{item.topic || 'Chung'}</span>
                      </span>
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
                    <p className="text-slate-500 text-xs italic">Sổ tay trống trơn. Bạn học siêu quá!</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MENU ĐÁY */}
      {selectedTopic && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-850/95 border-t border-slate-800 backdrop-blur-md py-3 px-1 flex justify-around items-center z-50 max-w-2xl mx-auto md:rounded-t-2xl md:bottom-4 md:border shadow-2xl">
          <button onClick={() => setActiveTab('flashcard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'flashcard' ? 'text-blue-500 scale-105 font-bold' : 'text-slate-400'}`}>
            <span className="text-2xl">📇</span><span className="text-[10px]">Thẻ từ</span>
          </button>
          <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'quiz' ? 'text-orange-500 scale-105 font-bold' : 'text-slate-400'}`}>
            <span className="text-2xl">🎮</span><span className="text-[10px]">Trắc nghiệm</span>
          </button>
          <button onClick={() => setActiveTab('typing')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'typing' ? 'text-purple-500 scale-105 font-bold' : 'text-slate-400'}`}>
            <span className="text-2xl">⌨️</span><span className="text-[10px]">Chính tả</span>
          </button>
          <button onClick={() => setActiveTab('matching')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'matching' ? 'text-teal-500 scale-105 font-bold' : 'text-slate-400'}`}>
            <span className="text-2xl">🔗</span><span className="text-[10px]">Nối từ</span>
          </button>
          <button onClick={() => setActiveTab('playground')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'playground' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400'}`}>
            <span className="text-2xl">⚡</span><span className="text-[10px] text-red-400 font-bold">Đấu Trùm</span>
          </button>
          <button onClick={() => setActiveTab('notebook')} className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'notebook' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400'}`}>
            {difficultWordIds.length > 0 && <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">{difficultWordIds.length}</span>}
            <span className="text-2xl">📕</span><span className="text-[10px]">Sổ Tay</span>
          </button>
        </div>
      )}

    </main>
  );
}