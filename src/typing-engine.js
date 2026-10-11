// The typing engine owns the clock and score. It does not know anything about the page layout.
export class TypingTest {
  constructor({ duration, passage, onUpdate, onComplete, timed = true }) {
    this.duration = duration;
    this.passage = passage;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.timed = timed;
    this.typed = '';
    this.status = 'idle';
    this.startedAt = 0;
    this.timerId = null;
    this.remaining = duration;
  }

  get metrics() {
    const elapsedSeconds = this.status !== 'idle' ? Math.max(1, (Date.now() - this.startedAt) / 1000) : 0;
    const checked = [...this.typed].filter((character, index) => character === this.passage[index]).length;
    const errors = [...this.typed].filter((character, index) => character !== this.passage[index]).length;
    const accuracy = this.typed.length ? Math.round((checked / this.typed.length) * 100) : 100;
    const wpm = elapsedSeconds ? Math.round((checked / 5) / (elapsedSeconds / 60)) : 0;
    return { remaining: this.remaining, wpm, accuracy, errors, checked, typed: this.typed.length };
  }

  start() {
    if (this.status !== 'idle') return;
    this.status = 'running';
    this.startedAt = Date.now();
    this.timerId = window.setInterval(() => {
      this.remaining = Math.max(0, this.duration - Math.floor((Date.now() - this.startedAt) / 1000));
      this.onUpdate(this.metrics);
      if (this.timed && this.remaining === 0) this.finish();
    }, 100);
    this.onUpdate(this.metrics);
  }

  type(value) {
    if (this.status === 'finished') return;
    this.typed = [...value].slice(0, this.passage.length).join('');
    if (this.status === 'idle' && this.typed.length) this.start();
    this.onUpdate(this.metrics);
    if (this.typed.length === this.passage.length) this.finish();
  }

  finish() {
    if (this.status === 'finished') return;
    this.status = 'finished';
    window.clearInterval(this.timerId);
    this.remaining = Math.max(0, this.duration - Math.floor((Date.now() - this.startedAt) / 1000));
    const finalMetrics = this.metrics;
    this.onUpdate(finalMetrics);
    this.onComplete(finalMetrics);
  }

  reset() {
    window.clearInterval(this.timerId);
    this.status = 'idle';
    this.typed = '';
    this.remaining = this.duration;
  }
}
