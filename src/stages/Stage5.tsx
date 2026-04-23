import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MonkeyDialog } from '../components/MonkeyDialog';
import { Button } from '../components/Button';
import { drawWordCloud } from '../utils/canvas';
import { playSuccess, playError } from '../utils/audio';

interface Props {
  wordFreq: Record<string, number>;
  playerName: string;
  onComplete: (score: number, cloudWords: {text: string, count: number}[]) => void;
  onJump?: (stage: number) => void;
}

export const Stage5: React.FC<Props> = ({ wordFreq, playerName, onComplete, onJump }) => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  
  const [inputs, setInputs] = useState<Record<string, string>>({
    '法术': '',
    '金箍棒': '',
    '天宫': '',
    '妖怪': ''
  });
  const [failCount, setFailCount] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [isRequestingAI, setIsRequestingAI] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordSubmit = () => {
    if (passwordValue === "42406") {
      onComplete(score, getFinalWords());
    } else {
      setPasswordError("密码错误，请向老师求助！");
      playError();
    }
  };

  useEffect(() => {
    setTimeout(() => setStep(1), 3000);
  }, []);

  const handleGenerate = () => {
    setScore(20);
    setStep(2);
    setIsGenerating(true);
    playSuccess();
    
    setTimeout(() => {
      if (canvasRef.current) {
        const words = Object.keys(wordFreq).map(k => ({ text: k, count: wordFreq[k] }));
        // Add some more padding words to make cloud look good
        words.push({ text: '金箍棒', count: 12 });
        words.push({ text: '取经', count: 9 });
        words.push({ text: '法术', count: 5 });
        words.push({ text: '芭蕉扇', count: 4 });
        words.push({ text: '花果山', count: 8 });
        words.push({ text: '天宫', count: 7 });
        words.push({ text: '五行山', count: 6 });
        words.push({ text: '观音大士', count: 5 });
        words.push({ text: '西天大雷音寺', count: 4 });
        words.push({ text: '紧箍咒', count: 7 });
        words.push({ text: '白龙马', count: 3 });
        words.push({ text: '牛魔王', count: 5 });
        words.push({ text: '如来佛祖', count: 4 });
        words.push({ text: '筋斗云', count: 6 });
        words.push({ text: '七十二变', count: 5 });
        words.push({ text: '火眼金睛', count: 4 });
        words.push({ text: '齐天大圣', count: 8 });

        const animDuration = drawWordCloud(canvasRef.current, words, 0.7);
        setTimeout(() => setIsGenerating(false), animDuration + 500);
      }
    }, 100); // Wait for canvas to mount
  };

  const requestAIFeedback = async () => {
    setIsRequestingAI(true);
    setStep(3);
    try {
      // WARNING: Hardcoding API keys in frontend code is a security risk.
      const apiKey = "sk-eb65e011c69a4e1cb667eecdfce990a8";
      const model = "deepseek-chat";
      const baseUrl = "https://api.deepseek.com";

      if (!apiKey) throw new Error("API key missing");
      
      const words = Object.keys(wordFreq).map(k => `${k}: ${wordFreq[k]}`).join(', ');
      const prompt = `学生【${playerName}】是四年级小学生，刚刚完成了第一张词云图。词云数据：${words}。请用孙悟空的语气，给出50字以内的鼓励评价，指出词云图反映出的主角信息，并提一个改进建议。不要使用markdown格式发声。`;
      
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: '你是孙悟空风格的语文助教，请用活泼、鼓励的小学生口吻回答，限制在50字以内，不要使用markdown。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.8
        })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "俺老孙觉得你做得太棒了！继续保持！";
      setAiFeedback(text);
    } catch (e) {
      console.error(e);
      setAiFeedback("俺老孙觉得你做得太棒了！最大的词就是主角，下次可以再多加点词！");
    } finally {
      setIsRequestingAI(false);
    }
  };

  const getFinalWords = () => {
     return Object.keys(wordFreq).map(k => ({ text: k, count: wordFreq[k] }));
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto py-8 min-h-[500px]">
      <div className="w-full absolute bottom-10 left-0 px-4 md:px-10 z-20 pointer-events-none">
        <MonkeyDialog 
          text={step === 1 ? "材料都准备好了，现在把刚才统计的数据填进来，我们用数据施法，召唤词云图！" : step === 2 && !isGenerating ? "太炫了！原来《西游记》里出现最多的是俺老孙！" : ""}
          show={step > 0 && step < 3}
        />
        
        {step === 3 && (
          <MonkeyDialog 
             text={isRequestingAI ? "稍等，俺老孙正在用分身法看你的作品..." : aiFeedback}
             show={true}
          />
        )}
      </div>

      <div className="w-full max-w-4xl mt-8 flex flex-col items-center mb-48 z-10 relative">
        <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl p-4 mb-6 w-full max-w-xl">
          <p className="text-sm text-brand-cyan font-bold mb-2">【科学小知识：生成词云图】</p>
          <p className="text-xs text-white/70 leading-relaxed">
            我们把统计出的<b>“词频”</b>数据喂给计算机，计算机就会根据数值的大小来绘制图形。
            数值越大，单词占用的空间就越大。最后，一张色彩缤纷、重点突出的<b>词云图</b>就诞生啦！
          </p>
        </div>

        {/* Step 1: Display stats table */}
        {step === 1 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-glass p-8 rounded-2xl w-full max-w-xl">
             <h3 className="text-2xl font-bold bg-gradient-to-br from-brand-gold to-[#FFF8DC] text-transparent bg-clip-text mb-8 text-center">数字施法阵（词频数据分析）</h3>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center px-4 py-2 border-b border-white/20 text-gray-400 font-bold mb-4">
                   <span>关键词</span>
                   <span>出现频率</span>
                </div>
                
                {Object.keys(wordFreq).map((k, idx) => (
                  <div key={k} className="flex justify-between items-center px-6 py-4 bg-white/5 hover:border-brand-gold/50 rounded-xl border border-white/10 transition-colors">
                     <span className="font-bold text-xl">{k}</span>
                     <div className="flex items-center gap-2">
                       <span className={`text-2xl font-bold ${idx === 0 ? 'text-brand-gold' : 'text-brand-cyan'}`}>
                         {wordFreq[k]}
                       </span>
                       <span className="text-white/60">次</span>
                     </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-8 flex justify-center">
                <Button onClick={handleGenerate} className="w-full py-4 text-lg">
                  ✨ 绘制词云图！
                </Button>
             </div>
          </motion.div>
        )}

        {/* Step 2: Canvas */}
        {step >= 2 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full flex flex-col items-center gap-6">
             <div className="relative w-full max-w-[1200px] h-[510px] md:h-[750px] bg-glass rounded-[24px] border border-brand-gold/30 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-center">
                {/* Magic Circle Animation */}
                <AnimatePresence>
                   {isGenerating && (
                     <motion.div 
                        initial={{ rotate: 0, opacity: 1 }}
                        animate={{ rotate: 360 }}
                        exit={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 3, ease: 'linear' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                     >
                       <div className="w-80 h-80 border-[6px] border-dashed border-brand-gold rounded-full opacity-50 shadow-[0_0_20px_rgba(255,215,0,0.5)]" />
                       <div className="absolute w-60 h-60 border-[4px] border-brand-cyan rounded-full animate-ping opacity-40 shadow-[0_0_20px_rgba(26,188,156,0.5)]" />
                     </motion.div>
                   )}
                </AnimatePresence>
                
                <canvas 
                  ref={canvasRef} 
                  width={window.innerWidth > 1200 ? 1200 : window.innerWidth - 40} 
                  height={window.innerWidth > 768 ? 750 : 510}
                  className="z-10"
                />
             </div>
             
             {!isGenerating && step === 2 && (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 flex flex-col items-center gap-4 w-full">
                  {!showPassword ? (
                    <div className="flex flex-col w-full max-w-[400px] gap-4">
                      <Button onClick={() => setShowPassword(true)} className="w-full px-8 py-4 text-lg bg-gradient-to-r from-brand-cyan to-brand-gold border-none font-bold text-black rounded-xl shadow-[0_4px_20px_rgba(26,188,156,0.3)] hover:shadow-[0_6px_25px_rgba(255,215,0,0.4)] transition-all hover:-translate-y-1">
                        前往第六关：实战演练体验！ →
                      </Button>
                      <Button onClick={() => onJump && onJump(1)} className="w-full px-8 py-4 text-lg bg-black/40 border border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all hover:border-white/40">
                        🔄 再来一次 (回到第一关)
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 bg-black/40 p-6 rounded-2xl border border-white/20 w-[350px]">
                      <p className="text-brand-gold font-bold mb-2">输入令牌秘钥以进入实战演练</p>
                      <input 
                        type="password" 
                        value={passwordValue} 
                        onChange={e => { setPasswordValue(e.target.value); setPasswordError(''); }}
                        className="bg-black/50 border border-brand-cyan/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-gold w-full text-center text-xl tracking-[0.5em]"
                        placeholder="请输入密码"
                      />
                      {passwordError && <p className="text-[#ff8b9d] text-sm font-bold animate-pulse">{passwordError}</p>}
                      <div className="flex gap-3 mt-3 w-full">
                        <Button onClick={() => setShowPassword(false)} className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10 text-sm">返回</Button>
                        <Button onClick={handlePasswordSubmit} className="flex-1 bg-brand-cyan hover:bg-[#5cd6c0] text-black border-none font-bold text-sm">验证</Button>
                      </div>
                    </div>
                  )}
               </motion.div>
             )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
