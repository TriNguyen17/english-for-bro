'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu cho Từ vựng
interface VocabItem {
  id: number;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  options: string[];
}

const DEFAULT_VOCAB = [
  { id: 1, word: 'Gamification', ipa: '/ˌɡeɪmɪfɪˈkeɪʃn/', meaning: 'Trò chơi hóa', example: 'Gamification makes learning English much more fun!', options: ['Trò chơi hóa', 'Sự kiên trì', 'Từ vựng', 'Phát âm'] },
  { id: 2, word: 'Persistent', ipa: '/pəˈsɪstənt/', meaning: 'Kiên trì, bền bỉ', example: 'If you want to master English, you must be persistent.', options: ['Giao tiếp', 'Thất bại', 'Kiên trì, bền bỉ', 'Thông minh'] },
];

export default function AdminPage() {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  
  // State quản lý các ô nhập liệu (Form)
  const [word, setWord] = useState('');
  const [ipa, setIpa] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');

  // Tải danh sách từ vựng hiện tại từ LocalStorage
  useEffect(() => {
    const savedList = localStorage.getItem('english_vocab_list');
    if (savedList) {
      setVocabList(JSON.parse(savedList));
    } else {
      setVocabList(DEFAULT_VOCAB);
      localStorage.setItem('english_vocab_list', JSON.stringify(DEFAULT_VOCAB));
    }
  }, []);

  // Hàm xử lý khi bấm nút "Thêm từ vựng"
  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();

    if (!word || !meaning || !optA || !optB || !optC || !optD) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc và đủ 4 đáp án trắc nghiệm!');
      return;
    }

    const newItem: VocabItem = {
      id: Date.now(), // Tạo id duy nhất bằng timestamp
      word: word.trim(),
      ipa: ipa.trim() || '/.../',
      meaning: meaning.trim(),
      example: example.trim() || 'No example provided.',
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()]
    };

    const updatedList = [...vocabList, newItem];
    setVocabList(updatedList);
    localStorage.setItem('english_vocab_list', JSON.stringify(updatedList));

    // Reset sạch các ô nhập liệu sau khi thêm thành công
    setWord(''); setIpa(''); setMeaning(''); setExample('');
    setOptA(''); setOptB(''); setOptC(''); setOptD('');
    alert('🎉 Thêm từ vựng mới thành công!');
  };

  // Hàm xóa một từ vựng
  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) {
      const updatedList = vocabList.filter(item => item.id !== id);
      setVocabList(updatedList);
      localStorage.setItem('english_vocab_list', JSON.stringify(updatedList));
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-amber-400">Trang Quản Trị (Admin Panel)</h1>
            <p className="text-slate-400 text-sm mt-1">Thêm và quản lý kho từ vựng cho ứng dụng game của bạn</p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-bold text-sm transition-all border border-slate-700">
            🏠 Quay lại Trang Học
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT FORM THÊM TỪ MỚI */}
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl h-fit shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">📝 Thêm Từ Mới</h2>
            <form onSubmit={handleAddVocab} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Từ tiếng Anh *</label>
                <input type="text" value={word} onChange={(e) => setWord(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: Brilliant" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phiên âm (IPA)</label>
                <input type="text" value={ipa} onChange={(e) => setIpa(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: /ˈbrɪliənt/" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nghĩa tiếng Việt *</label>
                <input type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: Lỗi lạc, thông minh" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ví dụ đặt câu</label>
                <textarea value={example} onChange={(e) => setExample(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none h-16 resize-none" placeholder="Ví dụ: She has a brilliant mind." />
              </div>

              <div className="border-t border-slate-700 pt-3 mt-1">
                <label className="block text-xs font-bold text-orange-400 uppercase mb-2">4 Đáp án cho game trắc nghiệm</label>
                <div className="flex flex-col gap-2">
                  <input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án A (Nên chứa đáp án ĐÚNG)" />
                  <input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án B (Đáp án nhiễu)" />
                  <input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án C (Đáp án nhiễu)" />
                  <input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án D (Đáp án nhiễu)" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all mt-2 active:scale-95 shadow-lg shadow-blue-900/20">
                ➕ Lưu Vào Kho Game
              </button>
            </form>
          </div>

          {/* CỘT DANH SÁCH TỪ ĐANG CÓ */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center justify-between">
              <span>📚 Danh Sách Từ Vựng ({vocabList.length})</span>
            </h2>
            
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
              {vocabList.map((item) => (
                <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700/60 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl font-bold text-white">{item.word}</h3>
                      <span className="text-slate-400 text-xs italic">{item.ipa}</span>
                    </div>
                    <p className="text-emerald-400 font-medium text-sm mt-1">Nghĩa: {item.meaning}</p>
                    <p className="text-slate-400 text-xs mt-1 italic">Mẫu: "{item.example}"</p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {item.options.map((opt, i) => (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-mono ${opt === item.meaning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 active:scale-90">
                    🗑️ Xóa
                  </button>
                </div>
              ))}
              {vocabList.length === 0 && (
                <p className="text-slate-500 text-center py-8 italic">Kho từ vựng trống trơn. Hãy thêm từ ở bên cạnh!</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}