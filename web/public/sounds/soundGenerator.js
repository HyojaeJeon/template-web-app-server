// 동적 사운드 생성기 - Web Audio API 사용
// 실제 mp3 파일 대신 브라우저에서 동적으로 사운드 생성

class SoundGenerator {
  constructor() {
    this.audioContext = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playNotification(type = 'default') {
    this.init();
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    switch (type) {
      case 'new-order':
        // 새 주문 알림음 (상승하는 멜로디)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;

      case 'chat':
        // 채팅 알림음 (짧은 비프음)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now); // A5
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'warning':
        // 경고음 (낮은 톤)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, now); // A3
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'success':
        // 성공음 (밝은 멜로디)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(783.99, now + 0.08); // G5
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      default:
        // 기본 알림음
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now); // A4
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }
  }

  // 더 복잡한 알림음을 위한 멜로디 생성
  playMelody(notes, tempo = 120) {
    this.init();
    const noteLength = 60 / tempo;
    let currentTime = this.audioContext.currentTime;

    notes.forEach((note, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, currentTime);
      
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration * noteLength);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + note.duration * noteLength);
      
      currentTime += note.duration * noteLength;
    });
  }

  // Local 스타일 알림음
  playVietnameseNotification() {
    const notes = [
      { freq: 392, duration: 0.25 }, // G4
      { freq: 440, duration: 0.25 }, // A4
      { freq: 494, duration: 0.25 }, // B4
      { freq: 587, duration: 0.5 },  // D5
    ];
    this.playMelody(notes, 180);
  }
}

// 전역 사운드 생성기 인스턴스
window.soundGenerator = new SoundGenerator();

// 사용 예시:
// window.soundGenerator.playNotification('new-order');
// window.soundGenerator.playNotification('chat');
// window.soundGenerator.playVietnameseNotification();