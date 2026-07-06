'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VocabItem {
  id: number;
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  options: string[];
  topic: string; // Thêm trường lưu tên thư mục chủ đề
}

const DEFAULT_VOCAB = [
  { id: 1, word: 'Gamification', ipa: '/ˌɡeɪmɪfɪˈkeɪʃn/', meaning: 'Trò chơi hóa', example: 'Gamification makes learning English much more fun!', options: ['Trò chơi hóa', 'Sự kiên trì', 'Từ vựng', 'Phát âm'], topic: 'Công nghệ' },
  { id: 2, word: 'Persistent', ipa: '/pəˈsɪstənt/', meaning: 'Kiên trì, bền bỉ', example: 'If you want to master English, you must be persistent.', options: ['Giao tiếp', 'Thất bại', 'Kiên trì, bền bỉ', 'Thông minh'], topic: 'Tính cách' },
];

export default function AdminPage() {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  
  // State Form nhập liệu
  const [word, setWord] = useState('');
  const [ipa, setIpa] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [topic, setTopic] = useState(''); // Ô nhập tên Thư mục/Chủ đề mới
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');

  useEffect(() => {
    const savedList = localStorage.getItem('english_vocab_list');
    if (savedList) setVocabList(JSON.parse(savedList));
    else {
      setVocabList(DEFAULT_VOCAB);
      localStorage.setItem('english_vocab_list', JSON.stringify(DEFAULT_VOCAB));
    }
  }, []);

  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();

    if (!word || !meaning || !optA || !optB || !optC || !optD) {
      alert('Vui lòng điền đủ thông tin bắt buộc và 4 đáp án trắc nghiệm!');
      return;
    }

    const newItem: VocabItem = {
      id: Date.now(),
      word: word.trim(),
      ipa: ipa.trim() || '/.../',
      meaning: meaning.trim(),
      example: example.trim() || 'No example provided.',
      topic: topic.trim() || 'Chủ đề chung', // Nếu để trống sẽ gom vào Thư mục chung
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()]
    };

    const updatedList = [...vocabList, newItem];
    setVocabList(updatedList);
    localStorage.setItem('english_vocab_list', JSON.stringify(updatedList));

    setWord(''); setIpa(''); setMeaning(''); setExample('');
    setOptA(''); setOptB(''); setOptC(''); setOptD('');
    // Giữ lại tên Topic cũ để tiện nhập tiếp nhiều từ cùng một chủ đề
    alert(`🎉 Đã thêm từ mới vào thư mục [${topic.trim() || 'Chủ đề chung'}] thành công!`);
  };

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
            <h1 className="text-3xl font-black text-amber-400">Trang Quản Trị Từ Vựng</h1>
            <p className="text-slate-400 text-sm mt-1">Sắp xếp từ vựng vào các thư mục chủ đề cho em trai học</p>
          </div>
          <Link href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-bold text-sm border border-slate-700">
            🏠 Quay lại Đấu Trường
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORM NHẬP TỪ */}
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 p-5 rounded-2xl h-fit shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">📝 Thêm Từ & Gán Thư Mục</h2>
            <form onSubmit={handleAddVocab} className="flex flex-col gap-4">
              {/* Ô NHẬP TÊN CHỦ ĐỀ/THƯ MỤC */}
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase mb-1">📁 Tên Thư Mục / Chủ Đề</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none font-bold" placeholder="Ví dụ: Động vật, Giao tiếp..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Từ tiếng Anh *</label>
                <input type="text" value={word} onChange={(e) => setWord(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: Elephant" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phiên âm (IPA)</label>
                <input type="text" value={ipa} onChange={(e) => setIpa(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: /ˈelɪfənt/" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nghĩa tiếng Việt *</label>
                <input type="text" value={meaning} onChange={(e) => setMeaning(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" placeholder="Ví dụ: Con voi" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ví dụ đặt câu</label>
                <textarea value={example} onChange={(e) => setExample(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none h-16 resize-none" placeholder="Ví dụ: An elephant is very big." />
              </div>

              <div className="border-t border-slate-700 pt-3">
                <label className="block text-xs font-bold text-orange-400 uppercase mb-2">4 Đáp án trắc nghiệm</label>
                <div className="flex flex-col gap-2">
                  <input type="text" value={optA} onChange={(e) => setOptA(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án A (Nên ghi đáp án đúng)" />
                  <input type="text" value={optB} onChange={(e) => setOptB(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án B" />
                  <input type="text" value={optC} onChange={(e) => setOptC(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án C" />
                  <input type="text" value={optD} onChange={(e) => setOptD(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs outline-none" placeholder="Đáp án D" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-all mt-2 active:scale-95 shadow-lg">
                ➕ Lưu Vào Thư Mục
              </button>
            </form>
          </div>

          {/* DANH SÁCH TỪ ĐANG CÓ */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">📚 Kho Từ Vựng Hệ Thống ({vocabList.length})</h2>
            <div className="flex flex-col gap-3 max-h-[650px] overflow-y-auto pr-2">
              {vocabList.map((item) => (
                <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700/60 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl font-bold text-white">{item.word}</h3>
                      <span className="text-slate-400 text-xs italic">{item.ipa}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">📂 Thư mục: {item.topic || 'Chung'}</span>
                    </div>
                    <p className="text-emerald-400 font-medium text-sm mt-1">Nghĩa: {item.meaning}</p>
                    <p className="text-slate-400 text-xs mt-1 italic">Mẫu: "{item.example}"</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 p-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 active:scale-90">
                    🗑️ Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}