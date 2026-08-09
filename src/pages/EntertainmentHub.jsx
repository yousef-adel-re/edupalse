// src/pages/EntertainmentHub.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Sparkles, Gamepad2, Brain, Play, RefreshCw, X, 
  RotateCcw, Trophy, CheckCircle, HelpCircle, Plus, Loader2, Code2, Flame, Shield, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { callAzureAI } from '../lib/ai';

// -----------------------------------------------------------------------------
// 1. لعبة XO (Tic Tac Toe) مع 3 مستويات صعوبة
// -----------------------------------------------------------------------------
const XOGame = ({ difficulty = 'medium' }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [vsAI, setVsAI] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState(null);

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every(Boolean)) return { winner: 'DRAW', line: [] };
    return null;
  };

  const handleClick = (index) => {
    if (board[index] || winnerInfo) return;
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    const win = checkWinner(newBoard);
    if (win) {
      setWinnerInfo(win);
      return;
    }
    setIsXNext(!isXNext);

    if (vsAI && isXNext) {
      setTimeout(() => makeAIMove(newBoard), 400);
    }
  };

  const makeAIMove = (currentBoard) => {
    const emptyIndices = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0 || checkWinner(currentBoard)) return;

    let targetIndex = null;

    if (difficulty === 'easy') {
      // عشوائي تماماً
      targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else if (difficulty === 'medium') {
      // 50% يمنع الفوز و 50% عشوائي
      const winMove = findBestWinOrBlock(currentBoard, 'O') || findBestWinOrBlock(currentBoard, 'X');
      if (winMove !== null && Math.random() > 0.4) {
        targetIndex = winMove;
      } else {
        targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    } else {
      // صعب: ذكي جداً يبحث عن الفوز ثم المنع ثم الأماكن الاستراتيجية
      const winMove = findBestWinOrBlock(currentBoard, 'O');
      const blockMove = findBestWinOrBlock(currentBoard, 'X');
      if (winMove !== null) targetIndex = winMove;
      else if (blockMove !== null) targetIndex = blockMove;
      else if (currentBoard[4] === null) targetIndex = 4; // السنتر
      else {
        const corners = [0, 2, 6, 8].filter(c => currentBoard[c] === null);
        if (corners.length > 0) targetIndex = corners[Math.floor(Math.random() * corners.length)];
        else targetIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      }
    }

    const aiBoard = [...currentBoard];
    aiBoard[targetIndex] = 'O';
    setBoard(aiBoard);
    const win = checkWinner(aiBoard);
    if (win) setWinnerInfo(win);
    else setIsXNext(true);
  };

  const findBestWinOrBlock = (b, player) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, bIdx, c] of lines) {
      const vals = [b[a], b[bIdx], b[c]];
      const countPlayer = vals.filter(v => v === player).length;
      const countNull = vals.filter(v => v === null).length;
      if (countPlayer === 2 && countNull === 1) {
        if (b[a] === null) return a;
        if (b[bIdx] === null) return bIdx;
        if (b[c] === null) return c;
      }
    }
    return null;
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex gap-4 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
        <button onClick={() => { setVsAI(true); resetGame(); }} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${vsAI ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>ضد الذكاء الاصطناعي 🤖</button>
        <button onClick={() => { setVsAI(false); resetGame(); }} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!vsAI ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}>لاعبين 👥</button>
      </div>

      <div className="text-xl font-black dark:text-white">
        {winnerInfo ? (winnerInfo.winner === 'DRAW' ? 'تعادل! 🤝' : `الفائز هو: ${winnerInfo.winner} 🎉`) : `الدور على: ${isXNext ? 'X' : 'O'}`}
      </div>

      <div className="grid grid-cols-3 gap-3 w-64 md:w-80 h-64 md:h-80">
        {board.map((val, idx) => (
          <button key={idx} onClick={() => handleClick(idx)} className={`rounded-2xl text-4xl md:text-5xl font-black flex items-center justify-center transition-all border-2 ${val === 'X' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30' : val === 'O' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30' : 'bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-800 hover:border-blue-400'}`}>
            {val}
          </button>
        ))}
      </div>

      <button onClick={resetGame} className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all">
        <RotateCcw size={18} /> إعادة اللعب
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 2. لعبة الأرقام والحساب السريع (Math Speed Challenge)
// -----------------------------------------------------------------------------
const MathSpeedGame = ({ difficulty = 'medium' }) => {
  const [problem, setProblem] = useState({ num1: 0, num2: 0, op: '+', ans: 0 });
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  
  const initialTimer = difficulty === 'easy' ? 45 : difficulty === 'medium' ? 30 : 15;
  const [timeLeft, setTimeLeft] = useState(initialTimer);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateProblem = () => {
    let ops = ['+', '-'];
    let maxNum = 10;
    if (difficulty === 'medium') {
      ops = ['+', '-', '×'];
      maxNum = 20;
    } else if (difficulty === 'hard') {
      ops = ['+', '-', '×', '÷'];
      maxNum = 50;
    }

    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1 = Math.floor(Math.random() * maxNum) + 1;
    let num2 = Math.floor(Math.random() * (difficulty === 'hard' ? 20 : 10)) + 1;
    
    if (op === '-' && num1 < num2) [num1, num2] = [num2, num1];
    if (op === '÷') {
      num1 = num2 * (Math.floor(Math.random() * 8) + 1); // قسمة بدون باقٍ
    }

    let ans = op === '+' ? num1 + num2 : op === '-' ? num1 - num2 : op === '×' ? num1 * num2 : num1 / num2;
    
    let wrong1 = ans + Math.floor(Math.random() * 4) + 1;
    let wrong2 = Math.max(0, ans - Math.floor(Math.random() * 4) - 1);
    let wrong3 = ans + Math.floor(Math.random() * 8) + 5;
    let opts = Array.from(new Set([ans, wrong1, wrong2, wrong3])).slice(0, 4).sort(() => Math.random() - 0.5);
    while (opts.length < 4) opts.push(ans + opts.length + 2);

    setProblem({ num1, num2, op, ans });
    setOptions(opts);
  };

  useEffect(() => { generateProblem(); }, [difficulty]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(t);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
    }
  }, [timeLeft, isGameOver]);

  const handleChoice = (val) => {
    if (isGameOver) return;
    if (val === problem.ans) {
      const points = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;
      setScore(s => s + points);
      generateProblem();
    } else {
      const penalty = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 5 : 10;
      setScore(s => Math.max(0, s - penalty));
      generateProblem();
    }
  };

  const restartGame = () => {
    setScore(0);
    setTimeLeft(initialTimer);
    setIsGameOver(false);
    generateProblem();
  };

  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="flex justify-between w-full max-w-md bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl font-bold">
        <span className="text-blue-600 dark:text-blue-400">النقاط: {score}</span>
        <span className={timeLeft < 10 ? 'text-red-500 animate-pulse font-black' : 'text-gray-700 dark:text-gray-200'}>الوقت المتبقي: {timeLeft}ث</span>
      </div>

      {!isGameOver ? (
        <>
          <div className="text-4xl md:text-5xl font-black dark:text-white dir-ltr my-4 bg-blue-50 dark:bg-blue-900/30 p-6 rounded-3xl border-2 border-blue-200 dark:border-blue-800 w-full max-w-sm">
            {problem.num1} {problem.op} {problem.num2} = ?
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {options.map((opt, i) => (
              <button key={i} onClick={() => handleChoice(opt)} className="p-5 text-2xl font-black bg-white dark:bg-[#1E1E1E] border-2 border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all dark:text-white">
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 py-8">
          <Trophy size={60} className="text-yellow-400 mx-auto animate-bounce" />
          <h3 className="text-3xl font-black dark:text-white">انتهى الوقت!</h3>
          <p className="text-xl font-bold text-blue-600">مجموع نقاطك النهائي: {score}</p>
          <button onClick={restartGame} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-blue-700 transition-all">إعادة المحاولة</button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3. لعبة مطابقة الذاكرة (Memory Flip Game)
// -----------------------------------------------------------------------------
const MemoryMatchGame = ({ difficulty = 'medium' }) => {
  const allIcons = ['🧠', '⚡', '🚀', '🎯', '💡', '📚', '🏆', '🎨', '🔬', '🔮'];
  
  const cardCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 10;
  const icons = allIcons.slice(0, cardCount);

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  const initGame = () => {
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5).map((icon, id) => ({ id, icon }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  };

  useEffect(() => { initGame(); }, [difficulty]);

  const handleCardClick = (idx) => {
    if (flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setMatched(m => [...m, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const gridCols = difficulty === 'easy' ? 'grid-cols-3' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex justify-between w-full max-w-xs text-sm font-bold text-gray-500">
        <span>المحاولات: {moves}</span>
        <span>المكتشف: {matched.length / 2} / {icons.length}</span>
      </div>

      <div className={`grid ${gridCols} gap-3 w-72 md:w-96`}>
        {cards.map((c, idx) => {
          const isOpen = flipped.includes(idx) || matched.includes(idx);
          return (
            <button key={idx} onClick={() => handleCardClick(idx)} className={`h-20 md:h-24 rounded-2xl text-3xl md:text-4xl flex items-center justify-center transition-all duration-300 transform ${isOpen ? 'bg-blue-600 text-white rotate-0' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300'}`}>
              {isOpen ? c.icon : '❓'}
            </button>
          );
        })}
      </div>

      {matched.length === cards.length && cards.length > 0 && (
        <div className="text-center space-y-2">
          <p className="text-green-600 font-black text-xl">ممتاز! أكملت اللعبة في {moves} حركة! 🎉</p>
          <button onClick={initGame} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl">لعب مرة أخرى</button>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 4. لعبة فك تشفير الكلمات (Word Scramble)
// -----------------------------------------------------------------------------
const WordScrambleGame = ({ difficulty = 'medium' }) => {
  const wordsEasy = [
    { target: 'علم', hint: 'المعرفة والنور' },
    { target: 'ذرة', hint: 'أصغر وحدة في المادة' },
    { target: 'قوة', hint: 'المؤثر الفيزيائي للحركة' },
    { target: 'نور', hint: 'مصدر الإضاءة' }
  ];
  const wordsMedium = [
    { target: 'فيزياء', hint: 'علم دراسة المادة والطاقة' },
    { target: 'خوارزمية', hint: 'خطوات منطقية لحل مشكلة' },
    { target: 'كيمياء', hint: 'علم العناصر والتفاعلات' },
    { target: 'برمجة', hint: 'كتابة الأوامر للحاسوب' }
  ];
  const wordsHard = [
    { target: 'ترانسفورمر', hint: 'نموذج ذكاء اصطناعي حديث' },
    { target: 'سيكولوجيا', hint: 'علم دراسة السلوك والنفس' },
    { target: 'ديناميكا', hint: 'علم الحركة والقوى' },
    { target: 'الترابط الفلكي', hint: 'علاقات الأجرام الفضائية' }
  ];

  const words = difficulty === 'easy' ? wordsEasy : difficulty === 'medium' ? wordsMedium : wordsHard;

  const [wordIdx, setWordIdx] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [guess, setGuess] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadWord = (idx) => {
    const target = words[idx].target;
    const arr = target.split('').sort(() => Math.random() - 0.5);
    setScrambled(arr.join(' '));
    setGuess('');
    setStatusMsg('');
  };

  useEffect(() => { loadWord(0); }, [difficulty]);

  const handleCheck = () => {
    if (guess.trim() === words[wordIdx].target) {
      setStatusMsg('إجابة صحيحة! أحسنت! 🎉');
      setTimeout(() => {
        const next = (wordIdx + 1) % words.length;
        setWordIdx(next);
        loadWord(next);
      }, 1500);
    } else {
      setStatusMsg('إجابة خاطئة، حاول مجدداً ❌');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 text-center max-w-md mx-auto">
      <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-3xl border-2 border-blue-200 dark:border-blue-800 w-full">
        <span className="text-xs font-bold text-blue-600 block mb-2">💡 التلميح: {words[wordIdx]?.hint}</span>
        <div className="text-4xl font-black text-blue-800 dark:text-blue-200 my-4 tracking-widest">{scrambled}</div>
      </div>

      <input 
        type="text" 
        value={guess} 
        onChange={e => setGuess(e.target.value)} 
        onKeyDown={e => e.key === 'Enter' && handleCheck()}
        placeholder="اكتب الكلمة الصحيحة هنا..." 
        className="w-full bg-gray-50 dark:bg-[#121212] border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center font-bold text-lg dark:text-white outline-none focus:border-blue-500" 
      />

      <button onClick={handleCheck} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">تحقق من الإجابة</button>
      {statusMsg && <p className="font-bold text-lg">{statusMsg}</p>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 5. لعبة سودوكو المصغرة (Sudoku Mini 4x4)
// -----------------------------------------------------------------------------
const SudokuMiniGame = ({ difficulty = 'medium' }) => {
  const easyGrid = [
    [1, 2, 3, 0],
    [3, 4, 0, 2],
    [4, 0, 2, 1],
    [0, 1, 4, 3]
  ];
  const mediumGrid = [
    [1, 0, 0, 4],
    [0, 4, 1, 0],
    [0, 3, 2, 0],
    [2, 0, 0, 1]
  ];
  const hardGrid = [
    [0, 0, 3, 0],
    [3, 0, 0, 2],
    [4, 0, 0, 1],
    [0, 1, 0, 0]
  ];

  const solution = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [4, 3, 2, 1],
    [2, 1, 4, 3]
  ];

  const initialGrid = difficulty === 'easy' ? easyGrid : difficulty === 'medium' ? mediumGrid : hardGrid;

  const [grid, setGrid] = useState(initialGrid);
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    setGrid(initialGrid);
    setResultMsg('');
  }, [difficulty]);

  const handleChange = (r, c, val) => {
    const num = parseInt(val) || 0;
    if (num < 0 || num > 4) return;
    const newGrid = grid.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? num : cell));
    setGrid(newGrid);
  };

  const checkSolution = () => {
    const isCorrect = JSON.stringify(grid) === JSON.stringify(solution);
    if (isCorrect) setResultMsg('حل صحيح 100%! إنجاز رائع 🎉');
    else setResultMsg('هناك بعض الأرقام غير الصحيحة، حاول تعديلها! ❌');
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <p className="text-sm font-medium text-gray-500">املأ الأرقام من 1 إلى 4 بدون تكرار في الصف أو العمود.</p>
      
      <div className="grid grid-cols-4 gap-2 bg-gray-300 dark:bg-gray-800 p-3 rounded-2xl border-2 border-gray-400">
        {grid.map((row, r) => row.map((val, c) => {
          const isFixed = initialGrid[r][c] !== 0;
          return (
            <input 
              key={`${r}-${c}`} 
              type="number" 
              disabled={isFixed}
              value={val === 0 ? '' : val} 
              onChange={e => handleChange(r, c, e.target.value)}
              className={`w-14 h-14 text-center text-2xl font-black rounded-xl outline-none transition-all ${isFixed ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-[#121212] text-blue-600 focus:ring-2 focus:ring-blue-500'}`} 
            />
          );
        }))}
      </div>

      <button onClick={checkSolution} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:bg-blue-700">تحقق من الحل</button>
      {resultMsg && <p className="font-bold text-lg">{resultMsg}</p>}
    </div>
  );
};

// -----------------------------------------------------------------------------
// المكون الرئيسي لقسم الترفيه (EntertainmentHub)
// -----------------------------------------------------------------------------
export default function EntertainmentHub() {
  const navigate = useNavigate();

  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  
  const builtInGames = [
    {
      id: 'xo',
      title: '❌⭕ لعبة XO الذكية',
      desc: 'لعبة التفكير الكلاسيكية ضد الذكاء الاصطناعي أو منافسك المحلي.',
      category: 'استراتيجية',
      color: 'from-blue-500 to-indigo-600',
      instructions: [
        'يتناوب اللاعبان في وضع رمز X أو O داخل الشبكة.',
        'الهدف هو تكوين خط مستقيم من 3 رموز متتالية أفقياً أو رأسياً أو قطرياً.',
        'يمكنك اختيار مستوى الصعوبة لتحدي الذكاء الاصطناعي الذكي.'
      ],
      getComponent: (diff) => <XOGame difficulty={diff} />
    },
    {
      id: 'math',
      title: '🔢 الحساب والمطابقة السريعة',
      desc: 'تحدّ سرعتك الرقمية في حل العمليات الحسابية تحت الضغط الزمني.',
      category: 'سرعة ودقة',
      color: 'from-purple-500 to-pink-600',
      instructions: [
        'تظهر معادلة حسابية سريعة مع 4 اختيارات.',
        'اختر الإجابة الصحيحة بسرعة لجمع النقاط قبل انتهاء العداد الزمني.',
        'المستوى الصعب يضيف عمليات ضرب وقسمة وعداداً أسرع.'
      ],
      getComponent: (diff) => <MathSpeedGame difficulty={diff} />
    },
    {
      id: 'memory',
      title: '🃏 مطابقة الذاكرة البصرية',
      desc: 'اختبر قدرتك على تذكر أماكن البطاقات المتطابقة في أقل وقت.',
      category: 'ذاكرة',
      color: 'from-amber-500 to-orange-600',
      instructions: [
        'اضغط على البطاقات لاكتشاف الأشكال المخفية تحتها.',
        'حاول العثور على البطاقتين المتشابهتين متتاليتين لإبقائهما مكشوفتين.',
        'يزداد عدد البطاقات بازدياد مستوى الصعوبة.'
      ],
      getComponent: (diff) => <MemoryMatchGame difficulty={diff} />
    },
    {
      id: 'words',
      title: '🔤 فك تشفير الكلمات',
      desc: 'فك الحروف المبعثرة واكتشف المصطلحات والمفاهيم العلمية.',
      category: 'لغويات',
      color: 'from-emerald-500 to-teal-600',
      instructions: [
        'تظهر حروف الكلمة مبعثرة مع تلميح بسيط لمفهومها.',
        'اكتب الكلمة الصحيحة كاملة في الصندوق المخصص.',
        'المستوى الصعب يتضمن مصطلحات علمية طويلة ومعقدة.'
      ],
      getComponent: (diff) => <WordScrambleGame difficulty={diff} />
    },
    {
      id: 'sudoku',
      title: '🧩 سودوكو المصغرة',
      desc: 'لغز منطقي ممتع لتوزيع الأرقام من 1 إلى 4 بدقة.',
      category: 'منطق',
      color: 'from-cyan-500 to-blue-600',
      instructions: [
        'قم بملء الخانات الفارغة بالأرقام من 1 إلى 4.',
        'يجب ألا يتكرر الرقم نفسه في أي صف أفقي أو عمود رأسي.',
        'المستوى الصعب يترك خانات فارغة أكثر تتطلب تركيزاً أعمق.'
      ],
      getComponent: (diff) => <SudokuMiniGame difficulty={diff} />
    }
  ];

  const [customGames, setCustomGames] = useState(() => {
    const saved = localStorage.getItem('edu_custom_games');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedGameForInfo, setSelectedGameForInfo] = useState(null);
  const [activePlayGame, setActivePlayGame] = useState(null);

  const [isAiCreatorOpen, setIsAiCreatorOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAiGame, setIsGeneratingAiGame] = useState(false);

  const handleStartGameClick = (game) => {
    setSelectedGameForInfo(null);
    setActivePlayGame({
      ...game,
      renderedComponent: game.getComponent ? game.getComponent(selectedDifficulty) : game.component
    });
  };

  const handleCreateAiGame = async () => {
    if (!aiPrompt.trim()) return toast.error("يرجى كتابة وصف اللعبة المراد تصميمها.");
    setIsGeneratingAiGame(true);

    const systemPrompt = `You are an expert HTML5 Game Developer. Generate a SINGLE self-contained HTML file containing HTML, CSS inside <style>, and JS inside <script>.
    Return ONLY valid, pure HTML code (no markdown formatting, no backticks, no markdown codeblocks).
    Requirements:
    - Language of UI: Arabic
    - High quality clean UI with Tailwind or modern CSS
    - Interactive controls, score keeping, and reset functionality
    - Must be fun, educational or brain-teaser related.`;

    try {
      let generatedHtml = await callAzureAI(systemPrompt, [{ role: 'user', content: aiPrompt }], "", false);
      generatedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

      const newGame = {
        id: `custom_${Date.now()}`,
        title: aiPrompt.slice(0, 25) + '...',
        desc: aiPrompt,
        category: 'ذكاء اصطناعي ✨',
        color: 'from-pink-600 to-purple-600',
        instructions: ['هذه لعبة مصممة بالذكاء الاصطناعي خصيصاً لك.', 'استخدم الفأرة أو الأزرار التفاعلية للعب.'],
        isHtml: true,
        htmlCode: generatedHtml
      };

      const updatedList = [newGame, ...customGames];
      setCustomGames(updatedList);
      localStorage.setItem('edu_custom_games', JSON.stringify(updatedList));

      toast.success("تم تصميم اللعبة بالذكاء الاصطناعي بنجاح!");
      setIsAiCreatorOpen(false);
      setAiPrompt('');
      setActivePlayGame(newGame);
    } catch (e) {
      toast.error("فشل تصميم اللعبة بالذكاء الاصطناعي، يرجى المحاولة مجدداً.");
    } finally {
      setIsGeneratingAiGame(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] p-4 md:p-12 transition-colors duration-300 pb-24 md:pb-12" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <ChevronRight className="dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black dark:text-white flex items-center gap-3">
                قسم الترفيه وألعاب الذكاء <Gamepad2 className="text-purple-600" />
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">جدد نشاطك الذهني واستمتع بألعاب الذكاء المصممة بـ 3 مستويات صعوبة لتطوير التفكير المنطقي.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsAiCreatorOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} className="text-yellow-300" /> إضافة لعبة جديدة بالذكاء الاصطناعي
          </button>
        </div>

        {/* Built-in Games Grid */}
        <div>
          <h2 className="text-xl font-black dark:text-white mb-6 flex items-center gap-2">
            <Brain className="text-blue-600" /> الألعاب الـ 5 المعتمدة
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builtInGames.map((game) => (
              <div 
                key={game.id} 
                onClick={() => setSelectedGameForInfo(game)}
                className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:border-purple-500 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className={`h-2.5 w-16 rounded-full bg-gradient-to-r ${game.color} mb-6 group-hover:w-full transition-all duration-500`} />
                  <span className="text-[11px] font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">{game.category}</span>
                  <h3 className="text-2xl font-black dark:text-white mt-3 mb-2">{game.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{game.desc}</p>
                </div>
                
                <div className="mt-8 pt-4 border-t dark:border-gray-800 flex justify-between items-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <span>اختيار الصعوبة واللعب</span>
                  <Play size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom AI Games Section */}
        {customGames.length > 0 && (
          <div className="pt-6">
            <h2 className="text-xl font-black dark:text-white mb-6 flex items-center gap-2">
              <Code2 className="text-pink-600" /> ألعابك المصممة بالذكاء الاصطناعي
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customGames.map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => setSelectedGameForInfo(game)}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-[2rem] p-6 border-2 border-purple-200 dark:border-purple-800/50 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold px-3 py-1 bg-purple-600 text-white rounded-full">ذكاء اصطناعي ✨</span>
                    <h3 className="text-2xl font-black dark:text-white mt-3 mb-2">{game.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{game.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-purple-200 dark:border-purple-800/50 flex justify-between items-center text-purple-600 font-bold text-sm">
                    <span>تشغيل اللعبة الآن</span>
                    <Play size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 1. نافذة التعليمات ومستوى الصعوبة وشرح اللعبة قبل البدء (Instructions Modal) */}
      {/* ----------------------------------------------------------------------- */}
      {selectedGameForInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border dark:border-gray-800 relative text-right">
            
            <button onClick={() => setSelectedGameForInfo(null)} className="absolute top-6 left-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-500 hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 size={36} />
              </div>
              <h3 className="text-2xl font-black dark:text-white">{selectedGameForInfo.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedGameForInfo.desc}</p>
            </div>

            {/* محدد مستوى الصعوبة 3 مستويات */}
            {!selectedGameForInfo.isHtml && (
              <div className="mb-6 bg-gray-50 dark:bg-[#121212] p-3 rounded-2xl border dark:border-gray-800">
                <label className="block text-xs font-bold text-gray-500 mb-2 text-center">اختر مستوى الصعوبة (Difficulty Level):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedDifficulty('easy')} 
                    className={`py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition-all ${selectedDifficulty === 'easy' ? 'bg-green-600 text-white shadow-md ring-2 ring-green-500/50' : 'bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                  >
                    <Shield size={14} /> سهل 🟢
                  </button>

                  <button 
                    onClick={() => setSelectedDifficulty('medium')} 
                    className={`py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition-all ${selectedDifficulty === 'medium' ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/50' : 'bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                  >
                    <Award size={14} /> متوسط 🟡
                  </button>

                  <button 
                    onClick={() => setSelectedDifficulty('hard')} 
                    className={`py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1 transition-all ${selectedDifficulty === 'hard' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-500/50' : 'bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
                  >
                    <Flame size={14} /> صعب 🔴
                  </button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-[#121212] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8 space-y-3">
              <h4 className="font-bold text-sm text-gray-500 flex items-center gap-1.5 mb-2">
                <HelpCircle size={18} className="text-blue-600" /> تعليمات وطريقة اللعب:
              </h4>
              {selectedGameForInfo.instructions.map((inst, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm md:text-base font-medium text-gray-800 dark:text-gray-200">
                  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => handleStartGameClick(selectedGameForInfo)}
                className="w-full md:w-3/4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <Play size={24} className="fill-white" /> ابدأ اللعبة الآن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 2. نافذة اللعب الحية (Active Game Screen Modal) */}
      {/* ----------------------------------------------------------------------- */}
      {activePlayGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-2 md:p-6 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl border dark:border-gray-800 flex flex-col overflow-hidden relative">
            
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#121212]">
              <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                <Gamepad2 className="text-blue-600" /> {activePlayGame.title}
                {!activePlayGame.isHtml && (
                  <span className="text-xs font-bold px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                    مستوى: {selectedDifficulty === 'easy' ? 'سهل 🟢' : selectedDifficulty === 'medium' ? 'متوسط 🟡' : 'صعب 🔴'}
                  </span>
                )}
              </h3>
              <button onClick={() => setActivePlayGame(null)} className="p-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-red-500 hover:text-white rounded-full transition-colors font-bold text-sm flex items-center gap-1">
                إغلاق اللعبة <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
              {activePlayGame.isHtml ? (
                <iframe 
                  title={activePlayGame.title}
                  srcDoc={activePlayGame.htmlCode} 
                  className="w-full h-full border-none rounded-2xl bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full max-w-2xl">
                  {activePlayGame.renderedComponent || activePlayGame.component}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* 3. نافذة تصميم لعبة جديدة بالذكاء الاصطناعي (AI Game Creator Modal) */}
      {/* ----------------------------------------------------------------------- */}
      {isAiCreatorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl border dark:border-gray-800 relative">
            
            <button onClick={() => setIsAiCreatorOpen(false)} className="absolute top-6 left-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-500 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-600 text-white p-3 rounded-2xl"><Sparkles size={24} /></div>
              <div>
                <h3 className="text-2xl font-black dark:text-white">تصميم لعبة جديدة بالـ AI</h3>
                <p className="text-gray-400 text-xs mt-0.5">صف للذكاء الاصطناعي اللعبة التي تحلم بها ليقوم ببرمجتها فوراً.</p>
              </div>
            </div>

            <textarea 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="مثال: صمم لي لعبة تجميع الكلمات الإنجليزية قبل سقوط الحجارة، أو لعبة ذاكرة تفاعلية بالأشكال الملونة..."
              className="w-full h-40 bg-gray-50 dark:bg-[#121212] border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 dark:text-white font-medium outline-none focus:border-purple-500 resize-none shadow-inner mb-6"
            />

            <button 
              onClick={handleCreateAiGame}
              disabled={isGeneratingAiGame}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xl py-5 rounded-2xl shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] flex items-center justify-center gap-3"
            >
              {isGeneratingAiGame ? (
                <><Loader2 size={24} className="animate-spin" /> جاري برمجة اللعبة بالذكاء الاصطناعي...</>
              ) : (
                <><Sparkles size={22} className="text-yellow-300" /> برمجة وتصميم اللعبة الآن</>
              )}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
