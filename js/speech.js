/**
 * 使用设备自带的 Web Speech API 朗读普通话，不依赖网络接口。
 * 华为 Pad 浏览器会使用系统中可用的中文语音；若没有中文语音，仍由
 * 浏览器根据 zh-CN 语言标记选择最合适的系统语音。
 */
export function createMandarinSpeaker({
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance
} = {}) {
  return function speak(text) {
    if (!text || !synth || !Utterance) return false;

    const utterance = new Utterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.78;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    const voices = typeof synth.getVoices === 'function' ? synth.getVoices() : [];
    const mandarinVoice = voices.find(voice => /^zh[-_]CN$/i.test(voice.lang))
      || voices.find(voice => /^zh[-_](Hans|SG)/i.test(voice.lang))
      || voices.find(voice => /^zh/i.test(voice.lang));
    if (mandarinVoice) utterance.voice = mandarinVoice;

    // 连续点击时停止上一次朗读，避免多个声音叠在一起。
    synth.cancel();
    synth.speak(utterance);
    return true;
  };
}
